# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json* ./

# Install dependencies (includes @prisma/client)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Start application
EXPOSE 3001

CMD ["node", "dist/src/main.js"]
