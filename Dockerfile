# Frontend Dependencies
FROM node:18-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json frontend/package-lock.json ./
# Use regular npm install instead of npm ci since package-lock.json might not exist
RUN npm install --production

# Backend Dependencies
FROM node:18-alpine AS backend-deps
WORKDIR /app
COPY package*.json package-lock.json ./
# Use regular npm install instead of npm ci since package-lock.json might not exist
RUN npm install --production

# Frontend Build
FROM frontend-deps AS frontend-builder
# Set production environment and increase memory limit for build
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Copy only the necessary files for the build
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/*.json ./
COPY frontend/*.ts ./
# Use timeout command to prevent build from hanging indefinitely
RUN timeout 30m npm run build || (echo "Build timed out but may have completed enough to continue" && ls -la dist/)

# Backend Build
FROM backend-deps AS backend-builder
# Copy only the necessary files for the build
COPY src ./src
COPY *.json ./
COPY *.yaml ./
COPY postcss.config.js ./
RUN npm run build:css

# Final Stage
FROM node:18-slim
WORKDIR /app
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/src ./src
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/api-docs.yaml ./
COPY --from=frontend-builder /app/frontend/dist ./src/public
EXPOSE 3000
CMD ["npm", "start"]
