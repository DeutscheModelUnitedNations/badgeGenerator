import type { PageServerLoad } from './$types';

interface Session {
	token: string;
	data: string;
	createdAt: number;
	expiresAt: number;
}

export interface SessionData {
	name?: string;
	countryName?: string;
	countryAlpha2Code?: string;
	alternativeImage?: string;
	committee?: string;
	pronouns?: string;
	id?: string;
	mediaConsentStatus?: string;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const token = url.searchParams.get('t');

	if (!token) {
		return { sessionData: null };
	}

	const db = locals.db;

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
			return { sessionData: null, tokenError: 'not_found' };
		}

		// Check if session has expired
		if (session.expiresAt < Date.now()) {
			// Clean up expired session
			db.run('DELETE FROM sessions WHERE token = ?', [token]);
			return { sessionData: null, tokenError: 'expired' };
		}

		const data: SessionData = JSON.parse(session.data);

		return { sessionData: data };
	} catch (err) {
		console.error('Failed to resolve session:', err);
		return { sessionData: null, tokenError: 'error' };
	}
};
