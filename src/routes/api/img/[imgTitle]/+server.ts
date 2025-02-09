import sharp from 'sharp';
import type { RequestEvent, RequestHandler } from './$types';
import type { Image } from '$lib/types';

export const GET: RequestHandler = async ({ locals, params, url }) => {
	try {
		const db = locals.db;
		const query = `SELECT extension, image FROM image WHERE title = ?`;

		const result = await new Promise<{ extension: string; image: Uint8Array } | undefined>(
			(resolve, reject) => {
				db.get<Image>(query, [params.imgTitle], (err: Error, row: any) => {
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

		if (url.searchParams.has('preview')) {
			const buffer = await sharp(result.image).resize({ width: 200 }).toBuffer();
			result.image = new Uint8Array(buffer);
		}

		console.info('Image found:', params.imgTitle);
		return new Response(result.image, {
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
