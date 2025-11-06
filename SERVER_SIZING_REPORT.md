# NPDI Application Server Sizing and Hosting Requirements

**Date:** 2025-10-21
**Application:** MilliporeSigma NPDI Application
**Analysis Type:** Comprehensive Server Sizing Assessment

---

## Executive Summary

**Current Application Size:** 304 MB (development)
**Production Deployment Size:** ~135 MB (application only)
**Recommended Server Space:** 20-50 GB
**Recommended RAM:** 2-4 GB
**Recommended CPU:** 2-4 vCPUs

---

## 1. Current Application Breakdown

### 1.1 Development Environment
```
Total Project Size:              304 MB
├── Server Dependencies:         130 MB (node_modules)
├── Client Dependencies:         169 MB (client/node_modules)
├── Source Code:                 5.7 MB
│   ├── Server Code:            416 KB
│   ├── Client Source:          780 KB
│   ├── Documentation:          160 KB
│   └── Git Repository:         2.2 MB
└── Production Build:           1.2 MB (client/dist)
```

### 1.2 Source Code Metrics
- **Total Files:** 79 source files (39 server + 40 client)
- **Lines of Code:** ~24,939 lines
- **Server Files:** 39 JavaScript files (416 KB)
- **Client Files:** 40 JSX/JS files (780 KB)
- **Documentation:** 14 markdown files (~200 KB)

### 1.3 Production Build Analysis
```
Production Build Size:           1.2 MB
├── JavaScript Bundle:          1.1 MB (compressed)
├── CSS Bundle:                  47 KB
├── Images/Assets:               81 KB
└── HTML:                       722 bytes
```

---

## 2. Production Deployment Size Estimate

### 2.1 Required Application Files

#### Backend (Node.js API Server)
```
Server Source Code:              416 KB
Server Dependencies (prod):      ~80 MB
  - Express.js ecosystem:        ~15 MB
  - Mongoose + MongoDB driver:   ~25 MB
  - Security packages:           ~10 MB
  - Utilities (axios, etc):      ~30 MB
Total Backend:                   ~80.4 MB
```

#### Frontend (Static Files)
```
Production Build (dist):         1.2 MB
  - Minified JavaScript:         1.1 MB
  - Optimized CSS:                47 KB
  - Images/Assets:                81 KB
Total Frontend:                  1.2 MB
```

#### Configuration & Documentation
```
Environment Files:               <1 KB (.env)
Documentation (optional):        200 KB
Logs Directory (initial):        0 KB
Total Config:                    ~200 KB
```

**Total Base Application:** ~82 MB

---

## 3. Runtime Storage Requirements

### 3.1 Database Storage (MongoDB)

#### Initial Database Size
```
Empty Collections:               <1 MB
Sample Data (100 tickets):       ~5 MB
Indexes:                         ~1 MB
Total Initial:                   ~6 MB
```

#### Estimated Growth (Per Year)
```
Assumptions:
- 500 tickets/year
- Average ticket size: 50 KB (including embedded documents)
- Form configs, users, settings: 5 MB/year

Year 1:  ~30 MB (500 tickets × 50 KB + 5 MB)
Year 2:  ~60 MB
Year 3:  ~90 MB
Year 5:  ~150 MB
```

### 3.2 Log Files

#### Application Logs
```
PM2 Logs (default rotation):
- Error logs:                    ~10 MB/month
- Output logs:                   ~20 MB/month
- Combined logs (retained):      ~50 MB/month

With 3-month retention:          ~150 MB
With 6-month retention:          ~300 MB
```

#### MongoDB Logs
```
MongoDB Logs (default):          ~10 MB/month
With 3-month retention:          ~30 MB
```

### 3.3 Temporary & Cache Files
```
npm cache:                       ~50 MB
PM2 cache/temp:                  ~10 MB
Upload buffer (if implemented):  ~100 MB
Total Temp/Cache:                ~160 MB
```

---

## 4. Total Space Requirements

