# Security Policy

## Supported Versions

The following table indicates the support status for versions of SelfRanker:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | Yes                |
| < 1.0.0 | No                 |

---

## Reporting a Vulnerability

The SelfRanker team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose any findings.

### Disclosure Protocol

If you discover a security vulnerability in this project, please **do not** open a public issue or discuss it in public channels. Instead, submit a detailed report directly to the maintainers:

- **Email**: contact@gauravgoswami.me
- **Subject**: `[SECURITY VULNERABILITY] SelfRanker - <Summary>`

### Report Details

To help us triage and remediate the issue swiftly, please include the following details in your report:

1. **Description**: Clear description of the vulnerability and its potential impact.
2. **Steps to Reproduce**: Step-by-step instructions or minimal Proof of Concept (PoC).
3. **Affected Endpoints/Files**: Specific routes, controllers, or frontend modules affected.
4. **Environment**: Operating system, Node.js version, browser, and deployment configurations used during discovery.
5. **Mitigation**: Any suggested patch or remediation steps if available.

### Response Timeline

- **Initial Acknowledgment**: Within 48 hours of report submission.
- **Triage and Assessment**: Within 5 business days.
- **Resolution and Patch Release**: Timeframe will depend on complexity and severity, with priority given to critical and high-severity findings.

### Scope

In-scope areas include:
- Authentication and session handling bypasses
- Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF)
- Server-Side Request Forgery (SSRF) and Remote Code Execution (RCE)
- Insecure direct object references (IDOR)
- Sensitive credential leakage or improper authorization checks

Out-of-scope issues include:
- Rate limiting without demonstrable severe impact on resource exhaustion
- Social engineering attacks against maintainers or users
- Denial of Service attacks requiring volumetric traffic flooding
