import rateLimit from 'express-rate-limit';

const buildRateLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'TooManyRequestsError',
          message,
        },
      });
    },
  });

export const authRateLimiter = buildRateLimiter(
  60 * 1000,
  5,
  'Too many auth attempts. Please try again in a minute.',
);

export const apiRateLimiter = buildRateLimiter(
  60 * 1000,
  100,
  'Too many requests. Please try again shortly.',
);
