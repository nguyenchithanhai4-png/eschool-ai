/**
 * AI Request Queue
 * E-School AI - New Architecture
 * 
 * Đảm bảo chỉ 1 request GPU-intensive chạy tại 1 thời điểm
 * - FIFO order
 * - Timeout protection
 * - Prevents GPU overload
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    maxConcurrent: 1,           // Chỉ 1 request GPU tại 1 thời điểm
    maxQueueSize: 50,           // Giới hạn queue
    requestTimeout: 120000      // 2 phút timeout per request
};

// ============================================
// QUEUE STATE
// ============================================
let isProcessing = false;
let currentProcessingCount = 0;
const queue = [];

// Statistics
let stats = {
    totalProcessed: 0,
    totalQueued: 0,
    totalTimeout: 0,
    totalError: 0
};

// ============================================
// QUEUE FUNCTIONS
// ============================================

/**
 * Enqueue a task for processing
 * Returns a Promise that resolves when the task completes
 * 
 * @param {Function} task - Async function to execute
 * @param {string} taskName - Name for logging
 * @returns {Promise<any>}
 */
function enqueue(task, taskName = 'AI Task') {
    return new Promise((resolve, reject) => {
        // Check queue size limit
        if (queue.length >= CONFIG.maxQueueSize) {
            console.log(`[AIQueue] Queue full (${queue.length}/${CONFIG.maxQueueSize}), rejecting: ${taskName}`);
            return reject(new Error('AI queue is full. Please try again later.'));
        }

        const queueItem = {
            task,
            taskName,
            resolve,
            reject,
            enqueuedAt: Date.now()
        };

        queue.push(queueItem);
        stats.totalQueued++;

        console.log(`[AIQueue] Enqueued: ${taskName} (queue size: ${queue.length})`);

        // Try to process immediately
        processNext();
    });
}

/**
 * Process next item in queue
 */
async function processNext() {
    // Already at max capacity
    if (currentProcessingCount >= CONFIG.maxConcurrent) {
        return;
    }

    // Nothing to process
    if (queue.length === 0) {
        return;
    }

    // Get next item
    const item = queue.shift();
    const waitTime = Date.now() - item.enqueuedAt;

    console.log(`[AIQueue] Processing: ${item.taskName} (waited ${waitTime}ms, remaining: ${queue.length})`);

    currentProcessingCount++;
    isProcessing = true;

    // Setup timeout
    const timeoutId = setTimeout(() => {
        console.error(`[AIQueue] TIMEOUT: ${item.taskName}`);
        stats.totalTimeout++;
        item.reject(new Error('Request timed out after ' + CONFIG.requestTimeout + 'ms'));
    }, CONFIG.requestTimeout);

    try {
        const result = await item.task();
        clearTimeout(timeoutId);
        stats.totalProcessed++;
        item.resolve(result);

    } catch (err) {
        clearTimeout(timeoutId);
        stats.totalError++;
        console.error(`[AIQueue] Error in ${item.taskName}:`, err.message);
        item.reject(err);

    } finally {
        currentProcessingCount--;
        isProcessing = currentProcessingCount > 0;

        // Process next in queue
        setImmediate(processNext);
    }
}

// ============================================
// STATUS FUNCTIONS
// ============================================

/**
 * Get current queue length
 * @returns {number}
 */
function getQueueLength() {
    return queue.length;
}

/**
 * Check if queue is busy
 * @returns {boolean}
 */
function isQueueBusy() {
    return isProcessing || queue.length > 0;
}

/**
 * Get queue statistics
 * @returns {Object}
 */
function getStats() {
    return {
        ...stats,
        currentQueueLength: queue.length,
        isProcessing: isProcessing,
        currentProcessingCount: currentProcessingCount,
        maxConcurrent: CONFIG.maxConcurrent,
        maxQueueSize: CONFIG.maxQueueSize
    };
}

/**
 * Clear the queue (emergency)
 */
function clearQueue() {
    const cleared = queue.length;
    queue.forEach(item => {
        item.reject(new Error('Queue cleared'));
    });
    queue.length = 0;
    console.log(`[AIQueue] Queue cleared (${cleared} items removed)`);
    return cleared;
}

// ============================================
// EXPORTS
// ============================================
module.exports = {
    enqueue,
    getQueueLength,
    isQueueBusy,
    getStats,
    clearQueue,
    CONFIG
};
