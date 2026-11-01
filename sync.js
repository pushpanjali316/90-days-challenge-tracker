/* Cloud sync via Supabase. Local-first: the app always works from localStorage;
   this module signs in, merges with the cloud copy and pushes changes. */
(function () {
  var C = window.SYNC_CONFIG || {}, sb = null, user = null, ch = null;
  var snap = {}, timer = null, busy = false, again = false;
  var BUCKETS = ['weeks', 'sub', 'rev', 'ms'];

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
             ms: d.ms || {}, mod: d.mod || {}, epoch: d.epoch || 0 };
  }
  function say(cls, msg) {
    var e = $('syncmsg'); if (e) { e.className = cls; e.textContent = msg; }
    var b = $('syncbtn'); if (b) b.textContent = user ? 'Sign out' : 'Sign in';
  }
  function store() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  // Called by save(): stamp every item that changed since the last call
  function changed() {
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
    var out = { days: {}, weeks: {}, sub: {}, rev: {}, ms: {}, mod: {}, epoch: ea };
    var ua = units(a), ub = units(b), ma = a.mod || {}, mb = b.mod || {};
    Object.keys(ua).concat(Object.keys(ub)).forEach(function (k) {
      var useB = (k in ub) && (!(k in ua) || (mb[k] || 0) > (ma[k] || 0));
      var src = useB ? ub : ua, m = useB ? mb : ma;
      if (k.indexOf('d:') === 0) out.days[k.slice(2)] = src[k]; else out[k] = src[k];
      out.mod[k] = m[k] || 0;
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
      if (norm(pack(db)) !== before) render();
      if (norm(pack(db)) !== (rem ? norm(pack(rem)) : '')) {
        var w = await sb.from('tracker_data').upsert({ user_id: user.id, data: pack(db), updated_at: new Date().toISOString() });
        if (w.error) throw w.error;
      }
      say('ok', 'Synced');
    } catch (e) { say('err', 'Sync failed - will retry'); }
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
  async function sendLink() {
    var e = val('aemail'); if (!e) return msg('Enter your email first.');
    msg('Sending...');
    var r = await sb.auth.signInWithOtp({ email: e, options: { emailRedirectTo: location.origin + location.pathname } });
    msg(r.error ? r.error.message : 'Check your email. Open the link, or type the 6-digit code here.');
  }
  async function verify() {
    var r = await sb.auth.verifyOtp({ email: val('aemail'), token: val('acode'), type: 'email' });
    if (r.error) msg(r.error.message);
  }
  async function signOut() {
    await sb.auth.signOut();
    if (ch) { sb.removeChannel(ch); ch = null; }
  }

  function init() {
    var u = units(db), m = db.mod = db.mod || {};
    for (var k in u) { snap[k] = JSON.stringify(u[k]); if (!m[k]) m[k] = 1; } // old data: oldest stamp
    $('syncbtn').onclick = function () { user ? signOut() : showAuth(); };
    $('asend').onclick = function () { if (sb) sendLink(); };
    $('averify').onclick = function () { if (sb) verify(); };
    $('askip').onclick = function () { localStorage.setItem('sync_skip', '1'); hideAuth(); };
    if (!window.supabase || !C.url) return say('off', 'Sync unavailable');
    sb = window.supabase.createClient(C.url, C.key);
    sb.auth.onAuthStateChange(function (ev, s) {
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
