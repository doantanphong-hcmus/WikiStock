# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install dependencies (includes @prisma/client)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript (prisma client is already in node_modules)
RUN npm run build

# Start application
EXPOSE 3001

CMD ["node", "dist/main.js"]
