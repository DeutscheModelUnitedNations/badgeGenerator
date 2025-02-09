import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.locals.db) {
		// This will create the database within the `db.sqlite` file.
		console.info('Database Hook: Creating database');
		const db = new sqlite3.Database('db.sqlite', (err) => {
			if (err) {
				console.error('Database Hook: Error creating database');
				throw err;
			}
		});

		event.locals.db = db;

		console.info('Database Hook: Creating table');
		const query =
			'CREATE TABLE IF NOT EXISTS image (title TEXT NOT NULL PRIMARY KEY, extension TEXT NOT NULL, image BLOB NOT NULL)';
		db.run(query, (err) => {
			if (err) {
				console.error('Database Hook: Error creating table');
				throw err;
			}
		});
	}
	const resp = await resolve(event);
	return resp;
};
