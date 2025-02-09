import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const db = locals.db;

	try {
		// Read binary data directly from request body
		const arrayBuffer = await request.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);

		// Get metadata from headers
		const title = request.headers.get('X-Image-Title');
		const extension = request.headers.get('X-Image-Extension');

		if (!title || !extension) {
			return new Response('Missing required headers', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		const MAX_SIZE = 10 * 1024 * 1024; // 10MB
		if (uint8Array.length > MAX_SIZE) {
			return new Response('File too large', { status: 413 });
		}

		await new Promise<void>((resolve, reject) => {
			db.run(
				`INSERT OR REPLACE INTO image (title, extension, image) 
                 VALUES (?, ?, ?)`,
				[title, extension, uint8Array],
				(err: Error) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		return new Response(null, {
			status: 201,
			headers: {
				'Content-Type': 'application/octet-stream',
				Location: `/api/img/${encodeURIComponent(title)}`
			}
		});
	} catch (err) {
		return new Response('Failed to process image', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
