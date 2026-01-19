import type { RequestHandler } from './$types';
import type { Image, ImageListItem } from '$lib/types';
import sharp from 'sharp';

export const GET: RequestHandler = async ({ locals }) => {
	const db = locals.db;

	try {
		const rows = await new Promise<Image[]>((resolve, reject) => {
			db.all<Image>(
				'SELECT title, extension, createdAt, width, height, fileSize FROM image ORDER BY title ASC',
				(err: Error | null, rows: Image[]) => {
					if (err) reject(err);
					else resolve(rows);
				}
			);
		});

		const images: ImageListItem[] = rows.map((row) => ({
			title: row.title,
			extension: row.extension,
			url: `/api/img/${encodeURIComponent(row.title)}`,
			createdAt: row.createdAt,
			width: row.width,
			height: row.height,
			fileSize: row.fileSize
		}));

		return new Response(JSON.stringify(images), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Failed to fetch images:', err);
		return new Response('Failed to fetch images', { status: 500 });
	}
};

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

		// Store original image for later editing
		const originalImage = Buffer.from(uint8Array).toString('base64');

		const preparedImage = await sharp(uint8Array)
			.resize({
				width: 1200,
				height: 900,
				background: extension === 'png' ? undefined : '#ffffff',
				fit: 'cover'
			})
			.toBuffer();

		// Get image metadata
		const metadata = await sharp(preparedImage).metadata();
		const createdAt = new Date().toISOString();
		const fileSize = preparedImage.length;
		const width = metadata.width || 1200;
		const height = metadata.height || 900;

		await new Promise<void>((resolve, reject) => {
			db.run(
				`INSERT OR REPLACE INTO image (title, extension, image, createdAt, width, height, fileSize, originalImage)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				[title, extension, preparedImage.toString('base64'), createdAt, width, height, fileSize, originalImage],
				(err: Error) => {
					if (err) {
						reject(err);
					} else resolve();
				}
			);
		});

		const responseData: ImageListItem = {
			title,
			extension,
			url: `/api/img/${encodeURIComponent(title)}`,
			createdAt,
			width,
			height,
			fileSize
		};

		return new Response(JSON.stringify(responseData), {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
				Location: `/api/img/${encodeURIComponent(title)}`
			}
		});
	} catch (err) {
		console.error('Failed to process image:', err);
		return new Response('Failed to process image', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
