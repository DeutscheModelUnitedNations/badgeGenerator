import { rgb } from 'pdf-lib';

export interface PageStyles {
	margin: { left: number; right: number; top: number; bottom: number };
	colors: {
		gray: { r: number; g: number; b: number };
		black: { r: number; g: number; b: number };
		blue: { r: number; g: number; b: number };
	};
	fontSize: { title: number; heading: number; normal: number };
	lineHeight: { normal: number };
}

export function hexToRGBColor(hex: string) {
	const bigint = parseInt(hex.substring(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return rgb(r / 255, g / 255, b / 255);
}

export async function fetchUint8Array(url: string): Promise<Uint8Array> {
	const response = await fetch(url);
	const blob = await response.blob();
	const arrayBuffer = await blob.arrayBuffer();
	return new Uint8Array(arrayBuffer);
}

export async function fetchFinalImageData(rowData: {
	alternativeImage?: string;
	countryAlpha2Code?: string;
}): Promise<Uint8Array | undefined> {
	try {
		if (rowData.alternativeImage) {
			return await fetchUint8Array(`/uploads/${rowData.alternativeImage}`);
		} else {
			return await fetchUint8Array(`/flags/${rowData.countryAlpha2Code}.png`);
		}
	} catch (error) {
		console.error('Error loading flag:', error);
		return undefined;
	}
}
