import { json } from '@sveltejs/kit';
export async function GET() { return json({ ok: true, ts: new Date().toISOString() }); }
