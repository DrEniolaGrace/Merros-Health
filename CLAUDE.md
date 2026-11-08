# Meros project rules
- The full specification is in SPEC.md. Read the relevant section before any task.
- The visual design system is in DESIGN.md. Follow it for every screen and component. It replaces SPEC.md section 12.
- Build only the current phase. Never break working features.
- Synthetic data only. Risk numbers come from tested code, never from the AI model.
- After every completed feature: run tests, update docs/PROGRESS.md, and make a git commit.
- Windows machine. Docker is not available yet: run locally with Node.js and the hosted Neon Postgres database. Keep Dockerfiles and docker-compose.yml ready for later. Production target is Azure (UAE North).
- Write user facing text in both Arabic and English.
