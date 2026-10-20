# 🚀 Anything Door – Food Delivery App

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
