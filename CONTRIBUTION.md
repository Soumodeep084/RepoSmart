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

Create `server/.env` (never commit real secrets):

```bash
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
JWT_SECRET=replace-with-a-long-random-secret
GITHUB_API_BASE=https://api.github.com
GITHUB_API_VERSION=2022-11-28
# Optional
GITHUB_TOKEN=github_pat_or_ghp_token_here
```

Optional frontend override: create `client/smartrepo/.env.local`:

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
