# SelfRanker

SelfRanker is an AI-powered adaptive learning, self-assessment, and performance tracking platform engineered for students and professionals preparing for competitive examinations and technical interviews. The platform combines Google Gemini generative intelligence with real-time performance analytics, customized study roadmaps, gamified motivation loops, and multi-device session governance.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Modules and Capabilities](#key-modules-and-capabilities)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Installation and Local Setup](#installation-and-local-setup)
- [API Reference](#api-reference)
- [Database Schema Design](#database-schema-design)
- [Subscription Tiers and Limits](#subscription-tiers-and-limits)
- [Security Architecture](#security-architecture)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security Policy](#security-policy)
- [License](#license)

---

## Overview

Modern competitive exam preparation requires targeted diagnostics, personalized curriculum roadmaps, and continuous self-assessment. SelfRanker addresses these demands through an integrated full-stack solution:

- Generates structured, exam-calibrated study notes with mathematical notation rendering.
- Conducts timed, adaptive multiple-choice quizzes with detailed pedagogical explanations.
- Evaluates descriptive, open-ended answers against automated rubrics and model answers.
- Synchronizes video instruction with multilingual, real-time AI study notes.
- Delivers an interactive 24/7 AI tutor capable of step-by-step conceptual problem solving.
- Synthesizes personalized multi-day learning schedules with verified external learning links.
- Tracks mastery across subjects using interactive visual analytics and gamified progression mechanics.
- Enforces strict multi-device session concurrency and subscription-based usage limits.

---

## System Architecture

The following diagram illustrates the architectural layout and data flow across client, application server, database, and external third-party service layers:

```mermaid
graph TD
    Client[React 19 / Vite Single Page Application]
    Server[Node.js / Express Application Server]
    DB[(MongoDB Atlas / Local Instance)]
    
    Gemini[Google Gemini 2.5 Flash API]
    YouTube[YouTube Data / yt-search Engine]
    Razorpay[Razorpay Payment Gateway]
    Cloudinary[Cloudinary Asset Storage]
    SMTP[Nodemailer / SMTP Mail Server]
    OAuth[OAuth Providers: Google / GitHub / Microsoft]

    Client -->|HTTPS / REST / JWT| Server
    Server -->|Mongoose ODM| DB
    Server -->|Prompt Engineering & Inference| Gemini
    Server -->|Video Query Extraction| YouTube
    Server -->|Order Creation & Signature Validation| Razorpay
    Server -->|Avatar Image Uploads| Cloudinary
    Server -->|Registration & Reset OTP Delivery| SMTP
    Server -->|Identity Verification| OAuth
```

---

## Key Modules and Capabilities

### 1. AI Study Notes Engine
- Generates comprehensive revision summaries, formula sheets, and deep-dive documentation for targeted topics and competitive exam standards.
- Employs LaTeX math parsing with inline (`$...$`) and block (`$$...$$`) KaTeX formatting.
- Features formatted PDF export capabilities via HTML canvas rendering and printable layouts.

### 2. Adaptive Multiple-Choice Quiz Engine
- Synthesizes topic-focused multiple-choice questions according to configured difficulty levels (Easy, Medium, Hard).
- Provides live countdown timers, option selection tracking, instant scoring, question-by-question rationales, and XP increments.

### 3. Descriptive Q&A Assessment
- Generates subjective examination questions with key grading points and canonical model solutions.
- Analyzes candidate text submissions using semantic evaluation, outputting an overall percentage score (0-100) alongside constructive diagnostic feedback.

### 4. Supreme Learning Mode
- Combines embedded YouTube educational video playback with synchronized multilingual AI notes generation.
- Allows candidates to simultaneously consume audiovisual lectures and structured textual outlines in their preferred language.

### 5. Conversational AI Tutor
- Real-time conversational mentor with chat memory tracking.
- Resolves academic inquiries, provides derivations, suggests problem-solving strategies, and formats mathematical proofs.

### 6. AI Learning Roadmaps
- Constructs customized, multi-day learning paths tailored to candidate target dates and curriculum scope.
- Automatically validates external resource hyperlinks using background HEAD/GET verification routines to eliminate 404 errors.
- Persists task completion states, daily milestones, and roadmap archival workflows.

### 7. Performance Analytics and Visualization
- Visualizes candidate trajectories via Recharts charts: score trends over time, subject mastery distributions, and weekly study session intensity.
- Maintains automated activity logs across quiz executions, roadmap milestones, and study sessions.

### 8. Gamification and Global Leaderboard
- Experience point (XP) engine with automated level calculation formulas.
- Tracks achievement milestones, study streaks, and rank standings across the authenticated user registry.

### 9. Multi-Device Session Governance
- Identifies connecting hardware, operating system, browser engine, and IP origin from incoming HTTP request metadata.
- Enforces strict concurrent session boundaries (1 device for Free tier, 2 devices for Premium tier).
- Provides interactive device eviction prompts when concurrent limits are encountered.

### 10. Subscription and Payment Integration
- Integrates Razorpay payment gateway workflows for premium tier upgrades.
- Cryptographically validates payment signatures using HMAC SHA-256 before granting premium entitlements.
- Automated usage quota resets for daily operations (midnight UTC) and monthly allocations (first day of calendar month).

---

## Technology Stack

### Frontend
- **Framework**: React 19 (React DOM 19)
- **Build Tooling**: Vite 8
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4 with custom dark mode theming
- **Icons**: Lucide React
- **Data Visualization**: Recharts 3
- **Mathematical Rendering**: KaTeX, remark-math, rehype-katex, react-markdown
- **Document Generation**: jsPDF, html2canvas

### Backend
- **Runtime Environment**: Node.js (ES Modules)
- **Web Framework**: Express 4
- **Database Layer**: MongoDB with Mongoose 8
- **Security Middleware**: Helmet, CORS
- **Authentication**: JSON Web Tokens (jsonwebtoken), bcryptjs, Google Auth Library
- **Generative AI**: Google Generative AI SDK (`@google/generative-ai` with Gemini 2.5 Flash)
- **Payment Processing**: Razorpay Node.js SDK, Node Crypto
- **Media and File Processing**: Cloudinary SDK, Multer
- **Email Transport**: Nodemailer
- **Video Metadata Engine**: yt-search, Axios

---

## Repository Structure

```
SelfRanker/
|-- backend/
|   |-- models/
|   |   |-- Analytics.js             # Performance metrics, score history, and study activity
|   |   |-- LearningPath.js          # Multi-day study roadmap schema and task statuses
|   |   |-- PendingRegistration.js   # Unverified user registrations awaiting OTP verification
|   |   |-- User.js                  # User schema, credentials, sessions, tiers, and usage
|   |-- routes/
|   |   |-- ai.js                    # Gemini endpoints: notes, quiz, QA, roadmaps, tutor
|   |   |-- auth.js                  # Authentication, OAuth, OTP verification, sessions
|   |   |-- data.js                  # Analytics data, action logging, leaderboard, avatars
|   |   |-- payment.js               # Razorpay order generation and signature verification
|   |   |-- usage.js                 # Quota checking and usage tracking increments
|   |-- authMiddleware.js            # JWT verification and user payload extraction
|   |-- db.js                        # MongoDB Mongoose connection handler
|   |-- usageLimits.js               # Tier definitions, quota logic, and reset handlers
|   |-- server.js                    # Express application entry point and middleware pipeline
|   |-- package.json
|   |-- .env.example
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- assets/                  # Static assets and graphic resources
|   |   |-- components/
|   |   |   |-- dashboard/           # Sidebar, DashboardHeader, navigation elements
|   |   |   |-- DeviceLimitDialog.jsx# Modal for managing device session conflicts
|   |   |   |-- Navbar.jsx           # Global application top navigation
|   |   |   |-- UpgradeModal.jsx     # Subscription upgrade and Razorpay checkout modal
|   |   |   |-- UsageBadge.jsx       # Visual indicator for remaining quota balances
|   |   |-- context/
|   |   |   |-- UsageContext.jsx     # Global provider for tracking real-time feature limits
|   |   |-- hooks/
|   |   |   |-- useUsageLimits.js    # Custom React hook for quota inspection
|   |   |-- pages/
|   |   |   |-- dashboard/           # AINotes, AIQuiz, AIQA, SupremeLearning, AITutor,
|   |   |   |                        # Gamification, Analytics, LearningPath, AccountSettings
|   |   |   |-- Dashboard.jsx        # Dashboard layout shell and sub-route manager
|   |   |   |-- ForgotPassword.jsx   # Password reset request and code validation
|   |   |   |-- GetStarted.jsx       # User registration with email OTP flow
|   |   |   |-- GitHubCallback.jsx   # OAuth authorization code landing handler
|   |   |   |-- Home.jsx             # Public marketing landing page
|   |   |   |-- NotFound.jsx         # 404 error page
|   |   |   |-- SignIn.jsx           # User authentication page
|   |   |-- utils/
|   |   |   |-- api.js               # Centralized HTTP request utility with token handling
|   |   |   |-- gemini.js            # Frontend AI fallback helper
|   |   |   |-- logoBase64.js        # Base64 brand image assets
|   |   |   |-- pdfExport.js         # Client-side printable PDF generation logic
|   |   |-- App.jsx                  # Root component, theme state, and top-level router
|   |   |-- index.css                # Global styles and Tailwind directives
|   |   |-- main.jsx                 # React DOM mount point
|   |-- index.html
|   |-- vite.config.js
|   |-- vercel.json                  # SPA routing rules for production hosting
|   |-- package.json
|   |-- .env.example
|-- .gitignore
|-- CODE_OF_CONDUCT.md
|-- CONTRIBUTING.md
|-- LICENSE
|-- README.md
|-- SECURITY.md
```

---

## Prerequisites

Before setting up SelfRanker locally, ensure the following software is installed:

- **Node.js**: Version 18.18.0 or higher
- **npm**: Version 9.0.0 or higher
- **MongoDB**: Local MongoDB instance (version 6.0+) or an active MongoDB Atlas cluster
- **Git**: Version 2.30+

You will also require API credentials for:
- Google AI Studio (Gemini API Key)
- Razorpay Dashboard (Test or Live Key ID and Secret)
- Cloudinary (Cloud Name, API Key, API Secret)
- Google Cloud Console, GitHub Developer Portal, or Microsoft Azure (for OAuth flows)
- SMTP Mail Account (such as Gmail with App Password)

---

## Environment Configuration

Both the `backend` and `frontend` directories contain dedicated `.env.example` templates.

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Example / Default |
| -------- | ----------- | ----------------- |
| `PORT` | HTTP port on which the Express server listens | `3000` |
| `FRONTEND_URL` | Origin URL of the frontend application | `http://localhost:5173` |
| `BACKEND_URL` | Base URL of the backend application | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection connection string | `mongodb+srv://user:pass@cluster.mongodb.net/selfranker` |
| `JWT_SECRET` | Cryptographic secret for signing JWT tokens | `generate_via_crypto_random_bytes` |
| `GEMINI_API_KEY` | Google Gemini API access key | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `secret_key_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud identifier | `cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API access key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API access secret | `secret_string` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `client_secret` |
| `GITHUB_CLIENT_ID` | GitHub OAuth application Client ID | `gh_client_id` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth application Client Secret | `gh_client_secret` |
| `MICROSOFT_CLIENT_ID` | Microsoft Azure Application Client ID | `ms_client_id` |
| `MICROSOFT_CLIENT_SECRET` | Microsoft Azure Application Secret | `ms_client_secret` |
| `SMTP_HOST` | Outgoing SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP authentication username | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP authentication password or App Password | `app_password` |
| `SMTP_FROM` | Optional outgoing sender email header | `no-reply@selfranker.com` |

### Frontend Environment Variables (`frontend/.env`)

| Variable | Description | Example / Default |
| -------- | ----------- | ----------------- |
| `VITE_API_BASE_URL` | Target base URL for the backend API | `http://localhost:3000/api` |
| `VITE_GEMINI_API_KEY` | Gemini API key for client-side fallbacks | `AIzaSy...` |
| `VITE_YOUTUBE_API_KEY` | Optional YouTube Data API v3 key | `AIzaSy...` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID for client auth | `client_id.apps.googleusercontent.com` |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth Client ID for OAuth redirects | `gh_client_id` |
| `VITE_MICROSOFT_CLIENT_ID` | Microsoft OAuth Client ID | `ms_client_id` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Key ID for client checkout SDK | `rzp_test_...` |

---

## Installation and Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/itzgauravgoswami/SelfRankerNew.git
cd SelfRankerNew
```

### 2. Configure and Run Backend

```bash
# Navigate to the backend directory
cd backend

# Install project dependencies
npm install

# Create environment configuration
cp .env.example .env

# Populate required values in .env using your editor

# Start backend server in development mode
npm run dev
```

The server will be available at `http://localhost:3000`.

### 3. Configure and Run Frontend

In a separate terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install project dependencies
npm install

# Create environment configuration
cp .env.example .env

# Populate required values in .env using your editor

# Start Vite development server
npm run dev
```

The frontend application will be accessible at `http://localhost:5173`.

---

## API Reference

All protected endpoints require an `Authorization: Bearer <JWT>` header and an optional `X-Device-Id: <UUID>` header for session identification.

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Protection | Description |
| ------ | -------- | ---------- | ----------- |
| `POST` | `/send-register-otp` | Public | Dispatches a 6-digit verification code to the recipient email. |
| `POST` | `/verify-register-otp` | Public | Validates OTP and initializes new user account. |
| `POST` | `/social-register` | Public | Registers a user authenticated via Google, GitHub, or Microsoft. |
| `POST` | `/login` | Public | Authenticates credentials and returns a signed JWT. |
| `POST` | `/google` | Public | Validates Google ID token and returns session JWT. |
| `POST` | `/google-token` | Public | Verifies Google OAuth access token flow. |
| `POST` | `/github` | Public | Exchanges GitHub authorization code for user profile and token. |
| `GET` | `/github/callback` | Public | Handles OAuth redirect flow for GitHub login. |
| `GET` | `/google/callback` | Public | Handles OAuth redirect flow for Google login. |
| `GET` | `/microsoft/callback` | Public | Handles OAuth redirect flow for Microsoft login. |
| `POST` | `/connect-google` | Protected | Links a Google profile to an existing user account. |
| `POST` | `/disconnect-oauth` | Protected | Unlinks a social authentication provider. |
| `POST` | `/logout` | Protected | Terminates the current device session. |
| `GET` | `/sessions` | Protected | Lists all active hardware/browser sessions for the user. |
| `DELETE` | `/sessions/:sessionId` | Protected | Terminates an individual remote session. |
| `GET` | `/profile` | Protected | Fetches authenticated user profile, stats, and notifications. |
| `POST` | `/profile-update` | Protected | Updates profile information (name, bio, exam goal, avatar). |
| `POST` | `/change-password` | Protected | Updates account password after validating old password. |
| `POST` | `/forgot-password` | Public | Generates and emails a password reset verification code. |
| `POST` | `/reset-password` | Public | Verifies reset code and updates account password. |
| `DELETE` | `/delete-account` | Protected | Irrevocably deletes user account, analytics, and roadmaps. |
| `POST` | `/add-xp` | Protected | Awards experience points and computes level upgrades. |
| `PUT` | `/notification-preferences` | Protected | Configures email and in-app notification preferences. |
| `POST` | `/notifications/read` | Protected | Marks all user notifications as read. |
| `POST` | `/notifications/:id/read` | Protected | Marks a specific notification as read. |

### Generative AI Endpoints (`/api/ai`)

| Method | Endpoint | Protection | Description |
| ------ | -------- | ---------- | ----------- |
| `GET` | `/youtube-search` | Protected | Queries YouTube and returns the top matching video. |
| `POST` | `/notes` | Protected | Generates structured Markdown notes with LaTeX mathematics. |
| `POST` | `/quiz` | Protected | Generates an array of multiple-choice questions with answers. |
| `POST` | `/qa` | Protected | Generates subjective questions with model answers and rubrics. |
| `POST` | `/supreme-notes` | Protected | Generates multilingual advanced revision notes for video study. |
| `POST` | `/learning-path` | Protected | Generates and saves a multi-day roadmap with validated resources. |
| `POST` | `/chat-tutor` | Protected | Context-aware interactive conversation with AI tutor. |
| `POST` | `/score-qa` | Protected | Grades descriptive submissions on a 0-100 scale with feedback. |

### Analytics and Data Endpoints (`/api/data`)

| Method | Endpoint | Protection | Description |
| ------ | -------- | ---------- | ----------- |
| `GET` | `/analytics` | Protected | Returns quiz performance history, weekly activity, and subject progress. |
| `POST` | `/log-action` | Protected | Logs completed study actions, updates metrics, and awards XP. |
| `GET` | `/leaderboard` | Protected | Returns the global top-ranked user registry ordered by XP. |
| `GET` | `/learning-paths` | Protected | Fetches all active study roadmaps for the authenticated user. |
| `POST` | `/learning-paths/:id/update` | Protected | Updates milestone/task completion or archive status. |
| `DELETE` | `/learning-paths/:id` | Protected | Permanently removes a learning path. |
| `POST` | `/avatar` | Protected | Uploads profile picture to Cloudinary and updates user profile. |

### Payment Endpoints (`/api/payment`)

| Method | Endpoint | Protection | Description |
| ------ | -------- | ---------- | ----------- |
| `POST` | `/order` | Protected | Creates a new Razorpay payment order for the Premium plan. |
| `POST` | `/verify` | Protected | Validates Razorpay HMAC SHA-256 signature and activates Premium tier. |

### Usage Governance Endpoints (`/api/usage`)

| Method | Endpoint | Protection | Description |
| ------ | -------- | ---------- | ----------- |
| `GET` | `/status` | Protected | Returns real-time quota status and reset timestamps across all features. |
| `POST` | `/notes/increment` | Protected | Checks and increments notes generation quota. |
| `POST` | `/quiz/increment` | Protected | Checks and increments quiz generation quota. |
| `POST` | `/qa/increment` | Protected | Checks and increments descriptive Q&A generation quota. |
| `POST` | `/supreme/increment` | Protected | Checks and increments supreme learning quota. |

---

## Database Schema Design

### User Model (`backend/models/User.js`)
- `name` (String, required): Full candidate name.
- `email` (String, required, unique, indexed): Primary identifier.
- `password` (String, conditional): Hashed via bcrypt (omitted for social OAuth users).
- `googleId`, `githubId`, `microsoftId` (String): External provider identifiers.
- `xp` (Number, default 0): Accumulated experience points.
- `level` (Number, default 1): Calculated user level based on XP thresholds.
- `avatarUrl` (String): Cloudinary asset URL.
- `bio` (String): User profile summary.
- `examGoal` (String): Primary target examination (e.g., GATE, JEE, UPSC, Placement).
- `isPremium` (Boolean, default false): Premium entitlement flag.
- `subscription` (Object): Subscription metadata (`type`, `status`, `expiresAt`).
- `usage` (Object): Usage tracking counters and reset dates (`notesDownloadCount`, `quizCountToday`, `qaCountToday`, `supremeCountToday`).
- `sessions` (Array of SessionSchema): Active hardware sessions (`sessionId`, `deviceId`, `deviceName`, `browser`, `os`, `ip`, `loginTime`, `lastActive`).
- `resetCode`, `resetCodeExpires`: Password recovery tokens.
- `notificationPreferences`: Boolean toggles for streak reminders, quiz results, digests, and rank changes.
- `notifications`: In-app notification queue (`title`, `message`, `type`, `read`, `createdAt`).

### Analytics Model (`backend/models/Analytics.js`)
- `userEmail` (String, required, unique, indexed): Associated user reference.
- `quizScores` (Array): Historical assessment results (`date`, `score`, `subject`).
- `weeklyActivity` (Array): Daily study session volume (`day`, `sessions`, `questions`).
- `subjectProgress` (Array): Calculated mastery percentages (`subject`, `progress`, `color`).

### LearningPath Model (`backend/models/LearningPath.js`)
- `id` (String, required, unique): Custom roadmap identifier (`path_<timestamp>`).
- `userEmail` (String, required, indexed): Owner email address.
- `title` (String, required): Curriculum or objective title.
- `overview` (String): Pedagogical scope summary.
- `totalDays` (Number, required): Curriculum duration.
- `milestones` (Array): Key completion checkpoints.
- `days` (Array): Day-by-day task lists, subtopics, and verified external resource links.
- `completedTasks` (Map of Boolean): Real-time tracking of completed curriculum tasks.
- `archived` (Boolean, default false): Visibility and lifecycle toggle.

### PendingRegistration Model (`backend/models/PendingRegistration.js`)
- `name`, `email`, `password`: Temporary credential storage.
- `otp` (String): Six-digit one-time password.
- `otpExpires` (Date): Ephemeral expiration timestamp (10-minute validity window).

---

## Subscription Tiers and Limits

| Capability | Free Tier | Premium Tier |
| ---------- | --------- | ------------ |
| Price | Free | INR 21.00 (One-Time Upgrade) |
| AI Study Notes | 10 per month | Unlimited |
| AI Quizzes | 5 per day | Unlimited |
| AI Descriptive Q&A | 5 per day | Unlimited |
| Supreme Learning | 5 per day | Unlimited |
| Active Learning Paths | Up to 5 roadmaps | Up to 10 roadmaps |
| Concurrent Devices | 1 active device session | 2 active device sessions |
| Support & Features | Standard access | Priority model inference & full feature access |

*Note: Daily usage quotas reset automatically at 00:00:00 UTC. Monthly allocations reset at the start of each calendar month.*

---

## Security Architecture

1. **Authentication and Token Lifecycle**:
   - User authentication issues signed JSON Web Tokens (JWT) containing user ID and email claims with a standard expiration window.
   - Passwords are encrypted before database insertion using `bcryptjs` with high salt rounds.
   - OAuth flows exchange identity assertions directly with provider endpoints (Google, GitHub, Microsoft).

2. **Cross-Origin Resource Sharing (CORS)**:
   - Server origins are restricted to configured production domains and development endpoints.
   - Credentials mode is explicitly enabled for authorized requests, preventing unauthorized cross-origin requests.

3. **HTTP Security Headers**:
   - Integrated with `helmet` middleware to protect against clickjacking, MIME-sniffing, and cross-site scripting (XSS).
   - Cross-Origin Resource Policy (`CORP`) is calibrated for cross-origin assets.

4. **Cryptographic Payment Validation**:
   - Razorpay upgrade requests compute and verify the HMAC SHA-256 signature using `crypto.createHmac` before modifying account permissions.

5. **Resource Link Validation**:
   - External links generated by AI models are actively verified through server-side timeout-governed HEAD/GET checks to filter out invalid or broken URLs before returning responses to clients.

---

## Deployment

### Frontend Deployment (Vercel)

1. Connect the repository to Vercel.
2. Set the Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure environment variables in the Vercel dashboard matching `frontend/.env.example`.
6. Single Page Application (SPA) routing rewrites are automatically governed by `frontend/vercel.json`.

### Backend Deployment (Render / Railway / VPS / Docker)

1. Provision a Node.js 18+ runtime environment.
2. Set the Root Directory to `backend`.
3. Install Command: `npm install`
4. Start Command: `npm start`
5. Configure all environment variables matching `backend/.env.example`.
6. Ensure incoming traffic to port 3000 (or `PORT`) is reverse-proxied with SSL termination (Nginx, Caddy, or platform load balancer).

---

## Contributing

Contributions, bug reports, and enhancements are welcome. Please consult the [Contributing Guidelines](CONTRIBUTING.md) for branch management rules, conventional commit formatting, and testing procedures.

---

## Security Policy

For vulnerability reporting protocols and responsible disclosure procedures, please refer to the [Security Policy](SECURITY.md).

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for complete terms and copyright notices.
