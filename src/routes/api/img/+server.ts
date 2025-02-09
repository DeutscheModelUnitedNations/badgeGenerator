import type { RequestHandler } from './$types';
import sharp from 'sharp';

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

		const preparedImage = await sharp(uint8Array)
			.resize({ width: 1200, height: 900, background: '#ffffff', fit: 'contain' })
			.toBuffer();

		await new Promise<void>((resolve, reject) => {
			db.run(
				`INSERT OR REPLACE INTO image (title, extension, image) 
				VALUES (?, ?, ?)`,
				[title, extension, preparedImage.toString('base64')],
				(err: Error) => {
					if (err) {
						throw err;
					} else resolve();
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
