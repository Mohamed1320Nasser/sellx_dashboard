/**
 * Request deduplication utility to prevent multiple identical requests
 */
class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Execute a request with deduplication
   * If the same request is already pending, returns the existing promise
   */
  async execute<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 30000 // 30 seconds default TTL
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);

    // Set TTL to prevent hanging requests
    setTimeout(() => {
      if (this.pendingRequests.has(key)) {
        this.pendingRequests.delete(key);
      }
    }, ttl);

    return requestPromise;
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Get current pending requests (for debugging)
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.keys());
  }
}

export const requestDeduplication = new RequestDeduplication();
