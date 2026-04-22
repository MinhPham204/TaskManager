# Task Manager Backend (NestJS)

Backend API for a multi-tenant Task Manager SaaS application.

## Overview

This service provides:

- JWT authentication with access/refresh token flow
- 3-step onboarding flow: register -> verify OTP -> set password
- Organization, team, and task management with role-based access
- Multi-tenant data isolation using ALS + Mongoose plugin
- Task workflow features (submit, approve, reject, todo checklist)
- BullMQ workers and scheduled reminder jobs
- Swagger API documentation

## Main Modules

Registered modules in the app:

- Auth
- Organization
- User
- Task
- Team
- Automation
- Shared

## Multi-Tenant Design

Tenant isolation is implemented with two layers:

- Tenant interceptor:
  - extracts organization id from authenticated user
  - stores tenant context using AsyncLocalStorage
- Mongoose tenant plugin:
  - injects organization filter into most queries automatically
  - auto-populates organization for newly created tenant-bound documents

## Prerequisites

- Node.js 20+
- npm
- MongoDB
- Redis

Or run MongoDB and Redis through Docker Compose.

## Environment Setup

1. Create env file from template:

```bash
cp .env.example .env
```

2. Fill required values, especially:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_VERIFIED_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

## Run Locally

```bash
npm install
npm run start:dev
```

URLs:

- API: http://localhost:8001/api
- Swagger: http://localhost:8001/api/docs

## Run With Docker Compose

```bash
docker compose up --build
```

This starts:

- `api` on port `8001`
- `mongo` on container `27017` mapped to host `27018`
- `redis` on port `6379`

If this is the first run, initialize MongoDB replica set once:

```bash
docker exec -it task_manager_db mongosh --eval "rs.initiate()"
```

## Scripts

- `npm run build`
- `npm run start`
- `npm run start:dev`
- `npm run start:debug`
- `npm run start:prod`
- `npm run lint`
- `npm run format`
- `npm run test`
- `npm run test:watch`
- `npm run test:cov`
- `npm run test:e2e`

## Notes

- Global API prefix is `api`.
- CORS origin is read from `CLIENT_URL`.
- Queue workers and automation features require Redis.
- Reminder cron is configured in code to run daily at 08:00.
