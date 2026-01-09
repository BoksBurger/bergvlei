# Health Endpoints Documentation

All health endpoints are properly documented in Swagger and available for monitoring, load balancers, and DevOps tools.

## Available Endpoints

### 1. Quick Health Check (Root Level)
**Endpoint:** `GET /health`

**Purpose:** Fast health check without `/api` prefix, ideal for load balancers and monitoring tools.

**No Authentication Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-09T10:30:00.000Z",
    "uptime": 123.45,
    "environment": "development"
  }
}
```

**Usage:**
```bash
curl http://localhost:3001/health
```

**Response Time:** < 1ms (no database query)

---

### 2. Basic Health Check (API Level)
**Endpoint:** `GET /api/health`

**Purpose:** Standard health check through the API route.

**No Authentication Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-09T10:30:00.000Z",
    "environment": "development",
    "uptime": 123.45
  }
}
```

**Usage:**
```bash
curl http://localhost:3001/api/health
```

**Response Time:** < 1ms (no database query)

---

### 3. Database Health Check
**Endpoint:** `GET /api/health/db`

**Purpose:** Tests database connectivity and measures latency.

**No Authentication Required**

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "database": "PostgreSQL",
    "latency": 12.34,
    "timestamp": "2026-01-09T10:30:00.000Z"
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": {
    "message": "Database health check failed",
    "details": "Connection timeout"
  }
}
```

**Usage:**
```bash
curl http://localhost:3001/api/health/db
```

**Response Time:** 10-50ms (includes database query)

**What it checks:**
- Database connection status
- Query execution
- Database version/type
- Response latency

---

### 4. Full System Health Check
**Endpoint:** `GET /api/health/full`

**Purpose:** Comprehensive health check including server, database, and system resources.

**No Authentication Required**

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-09T10:30:00.000Z",
    "server": {
      "environment": "development",
      "uptime": 123.45,
      "nodeVersion": "v20.10.0"
    },
    "database": {
      "status": "connected",
      "type": "PostgreSQL",
      "latency": 12.34
    },
    "memory": {
      "used": 45.67,
      "total": 512.00,
      "percentUsed": 9
    }
  }
}
```

**Usage:**
```bash
curl http://localhost:3001/api/health/full
```

**Response Time:** 10-50ms (includes database query)

**What it checks:**
- Server uptime and environment
- Node.js version
- Database connectivity and latency
- Memory usage (heap used/total)
- Overall system health

---

## Quick Reference

| Endpoint | Purpose | DB Query | Auth Required | Response Time |
|----------|---------|----------|---------------|---------------|
| `GET /health` | Quick check (root) | No | No | < 1ms |
| `GET /api/health` | Basic check (API) | No | No | < 1ms |
| `GET /api/health/db` | Database check | Yes | No | 10-50ms |
| `GET /api/health/full` | Full system check | Yes | No | 10-50ms |

## Swagger Documentation

All endpoints are documented in Swagger UI:

**Access Swagger UI:** http://localhost:3001/api-docs

**OpenAPI Spec JSON:** http://localhost:3001/api-docs.json

### In Swagger UI

Navigate to the "Health" tag to see all health endpoints with:
- Full request/response schemas
- Try it out functionality
- Example responses
- Error responses

---

## Monitoring & DevOps Usage

### Load Balancer Health Checks

Use the root-level endpoint for load balancers (no `/api` prefix):

```yaml
# AWS ALB Target Group
healthCheck:
  path: /health
  interval: 30
  timeout: 5
  healthy_threshold: 2
  unhealthy_threshold: 3
```

```yaml
# Kubernetes Liveness Probe
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Database Monitoring

Use the database health endpoint for monitoring:

```bash
# Check database latency
curl -s http://localhost:3001/api/health/db | jq '.data.latency'

# Alert if latency > 100ms
if [ $(curl -s http://localhost:3001/api/health/db | jq '.data.latency') -gt 100 ]; then
  echo "High database latency detected!"
fi
```

### Full System Monitoring

Use the full health endpoint for comprehensive monitoring:

```bash
# Get full system status
curl http://localhost:3001/api/health/full

# Check memory usage
curl -s http://localhost:3001/api/health/full | jq '.data.memory.percentUsed'

# Check if system is healthy
curl -s http://localhost:3001/api/health/full | jq '.data.status'
```

### Monitoring Tools Integration

**Prometheus:**
```yaml
scrape_configs:
  - job_name: 'bergvlei-api'
    metrics_path: '/api/health/full'
    static_configs:
      - targets: ['localhost:3001']
```

**Datadog:**
```yaml
init_config:

instances:
  - url: http://localhost:3001/api/health/full
    name: bergvlei-api
    check_type: service_check
```

**New Relic:**
```bash
# Add synthetic monitoring
newrelic synthetics create-monitor \
  --name "Bergvlei API Health" \
  --type SIMPLE \
  --uri "http://your-api.com/health"
```

---

## Testing All Endpoints

Run this script to test all health endpoints:

```bash
#!/bin/bash

BASE_URL="http://localhost:3001"

echo "Testing Health Endpoints..."
echo "=========================="

echo -e "\n1. Root Health Check (/health):"
curl -s $BASE_URL/health | jq .

echo -e "\n2. API Health Check (/api/health):"
curl -s $BASE_URL/api/health | jq .

echo -e "\n3. Database Health Check (/api/health/db):"
curl -s $BASE_URL/api/health/db | jq .

echo -e "\n4. Full System Health Check (/api/health/full):"
curl -s $BASE_URL/api/health/full | jq .

echo -e "\n=========================="
echo "All health checks complete!"
```

Save as `test-health.sh` and run:
```bash
chmod +x test-health.sh
./test-health.sh
```

---

## Troubleshooting

### Endpoint returns 404
- **Check if backend is running:** `curl http://localhost:3001/health`
- **Verify correct port:** Check `.env` file for `PORT=3001`
- **Check logs:** Look for startup errors

### Database health check fails
- **Verify database connection:** Check `DATABASE_URL` in `.env`
- **Check PostgreSQL is running:** `pg_isready -h localhost -p 5432`
- **Review error details:** Response includes error message

### High latency on database check
- **Check database load:** Monitor active connections
- **Review database logs:** Look for slow queries
- **Check network:** Verify network latency to database

---

## Summary

✅ **4 health endpoints** available
✅ **All documented** in Swagger UI
✅ **No authentication** required
✅ **Fast responses** (< 1ms for basic, ~10-50ms for DB checks)
✅ **Comprehensive monitoring** with full system health
✅ **Load balancer ready** with root-level `/health` endpoint

All endpoints are working and properly documented! 🎉
