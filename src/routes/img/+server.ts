import { writeFileSync } from 'fs';
import { json } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const data: { title: string; extension: string; image: Base64URLString } = await request.json();
		const { title, extension, image } = data;
		const filename = `${title}.${extension}`;

		writeFileSync(`static/uploads/${filename}`, image, 'base64');

		return json({ success: true, filename });
	} catch (error) {
		console.error(error);
		return json({ success: false, error: error.message }, { status: 500 });
	}
};
