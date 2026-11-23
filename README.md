# 🚀 Anything Door – Food Delivery App
(https://anything-door.vercel.app/)

A full-stack food delivery web application inspired by DoorDash. Built using modern technologies with a monolithic architecture and modular design.

---

## 📦 Features

- 🔐 **Authentication & Authorization** (JWT, OAuth)
- 🧾 **User Roles**: Customer, Restaurant Owner, Delivery Driver
- 🛍️ **Browse & Search Restaurants**
- 🧑‍🍳 **Restaurant Management Dashboard**
- 💬 **AI restaurant discovery and owner business assistant** (configure an OpenAI-compatible API)
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
| **Mail**       | nodemailer                                                                   |

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
$env:DATABASE_URL_UNPOOLED = $env:DATABASE_URL
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

### Configure the chatbot (optional)

The chatbot page and buyer/owner workflows are included, but AI replies remain disabled until the backend has an API key. Set these variables in the backend environment (or your private Render environment settings); never add a real key to frontend variables or commit it:

```text
OPENAI_API_KEY=<your-provider-api-key>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_BASE_URL` and `OPENAI_MODEL` are optional; the shown values are the defaults. For another OpenAI-compatible provider, use its API key, base URL ending in `/v1`, and a model name that provider supports. Restart/redeploy the backend after configuring the values. The buyer assistant recommends only matching restaurants and available menu items from the database. The owner assistant drafts a restaurant concept and menu ideas; menu items are not created, and a restaurant is saved only after the owner selects **Approve and create restaurant**.

For Docker Compose, export the variables in PowerShell before starting or rebuilding the backend, for example: `$env:OPENAI_API_KEY = "<your-provider-api-key>"`. Compose forwards these variables to the backend; leave the key unset to keep the chatbot visible but disabled.

### Restaurant discovery with OpenStreetMap

Gettiing overpass key from https://overpass.ch

The landing page can search mapped restaurants near a US address, city and state, or ZIP code. Search live to import listings, then filter by name or cuisine. The default radius is 5 miles; the sidebar accepts 1–25 miles. The search is limited to 500 mapped objects per live request, so use a smaller radius if the page reports that limit. Coverage and cuisine tags depend on OpenStreetMap and may be incomplete.

Live discovery is disabled until you configure **both** of these backend environment variables with services you operate or are licensed to use:

```text
OSM_GEOCODER_URL=https://your-geocoder.example/search
OSM_OVERPASS_URL=https://your-overpass.example/api/interpreter
```

The geocoder must support Nominatim-compatible `search` requests with `jsonv2`, `addressdetails`, and `countrycodes`; the Overpass endpoint must accept POST requests containing a `data` parameter and return Overpass JSON. The service must cover the US. Configure these variables in the backend environment or Render; Docker Compose forwards them when exported before starting the backend. Restart the backend after changes. Do not commit provider credentials. Providers with different authentication or response formats require an adapter.

Address autocomplete on the home and discovery pages uses the Geoapify Address Autocomplete API. Set `GEOAPIFY_API_KEY` in the backend environment, Docker Compose environment, or Render settings; the key is kept server-side. Typing at least three characters sends that partial input to Geoapify for US-only suggestions. Select a suggestion or enter an address, city and state, or ZIP manually. A selected suggestion with valid coordinates skips the separate geocoding request; edited text, missing coordinates, or an expired selection falls back to the configured geocoder. Suggestions carry a signed, 15-minute token containing the selected address and coordinates; it is passed with the search and is not encrypted. Instances must share the same configured `JWT_ACCESS_SECRET` for tokens to work across instances; without it tokens use a process-local key and can fall back to geocoding after restarts or between instances. **Get Started** opens the landing page and starts a live search for that location; refreshing that landing-page navigation repeats the search. A five-digit ZIP or ZIP+4 entered directly is sent to the configured geocoder as a postal-code search. If it does not return the matching ZIP, the backend looks up the five-digit ZIP with Geoapify using `GEOAPIFY_API_KEY`; for ZIP+4 this fallback approximates the center of the five-digit ZIP, not the specific address.

Restaurant cards display Lucide cuisine icons, with a generic store icon when no category matches.

Do **not** use public community instances as an unplanned production backend: [Overpass guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) specifically discourages depending on its public instances for general-user apps. The [public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) has strict app-wide rate limits, identification, caching and privacy requirements, prohibits autocomplete and systematic POI downloads, and restricts LLM-generated usage. Use self-hosted or appropriately licensed services, and configure provider-side quotas/rate limits before public deployment. OpenStreetMap data requires attribution and may impose ODbL share-alike obligations; review the [license](https://www.openstreetmap.org/copyright) for your use.

Pressing **Search live** may send the entered location to the configured geocoder and restaurant data providers; avoid entering a street address if a city or ZIP is sufficient. Identical location and radius searches reuse successful results for five minutes in a bounded, per-backend-process memory cache, and simultaneous identical requests share one provider request. Cached results can be up to five minutes old; failures are not cached. A different radius or a cold/restarted instance triggers another provider search. The cache uses hashed search keys and keeps the returned coordinates and listings in memory; it is not shared across instances. Changing the distance after a search automatically repeats a live search for that location. Results are arranged in up to six responsive columns, with numbered pages and a choice of 5, 10, 12 (default), 20, 40, or all results per page. Changing the page size or filters returns to the first page. The current location and previously searched locations and coordinates are stored in the browser's local storage. **Search saved** uses those coordinates to retrieve previously imported listings without contacting the external services; a successful live search for that location in the same browser is required first. The database stores listings, not the user's search address. Switching regions does not delete old listings. Previously imported listings may be stale; they are not automatically removed if a store closes, and provider coverage may not include all businesses.

Backend logs report discovery timings for geocoding, Overpass, database upserts, nearby lookup, and total live search, plus cache hits and geocoder skips. Timings do not include addresses or coordinates. Use these measurements to identify slow stages; first searches still wait for Overpass and database writes.

Imported listings are separate from partner restaurants and are **discovery only**: no menu, ordering, delivery availability, or prices are implied. Distance is straight-line, not a delivery-zone check. Partner menu items remain separately accessible and are not location-filtered; changing locations does not change an existing cart.

After pulling this feature, apply the database migration with `npx prisma migrate deploy` from `db` using a direct `DATABASE_URL_UNPOOLED`, and regenerate the Prisma client with `npx prisma generate`. To run the discovery backend tests, build the backend and run `node --test test\discovery.test.cjs` from `backend`.

## Deploy publicly (Vercel + Render + Neon)

This setup hosts the Vite frontend on Vercel, the NestJS API on Render, and PostgreSQL on Neon. You will need the repository pushed to GitHub.

### 1. Create the hosted database

Create a PostgreSQL project in Neon and copy its connection string. Keep it private; it contains database credentials.

### 2. Deploy the backend

In Render, create a new **Blueprint** from this GitHub repository and use the `render.yaml` configuration. Set `DATABASE_URL` to the pooled value and `DATABASE_URL_UNPOOLED` to the direct value from the root `.env.local`; these are secrets, so enter them only in Render's environment settings. The blueprint generates separate JWT secrets, deploys Prisma migrations over the direct connection at startup, and builds the backend.

Keep the Render build command from `render.yaml` configured on the service: `start:prod` runs the compiled `backend/dist/main.js`, so a successful build must run before startup. The backend build performs a non-incremental compile to ensure the output is emitted on clean deployments.

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
