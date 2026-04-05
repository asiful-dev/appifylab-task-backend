/**
 * Utility to retry database operations on transient errors
 */

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000;

/**
 * Retries a database operation on transient errors (like connection resets)
 * @param op The database operation to perform
 * @param retries Number of retries remaining
 * @param delay Current delay in milliseconds
 */
export async function withRetry<T>(
  op: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_DELAY_MS,
): Promise<T> {
  try {
    return await op();
  } catch (error: any) {
    // List of transient error codes or message fragments
    const isTransient =
      error.code === '57P01' || // admin_shutdown
      error.code === '57P02' || // crash_shutdown
      error.code === '57P03' || // cannot_connect_now
      error.message?.includes('connection reset') ||
      error.message?.includes('ECONNRESET') ||
      error.message?.includes('EPIPE') ||
      error.message?.includes('ETIMEDOUT') ||
      error.message?.includes('Failed query');

    if (isTransient && retries > 0) {
      const originalError = error.cause?.message || error.message;
      console.warn(
        `[DB Retry V2] Transient error detected: ${originalError}. Retrying in ${delay}ms... (${retries} attempts left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(op, retries - 1, delay * 2);
    }

    // Log the final failure if it's transient but exhausted retries
    if (isTransient && retries === 0) {
      console.error(`[DB Retry] Max retries reached. Final failure: ${error.message}`);
    }

    throw error;
  }
}
