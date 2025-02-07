import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import svgToImg from 'svg-to-img';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function GET({ params }) {
	try {
		console.log('start');
		const country = params.country.toLowerCase();
		const flagPath = join(
			dirname(dirname(dirname(dirname(dirname(__dirname))))),
			'node_modules',
			'flag-icons',
			'flags',
			'4x3',
			`${country}.svg`
		);

		const svg = readFileSync(flagPath, 'utf-8');

		const img = await svgToImg.from(svg).toPng({ width: 500 });

		console.log('end');
		return new Response(img, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=31536000'
			}
		});
	} catch (err) {
		console.log(err);
		throw error(404, err.message);
	}
}
