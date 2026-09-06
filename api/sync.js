import { Redis } from '@upstash/redis';

// This automatically connects using the environment variables Upstash will provide
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const statuses = await redis.hgetall('tracker_statuses') || {};
    const notes = await redis.hgetall('tracker_notes') || {};
    return res.status(200).json({ statuses, notes });
  }

  if (req.method === 'POST') {
    const { type, key, value, token } = req.body;

    if (type === 'status') {
      if (token !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redis.hset('tracker_statuses', { [key]: value });
      return res.status(200).json({ success: true });
    }

    if (type === 'notes') {
      await redis.hset('tracker_notes', { [key]: value });
      return res.status(200).json({ success: true });
    }
  }
}