import type { Image } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Replace the dummy images array with your actual image fetching logic.
	const loadDataPromise = new Promise<Image[]>((resolve, reject) => {
		const db = locals.db;
		const query = 'SELECT * FROM image ORDER BY title';
		db.all<Image>(query, (err: Error | null, rows: Image[]) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	const rows = await loadDataPromise;

	return {
		images: rows.map((row) => ({
			title: row.title,
			url: `/api/img/${encodeURIComponent(row.title)}`
		}))
	};
};
