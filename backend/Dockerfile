FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wikistock" npx prisma generate && npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
