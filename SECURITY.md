# Security Policy

## Supported versions

Security fixes are provided for the latest version of the code on the default branch.

## Reporting a vulnerability

Please **do not** report security vulnerabilities through public GitHub issues.

Preferred:

- Use GitHub’s private vulnerability reporting (Repository → **Security** → **Report a vulnerability**), if enabled.

If private reporting is not available:

- Open a **minimal** public issue that does **not** include exploit details, secrets, or proof-of-concept code, and request a private channel for disclosure.

## What to include

- A clear description of the issue and potential impact
- Steps to reproduce (or a minimal reproduction repo)
- Affected components (frontend/backend) and endpoint(s)
- Any relevant logs (please redact tokens, passwords, and connection strings)

## Secrets and credentials

If you suspect credentials were exposed (e.g., tokens, database URIs, JWT secrets):

- Rotate the credential immediately
- Remove the secret from the codebase and configuration templates
- Consider rewriting git history if a secret was committed

## Authentication abuse protection

- Sign in and sign up endpoints require Google reCAPTCHA v2 verification.
- Backend validates CAPTCHA tokens server-side using `RECAPTCHA_SECRET_KEY`.
- Frontend must provide `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` so users can complete the CAPTCHA challenge before auth requests are sent.

## Coordinated disclosure

We’ll work with you to validate the report and coordinate a fix and disclosure timeline.
