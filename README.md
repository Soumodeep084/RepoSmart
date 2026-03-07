# RepoSmart

RepoSmart is a full-stack app that analyzes GitHub repositories and generates a score, a short summary, and a prioritized improvement roadmap.

- Frontend: Next.js App Router (`client/smartrepo`)
- Backend: Express + MongoDB (`server`)

## Features

- Email/password registration & login (JWT)
- Analyze public GitHub repos by URL (or `owner/repo` shorthand)
- Score breakdown + “what to improve next” roadmap

## Prerequisites

- Node.js 18+ (server uses native `fetch`)
- npm
- A MongoDB connection string (MongoDB Atlas works fine)

## Quickstart (local dev)

### 1) Start the API server

From the repo root:

```bash
cd server
npm install
```

Create `server/.env` (see the template below), then:

```bash
npm start
```

Server runs at `http://localhost:5000` by default.

### 2) Start the web app

In a new terminal (from the repo root):

```bash
cd client/smartrepo
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration

### Backend env (`server/.env`)

RepoSmart loads environment variables from `server/.env`.

```bash
# Server
PORT=5000

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>

# Auth
JWT_SECRET=replace-with-a-long-random-secret

# GitHub API
GITHUB_API_BASE=https://api.github.com
GITHUB_API_VERSION=2022-11-28

# Optional: increases GitHub API rate limits
GITHUB_TOKEN=github_pat_or_ghp_token_here
```

Important:

- Never commit real secrets (tokens/passwords) to git.
- If you ever exposed a token, rotate it immediately.

### Frontend env (optional)

The frontend defaults to `http://localhost:5000` for API calls. To override (deployments, different port), set:

Create `client/smartrepo/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API

Base URL: `http://localhost:5000`

- `POST /api/auth/register`
	- Body: `{ "username": string, "email": string, "password": string }`
	- Returns: `{ id, username, email, token }`
- `POST /api/auth/login`
	- Body: `{ "email": string, "password": string }`
	- Returns: `{ id, username, email, token }`
- `POST /api/repo/analyze`
	- Auth: `Authorization: Bearer <token>`
	- Body: `{ "url": "https://github.com/owner/repo" }`
	- Returns: repository snapshot + score + roadmap

## Scripts

### Frontend (`client/smartrepo`)

```bash
npm run dev
npm run build
npm run start
npm run lint
```

### Backend (`server`)

```bash
npm start
npm run lint
```

## Project structure

- `client/smartrepo/` — Next.js UI
- `server/` — Express API + MongoDB auth + GitHub analysis logic
- `tests/` — manual test notes

## Contributing

See [CONTRIBUTION.md](../../CONTRIBUTION.md).

## Security

See [SECURITY.md](../../SECURITY.md).

## License

See [LICENSE](../../LICENSE).
