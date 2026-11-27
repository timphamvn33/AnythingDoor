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

### Owner database foundation

The owner migration adds restaurant hours and exceptions, order status history, expenses,
supplies, employees, shifts and breaks, leave requests, and payroll records. Payroll accounts
store a provider reference and optional last four digits, not routing or account numbers.
These tables are a database foundation: owner APIs, authorization, payroll integration,
profit calculations, and status-transition validation are not implemented by this migration.

Restaurant hours use local wall-clock times; set the restaurant's IANA timezone before using
them. A closing time earlier than an opening time represents an overnight interval. Hours
exceptions replace regular hours for their date; a closed exception has no times, and multiple
open intervals can represent a split day. The legacy `openHrs` and `closeHrs` fields remain in
use by existing APIs and are not automatically synchronized with these tables.

Menu availability is represented by `available` and `comingSoon`: true/false is available,
false/false is out of stock, and false/true is coming soon. Both cannot be true. Existing APIs
still use `available`; `comingSoon`, ingredients, and archiving need owner API support.

Orders now have optional `restaurantId`, `submittedAt`, and item-name snapshots. The migration
infers a restaurant only where every existing item still belongs to the same restaurant;
mixed, empty, or orphaned orders remain unassigned. Historical names and submission times are
not guessed. A submitted order must have a restaurant, but item ownership is not enforced by
the database. The current cart/order APIs do not populate snapshots or submission times, split
multi-restaurant carts, enforce restaurant ownership, or maintain status history. Implement
these before using the new fields for owner order processing.

Prices, order totals, and payment amounts migrate from floating point to `Decimal(12,2)`.
PostgreSQL rounds existing values to cents, and values outside the supported range cause the
migration to fail. Back up the database and review existing values and the rounding impact
before deploying. The existing HTTP API continues returning numeric values for compatibility;
new financial calculations should use decimals rather than JavaScript floating-point arithmetic.
The current application assumes USD; currency conversion and accounting are not implemented.

The schema keeps employee pay rates, payroll records, and provider references, but it does not
provide access controls or secure a payroll workflow by itself. Protect these records with
restaurant-scoped authorization and audit logging before exposing them. Hourly rates are per
hour and salary rates are annual; leave and payroll period end timestamps are exclusive.

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

The landing page can search mapped restaurants near a US address, city and state, or ZIP code. Search live to import listings, then filter by name or cuisine using the category navigation on the left. On narrow screens the navigation shows icons; its labels remain available to assistive technology. The distance setting in the discovery section accepts 1–25 miles and defaults to 5 miles. The search is limited to 500 mapped objects per live request, so use a smaller radius if the page reports that limit. Coverage and cuisine tags depend on OpenStreetMap and may be incomplete.

Live discovery is disabled until you configure **both** of these backend environment variables with services you operate or are licensed to use:

```text
OSM_GEOCODER_URL=https://your-geocoder.example/search
OSM_OVERPASS_URL=https://your-overpass.example/api/interpreter
```

The geocoder must support Nominatim-compatible `search` requests with `jsonv2`, `addressdetails`, and `countrycodes`; the Overpass endpoint must accept POST requests containing a `data` parameter and return Overpass JSON. The service must cover the US. Configure these variables in the backend environment or Render; Docker Compose forwards them when exported before starting the backend. Restart the backend after changes. Do not commit provider credentials. Providers with different authentication or response formats require an adapter.

Address autocomplete on the home and discovery pages uses the Geoapify Address Autocomplete API. Set `GEOAPIFY_API_KEY` in the backend environment, Docker Compose environment, or Render settings; the key is kept server-side. Typing at least three characters sends that partial input to Geoapify for US-only suggestions. Select a suggestion or enter an address, city and state, or ZIP manually. A selected suggestion with valid coordinates skips the separate geocoding request; edited text, missing coordinates, or an expired selection falls back to the configured geocoder. Suggestions carry a signed, 15-minute token containing the selected address and coordinates; it is passed with the search and is not encrypted. Instances must share the same configured `JWT_ACCESS_SECRET` for tokens to work across instances; without it tokens use a process-local key and can fall back to geocoding after restarts or between instances. **Get Started** opens the landing page and starts a live search for that location; refreshing that landing-page navigation repeats the search. For a five-digit ZIP entered directly, the backend first searches Geoapify when `GEOAPIFY_API_KEY` is configured, then tries the configured geocoder if Geoapify cannot return a valid match. This uses Geoapify quota and may select a different point within the ZIP than the other geocoder. ZIP+4 searches still use the configured geocoder first; if it does not return the matching ZIP, the Geoapify fallback approximates the center of the five-digit ZIP, not the specific address.

