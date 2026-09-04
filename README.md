# JECA Prep Hub

An original WB JECA MCA-entrance preparation platform with full-length mock simulations, custom practice, source-aware PYQ references, answer review, and persisted exam sessions.

> JECA Prep Hub is an independent preparation resource. It is not affiliated with or endorsed by WBJEEB.

## What is included

- React, TypeScript, Vite, Tailwind v4 and React Router frontend
- Responsive CBT-style exam screen: timer, palette, answer selection, clear, mark for review, submit confirmation, warnings, and mobile drawer
- Browser-persisted active attempt so refreshes and brief offline periods do not lose answers
- Express, TypeScript, JWT, bcrypt, validation, CORS, Helmet, and rate-limited auth endpoints
- Prisma/PostgreSQL schema for users, roles, subjects/topics, question bank, mocks, attempts, answers, bookmarks, mistakes, and configurable test blueprints
- Dedicated server-side scoring service with single-answer, multi-answer, partial-credit, negative-marking, and unattempted cases
- 110 clearly labelled **original practice questions** over all ten requested subjects
- Original UI and branding; no Future Iqra code, assets, branding, or question-bank material

## PYQ policy

The app deliberately contains no copied question text marked `PYQ`. The `/pyq` route contains source-aware paper references for 2017–2025 and a clear warning that an item must be matched to the official paper and answer key before it is imported as an authentic previous-year question. Original questions use the `PRACTICE` badge and source `JECA Prep Hub original practice question bank`.

## Folder structure

```text
frontend/       React application and responsive exam UI
backend/        Express API, middleware, routes, scoring service, tests
shared/         Question/domain types and original seed content
prisma/         PostgreSQL Prisma schema and seed script
```

## Quick start

Requirements: Node 20+ and npm. PostgreSQL is required for the Prisma-backed production repository; the API currently starts with an in-memory development repository so the complete demo workflow is usable without a local database.

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`. Create an account for the API-backed flow, or choose **Explore with local demo data**. The local demo supports the full test → submit → review journey and persists the active exam in `localStorage`.

## Database setup

Set `DATABASE_URL` in `.env`, create a PostgreSQL database, then run:

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend -- --name init
npm run prisma:seed --workspace backend
```

The seed script creates `STUDENT` and `ADMIN` roles, all subjects/topics, and the 110 original questions. The current runtime API intentionally uses the in-memory repository to keep zero-config demos reliable; wire the same routes to Prisma for a deployed environment after migration.

## Environment variables

```dotenv
DATABASE_URL=
JWT_SECRET=
PORT=4000
FRONTEND_URL=http://localhost:5173
```

Always use a long random `JWT_SECRET` in production. It is never exposed to the frontend.

## Scripts

```bash
npm run dev       # API + Vite app
npm run lint      # Type checking for both workspaces
npm run test      # Scoring-service unit tests
npm run build     # Production builds
```

## API surface

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Questions | `GET /api/questions`, `GET /api/questions/:id`, admin-protected create/update/delete |
| PYQ refs | `GET /api/pyq`, `GET /api/pyq/:year` |
| Mocks | `GET /api/mock-tests`, `POST /api/mock-tests/start`, answer/save/submit routes |
| Learner data | `GET /api/attempts`, bookmarks, analytics |
| Admin | `GET /api/admin/overview`, import validation endpoint |

Authenticated requests use `Authorization: Bearer <JWT>`.

## Admin and imports

Set a user role to `ADMIN` in PostgreSQL to enable protected question-management routes. The JSON import validator expects mapped CSV fields including `questionText`, options A–D, correct answers, type, subject/topic, difficulty, marking, source type, and explanation. Malformed batches are rejected rather than partially imported. For authentic PYQ imports, keep the actual year, question number, source, paper section, verified options, and official-answer-key validation in the database record.

## Deployment notes

- Build with `npm run build`; serve `frontend/dist` from a static host and run `backend/dist/server.js` separately.
- Set `FRONTEND_URL` to the actual frontend origin and use HTTPS.
- Use PostgreSQL, enable the Prisma repository, apply migrations, and run the seed command.
- Put images in an S3-compatible or Cloudinary store; only persist safe URLs.
- Use a server-side end timestamp as the source of truth for production expiry and do not treat frontend timers as authoritative.
# jeca_prep
