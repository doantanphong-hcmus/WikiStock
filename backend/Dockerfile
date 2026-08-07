# backend/Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Start application
EXPOSE 3001

CMD ["node", "dist/main.js"]
