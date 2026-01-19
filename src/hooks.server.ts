import type { Handle } from '@sveltejs/kit';
import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';

// Ensure data directory exists
const dataDir = process.env.DATA_DIR || './data';
try {
	mkdirSync(dataDir, { recursive: true });
} catch {
	// Directory already exists
}

const dbPath = `${dataDir}/db.sqlite`;
console.info(`Database Hook: Using database at ${dbPath}`);

const db = await new Promise<sqlite3.Database>((resolve) => {
	function onResolve(err: Error | null) {
		if (err) {
			console.error('Database Hook: Error creating database', err);
			throw err;
		}
		resolve(internaldb);
	}
	const internaldb = new sqlite3.Database(dbPath, onResolve);
});

console.info('Database Hook: Creating tables');
const createImageTableQuery =
	'CREATE TABLE IF NOT EXISTS image (title TEXT NOT NULL PRIMARY KEY, extension TEXT NOT NULL, image TEXT NOT NULL, createdAt TEXT, width INTEGER, height INTEGER, fileSize INTEGER)';
await new Promise<void>((resolve) => {
	db.run(createImageTableQuery, (err) => {
		if (err) {
			console.error('Database Hook: Error creating image table', err);
			throw err;
		}
		resolve();
	});
});

// Create sessions table for token-based URL parameters
const createSessionsTableQuery = `
	CREATE TABLE IF NOT EXISTS sessions (
		token TEXT NOT NULL PRIMARY KEY,
		data TEXT NOT NULL,
		createdAt INTEGER NOT NULL,
		expiresAt INTEGER NOT NULL
	)
`;
await new Promise<void>((resolve) => {
	db.run(createSessionsTableQuery, (err) => {
		if (err) {
			console.error('Database Hook: Error creating sessions table', err);
			throw err;
		}
		resolve();
	});
});

// Cleanup expired sessions on startup
const cleanupSessionsQuery = 'DELETE FROM sessions WHERE expiresAt < ?';
await new Promise<void>((resolve) => {
	db.run(cleanupSessionsQuery, [Date.now()], (err) => {
		if (err) {
			console.error('Database Hook: Error cleaning up expired sessions', err);
		}
		resolve();
	});
});

// Migration: Add new columns if they don't exist (for existing databases)
const migrationColumns = [
	{ name: 'createdAt', type: 'TEXT' },
	{ name: 'width', type: 'INTEGER' },
	{ name: 'height', type: 'INTEGER' },
	{ name: 'fileSize', type: 'INTEGER' },
	{ name: 'originalImage', type: 'TEXT' }
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
