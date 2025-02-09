import { google } from 'googleapis';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const sheets = google.sheets('v4');

const auth = new google.auth.GoogleAuth({
	apiKey: env.GOOGLE_API_KEY,
	scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
});

export const GET: RequestHandler = async ({ url }) => {
	try {
		const spreadsheetId = url.searchParams.get('id');
		if (!spreadsheetId) {
			return new Response("Missing 'id' query parameter", { status: 400 });
		}

		console.info('Fetching from google sheets:', spreadsheetId);
		console.info('API Key: ' + env.GOOGLE_API_KEY ? 'Set' : 'Missing');

		const response = await sheets.spreadsheets.values.get({
			auth,
			spreadsheetId,
			range: 'A:Z'
		});

		const rows = response.data.values;
		if (!rows) {
			return new Response('No data found', { status: 404 });
		}

		// transform into a table with headers and rows, and return as JSON
		const headers = rows[0] || [];
		const table = rows.map((row) => Object.fromEntries(row.map((value, i) => [headers[i], value])));

		return json(table, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error) {
		console.error('Error when fetching from google sheets: ' + error);
		return new Response((error as any).message, {
			status: 500,
			headers: {
				'Access-Control-Allow-Origin': '*'
			}
		});
	}
};
