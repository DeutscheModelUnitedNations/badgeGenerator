import type { RequestHandler } from './$types';

interface Session {
	token: string;
	data: string;
	createdAt: number;
	expiresAt: number;
}

export const GET: RequestHandler = async ({ params, locals }) => {
	const db = locals.db;
	const { token } = params;

	try {
		const session = await new Promise<Session | undefined>((resolve, reject) => {
			db.get<Session>(
				'SELECT token, data, createdAt, expiresAt FROM sessions WHERE token = ?',
				[token],
				(err: Error | null, row: Session | undefined) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (!session) {
			return new Response(JSON.stringify({ error: 'Session not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Check if session has expired
		if (session.expiresAt < Date.now()) {
			// Clean up expired session
			db.run('DELETE FROM sessions WHERE token = ?', [token]);

			return new Response(JSON.stringify({ error: 'Session expired' }), {
				status: 410,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = JSON.parse(session.data);

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Failed to resolve session:', err);
		return new Response(JSON.stringify({ error: 'Failed to resolve session' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
