# SelfRanker Backend

This directory contains the RESTful API application server for the SelfRanker platform, built with Node.js, Express, MongoDB, and the Google Gemini Generative AI SDK.

For complete platform architecture, system diagrams, and full API documentation, refer to the [Root README](../README.md).

---

## Directory Overview

```
backend/
|-- models/
|   |-- Analytics.js             # Mongoose schema for user quiz history and activity
|   |-- LearningPath.js          # Mongoose schema for personalized multi-day roadmaps
|   |-- PendingRegistration.js   # Ephemeral schema for OTP-based email verification
|   |-- User.js                  # User schema: authentication, sessions, quotas, tiers
|-- routes/
|   |-- ai.js                    # Endpoints for Gemini notes, quizzes, Q&A, and tutoring
|   |-- auth.js                  # Authentication, OAuth, session management, OTPs
|   |-- data.js                  # Analytics metrics, leaderboard, learning path operations
|   |-- payment.js               # Razorpay order generation and signature verification
|   |-- usage.js                 # Feature quota status checks and increment operations
|-- authMiddleware.js            # JWT verification and user payload extraction
|-- db.js                        # MongoDB Mongoose connection handler
|-- usageLimits.js               # Tier definitions, quota resets, and usage tracking
|-- server.js                    # Express application entry point and middleware pipeline
|-- package.json
|-- .env.example
```

---

## Available Scripts

In the `backend` directory, you can run the following commands:

### Development Mode

```bash
npm run dev
```

Starts the server with `nodemon` for automatic reload upon file changes. The server binds to port 3000 by default (or the port specified in `PORT`).

### Production Mode

```bash
npm start
```

Starts the server with standard Node.js runtime execution.

---

## Environment Variables

Copy `.env.example` to `.env` in this directory:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| -------- | ----------- | ----------------- |
| `PORT` | HTTP port on which the Express server listens | `3000` |
| `FRONTEND_URL` | Origin URL of the frontend application | `http://localhost:5173` |
| `BACKEND_URL` | Base URL of this backend server | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection URI string | `mongodb+srv://...` |
| `JWT_SECRET` | Cryptographic secret for signing JWT tokens | `crypto.randomBytes(64)` |
| `GEMINI_API_KEY` | Google Gemini API access key | `AIzaSy...` |
| `RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret | `secret_...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `secret_...` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `client_id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `secret_...` |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | `client_id` |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret | `secret_...` |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth Client ID | `client_id` |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth Client Secret | `secret_...` |
| `SMTP_HOST` | Outgoing SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP application password | `app_password` |
| `SMTP_FROM` | Optional sender header email address | `no-reply@selfranker.com` |

---

## Technical Highlights

- **Google Gemini 2.5 Flash**: Optimized prompts with strict JSON schema constraints for multiple-choice quizzes, descriptive Q&A, and milestone roadmap generation.
- **Automated External Link Validation**: Background parallelized HEAD/GET status verification for roadmaps to prevent dead links.
- **Multi-Device Session Engine**: Automatic parsing of User-Agent strings, client device IDs, and IP addresses to enforce concurrent session limits per subscription tier.
- **HMAC SHA-256 Payment Verification**: Cryptographic validation of incoming payment signatures from Razorpay webhooks and client transactions.
- **Enterprise Middleware Pipeline**: Helmet security headers, CORS origin whitelist, JSON/URL-encoded payload parsing, and centralized error handling.
