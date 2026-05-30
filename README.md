# TT App Web

React + TypeScript web console for the TT App backend. This project mirrors the mobile features and uses the same API and database.

## Requirements

- Node.js 20+ recommended
- TT App backend running and reachable via `VITE_API_BASE_URL`

## Setup

```bash
npm install
```

## Configure

Copy `.env.example` to `.env` and update the API base URL.

```bash
cp .env.example .env
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Notes

- Auth uses JWT from `/api/auth/login`.
- Role-based routing: Admin, Faculty, Student.
