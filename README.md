# Booking Management System

React and Vite frontend with an Express API and MongoDB database. Deploy the frontend to Vercel, the API to Render, and use MongoDB Atlas for the database.

## Local Development

1. Install dependencies with `npm install`.
2. Create `.env` from `.env.example`. Set `MONGODB_URI` to a local MongoDB URI or an Atlas connection URI, and keep `PORT=5000` locally.
3. Create or update `.env.local` with `VITE_API_URL=http://localhost:5000`.
4. Start the API and frontend together with `npm run dev`.

This command runs the API and Vite together; stopping it stops both. You can still run only the API with `npm run server`. Both `.env` and `.env.local` are ignored by Git. Never put a MongoDB URI in a `VITE_` variable; Vite exposes those values to browsers.
For compatibility with earlier local setups, the API reads `MONGODB_URI` from `.env.local` only when it is not set in `.env` or the process environment. Move that value to `.env` and keep `.env.local` for `VITE_API_URL` only.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account and a cluster.
2. Under **Database Access**, create a database user with a strong password. URL-encode special characters in the password before adding it to the URI.
3. Under **Network Access**, allow your development IP. Render does not provide a fixed outbound IP on every plan; for a Render service without fixed egress, Atlas may need the `0.0.0.0/0` access-list entry. Use a dedicated least-privilege database user and a strong password if you choose this option.
4. Select **Connect > Drivers**, copy the Node.js connection URI, and replace the username, password, and cluster placeholders. Include a database name, for example `bookingdb`.
5. Put the completed URI in local `.env` as `MONGODB_URI=...`; add the same key as a secret environment variable in Render. Do not commit either value.

## Render API Deployment

1. Create a Render **Web Service** from the Git repository containing this project. This project is its own repository/package root; use the directory containing `package.json`, `server.js`, and `render.yaml` as the Render root directory (normally `.`).
2. Use build command `npm install` and start command `npm run server`. These are also declared in `render.yaml`.
3. Add the Render environment variable `MONGODB_URI` with the Atlas URI.
4. Set `FRONTEND_URL` to the exact Vercel production origin, such as `https://your-project.vercel.app` (no trailing slash). Multiple allowed origins can be comma-separated. Add preview origins only if they should be allowed.
5. Render supplies `PORT`; no manual production port is needed. The server connects to MongoDB before listening and exits with an error if the database connection fails.
6. After deployment, copy the service URL, for example `https://your-api.onrender.com`.

## Vercel Frontend Deployment

1. Import this repository into Vercel and set the project root to the directory containing `package.json` and `vite.config.js`.
2. Set the build command to `npm run build` and output directory to `dist` (the Vite defaults also work).
3. Add the Vercel environment variable `VITE_API_URL` with the Render service URL, for example `https://your-api.onrender.com`, without a trailing slash. Add it to **Production** and any Preview/Development environments you intend to use.
4. Redeploy after setting or changing environment variables. `vercel.json` routes browser-side React Router paths back to the Vite entry page.
5. Once Vercel assigns the real production domain, set that exact origin as Render's `FRONTEND_URL` and redeploy the Render service.

The repository does not contain a Vercel domain or Render service URL. Replace these examples with the URLs assigned to your deployments.

## Environment Variables

| Variable | Where | Value |
| --- | --- | --- |
| `MONGODB_URI` | Local `.env`, Render | MongoDB Atlas connection string |
| `PORT` | Local `.env` | `5000`; Render injects its own port |
| `FRONTEND_URL` | Local `.env`, Render | `http://localhost:5173` locally; exact Vercel origin on Render |
| `VITE_API_URL` | Local `.env.local`, Vercel | `http://localhost:5000` locally; Render service URL on Vercel |

## Verify Booking Operations

After both local services start, open the Vite URL and test:

1. **GET:** open Dashboard or Bookings; the list and statistics should load.
2. **POST:** submit a guest name and booking date; the new booking should appear.
3. **PATCH:** change a booking's status; the table and dashboard should refresh.
4. **DELETE:** delete a booking; it should disappear and the totals should update.

The API endpoints are `GET /api/bookings`, `GET /api/bookings/stats`, `POST /api/bookings`, `PATCH /api/bookings/:id`, and `DELETE /api/bookings/:id`. The frontend handles API error responses as JSON and displays their message in the existing UI.

To verify deployment, repeat the same UI checks using the Vercel site. In the browser Network panel, confirm requests go to the Render service URL and return successful JSON responses. If requests fail, confirm the Vercel `VITE_API_URL`, Render `FRONTEND_URL`, and Atlas network access list match the deployed configuration.

## Available Commands

- `npm run dev` starts Vite.
- `npm run server` starts the API after the database connects.
- `npm run build` creates the production frontend in `dist`.
- `npm run lint` runs Oxlint.
