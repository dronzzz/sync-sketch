import { startWorker } from "./queue/queueHandler";

startWorker().catch((error) => {
    console.error('Worker failed to start:', error);
    process.exit(1);
})