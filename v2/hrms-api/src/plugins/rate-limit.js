import { createHash } from 'node:crypto';
export const createRateLimiter = ({ max, windowMs, auth = false, now = Date.now, maxKeys = 10000 }) => {
  const buckets = new Map();
  return async (request, reply) => {
    const timestamp = now();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
    const key = auth && token ? createHash('sha256').update(token).digest('hex') : request.ip;
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= timestamp) {
      if (buckets.size >= maxKeys) {
        for (const [k, item] of buckets) if (item.until <= timestamp) buckets.delete(k);
        // Fail closed for new keys rather than evicting active limits under attacker churn.
        if (buckets.size >= maxKeys && !buckets.has(key)) return reply.code(429).send({ code: 429, message: 'Too many requests. Try again later.', data: null, error: null });
      }
      bucket = { count: 0, until: timestamp + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    reply.header('ratelimit-limit', max).header('ratelimit-remaining', Math.max(0, max - bucket.count)).header('ratelimit-reset', Math.ceil((bucket.until - timestamp) / 1000));
    if (bucket.count > max) {
      reply.header('retry-after', Math.ceil((bucket.until - timestamp) / 1000));
      if (auth) return reply.code(429).type('text/plain').send('Too many requests, please try again later.');
      return reply.code(429).send({ code: 429, message: 'Too many requests. Try again later.', data: null, error: null });
    }
  };
};
