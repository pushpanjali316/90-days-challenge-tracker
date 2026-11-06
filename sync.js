/* Cloud sync via Supabase. Local-first: the app always works from localStorage;
   this module signs in, merges with the cloud copy and pushes changes. */
(function () {
  var C = window.SYNC_CONFIG || {}, sb = null, user = null, ch = null;
  var snap = {}, timer = null, busy = false, again = false, tsnap = {}, tday = {}, lastOk = 0;
  var BUCKETS = ['weeks', 'sub', 'rev', 'ms', 'wm', 'lc', 'sheet', 'sr', 'pn'];

  function $(id) { return document.getElementById(id); }
  function val(id) { return $(id).value.trim(); }
  function norm(o) { // stable stringify: jsonb does not keep key order
    return JSON.stringify(o, function (k, v) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        var s = {}; Object.keys(v).sort().forEach(function (x) { s[x] = v[x]; }); return s;
      }
      return v;
    });
  }
  // Items that sync: each day, plus each small bucket (weeks, sub, rev, ms)
  function units(d) {
    var u = {}; for (var k in d.days) u['d:' + k] = d.days[k];
    BUCKETS.forEach(function (b) { u[b] = d[b] || {}; });
    return u;
  }
  function pack(d) {
    return { days: d.days || {}, weeks: d.weeks || {}, sub: d.sub || {}, rev: d.rev || {},
             ms: d.ms || {}, wm: d.wm || {}, lc: d.lc || {}, sheet: d.sheet || {}, sr: d.sr || {}, pn: d.pn || {}, mod: d.mod || {}, epoch: d.epoch || 0 };
  }
  function say(cls, msg) {
    var e = $('syncmsg'); if (e) { e.className = cls; e.textContent = msg; e.onclick = cls === 'err' ? function () { sync(); } : null; }
    var b = $('syncbtn'); if (b) b.textContent = user ? 'Sign out' : 'Sign in';
  }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  // Per-task sync: every task has an id and a ts; deletions leave a tombstone in the day
  function tstr(t) { return JSON.stringify(t, function (n, v) { return n === 'ts' ? undefined : v; }); }
  function eachTask(fn) { for (var k in db.days) ['dsa', 'web'].forEach(function (f) { (db.days[k][f] || []).forEach(function (t) { fn(t, k); }); }); }
  function seedT() { tsnap = {}; tday = {}; eachTask(function (t, k) { tsnap[t.id] = tstr(t); tday[t.id] = k; }); }
  function stampTasks() {
    var seen = {};
    eachTask(function (t, k) {
      seen[t.id] = 1;
      if (tday[t.id] && tday[t.id] !== k && db.days[tday[t.id]]) { var o = db.days[tday[t.id]]; (o.del = o.del || {})[t.id] = Date.now(); }
      if (tsnap[t.id] !== tstr(t)) { tsnap[t.id] = tstr(t); t.ts = Date.now(); }
      tday[t.id] = k;
    });
    for (var id in tsnap) if (!seen[id]) {
      var d = db.days[tday[id]]; if (d) (d.del = d.del || {})[id] = Date.now();
      delete tsnap[id]; delete tday[id];
    }
  }
  function mday(x, y, mx, my) {
    var o = JSON.parse(JSON.stringify(my > mx ? y : x)), dl = {};
    [x.del, y.del].forEach(function (d) { for (var i in d || {}) dl[i] = Math.max(dl[i] || 0, d[i]); });
    ['dsa', 'web'].forEach(function (f) {
      var m = {}, ord = [];
      (o[f] || []).concat(x[f] || [], y[f] || []).forEach(function (t) {
        if (!m[t.id]) ord.push(t.id);
        if (!m[t.id] || (t.ts || 0) > (m[t.id].ts || 0)) m[t.id] = t;
      });
      o[f] = ord.filter(function (i) { return !(dl[i] && dl[i] >= (m[i].ts || 0)); }).map(function (i) { return m[i]; });
    });
    o.del = dl; return o;
  }
  function ticker() {
    var e = $('syncmsg');
    if (lastOk && e && e.className === 'ok') { var m = Math.floor((Date.now() - lastOk) / 60000); e.textContent = 'Synced ' + (m < 1 ? 'just now' : m + ' min ago'); }
  }

  // Called by save(): stamp every item that changed since the last call
  function changed() {
    stampTasks();
    var u = units(db), m = db.mod = db.mod || {};
    for (var k in u) { var s = JSON.stringify(u[k]); if (snap[k] !== s) { snap[k] = s; m[k] = Date.now(); } }
    store();
    if (user) { say('busy', 'Saving...'); clearTimeout(timer); timer = setTimeout(sync, 1000); }
  }

  // Newest edit wins per item. A reset/restore bumps epoch and replaces everything.
  function merge(a, b) {
    var ea = a.epoch || 0, eb = b.epoch || 0;
    if (eb > ea) return pack(b);
    if (ea > eb) return pack(a);
    var out = { days: {}, weeks: {}, sub: {}, rev: {}, ms: {}, wm: {}, lc: {}, sheet: {}, sr: {}, pn: {}, mod: {}, epoch: ea };
    var ua = units(a), ub = units(b), ma = a.mod || {}, mb = b.mod || {};
    Object.keys(ua).concat(Object.keys(ub)).forEach(function (k) {
      var useB = (k in ub) && (!(k in ua) || (mb[k] || 0) > (ma[k] || 0));
      var src = useB ? ub : ua, m = useB ? mb : ma;
      var both = (k in ua) && (k in ub);
      if (k.indexOf('d:') === 0) out.days[k.slice(2)] = both ? mday(ua[k], ub[k], ma[k] || 0, mb[k] || 0) : src[k]; else out[k] = src[k];
      out.mod[k] = both ? Math.max(ma[k] || 0, mb[k] || 0) : (m[k] || 0);
    });
    return out;
  }

  async function sync() {
    if (!user) return;
    if (!navigator.onLine) return say('off', 'Offline - will sync later');
    if (busy) { again = true; return; }
    busy = true; say('busy', 'Syncing...');
    try {
      var r = await sb.from('tracker_data').select('data').eq('user_id', user.id).maybeSingle();
      if (r.error) throw r.error;
      var rem = r.data && r.data.data, before = norm(pack(db));
      var m = rem ? merge(db, rem) : pack(db);
      for (var k in m) db[k] = m[k];
      store();
      var u = units(db); for (var j in u) snap[j] = JSON.stringify(u[j]);
      seedT();
      if (norm(pack(db)) !== before) render();
      if (norm(pack(db)) !== (rem ? norm(pack(rem)) : '')) {
        var w = await sb.from('tracker_data').upsert({ user_id: user.id, data: pack(db), updated_at: new Date().toISOString() });
        if (w.error) throw w.error;
      }
      lastOk = Date.now(); say('ok', 'Synced just now');
    } catch (e) { say('err', 'Sync failed - tap to retry'); }
    busy = false;
    if (again) { again = false; sync(); }
  }

  function live() { // other devices' changes arrive without a refresh
    if (ch) return;
    ch = sb.channel('tracker').on('postgres_changes',
      { event: '*', schema: 'public', table: 'tracker_data', filter: 'user_id=eq.' + user.id }, sync).subscribe();
  }

  function msg(t) { $('amsg').textContent = t; }
  function showAuth() { $('auth').hidden = false; }
  function hideAuth() { $('auth').hidden = true; }
  async function signIn() {
    var e = val('aemail'), p = $('apass').value;
    if (!e || !p) return msg('Enter your email and password.');
    msg('Signing in...');
    var r = await sb.auth.signInWithPassword({ email: e, password: p });
    if (r.error) msg(r.error.message);
  }
  async function signUp() {
    var e = val('aemail'), p = $('apass').value;
    if (!e || p.length < 6) return msg('Enter your email and a password of 6+ characters.');
    msg('Creating account...');
    var r = await sb.auth.signUp({ email: e, password: p });
    if (r.error) msg(r.error.message);
    else if (!r.data.session) msg('Account created. Confirm the email we sent, then sign in.');
  }
  async function forgot() {
    var e = val('aemail'); if (!e) return msg('Enter your email first, then tap Forgot password.');
    var r = await sb.auth.resetPasswordForEmail(e, { redirectTo: location.origin + location.pathname });
    msg(r.error ? r.error.message : 'If that account exists, a reset email is on its way. Open the link, then choose a new password.');
  }
  async function signOut() {
    if (!confirm('Sign out? Your data stays in your cloud account but is removed from this device.')) return;
    await sb.auth.signOut();
    if (ch) { sb.removeChannel(ch); ch = null; }
    var e = { days: {}, weeks: {}, sub: {}, rev: {}, ms: {}, wm: {}, lc: {}, sheet: {}, sr: {}, pn: {}, mod: {}, timer: null, lastBackup: 0, epoch: 0 };
    Object.keys(db).forEach(function (k) { delete db[k]; });
    for (var k in e) db[k] = e[k];
    snap = {}; store(); render();
  }

  function init() {
    var u = units(db), m = db.mod = db.mod || {};
    for (var k in u) { snap[k] = JSON.stringify(u[k]); if (!m[k]) m[k] = 1; } // old data: oldest stamp
    seedT(); setInterval(ticker, 30000);
    $('syncbtn').onclick = function () { user ? signOut() : showAuth(); };
    $('asignin').onclick = function () { if (sb) signIn(); };
    $('asignup').onclick = function () { if (sb) signUp(); };
    $('aforgot').onclick = function () { if (sb) forgot(); };
    $('askip').onclick = function () { localStorage.setItem('sync_skip', '1'); hideAuth(); };
    if (!window.supabase || !C.url) return say('off', 'Sync unavailable');
    sb = window.supabase.createClient(C.url, C.key);
    sb.auth.onAuthStateChange(function (ev, s) {
      if (ev === 'PASSWORD_RECOVERY') setTimeout(function () {
        var p = prompt('Choose a new password (6+ characters)');
        if (p && p.length >= 6) sb.auth.updateUser({ password: p }).then(function (r) { alert(r.error ? r.error.message : 'Password updated.'); });
      }, 0);
      user = s ? s.user : null;
      if (user) { hideAuth(); setTimeout(function () { sync(); live(); }, 0); }
      else say('', 'Not signed in');
    });
    sb.auth.getSession().then(function (r) {
      if (!r.data.session && !localStorage.getItem('sync_skip')) showAuth();
    });
    window.addEventListener('online', sync);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(); });
  }

  window.Sync = { init: init, changed: changed, _merge: merge };
})();