import { PDFDocument, rgb, StandardFonts, PageSizes, PDFPage, PDFFont, degrees } from 'pdf-lib';
import type { PlacardDataRow, PlacardDataTable } from './tableSchema';
import type { Brand } from './brands';

interface PageStyles {
	margin: {
		left: number;
		right: number;
		top: number;
		bottom: number;
	};
	colors: {
		gray: { r: number; g: number; b: number };
		black: { r: number; g: number; b: number };
		blue: { r: number; g: number; b: number }; // Added blue color
	};
	fontSize: {
		title: number;
		heading: number;
		normal: number;
	};
	lineHeight: {
		normal: number;
	};
}

const defaultStyles: PageStyles = {
	margin: {
		left: 40,
		right: 40,
		top: 40,
		bottom: 40
	},
	colors: {
		gray: { r: 0.5, g: 0.5, b: 0.5 },
		black: { r: 0, g: 0, b: 0 },
		blue: { r: 0, g: 0.478, b: 1 } // RGB value for a bright blue color (approximating the PDF)
	},
	fontSize: {
		title: 36,
		heading: 24,
		normal: 11
	},
	lineHeight: {
		normal: 1.2
	}
};

class PDFPlacardGenerator {
	pdfDoc: PDFDocument;
	page!: PDFPage;
	styles: PageStyles;
	helvetica!: PDFFont;
	helveticaBold!: PDFFont;
	rowData!: PlacardDataRow;
	brand!: Brand;

	constructor(pdfDoc: PDFDocument, styles = defaultStyles, rowData: PlacardDataRow, brand: Brand) {
		this.pdfDoc = pdfDoc;
		this.styles = styles;
		this.rowData = rowData;
		this.brand = brand;
	}

	protected async initialize(): Promise<void> {
		this.helvetica = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
		this.helveticaBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
		// Change to landscape by switching width and height
		this.page = this.pdfDoc.addPage([PageSizes.A4[1], PageSizes.A4[0]]);
	}

