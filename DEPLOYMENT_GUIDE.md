# JECA Prep Hub - Setup & Deployment Guide

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Database Configuration](#database-configuration)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)
5. [Building & Testing](#building--testing)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- **Node.js:** Version 20 or higher
- **npm:** Version 9 or higher (comes with Node.js)
- **PostgreSQL:** Version 14+ (optional for development; in-memory store works for demos)
- **Git:** For cloning the repository

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd jeca

# Install all dependencies (frontend, backend, shared)
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database (optional for development; defaults to in-memory)
DATABASE_URL="postgresql://postgres:password@localhost:5432/jeca_prep?schema=public"

# Security (use a long random string in production)
JWT_SECRET="development-only-secret-change-in-production"

# Server
PORT=4000
NODE_ENV="development"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### Step 3: Start Development Servers

```bash
# Start both API (port 4000) and Vite frontend (port 5173)
npm run dev
```

The development server will:
- Start Express API at `http://localhost:4000`
- Start Vite frontend at `http://localhost:5173`
- Watch files for changes
- Hot-reload the frontend

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### First Use

1. **With Local Demo Data:**
   - Click "Explore with local demo data"
   - No login required
   - Full test workflow available
   - Data persists in browser localStorage

2. **With API Backend:**
   - Click "Create account" and register
   - Login with your credentials
   - Start a mock test
   - All data saved in memory (lost on server restart)

---

## Database Configuration

### Enable Persistent Storage with PostgreSQL

#### Step 1: Create PostgreSQL Database

```bash
# Using psql
psql -U postgres

# In psql shell
CREATE DATABASE jeca_prep;
\q
```

Or using a GUI tool like pgAdmin.

#### Step 2: Set DATABASE_URL

Update `.env`:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/jeca_prep?schema=public"
```

#### Step 3: Generate Prisma Client

```bash
npm run prisma:generate --workspace backend
```

#### Step 4: Run Migrations

```bash
npm run prisma:migrate --workspace backend -- --name init
```

This creates all tables defined in `prisma/schema.prisma`.

#### Step 5: Seed Initial Data

```bash
npm run prisma:seed --workspace backend
```

This creates:
- STUDENT and ADMIN roles
- All subjects and topics
- 110 original practice questions

#### Step 6: Enable Prisma in Backend

Update `backend/src/services/store.ts` and `backend/src/routes/*.ts` to use Prisma Client instead of in-memory store (implementation ready; switch comment flags).

#### Step 7: Restart Development Server

```bash
# Kill existing server (Ctrl+C)
# Then restart
npm run dev
```

### Database Schema Overview

Key tables:
- **User:** Authentication and profile
- **Role:** User roles (STUDENT, ADMIN)
- **Subject:** Exam subjects
- **Topic:** Topics within subjects
- **Question:** Question bank
- **MockTest:** Mock test configurations
- **MockQuestion:** Questions assigned to mocks
- **Attempt:** Test attempts by users
- **AttemptAnswer:** Answers submitted in attempts
- **Bookmark:** Questions bookmarked by users
- **Mistake:** Questions answered incorrectly

See `prisma/schema.prisma` for complete schema.

---

## Production Deployment

### Option 1: Heroku Deployment

#### Prerequisites
- Heroku CLI installed
- Heroku account
- PostgreSQL add-on

#### Steps

1. **Create Heroku App:**
   ```bash
   heroku create jeca-prep-hub
   ```

2. **Add PostgreSQL:**
   ```bash
   heroku addons:create heroku-postgresql:standard-0
   ```

3. **Set Environment Variables:**
   ```bash
   heroku config:set JWT_SECRET="your-long-random-secret"
   heroku config:set NODE_ENV="production"
   heroku config:set FRONTEND_URL="https://jeca-prep-hub.herokuapp.com"
   ```

4. **Create Procfile:**
   ```
   web: npm run build && npm run start --workspace backend
   ```

5. **Deploy:**
   ```bash
   git push heroku main
   heroku run npm run prisma:migrate --workspace backend
   heroku run npm run prisma:seed --workspace backend
   ```

### Option 2: AWS EC2 Deployment

#### Prerequisites
- AWS account
- EC2 instance (t3.small or larger)
- Ubuntu 20.04 LTS
- Security groups configured

#### Steps

1. **Connect to Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

2. **Install Dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs postgresql-client
   ```

3. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd jeca
   npm install
   ```

4. **Create .env:**
   ```bash
   nano .env
   # Configure with production values
   ```

5. **Build:**
   ```bash
   npm run build
   ```

6. **Start with PM2:**
   ```bash
   npm install -g pm2
   pm2 start backend/dist/server.js --name "jeca-api"
   pm2 save
   pm2 startup
   ```

7. **Serve Frontend:**
   ```bash
   sudo apt-get install -y nginx
   sudo cp frontend/dist/* /var/www/html/
   ```

8. **Configure Nginx:**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;
     root /var/www/html;
     
     location / {
       try_files $uri /index.html;
     }
     
     location /api {
       proxy_pass http://localhost:4000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

9. **Enable HTTPS (Let's Encrypt):**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Docker Deployment

#### Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 4000

ENV NODE_ENV=production
CMD ["node", "backend/dist/server.js"]
```

#### Create docker-compose.yml

```yaml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: jeca_prep
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    environment:
      DATABASE_URL: "postgresql://postgres:secure_password@database:5432/jeca_prep"
      JWT_SECRET: "your-production-secret"
      FRONTEND_URL: "http://localhost:3000"
      NODE_ENV: "production"
    ports:
      - "4000:4000"
    depends_on:
      - database

  web:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "3000:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

#### Run with Docker:

```bash
docker-compose up -d
```

---

## Environment Variables

### Development

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jeca_prep?schema=public"
JWT_SECRET="dev-secret-not-for-production"
PORT=4000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
```

### Production

```env
DATABASE_URL="postgresql://user:password@prod-host:5432/jeca_prep?schema=public"
JWT_SECRET="<use-a-long-random-string>"
PORT=4000
NODE_ENV="production"
FRONTEND_URL="https://your-domain.com"
```

### Variable Reference

| Variable | Purpose | Default | Notes |
|----------|---------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection | (optional) | Optional; in-memory store used if omitted |
| `JWT_SECRET` | Token signing secret | `dev-only-change-me` | **Must** be changed in production |
| `PORT` | API server port | `4000` | Must not conflict with other services |
| `NODE_ENV` | Environment | `development` | Set to `production` for deployment |
| `FRONTEND_URL` | Frontend origin | `http://localhost:5173` | Used for CORS configuration |

---

## Building & Testing

### Type Checking

```bash
# Check TypeScript compilation
npm run lint
```

### Unit Tests

```bash
# Run scoring engine tests
npm run test

# Watch mode
npm run test:watch
```

### Build Production

```bash
# Build both frontend and backend
npm run build

# Backend output: backend/dist/server.js
# Frontend output: frontend/dist/
```

### Local Production Build Test

```bash
# Build
npm run build

# Set production environment
export NODE_ENV=production

# Start backend
node backend/dist/server.js

# Serve frontend (in another terminal)
npx serve frontend/dist
```

Access at `http://localhost:3000`

---

## Troubleshooting

### Issue: "Port 4000 already in use"

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

### Issue: "DATABASE_URL is invalid"

1. Verify PostgreSQL is running
2. Check database credentials
3. Ensure database exists: `createdb jeca_prep`
4. Test connection: `psql <DATABASE_URL>`

### Issue: "JWT_SECRET must be configured in production"

In production, always set `JWT_SECRET` in environment variables. Use a long random string:

```bash
# Generate secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Issue: "Frontend can't reach API"

1. Verify API is running on correct port (default: 4000)
2. Check `FRONTEND_URL` matches actual frontend URL
3. Verify CORS is enabled (should be automatic)
4. Check browser console for errors

### Issue: "Tests are failing"

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run tests with verbose output
npm run test:watch
```

### Issue: "localStorage is not persisting"

1. Check browser's localStorage is enabled (settings → privacy)
2. Verify site is not in private/incognito mode
3. Check browser console for quota exceeded errors
4. Clear site data and try again

---

## Security Checklist

Before production deployment:

- [ ] `JWT_SECRET` is set to a long random string
- [ ] `DATABASE_URL` uses encrypted connection (SSL)
- [ ] `NODE_ENV` is set to "production"
- [ ] `FRONTEND_URL` matches actual frontend domain
- [ ] HTTPS is enabled (SSL/TLS certificate)
- [ ] Firewall allows only necessary ports (80, 443 for web; 5432 internal only)
- [ ] Database backups are configured
- [ ] Log monitoring is set up
- [ ] Rate limiting is active on auth endpoints
- [ ] Admin credentials are secure and changed from defaults

---

## Performance Optimization

### Frontend

```bash
# Build with optimization
npm run build --workspace frontend

# Output size analysis
npm install -g vite
vite analyze
```

### Backend

```bash
# Enable compression
npm install compression

# Use connection pooling for database
# Update DATABASE_URL with ?connection_limit=25
```

### Database

```sql
-- Create indexes for common queries
CREATE INDEX idx_questions_subject ON "Question"(subjectId);
CREATE INDEX idx_questions_year ON "Question"(year);
CREATE INDEX idx_attempts_user ON "Attempt"(userId);
```

---

## Monitoring & Maintenance

### Check Application Health

```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","storage":"memory"}
```

### View Logs

```bash
# PM2 logs
pm2 logs jeca-api

# Docker logs
docker-compose logs -f api

# Heroku logs
heroku logs --tail
```

### Database Maintenance

```bash
# Backup
pg_dump jeca_prep > backup.sql

# Restore
psql jeca_prep < backup.sql
```

---

## Support & Documentation

- **API Documentation:** See `API_DOCUMENTATION.md`
- **README:** See `README.md`
- **Issue Tracker:** GitHub Issues
- **Email Support:** support@example.com