### 4.1 Minimum Requirements (Development/Staging)
```
Application Code:                82 MB
Database (Year 1):               30 MB
Logs (3-month retention):        200 MB
Temp/Cache:                      160 MB
Operating System Overhead:       20%
──────────────────────────────────────
Subtotal:                        472 MB
With 20% overhead:               ~566 MB

MINIMUM RECOMMENDED:             2 GB
  (Provides 3.5x buffer for growth)
```

### 4.2 Production Requirements (Year 1)
```
Application Code:                82 MB
Database (Year 1 full load):     30 MB
Logs (6-month retention):        350 MB
Temp/Cache:                      160 MB
Backups (1 full + incrementals): 100 MB
SSL Certificates & Config:       10 MB
──────────────────────────────────────
Subtotal:                        732 MB
With 50% buffer:                 1.1 GB

RECOMMENDED PRODUCTION (Year 1): 5 GB
  (Provides substantial growth buffer)
```

### 4.3 Long-Term Production (3-5 Years)
```
Application Code:                100 MB (with updates)
Database (Year 3):               90 MB
Database (Year 5):               150 MB
Logs (6-month retention):        350 MB
Backups (3 full + incrementals): 500 MB
Temp/Cache:                      200 MB
──────────────────────────────────────
Year 3 Total:                    ~1.2 GB
Year 5 Total:                    ~1.3 GB

RECOMMENDED (3-5 Year Growth):   10 GB
  (Provides 7-10x buffer for growth)
```

---

## 5. Server Specifications by Use Case

### 5.1 Development/Testing Server
```
Disk Space:        5-10 GB
  - Application:   2 GB
  - Database:      1 GB
  - Logs:          500 MB
  - Buffer:        1.5-6.5 GB

RAM:              1-2 GB
  - Node.js:      512 MB - 1 GB
  - MongoDB:      256 MB - 512 MB
  - OS:           256 MB - 512 MB

CPU:              1-2 vCPUs
  - Light load, single user
  - Occasional builds

Bandwidth:        Minimal (internal network)
```

### 5.2 Small Production (< 50 users)
```
Disk Space:        20 GB
  - Application:   2 GB
  - Database:      3 GB
  - Logs:          2 GB
  - Backups:       3 GB
  - Buffer:        10 GB

RAM:              2-4 GB
  - Node.js:      1-2 GB
  - MongoDB:      512 MB - 1 GB
  - OS:           512 MB - 1 GB

CPU:              2 vCPUs
  - Handles concurrent requests
  - Background tasks

Bandwidth:        100 GB/month
  - API requests
  - Static assets
```

**Recommended VPS Examples:**
- DigitalOcean: Basic Droplet ($12/month)
- AWS EC2: t3.small ($15/month)
- Linode: Linode 2GB ($12/month)
- Vultr: Regular Performance ($12/month)

### 5.3 Medium Production (50-200 users)
```
Disk Space:        50 GB SSD
  - Application:   5 GB
  - Database:      10 GB
  - Logs:          5 GB
  - Backups:       10 GB
  - Buffer:        20 GB

RAM:              4-8 GB
  - Node.js:      2-4 GB (cluster mode)
  - MongoDB:      1-2 GB
  - OS/Cache:     1-2 GB

CPU:              4 vCPUs
  - Multiple Node.js workers
  - Concurrent database queries
  - Background processing

Bandwidth:        500 GB/month
  - Multiple concurrent users
  - API traffic
  - Asset delivery
```

**Recommended VPS Examples:**
- DigitalOcean: General Purpose ($48/month)
- AWS EC2: t3.medium ($30/month)
- Linode: Linode 8GB ($48/month)
- Vultr: High Frequency ($48/month)

### 5.4 Enterprise Production (200+ users)
```
Disk Space:        100-200 GB SSD
  - Application:   10 GB
  - Database:      30-50 GB
  - Logs:          10-20 GB
  - Backups:       30-50 GB
  - Buffer:        20-70 GB

RAM:              8-16 GB
  - Node.js:      4-8 GB (cluster mode)
  - MongoDB:      2-4 GB (replica set)
  - Redis Cache:  1-2 GB (if added)
  - OS/Buffer:    1-2 GB

CPU:              4-8 vCPUs
  - Load balancing
  - High concurrency
  - Complex queries

Bandwidth:        1-5 TB/month
  - High traffic
  - CDN for static assets
```

