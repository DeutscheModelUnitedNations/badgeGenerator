import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const db = locals.db;

	try {
		console.info('POST /api/img');

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
		console.log('Pre ' + uint8Array.slice(0, 10));
		await new Promise<void>((resolve, reject) => {
			console.log('In Promise' + uint8Array.slice(0, 10));
			db.run(
				`INSERT OR REPLACE INTO image (title, extension, image) 
				VALUES (?, ?, ?)`,
				[title, extension, uint8Array],
				(err: Error) => {
					console.log('In Callback' + uint8Array.slice(0, 10));
					if (err) {
						console.log('Error inserting image:', err);
						throw err;
					} else resolve();
				}
			);
			console.log('After db.run' + uint8Array.slice(0, 10));
		});
		console.log('Post' + uint8Array.slice(0, 10));

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
