# Dependency Cleanup Plan

**Date:** 2025-12-06
**Project:** NPDI Application
**Version:** 1.2.0
**Analysis Tool:** depcheck + manual verification

---

## Executive Summary

This document outlines the results of a dependency audit for the NPDI Application and provides a concrete action plan to remove unused dependencies and fix missing ones. The audit identified **4 unused client dependencies** and **1 missing dependency**, with all server dependencies being properly utilized.

**Impact:**
- Reduce bundle size by removing unused packages
- Improve installation time
- Reduce security surface area
- Fix missing dependency warning in ESLint config

---

## Audit Results

### Server Dependencies (Root Package)

All server dependencies are actively used. No cleanup required.

**Status:** ✅ Clean

### Client Dependencies

#### Unused Production Dependencies

| Package | Current Version | Status | Found In Code | Recommendation |
|---------|----------------|--------|---------------|----------------|
| `@headlessui/react` | ^2.2.9 | UNUSED | ❌ No imports found | **REMOVE** |
| `clsx` | ^2.1.1 | UNUSED | ❌ No imports found | **REMOVE** |
| `date-fns` | ^4.1.0 | UNUSED | ❌ No imports found | **REMOVE** |
| `tailwind-merge` | ^3.4.0 | UNUSED | ❌ No imports found | **REMOVE** |

#### Unused Dev Dependencies

| Package | Current Version | Status | Reason | Recommendation |
|---------|----------------|--------|--------|----------------|
| `@types/react-dom` | ^19.2.3 | UNUSED | TypeScript types, but project uses JavaScript | **REMOVE** |

#### Missing Dependencies

| Package | Required By | Current Status | Recommendation |
|---------|-------------|----------------|----------------|
| `@eslint/js` | `client/eslint.config.js:1` | Missing but used | **ADD** as devDependency |

#### False Positives (Verified as Used)

These packages were flagged by depcheck but are actually required:

| Package | Reason Used |
|---------|-------------|
| `@tailwindcss/postcss` | Used in `postcss.config.js:3` for Tailwind CSS v4 |
| `postcss` | Peer dependency of @tailwindcss/postcss, used by Vite |
| `tailwindcss` | Imported in `src/styles/index.css:1` via `@import "tailwindcss"` |

**Note:** These packages use Tailwind CSS v4's new architecture with PostCSS integration.

---

## Detailed Analysis

### 1. @headlessui/react (REMOVE)

**Current Version:** ^2.2.9
**Size:** ~100KB (minified)

**Analysis:**
- Grep search found no imports of `@headlessui/react` in any source files
- Likely installed for UI components (modals, dropdowns) but never used
- No references in JSX files

**Recommendation:** ✅ Safe to remove

### 2. clsx (REMOVE)

**Current Version:** ^2.1.1
**Size:** ~2KB (minified)

**Analysis:**
- Utility for conditional className merging
- No imports found in codebase
- Likely installed for className utilities but never used

**Recommendation:** ✅ Safe to remove

### 3. date-fns (REMOVE)

**Current Version:** ^4.1.0
**Size:** ~300KB (full library, tree-shakeable)

**Analysis:**
- Date formatting and manipulation library
- No imports found in any component
- No date formatting utilities being used

**Recommendation:** ✅ Safe to remove

**Note:** If date formatting is needed in the future, consider re-adding or using native `Intl.DateTimeFormat` API.

### 4. tailwind-merge (REMOVE)

**Current Version:** ^3.4.0
**Size:** ~15KB (minified)

**Analysis:**
- Utility for merging Tailwind CSS classes intelligently
- No imports found in codebase
- Common pattern: `import { twMerge } from 'tailwind-merge'` - not found

**Recommendation:** ✅ Safe to remove

### 5. @types/react-dom (REMOVE)

**Current Version:** ^19.2.3
**Size:** ~1KB (types only)

**Analysis:**
- TypeScript type definitions for React DOM
- Project uses JavaScript (`.jsx` files), not TypeScript (`.tsx`)
- No TypeScript configuration found
- Types not utilized

**Recommendation:** ✅ Safe to remove

**Note:** If TypeScript is added in the future, this can be re-installed.

### 6. @eslint/js (ADD)

**Current Location:** Missing
**Required Version:** Latest stable

**Analysis:**
- Used in `client/eslint.config.js:1`: `import js from '@eslint/js'`
- Provides recommended ESLint configurations
- Currently missing, causing import resolution warnings

**Recommendation:** ⚠️ Must add as devDependency

---

## Implementation Plan

### Phase 1: Add Missing Dependency

**Priority:** HIGH (fixes error)

```bash
cd client
npm install --save-dev @eslint/js
```

**Verification:**
```bash
cd client
npm run lint
```

Expected: No import resolution errors

### Phase 2: Remove Unused Dependencies

**Priority:** MEDIUM (optimization)

```bash
cd client
npm uninstall @headlessui/react clsx date-fns tailwind-merge @types/react-dom
```

**Expected Changes to `client/package.json`:**

**Before:**
```json
{
  "dependencies": {
    "@headlessui/react": "^2.2.9",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "tailwind-merge": "^3.4.0",
    ...
  },
  "devDependencies": {
    "@types/react-dom": "^19.2.3",
    ...
  }
}
```

**After:**
```json
{
  "dependencies": {
    // Above packages removed
    ...
  },
  "devDependencies": {
    "@eslint/js": "^9.x.x",  // Added
    // @types/react-dom removed
    ...
  }
}
```

### Phase 3: Verification & Testing

**Run Full Test Suite:**
```bash
# Install dependencies
cd client
npm install

# Run linting
npm run lint

# Build the project
npm run build

# Run dev server (manual verification)
npm run dev
```