**Recommended Infrastructure:**
- AWS EC2: t3.large or c5.xlarge ($60-$136/month)
- DigitalOcean: CPU-Optimized ($96-$192/month)
- Dedicated MongoDB cluster (MongoDB Atlas)
- CDN for static assets (CloudFlare/AWS CloudFront)
- Load balancer for high availability

---

## 6. Database Storage Considerations

### 6.1 MongoDB Storage Patterns

#### Document Sizes (Estimated)
```
ProductTicket (typical):         35-50 KB
  - Basic fields:                5 KB
  - Chemical properties:         10 KB
  - SKU variants (3):            15 KB
  - Status history:              5 KB
  - Comments:                    5-15 KB

User:                            1-2 KB
Permission:                      2-3 KB
FormConfiguration:               10-15 KB
ApiKey:                          1 KB
SystemSettings:                  5 KB
UserPreferences:                 2 KB
TicketTemplate:                  20-30 KB
```

#### Index Overhead
```
ProductTicket indexes:           ~15% of data size
Other collections:               ~10% of data size

For 1000 tickets (50 MB):
  Index overhead:                ~7.5 MB
```

### 6.2 Growth Projections

#### Conservative (Low Usage)
```
Year 1:  200 tickets  = 10 MB + 1.5 MB indexes = ~12 MB
Year 2:  400 tickets  = 20 MB + 3 MB indexes   = ~23 MB
Year 3:  600 tickets  = 30 MB + 4.5 MB indexes = ~35 MB
Year 5:  1000 tickets = 50 MB + 7.5 MB indexes = ~58 MB
```

#### Moderate (Expected Usage)
```
Year 1:  500 tickets  = 25 MB + 3.8 MB indexes  = ~30 MB
Year 2:  1000 tickets = 50 MB + 7.5 MB indexes  = ~58 MB
Year 3:  1500 tickets = 75 MB + 11.3 MB indexes = ~87 MB
Year 5:  2500 tickets = 125 MB + 18.8 MB indexes = ~144 MB
```

#### High Usage
```
Year 1:  1000 tickets = 50 MB + 7.5 MB indexes   = ~58 MB
Year 2:  2000 tickets = 100 MB + 15 MB indexes   = ~115 MB
Year 3:  3000 tickets = 150 MB + 22.5 MB indexes = ~173 MB
Year 5:  5000 tickets = 250 MB + 37.5 MB indexes = ~288 MB
```

### 6.3 Backup Strategy Impact

#### Daily Incremental + Weekly Full
```
1 Full backup (compressed):      ~30% of DB size
6 Daily incrementals:            ~10% of DB size each

For 100 MB database:
  1 Full:                        30 MB
  6 Incrementals:                60 MB
  Total backup storage:          90 MB
```

#### With 4-Week Retention
```
4 Weekly full backups:           120 MB (4 × 30 MB)
24 Daily incrementals:           240 MB (24 × 10 MB)
Total backup storage:            360 MB
```

---

## 7. Bandwidth & Network Requirements

### 7.1 Typical Request Sizes

#### API Requests
```
GET /api/products (list):        50-100 KB (20 tickets)
GET /api/products/:id:           40-60 KB (single ticket)
POST /api/products:              30-50 KB (create)
PUT /api/products/:id:           40-60 KB (update)
PubChem API enrichment:          100-200 KB (external)
```

#### Static Assets (First Load)
```
JavaScript bundle:               1.1 MB
CSS bundle:                      47 KB
Images/logos:                    81 KB
Total first load:                ~1.25 MB
Cached subsequent:               ~50 KB (API calls only)
```

### 7.2 Monthly Bandwidth Estimates

#### Light Usage (10 active users)
```
Daily logins:                    10 users × 1.25 MB = 12.5 MB
Daily API calls:                 100 requests × 60 KB = 6 MB
Monthly (30 days):               (12.5 + 6) × 30 = 555 MB

Recommended bandwidth:           5-10 GB/month
```

