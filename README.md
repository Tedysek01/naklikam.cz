# Naklikam.cz — Open-Source AI Website Builder

> **Describe your website in plain language. AI builds it. You ship it.**
>
> A full-stack, open-source alternative to [Lovable](https://lovable.dev), [Bolt.new](https://bolt.new), and [v0.dev](https://v0.dev) — built with Claude AI, in-browser code execution, and one-click deployment.

![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)
![Stripe](https://img.shields.io/badge/Stripe-008CDD?logo=stripe&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

---

## What is this?

Naklikam.cz is a production-grade AI web builder that runs entirely in the browser. Users describe what they want in natural language, and the AI generates a fully functional React application with live preview, code editing, and deployment — all without leaving the browser.

Originally built for the Czech market (UI is in Czech, "naklikej" means "click it together"), the codebase is a complete reference implementation for anyone who wants to build their own AI-powered development environment.

### Key Highlights

- **AI Code Generation** — Claude Sonnet generates production-quality React + TypeScript + Tailwind projects from natural language prompts
- **In-Browser Runtime** — Code runs directly in the browser using [almostnode](https://www.npmjs.com/package/almostnode) (no server-side execution, no Docker, no WebContainer COOP/COEP headers)
- **Full IDE in the Browser** — Monaco editor, file tree, integrated terminal, live preview with hot reload
- **One-Click Deploy** — Push to GitHub and deploy to Vercel without leaving the app
- **SaaS-Ready** — Firebase auth, Stripe subscriptions, admin panel, analytics — all wired up
- **Content Marketing Suite** — AI-powered text, image (Gemini), and video generation built in

---

## Demo

**Live at [naklikam.cz](https://www.naklikam.cz)**

The workflow:

1. Describe your website in natural language
2. AI generates the code (React + TypeScript + Tailwind)
3. See it live instantly in the browser preview
4. Edit the code, ask AI to modify it, iterate
5. Export to GitHub and deploy to Vercel

---

## Architecture

```
naklikam/
├── src/                          # React frontend
│   ├── pages/                    # Routes (Home, Dashboard, Project Editor, Pricing, Auth, Admin)
│   ├── components/               # UI components
│   │   ├── ChatPanel.tsx         # AI conversation interface
│   │   ├── CodeEditor.tsx        # Monaco editor
│   │   ├── PreviewPanel.tsx      # Live preview iframe
│   │   ├── TerminalPanel.tsx     # In-browser terminal
│   │   ├── FileTree.tsx          # Project file explorer
│   │   └── deployment/           # GitHub + Vercel integration
│   ├── services/
│   │   ├── ClaudeService.ts      # Anthropic Claude integration
│   │   ├── ContainerService.ts   # almostnode in-browser runtime
│   │   ├── GitHubService.ts      # GitHub OAuth + repo management
│   │   ├── VercelService.ts      # Vercel deployment API
│   │   ├── firebaseService.ts    # Firebase Auth + Firestore + Storage
│   │   └── subscriptionService.ts # Stripe subscription management
│   ├── store/                    # Zustand state management
│   └── utils/
│       ├── intentDetector.ts     # Detect create vs. update intent
│       ├── fileMatching.ts       # Smart file matching engine
│       └── pathUtils.ts          # Path normalization
│
├── api/                          # Express backend (Vercel Functions compatible)
│   ├── claude/                   # AI endpoints (chat, stream)
│   ├── stripe/                   # Payment endpoints
│   ├── webhooks/                 # Stripe webhook handler
│   ├── github/                   # GitHub API proxy
│   ├── content/                  # Content generation (text, image, video)
│   └── admin/                    # Admin utilities
│
├── server.js                     # Express dev server
├── vite.config.ts                # Vite + almostnode plugin
└── vercel.json                   # Production deployment config
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **UI Components** | Radix UI, Shadcn/ui patterns, Lucide icons |
| **State** | Zustand, React Query |
| **Code Editor** | Monaco Editor |
| **In-Browser Runtime** | almostnode (VirtualFS + ViteDevServer + npm) |
| **AI** | Anthropic Claude (primary), OpenAI, Google Gemini |
| **Auth & DB** | Firebase Authentication + Firestore |
| **Payments** | Stripe (subscriptions, webhooks, customer portal) |
| **Deployment** | Vercel (frontend + serverless API) |
| **GitHub** | OAuth login, repo creation, file push |

---

## How the AI Works

1. **User sends a prompt** — "Create a landing page for a coffee shop with a photo gallery and booking form"

2. **Intent detection** — `intentDetector.ts` analyzes whether the user wants to create new files or modify existing ones

3. **Claude generates structured output** — The AI returns a JSON response with file operations:
   ```json
   {
     "explanation": "I'll create a responsive landing page...",
     "files": [
       {
         "path": "/src/components/Hero.tsx",
         "operation": "create",
         "content": "import { useState } from 'react'..."
       }
     ]
   }
   ```

4. **Smart file matching** — `fileMatching.ts` maps AI-generated files to existing project files using fuzzy matching, path analysis, and content similarity

5. **In-browser execution** — almostnode writes files to VirtualFS, installs dependencies from CDN, and serves the app via its built-in Vite dev server

6. **Live preview** — Changes appear instantly with hot module reloading

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))
- Stripe account for payments (optional, [dashboard.stripe.com](https://dashboard.stripe.com))

### 1. Clone and install

```bash
git clone https://github.com/Tedysek01/naklikam.cz.git
cd naklikam
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Stripe (optional — needed for subscriptions)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# GitHub OAuth (optional — needed for GitHub export)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Content generation (optional)
OPENAI_API_KEY=...
GOOGLE_GEMINI_API_KEY=...
```

### 3. Set up Firebase

1. Create a Firebase project
2. Enable **Authentication** (Email/Password + Google)
3. Create a **Firestore** database
4. Deploy security rules: `firebase deploy --only firestore:rules,storage`

### 4. Run

```bash
npm run dev
```

This starts both the Vite frontend (port 5173) and the Express backend (port 3002) concurrently.

Open [http://localhost:5173](http://localhost:5173)

### Available Scripts

```bash
npm run dev              # Start frontend + backend
npm run dev:frontend     # Vite dev server only
npm run dev:backend      # Express API server only
npm run build            # TypeScript check + production build
npm run lint             # ESLint
npm run preview          # Preview production build
```

---

## Deployment

### Vercel (Recommended)

The project is configured for Vercel out of the box:

1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

The `vercel.json` routes API calls to serverless functions and serves the SPA frontend.

### Firebase Hosting (Alternative)

```bash
npm run build
firebase deploy --only hosting
```

---

## Project Structure — Key Files

| File | What it does |
|------|-------------|
| `src/services/ClaudeService.ts` | Anthropic Claude API integration — prompt construction, response parsing, file extraction |
| `src/services/ContainerService.ts` | almostnode wrapper — VirtualFS, package management, dev server lifecycle |
| `src/utils/intentDetector.ts` | Analyzes user prompts to determine create vs. update intent |
| `src/utils/fileMatching.ts` | Fuzzy file matching engine — maps AI output to existing project files |
| `src/components/ChatPanel.tsx` | AI conversation UI with streaming responses |
| `src/components/PreviewPanel.tsx` | Live preview with desktop/mobile toggle and sandbox isolation |
| `src/components/CodeEditor.tsx` | Monaco editor with file tabs and syntax highlighting |
| `src/store/projectStore.ts` | Zustand store for project files, metadata, and file operations |
| `server.js` | Express server with all API routes for local development |
| `api/claude/stream.js` | SSE streaming endpoint for Claude AI responses |
| `api/webhooks/stripe.js` | Stripe webhook handler for subscription lifecycle |

---

## Features in Detail

### In-Browser Runtime (almostnode)

Unlike WebContainer which requires `COOP/COEP` headers (breaking many hosting providers), **almostnode** runs via a Service Worker:

- **VirtualFS** — In-memory file system for instant file operations
- **PackageManager** — Installs npm packages from CDN
- **ViteDevServer** — Full Vite dev server running in the browser
- **HMR** — Hot module reloading for instant preview updates
- **Optional Sandbox** — Cross-origin preview iframe for XSS isolation

### GitHub Integration

- OAuth login via GitHub App
- Create new repos from the editor
- Push all project files with a single click
- Automatic `.gitignore` and project structure

### Vercel Integration

- Connect via Personal Access Token
- Deploy projects directly from the editor
- Custom domain support
- Deployment status tracking

### Stripe Subscriptions

- Multiple plan tiers with CZK pricing
- Monthly and annual billing
- Webhook-driven subscription sync
- Customer portal for self-service management
- Token-based usage tracking

### Content Marketing Suite

- **Text Generation** — OpenAI GPT for blog posts, landing page copy
- **Image Generation** — Google Gemini for marketing visuals
- **Video Generation** — Google Veo for video content
- Credit-based system with standalone and addon plans

---

## Customization

### Changing the Language

The UI is in Czech. To adapt it for another language:

1. Search for Czech text strings in `src/components/` and `src/pages/`
2. Replace with your target language
3. Update AI system prompts in `src/services/ClaudeService.ts` and `api/claude/`

### Changing the AI Provider

The AI layer is in `src/services/ClaudeService.ts` and `api/claude/`. To swap Claude for another provider:

1. Replace the API calls in `api/claude/stream.js` and `api/claude/chat.js`
2. Update the response parsing in `ClaudeService.ts`
3. Adjust the structured output format if needed

### Stripe Configuration

Replace the price IDs in `src/config/stripe.config.ts` and the corresponding API files with your own Stripe products. The webhook handler in `api/webhooks/stripe.js` handles subscription lifecycle events.

---

## Contributing

Contributions are welcome! This is a full production codebase, so there's plenty of room for improvement:

- **Internationalization** — Extract Czech strings into i18n files
- **Testing** — Add unit and E2E tests
- **AI Providers** — Add support for more AI models
- **Templates** — Pre-built website templates
- **Collaboration** — Multi-user editing
- **Performance** — Optimize bundle size and loading times

### Development Setup

```bash
git clone https://github.com/Tedysek01/naklikam.cz.git
cd naklikam
npm install
cp .env.example .env
# Fill in your API keys
npm run dev
```

---

## Why Open Source?

I built Naklikam.cz as a solo project for the Czech market. The AI website builder space is dominated by well-funded startups (Lovable, Bolt, v0), and I believe the underlying technology should be accessible to everyone.

This codebase demonstrates:

- How to integrate Claude AI for structured code generation
- How to run a full dev environment in the browser
- How to build a complete SaaS with auth, payments, and deployment
- How to handle the complexity of AI-generated code (intent detection, file matching, streaming)

Use it to learn, build your own AI builder, or contribute to this one.

---

## License

[MIT](LICENSE) — Tadeas Raska ([@Tedysek01](https://github.com/Tedysek01))

---

## Acknowledgments

- [Anthropic Claude](https://anthropic.com) — AI code generation
- [almostnode](https://www.npmjs.com/package/almostnode) — In-browser Node.js runtime
- [Shadcn/ui](https://ui.shadcn.com) — React component library
- [Firebase](https://firebase.google.com) — Auth, database, storage
- [Stripe](https://stripe.com) — Payment processing
- [Vercel](https://vercel.com) — Deployment platform

---

**Built with determination in the Czech Republic.**