	async generateContent(): Promise<void> {
		const { width, height } = this.page.getSize();

		let brandLogo;

		switch (this.brand) {
			case 'MUN-SH':
				brandLogo = '/logo/mun-sh.png';
				break;
			case 'MUNBW':
				brandLogo = '/logo/munbw.png';
				break;
		}

		const brandLogoImage = await fetch(brandLogo).then(async (response) => {
			const blob = await response.blob();
			const arrayBuffer = await blob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			return uint8Array;
		});

		const LOGO_DISTANCE_FROM_VERTICAL_MIDDLE = 160;
		const LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE = 250;
		const LOGO_IMG_WIDTH = 130;
		const LOGO_IMG_HEIGHT = 130;
		const LOGO_IMG_OPACITY = 0.1;

		this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
			x: width / 2 - LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE + LOGO_IMG_WIDTH / 2,
			y: height / 2 + LOGO_DISTANCE_FROM_VERTICAL_MIDDLE,
			width: LOGO_IMG_WIDTH,
			height: LOGO_IMG_HEIGHT,
			rotate: degrees(180),
			opacity: LOGO_IMG_OPACITY
		});

		this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
			x: width / 2 + LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE + LOGO_IMG_WIDTH / 2,
			y: height / 2 + LOGO_DISTANCE_FROM_VERTICAL_MIDDLE,
			width: LOGO_IMG_WIDTH,
			height: LOGO_IMG_HEIGHT,
			rotate: degrees(180),
			opacity: LOGO_IMG_OPACITY
		});

		this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
			x: width / 2 - LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE - LOGO_IMG_WIDTH / 2,
			y: height / 2 - LOGO_DISTANCE_FROM_VERTICAL_MIDDLE,
			width: LOGO_IMG_WIDTH,
			height: LOGO_IMG_HEIGHT,
			opacity: LOGO_IMG_OPACITY
		});

		this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
			x: width / 2 + LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE - LOGO_IMG_WIDTH / 2,
			y: height / 2 - LOGO_DISTANCE_FROM_VERTICAL_MIDDLE,
			width: LOGO_IMG_WIDTH,
			height: LOGO_IMG_HEIGHT,
			opacity: LOGO_IMG_OPACITY
		});

		try {
			let finalImageData: Uint8Array | undefined;
			if (this.rowData.alternativeImage) {
				finalImageData = await fetch(this.rowData.alternativeImage).then(async (response) => {
					const blob = await response.blob();
					const arrayBuffer = await blob.arrayBuffer();
					const uint8Array = new Uint8Array(arrayBuffer);
					return uint8Array;
				});
			} else {
				// Fetch flag SVG from our API endpoint
				const countryCode = this.rowData.countryAlpha2Code;
				const response = await fetch(`/api/flags/${countryCode}`);

				if (!response.ok) throw new Error('Flag not found');

				const flagImg = await response.blob();

				// convert the blob to a 8intUintArray
				const arrayBuffer = await flagImg.arrayBuffer();
				finalImageData = new Uint8Array(arrayBuffer);
			}

			if (!finalImageData) {
				throw new Error('Flag not found');
			}

			const MARGIN_FROM_MIDDLE = 20;
			const IMG_WIDTH = 200;
			const IMG_HEIGHT = 150;

			const img1Pos = {
				x: width / 2 + IMG_WIDTH / 2,
				y: height / 2 + IMG_HEIGHT + MARGIN_FROM_MIDDLE,
				width: IMG_WIDTH,
				height: IMG_HEIGHT,
				rotate: degrees(180)
			};

			this.page.drawImage(await this.pdfDoc.embedPng(finalImageData), {
				...img1Pos
			});
			this.page.drawRectangle({
				...img1Pos,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1
			});

			const img2Pos = {
				x: width / 2 - IMG_WIDTH / 2,
				y: height / 2 - IMG_HEIGHT - MARGIN_FROM_MIDDLE,
				width: IMG_WIDTH,
				height: IMG_HEIGHT
			};

			this.page.drawImage(await this.pdfDoc.embedPng(finalImageData), img2Pos);
			this.page.drawRectangle({
				...img2Pos,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1
			});
		} catch (error) {
			console.error('Error loading flag:', error);
		}

		const nameText = this.rowData.committee
			? `${this.rowData.name} (${this.rowData.committee})`
			: this.rowData.name;
		const NAME_DISTANCE_FROM_MIDDLE = 270;
		this.page.setFont(this.helvetica);
		this.page.drawText(nameText, {
			x: width / 2 - this.helvetica.widthOfTextAtSize(nameText, this.styles.fontSize.heading) / 2,
			y: height / 2 - NAME_DISTANCE_FROM_MIDDLE,
			size: this.styles.fontSize.heading
		});
		this.page.drawText(nameText, {
			x: width / 2 + this.helvetica.widthOfTextAtSize(nameText, this.styles.fontSize.heading) / 2,
			y: height / 2 + NAME_DISTANCE_FROM_MIDDLE,
			size: this.styles.fontSize.heading,
			rotate: degrees(180)
		});

		const TITLE_DISTANCE_FROM_MIDDLE = 225;
		this.page.setFont(this.helveticaBold);
		this.page.drawText(this.rowData.countryName, {
			x:
				width / 2 -
				this.helveticaBold.widthOfTextAtSize(this.rowData.countryName, this.styles.fontSize.title) /
					2,
			y: height / 2 - TITLE_DISTANCE_FROM_MIDDLE,
			size: this.styles.fontSize.title
		});
		this.page.drawText(this.rowData.countryName, {
			x:
				width / 2 +
				this.helveticaBold.widthOfTextAtSize(this.rowData.countryName, this.styles.fontSize.title) /
					2,
			y: height / 2 + TITLE_DISTANCE_FROM_MIDDLE,
			size: this.styles.fontSize.title,
			rotate: degrees(180)
		});

		this.page.drawLine({
			start: { x: 0, y: height / 2 },
			end: { x: width, y: height / 2 },
			thickness: 1,
			color: rgb(0.95, 0.95, 0.95)
		});
	}

	public async generate(): Promise<PDFPage> {
		await this.initialize();
		await this.generateContent();
		return this.page;
	}
}

export async function generateCompletePDF(
	fileData: PlacardDataTable,
	brand: Brand
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();

	// Create base pages
	const pageGenerators = fileData.map(
		(row) => new PDFPlacardGenerator(pdfDoc, defaultStyles, row, brand)
	);
	// Generate all pages
	for (const generator of pageGenerators) {
		await generator.generate();
	}

	return pdfDoc.save();
}

export async function generatePlacard(fileData: PlacardDataTable, brand: Brand): Promise<void> {
	try {
		const pdfBytes = await generateCompletePDF(fileData, brand);

		const blob = new Blob([pdfBytes], { type: 'application/pdf' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'mun-sh-registration.pdf';
		link.click();
		URL.revokeObjectURL(url);
	} catch (error) {
		console.error('Error generating registration form:', error);
		throw error;
	}
}
