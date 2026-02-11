export interface Image {
	title: string;
	extension: string;
	image: string;
	createdAt?: string;
	width?: number;
	height?: number;
	fileSize?: number;
}

export interface ImageListItem {
	title: string;
	extension: string;
	url: string;
	createdAt?: string;
	width?: number;
	height?: number;
	fileSize?: number;
}

export type Brand = 'MUN-SH' | 'MUNBW' | "DMUN" | "UN";

export type PDFType = 'PLACARD' | 'VERTICAL_BADGE' | 'HORIZONTAL_BADGE';

export interface ImageEditSettings {
	fitMode: 'cover' | 'contain';
	zoom: number;           // 0.5 to 2.0
	offsetX: number;        // -100 to 100 (percentage)
	offsetY: number;        // -100 to 100 (percentage)
	backgroundColor: string; // Hex color
}

export type PlacardTemplateMode = 'front' | 'back' | 'both';

export type CountryNameLanguage =
	| 'ara' | 'ces' | 'deu' | 'eng' | 'est' | 'fin' | 'fra'
	| 'hrv' | 'hun' | 'ita' | 'jpn' | 'kor' | 'nld'
	| 'per' | 'pol' | 'por' | 'rus' | 'slk' | 'spa'
	| 'srp' | 'swe' | 'tur' | 'urd' | 'zho';

export interface PlacardTemplateOptions {
	templateBytes: Uint8Array;
	mode: PlacardTemplateMode;
}
