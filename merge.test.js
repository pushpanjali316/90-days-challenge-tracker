// Run with: node tests/merge.test.js
global.window = {}; require('../sync.js');
const merge = window.Sync._merge, ok = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) process.exitCode = 1; };
const B = x => Object.assign({ days: {}, weeks: {}, sub: {}, rev: {}, ms: {}, wm: {}, lc: {}, sheet: {}, sr: {}, pn: {}, cl: {}, cfg: {}, mk: [], dl: {}, mod: {}, epoch: 0 }, x);
let o = merge(B({ lc: { 682: true }, mod: { 'lc:682': 10 } }), B({ lc: { 155: true }, mod: { 'lc:155': 11 } }));
ok('ticks on different problems both survive', o.lc[682] === true && o.lc[155] === true);
o = merge(B({ pn: { 1: 'old' }, mod: { 'pn:1': 5 } }), B({ pn: { 1: 'new' }, mod: { 'pn:1': 9 } }));
ok('newer note wins per problem', o.pn[1] === 'new');
o = merge(B({ sr: { 7: { s: 1 } }, mod: { 'sr:7': 5 } }), B({ dl: { 'sr:7': 8 } }));
ok('deleted revision stays deleted', !('7' in o.sr));
o = merge(B({ sr: { 7: { s: 1 } }, mod: { 'sr:7': 9 } }), B({ dl: { 'sr:7': 8 } }));
ok('edit after delete revives it', '7' in o.sr);
const day = (t, ts, dl) => ({ dsa: t.map((id, i) => ({ id, t: id, ts: ts[i] })), web: [], del: dl || {} });
o = merge(B({ days: { a: day(['x', 'y'], [5, 5]) }, mod: { 'd:a': 9 } }), B({ days: { a: day(['x', 'z'], [8, 6], { y: 7 }) }, mod: { 'd:a': 8 } })).days.a;
ok('tasks merge by id, tombstone removes y', o.dsa.map(t => t.id).join() === 'x,z');
ok('higher epoch replaces everything', Object.keys(merge(B({ epoch: 5, days: { q: day([], []) }, mod: { 'd:q': 1 } }), B({ epoch: 9 })).days).length === 0);
