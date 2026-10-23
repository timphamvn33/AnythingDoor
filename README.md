# 🚀 Anything Door – Food Delivery App
(https://anything-door.vercel.app/)

A full-stack food delivery web application inspired by DoorDash. Built using modern technologies with a monolithic architecture and modular design.

---

## 📦 Features

- 🔐 **Authentication & Authorization** (JWT, OAuth)
- 🧾 **User Roles**: Customer, Restaurant Owner, Delivery Driver
- 🛍️ **Browse & Search Restaurants**
- 🧑‍🍳 **Restaurant Management Dashboard**
- 🛒 **Cart & Order Placement**
- 🛵 **Real-time Order Tracking**
- 🔔 **Notifications System**
- 📊 **Admin Panel (optional)**

---

## 🧱 Tech Stack

| Layer          | Tech                                                                         |
| -------------- | ---------------------------------------------------------------------------- |
| **Backend**    | [NestJS](https://nestjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **Database**   | [PostgreSQL](https://www.postgresql.org/), [Prisma](https://www.prisma.io/)  |
| **Auth**       | [Passport.js](http://www.passportjs.org/), JWT, OAuth2 (Google)              |
| **Cache/Jobs** | [Redis](https://redis.io/), [BullMQ](https://docs.bullmq.io/)                |
| **Real-Time**  | [Socket.IO](https://socket.io/)                                              |
| **API Docs**   | Swagger/OpenAPI (optional)                                                   |
| **DevOps**     | Docker, Docker Compose, GitHub Actions (CI/CD), AWS (or local dev)           |

---

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/timphamvn33/AnythingDoor
cd AnythingDoor
```

### 2. Start PostgreSQL

Make sure Docker Desktop is running, then from the repository root start the database:

```powershell
docker compose up -d db
```

### 3. Set up the database

In a PowerShell terminal:

```powershell
cd db
npm install
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/anythingdoor?schema=public"
npx prisma migrate deploy
npx prisma generate
```

### 4. Start the backend

Open a **second PowerShell terminal** in the repository root:

```powershell
cd backend
npm install
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/anythingdoor?schema=public"
npm run start:dev
```

The backend runs at `http://localhost:3000`. Keep this terminal open.

### 5. Start the frontend

Open a **third PowerShell terminal** in the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`) in your browser. The frontend connects to the backend at `http://localhost:3000` by default. Keep the database, backend, and frontend running while using the app.

## Deploy publicly (Vercel + Render + Neon)

This setup hosts the Vite frontend on Vercel, the NestJS API on Render, and PostgreSQL on Neon. You will need the repository pushed to GitHub.

### 1. Create the hosted database

Create a PostgreSQL project in Neon and copy its connection string. Keep it private; it contains database credentials.

### 2. Deploy the backend

In Render, create a new **Blueprint** from this GitHub repository and use the `render.yaml` configuration. Set `DATABASE_URL` to the pooled value and `DATABASE_URL_UNPOOLED` to the direct value from the root `.env.local`; these are secrets, so enter them only in Render's environment settings. The blueprint generates separate JWT secrets, deploys Prisma migrations over the direct connection at startup, and builds the backend.

Wait for the service to finish deploying and copy its public URL, for example `https://anythingdoor-api.onrender.com`.

### 3. Deploy the frontend

In Vercel, import the same GitHub repository and set the project root directory to `frontend`. Vercel should detect Vite; use `npm run build` as the build command and `dist` as the output directory.

Add this environment variable in Vercel's project settings:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/
```

Deploy the frontend and copy its production origin (for example, `https://anything-door.vercel.app/`).

### 4. Allow the frontend to call the API

In Render's environment settings, change `CORS_ORIGIN` from the local development origin to the exact Vercel production origin, with no trailing slash. If you use a custom domain, include it too; separate multiple origins with commas. Save the setting and redeploy the API.

The backend uses the Render-provided `PORT`; the Prisma schema uses the pooled URL for app traffic and the direct URL for migrations. Locally, the NestJS config loads the root `.env.local`. The frontend reads its API URL at build time. If you change `VITE_API_BASE_URL`, redeploy the frontend. Never commit `.env` files or share database/JWT secrets. Free hosting plans may sleep when idle, so the first request can take longer.
