const os = require('os'), path = require('path');
process.env.DB_FILE = path.join(os.tmpdir(), `veriflow-test-${Date.now()}.json`);
process.env.JWT_SECRET = 'test-secret';
const { test, before, after } = require('node:test'), assert = require('node:assert');
const app = require('../src/app');
let server, base;
before(() => new Promise(r => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; r(); }); }));
after(() => server.close());
const call = async (p, o = {}, t) => { const r = await fetch(base + p, { ...o, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: o.body && JSON.stringify(o.body) }); return { s: r.status, b: await r.json() }; };
const login = async (userId, password, role) => call('/auth/login', { method: 'POST', body: { userId, password, role } });

test('health', async () => assert.equal((await call('/health')).s, 200));
test('login ok and no secrets leaked', async () => { const r = await login('admin01', 'Admin@123', 'Admin'); assert.equal(r.s, 200); assert.ok(r.b.token); assert.equal(r.b.user.passwordHash, undefined); });
test('login rejects wrong role and wrong password', async () => {
  assert.equal((await login('user01', 'User@123', 'Admin')).s, 401);
  assert.equal((await login('admin01', 'bad', 'Admin')).s, 401);
});
test('private routes need a token', async () => assert.equal((await call('/records')).s, 401));
test('general user sees only own records and cannot call admin APIs', async () => {
  const t = (await login('user01', 'User@123', 'General User')).b.token;
  const r = await call('/records?pageSize=50', {}, t);
  assert.ok(r.b.total > 0 && r.b.items.every(x => x.assignedTo === 'user01'));
  assert.equal((await call('/users', {}, t)).s, 403);
  assert.equal((await call('/users', { method: 'POST', body: {} }, t)).s, 403);
});
test('admin sees all records, filters and pages', async () => {
  const t = (await login('admin01', 'Admin@123', 'Admin')).b.token;
  assert.equal((await call('/records?pageSize=50', {}, t)).b.total, 42);
  const f = await call('/records?status=Completed&page=1&pageSize=3', {}, t);
  assert.ok(f.b.items.length <= 3 && f.b.items.every(x => x.status === 'Completed'));
});
test('admin manages users; cannot deactivate self', async () => {
  const t = (await login('admin01', 'Admin@123', 'Admin')).b.token;
  const bad = await call('/users', { method: 'POST', body: { userId: 'x' } }, t); assert.equal(bad.s, 400);
  const c = await call('/users', { method: 'POST', body: { userId: 'newbie', fullName: 'New Bie', email: 'n@b.io', department: 'HR', role: 'General User', password: 'Newbie@123' } }, t);
  assert.equal(c.s, 201); assert.equal(c.b.passwordHash, undefined);
  assert.equal((await call('/users/newbie/status', { method: 'PATCH', body: { active: false } }, t)).b.active, false);
  assert.equal((await login('newbie', 'Newbie@123', 'General User')).s, 403);
  assert.equal((await call('/users/admin01/status', { method: 'PATCH', body: { active: false } }, t)).s, 400);
});
test('logout revokes token', async () => {
  const t = (await login('user02', 'User@123', 'General User')).b.token;
  await call('/auth/logout', { method: 'POST' }, t);
  assert.equal((await call('/auth/me', {}, t)).s, 401);
});
test('delay parameter delays the response', async () => {
  const s = Date.now(); await call('/health?delay=400'); assert.ok(Date.now() - s >= 390);
});
