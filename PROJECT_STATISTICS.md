# NPDI Application - Project Statistics

*Generated: 2025-11-23*

## Lines of Code (Existing Deployment)

### Total Code Lines: ~39,200 lines

**Breakdown by Component:**
- **Server-side JavaScript:** 16,945 lines (63 files)
- **Client-side JSX/JS:** 21,681 lines (45 files)
- **CSS:** 91 lines (2 files)
- **Configuration (JSON):** 693,513 lines (11 files, mostly package-lock.json)

### File Count: 220 files (excluding node_modules)

**By Type:**
- 75 JavaScript files (.js)
- 40 JSX files (.jsx)
- 44 Markdown files (.md)
- 11 JSON files (.json)
- 2 CSS files (.css)
- Other assets (SVG, PNG, SH, etc.)

---

## Storage (Current Development Environment)

### Total Project Size: 602 MB

**Detailed Breakdown:**

| Component | Size |
|-----------|------|
| Server dependencies (node_modules) | 156 MB |
| Client dependencies (client/node_modules) | 169 MB |
| Client source code (client/src) | 28 MB |
| Client build (client/dist) | 15 MB |
| Git repository (.git) | 11 MB |
| Server source code (server) | 760 KB |
| Other files (configs, docs, data) | ~221 MB |

---

## Production Deployment Estimate

### Estimated Production Size: 200-250 MB (uncompressed)

**Required in Production:**
- Production dependencies (node_modules): ~180-220 MB
- Client build (optimized): 15 MB
- Server source code: 760 KB
- Configuration files: 388 KB

**Optimized Sizes:**
- **Client build compressed (gzipped):** ~2.2 MB for network transfer
- **Docker Container Image:** 300-400 MB
  - Includes Node.js base image
  - Production dependencies
  - Application code and build
- **Transferred/Compressed:** 50-100 MB when deploying

### Not Required in Production:
- Development dependencies: 325 MB
- Git repository: 11 MB
- Client source (replaced by build): 28 MB
- Test files, development configs: ~1 MB

---

## Summary

The NPDI application is a moderate-sized full-stack application with approximately **39,000 lines of actual code**.

- **Development Environment:** 602 MB
- **Production Deployment:** 200-250 MB (excluding database)
- **Client Assets (compressed):** 2.2 MB for efficient network delivery
- **Source Code:** Under 30 MB (compact and well-organized)

The majority of the size comes from Node.js dependencies, which is typical for modern JavaScript applications. The actual source code written is lean and efficient.

---

## Technology Stack Size Impact

**Dependencies:**
- Total development packages: 23,611 files in node_modules
- Production packages: ~12 core packages (server-side)
- Client production build: Optimized and tree-shaken to 15 MB

**Optimization Opportunities:**
- Client assets compress to 15% of original size (15 MB → 2.2 MB)
- Production deployment removes 365 MB of development overhead
- Docker multi-stage builds can further reduce container size
