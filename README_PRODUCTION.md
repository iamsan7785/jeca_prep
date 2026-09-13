Production deployment quickstart

Required secrets (store in secret manager / CI secrets):
- `DATABASE_URL` (Postgres connection string)
- `JWT_SECRET` (strong random secret)
- `REGISTRY`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD` (for Docker registry)

Local quick preview using docker-compose (not for real production):

1. Create `.env.prod` with required envs (example):

DATABASE_URL="postgresql://postgres:postgres@db:5432/jeca_prep?schema=public"
JWT_SECRET="replace-with-secure-secret"
PORT=4000
FRONTEND_URL="https://example.com"

2. Build images and start services:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

CI/CD notes
- The workflow in `.github/workflows/ci-cd.yml` builds artifacts, runs `prisma migrate deploy`, and publishes Docker images.
- Ensure CI has `DATABASE_URL` and `REGISTRY*` secrets configured.

Post-deploy
- Run smoke tests against staging first.
- Monitor logs and backups.
