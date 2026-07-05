/**
 * Standalone BullMQ worker — run separately from Next.js:
 *   npm run worker
 */
import { Worker } from "bullmq";
import { processPublishJob } from "../src/lib/queue-processor";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const parsed = new URL(redisUrl);

const connection = {
  host: parsed.hostname || "127.0.0.1",
  port: parseInt(parsed.port || "6379", 10),
  username: parsed.username || undefined,
  password: parsed.password || undefined,
  maxRetriesPerRequest: null as null,
};

const worker = new Worker(
  "post-publishing-queue",
  async (job) => {
    const { draftId, userId, platform } = job.data;
    await processPublishJob(draftId, userId, platform);
  },
  { connection, concurrency: 1 },
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

console.log("[PSMM Worker] Listening on post-publishing-queue...");
