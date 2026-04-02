import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema/schema";

/**
 * Initialize PostgreSQL client with connection pooling
 * Using Supabase connection pooler for better performance
 */
const queryClient = postgres(process.env.DATABASE_URL!);

/**
 * Create and export Drizzle ORM instance
 * All database queries will go through this instance
 */
export const db = drizzle(queryClient, { schema });

export default db;
