import { Redis } from '@upstash/redis';

// explicitly pass the custom variable names from your Vercel dashboard
const redis = new Redis({
  url: process.env.Redis_KV_REST_API_URL,
  token: process.env.Redis_KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
  // GET: Send all data to anyone who asks
  if (req.method === 'GET') {
    try {
      const statuses = await redis.hgetall('tracker_statuses') || {};
      const notes = await redis.hgetall('tracker_notes') || {};
      return res.status(200).json({ statuses, notes });
    } catch (error) {
      console.error("GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Handle saves
  if (req.method === 'POST') {
    try {
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
    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}