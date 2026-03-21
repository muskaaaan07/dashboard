# How to Get MongoDB Atlas Data API URL and API Key

The Data API lets your app talk to MongoDB over HTTPS without a backend. You need two values:

1. **Data API base URL** → `VITE_MONGODB_DATA_API_URL`
2. **API Key** → `VITE_MONGODB_DATA_API_KEY`

---

## Where to find them

The Data API is configured in **Atlas App Services** (not in the main cluster screen). Follow these steps:

### 1. Open MongoDB Atlas

- Go to **[https://cloud.mongodb.com](https://cloud.mongodb.com)** and sign in.
- Select the **project** that contains your cluster (or create a project and cluster first).

### 2. Go to App Services

- In the left sidebar, under **Build**, click **App Services** (or **Services**).
- If you don’t see it, use the **…** or **More** menu; it may be under “Realm” or “App Services”.

### 3. Create or open an app

- **If you already have an app:** click it to open.
- **If not:** click **“Create a New App”** (or **“Create App”**).
  - Name it (e.g. `axio-analytics`).
  - **Link your cluster** when asked (choose the cluster where your data lives).
  - Create the app.

### 4. Enable the Data API and get the base URL

- Inside the app, in the left menu, open **HTTPS Endpoints**.
- Select the **Data API** tab.
- Turn **Enable Data API** (or similar) **ON**.
- You’ll see a **base URL**, for example:
  - Global: `https://data.mongodb-api.com/app/xxxxxxxx/endpoint/data/v1`
  - Or region-specific: `https://ap-south-1.aws.data.mongodb-api.com/app/data-xxxxxxxx/endpoint/data/v1`
- **Copy this entire URL** (including `/data/v1` at the end, but **without** `/action/...`).  
  This is your **Data API base URL**.

### 5. Create an API Key

- In the same app, go to **Authentication** (or **Users**).
- Find **API Key** (or **Create API Key** / **API Keys**).
- Click **Create API Key** (or **Add API Key**).
- Give it a name (e.g. `axio-admin`) and create it.
- **Copy the key immediately** — it’s shown only once. This is your **API Key**.

### 6. Configure access (rules)

- So the Data API can read/write your collection, set **Rules** for that collection:
  - Go to **Rules** (or **Data Access** / **Permissions**).
  - Add a rule for the database/collection you use (e.g. `axio_analytics` / `sheetData`).
  - For a simple setup you can allow all operations; for production, restrict by role or user.

### 7. Put the values in your app

- In the project root, copy `.env.example` to `.env` (if you don’t have `.env` yet).
- Fill in:

```env
VITE_MONGODB_DATA_API_URL=https://YOUR_REGION.data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1
VITE_MONGODB_DATA_API_KEY=your_copied_api_key_here
```

- **URL:** use the exact base URL you copied (no trailing slash is fine; the code normalizes it).
- **Key:** paste the API key you copied.
- Restart the dev server (`npm run dev`) so Vite picks up the new env vars.

---

## Quick checklist

| Step | What you get |
|------|------------------|
| 1 | Logged in at cloud.mongodb.com, correct project |
| 2 | App Services → your app open |
| 3 | App linked to the right cluster |
| 4 | HTTPS Endpoints → Data API → **Enabled** → **Base URL** copied |
| 5 | Authentication → API Key → **Create** → **Key** copied (once) |
| 6 | Rules allow access to your DB/collection |
| 7 | `.env` has `VITE_MONGODB_DATA_API_URL` and `VITE_MONGODB_DATA_API_KEY` |

---

## If you don’t see App Services or Data API

- **UI change:** MongoDB sometimes renames or moves menus. Look for: **App Services**, **Realm**, **Services**, **Build**, or **HTTPS Endpoints**.
- **Permissions:** You need **Project Owner** (or equivalent) to create apps and API keys.
- **Data API status:** The Data API is in [end-of-life](https://www.mongodb.com/docs/atlas/app-services/data-api/data-api-deprecation/). It may still work for existing apps; for new projects, consider using a small backend (e.g. Node + Express + MongoDB driver) and calling that from the client instead.

---

## Example `.env` (do not commit this file)

```env
VITE_MONGODB_DATA_API_URL=https://ap-south-1.aws.data.mongodb-api.com/app/data-abc123xyz/endpoint/data/v1
VITE_MONGODB_DATA_API_KEY=AbCdEf123456789...
```

After saving `.env`, run `npm run dev` again and use the Admin panel; “Load from DB” and “Save to database” will use this Data API.
