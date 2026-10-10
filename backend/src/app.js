require('dotenv').config();
const express = require('express'), cors = require('cors'), bcrypt = require('bcryptjs'), jwt = require('jsonwebtoken'), crypto = require('crypto');
const store = require('./db');
const SECRET = () => process.env.JWT_SECRET || 'dev-only-secret';
const revoked = new Set();
const pub = ({ passwordHash, ...u }) => u;
const err = (res, code, message, details) => res.status(code).json({ error: { message, ...(details ? { details } : {}) } });
const ROLES = ['Admin', 'General User'];

const delay = (req, res, next) => {
  const max = +process.env.MAX_DELAY_MS || 8000, ms = Math.min(Math.max(parseInt(req.query.delay) || 0, 0), max);
  ms ? setTimeout(next, ms) : next();
};
const auth = (req, res, next) => {
  const t = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const p = jwt.verify(t, SECRET());
    if (revoked.has(p.jti)) throw new Error('revoked');
    const u = store.get().users.find(x => x.userId === p.sub);
    if (!u || !u.active) throw new Error('inactive');
    req.user = u; req.jti = p.jti; next();
  } catch { err(res, 401, 'Session is invalid or has expired. Sign in again.'); }
};
const adminOnly = (req, res, next) => req.user.role === 'Admin' ? next() : err(res, 403, 'Admin access is required.');
const scope = u => store.get().records.filter(r => u.role === 'Admin' || r.assignedTo === u.userId);

function validateUser(b, creating) {
  const e = {};
  if (creating && !/^[A-Za-z0-9_]{3,20}$/.test(b.userId || '')) e.userId = '3-20 letters, numbers or underscores.';
  if (!b.fullName || b.fullName.trim().length < 2) e.fullName = 'Enter the full name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email || '')) e.email = 'Enter a valid email.';
  if (!b.department || !b.department.trim()) e.department = 'Enter a department.';
  if (!ROLES.includes(b.role)) e.role = 'Role must be Admin or General User.';
  if (creating && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(b.password || '')) e.password = 'Min 8 characters with an uppercase letter and a number.';
  return e;
}

const app = express();
app.use(cors()); app.use(express.json()); app.use('/api', delay);

app.get('/api/health', (q, r) => r.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/auth/login', async (req, res) => {
  const { userId, password, role } = req.body || {};
  if (!userId || !password || !role) return err(res, 400, 'User ID, password and role are required.');
  const u = store.get().users.find(x => x.userId === userId);
  if (!u || !(await bcrypt.compare(password, u.passwordHash)) || u.role !== role) return err(res, 401, 'Invalid credentials or role.');
  if (!u.active) return err(res, 403, 'This account is deactivated. Contact an administrator.');
  const token = jwt.sign({ sub: u.userId, role: u.role, jti: crypto.randomUUID() }, SECRET(), { expiresIn: '2h' });
  store.log(u.userId, `${u.userId} signed in`);
  res.json({ token, user: pub(u) });
});
app.post('/api/auth/logout', auth, (req, res) => { revoked.add(req.jti); res.json({ message: 'Signed out.' }); });
app.get('/api/auth/me', auth, (req, res) => res.json({ user: pub(req.user) }));

app.get('/api/dashboard/stats', auth, (req, res) => {
  const r = scope(req.user), c = s => r.filter(x => x.status === s).length;
  res.json({ total: r.length, pending: c('Pending'), inProgress: c('In Progress'), completed: c('Completed'), onHold: c('On Hold') });
});
app.get('/api/dashboard/activity', auth, (req, res) =>
  res.json({ items: store.get().activity.filter(a => req.user.role === 'Admin' || a.userId === req.user.userId).slice(0, 8) }));

