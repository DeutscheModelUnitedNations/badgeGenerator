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
