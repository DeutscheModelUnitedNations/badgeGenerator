import sharp from 'sharp';
import type { RequestHandler } from './$types';
import type { Image, ImageListItem } from '$lib/types';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	try {
		const db = locals.db;
		const query = `SELECT extension, image FROM image WHERE title = ?`;

		const result = await new Promise<{ extension: string; image: string } | undefined>(
			(resolve, reject) => {
				db.get<Image>(query, [params.imgTitle], (err: Error | null, row: Image) => {
					if (err) reject(err);
					else resolve(row as typeof result);
				});
			}
		);

		if (!result) {
			console.error('Image not found:', params.imgTitle);
			return new Response('Image not found', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		let image = Buffer.from(result.image, 'base64');

		if (url.searchParams.has('preview')) {
			image = await sharp(image).resize({ width: 200 }).toBuffer();
		}

		console.info('Image found:', params.imgTitle);
		return new Response(new Uint8Array(image), {
			headers: {
				'Content-Type': `image/${result.extension}`,
				'Content-Disposition': `inline; filename="${params.imgTitle}.${result.extension}"`,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (err) {
		console.error(err);
		return new Response('Database error', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	const db = locals.db;
	const query = `DELETE FROM image WHERE title = ?`;

	try {
		await new Promise<void>((resolve, reject) => {
			db.run(query, [params.imgTitle], (err: Error) => {
				if (err) reject(err);
				else resolve();
			});
		});

		return new Response('Image deleted', {
			headers: { 'Content-Type': 'text/plain' },
			status: 200
		});
	} catch (err) {
		return new Response('Database error', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	const db = locals.db;

	try {
		const body = await request.json();
		const newTitle = body.title;

		if (!newTitle || typeof newTitle !== 'string') {
			return new Response('Missing or invalid title', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		if (newTitle === params.imgTitle) {
			return new Response('New title is the same as old title', {
				status: 400,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		// Check if new title already exists
		const existingImage = await new Promise<Image | undefined>((resolve, reject) => {
			db.get<Image>('SELECT title FROM image WHERE title = ?', [newTitle], (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});

		if (existingImage) {
			return new Response('An image with this title already exists', {
				status: 409,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		// Update the title
		await new Promise<void>((resolve, reject) => {
			db.run('UPDATE image SET title = ? WHERE title = ?', [newTitle, params.imgTitle], (err: Error) => {
				if (err) reject(err);
				else resolve();
			});
		});

		// Fetch updated image data
		const updatedImage = await new Promise<Image | undefined>((resolve, reject) => {
			db.get<Image>(
				'SELECT title, extension, createdAt, width, height, fileSize FROM image WHERE title = ?',
				[newTitle],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (!updatedImage) {
			return new Response('Image not found after update', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' }
			});
		}

		const responseData: ImageListItem = {
			title: updatedImage.title,
			extension: updatedImage.extension,
			url: `/api/img/${encodeURIComponent(updatedImage.title)}`,
			createdAt: updatedImage.createdAt,
			width: updatedImage.width,
			height: updatedImage.height,
			fileSize: updatedImage.fileSize
		};

		return new Response(JSON.stringify(responseData), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		console.error('Error renaming image:', err);
		return new Response('Database error', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
