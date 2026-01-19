import type { RequestHandler } from './$types';
import { randomUUID } from 'crypto';

interface SessionData {
	name?: string;
	countryName?: string;
	countryAlpha2Code?: string;
	alternativeImage?: string;
	committee?: string;
	pronouns?: string;
	id?: string;
	mediaConsentStatus?: string;
}

const SESSION_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const db = locals.db;

	try {
		const data: SessionData = await request.json();

		// Validate that at least name is provided
		if (!data.name) {
			return new Response(JSON.stringify({ error: 'Name is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const token = randomUUID();
		const now = Date.now();
		const expiresAt = now + SESSION_EXPIRY_MS;

		await new Promise<void>((resolve, reject) => {
			db.run(
				'INSERT INTO sessions (token, data, createdAt, expiresAt) VALUES (?, ?, ?, ?)',
				[token, JSON.stringify(data), now, expiresAt],
				(err: Error | null) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		// Use X-Forwarded-Proto header if behind a proxy, otherwise use url.origin
		const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
		const host = request.headers.get('x-forwarded-host') || url.host;
		const sessionUrl = `${proto}://${host}/?t=${token}`;

		return new Response(
			JSON.stringify({
				token,
				url: sessionUrl,
				expiresAt: new Date(expiresAt).toISOString()
			}),
			{
				status: 201,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch (err) {
		console.error('Failed to create session:', err);
		return new Response(JSON.stringify({ error: 'Failed to create session' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
