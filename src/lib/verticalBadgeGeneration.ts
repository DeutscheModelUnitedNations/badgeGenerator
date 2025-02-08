import { PDFDocument, rgb, StandardFonts, PageSizes, PDFPage, PDFFont, degrees } from 'pdf-lib';
import type { BadgeDataRow, BadgeDataTable } from './tableSchema';
import type { Brand } from './brands';
import { type PageStyles, hexToRGBColor, fetchUint8Array, fetchFinalImageData } from './pdfCommon';

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
		title: 11,
		heading: 9,
		normal: 7
	},
	lineHeight: {
		normal: 1.2
	}
};

class PDFVerticalBadgeGenerator {
	pdfDoc: PDFDocument;
	page!: PDFPage;
	styles: PageStyles;
	helvetica!: PDFFont;
	helveticaBold!: PDFFont;
	rowData!: BadgeDataRow;
	brand!: Brand;

	constructor(pdfDoc: PDFDocument, styles = defaultStyles, rowData: BadgeDataRow, brand: Brand) {
		this.pdfDoc = pdfDoc;
		this.styles = styles;
		this.rowData = rowData;
		this.brand = brand;
	}

	protected async initialize(): Promise<void> {
		this.helvetica = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
		this.helveticaBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
		// Change to landscape by switching width and height
		this.page = this.pdfDoc.addPage([155.91, 241.0]);
	}

	async generateContent(): Promise<void> {
		const { width, height } = this.page.getSize();

		let brandLogo;
		let primaryColor;
		let conferenceName;

		switch (this.brand) {
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
		}

		let brandLogoImage: Uint8Array | undefined;
		try {
			brandLogoImage = await fetchUint8Array(brandLogo);
		} catch (error) {
			console.error('Error loading brand logo:', error);
		}

		let dmunLogoImage: Uint8Array | undefined;
		try {
			dmunLogoImage = await fetchUint8Array('/logo/color/dmun.png');
		} catch (error) {
			console.error('Error loading DMUN logo:', error);
		}

		const CENTERLINE = width / 2;

		const finalImageData = await fetchFinalImageData(this.rowData);

		const IMG_MARGIN_BOTTOM = 40;
		const IMG_MARGIN_SIDE = 30;
		const IMG_WIDTH = width - IMG_MARGIN_SIDE * 2;
		const IMG_HEIGHT = IMG_WIDTH * 0.75;

		const imgPos = {
			x: IMG_MARGIN_SIDE,
			y: IMG_MARGIN_BOTTOM,
			width: IMG_WIDTH,
			height: IMG_HEIGHT
		};

		try {
			if (!finalImageData) {
				throw new Error('Flag not found');
			}
			this.page.drawImage(await this.pdfDoc.embedPng(finalImageData), {
				...imgPos
			});
		} catch (error) {
			console.error('Error loading flag:', error);
		}

		this.page.drawRectangle({
			...imgPos,
			borderColor: rgb(0, 0, 0),
			borderWidth: 0.5
		});

		const LOGO_IMG_WIDTH = 60;
		const LOGO_IMG_HEIGHT = LOGO_IMG_WIDTH;
		const LOGO_MARGIN_TOP = 10;

		try {
			if (!brandLogoImage) {
				throw new Error('Brand logo not found');
			}
			this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
				x: CENTERLINE - LOGO_IMG_WIDTH / 2,
				y: height - LOGO_MARGIN_TOP - LOGO_IMG_HEIGHT,
				width: LOGO_IMG_WIDTH,
				height: LOGO_IMG_HEIGHT
			});
		} catch (error) {
			console.error('Error loading brand logo:', error);
		}

		const DMUN_LOGO_WIDTH = 50;
		const DMUN_LOGO_HEIGHT = DMUN_LOGO_WIDTH / 2.18;
		const DMUN_MARGIN_BOTTOM = 10;

		try {
			if (!dmunLogoImage) {
				throw new Error('DMUN logo not found');
			}
			this.page.drawImage(await this.pdfDoc.embedPng(dmunLogoImage), {
				x: CENTERLINE - DMUN_LOGO_WIDTH / 2,
				y: DMUN_MARGIN_BOTTOM,
				width: DMUN_LOGO_WIDTH,
				height: DMUN_LOGO_HEIGHT
			});
		} catch (error) {
			console.error('Error loading DMUN logo:', error);
		}

		const TITLE_MARGIN_TOP = 92;
		this.page.setFont(this.helveticaBold);
		this.page.drawText(this.rowData.countryName, {
			x:
				CENTERLINE -
				this.helveticaBold.widthOfTextAtSize(this.rowData.countryName, this.styles.fontSize.title) /
					2,
			y: height - TITLE_MARGIN_TOP,
			size: this.styles.fontSize.title
		});

		const NAME_MARGIN_TOP = 106;
		const nameText = this.rowData.committee
			? `${this.rowData.name} (${this.rowData.committee})`
			: this.rowData.name;
		this.page.setFont(this.helvetica);
		this.page.drawText(nameText, {
			x: CENTERLINE - this.helvetica.widthOfTextAtSize(nameText, this.styles.fontSize.heading) / 2,
			y: height - NAME_MARGIN_TOP,
			size: this.styles.fontSize.heading
		});

		const PRONOUNS_MARGIN_TOP = 116;
		if (this.rowData.pronouns) {
			this.page.drawText(this.rowData.pronouns, {
				x:
					width / 2 -
					this.helvetica.widthOfTextAtSize(this.rowData.pronouns, this.styles.fontSize.heading) / 2,
				y: height - PRONOUNS_MARGIN_TOP,
				size: this.styles.fontSize.heading
			});
		}
	}

	public async generate(): Promise<PDFPage> {
		await this.initialize();
		await this.generateContent();
		return this.page;
	}
}

export async function generateCompletePDF(
	fileData: BadgeDataTable,
	brand: Brand
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();

	// Create base pages
	const pageGenerators = fileData.map(
		(row) => new PDFVerticalBadgeGenerator(pdfDoc, defaultStyles, row, brand)
	);
	// Generate all pages
	for (const generator of pageGenerators) {
		await generator.generate();
	}

	return pdfDoc.save();
}
