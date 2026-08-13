# Supabase & GitHub Persistence Setup Guide

This guide details how to configure Supabase Auth and the secure Deno Edge Function (`update-video-data`) to push portfolio modifications to your GitHub repository (**Garuda-n/her-portfolio**).

---

## 1. GitHub Token Configuration (Fine-Grained PAT)

To allow the Edge Function to securely commit changes to `src/data/video.json` in your repository:
1. Navigate to **GitHub Settings** -> **Developer Settings** -> **Personal Access Tokens** -> **Fine-grained tokens**.
2. Click **Generate new token**.
3. Set the scope:
   - **Repository Access**: Select **Only select repositories** -> Choose `her-portfolio`.
   - **Permissions**: Go to **Repository permissions** -> Select **Contents** -> Choose **Read and Write**.
4. Copy the generated token. It will be configured as a server-side secret.

---

## 2. Supabase Setup

### Creating the Project
1. Register/Login on [Supabase](https://supabase.com/).
2. Create a new project.
3. Retrieve your project keys from **Project Settings** -> **API**:
   - **Project URL** (maps to `VITE_SUPABASE_URL` in React)
   - **API Anon Key** (maps to `VITE_SUPABASE_ANON_KEY` in React)

### Enabling Auth Provider
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Enable the **Email/Password** provider and turn off **Confirm email** for easier testing, if desired.
3. Go to **Authentication** -> **Users** and click **Add User** to create your authorized editor account credentials.

---

## 3. Local Development

You can run the Deno Edge Function locally using the Supabase CLI.

### Installing Supabase CLI
```bash
# Install via npm
npm install -g supabase
```

### Initializing Supabase Local Config
Run this in the root of the project to bind configuration folders:
```bash
supabase init
```

### Setting up Local Secrets
Create a `.env` file at `supabase/functions/update-video-data/.env` containing:
```env
GITHUB_TOKEN=your_fine_grained_github_pat_here
```

### Serving the Edge Function Locally
Run the local Deno server:
```bash
supabase functions serve update-video-data --env-file ./supabase/functions/update-video-data/.env
```
This spawns the function endpoint at `http://127.0.0.1:54321/functions/v1/update-video-data`.

### Configuring the React Frontend
Create a `.env` file at the root of `D:\project\forher` containing:
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
*(In local development, pointing `VITE_SUPABASE_URL` to `http://127.0.0.1:54321` redirects `supabase.functions.invoke` calls automatically to your locally served Deno server).*

---

## 4. Production Deployment

Once local testing passes, deploy your Deno Edge Function to the Supabase cloud:

### Set Deno Secrets in Production
Push the GitHub PAT to your Supabase instance:
```bash
supabase secrets set GITHUB_TOKEN=your_fine_grained_github_pat_here
```

### Deploy Deno Edge Function
Deploy the directory code:
```bash
supabase functions deploy update-video-data
```

### Update React Environment Variables
Point your production website build variables (e.g., in GitHub Actions or static deployment setups) to your live Supabase cloud:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```
Because the Supabase JS SDK utilizes the URL to fetch Edge Functions, `supabase.functions.invoke('update-video-data')` will now cleanly trigger the live secure cloud endpoint, attaching the active user's JWT authorization header automatically.