#### Moderate Usage (50 active users)
```
Daily logins:                    50 users × 1.25 MB = 62.5 MB
Daily API calls:                 500 requests × 60 KB = 30 MB
PubChem lookups:                 50 lookups × 150 KB = 7.5 MB
Monthly (30 days):               (62.5 + 30 + 7.5) × 30 = 3 GB

Recommended bandwidth:           50-100 GB/month
```

#### Heavy Usage (200 active users)
```
Daily logins:                    200 users × 1.25 MB = 250 MB
Daily API calls:                 2000 requests × 60 KB = 120 MB
PubChem lookups:                 200 lookups × 150 KB = 30 MB
Monthly (30 days):               (250 + 120 + 30) × 30 = 12 GB

Recommended bandwidth:           200-500 GB/month
```

---

## 8. Recommended Hosting Solutions

### 8.1 Budget Option (Development/Small Teams)

**Provider:** DigitalOcean Basic Droplet
**Specs:**
- 2 GB RAM / 1 vCPU / 50 GB SSD
- 2 TB bandwidth
- **Cost:** $12/month

**Suitable For:**
- Development/staging environments
- Small teams (< 20 users)
- Low traffic (< 1000 tickets/year)

---

### 8.2 Recommended Production (Small-Medium)

**Provider:** DigitalOcean / Linode / Vultr
**Specs:**
- 4 GB RAM / 2 vCPUs / 80 GB SSD
- 4 TB bandwidth
- Managed MongoDB (separate): 512 MB RAM / 10 GB
- **Cost:** $24/month (VPS) + $15/month (MongoDB) = $39/month

**Suitable For:**
- Small to medium production (20-100 users)
- Moderate traffic (500-1500 tickets/year)
- Professional deployment with backups

---

### 8.3 Recommended Production (Medium-Large)

**Provider:** AWS / DigitalOcean
**Configuration:**
- **Application Server:** t3.medium (4 GB RAM, 2 vCPUs)
- **Database:** MongoDB Atlas M10 (2 GB RAM, 10 GB storage)
- **Storage:** 100 GB SSD
- **CDN:** CloudFlare (free tier) or AWS CloudFront
- **Load Balancer:** (if needed for HA)
- **Cost:** ~$50-100/month

**Suitable For:**
- Medium to large production (100-500 users)
- High traffic (1500-5000 tickets/year)
- High availability requirements
- Enterprise security needs

---

### 8.4 Enterprise Solution

**Provider:** AWS / Azure / GCP
**Configuration:**
- **Application:** t3.large (8 GB RAM, 2 vCPUs) or multiple instances
- **Database:** MongoDB Atlas M30 (8 GB RAM, replica set)
- **Storage:** 200 GB SSD with automated backups
- **CDN:** CloudFront with edge caching
- **Load Balancer:** Application Load Balancer
- **Monitoring:** CloudWatch / DataDog
- **Cost:** ~$200-500/month

**Suitable For:**
- Large enterprises (500+ users)
- Very high traffic (5000+ tickets/year)
- Mission-critical operations
- Compliance requirements (SOC2, HIPAA, etc.)

---

## 9. Cost-Optimized Deployment Strategy

### 9.1 Minimal Production Setup ($20-30/month)
```
Single VPS (DigitalOcean/Linode):
  - 2-4 GB RAM, 2 vCPUs, 50 GB SSD
  - Run both Node.js and MongoDB on same server
  - Use PM2 for process management
  - Manual backups to external storage
  - CloudFlare free CDN for static assets

Total: $18-24/month
```

### 9.2 Recommended Production Setup ($50-75/month)
```
Application VPS:
  - 4 GB RAM, 2 vCPUs, 50 GB SSD ($24/month)

Managed MongoDB:
  - MongoDB Atlas M10 or DigitalOcean Managed ($15-30/month)

CDN:
  - CloudFlare (free) or CloudFront ($5-10/month)

Backups:
  - Automated daily backups (included or $5/month)

Total: $44-69/month
```

