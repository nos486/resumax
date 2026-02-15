# Resumax

Resumax is a premium online CV maker built with Vue 3, Cloudflare Workers, and D1 Database.

## Project Structure
- `packages/backend`: Hono API on Cloudflare Workers.
- `packages/frontend`: Vue 3 Frontend on Cloudflare Pages.

## Prerequisites
- Node.js & npm
- Cloudflare Account & Wrangler CLI

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Setup Environment**
   - Create `packages/backend/.dev.vars` with:
     ```
     JWT_SECRET=your_super_secret_key
     ```
   - Create `packages/frontend/.env` with:
     ```
     VITE_API_URL=http://localhost:8787/api
     ```

3. **Run Development Servers**
   ```bash
   npm run dev
   ```
   This will start both backend (port 8787) and frontend (port 5173).

## Database Setup (D1)

1. **Create D1 Database**
   ```bash
   npx wrangler d1 create resumax-db
   ```
2. **Update `wrangler.jsonc`**
   - Replace `database_id` with your new database ID.
3. **Run Migrations**
   ```bash
   cd packages/backend
   npx wrangler d1 migrations apply DB --remote
   ```

## Deployment (Cloudflare Git Integration)

The user requested manual setup on GitHub and Cloudflare with automatic updates on push.

### 1. Push to GitHub
Create a new repository on GitHub and push this code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/resumax.git
git push -u origin main
```

### 2. Deploy Frontend (Cloudflare Pages)
1. Go to **Cloudflare Dashboard** > **Workers & Pages** > **Create Application**.
2. Click **Connect to Git**.
3. Select your `resumax` repository.
4. Configure the build settings:
   - **Project Name**: `resumax-frontend`
   - **Production Branch**: `main`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `packages/frontend`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
5. **Environment Variables**:
   - `VITE_API_URL`: `https://resumax-backend.YOUR_SUBDOMAIN.workers.dev/api` (You will get this URL after deploying the backend).
6. Click **Save and Deploy**.

### 3. Deploy Backend (Cloudflare Workers)
1. Go to **Cloudflare Dashboard** > **Workers & Pages** > **Create Application**.
2. Click **Connect to Git** (if available for Workers in your plan) OR create a standard Worker and connect it:
   - *Note: If "Connect to Git" isn't available for Workers, use the CLI method below once, or set up a "Pages Function" project.*
   - **Recommended for Monorepo**: If you want automatic updates for the backend worker, you can use the **Cloudflare Worker** git integration:
     1. Select **Connect to Git**.
     2. Select `resumax` repo.
     3. **Root Directory**: `packages/backend`
     4. **Build Command**: `npm install` (Wrangler handles the rest via `wrangler.jsonc`).
     5. Click **Deploy**.

#### Alternative: Manual CLI Deployment (Backend)
If you cannot connect the Worker to Git directly:
```bash
cd packages/backend
npm run deploy
```

### 4. Database Setup (D1)
Ensure you have created the database and updated `packages/backend/wrangler.jsonc` with the ID (already done).
- **Apply Migrations** (run locally once):
  ```bash
  cd packages/backend
  npx wrangler d1 migrations apply DB --remote
  ```

