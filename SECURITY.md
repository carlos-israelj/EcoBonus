# Security Policy

## Supported Versions

Currently supporting:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** create public GitHub issues for security vulnerabilities.

Instead, please report security vulnerabilities to:
- Email: security@ecobonus (coming soon)
- GitHub Security Advisory: https://github.com/carlos-israelj/EcoBonus/security/advisories/new

### What to include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

### Response timeline:

- Initial response: Within 48 hours
- Status update: Within 7 days
- Fix deployment: Depends on severity (critical issues within 24-48 hours)

## Security Best Practices

### Smart Contracts

- All contracts audited before mainnet deployment
- Initialize functions protected against re-initialization
- Admin functions restricted with proper authentication
- Token transfers verified on-chain

### API Keys & Secrets

- Never commit secrets to git
- Use environment variables for all sensitive data
- Rotate keys regularly
- Use `.env.example` as template, not actual values

### User Data

- No personal data stored on-chain
- Location data rounded to protect privacy
- Photo evidence stored on IPFS with user consent
- Wallet addresses are pseudonymous

## Acknowledgments

We appreciate responsible disclosure and will credit security researchers
who help improve EcoBonus security (unless they prefer to remain anonymous).