### 9.3 Enterprise Setup ($200-500/month)
```
Load Balanced Application (2 instances):
  - AWS t3.medium × 2 ($60/month)

Database Cluster:
  - MongoDB Atlas M30 Replica Set ($60-150/month)

CDN & Static Assets:
  - CloudFront with edge caching ($20-50/month)

Load Balancer:
  - AWS ALB ($20-30/month)

Monitoring & Logs:
  - CloudWatch / DataDog ($20-50/month)

Backups & Disaster Recovery:
  - Automated snapshots ($20-40/month)

Total: $200-370/month
```

---

## 10. Final Recommendations

### 10.1 Immediate Deployment (Phase 1)

**Recommended Configuration:**
- **Server:** 4 GB RAM / 2 vCPUs / 50 GB SSD
- **Database:** 10 GB allocated (managed or co-located)
- **Bandwidth:** 100 GB/month minimum
- **Estimated Cost:** $30-50/month

**Rationale:**
- Handles 50-100 concurrent users comfortably
- Room for 2-3 years of data growth
- Professional deployment with monitoring
- Scalable as usage increases

### 10.2 Growth Plan (Phase 2: Year 2-3)

**Upgrade Path:**
- **Server:** Scale to 8 GB RAM / 4 vCPUs / 100 GB SSD
- **Database:** Separate managed MongoDB (20-30 GB)
- **CDN:** Add CloudFront for global edge caching
- **Estimated Cost:** $100-150/month

### 10.3 Enterprise Scale (Phase 3: Year 3+)

**Full Production:**
- **Application:** Load-balanced cluster (2-3 instances)
- **Database:** MongoDB replica set for HA
- **Storage:** 200 GB with automated backups
- **CDN:** Global edge network
- **Monitoring:** Full observability stack
- **Estimated Cost:** $300-500/month

---

## 11. Storage Optimization Tips

### 11.1 Application Level
1. **Production builds only** - Don't deploy node_modules in production
2. **Use npm ci --production** - Install only production dependencies
3. **Enable MongoDB compression** - Reduces storage by 30-50%
4. **Implement log rotation** - Limit log retention to 30-90 days
5. **CDN for static assets** - Offload 1.2 MB of static files

### 11.2 Database Level
1. **Regular compact operations** - Reclaim deleted space
2. **Archive old tickets** - Move completed tickets > 2 years to cold storage
3. **Implement data retention policies** - Auto-delete abandoned drafts
4. **Index optimization** - Remove unused indexes

### 11.3 Infrastructure Level
1. **Automated backup pruning** - Keep only necessary backup history
2. **Compress backups** - 50-70% size reduction
3. **Use block storage for large files** - More cost-effective
4. **Monitor disk usage** - Set alerts at 70% capacity

---

## 12. Summary Matrix

| Use Case | Users | Disk | RAM | CPU | Cost/Month |
|----------|-------|------|-----|-----|------------|
| Development | 1-5 | 10 GB | 2 GB | 1 vCPU | $6-12 |
| Small Production | 10-50 | 20 GB | 4 GB | 2 vCPU | $30-50 |
| Medium Production | 50-200 | 50 GB | 8 GB | 4 vCPU | $100-150 |
| Enterprise | 200+ | 100+ GB | 16 GB | 8 vCPU | $300-500 |

---

## 13. Conclusion

**For Immediate Production Deployment:**
- **Minimum Server Space:** 20 GB
- **Recommended Server Space:** 50 GB
- **Optimal for 3-Year Growth:** 100 GB

**Key Takeaways:**
1. The application itself is very lean (~82 MB in production)
2. Primary storage needs are database and logs
3. A $30-50/month VPS is adequate for small-medium deployments
4. Plan for ~30 MB database growth per 500 tickets/year
5. Budget 50-100 GB for professional production deployment

**Next Steps:**
1. Determine expected user count and ticket volume
2. Choose appropriate hosting tier from recommendations
3. Implement monitoring for disk usage from day 1
4. Plan database backup strategy based on business requirements
5. Consider MongoDB Atlas for managed database if budget allows

---

**Report Compiled By:** Server Sizing Analysis
**Analysis Date:** 2025-10-21
**Based On:** Current codebase analysis and industry best practices
