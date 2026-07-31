export const appConfig = {
  get port() {
    return Number(process.env.PORT ?? 3001);
  },
  get frontendUrl() {
    return process.env.FRONTEND_URL ?? 'http://localhost:3000';
  },
  get jwtSecret() {
    return process.env.JWT_SECRET;
  },
  get jwtExpiresInSeconds() {
    return Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);
  },
};
