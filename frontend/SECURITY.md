# Security Guide

## 🔒 Environment Variable Security

This project uses a secure environment variable system to prevent server-only secrets from being exposed to the client.

### ✅ Safe to Commit

- `src/lib/env-constants.ts` - Contains only variable names, not values
- `.env.example` - Template file with placeholder values
- All source code files

### ❌ Never Commit

- `.env.local` - Contains actual environment variable values
- `.env` - Contains actual environment variable values
- Any file containing actual API keys or secrets

### 🛡️ Security Features

1. **Environment Variable Constants**: All environment variable names are defined in `src/lib/env-constants.ts`
2. **Client Bundle Protection**: Security script checks that server-only variables never appear in client bundle
3. **Type Safety**: Environment variables are accessed through typed interfaces
4. **Git Protection**: `.gitignore` prevents environment files from being committed

### 🔧 Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your actual values
3. Run `npm run validate-env` to check configuration
4. Run `npm run build` to verify no secrets leak to client

### 🚨 Security Checklist

- [ ] No hardcoded API keys in source code
- [ ] All environment variables use constants from `env-constants.ts`
- [ ] `.env.local` is in `.gitignore`
- [ ] Client bundle contains no server-only secrets
- [ ] Environment validation passes
- [ ] Security script passes

### 🔍 Monitoring

The build process automatically:
- Validates all required environment variables are set
- Checks that no server-only secrets appear in client bundle
- Fails the build if security issues are detected

### 📝 Best Practices

1. **Never hardcode secrets** - Always use environment variables
2. **Use constants** - Reference `ENV_KEYS` instead of hardcoded strings
3. **Validate locally** - Run security checks before committing
4. **Review changes** - Check that new code doesn't expose secrets
5. **Rotate keys** - Regularly rotate API keys and secrets

## 🚨 If You Accidentally Commit Secrets

1. **Immediately rotate** all exposed API keys
2. **Remove from history** using `git filter-branch` or similar
3. **Force push** to remove from remote repository
4. **Review access logs** for any unauthorized usage
5. **Update documentation** to prevent future incidents
