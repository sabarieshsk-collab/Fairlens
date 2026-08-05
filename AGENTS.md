# AGENTS.md

## Backend

FairLens now uses a Node.js + Express.js + MongoDB Atlas backend under `backend/`.

Key patterns:

- Keep audit business logic in `backend/services/fairnessService.js`.
- Keep API handlers thin in `backend/controllers/auditController.js`.
- Use `MONGODB_URI` and `PORT` from `backend/.env`.
