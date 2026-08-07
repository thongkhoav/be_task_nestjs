import { parseFrontendOrigins } from '../common/util/frontendOrigins';

const localFrontendOrigin = 'http://localhost:3000';

export const socketCors = {
  credentials: true,
  origin(
    origin: string | undefined,
    callback: (error: Error, allow?: boolean) => void,
  ) {
    const allowedOrigins = new Set([
      localFrontendOrigin,
      ...parseFrontendOrigins(process.env.FE_ORIGINS),
    ]);

    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed'));
  },
};
