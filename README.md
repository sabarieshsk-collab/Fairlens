# FairLens

FairLens is a hiring fairness audit dashboard built with React on the frontend and a Node.js + Express.js + MongoDB Atlas backend.

## Stack

- Frontend: React, React Router, Tailwind CSS, PapaParse
- Backend: Node.js, Express.js, Mongoose, MongoDB Atlas, dotenv, cors

## Installation

### Frontend

```bash
npm install
npm start
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Frontend

Set one of these values in your frontend environment file:

```env
REACT_APP_API_URL=http://localhost:5000
VITE_API_URL=http://localhost:5000
```

### Backend

Create `backend/.env` with:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=5000
```

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Add a database user with read/write access.
3. Allow your IP address in Network Access.
4. Copy the connection string into `backend/.env` as `MONGODB_URI`.

## API

- `POST /api/audits`
- `GET /api/audits`
- `GET /api/audits/latest`
- `GET /api/audits/:id`
- `DELETE /api/audits/:id`

## Notes

- The UI layout and navigation remain unchanged.
- Audit history and dashboard data now come from MongoDB.
- The old local audit store has been removed from the app flow.
