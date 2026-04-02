import "dotenv/config";

/**
 * Validate and export environment variables
 * Throws error if required env vars are missing
 */
export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "5000", 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,

  // JWT Secrets
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || "15m",
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || "7d",

  // Frontend URL (for CORS)
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = [
    "DATABASE_URL",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  for (const key of required) {
    if (!env[key as keyof typeof env]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

validateEnv();
export default env;
