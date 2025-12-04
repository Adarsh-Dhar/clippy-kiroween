/**
 * Write Batcher - Batches database writes for performance
 * 
 * Groups multiple write operations and executes them in batches
 */

type WriteOperation = {
  type: string;
  execute: () => Promise<void>;
};

export class WriteBatcher {
  private queue: WriteOperation[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs: number = 500;
  private autoFlushInterval: ReturnType<typeof setInterval> | null = null;
  private autoFlushMs: number = 5000; // 5 seconds

  constructor(debounceMs: number = 500, autoFlushMs: number = 5000) {
    this.debounceMs = debounceMs;
    this.autoFlushMs = autoFlushMs;
    this.startAutoFlush();
  }

  /**
   * Add a write operation to the batch queue
   */
  add(operation: WriteOperation): void {
    this.queue.push(operation);
    this.scheduleFlush();
  }

  /**
   * Schedule a flush after debounce period
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  /**
   * Start automatic flush interval
   */
  private startAutoFlush(): void {
    this.autoFlushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, this.autoFlushMs);
  }

  /**
   * Execute all pending writes
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const operations = [...this.queue];
    this.queue = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Execute operations sequentially to avoid overwhelming the API
    for (const op of operations) {
      try {
        await op.execute();
      } catch (error) {
        console.error(`Write operation failed (${op.type}):`, error);
        // Continue with other operations even if one fails
      }
    }
  }

  /**
   * Cleanup timers
   */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.autoFlushInterval) {
      clearInterval(this.autoFlushInterval);
      this.autoFlushInterval = null;
    }
    // Flush remaining operations
    this.flush();
  }
}

