# Style DNA Onboarding (Tier 0)

Deliver the Style DNA multi-step onboarding flow (critical path).

Acceptance criteria:
- Multi-step onboarding UI implemented (6 steps) with animated transitions.
- Zustand store persists transient state across steps and resumes if app backgrounded.
- Image upload integration with signed Cloudinary endpoint.
- POST saves Style Profile to /api/style-profile; server stores Prisma StyleProfile record.
- Completion triggers initial personalized feed generation.

Success metric: >70% completion rate in internal beta (50 users).

