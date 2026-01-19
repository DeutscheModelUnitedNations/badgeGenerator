import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
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
		const contentType = request.headers.get('content-type') || '';
		let data: SessionData;

		if (contentType.includes('application/json')) {
			// Parse JSON body
			const json = await request.json();
			data = {
				name: json.name || undefined,
				countryName: json.countryName || undefined,
				countryAlpha2Code: json.countryAlpha2Code || undefined,
				alternativeImage: json.alternativeImage || undefined,
				committee: json.committee || undefined,
				pronouns: json.pronouns || undefined,
				id: json.id || undefined,
				mediaConsentStatus: json.mediaConsentStatus || undefined
			};
		} else {
			// Parse FormData (multipart/form-data or application/x-www-form-urlencoded)
			const formData = await request.formData();
			data = {
				name: formData.get('name')?.toString() || undefined,
				countryName: formData.get('countryName')?.toString() || undefined,
				countryAlpha2Code: formData.get('countryAlpha2Code')?.toString() || undefined,
				alternativeImage: formData.get('alternativeImage')?.toString() || undefined,
				committee: formData.get('committee')?.toString() || undefined,
				pronouns: formData.get('pronouns')?.toString() || undefined,
				id: formData.get('id')?.toString() || undefined,
				mediaConsentStatus: formData.get('mediaConsentStatus')?.toString() || undefined
			};
		}

		// Validate that at least name is provided
		if (!data.name) {
			return new Response('Name is required', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' }
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

		// Redirect to the main page with the token
		throw redirect(302, `/?t=${token}`);
	} catch (err) {
		// Re-throw redirect responses
		if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
			throw err;
		}

		console.error('Failed to create session:', err);
		return new Response('Failed to create session', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
