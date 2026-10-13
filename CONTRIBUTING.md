# Contributing to SelfRanker

Thank you for your interest in contributing to SelfRanker. This document outlines the technical standards, workflows, and guidelines required for submitting code contributions and reporting issues.

---

## Code of Conduct

All contributors are expected to uphold the standards outlined in the [Code of Conduct](CODE_OF_CONDUCT.md). Please ensure respectful and professional communication across all project channels.

---

## Getting Started

### Prerequisites

Ensure the following runtimes and tools are installed on your workstation:

- Node.js (v18.x or later)
- npm (v9.x or later)
- MongoDB (v6.x or later local instance or MongoDB Atlas cluster URI)
- Git (v2.x or later)

### Repository Setup

1. Fork the repository on GitHub:
   ```bash
   git clone https://github.com/<your-username>/SelfRankerNew.git
   cd SelfRankerNew
   ```

2. Configure upstream remote:
   ```bash
   git remote add upstream https://github.com/itzgauravgoswami/SelfRankerNew.git
   ```

3. Install dependencies for both services:
   ```bash
   cd backend
   npm install

   cd ../frontend
   npm install
   ```

4. Configure local environment variables by copying `.env.example` templates in both `backend` and `frontend` directories.

---

## Development Workflow

### Branch Strategy

Branch from the `main` branch using standard semantic prefixes:

- `feat/<feature-name>`: New features or functional enhancements
- `fix/<bug-description>`: Bug fixes and issue patches
- `refactor/<module-name>`: Code restructuring without feature modification
- `docs/<document-name>`: Documentation additions or revisions
- `perf/<optimization>`: Performance improvements
- `test/<test-suite>`: Unit, integration, or end-to-end tests

Example:
```bash
git checkout -b feat/pdf-custom-styling
```

### Commit Message Standards

This project adheres to the Conventional Commits specification:

```
<type>(<scope>): <short imperative summary>

[optional body describing detailed motivation and changes]

[optional footer referencing issue numbers, e.g., Closes #42]
```

#### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, whitespace)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, or auxiliary tools

Example:
```
feat(ai): integrate response sanitization for formula rendering
```

---

## Coding Standards

### JavaScript and React Guidelines

- Use ES Modules syntax (`import` / `export`) throughout both backend and frontend codebases.
- Maintain React functional components with appropriate hooks. Avoid class components.
- Maintain strict prop handling and default fallbacks.
- Use Tailwind CSS utility classes aligned with the design tokens. Avoid hardcoded hex colors where theme CSS variables or utility tokens exist.
- Ensure all interactive elements have descriptive accessibility attributes (`aria-label`, semantic tags, and unique DOM IDs where necessary).
- Ensure math formula output is formatted for KaTeX rendering using standard LaTeX syntax (`$...$` and `$$...$$`).

### Backend Guidelines

- Keep routes modular and delegative. Controller logic should remain organized and validate all user inputs prior to processing.
- All protected endpoints must enforce `authMiddleware`.
- Maintain strict database indexing and lean querying practices on Mongoose models.
- Never log sensitive credentials, API keys, or raw JWTs to console or log streams.
- Handle external API errors gracefully with fallback HTTP status codes and structured JSON messages.

---

## Pull Request Submission Process

1. Rebase your feature branch against the latest `upstream/main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Verify code quality and styling:
   ```bash
   cd frontend
   npm run lint
   npm run build
   ```

3. Push your branch to your origin repository:
   ```bash
   git push origin <your-branch-name>
   ```

4. Open a Pull Request against the `main` branch of `itzgauravgoswami/SelfRankerNew`.
5. Complete the PR template with:
   - Detailed description of changes
   - Associated issue numbers
   - Verification and testing steps performed
   - Screenshots or network logs for user interface modifications

---

## Reporting Issues

- **Bug Reports**: Provide steps to reproduce, expected behavior, actual behavior, environment details (browser, OS, Node version), and relevant error logs.
- **Feature Requests**: Outline the business problem, proposed solution, and alternative approaches considered.
- **Security Vulnerabilities**: Do not file public GitHub issues for security vulnerabilities. Review our [Security Policy](SECURITY.md) for confidential reporting channels.
