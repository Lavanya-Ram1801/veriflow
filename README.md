# VeriFlow: Trusted Data. Transparent Verification.

Full-stack background-verification management demo. Angular 17 (standalone components, Reactive Forms, RxJS, route guards) plus Node/Express REST API with JWT sessions, bcrypt-hashed passwords, role-based access and a JSON-file store seeded on first run. No cloud services or paid database needed. API latency is simulated locally; there is no real cloud integration.

## Prerequisites
Node.js 18+ (20 or 22 recommended) and npm. Check with `node -v`.

## Run (Windows PowerShell, two terminals)
Terminal 1, backend:
```
cd veriflow\backend
copy .env.example .env
npm install
npm start
```
Terminal 2, frontend:
```
cd veriflow\frontend
npm install
npm start
```
Open http://localhost:4200. The Angular dev server proxies `/api` to http://localhost:3000.

## Demo accounts (local demo only)
| Role | User ID | Password |
|---|---|---|
| Admin | admin01 | Admin@123 |
| General User | user01 | User@123 |
| General User | user02 | User@123 |

The seed data (hashed passwords, 42 records) is created in `backend/data/db.json` on first start. Delete that file to reset.

## Structure
```
backend/src/{app.js,db.js,server.js}   Express routes, middleware, store
backend/tests/api.test.js              node:test API tests
frontend/src/app/core                  models, services, interceptor, guards
frontend/src/app/features              auth, shell, dashboard, verifications, admin
frontend/src/app/shared                logo
```

## API
Responses are JSON; errors look like `{"error":{"message":"...","details":{}}}`. All routes except health and login need `Authorization: Bearer <token>`. Every route accepts `?delay=<ms>` (capped by `MAX_DELAY_MS`, default 8000).

| Method | Path | Access |
|---|---|---|
| GET | /api/health | public |
| POST | /api/auth/login `{userId,password,role}` | public |
| POST | /api/auth/logout | signed in |
| GET | /api/auth/me | signed in |
| GET | /api/dashboard/stats, /api/dashboard/activity | signed in (scoped to role) |
| GET | /api/records?q&status&type&sort&order&page&pageSize | signed in (own records unless Admin) |
| GET | /api/records/:id | signed in (404 if not yours) |
| GET/POST | /api/users | Admin |
| GET/PUT | /api/users/:id | Admin |
| PATCH | /api/users/:id/status `{active}` | Admin |

## How to test
**Role access:** sign in as user01, confirm only records assigned to user01 appear and no "User management" link exists. Visit http://localhost:4200/admin/users: you are redirected to the dashboard. Direct API call with the user token to `GET /api/users` returns 403. Sign in as admin01: all 42 records and the user page are available.

**Simulated delay:** use the "API delay" selector in the top bar (0 to 4000 ms) and reload; skeletons show while the profile, stats, activity and records requests run concurrently (`forkJoin` for the first three, the records table loads on its own). Or call `http://localhost:3000/api/health?delay=2000`.

**Admin user management:** Add user (validation errors show inline), edit, deactivate with confirmation, then try signing in as the deactivated user. The Deactivate button is disabled for your own account and the API also rejects it (400).

**Backend tests:** `cd backend; npm test`

## Manual checklist
- [ ] Login works for both demo accounts; wrong role or password is rejected
- [ ] Logout returns to login; the old token is rejected afterwards
- [ ] Search, status/type filters, sorting, pagination on records
- [ ] Skeletons and retry on error (stop the backend and reload)
- [ ] Admin create, edit, activate and deactivate users
- [ ] Layout on phone width (browser dev tools)

## Troubleshooting
- `ECONNREFUSED` or "Could not reach the server": start the backend first.
- Port 3000 busy: change `PORT` in `backend\.env` and the target in `frontend\proxy.conf.json`.
- `npm install` blocked by PowerShell scripts: run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

## Known limitations
Not yet run end to end (see below). Frontend unit tests are not included. Revoked tokens are kept in memory, so restarting the backend un-revokes them until they expire (2 h). JSON-file storage suits a demo only. Sessions use sessionStorage.

## GitHub submission
```
cd veriflow
git init
git add .
git commit -m "VeriFlow"
git remote add origin <your-repo-url>
git push -u origin main
```
