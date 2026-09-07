const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; retryAfter: number } {
	const now = Date.now();
	const arr = hits.get(key) ?? [];
	const cutoff = now - windowMs;
	const recent = arr.filter((t) => t > cutoff);
	if (recent.length >= limit) {
		const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000);
		hits.set(key, recent);
		return { allowed: false, retryAfter: Math.max(1, retryAfter) };
	}
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 5000) {
		for (const [k, v] of hits) if (v.length === 0 || v[0] < cutoff) hits.delete(k);
	}
	return { allowed: true, retryAfter: 0 };
}

export function clientKey(request: Request, fallback = 'unknown'): string {
	const xf = request.headers.get('x-forwarded-for');
	if (xf) return xf.split(',')[0].trim();
	const xr = request.headers.get('x-real-ip');
	if (xr) return xr.trim();
	return fallback;
}
