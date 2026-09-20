# Resumax

Resumax is a modern, full-stack resume and CV builder designed for speed, flexibility, and edge deployment. Built with **Vue 3**, **Hono**, **Cloudflare Workers**, and **Cloudflare D1 Database**.

---

## Table of Contents

- [Overview & Features](#overview--features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Google OAuth Setup](#google-oauth-setup)
- [Database Setup & Migrations](#database-setup--migrations)
- [Deployment](#deployment)
- [Developer Guide](#developer-guide)
  - [Architecture Overview](#architecture-overview)
  - [Authentication Flow](#authentication-flow)
  - [API Endpoints Reference](#api-endpoints-reference)
  - [Theme Engine & RTL Support](#theme-engine--rtl-support)
  - [Database Schema & Migrations](#database-schema--migrations)
  - [Useful Scripts](#useful-scripts)

---

## Overview & Features

- ⚡ **Edge-Native Performance**: Powered by Cloudflare Workers and Pages with global edge distribution.
- 🎨 **Dynamic Theme Engine**: Switch between Modern, Professional, and fully customizable Dynamic themes.
- 🌐 **RTL & Multilingual Support**: Built-in support for right-to-left languages (e.g. Persian/Farsi with Vazirmatn font) and English.
- 🔗 **Public Resume Sharing**: Share resumes with custom public vanity URLs (`/v/:slug`).
- 🔐 **Google OAuth Single Sign-On**: Seamless authentication with secure JWT tokens.
- 💾 **Real-time Live Preview & Resizable Split View**: Customize width, preview changes instantly, and export resumes as JSON or PDF/images.

---

## Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Monorepo** | npm Workspaces | Managed multi-package repository (`packages/*`) |
| **Frontend** | [Vue 3](https://vuejs.org/) (`<script setup>`) | Reactive UI components and state management |
| **Styling** | [TailwindCSS 3](https://tailwindcss.com/) | Modern utility-first CSS design |
| **Icons & UI** | [Lucide Vue Next](https://lucide.dev/), [Heroicons](https://heroicons.com/) | Clean iconography and UI primitives |
| **Bundler** | [Vite 7](https://vite.dev/) | Ultra-fast frontend development and bundling |
| **Backend** | [Hono v4](https://hono.dev/) | Lightweight, ultra-fast web framework for Cloudflare Workers |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite database at the edge |
| **Auth** | Google OAuth 2.0 + Hono JWT | Stateless session tokens and social login |

---

## Project Structure

```text
resumax/
├── package.json                   # Root package with npm workspaces config
├── .gitignore                     # Git ignore rules (node_modules, .env, etc.)
├── README.md                      # Project documentation
└── packages/
    ├── backend/                   # Cloudflare Worker API
    │   ├── src/
    │   │   ├── index.ts           # Hono entrypoint, middleware, and route mounting
    │   │   ├── types.ts           # TypeScript bindings and context types
    │   │   ├── middleware.ts      # JWT authentication middleware
    │   │   └── routes/
    │   │       ├── auth.ts        # Google OAuth redirect & callback handling
    │   │       ├── resume.ts      # Authenticated resume CRUD operations
    │   │       └── public.ts      # Public resume viewing endpoint
    │   ├── migrations/            # Cloudflare D1 SQL schema migrations
    │   │   ├── 0000_initial.sql   # Initial users and resumes tables
    │   │   └── 0001_google_auth.sql # Google OAuth column addition
    │   ├── schema.sql             # Consolidated SQLite schema reference
    │   ├── wrangler.jsonc         # Wrangler configuration and D1 bindings
    │   └── package.json           # Backend dependencies and scripts
    │
    └── frontend/                  # Vue 3 Single Page Application
        ├── src/
        │   ├── App.vue            # Root application component & toasts
        │   ├── main.js            # App initialization and router setup
        │   ├── style.css          # Global Tailwind and font styles
        │   ├── router/
        │   │   └── index.js       # Vue Router routes and navigation guards
        │   ├── lib/
        │   │   ├── api.js         # Fetch wrapper with JWT headers & error handling
        │   │   └── toast.js       # Global notification state
        │   ├── components/
        │   │   ├── IconPicker.vue # Dynamic icon selection component
        │   │   ├── ThemeCustomizer.vue # Color, typography, and section styling
        │   │   ├── Toast.vue      # Floating notification toast
        │   │   └── themes/        # Resume display themes
        │   │       ├── DynamicTheme.vue
        │   │       ├── ModernTheme.vue
        │   │       └── ProfessionalTheme.vue
        │   └── views/
        │       ├── Home.vue       # Landing page
        │       ├── Login.vue      # Google OAuth login screen
        │       ├── Register.vue   # Registration redirect to login
        │       ├── Dashboard.vue  # Main resume editor & previewer
        │       ├── PublicView.vue # Public view for `/v/:slug`
        │       └── GoogleCallback.vue # OAuth callback handler
        ├── vite.config.js         # Vite build configuration
        ├── tailwind.config.js     # Tailwind design system configuration
        └── package.json           # Frontend dependencies and scripts
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/) (free tier supported)
- **Wrangler CLI**: Installed locally via npm dependencies or globally (`npm install -g wrangler`)

---

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/nos486/resumax.git
   cd resumax
   ```

2. **Install all dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables** (see below).

4. **Start the local development servers**:
   ```bash
   npm run dev
   ```
   - **Frontend**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8787`

---

## Environment Configuration

### 1. Backend (`packages/backend/.dev.vars`)

Create a `.dev.vars` file in `packages/backend/`:

```ini
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
FRONTEND_URL=http://localhost:5173
```

> **Note**: `.dev.vars` is automatically read by Wrangler in local development and is excluded from git tracking.

### 2. Frontend (`packages/frontend/.env`)

Create a `.env` file in `packages/frontend/`:

```ini
VITE_API_URL=http://localhost:8787/api
```

For production builds, set `VITE_API_URL` to your live Cloudflare Worker domain (e.g. `https://resumax-backend.your-subdomain.workers.dev/api`).

---

## Google OAuth Setup

Resumax uses Google OAuth 2.0 for user authentication:

1. Visit the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: *Web application*).
3. Add **Authorized redirect URIs**:
   - Local: `http://localhost:8787/api/auth/google/callback`
   - Production: `https://<your-worker-domain>/api/auth/google/callback`
4. Copy the **Client ID** and **Client Secret** into:
   - `packages/backend/.dev.vars` (for local development)
   - Cloudflare Workers secrets (for production, via `wrangler secret put`)

---

## Database Setup & Migrations

Resumax utilizes **Cloudflare D1** (Serverless SQLite).

### 1. Create the Database

```bash
npx wrangler d1 create resumax-db
```

Update `database_id` inside `packages/backend/wrangler.jsonc` with the ID output by the command:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "resumax-db",
    "database_id": "YOUR_DATABASE_ID_HERE"
  }
]
```

### 2. Apply Migrations

Apply migrations to your local SQLite emulator:

```bash
cd packages/backend
npx wrangler d1 migrations apply DB --local
```

Apply migrations to production Cloudflare D1:

```bash
cd packages/backend
npx wrangler d1 migrations apply DB --remote
```

---

## Deployment

### 1. Backend (Cloudflare Workers)

Deploy the backend directly using Wrangler:

```bash
cd packages/backend
npm run deploy
```

Set your production secrets on Cloudflare:

```bash
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

### 2. Frontend (Cloudflare Pages)

1. Connect your GitHub repository to **Cloudflare Pages** in the Cloudflare Dashboard.
2. Configure build settings:
   - **Framework preset**: `Vite`
   - **Root directory**: `packages/frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add production environment variable:
   - `VITE_API_URL`: `https://resumax-backend.YOUR_SUBDOMAIN.workers.dev/api`
4. Deploy!

---

## Developer Guide

### Architecture Overview

Resumax is organized as a monorepo leveraging npm workspaces. The architecture isolates the frontend client from the edge backend worker while maintaining a shared development environment:

```
[Browser Client]
   │
   ├── (Vue 3 + Vite) ───────────────> Cloudflare Pages
   │
   └── (REST API / JWT / OAuth) ────> Cloudflare Worker (Hono)
                                            │
                                            └──> Cloudflare D1 (SQLite)
```

### Authentication Flow

1. User clicks **"Continue with Google"** on `/login`.
2. Frontend redirects to `GET /api/auth/google`.
3. Backend redirects user to Google's consent screen (`accounts.google.com`).
4. Google redirects back to `GET /api/auth/google/callback` with an authorization code.
5. Backend exchanges the code for user profile data (`email`, `sub`), queries or inserts the user into the `users` table in D1.
6. Backend issues a signed JWT (`hono/jwt`) and redirects the user to `/auth/callback?token=...&user=...`.
7. Frontend extracts the token, stores it in `localStorage`, and forwards the user to `/dashboard`.
8. Subsequent requests include the token in the `Authorization: Bearer <token>` header.

### API Endpoints Reference

#### Auth Routes (`/api/auth`)
| Method | Path | Description | Protected |
|---|---|---|---|
| `GET` | `/api/auth/google` | Initiates Google OAuth consent redirection | No |
| `GET` | `/api/auth/google/callback` | Exchanges code, issues JWT, and redirects to frontend | No |

#### Resume Routes (`/api/resume`)
| Method | Path | Description | Protected |
|---|---|---|---|
| `GET` | `/api/resume` | Fetches the current authenticated user's resume (or initializes one) | Yes |
| `PUT` | `/api/resume` | Saves resume content, selected theme, and custom vanity slug | Yes |

#### Public Routes (`/api/public`)
| Method | Path | Description | Protected |
|---|---|---|---|
| `GET` | `/api/public/:slug` | Retrieves resume data and theme by public slug for `/v/:slug` view | No |

### Theme Engine & RTL Support

Themes are modular Vue components located in `packages/frontend/src/components/themes/`:
- **`DynamicTheme.vue`**: Fully customizable component allowing users to configure palette colors, layout style (sidebar vs. top header), typography, spacing, and section order.
- **`ModernTheme.vue`**: Clean, contemporary resume layout.
- **`ProfessionalTheme.vue`**: Traditional corporate layout suitable for formal applications.

#### Right-to-Left (RTL) Languages
- Supports English and Persian (Farsi).
- When RTL mode is active, the layout flips direction, Persian section titles are applied, and typography switches to the **Vazirmatn** font automatically.

### Database Schema & Migrations

Migrations are stored sequentially under `packages/backend/migrations/`:

```sql
-- users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    created_at INTEGER DEFAULT (unixepoch())
);

-- resumes table
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT DEFAULT '{}',
    theme TEXT DEFAULT 'modern',
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Creating a New Migration
1. Add a new file in `packages/backend/migrations/` named `000X_your_feature.sql`.
2. Apply locally: `npx wrangler d1 migrations apply DB --local`
3. Apply to production: `npx wrangler d1 migrations apply DB --remote`

### Useful Scripts

Run from the root directory:

```bash
# Run both frontend and backend concurrently
npm run dev

# Build both frontend and backend for production
npm run build

# Deploy both workspaces
npm run deploy

# Target specific workspace
npm run dev --workspace=packages/frontend
npm run dev --workspace=packages/backend
```
