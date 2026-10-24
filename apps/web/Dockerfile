# syntax=docker/dockerfile:1
# Build context is the repository root (the npm workspace lockfile lives there):
#   docker build -f apps/web/Dockerfile .

# ---- All dependencies (for building) ----
FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci

# ---- Build ----
FROM deps AS build
COPY packages/shared-types packages/shared-types
COPY apps/web apps/web
RUN npm run build --workspace web

# ---- Production dependencies only ----
FROM node:20-alpine AS prod-deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
RUN npm ci --omit=dev

# ---- Runtime ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo

COPY --from=prod-deps --chown=node:node /repo/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node packages/shared-types packages/shared-types
COPY --chown=node:node apps/web/package.json apps/web/next.config.js apps/web/
COPY --from=build --chown=node:node /repo/apps/web/.next apps/web/.next

USER node
EXPOSE 3000
# JWT_SECRET and API_BASE_URL are read at runtime, not baked into the image.
CMD ["npm", "run", "start", "--workspace", "web"]
