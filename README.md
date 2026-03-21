<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/13OfpY8d552ZXWazqbWo_9MYvJMkt2zOS

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (if using AI features).
3. **Using MongoDB (Admin panel / analytics from DB):**
   - Copy [.env.example](.env.example) to `.env`.
   - Set `MONGODB_URI` to your Atlas connection string (e.g. `mongodb+srv://...`).
   - Set `VITE_USE_MONGODB_SERVER=true`.
   - Run **one command** to start both the API server (port 3001) and the app (port 3000):
   ```bash
   npm run dev
   ```
   Or run separately: `npm run server` in one terminal, `npm run dev:app` in another.
4. Run the app (if not already):
   ```bash
   npm run dev
   ```

## Deploy on Vercel

1. Push your code and import the project in [Vercel](https://vercel.com).
2. Set **Environment Variables** in the Vercel project:
   - `MONGODB_URI` = your MongoDB Atlas connection string (e.g. `mongodb+srv://...`).
   - `VITE_USE_MONGODB_SERVER` = `true` (so the frontend calls `/api/analytics`).
3. Deploy. Vercel will:
   - Build the app with `vite build` and serve it from `dist`.
   - Run `api/analytics.js` as a serverless function at `/api/analytics` (GET and POST).
   No separate server process is needed; the API runs as a serverless function.
