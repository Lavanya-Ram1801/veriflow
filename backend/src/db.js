const fs = require('fs'), path = require('path'), bcrypt = require('bcryptjs');
const FILE = () => process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');
let db;
function seed() {
  const now = new Date().toISOString();
  const mk = (userId, fullName, email, department, role, pw) => ({ userId, fullName, email, department, role, active: true, createdAt: now, passwordHash: bcrypt.hashSync(pw, 10) });
  const users = [
    mk('admin01', 'Meera Iyer', 'meera.iyer@veriflow.demo', 'Operations', 'Admin', 'Admin@123'),
    mk('user01', 'Arjun Nair', 'arjun.nair@veriflow.demo', 'Employment Checks', 'General User', 'User@123'),
    mk('user02', 'Priya Raman', 'priya.raman@veriflow.demo', 'Education Checks', 'General User', 'User@123')];
  const names = ['Kavya Menon','Rohan Das','Ananya Rao','Vikram Shah','Sneha Pillai','Imran Khan','Divya Joshi','Karthik S','Neha Verma','Sanjay Patel','Lakshmi N','Aditya Bose','Farah Ali','Manoj Kumar','Isha Gupta','Rahul Dev','Tara Singh','Yash Mehta','Pooja Reddy','Nikhil Jain'];
  const types = ['Employment Verification','Education Verification','Identity Verification','Address Verification'];
  const statuses = ['Pending','In Progress','Completed','On Hold'];
  const depts = ['Engineering','Finance','Sales','HR','Legal'];
  const records = Array.from({ length: 42 }, (_, i) => {
    const created = new Date(Date.now() - (i * 2 + 1) * 864e5);
    return { id: 'VF-' + (1001 + i), candidateName: names[i % names.length] + (i >= 20 ? ' Jr' : ''), department: depts[i % 5], type: types[i % 4],
      assignedTo: i % 3 === 2 ? 'user02' : 'user01', status: statuses[(i * 7 + (i >> 2)) % 4], createdAt: created.toISOString(), updatedAt: new Date(created.getTime() + 864e5).toISOString() };
  });
  const activity = records.slice(0, 8).map((r, i) => ({ id: 'A' + i, userId: r.assignedTo, message: `${r.id} (${r.type}) marked ${r.status}`, at: r.updatedAt }));
  return { users, records, activity };
}
function save() { fs.mkdirSync(path.dirname(FILE()), { recursive: true }); fs.writeFileSync(FILE(), JSON.stringify(db, null, 2)); }
function get() { if (!db) { if (fs.existsSync(FILE())) db = JSON.parse(fs.readFileSync(FILE(), 'utf8')); else { db = seed(); save(); } } return db; }
function log(userId, message) { get().activity.unshift({ id: 'A' + Date.now(), userId, message, at: new Date().toISOString() }); db.activity = db.activity.slice(0, 50); save(); }
module.exports = { get, save, log };
