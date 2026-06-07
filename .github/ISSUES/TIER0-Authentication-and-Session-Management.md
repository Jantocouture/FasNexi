# Authentication & Session Management (Tier 0)

Deliver robust authentication with JWT access + refresh tokens and role scaffolding.

Acceptance criteria:
- Register/login endpoints implemented with secure password hashing.
- Access tokens (short-lived) and per-device refresh tokens stored in DB (hashed) with rotation and revocation.
- Middleware to protect API routes and role-based requireRole helper available.
- Client flow to persist refresh token in secure storage (expo-secure-store / AsyncStorage fallback) and auto-refresh access tokens.

Success metric: End-to-end login + refresh flow working in staging with token rotation.

