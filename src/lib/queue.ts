import { Queue, Worker } from "bullmq";
import { processPublishJob } from "./queue-processor";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
let connection: {
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxRetriesPerRequest: null;
};

try {
  const parsed = new URL(redisUrl);
  connection = {
    host: parsed.hostname || "127.0.0.1",
    port: parseInt(parsed.port || "6379", 10),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
} catch {
  connection = {
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
  };
}

const queueName = "post-publishing-queue";

const globalForQueue = global as unknown as {
  queue: Queue;
  worker: Worker;
};

export const queue = globalForQueue.queue || new Queue(queueName, { connection });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.queue = queue;
}

// Embedded worker for dev/single-process deploys (use `npm run worker` in production)
if (!globalForQueue.worker && process.env.DISABLE_EMBEDDED_WORKER !== "true") {
  globalForQueue.worker = new Worker(
    queueName,
    async (job) => {
      const { draftId, userId, platform } = job.data;
      await processPublishJob(draftId, userId, platform);
    },
    { connection, concurrency: 1 },
  );
}

export const worker = globalForQueue.worker;
