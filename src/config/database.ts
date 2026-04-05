import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema/schema.js';
import { env } from './env.js';

/**
 * Initialize PostgreSQL client with connection pooling
 * Using Supabase connection pooler for better performance
 */
const queryClient = postgres(env.DATABASE_URL!, {
  prepare: false,
  ssl: 'require',
  connect_timeout: 30, // 30 seconds
  idle_timeout: 30, // 30 seconds
  keep_alive: 10000, // 10 seconds (milliseconds)
  max: 10,
});

/**
 * Create and export Drizzle ORM instance
 * All database queries will go through this instance
 */
export const db = drizzle(queryClient, { schema });

export default db;
