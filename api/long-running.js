// Příklad long-running API endpointu pro Railway/Cloud Run
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Pro dlouhé úlohy použijte queue system
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const taskQueue = new Queue('long-tasks', { connection: redis });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskType, data } = req.body;

  try {
    // Pro úlohy > 5 minut, použijte queue
    if (taskType === 'generate-large-project') {
      // Přidat úlohu do fronty
      const job = await taskQueue.add('generate-project', {
        ...data,
        timestamp: Date.now()
      });

      // Vrátit job ID pro polling
      return res.status(202).json({
        status: 'queued',
        jobId: job.id,
        pollUrl: `/api/job-status/${job.id}`
      });
    }

    // Pro kratší úlohy (< 5 min), zpracovat přímo
    if (taskType === 'quick-task') {
      const result = await processQuickTask(data);
      return res.status(200).json({ result });
    }

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function processQuickTask(data) {
  // Zpracování které trvá < 5 minut
  return { success: true, data };
}