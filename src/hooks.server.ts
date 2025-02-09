import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';

const db = await new Promise<sqlite3.Database>((resolve) => {
	function onResolve(err: Error | null) {
		if (err) {
			console.error('Database Hook: Error creating database', err);
			throw err;
		}
		resolve(internaldb);
	}
	const internaldb = new sqlite3.Database('db.sqlite', onResolve);
});

console.info('Database Hook: Creating table');
		const query =
			'CREATE TABLE IF NOT EXISTS image (title TEXT NOT NULL PRIMARY KEY, extension TEXT NOT NULL, image BLOB NOT NULL)';
		await new Promise<void>(resolve => {
			db.run(query, (err) => {
				if (err) {
					console.error('Database Hook: Error creating table', err);
					throw err;
				}
				resolve();
			});
		})

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.locals.db) {
		event.locals.db = db;
	}
	const resp = await resolve(event);
	return resp;
};
