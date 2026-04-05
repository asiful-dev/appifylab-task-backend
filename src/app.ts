import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { openApiSpec } from './config/swagger.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.middleware.js';
import { requestLogger } from './middleware/requestLogger.js';

/**
 * Initialize Express app
 */
export const app: Express = express();

/**
 * Trust proxy (important for DigitalOcean reverse proxy setup)
 */
app.set('trust proxy', 1);

/**
 * Security middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

/**
 * Logging middleware
 */
if (env.NODE_ENV === 'production') {
  app.use(morgan('combined')); // Apache combined log format
} else {
  app.use(morgan('dev')); // Concise output for development
}
app.use(requestLogger);
app.use('/api', apiRateLimiter);

app.use('/api', apiRouter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
});

app.get('/api/spec', (_req: Request, res: Response) => {
  res.status(200).json(openApiSpec);
});

/**
 * Health check endpoint (used by load balancers)
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

/**
 * Global error handler (must be last)
 */
app.use(errorHandler);

export default app;
