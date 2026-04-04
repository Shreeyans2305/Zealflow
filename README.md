## Zealflow

Zealflow is a multi-surface form builder and response platform with a shared FastAPI + Supabase backend and three user experiences:

- Web app for full form building, collaboration, logic, publishing, and response management
- CLI / local mode for private, local-only workflows that use the same backend logic without exposing the experience publicly
- Mobile app for admin access and form operations from Android and iOS devices

The project is organized as a monorepo:

- [backend](backend) — FastAPI API, auth, publishing, collaboration, files, and email handling
- [web](web) — React + Vite builder and public form experience
- [mobile](mobile) — Flutter mobile app

## Product overview

### Web app

The web app is the primary experience. It includes:

- Auth and workspace management
- Form registry and template creation
- Drag-and-drop builder
- Conditional branching and page routing
- Real-time collaboration
- Theme/design editing
- Preview and publish flow
- Response vault and file downloads

### CLI / local mode

The CLI mode is the private, local-only way to work with Zealflow from the terminal or a local environment.

It is meant for:

- Developers who want to run the same backend locally
- Private workflows that should never be exposed publicly
- Fast testing of auth, forms, and API behavior without deploying the web app

This mode uses the same backend and data model as the web app, but is intended for local or terminal-driven usage only.

### Mobile app

The mobile app provides a streamlined admin experience on phones and tablets. It uses the same backend as the web app and supports:

- Authentication
- Form listing and management
- Form creation and editing flows
- Shared backend API access

By default, release builds point to the hosted backend, while debug builds can still use localhost.

## Tech stack

- Backend: FastAPI, Supabase Python client, JWT, bcrypt, SMTP email, WebSockets
- Web: React 19, Vite, Zustand, dnd-kit, Yjs, Tailwind CSS
- Mobile: Flutter, Dart, shared preferences, HTTP client
- Data: Supabase Postgres, Supabase Auth-related tables, Supabase Storage

## Repository structure

```text
backend/
	main.py
	routers/
	services/
	models/

web/
	src/
	public/
	vite.config.js

mobile/
	lib/
	android/
	ios/
	pubspec.yaml
```

## Prerequisites

- Python 3.12+
- Node.js 20+
- Flutter stable
- A Supabase project
- SMTP credentials for verification emails

## Backend setup

1. Go to the backend folder:

```bash
cd backend
```

2. Create and edit your environment file:

```bash
cp .env.example .env
```

3. Fill in the required values:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SECRET_KEY`
- `FRONTEND_URL`
- `VERIFICATION_BASE_URL`
- SMTP settings

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Run the API locally:

```bash
python -m uvicorn main:app --reload
```

Backend health check:

```text
/health
```

## Web setup

1. Go to the web folder:

```bash
cd web
```

2. Install dependencies:

```bash
npm install
```

3. Create a local env file if needed:

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=http://localhost:8000
```

4. Run the web app:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Mobile setup

1. Go to the mobile folder:

```bash
cd mobile
```

2. Get dependencies:

```bash
flutter pub get
```

3. Run locally:

```bash
flutter run
```

4. Override backend URL if needed:

```bash
flutter run --dart-define=ZEALFLOW_API_URL=https://your-backend.example.com
```

## Environment variables

### Backend

Required or commonly used values:

```env
FRONTEND_URL=https://your-frontend-domain
FRONTEND_URLS=https://your-frontend-domain,https://another-domain.example
FRONTEND_ORIGIN_REGEX=https://.*\.vercel\.app
VERIFICATION_BASE_URL=https://your-frontend-domain
SECRET_KEY=replace-with-strong-secret
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=30
ALLOW_DEV_VERIFY_FALLBACK=true

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_KEY=YOUR_SUPABASE_SERVICE_ROLE_OR_ANON_KEY
SUPABASE_STORAGE_BUCKET=form-uploads
MAX_UPLOAD_BYTES=10485760

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USE_SSL=false
SMTP_TIMEOUT_SECONDS=15
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=Zealflow <your-email@gmail.com>

GEMINI_API_KEY=your-gemini-api-key
```

### Web

```env
VITE_API_URL=https://your-backend-domain
VITE_WS_URL=https://your-backend-domain
```

### Mobile

The mobile app can use a dart define at build time:

```bash
--dart-define=ZEALFLOW_API_URL=https://your-backend-domain
```

## Production deployment

### Backend on Render

- Root directory: `backend`
- Build: install Python dependencies
- Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

- Add environment variables from the backend section above
- Set `FRONTEND_URL` to your production web origin
- Set `VERIFICATION_BASE_URL` to the same web origin

### Web on Vercel

- Root directory: `web`
- Build command: `npm run build`
- Output directory: `dist`
- Add environment variables:
	- `VITE_API_URL`
	- `VITE_WS_URL`

The web app includes a Vercel rewrite so client-side routes work on refresh.

### Mobile

- Android/iOS builds should point to the Render backend URL
- Use `ZEALFLOW_API_URL` when building release versions

## Common flows

### Sign up and verification

1. Create an account in the web or mobile app.
2. Check email for the verification link.
3. If SMTP is unavailable and fallback is enabled, use the returned verification URL.
4. Sign in after verification.

### Form collaboration

- Multiple admins can edit the same form in real time
- Collaboration uses the backend WebSocket route and shared schema updates

### Publishing

- Publish creates or republishes the live form version
- Mailing list notifications are sent asynchronously

### Public form preview

- The builder preview opens in the current tab
- A back button returns to the builder

## Troubleshooting

- `403` on login: the account is not verified yet
- `CORS` errors: confirm `FRONTEND_URL` and `FRONTEND_ORIGIN_REGEX` on Render
- `404` on verification link: redeploy web and ensure Vercel rewrites are active
- Email delivery issues: verify SMTP app password, sender address, and host settings
- Mobile cannot reach backend: set `ZEALFLOW_API_URL` to the hosted Render URL

## Notes

- Supabase is required for auth, forms, responses, and storage
- The backend is the source of truth for persistence and collaboration
- The same API powers the web app, CLI/local workflows, and mobile app

## License

Private project. Add licensing details here if needed.