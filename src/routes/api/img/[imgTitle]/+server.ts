import sharp from 'sharp';
import type { RequestHandler } from './$types';
import type { Image, ImageListItem, ImageEditSettings } from '$lib/types';

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

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	const db = locals.db;

	try {
		const settings: ImageEditSettings = await request.json();

		// Validate settings
		if (!settings.fitMode || !['cover', 'contain'].includes(settings.fitMode)) {
			return new Response('Invalid fitMode', { status: 400 });
		}
		if (typeof settings.zoom !== 'number' || settings.zoom < 0.5 || settings.zoom > 2.0) {
			return new Response('Invalid zoom (must be 0.5-2.0)', { status: 400 });
		}
		if (typeof settings.offsetX !== 'number' || settings.offsetX < -100 || settings.offsetX > 100) {
			return new Response('Invalid offsetX (must be -100 to 100)', { status: 400 });
		}
		if (typeof settings.offsetY !== 'number' || settings.offsetY < -100 || settings.offsetY > 100) {
			return new Response('Invalid offsetY (must be -100 to 100)', { status: 400 });
		}
		if (!settings.backgroundColor || !/^#[0-9A-Fa-f]{6}$/.test(settings.backgroundColor)) {
			return new Response('Invalid backgroundColor (must be hex color)', { status: 400 });
		}

		// Fetch image from database (prefer original if available)
		const result = await new Promise<{ extension: string; image: string; originalImage?: string } | undefined>(
			(resolve, reject) => {
				db.get<Image & { originalImage?: string }>(
					'SELECT extension, image, originalImage FROM image WHERE title = ?',
					[params.imgTitle],
					(err: Error | null, row: Image & { originalImage?: string }) => {
						if (err) reject(err);
						else resolve(row as typeof result);
					}
				);
			}
		);

		if (!result) {
			return new Response('Image not found', { status: 404 });
		}

		// Use original image if available, otherwise fall back to processed image
		const sourceImage = result.originalImage || result.image;
		const originalBuffer = Buffer.from(sourceImage, 'base64');
		const metadata = await sharp(originalBuffer).metadata();
		const origWidth = metadata.width || 1200;
		const origHeight = metadata.height || 900;

		const targetWidth = 1200;
		const targetHeight = 900;
		const targetAspect = targetWidth / targetHeight; // 4:3

		let processedBuffer: Buffer;

		if (settings.fitMode === 'contain') {
			// Contain mode: fit image inside with background color padding
			processedBuffer = await sharp(originalBuffer)
				.resize({
					width: targetWidth,
					height: targetHeight,
					fit: 'contain',
					background: settings.backgroundColor
				})
				.toBuffer();
		} else {
			// Cover mode with zoom and offset
			const origAspect = origWidth / origHeight;

			// Calculate base crop dimensions (before zoom)
			let baseWidth: number;
			let baseHeight: number;

			if (origAspect > targetAspect) {
				// Original is wider - height constrained
				baseHeight = origHeight;
				baseWidth = Math.round(origHeight * targetAspect);
			} else {
				// Original is taller - width constrained
				baseWidth = origWidth;
				baseHeight = Math.round(origWidth / targetAspect);
			}

			// Apply zoom (smaller zoom = larger source region = more visible)
			const zoomedWidth = Math.round(baseWidth / settings.zoom);
			const zoomedHeight = Math.round(baseHeight / settings.zoom);

			// Clamp to original dimensions
			const cropWidth = Math.min(zoomedWidth, origWidth);
			const cropHeight = Math.min(zoomedHeight, origHeight);

			// Calculate center position
			const centerX = origWidth / 2;
			const centerY = origHeight / 2;

			// Apply offset (percentage of available movement range)
			const maxOffsetX = (origWidth - cropWidth) / 2;
			const maxOffsetY = (origHeight - cropHeight) / 2;

			const offsetX = (settings.offsetX / 100) * maxOffsetX;
			const offsetY = (settings.offsetY / 100) * maxOffsetY;

			// Calculate crop region
			let left = Math.round(centerX - cropWidth / 2 + offsetX);
			let top = Math.round(centerY - cropHeight / 2 + offsetY);

			// Clamp to valid bounds
			left = Math.max(0, Math.min(left, origWidth - cropWidth));
			top = Math.max(0, Math.min(top, origHeight - cropHeight));

			// Extract and resize
			processedBuffer = await sharp(originalBuffer)
				.extract({ left, top, width: cropWidth, height: cropHeight })
				.resize({ width: targetWidth, height: targetHeight, fit: 'fill' })
				.toBuffer();
		}

		// Get new metadata
		const newMetadata = await sharp(processedBuffer).metadata();
		const fileSize = processedBuffer.length;

		// Update database
		const base64Image = processedBuffer.toString('base64');
		await new Promise<void>((resolve, reject) => {
			db.run(
				'UPDATE image SET image = ?, width = ?, height = ?, fileSize = ? WHERE title = ?',
				[base64Image, newMetadata.width, newMetadata.height, fileSize, params.imgTitle],
				(err: Error) => {
					if (err) reject(err);
					else resolve();
				}
			);
		});

		// Fetch updated record
		const updatedImage = await new Promise<Image | undefined>((resolve, reject) => {
			db.get<Image>(
				'SELECT title, extension, createdAt, width, height, fileSize FROM image WHERE title = ?',
				[params.imgTitle],
				(err, row) => {
					if (err) reject(err);
					else resolve(row);
				}
			);
		});

		if (!updatedImage) {
			return new Response('Image not found after update', { status: 404 });
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
		console.error('Error editing image:', err);
		return new Response('Error processing image', {
			status: 500,
			headers: { 'Content-Type': 'text/plain' }
		});
	}
};
