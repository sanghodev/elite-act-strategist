/**
 * Rate Limiter for Gemini API
 * Prevents exceeding 10 requests per minute (RPM) limit
 */

interface RateLimitConfig {
    maxRequests: number;  // Maximum requests allowed per window
    windowMs: number;     // Time window in milliseconds
    delayAfter: number;   // Start delaying after this many requests
}

class RateLimiter {
    private requests: number[] = []; // Timestamps of recent requests
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * Wait if necessary to stay within rate limits
     */
    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;

        // Remove requests outside the current window
        this.requests = this.requests.filter(timestamp => timestamp > windowStart);

        // If we've hit the max, wait until the oldest request expires
        if (this.requests.length >= this.config.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = oldestRequest + this.config.windowMs - now + 100; // +100ms buffer

            if (waitTime > 0) {
                console.log(`⏳ Rate limit: Waiting ${Math.ceil(waitTime / 1000)}s to avoid exceeding ${this.config.maxRequests} RPM`);
                await this.delay(waitTime);
                // After waiting, remove the oldest request
                this.requests.shift();
            }
        }
        // If we're approaching the limit (8+ requests), add a small delay
        else if (this.requests.length >= this.config.delayAfter) {
            const delayMs = 1000; // 1 second delay
            console.log(`⏱️ Rate limit: ${this.requests.length}/${this.config.maxRequests} requests used. Adding ${delayMs}ms delay...`);
            await this.delay(delayMs);
        }

        // Record this request
        this.requests.push(now);
    }

    /**
     * Get current usage stats
     */
    getStats(): { used: number; max: number; remaining: number } {
        const now = Date.now();
        const windowStart = now - this.config.windowMs;
        const recentRequests = this.requests.filter(timestamp => timestamp > windowStart);

        return {
            used: recentRequests.length,
            max: this.config.maxRequests,
            remaining: this.config.maxRequests - recentRequests.length
        };
    }

    /**
     * Reset the rate limiter
     */
    reset(): void {
        this.requests = [];
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create a singleton rate limiter for Gemini API
// 10 RPM = 10 requests per 60,000ms
// Start delaying after 8 requests to be safe
export const geminiRateLimiter = new RateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    delayAfter: 8    // Start delaying after 8 requests
});

/**
 * Wrapper function to rate-limit any async function
 */
export async function withRateLimit<T>(
    fn: () => Promise<T>,
    limiter: RateLimiter = geminiRateLimiter
): Promise<T> {
    await limiter.waitIfNeeded();
    return fn();
}
