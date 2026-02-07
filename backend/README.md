## Medical Billing Backend (Node.js + Express)

Minimal backend for the single-owner medical shop app.

### Tech stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (single OWNER user)

### Folder structure

- `server.js` - app entry point
- `config/db.js` - MongoDB connection
- `config/seedOwner.js` - creates the single OWNER account if DB is empty
- `models/Owner.js` - Owner schema (`email`, `password`, `role="OWNER"`)
- `controllers/authController.js` - login logic
- `routes/authRoutes.js` - `/login` route, mounted under `/auth` and `/api/auth`
- `middleware/authMiddleware.js` - JWT middleware (for future protected routes)

### Environment variables

Create `backend/.env` (you already have one) based on:

```bash
MONGODB_URI=mongodb://localhost:27017/medical-billing-app
JWT_SECRET=replace-with-strong-secret
PORT=8000

OWNER_EMAIL=owner@medicalshop.com
OWNER_PASSWORD=Owner@12345
```

Notes:

- `seedOwner` first looks for `OWNER_PASSWORD`, then `PASSWORD`. So your existing `PASSWORD` variable will still work.
- On startup, if there are **no** `Owner` documents and both `OWNER_EMAIL` and a password are set, it will create the single OWNER user automatically.

### How login works

- **Endpoint**: `POST /auth/login` or `POST /api/auth/login`
- **Body**:

```json
{
  "email": "owner@medicalshop.com",
  "password": "Owner@12345"
}
```

- **Success response** (`200`):

```json
{
  "access_token": "<jwt-token-here>"
}
```

- **Failure response** (`4xx/5xx`):

```json
{
  "detail": "Invalid email or password"
}
```

This matches the current React Native frontend, which:

- Calls `POST http://<ip>:8000/auth/login`
- Expects `access_token` on success
- Reads `detail` from error JSON on failure

### Running the backend

From the `backend` folder:

```bash
npm install
npm run dev   # or: npm start
```

The server will start on `http://localhost:8000` (or whatever `PORT` you set).

### Connecting from the mobile app

In `src/services/api.js`, the app already uses:

```js
const BASE_URL = "http://10.204.127.231:8000";
```

To test on a real device or emulator:

- Replace `10.204.127.231` with:
  - Your **machine's LAN IP** if testing on a physical device on the same Wi‑Fi, or
  - `http://10.0.2.2:8000` for Android Emulator, or
  - `http://127.0.0.1:8000` for iOS Simulator (if the backend runs on the same machine).

No other frontend changes are required because:

- The backend exposes `POST /auth/login` (matching current code).
- It returns `{ "access_token": "..." }` on success.
- It returns `{ "detail": "..." }` on errors.

