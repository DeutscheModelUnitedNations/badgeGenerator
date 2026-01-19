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
const createTableQuery =
	'CREATE TABLE IF NOT EXISTS image (title TEXT NOT NULL PRIMARY KEY, extension TEXT NOT NULL, image TEXT NOT NULL, createdAt TEXT, width INTEGER, height INTEGER, fileSize INTEGER)';
await new Promise<void>((resolve) => {
	db.run(createTableQuery, (err) => {
		if (err) {
			console.error('Database Hook: Error creating table', err);
			throw err;
		}
		resolve();
	});
});

// Migration: Add new columns if they don't exist (for existing databases)
const migrationColumns = [
	{ name: 'createdAt', type: 'TEXT' },
	{ name: 'width', type: 'INTEGER' },
	{ name: 'height', type: 'INTEGER' },
	{ name: 'fileSize', type: 'INTEGER' }
];

for (const col of migrationColumns) {
	await new Promise<void>((resolve) => {
		db.run(`ALTER TABLE image ADD COLUMN ${col.name} ${col.type}`, (err) => {
			// Ignore "duplicate column" errors - column already exists
			if (err && !err.message.includes('duplicate column')) {
				console.error(`Database Hook: Error adding column ${col.name}`, err);
			}
			resolve();
		});
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.locals.db) {
		event.locals.db = db;
	}
	const resp = await resolve(event);
	return resp;
};
