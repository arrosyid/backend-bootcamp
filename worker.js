import { Worker } from 'worker_threads';
import { memoryUsage } from 'process';

// Monitor memory usage
function checkMemory() {
    const used = memoryUsage();
    console.log(`Memory usage: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
    if (used.heapUsed > threshold) {
        // If --expose-gc is enabled
        if (global.gc) {
            global.gc();
        }
    }
}

// Use worker threads for CPU-intensive tasks
function runWorker(data) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('./worker.js', {
            workerData: data
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0) reject(new Error(`Worker stopped: ${code}`));
        });
    });
}
