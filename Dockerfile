# Frontend Build
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Backend Build
FROM node:18 AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
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