**Checklist:**
- [ ] No installation warnings
- [ ] Linting passes without errors
- [ ] Build completes successfully
- [ ] Application runs in dev mode
- [ ] No console errors in browser
- [ ] All UI components render correctly
- [ ] Tailwind CSS styles work properly

### Phase 4: Documentation Update

Update existing documentation to reflect dependency changes:

1. Update `docs/security/DEPENDENCY_SECURITY_ASSESSMENT.md`:
   - Remove references to unused packages
   - Add note about cleanup performed
   - Update dependency inventory tables

2. Add cleanup note to this document or commit message

---

## Expected Benefits

### Bundle Size Reduction

| Package | Estimated Size | Type |
|---------|---------------|------|
| `@headlessui/react` | ~100KB | Production |
| `clsx` | ~2KB | Production |
| `date-fns` | ~300KB (potential) | Production |
| `tailwind-merge` | ~15KB | Production |
| `@types/react-dom` | ~1KB (dev only) | Development |

**Total Production Bundle Reduction:** ~417KB (before minification/compression)

**Note:** Actual reduction depends on tree-shaking and compression. Expected real-world impact: ~50-100KB after minification and gzip.

### Security Benefits

- Fewer dependencies to monitor for vulnerabilities
- Reduced attack surface
- Simplified dependency updates

### Maintenance Benefits

- Clearer dependency graph
- Faster `npm install` times
- Reduced confusion about available utilities

---

## Risks & Mitigation

### Risk 1: False Negative Detection

**Risk:** depcheck might not detect dynamic imports or unconventional usage patterns.

**Mitigation:**
- Manual grep verification performed for each package
- Full build and test after removal
- Version control allows easy rollback

**Status:** ✅ Low risk - manual verification completed

### Risk 2: Build Tool Dependencies

**Risk:** Some packages might be used by build tools (Vite, PostCSS) without direct imports.

**Mitigation:**
- Verified build configuration files
- Confirmed Tailwind-related packages are required
- Test build process after removal

**Status:** ✅ Mitigated - build dependencies verified

### Risk 3: Future Feature Breakage

**Risk:** Removing packages that might be needed for incomplete features.

**Mitigation:**
- Git history preserves package.json versions
- Packages can be easily re-installed if needed
- Grep search showed no commented-out code using these packages

**Status:** ✅ Low risk - no incomplete features found

---

## Rollback Plan

If issues arise after removal:

### Quick Rollback (Git)
```bash
cd client
git checkout HEAD -- package.json package-lock.json
npm install
```

### Selective Restoration
```bash
cd client
npm install <package-name>@<version>
```

### Package Version Reference

Original versions (for restoration):
- `@headlessui/react@^2.2.9`
- `clsx@^2.1.1`
- `date-fns@^4.1.0`
- `tailwind-merge@^3.4.0`
- `@types/react-dom@^19.2.3`

---

## Long-term Recommendations

### 1. Regular Dependency Audits

Run dependency audit quarterly:
```bash
npx depcheck --json
npm audit
```

### 2. Automated Dependency Updates

Consider implementing:
- Dependabot for automated security updates
- Renovate for automated dependency updates
- npm audit in CI/CD pipeline

### 3. Dependency Addition Policy

Before adding new dependencies:
1. Verify the package is actively maintained
2. Check bundle size impact
3. Evaluate if native browser APIs can be used instead
4. Document why the dependency is needed

### 4. Build Size Monitoring

Implement bundle size monitoring:
```bash
npm run build
# Check dist/ directory sizes
```

Consider tools like:
- `vite-bundle-visualizer`
- `webpack-bundle-analyzer` (if migrating from Webpack)

---

## Execution Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Add @eslint/js | 5 min | None |
| 2 | Remove unused packages | 5 min | Phase 1 complete |
| 3 | Run verification tests | 15 min | Phase 2 complete |
| 4 | Update documentation | 10 min | Phase 3 complete |

**Total Estimated Time:** 35 minutes

**Recommended Execution:** Single session to ensure consistency

---

## Approval & Sign-off

### Technical Review

- [ ] Dependency audit results reviewed
- [ ] Removal list verified
- [ ] Test plan approved

### Execution

- [ ] Phase 1 completed (add @eslint/js)
- [ ] Phase 2 completed (remove unused)
- [ ] Phase 3 completed (verification)
- [ ] Phase 4 completed (documentation)

### Post-Execution

- [ ] No errors in production
- [ ] Build process working
- [ ] UI functioning correctly
- [ ] Commit and push changes

---

## References

- **Depcheck Documentation:** https://github.com/depcheck/depcheck
- **npm audit:** https://docs.npmjs.com/cli/v8/commands/npm-audit
- **Tailwind CSS v4:** https://tailwindcss.com/blog/tailwindcss-v4-alpha
- **Existing Security Assessment:** `/docs/security/DEPENDENCY_SECURITY_ASSESSMENT.md`

---

## Appendix: Command Reference

### Audit Commands
```bash
# Run depcheck on server
npx depcheck --json

# Run depcheck on client
cd client && npx depcheck --json

# Check for security vulnerabilities
npm audit
cd client && npm audit
```

### Cleanup Commands
```bash
# Add missing dependency
cd client && npm install --save-dev @eslint/js

# Remove unused dependencies
cd client && npm uninstall @headlessui/react clsx date-fns tailwind-merge @types/react-dom

# Verify no broken dependencies
npm ls
cd client && npm ls
```

### Verification Commands
```bash
# Full build and test
npm run setup
npm run build
npm run lint

# Run development server
npm run dev
```

---

**Document Status:** Ready for Implementation
**Next Action:** Execute Phase 1 (Add @eslint/js)
**Prepared By:** Dependency Audit - Claude Code
**Last Updated:** 2025-12-06
