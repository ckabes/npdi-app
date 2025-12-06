# NPDI Application - Production Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Systemd Service Setup](#systemd-service-setup)
4. [Monitoring Configuration](#monitoring-configuration)
5. [Health Checks](#health-checks)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Server Specifications
- **OS**: Ubuntu 20.04 LTS or later / RHEL 8+ / Debian 11+
- **CPU**: Minimum 2 cores (4 cores recommended)
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk**: 20GB+ free space
- **Node.js**: v18.x or v20.x LTS
- **MongoDB**: 5.0+ (can be local or remote)

### Network Requirements
- Port 5000 for application (configurable)
- Port 27017 for MongoDB (if local)
- Outbound SMTP access for email notifications
- Outbound HTTPS for webhook notifications (optional)

---

## Pre-Deployment Checklist

### 1. Create Application User
```bash
# Create dedicated user for security
sudo useradd -r -s /bin/bash -d /opt/npdi-app -m npdi

# Create necessary directories
sudo mkdir -p /opt/npdi-app
sudo mkdir -p /opt/npdi-app/logs
sudo mkdir -p /opt/npdi-app/uploads

# Set ownership
sudo chown -R npdi:npdi /opt/npdi-app
```

### 2. Install Node.js
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install MongoDB (if local)
```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -sc)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start and enable
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 4. Deploy Application
```bash
# Switch to application user
sudo -u npdi bash

# Clone or copy application to /opt/npdi-app
cd /opt/npdi-app
git clone <your-repo> .

# Install dependencies
npm install --production

# Build client
cd client && npm install && npm run build && cd ..
```

### 5. Configure Environment
```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

**Required Configuration:**
```bash
# Production settings
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/npdi-app

# Security (generate strong keys)
JWT_SECRET=$(openssl rand -hex 64)
METRICS_TOKEN=$(openssl rand -hex 32)

# Email notifications
SMTP_HOST=smtp.yourcompany.com
SMTP_PORT=587
SMTP_USER=npdi-app@yourcompany.com
SMTP_PASS=your-secure-password
ALERT_EMAIL=admin@yourcompany.com

# Optional: Webhook for Slack/Teams
# WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 6. Set Permissions
```bash
# Ensure proper ownership
sudo chown -R npdi:npdi /opt/npdi-app

# Protect sensitive files
chmod 600 /opt/npdi-app/.env
chmod 755 /opt/npdi-app/server/index.js
```

---

## Systemd Service Setup

### 1. Create Service File
Create `/etc/systemd/system/npdi-app.service`:

```ini
[Unit]
Description=NPDI Application - Chemical Product Management System
Documentation=https://github.com/yourorg/npdi-app
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=npdi
Group=npdi
WorkingDirectory=/opt/npdi-app

# Environment
Environment=NODE_ENV=production
EnvironmentFile=/opt/npdi-app/.env

# Main process
ExecStart=/usr/bin/node server/index.js

# Restart policy
Restart=on-failure
RestartSec=10s
StartLimitInterval=5min
StartLimitBurst=5

# Graceful shutdown
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30s

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/npdi-app/logs /opt/npdi-app/uploads

# Resource limits
LimitNOFILE=65536
LimitNPROC=512

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=npdi-app

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start Service
```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable npdi-app

# Start service
sudo systemctl start npdi-app

# Check status
sudo systemctl status npdi-app
```

### 3. Verify Service is Running
```bash
# Check if service is active
sudo systemctl is-active npdi-app

# View recent logs
sudo journalctl -u npdi-app -n 50 --no-pager

# Follow logs in real-time
sudo journalctl -u npdi-app -f
```

---

## Monitoring Configuration

### Health Check Endpoints

The application provides three health check endpoints:

#### 1. Main Health Check
```bash
curl http://localhost:5000/api/health

# Example response:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.2.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "healthy",
      "latency": "2ms",
      "state": "connected"
    },
    "memory": {
      "status": "healthy",
      "heapUsedMB": 85,
      "heapTotalMB": 128,
      "rssMB": 120,
      "heapUsagePercent": 66
    }
  }
}
```

#### 2. Liveness Probe
Simple check that process is alive:
```bash
curl http://localhost:5000/api/health/live
```

#### 3. Readiness Probe
Check if application is ready to serve traffic:
```bash
curl http://localhost:5000/api/health/ready
```

### Application Metrics

#### Access Metrics Endpoint
```bash
# Set metrics token in your environment
export METRICS_TOKEN="your-token-from-env-file"

# JSON format
curl -H "X-Metrics-Token: $METRICS_TOKEN" \
  http://localhost:5000/api/metrics

# Prometheus format (for Prometheus scraping)
curl -H "X-Metrics-Token: $METRICS_TOKEN" \
  http://localhost:5000/api/metrics/prometheus
```

### Email Notifications

Critical errors are automatically sent via email when:
- Uncaught exceptions occur
- Unhandled promise rejections occur
- Database connection is lost
- Any 500-level server errors occur

**Features:**
- Automatic throttling (one email per 5 minutes per unique error)
- HTML-formatted error details
- Server and request context included

### Webhook Notifications

Configure Slack/Teams/Discord webhook for real-time alerts:

**Slack Setup:**
1. Go to https://api.slack.com/apps
2. Create new app or select existing
3. Enable "Incoming Webhooks"
4. Create webhook for your channel
5. Add `WEBHOOK_URL` to `.env`

**Microsoft Teams Setup:**
1. Go to your Teams channel
2. Click "..." → "Connectors"
3. Configure "Incoming Webhook"
4. Copy webhook URL
5. Add `WEBHOOK_URL` to `.env`

---

## Log Management

### Application Logs Location
```
/opt/npdi-app/logs/
├── combined-2024-01-15.log    # All logs
├── error-2024-01-15.log        # Error logs only
├── combined-2024-01-14.log    # Previous day (rotated)
└── error-2024-01-14.log        # Previous errors (rotated)
```

### Log Rotation
Logs are automatically rotated:
- **Daily rotation** at midnight
- **File size limit**: 10MB per file
- **Retention**: 30 days for errors, 14 days for combined logs

### View Logs
```bash
# View today's combined logs
sudo cat /opt/npdi-app/logs/combined-$(date +%Y-%m-%d).log

# View today's errors only
sudo cat /opt/npdi-app/logs/error-$(date +%Y-%m-%d).log

# View systemd journal logs
sudo journalctl -u npdi-app -n 100

# Follow logs in real-time
sudo journalctl -u npdi-app -f
```

---

## Maintenance

### Service Management
```bash
# Start service
sudo systemctl start npdi-app

# Stop service
sudo systemctl stop npdi-app

# Restart service
sudo systemctl restart npdi-app

# Reload service (graceful restart)
sudo systemctl reload npdi-app

# View status
sudo systemctl status npdi-app
```

### Application Updates
```bash
# 1. Pull latest code
sudo -u npdi bash
cd /opt/npdi-app
git pull

# 2. Install dependencies
npm install --production
cd client && npm install && npm run build && cd ..

# 3. Restart service
sudo systemctl restart npdi-app

# 4. Verify health
curl http://localhost:5000/api/health
```

### Database Backup
```bash
# Create backup directory
sudo mkdir -p /opt/npdi-app/backups

# Backup database
mongodump --db=npdi-app --out=/opt/npdi-app/backups/$(date +%Y%m%d)

# Automated backup (add to crontab)
# Daily at 2 AM
0 2 * * * mongodump --db=npdi-app --out=/opt/npdi-app/backups/$(date +\%Y\%m\%d) && find /opt/npdi-app/backups -type d -mtime +30 -exec rm -rf {} +
```

### Monitor Resource Usage
```bash
# Check memory usage
ps aux | grep node

# Check disk usage
df -h /opt/npdi-app

# Check log size
du -sh /opt/npdi-app/logs
```

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
sudo journalctl -u npdi-app -n 100 --no-pager
```

**Common issues:**
1. **Port already in use**
   ```bash
   sudo lsof -i :5000
   sudo kill <PID>
   ```

2. **Permission errors**
   ```bash
   sudo chown -R npdi:npdi /opt/npdi-app
   chmod 600 /opt/npdi-app/.env
   ```

3. **MongoDB not running**
   ```bash
   sudo systemctl status mongod
   sudo systemctl start mongod
   ```

### Database Connection Issues

**Check MongoDB status:**
```bash
sudo systemctl status mongod
mongosh  # Test connection
```

**Check connection string in `.env`:**
```bash
sudo -u npdi cat /opt/npdi-app/.env | grep MONGODB_URI
```

### High Memory Usage

**Check memory stats:**
```bash
curl http://localhost:5000/api/health | jq '.checks.memory'
```

**Restart if needed:**
```bash
sudo systemctl restart npdi-app
```

### Email Notifications Not Working

**Test SMTP configuration:**
```bash
# Check logs for SMTP errors
sudo journalctl -u npdi-app | grep -i smtp

# Verify environment variables
sudo -u npdi bash -c 'source /opt/npdi-app/.env && echo $SMTP_HOST'
```

### View Error Details

**Check error logs:**
```bash
# Today's errors
sudo cat /opt/npdi-app/logs/error-$(date +%Y-%m-%d).log

# Search for specific error
sudo grep -i "database" /opt/npdi-app/logs/error-*.log
```

---

## Security Best Practices

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Firewall configuration**
   ```bash
   sudo ufw allow 5000/tcp
   sudo ufw enable
   ```

3. **SSL/TLS with Nginx reverse proxy**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name npdi.yourcompany.com;

       ssl_certificate /etc/ssl/certs/npdi.crt;
       ssl_certificate_key /etc/ssl/private/npdi.key;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Regular backups**
   - Daily database backups
   - Weekly full application backups
   - Test restoration procedures

---

## Support Contacts

For issues or questions:
- **Technical Support**: support@yourcompany.com
- **Emergency Contact**: on-call@yourcompany.com
- **Documentation**: https://docs.yourcompany.com/npdi-app

---

**Last Updated**: January 2025
**Version**: 1.2.0
