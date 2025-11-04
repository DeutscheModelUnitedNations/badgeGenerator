import { rgb } from 'pdf-lib';
import type { Brand, PDFType } from './types';
import type { TableSchema } from './tableSchema';
import { generatePlacardPDF } from './placardGeneration';
import { generateVerticalBadgePDF } from './verticalBadgeGeneration';
import { generateHorizontalBadgePDF } from './horizontalBadgeGeneration';
import { resetGenerationProgress } from './stores/progress.svelte';
import { addWarning, resetWarnings, WarningType } from './stores/warnings.svelte';
import replaceSpecialChars from 'replace-special-characters';

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

export async function fetchUint8Array(url: string): Promise<{ img: Uint8Array; type: string }> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
	const blob = await response.blob();
	const arrayBuffer = await blob.arrayBuffer();
	return { img: new Uint8Array(arrayBuffer), type: blob.type };
}

export async function fetchFinalImageData(
	rowData: {
		alternativeImage?: string;
		countryAlpha2Code?: string;
	},
	path: string[]
): Promise<{ img: Uint8Array | undefined; type: string | undefined }> {
	try {
		if (rowData.alternativeImage) {
			if (rowData.alternativeImage.startsWith('dmun')) {
				return await fetchUint8Array(`/logo/color/dmun.png`);
			}
			return await fetchUint8Array(`/api/img/${encodeURIComponent(rowData.alternativeImage)}`);
		} else {
			return await fetchUint8Array(`/flags/${rowData.countryAlpha2Code?.toLowerCase()}.png`);
		}
	} catch (error: any) {
		console.error(error);
		return { img: undefined, type: undefined };
	}
}

export async function drawImage(this_: any, img: Uint8Array, type: string, options: {}) {
	if (type === 'image/jpeg' || type === 'image/jpg')
		return this_.page.drawImage(await this_.pdfDoc.embedJpg(img), options);
	else if (type === 'image/png')
		return this_.page.drawImage(await this_.pdfDoc.embedPng(img), options);
}

export function drawText(this_: any, font: any, text: string, options: any, path: string[]) {
	this_.page.setFont(font);
	const { width: pageWidth } = this_.page.getSize();
	const textWidth = widthOfTextAtSize(this_, font, text, options.size);
	if (pageWidth - 10 < textWidth) {
		addWarning({
			type: WarningType.SUPERSET,
			message: 'Text überschreitet eventuell die Seitenränder.',
			details: text,
			path
		});
	}
	try {
		this_.page.drawText(text, options);
	} catch (error: any) {
		console.log(error);
		addWarning({
			type: WarningType.TEXT,
			message: 'Text enthält unzulässige Zeichen und wurde bereinigt.',
			details: error?.message,
			path
		});
		const sanitizedText = replaceSpecialChars(text);
		this_.page.drawText(sanitizedText, options);
	}
}

export function widthOfTextAtSize(this_: any, font: any, text: string, size: number) {
	try {
		return font.widthOfTextAtSize(text, size);
	} catch (error: any) {
		console.log(error.message);
		const sanitizedText = replaceSpecialChars(text);
		return font.widthOfTextAtSize(sanitizedText, size);
	}
}

export function getBrandInfo(brand: Brand) {
	// For color badges
	let brandLogo: string;
	let primaryColor: string;
	let conferenceName: string;
	switch (brand) {
		case 'MUN-SH':
			brandLogo = '/logo/color/mun-sh.png';
			primaryColor = '#0089E3';
			conferenceName = `Schleswig-Holstein ${new Date().getFullYear()}`;
			break;
		case 'MUNBW':
			brandLogo = '/logo/color/munbw.png';
			primaryColor = '#0C4695';
			conferenceName = `Baden-Württemberg ${new Date().getFullYear()}`;
			break;
		case "DMUN":
			brandLogo = '/logo/color/dmun-brand-logo.png';
			primaryColor = '#3d7dd2';
			conferenceName = ``;
			break;
		case 'UN':
			brandLogo = '/logo/color/un-logo.png';
			primaryColor = '#5b92e5';
			conferenceName = ``;
			break;
		default:
			brandLogo = '';
			primaryColor = '#000000';
			conferenceName = '';
	}
	return { brandLogo, primaryColor, conferenceName };
}

export async function generatePDF(fileData: TableSchema, brand: Brand, type: PDFType) {
	resetGenerationProgress(fileData.length);
	resetWarnings();

	switch (type) {
		case 'PLACARD':
			return await generatePlacardPDF(fileData, brand);
		case 'VERTICAL_BADGE':
			return await generateVerticalBadgePDF(fileData, brand);
		case 'HORIZONTAL_BADGE':
			return await generateHorizontalBadgePDF(fileData, brand);
		default:
			throw new Error('PDF type not supported');
	}
}
