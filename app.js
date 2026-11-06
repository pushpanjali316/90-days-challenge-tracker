var START=new Date(2026,10,1),TOTAL=90,KEY='challenge90_v1';
var TOPICS=['Arrays','Stacks','Queues','Strings','Binary Search','Linked List','Trees','Other'];
var WTOPIC=['Stacks','Stacks','Queues','Queues','Strings','Strings','Binary Search','Binary Search','Linked List','Linked List','Trees','Trees','Other'];
var PLAN=[
['Week 1','Nov 1-7',['Monotonic stack','Expression evaluation','Stack simulation','Parentheses and nesting','Stack-based design'],['HTML and CSS revision','Complete JS basics','JS + 1st project (basic)']],
['Week 2','Nov 8-14',['Stack + greedy','Recursive stack','Arrays: two pointers'],['JS (digging deeper)']],
['Week 3','Nov 15-21',['Queue patterns','Arrays: sliding window'],['JavaScript']],
['Week 4','Nov 22-28',['Queue patterns','Mixed stack and queue (4/day from Nov 26)'],['JavaScript','JS project (2nd)']],
['Week 5','Nov 29-Dec 5',['Strings I: frequency count, anagrams'],['React: setup, JSX, components, props']],
['Week 6','Dec 6-12',['Strings II: palindromes, substrings'],['React: state, events, useState']],
['Week 7','Dec 13-19',['Binary Search I: basic, first/last, rotated'],['React: useEffect, lists, forms']],
['Week 8','Dec 20-26',['Binary Search II: search on answer','Linked List intro'],['React small project (todo app)']],
['Week 9','Dec 27-Jan 2',['Linked Lists I: reverse, middle, merge'],['React: Router and Context']],
['Week 10','Jan 3-9',['Linked Lists II: cycle, remove nth','Trees intro: traversals'],['React Project 1: plan and build']],
['Week 11','Jan 10-16',['Trees I: height, level order, DFS, diameter'],['React Project 1: finish, API integration']],
['Week 12','Jan 17-23',['Trees II: BST, validate BST, LCA'],['React Project 2 (or polish) and deploy']],
['Week 13','Jan 24-29',['Review and catch-up only'],['Review projects, fix bugs']]];
var GOALS=[
['November','Foundation (exam month)','#2563EB','DSA: Stacks and Queues complete, about 40-50 problems','Web: HTML and CSS quickly, finish JS'],
['December','Build up','#7C3AED','DSA: Strings, Binary Search, start Linked Lists','Web: React basics + one small project'],
['January','Finish strong','#EA580C','DSA: Linked Lists, then Trees','Web: Complete React + 1-2 projects']];
var MS=[['nov-html','Nov: HTML and CSS revised'],['nov-js','Nov: JavaScript completed'],['nov-proj','Nov: 2 JS projects built'],['dec-str','Dec: Strings done'],['dec-bs','Dec: Binary Search done'],['dec-react','Dec: React basics + small project'],['jan-ll','Jan: Linked Lists done'],['jan-tr','Jan: Trees basics done'],['jan-react','Jan: React complete with projects']];
var db={days:{},weeks:{},sub:{},rev:{},ms:{},wm:{},lc:{},sheet:{},sr:{},pn:{},timer:null,lastBackup:0},view='today',cur=new Date(),openW={},openS={},saveFailed=false,lastSig='',just=null,justOpen=null;
try{var raw=localStorage.getItem(KEY);if(raw){var x=JSON.parse(raw);for(var p in x)db[p]=x[p]}}catch(e){saveFailed=true}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
function save(){if(undoPending){undoPending=false;toast(UMSG[undoAct]||'Change saved.')}try{localStorage.setItem(KEY,JSON.stringify(db));saveFailed=false}catch(e){saveFailed=true}if(window.Sync)Sync.changed()}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function key(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function dayNo(d){return Math.round((new Date(d.getFullYear(),d.getMonth(),d.getDate())-START)/864e5)+1}
function newDay(){return{dsa:[],web:[],note:'',rest:false,dsaMin:0,webMin:0}}
function dayOf(k){return db.days[k]||newDay()}
function ensure(k){if(!db.days[k])db.days[k]=newDay();return db.days[k]}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function goal(n){return n<=25?2:4}
function webGoal(n){return n<=25?60:120}
function weekIdx(n){return Math.min(12,Math.max(0,Math.floor((n-1)/7)))}
function done(arr){return (arr||[]).filter(function(t){return t.done}).length}
function doneCount(k){var d=dayOf(k);return done(d.dsa)+done(d.web)}
function kept(k){return doneCount(k)>0||!!dayOf(k).rest}
function fmt(d){return d.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'short',year:'numeric'})}
function allKeys(){var a=[];for(var i=0;i<TOTAL;i++)a.push(key(addDays(START,i)));return a}
function hm(m){return Math.floor(m/60)+'h '+(m%60)+'m'}
function streaks(){
  var now=new Date(),best=0,run=0;
  allKeys().forEach(function(k){if(new Date(k+'T00:00:00')>now)return;if(kept(k)){run++;best=Math.max(best,run)}else run=0});
  var s=0,d=new Date();if(!kept(key(d)))d=addDays(d,-1);
  while(dayNo(d)>=1&&kept(key(d))){s++;d=addDays(d,-1)}
  return{cur:s,best:best};
}
function elapsed(){return db.timer?Math.floor((Date.now()-db.timer.start)/1000):0}
function clock(sec){var m=Math.floor(sec/60),s=sec%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function render(){
  var n=dayNo(new Date());
  document.getElementById('sub').textContent=n<1?'Starts Nov 1, 2026. Get ready!':n>TOTAL?'Challenge complete. Well done!':'Day '+n+' of '+TOTAL+'  |  Finish line: Feb 6, 2027';
  var tabs=['today:Today','plan:Plan','revise:Revise','dash:Stats','backup:Backup'];
  document.getElementById('nav').innerHTML=tabs.map(function(x){var p=x.split(':');return '<button data-view="'+p[0]+'" class="'+(view===p[0]?'on':'')+'">'+p[1]+'</button>'}).join('');
  var h=view==='today'?today():view==='plan'?plan():view==='revise'?revise():view==='dash'?dash():backup();
  if(saveFailed)h='<div class="banner">Your browser is blocking storage, so progress will not be saved. Allow site data or use a normal (not private) window.</div>'+h;
  var app=document.getElementById('app'),sig=view+(view==='today'?key(cur):'');
  app.className=sig!==lastSig?'enter':'';document.getElementById('nav').className=app.className;lastSig=sig;
  app.innerHTML=h;just=null;justOpen=null;
}
function burst(el){
  if(!el||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,cs=['#2563EB','#7C3AED','#EA580C','#10B981','#F59E0B','#EC4899'];
  for(var i=0;i<14;i++){var p=document.createElement('span'),a=Math.PI*2*i/14+Math.random()*.4,d=28+Math.random()*34;
    p.className='burst';p.style.left=x+'px';p.style.top=y+'px';p.style.background=cs[i%cs.length];
    p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');
    if(i%3===0){p.style.borderRadius='2px';p.style.width='6px';p.style.height='10px'}
    document.body.appendChild(p);setTimeout(function(n){n.remove()}.bind(null,p),800)}
}
function rows(list,type,k){
  return list.map(function(t){return '<div class="row'+(t.done?' done':'')+(t.id===just?' just':'')+'"><input type="checkbox" data-act="tick" data-type="'+type+'" data-id="'+t.id+'"'+(t.done?' checked':'')+'><span class="t">'+esc(t.t)+'</span>'+(t.d?'<span class="tag '+esc(t.d)+'">'+esc(t.d)+'</span>':'')+(t.topic?'<span class="tag">'+esc(t.topic)+'</span>':'')+(type==='dsa'?'<button class="star" title="Revise later" data-act="rv" data-id="'+t.id+'">'+(t.rv?'&#9733;':'&#9734;')+'</button>':'')+'<button class="x" title="Delete" data-act="del" data-type="'+type+'" data-id="'+t.id+'">&times;</button></div>'}).join('')||'<p class="muted">Nothing added yet.</p>';
}
function chips(list,target,prefix){return list.map(function(t){return '<button class="chip" data-fill="'+target+'" data-v="'+esc(t)+'">'+esc(t)+'</button>'}).join('')}
function today(){
  var k=key(cur),d=dayOf(k),n=dayNo(cur),g=goal(n),wg=webGoal(n),wi=weekIdx(n),w=PLAN[wi],inRange=n>=1&&n<=TOTAL;
  var dn=done(d.dsa),med=d.dsa.filter(function(t){return t.done&&t.d!=='Easy'}).length;
  var need=n>25?'4 problems (2 medium or more) and 2 hours web dev':'2 problems and 1 hour web dev (exam mode)';
  var met=dn>=g&&(n<=25||med>=2)&&d.webMin>=wg;
  var prev=dayOf(key(addDays(cur,-1))),carry=prev.dsa.filter(function(t){return!t.done}).length+prev.web.filter(function(t){return!t.done}).length;
  var out='<div class="date"><button class="btn alt" data-act="prev">&lsaquo;</button><b>'+fmt(cur)+'</b><button class="btn alt" data-act="next">&rsaquo;</button></div><div style="text-align:center;margin-bottom:12px"><button class="btn alt" data-act="now">Go to today</button></div>';
  var started=db.lastBackup||0,hasData=Object.keys(db.days).length>0;
  if(hasData&&Date.now()-started>7*864e5)out+='<div class="banner">It has been over a week since your last backup. <a href="#" data-view="backup">Download one now</a>.</div>';
  if(inRange&&n%7===0)out+='<div class="banner">Last day of '+w[0]+'. Write your weekly review in the Plan tab.</div>';
  if(d.rest)out+='<div class="banner" style="background:#DBEAFE;border-color:#2563EB;color:#1E3A8A">Rest day. Your streak is safe. Enjoy it.</div>';
  if(inRange)out+='<div class="card focus"><b>This week: '+w[0]+'</b><div class="muted">Tap a topic to add it below.</div><div class="chips"><span class="muted">DSA:</span> '+chips(w[2],'dt')+'</div><div class="chips"><span class="muted">Web:</span> '+chips(w[3],'wt')+'</div></div>';
  out+='<div class="card"><b>Daily goal: '+need+'</b><div class="prog"><i style="width:'+Math.min(100,dn/g*100)+'%"></i></div><span class="muted">DSA '+dn+' of '+g+(n>25?' (medium '+med+' of 2)':'')+'</span><div class="prog"><i style="width:'+Math.min(100,d.webMin/wg*100)+'%;background:var(--orange)"></i></div><span class="muted">Web dev '+hm(d.webMin)+' of '+hm(wg)+(met?'. Goal met, great work!':'')+'</span></div>';
  var t=db.timer;
  out+='<div class="card"><h2>Focus timer</h2>'+(t?'<div class="timer" id="tm">'+clock(elapsed())+'</div><p class="muted" style="text-align:center;margin:0">'+(t.mode==='dsa'?'DSA':'Web dev')+' session running</p><div class="tm"><button class="btn red" data-act="stop">Stop and save</button></div>':'<div class="tm"><button class="btn" data-act="start" data-mode="dsa">Start DSA</button><button class="btn" style="background:var(--orange)" data-act="start" data-mode="web">Start Web dev</button></div>')+'<p class="muted" style="text-align:center">Logged today: DSA '+hm(d.dsaMin||0)+', Web '+hm(d.webMin||0)+'. Add manually: <button class="chip" data-act="addmin" data-mode="dsa">+15m DSA</button><button class="chip" data-act="addmin" data-mode="web">+15m Web</button></p></div>';
  out+='<div class="card dsa"><h2>DSA problems</h2>'+rows(d.dsa,'dsa')+'<div class="add"><input type="text" id="dt" placeholder="Problem name or LeetCode number"><select id="dd"><option>Easy</option><option selected>Medium</option><option>Hard</option></select><select id="dp">'+TOPICS.map(function(x){return '<option'+(inRange&&x===WTOPIC[wi]?' selected':'')+'>'+x+'</option>'}).join('')+'</select><button class="btn" data-act="addDsa">Add</button></div>'+(carry?'<div class="add"><button class="chip" data-act="carry">Carry over '+carry+' unfinished from yesterday</button></div>':'')+'</div>';
  out+='<div class="card web"><h2>Web dev topics</h2>'+rows(d.web,'web')+'<div class="add"><input type="text" id="wt" placeholder="e.g. CSS flexbox, JS closures, React props"><button class="btn" data-act="addWeb">Add</button></div></div>';
  out+='<div class="card"><h2>Notes</h2><textarea id="note" placeholder="What I learned, what was hard, what to revise">'+esc(d.note||'')+'</textarea></div>';
  out+='<div style="text-align:center"><button class="btn alt" data-act="rest">'+(d.rest?'Cancel rest day':'Mark as rest day')+'</button></div>';
  return out;
}
function wm(i){if(db.wm[i])return db.wm[i];var P=PLAN[i],o=[];P[2].forEach(function(t,j){o.push({id:'d'+j,t:t,g:'d',done:!!db.sub[i+'-'+j]})});P[3].forEach(function(t,j){o.push({id:'w'+j,t:t,g:'w',done:!!db.sub[i+'-'+(P[2].length+j)]})});return o}
function wmSet(i,v){db.wm[i]=v;save();render()}
function wmHtml(i){var A=wm(i),S=(db.sheet&&db.sheet.secs)||[];
  function grp(g,l){return '<b class="muted">'+l+'</b>'+A.filter(function(x){return x.g===g}).map(function(x){var c=x.s!==undefined&&x.s!==''&&S[x.s];return '<label><input type="checkbox" data-act="wmtick" data-i="'+i+'" data-id="'+x.id+'"'+(mdone(x)?' checked':'')+(c?' disabled':'')+'>'+esc(x.t)+(c?' <span class="muted">('+c.it.filter(lcDone).length+'/'+c.it.length+' from sheet)</span>':'')+' <button class="x" data-act="wmdel" data-i="'+i+'" data-id="'+x.id+'" title="Remove">\u00d7</button></label>'}).join('')}
  return grp('d','DSA')+grp('w','Web dev')+'<div class="add"><input type="text" id="wmt'+i+'" placeholder="Add a milestone for this week"><select id="wmg'+i+'"><option value="d">DSA</option><option value="w">Web dev</option></select>'+(S.length?'<select id="wms'+i+'"><option value="">No sheet link</option>'+S.map(function(c,j){return '<option value="'+j+'">'+esc(c.n)+'</option>'}).join('')+'</select>':'')+'<button class="btn" data-act="wmadd" data-i="'+i+'">Add</button></div><button class="btn alt" data-act="wkdraft" data-i="'+i+'">Draft weekly review</button>'}
var shQ='',shF='all',IV=[1,3,7,14,30];
function topicOf(c){var s=((c.p||'')+' '+c.n).toLowerCase();return /binary search/.test(s)?'Binary Search':/stack/.test(s)?'Stacks':/queue/.test(s)?'Queues':/string/.test(s)?'Strings':/linked/.test(s)?'Linked List':/tree/.test(s)?'Trees':/array|hash|pointer|prefix|window|kadane|interval|matrix|sort|index/.test(s)?'Arrays':'Other'}
function lcSet(k,v){db.lc[k]=!!v;if(v){if(!db.sr[k])db.sr[k]={s:0,d:key(addDays(new Date(),IV[0]))}}else delete db.sr[k]}
function mdone(x){var c=x.s!==undefined&&x.s!==''&&db.sheet&&db.sheet.secs&&db.sheet.secs[x.s];return c?c.it.every(lcDone):!!x.done}
function pass(p){var d=lcDone(p);if(shF==='todo'&&d)return false;if(shF==='done'&&!d)return false;if(/^(Easy|Medium|Hard)$/.test(shF)&&p[2]!==shF)return false;if(shQ&&(p[0]+' '+p[1]).toLowerCase().indexOf(shQ)<0)return false;return true}
function findP(k){var s=db.sheet.secs;for(var a=0;a<s.length;a++)for(var b=0;b<s[a].it.length;b++)if(lcKey(s[a].it[b])===k)return s[a].it[b];return null}
function pRow(si,p,pi){return '<label><input type="checkbox" data-act="lc" data-k="'+esc(lcKey(p))+'"'+(lcDone(p)?' checked':'')+'><span class="t">'+(p[0]!=='-'?'#'+p[0]+' ':'')+esc(p[1])+'</span> <span class="tag '+p[2]+'">'+p[2]+'</span> <a class="muted" target="_blank" rel="noopener" href="https://leetcode.com/problemset/?search='+encodeURIComponent(p[0]!=='-'?p[0]:p[1])+'" title="Search on LeetCode">\u2197</a> <button class="chip" data-act="lcadd" data-si="'+si+'" data-pi="'+pi+'">+ Today</button> <button class="chip" data-act="pnote" data-k="'+esc(lcKey(p))+'">Note</button>'+(lcDone(p)?' <button class="chip" data-act="plog" data-k="'+esc(lcKey(p))+'">Log</button>':'')+(db.pn[lcKey(p)]?'<div class="muted">'+esc(db.pn[lcKey(p)])+'</div>':'')+'</label>'}
function lcKey(p){return p[0]!=='-'?p[0]:p[1]}
function lcDone(p){var k=lcKey(p);return db.lc.hasOwnProperty(k)?!!db.lc[k]:!!p[3]}
function parseSheet(txt){var secs=[],c=null,pt='';txt.split(/\r?\n/).forEach(function(l){var m=l.match(/^\s*\d+\s+(\d+|-)\s+(.+?)\s+(Easy|Medium|Hard)\s+(Done|To do)/i);
  if(m){if(!c){c={n:'Problems',it:[]};secs.push(c)}c.it.push([m[1],m[2].trim(),m[3][0].toUpperCase()+m[3].slice(1).toLowerCase(),/^done/i.test(m[4])?1:0])}
  else if(/^\s*part\b/i.test(l)){pt=l.replace(/^\s*part\s*\d*\s*:?\s*/i,'').trim()}
  else if(l.trim()&&!/^\s*step\b/i.test(l)){c={n:l.trim(),p:pt,it:[]};secs.push(c)}});return secs.filter(function(s){return s.it.length})}
function sheet(){var s=db.sheet;
  if(!s||!s.secs||!s.secs.length)return '<div class="card"><h2>Problem sheet</h2><span class="muted">Paste your pattern-wise sheet (rows like: 1  682  Baseball Game  Easy  Done) and load it. It is saved as data, not code, so you can replace it any time.</span><textarea id="shp" placeholder="Paste the sheet here"></textarea><div class="add"><button class="btn" data-act="shload">Load sheet</button></div></div>';
  var tot=0,dn=0,tk=key(new Date());s.secs.forEach(function(c){c.it.forEach(function(p){tot++;if(lcDone(p))dn++})});
  var h='<div class="card"><h2>Problem sheet</h2><b>'+dn+' of '+tot+' solved</b><div class="prog"><i style="width:'+(dn/tot*100)+'%"></i></div>';
  var due=Object.keys(db.sr).filter(function(k){return db.sr[k].d<=tk&&findP(k)}).sort(function(a,b){var x=db.sr[a],y=db.sr[b];return ((y.h||0)-(x.h||0))||((y.m||0)-(x.m||0))});
  if(due.length)h+='<b class="muted">Revision due ('+due.length+')</b>'+due.slice(0,6).map(function(k){var p=findP(k);return '<div class="row"><span class="t">'+(p[0]!=='-'?'#'+p[0]+' ':'')+esc(p[1])+'</span>'+meta(k)+'<button class="chip" data-act="srg" data-k="'+esc(k)+'" data-r="e">Easy</button><button class="chip" data-act="srg" data-k="'+esc(k)+'" data-r="h">Hard</button><button class="chip" data-act="srg" data-k="'+esc(k)+'" data-r="f">Forgot</button></div>'}).join('');
  var lk=wm(Math.max(0,weekIdx(dayNo(new Date())))).filter(function(x){return x.s!==undefined&&x.s!==''&&s.secs[x.s]&&!mdone(x)})[0],s0=lk?+lk.s:-1;
  if(s0<0)s.secs.some(function(c,j){if(c.it.some(function(p){return !lcDone(p)})){s0=j;return true}});
  if(s0>=0){var nx=[];s.secs[s0].it.forEach(function(p,pi){if(!lcDone(p)&&nx.length<3)nx.push(pRow(s0,p,pi))});h+='<b class="muted">Next up: '+esc(s.secs[s0].n)+'</b><div class="sub">'+nx.join('')+'</div>'}
  var ps=s.secs.map(function(c){return {n:c.n,p:Math.round(c.it.filter(lcDone).length/c.it.length*100),f:c.it.reduce(function(a,p){var r=db.sr[lcKey(p)];return a+(r&&r.f||0)},0)}}).sort(function(a,b){return a.p-b.p}).slice(0,3);
  h+='<b class="muted">Weakest patterns</b>'+ps.map(function(x){return '<div class="muted">'+esc(x.n)+': '+x.p+'% solved'+(x.f?', forgot '+x.f+'x':'')+'</div>'}).join('');
  h+='<div class="add"><input type="text" id="shq" placeholder="Search problems" value="'+esc(shQ)+'"><select id="shf">'+[['all','All'],['todo','To do'],['done','Done'],['Easy','Easy'],['Medium','Medium'],['Hard','Hard']].map(function(o){return '<option value="'+o[0]+'"'+(shF===o[0]?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select></div>';
  var fl=shQ||shF!=='all';
  h+=s.secs.map(function(c,si){var its=[];c.it.forEach(function(p,pi){if(pass(p))its.push(pRow(si,p,pi))});if(fl&&!its.length)return '';var open=fl||!!openS[si];
    return '<div class="wkh'+(open?' open':'')+'" data-act="opens" data-i="'+si+'"><div><b>'+esc(c.n)+'</b> <span class="muted">'+c.it.filter(lcDone).length+'/'+c.it.length+'</span></div></div>'+(open?'<div class="sub">'+its.join('')+'</div>':'')}).join('');
  return h+'<div class="add"><input type="text" id="apn" placeholder="Add your own: 123 Problem name"><select id="apd"><option>Easy</option><option selected>Medium</option><option>Hard</option></select><select id="aps">'+s.secs.map(function(c,j){return '<option value="'+j+'">'+esc(c.n)+'</option>'}).join('')+'<option value="new">New section...</option></select><button class="btn" data-act="apadd">Add</button></div><div class="add"><button class="btn alt" data-act="shreset">Replace sheet</button></div></div>'}
var UNDO=['del','reset','shreset','wmdel'],UMSG={del:'Task deleted.',reset:'All data reset.',shreset:'Sheet removed.',wmdel:'Milestone removed.'},undoS=null,undoT=null,undoPending=false,undoAct='';
function toast(m){var t=document.getElementById('toast');if(!t)return;t.innerHTML=esc(m)+' <button id="undobtn" type="button">Undo</button>';t.hidden=false;document.getElementById('undobtn').onclick=doUndo;clearTimeout(undoT);undoT=setTimeout(function(){t.hidden=true;undoS=null},8000)}
function doUndo(){if(!undoS)return;var o=JSON.parse(undoS);if((o.epoch||0)!==(db.epoch||0))o.epoch=Date.now();Object.keys(db).forEach(function(k){delete db[k]});for(var k in o)db[k]=o[k];undoS=null;document.getElementById('toast').hidden=true;save();render()}
function meta(k){var e=db.sr[k]||{};return (e.m?'<span class="muted">'+e.m+'m, feel '+e.h+'/5</span> ':'')+(db.pn[k]?'<span class="muted">'+esc(db.pn[k])+'</span> ':'')}
function wkStat(i){var c=[0,0,0],tp={},wd=0,n=0;for(var d=i*7+1;d<=i*7+7;d++){var o=dayOf(key(addDays(START,d-1)));o.dsa.forEach(function(x){if(x.done){n++;c[x.d==='Easy'?0:x.d==='Medium'?1:2]++;tp[x.topic]=1}});o.web.forEach(function(x){if(x.done)wd++})}return {c:c,n:n,wd:wd}}
function report(){var dn=dayNo(new Date());if(dn<1||dn>TOTAL)return '';var s=wkStat(weekIdx(dn)),sun=new Date().getDay()===0,rec=0;
  for(var j=0;j<7;j++)rec+=dayOf(key(addDays(new Date(),-j))).dsa.filter(function(x){return x.done}).length;
  var h='<div class="card"><h2>'+(sun?'Weekly report':'This week so far')+'</h2><div>Solved <b>'+s.n+'</b> ('+s.c[0]+' easy, '+s.c[1]+' medium, '+s.c[2]+' hard). Web tasks done: <b>'+s.wd+'</b></div>';
  if(db.sheet&&db.sheet.secs&&db.sheet.secs.length){var tot=0,dd=0;db.sheet.secs.forEach(function(c){c.it.forEach(function(p){tot++;if(lcDone(p))dd++})});var need=((tot-dd)/Math.max(1,TOTAL-dn+1)),pace=rec/7;h+='<div>Pace: <b>'+pace.toFixed(1)+'/day</b> over the last 7 days. You need <b>'+need.toFixed(1)+'/day</b> to finish the sheet by day '+TOTAL+': <b>'+(pace>=need?'on track':'behind')+'</b>.</div>'}
  return h+'</div>'}
function plan(){
  var c=weekIdx(dayNo(new Date())),started=dayNo(new Date())>=1,dn=Object.keys(db.weeks).filter(function(k){return db.weeks[k]}).length;
  var nov=0;allKeys().forEach(function(k){dayOf(k).dsa.forEach(function(t){if(t.done&&(t.topic==='Stacks'||t.topic==='Queues'))nov++})});
  var out='<div class="mg">'+GOALS.map(function(g){return '<div class="card" style="border-top:6px solid '+g[2]+'"><b style="color:'+g[2]+'">'+g[0]+': '+g[1]+'</b><span class="muted">'+g[3]+'<br>'+g[4]+'</span></div>'}).join('')+'</div>';
  out+='<div class="card"><b>November target: 40-50 stack and queue problems</b><div class="prog"><i style="width:'+Math.min(100,nov/40*100)+'%"></i></div><span class="muted">'+nov+' solved so far (counts problems tagged Stacks or Queues)</span></div>';
  out+='<div class="card"><h2>Milestones</h2>'+MS.map(function(m){return '<label class="wk" style="cursor:pointer"><input type="checkbox" data-act="ms" data-id="'+m[0]+'"'+(db.ms[m[0]]?' checked':'')+'><span>'+m[1]+'</span></label>'}).join('')+'</div>';
  out+='<div class="card"><b>'+dn+' of 13 weeks done</b><div class="prog"><i style="width:'+(dn/13*100)+'%"></i></div></div>';
  out+=report();
  out+=sheet();
  out+=PLAN.map(function(w,i){
    var open=openW[i]!==undefined?openW[i]:(started&&i===c),items=[],A=wm(i),tot=A.length,dd=A.filter(mdone).length;
    var h='<div class="card'+(started&&i===c?' curw':'')+'"><div class="wkh'+(open?' open':'')+'" data-act="openw" data-i="'+i+'"><input type="checkbox" data-act="week" data-i="'+i+'"'+(db.weeks[i]?' checked':'')+'><div><b>'+w[0]+'</b> <span class="muted">'+w[1]+' | '+dd+' of '+tot+' topics</span></div></div>';
    if(open){
      h+='<div class="sub'+(justOpen===i?' unfold':'')+'">'+wmHtml(i)+'<b class="muted">Weekly review: what went well, what to redo, plan for next week</b><textarea data-rev="'+i+'" placeholder="Write 2-3 lines">'+esc(db.rev[i]||'')+'</textarea></div>';
    }
    return h+'</div>';
  }).join('');
  return out;
}
function revise(){
  var items=[],late=[],tk=key(new Date());
  allKeys().forEach(function(k){var d=dayOf(k);d.dsa.forEach(function(t){if(t.rv)items.push({k:k,t:t});if(!t.done&&k<tk)late.push({k:k,t:t})})});
  var r=items.map(function(o){return '<div class="row'+(o.t.rvDone?' done':'')+'"><input type="checkbox" data-act="rvdone" data-k="'+o.k+'" data-id="'+o.t.id+'"'+(o.t.rvDone?' checked':'')+'><span class="t">'+esc(o.t.t)+'</span><span class="tag '+esc(o.t.d)+'">'+esc(o.t.d)+'</span><span class="tag">'+o.k+'</span></div>'}).join('')||'<p class="muted">Tap the star next to a problem on the Today tab to add it here.</p>';
  var l=late.map(function(o){return '<div class="row"><span class="t">'+esc(o.t.t)+'</span><span class="tag">'+o.k+'</span><button class="chip" data-act="moveto" data-k="'+o.k+'" data-id="'+o.t.id+'">Move to today</button></div>'}).join('')||'<p class="muted">Nothing pending. Nice!</p>';
  return '<div class="card dsa"><h2>Revise later</h2>'+r+'</div><div class="card"><h2>Unfinished from earlier days</h2>'+l+'</div>';
}
function bar(label,val,max,color){return '<div class="b"><span>'+esc(label)+'</span><div class="prog"><i style="width:'+(max?val/max*100:0)+'%;background:'+color+'"></i></div><span class="n">'+val+'</span></div>'}
function dash(){
  var keys=allKeys(),dsa=0,web=0,active=0,dm=0,wm=0,rest=0,diff={Easy:0,Medium:0,Hard:0},topic={},weekly=[],i;
  for(i=0;i<13;i++)weekly.push(0);
  keys.forEach(function(k,i){var d=dayOf(k);if(doneCount(k)>0)active++;if(d.rest)rest++;dm+=d.dsaMin||0;wm+=d.webMin||0;
    d.dsa.forEach(function(t){if(t.done){dsa++;diff[t.d]=(diff[t.d]||0)+1;topic[t.topic]=(topic[t.topic]||0)+1;weekly[weekIdx(i+1)]++}});web+=done(d.web)});
  var s=streaks(),n=Math.min(TOTAL,Math.max(0,dayNo(new Date()))),tk=key(new Date());
  var maxT=Math.max.apply(null,TOPICS.map(function(t){return topic[t]||0}).concat([1])),maxW=Math.max.apply(null,weekly.concat([1]));
  var heat=keys.map(function(k,i){var c=doneCount(k),l=c>=6?4:c>=4?3:c>=2?2:c>=1?1:0;
    return '<button style="--i:'+i+'" data-jump="'+k+'" title="Day '+(i+1)+': '+c+' done" class="l'+l+(c===0&&dayOf(k).rest?' rest':'')+(k===tk?' today':'')+(i+1>n?' fut':'')+'"></button>'}).join('');
  var st=[[dsa,'Problems solved'],[web,'Web topics done'],[s.cur,'Day streak'],[s.best,'Best streak'],[active+'/'+n,'Active days'],[n?(dsa/n).toFixed(1):'0','Problems per day'],[hm(dm),'DSA time'],[hm(wm),'Web dev time']];
  return '<div class="stats">'+st.map(function(x){return '<div class="stat"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div>'+
  '<div class="card"><h2>90-day map</h2><div class="heat">'+heat+'</div><p class="muted">Darker green means more tasks done. Blue is a rest day ('+rest+' so far). Tap a square to open that day.</p></div>'+
  '<div class="card bars"><h2>Problems by difficulty</h2>'+bar('Easy',diff.Easy,dsa||1,'#10B981')+bar('Medium',diff.Medium,dsa||1,'#F59E0B')+bar('Hard',diff.Hard,dsa||1,'#EF4444')+'</div>'+
  '<div class="card bars"><h2>Problems by topic</h2>'+TOPICS.map(function(t){return bar(t,topic[t]||0,maxT,'var(--blue)')}).join('')+'</div>'+
  '<div class="card bars"><h2>Problems per week</h2>'+weekly.map(function(v,i){return bar('Week '+(i+1),v,maxW,'var(--purple)')}).join('')+'</div>';
}
function backup(){
  return '<div class="card"><h2>Backup your data</h2><p>Your progress is saved in this browser. Clearing browser data or switching device removes it, so download a backup every week.</p><p class="muted">Last backup: '+(db.lastBackup?new Date(db.lastBackup).toLocaleString():'never')+'</p><button class="btn" data-act="export">Download backup</button> <label class="btn alt" style="display:inline-block">Restore backup<input type="file" id="imp" accept=".json" hidden></label></div>'+
  '<div class="card"><h2>Reset</h2><p class="muted">Deletes everything saved in this browser.</p><button class="btn red" data-act="reset">Erase all data</button></div>';
}
function addMin(mode,m,k){var d=ensure(k);d[mode+'Min']=(d[mode+'Min']||0)+m}
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-view],[data-act],[data-jump],[data-fill]');if(!b)return;
  undoPending=false;if(UNDO.indexOf(b.dataset.act)>=0){undoS=JSON.stringify(db);undoPending=true;undoAct=b.dataset.act}
  if(b.dataset.view){e.preventDefault();view=b.dataset.view;render();return}
  if(b.dataset.jump){cur=new Date(b.dataset.jump+'T00:00:00');view='today';render();window.scrollTo(0,0);return}
  if(b.dataset.fill){var f=document.getElementById(b.dataset.fill);if(f){f.value=b.dataset.v;f.focus()}return}
  var a=b.dataset.act,k=key(cur),d;
  if(e.target.matches('input[type=checkbox]')&&a==='openw')return;
  if(a==='prev'){cur=addDays(cur,-1);render()}
  else if(a==='next'){cur=addDays(cur,1);render()}
  else if(a==='now'){cur=new Date();render()}
  else if(a==='addDsa'){var t=document.getElementById('dt').value.trim();if(!t)return;
    ensure(k).dsa.push({id:uid(),t:t,d:document.getElementById('dd').value,topic:document.getElementById('dp').value,done:false,rv:false});save();render();document.getElementById('dt').focus()}
  else if(a==='addWeb'){var w=document.getElementById('wt').value.trim();if(!w)return;
    ensure(k).web.push({id:uid(),t:w,done:false});save();render();document.getElementById('wt').focus()}
  else if(a==='del'){d=ensure(k);d[b.dataset.type]=d[b.dataset.type].filter(function(t){return t.id!==b.dataset.id});save();render()}
  else if(a==='rv'){ensure(k).dsa.forEach(function(t){if(t.id===b.dataset.id){t.rv=!t.rv;t.rvDone=false}});save();render()}
  else if(a==='rest'){d=ensure(k);d.rest=!d.rest;save();render()}
  else if(a==='carry'){var pk=key(addDays(cur,-1)),pd=dayOf(pk);d=ensure(k);
    pd.dsa.filter(function(t){return!t.done}).forEach(function(t){d.dsa.push({id:uid(),t:t.t,d:t.d,topic:t.topic,done:false,rv:t.rv})});
    pd.web.filter(function(t){return!t.done}).forEach(function(t){d.web.push({id:uid(),t:t.t,done:false})});save();render()}
  else if(a==='moveto'){var src=ensure(b.dataset.k),tk2=key(new Date()),dest=ensure(tk2);
    src.dsa=src.dsa.filter(function(t){if(t.id===b.dataset.id){dest.dsa.push(t);return false}return true});save();render()}
  else if(a==='start'){db.timer={mode:b.dataset.mode,start:Date.now(),k:key(new Date())};save();render()}
  else if(a==='stop'){var m=Math.max(1,Math.round(elapsed()/60));addMin(db.timer.mode,m,db.timer.k);db.timer=null;save();render()}
  else if(a==='addmin'){addMin(b.dataset.mode,15,k);save();render()}
  else if(a==='openw'){var i=+b.dataset.i,c=weekIdx(dayNo(new Date())),cur0=openW[i]!==undefined?openW[i]:(dayNo(new Date())>=1&&i===c);openW[i]=!cur0;if(openW[i])justOpen=i;render()}
  else if(a==='export'){db.lastBackup=Date.now();save();var u=URL.createObjectURL(new Blob([JSON.stringify(db,null,2)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='challenge90-backup-'+key(new Date())+'.json';l.click();URL.revokeObjectURL(u);render()}
  else if(a==='lcadd'){var sc=db.sheet.secs[+b.dataset.si],pp=sc.it[+b.dataset.pi];ensure(k).dsa.push({id:uid(),t:(pp[0]!=='-'?'#'+pp[0]+' ':'')+pp[1],d:pp[2],topic:topicOf(sc),done:false,rv:false,lk:lcKey(pp)});save();b.textContent='Added';b.disabled=true}
  else if(a==='srg'){var e0=db.sr[b.dataset.k];if(!e0)return;var r0=b.dataset.r,t1=key(addDays(new Date(),1));if(r0==='f'){e0.s=0;e0.f=(e0.f||0)+1;e0.d=t1}else if(r0==='h'){e0.d=t1}else{e0.s++;if(e0.s>=IV.length)delete db.sr[b.dataset.k];else e0.d=key(addDays(new Date(),IV[e0.s]))}save();render()}
  else if(a==='wkdraft'){var w2=+b.dataset.i,c2=[0,0,0],tp={},wd=0;for(var n2=w2*7+1;n2<=w2*7+7;n2++){var d2=dayOf(key(addDays(START,n2-1)));d2.dsa.forEach(function(x){if(x.done){c2[x.d==='Easy'?0:x.d==='Medium'?1:2]++;tp[x.topic]=1}});d2.web.forEach(function(x){if(x.done)wd++})}
    var sm='Solved '+(c2[0]+c2[1]+c2[2])+' problems ('+c2[0]+' easy, '+c2[1]+' medium, '+c2[2]+' hard). Topics: '+(Object.keys(tp).join(', ')||'none')+'. Web tasks done: '+wd+'.\nWhat went wrong / what to redo: ';db.rev[w2]=db.rev[w2]?db.rev[w2]+'\n'+sm:sm;save();render()}
  else if(a==='pnote'){var nk=b.dataset.k,nv=prompt('Note for this problem (approach, trick, mistake):',db.pn[nk]||'');if(nv===null)return;if(nv.trim())db.pn[nk]=nv.trim();else delete db.pn[nk];save();render()}
  else if(a==='plog'){var gk=b.dataset.k,lv=prompt('Minutes taken, then how hard it felt 1-5 (example: 25 4):');if(!lv)return;var mm=lv.match(/(\d+)\D+([1-5])/);if(!mm){alert('Use: minutes then 1-5, for example 25 4');return}var en=db.sr[gk]=db.sr[gk]||{s:0,d:key(addDays(new Date(),1))};en.m=+mm[1];en.h=+mm[2];save();render()}
  else if(a==='apadd'){var av=document.getElementById('apn').value.trim();if(!av)return;var am=av.match(/^(\d+)\s+(.+)$/),ap=[am?am[1]:'-',am?am[2]:av,document.getElementById('apd').value,0],as=document.getElementById('aps').value;if(as==='new'){var nn=prompt('New section name:');if(!nn)return;db.sheet.secs.push({n:nn.trim(),p:'',it:[ap]})}else db.sheet.secs[+as].it.push(ap);save();render()}
  else if(a==='wmadd'){var q=+b.dataset.i,v=document.getElementById('wmt'+q).value.trim();if(!v)return;wmSet(q,wm(q).concat([{id:uid(),t:v,g:document.getElementById('wmg'+q).value,s:(document.getElementById('wms'+q)||{value:''}).value,done:false}]))}
  else if(a==='wmdel'){var q2=+b.dataset.i;wmSet(q2,wm(q2).filter(function(x){return x.id!==b.dataset.id}))}
  else if(a==='shload'){var ss=parseSheet(document.getElementById('shp').value);if(!ss.length){alert('No problems found. Paste the table rows (Step, #, Problem, Difficulty, Status).');return}db.sheet={secs:ss};save();render()}
  else if(a==='shreset'){if(confirm('Replace the sheet? Your ticks on it are kept.')){db.sheet={};save();render()}}
  else if(a==='opens'){openS[+b.dataset.i]=!openS[+b.dataset.i];render()}
  else if(a==='reset'){if(confirm('Erase all your progress? This cannot be undone.')){db={days:{},weeks:{},sub:{},rev:{},ms:{},wm:{},lc:{},sheet:{},sr:{},pn:{},timer:null,lastBackup:0,epoch:Date.now()};save();render()}}
});
document.addEventListener('change',function(e){
  var t=e.target,a=t.dataset.act;
  if(t.id==='shf'){shF=t.value;render();return}
  if(t.type==='checkbox'&&t.checked)burst(t);
  if(a==='tick')just=t.dataset.id;
  if(t.id==='imp'&&t.files[0]){var r=new FileReader();r.onload=function(){try{var x=JSON.parse(r.result);if(!x.days)throw 0;if(!confirm('Restore this backup? It replaces ALL data here and on every synced device.'))return;db={days:x.days,weeks:x.weeks||{},sub:x.sub||{},rev:x.rev||{},ms:x.ms||{},wm:x.wm||{},lc:x.lc||{},sheet:x.sheet||{},sr:x.sr||{},pn:x.pn||{},timer:null,lastBackup:x.lastBackup||0,epoch:Date.now()};save();render();alert('Backup restored.')}catch(err){alert('That file is not a valid backup.')}};r.readAsText(t.files[0]);return}
  if(a==='tick'){ensure(key(cur))[t.dataset.type].forEach(function(x){if(x.id===t.dataset.id){x.done=t.checked;if(x.lk)lcSet(x.lk,t.checked)}});save();render()}
  else if(a==='rvdone'){ensure(t.dataset.k).dsa.forEach(function(x){if(x.id===t.dataset.id)x.rvDone=t.checked});save();render()}
  else if(a==='week'){db.weeks[t.dataset.i]=t.checked;save();render()}
  else if(a==='sub'){db.sub[t.dataset.k]=t.checked;save();render()}
  else if(a==='wmtick'){var q3=+t.dataset.i;wmSet(q3,wm(q3).map(function(x){if(x.id===t.dataset.id)x.done=t.checked;return x}))}
  else if(a==='lc'){lcSet(t.dataset.k,t.checked);save();render()}
  else if(a==='ms'){db.ms[t.dataset.id]=t.checked;save();render()}
});
document.addEventListener('input',function(e){
  if(e.target.id==='shq'){shQ=e.target.value.trim().toLowerCase();render();var q9=document.getElementById('shq');q9.focus();q9.setSelectionRange(q9.value.length,q9.value.length);return}
  if(e.target.id==='note'){ensure(key(cur)).note=e.target.value;save()}
  if(e.target.dataset.rev!==undefined){db.rev[e.target.dataset.rev]=e.target.value;save()}
});
document.addEventListener('keydown',function(e){if(e.key==='Enter'){if(e.target.id==='dt')document.querySelector('[data-act=addDsa]').click();if(e.target.id==='wt')document.querySelector('[data-act=addWeb]').click()}});
setInterval(function(){var el=document.getElementById('tm');if(el)el.textContent=clock(elapsed())},1000);
render();
if(window.Sync)Sync.init();
var tk0=key(new Date());function roll(){var n=key(new Date());if(n!==tk0){if(key(cur)===tk0)cur=new Date();tk0=n;render()}}
document.addEventListener('visibilitychange',function(){if(!document.hidden)roll()});setInterval(roll,60000);
try{if(localStorage.getItem('lite'))document.documentElement.classList.add('lite')}catch(e){}
(function(){var lb=document.getElementById('litebtn');if(lb)lb.onclick=function(){var on=document.documentElement.classList.toggle('lite');try{on?localStorage.setItem('lite','1'):localStorage.removeItem('lite')}catch(e){}}})();
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}