app.get('/api/records', auth, (req, res) => {
  const { q = '', status, type, sort = 'createdAt', order = 'desc' } = req.query;
  const page = Math.max(+req.query.page || 1, 1), pageSize = Math.min(Math.max(+req.query.pageSize || 8, 1), 50);
  let r = scope(req.user);
  if (q) r = r.filter(x => (x.candidateName + x.id).toLowerCase().includes(String(q).toLowerCase()));
  if (status) r = r.filter(x => x.status === status);
  if (type) r = r.filter(x => x.type === type);
  const k = ['id', 'candidateName', 'department', 'type', 'assignedTo', 'status', 'createdAt', 'updatedAt'].includes(sort) ? sort : 'createdAt';
  r = [...r].sort((a, b) => String(a[k]).localeCompare(String(b[k])) * (order === 'asc' ? 1 : -1));
  res.json({ items: r.slice((page - 1) * pageSize, page * pageSize), total: r.length, page, pageSize });
});
app.get('/api/records/:id', auth, (req, res) => {
  const r = scope(req.user).find(x => x.id === req.params.id);
  r ? res.json(r) : err(res, 404, 'Record not found.');
});

app.get('/api/users', auth, adminOnly, (req, res) => {
  const { q = '', role, active } = req.query;
  let u = store.get().users.map(pub);
  if (q) u = u.filter(x => (x.userId + x.fullName + x.email).toLowerCase().includes(String(q).toLowerCase()));
  if (role) u = u.filter(x => x.role === role);
  if (active !== undefined && active !== '') u = u.filter(x => String(x.active) === String(active));
  res.json({ items: u, total: u.length });
});
app.get('/api/users/:id', auth, adminOnly, (req, res) => {
  const u = store.get().users.find(x => x.userId === req.params.id);
  u ? res.json(pub(u)) : err(res, 404, 'User not found.');
});
app.post('/api/users', auth, adminOnly, async (req, res) => {
  const e = validateUser(req.body, true);
  if (Object.keys(e).length) return err(res, 400, 'Validation failed.', e);
  const d = store.get();
  if (d.users.some(x => x.userId.toLowerCase() === req.body.userId.toLowerCase())) return err(res, 409, 'User ID already exists.');
  const { userId, fullName, email, department, role, password } = req.body;
  const u = { userId, fullName: fullName.trim(), email, department: department.trim(), role, active: true, createdAt: new Date().toISOString(), passwordHash: await bcrypt.hash(password, 10) };
  d.users.push(u); store.save(); store.log(req.user.userId, `${req.user.userId} created user ${userId}`);
  res.status(201).json(pub(u));
});
app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const u = store.get().users.find(x => x.userId === req.params.id);
  if (!u) return err(res, 404, 'User not found.');
  const e = validateUser(req.body, false);
  if (Object.keys(e).length) return err(res, 400, 'Validation failed.', e);
  if (u.userId === req.user.userId && req.body.role !== 'Admin') return err(res, 400, 'You cannot remove your own Admin role.');
  Object.assign(u, { fullName: req.body.fullName.trim(), email: req.body.email, department: req.body.department.trim(), role: req.body.role });
  store.save(); store.log(req.user.userId, `${req.user.userId} updated user ${u.userId}`);
  res.json(pub(u));
});
app.patch('/api/users/:id/status', auth, adminOnly, (req, res) => {
  const u = store.get().users.find(x => x.userId === req.params.id);
  if (!u) return err(res, 404, 'User not found.');
  if (typeof req.body.active !== 'boolean') return err(res, 400, '"active" must be true or false.');
  if (u.userId === req.user.userId && !req.body.active) return err(res, 400, 'You cannot deactivate your own account.');
  u.active = req.body.active; store.save(); store.log(req.user.userId, `${req.user.userId} ${u.active ? 'activated' : 'deactivated'} ${u.userId}`);
  res.json(pub(u));
});
app.use('/api', (q, r) => err(r, 404, 'Endpoint not found.'));
app.use((e, q, res, n) => { console.error(e); err(res, 500, 'Unexpected server error.'); });
module.exports = app;
