# SelfRanker Frontend

This directory contains the client-side single page application (SPA) for the SelfRanker platform, built with React 19, Vite 8, and Tailwind CSS 4.

For comprehensive platform architecture, complete API documentation, and system diagrams, refer to the [Root README](../README.md).

---

## Directory Overview

```
frontend/
|-- public/                  # Static web assets
|-- src/
|   |-- assets/              # Component illustrations and brand images
|   |-- components/
|   |   |-- dashboard/       # Sidebar, DashboardHeader, navigation primitives
|   |   |-- DeviceLimitDialog.jsx
|   |   |-- Navbar.jsx
|   |   |-- UpgradeModal.jsx
|   |   |-- UsageBadge.jsx
|   |-- context/             # Global application state (UsageContext)
|   |-- hooks/               # Custom hooks (useUsageLimits)
|   |-- pages/
|   |   |-- dashboard/       # Feature pages: AINotes, AIQuiz, AIQA, SupremeLearning,
|   |   |                    # AITutor, Gamification, Analytics, LearningPath, AccountSettings
|   |   |-- Dashboard.jsx    # Dashboard container and nested route manager
|   |   |-- ForgotPassword.jsx
|   |   |-- GetStarted.jsx
|   |   |-- GitHubCallback.jsx
|   |   |-- Home.jsx
|   |   |-- NotFound.jsx
|   |   |-- SignIn.jsx
|   |-- utils/               # HTTP client (api.js), LaTeX math rendering, PDF generator
|   |-- App.jsx              # Theme manager and primary route dispatcher
|   |-- index.css            # Tailwind directives, CSS custom properties, and dark mode classes
|   |-- main.jsx             # React DOM entry point
|-- index.html
|-- vercel.json              # SPA rewrite configuration
|-- vite.config.js           # Vite build and plugin configuration
|-- package.json
|-- .env.example
```

---

## Available Scripts

In the `frontend` directory, you can run the following commands:

### Development Mode

```bash
npm run dev
```

Runs the application in development mode with Hot Module Replacement (HMR). Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
```

Compiles and optimizes the React application into static assets within the `dist/` directory.

### Code Quality and Linting

```bash
npm run lint
```

Runs ESLint to check for syntax issues, unused imports, and React hooks rules.

### Production Preview

```bash
npm run preview
```

Serves the locally built `dist/` bundle on a local HTTP server for pre-deployment inspection.

---

## Environment Variables

Copy `.env.example` to `.env` in this directory:

```bash
cp .env.example .env
```

| Variable | Description |
| -------- | ----------- |
| `VITE_API_BASE_URL` | Base endpoint URL for the backend API (e.g., `http://localhost:3000/api`) |
| `VITE_GEMINI_API_KEY` | Client-side Gemini API key for fallback operations |
| `VITE_YOUTUBE_API_KEY` | Optional YouTube Data API v3 key |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID |
| `VITE_MICROSOFT_CLIENT_ID` | Microsoft Azure OAuth Client ID |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID for client checkout SDK |

---

## Technical Highlights

- **React 19 Functional Architecture**: Implements modern React 19 paradigms with hooks and Context API for global state management.
- **Tailwind CSS 4**: Utilizes the modern Vite-integrated Tailwind CSS engine with dark mode styling.
- **KaTeX and Markdown Parsing**: Combines `react-markdown`, `remark-math`, and `rehype-katex` to render inline and block scientific formulas with zero rendering lag.
- **Responsive Dashboard Layout**: Dynamic sidebar with collapsible mobile drawers, device management dialogs, and real-time usage quotas.
- **PDF Generation**: Direct browser-rendered PDF reports utilizing `jspdf` and `html2canvas` without requiring backend rendering engines.
