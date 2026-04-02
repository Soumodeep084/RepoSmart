# Contributing to RepoSmart

Thanks for taking the time to contribute.

If you believe you’ve found a security vulnerability, **do not** open a public issue. Please follow [SECURITY.md](SECURITY.md).

## Ways to contribute

- Fix bugs
- Improve documentation
- Add tests (unit/integration)
- Improve UX/accessibility

## Development setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB connection string (Atlas is fine)

### Install dependencies

From the repo root:

```bash
cd server
npm install

cd ../client/smartrepo
npm install
```

### Configure environment variables

Copy `server/.env.example` to `server/.env` and fill values (never commit real secrets):

```bash
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=replace-with-a-long-random-secret
GITHUB_API_BASE=https://api.github.com
GITHUB_API_VERSION=2022-11-28
# Optional
GITHUB_TOKEN=github_pat_or_ghp_token_here

# Required by the frontend (client id is not a secret)
GOOGLE_CLIENT_ID=your_google_oauth_client_id

# Required for password reset emails (Mailtrap SMTP)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_pass

# Optional: Redis cache for /api/repo/analyze
REDIS_URI=redis://default:<password>@<host>:<port>
REDIS_ANALYZE_TTL_SECONDS=3600
```

Optional frontend override: copy `client/smartrepo/.env.example` to `client/smartrepo/.env.local` (or create it) and set:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Running locally

In one terminal:

```bash
cd server
npm start
```

In another terminal:

```bash
cd client/smartrepo
npm run dev
```

App: `http://localhost:3000`

## Code quality

- Run linters before opening a PR:

```bash
cd server
npm run lint

cd ../client/smartrepo
npm run lint
```

- Keep changes small and focused.
- Prefer TypeScript-friendly, type-safe changes on the frontend.

## Pull requests

- Create a feature branch from your default branch.
- Describe **what** changed and **why**.
- Include screenshots/screen recordings for UI changes when helpful.
- Link related issues.

### Commit messages (recommendation)

Conventional Commits are encouraged, e.g.:

- `feat: add xyz`
- `fix: handle abc error`
- `docs: update setup instructions`

## Reporting bugs

When filing a bug report, include:

- What you expected vs what happened
- Steps to reproduce
- Logs / error messages (sanitize secrets)
- Your OS + Node version
