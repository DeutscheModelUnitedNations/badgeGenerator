import type { Image, ImageListItem } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const sortBy = url.searchParams.get('sort') || 'title';
	const sortOrder = url.searchParams.get('order') || 'asc';

	const validSortFields = ['title', 'createdAt', 'extension', 'fileSize'];
	const orderBy = validSortFields.includes(sortBy) ? sortBy : 'title';
	const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

	const loadDataPromise = new Promise<Image[]>((resolve, reject) => {
		const db = locals.db;
		const query = `SELECT title, extension, createdAt, width, height, fileSize FROM image ORDER BY ${orderBy} ${order}`;
		db.all<Image>(query, (err: Error | null, rows: Image[]) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(rows);
		});
	});
	const rows = await loadDataPromise;

	const images: ImageListItem[] = rows.map((row) => ({
		title: row.title,
		extension: row.extension,
		url: `/api/img/${encodeURIComponent(row.title)}`,
		createdAt: row.createdAt,
		width: row.width,
		height: row.height,
		fileSize: row.fileSize
	}));

	return {
		images,
		sort: orderBy,
		order: sortOrder
	};
};