Restaurant cards display Lucide cuisine icons, with a generic store icon when no category matches. Optional Google Places photos can replace these icons as described below.

Do **not** use public community instances as an unplanned production backend: [Overpass guidance](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html) specifically discourages depending on its public instances for general-user apps. The [public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) has strict app-wide rate limits, identification, caching and privacy requirements, prohibits autocomplete and systematic POI downloads, and restricts LLM-generated usage. Use self-hosted or appropriately licensed services, and configure provider-side quotas/rate limits before public deployment. OpenStreetMap data requires attribution and may impose ODbL share-alike obligations; review the [license](https://www.openstreetmap.org/copyright) for your use.

Pressing **Search live** may send the entered location to the configured geocoder and restaurant data providers; avoid entering a street address if a city or ZIP is sufficient. Identical location and radius searches reuse successful results for five minutes in a bounded, per-backend-process memory cache, and simultaneous identical requests share one provider request. Cached results can be up to five minutes old; failures are not cached. A different radius or a cold/restarted instance triggers another provider search. The cache uses hashed search keys and keeps the returned coordinates and listings in memory; it is not shared across instances. Changing the distance after a search automatically repeats a live search for that location. Results are arranged in up to six responsive columns, with numbered pages and a choice of 5, 10, 12 (default), 20, 40, or all results per page. Changing the page size or filters returns to the first page. The current location and previously searched locations and coordinates are stored in the browser's local storage. **Search saved** uses those coordinates to retrieve previously imported listings without contacting the external services; a successful live search for that location in the same browser is required first. The database stores listings, not the user's search address. Switching regions does not delete old listings. Previously imported listings may be stale; they are not automatically removed if a store closes, and provider coverage may not include all businesses.

Backend logs report discovery timings for geocoding, Overpass, database upserts, nearby lookup, and total live search, plus cache hits and geocoder skips. Timings do not include addresses or coordinates. Use these measurements to identify slow stages; first searches still wait for Overpass and database writes.

Discovery imports use a single parameterized PostgreSQL bulk upsert rather than one write per listing. To run the optional database integration test, set `TEST_DATABASE_URL` to a PostgreSQL connection and run `node --test test\discovery-persistence.test.cjs` from `backend` after building. The test uses a temporary table and does not modify persistent listings.

Imported listings are separate from partner restaurants and are **discovery only**: no menu, ordering, delivery availability, or prices are implied. Distance is straight-line, not a delivery-zone check. Partner menu items remain separately accessible and are not location-filtered; changing locations does not change an existing cart.

### SousLab menu browsing (optional)

Create an account at [SousLab](https://souslab.site/signin), obtain an API key, and configure `SOUSLAB_API_KEY` in the backend environment, Docker Compose, or Render. Keep the key server-side and never commit or share it. Restart the backend after changing it. The free plan is for evaluation, prototyping and personal non-commercial use; check [pricing](https://souslab.site/pricing) and [terms](https://souslab.site/legal/terms) before displaying data in a product.

If SousLab rejects the API key, check that the active backend environment contains the complete API key, not the dashboard session token or an AnythingDoor user ID; save changes and redeploy or restart the backend. A plan/access denial is a different provider response: check the account and endpoint permissions with SousLab. The app maps these provider errors to HTTP 503 with distinct messages. Record-quota exhaustion is reported separately as HTTP 429.

On the landing page, search by exact US ZIP code (five digits or ZIP+4) and optionally restaurant name, then select the exact location. SousLab matches the stored ZIP exactly, so a five-digit search may not include a listing stored with ZIP+4, and results are not a radius search. The ZIP and name are sent to SousLab. Results are separate from OpenStreetMap listings and can be paged with **Load more restaurants**. SousLab charges by records returned, including one record per distinct menu item; the listed item count indicates the expected menu cost when available. API access has request-rate and record limits, and quota errors are shown in the app.

The category tabs and filter box apply to loaded SousLab restaurants using their names, reported cuisines, and addresses, not their menu items. Listings without cuisine information appear under **All** only. Matching restaurants may still be on pages that have not been loaded. The filter box also searches loaded discovery listings and partner menu items without making additional provider requests.

**View menu** opens a restaurant page with its available SousLab details and menu. The page can be refreshed or opened directly; loading details costs one additional SousLab record when not cached. Returning to the search restores the results from browser history.

SousLab reports weekly refreshes, not real-time menus. Coverage, prices, and availability may be missing or outdated; verify them with the restaurant. Zero prices are treated as unavailable, as SousLab documents that they usually mean no listed price. Options and modifiers are not supported. Only priced USD items not marked out of stock can be added to the browser's sample cart. Checkout does not place or pay for an order, and these listings are not sent to the real cart. Clear stored sample items if your right to use SousLab data ends.

Successful requests are cached in backend-process memory for five minutes (up to 100 entries); simultaneous identical requests share one call. Each backend process spaces provider requests at least 1.1 seconds apart and accepts at most 60 uncached requests per minute. These safeguards are not distributed or per-user and do not enforce an account-wide quota across instances. Configure appropriate access controls, shared rate limiting and provider-side usage limits before public deployment.

To show the SousLab record-usage bar only to designated signed-in accounts, set `SOUSLAB_USAGE_USER_IDS` on the backend to a comma-separated list of trusted user IDs and restart the backend. Find your account ID in the database, or while signed in inspect the `id` property of the `user` entry in your browser's local storage. An empty or unset list grants nobody access; the server checks the signed-in user ID, not the user-selected role. Forward the variable in Docker Compose or set it in Render as needed. Keep JWT signing secrets secure and use a strong unique production secret.

The bar shows the last valid quota headers observed by the current backend process, including headers on provider errors. It appears after a provider response includes those headers, does not make an extra SousLab request, and is not updated by cached responses. It can be out of date if other processes or applications use the same SousLab account, after a quota reset, or if responses arrive out of order. Restarting the process clears it; use the SousLab dashboard for the authoritative balance. The record quota is not a count of API calls.

### Google Places restaurant photos (optional)
https://console.cloud.google.com/
Enable Places API (New) and billing in Google Cloud, and set `GOOGLE_PLACES_API_KEY` in the backend environment (or Render/Docker Compose). Restrict the key to the Places API and your backend's supported IP restrictions; do not put it in frontend variables or commit it. Apply the database migration with `npx prisma migrate deploy` from `db` using `DATABASE_URL_UNPOOLED`, regenerate the Prisma client with `npx prisma generate`, and restart/redeploy the backend.

When a discovery card or SousLab restaurant page is visible, the backend searches Google using the restaurant's name and location/address, and requests one photo only for an unambiguous match. Names and addresses of listed businesses are sent to Google. Some restaurants will not match or have a photo; icons remain as a fallback, including when Google does not provide a link to the source photo. Google Maps and photo-provider credits and a link to the source photo are displayed alongside photos. No Google photos or photo names are stored in the database.

The database atomically limits this app to **1,000 combined Google search and photo requests per month**, shared by backend instances using the same database. Failed requests count conservatively; the limit resets on the first day of the month at midnight Pacific time. Each photo can require two requests, and a search without a matching photo still uses one. If the limit or database is unavailable, no additional Google request is made. SousLab restaurant detail lookups may separately use SousLab records. The public photo endpoint can use the allowance when accessed by visitors; add appropriate abuse protection before public deployment.

This limit does not cover other applications, databases, projects, or direct use of the same Google billing account/key, and it is not a guaranteed spending cap. Text Search and Place Photos have separate SKUs and free allowances; review [Google's pricing](https://developers.google.com/maps/billing-and-pricing/pricing), [cost controls](https://developers.google.com/maps/billing-and-pricing/manage-costs), and [Places policies](https://developers.google.com/maps/documentation/places/web-service/policies). Configure Google Cloud quotas and monitor billing as additional safeguards; billing alerts alone do not stop charges. Provider terms vary by billing region.

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
