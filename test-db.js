require('dotenv').config();
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Database connection successful!');
    console.log('Current time from DB:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    process.exit(1);
  }
})();
