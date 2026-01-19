import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from 'pdf-lib';
import type { TableRow, TableSchema } from './tableSchema';
import type { Brand } from './types';
import {
	type PageStyles,
	fetchUint8Array,
	fetchFinalImageData,
	drawImage,
	getBrandInfo,
	drawText,
	widthOfTextAtSize
} from './pdfCommon';
import { setGenerationProgress } from './stores/progress.svelte';
import { addWarning, WarningType } from './stores/warnings.svelte';
import * as bwipjs from '@bwip-js/browser';

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
		blue: { r: 0.478, g: 1, b: 0 } // RGB value for a bright blue color (approximating the PDF)
	},
	fontSize: {
		title: 16,
		heading: 11,
		normal: 7
	},
	lineHeight: {
		normal: 1.2
	}
};

class PDFHorizontalBadgeGenerator {
	pdfDoc: PDFDocument;
	page!: PDFPage;
	styles: PageStyles;
	helvetica!: PDFFont;
	helveticaBold!: PDFFont;
	rowData!: TableRow;
	brand!: Brand;
	rowNumber!: number;
	showTrimBorder: boolean;

	constructor(
		pdfDoc: PDFDocument,
		styles = defaultStyles,
		rowData: TableRow,
		brand: Brand,
		rowNumber: number,
		showTrimBorder: boolean = false
	) {
		this.pdfDoc = pdfDoc;
		this.styles = styles;
		this.rowData = rowData;
		this.brand = brand;
		this.rowNumber = rowNumber;
		this.showTrimBorder = showTrimBorder;
	}

	protected async initialize(): Promise<void> {
		this.helvetica = await this.pdfDoc.embedFont(StandardFonts.Helvetica);
		this.helveticaBold = await this.pdfDoc.embedFont(StandardFonts.HelveticaBold);
		// Change to landscape by switching width and height
		this.page = this.pdfDoc.addPage([241.0, 155.91]);
	}

	async generateContent(): Promise<void> {
		const { width, height } = this.page.getSize();

		// Media Consent Circles
		const MEDIA_CONSENT_CIRCLE_RADIUS = 3;
		const MEDIA_CONSENT_MARGIN_BORDER = 10;
		if (this.rowData.mediaConsentStatus !== 'ALLOWED_ALL') {
			this.page.drawCircle({
				color:
					this.rowData.mediaConsentStatus === 'PARTIALLY_ALLOWED'
						? rgb(1, 0.647, 0)
						: rgb(0, 0.502, 1),
				size: MEDIA_CONSENT_CIRCLE_RADIUS * 2,
				x: width - MEDIA_CONSENT_MARGIN_BORDER - MEDIA_CONSENT_CIRCLE_RADIUS,
				y: height - MEDIA_CONSENT_MARGIN_BORDER - MEDIA_CONSENT_CIRCLE_RADIUS
			});
		}

		// Replace duplicated code with a helper function
		const { brandLogo, conferenceName } = getBrandInfo(this.brand);

		const { img: brandLogoImage } = await fetchUint8Array(brandLogo);

		const { img: flagImg, type: flagType } = await fetchFinalImageData(this.rowData, [
			`${this.rowNumber}`,
			this.rowData.alternativeImage ? 'alternativeImage' : 'countryAlpha2Code'
		]);

		const IMG_MARGIN_BOTTOM = 16;
		const IMG_MARGIN_LEFT = 20;
		const IMG_WIDTH = 100;
		const IMG_HEIGHT = 75;

		const imgPos = {
			x: IMG_MARGIN_LEFT,
			y: IMG_MARGIN_BOTTOM,
			width: IMG_WIDTH,
			height: IMG_HEIGHT
		};

		try {
			if (!flagImg || !flagType) {
				throw new Error('Flag not found');
			}
			await drawImage(this, flagImg, flagType, imgPos);
		} catch (error) {
			console.error('Error loading flag:', error);
			addWarning({
				type: WarningType.IMAGE,
				message: 'Flagge / Bild konnte nicht geladen werden.',
				path: [
					`${this.rowNumber}`,
					this.rowData.alternativeImage ? 'alternativeImage' : 'countryAlpha2Code'
				]
			});
		}

		this.page.drawRectangle({
			...imgPos,
			borderColor: rgb(0, 0, 0),
			borderWidth: 0.5
		});

		const LOGO_SCALE = 0.8;
		const MIDDLE_OF_EMPTY_SPACE =
			IMG_MARGIN_LEFT + IMG_WIDTH + (width - IMG_MARGIN_LEFT - IMG_WIDTH) / 2;
		const LOGO_IMG_WIDTH = IMG_HEIGHT * LOGO_SCALE;
		const LOGO_IMG_HEIGHT = IMG_HEIGHT * LOGO_SCALE;
		const LOGO_OFFSET_Y = 8;

		try {
			if (!brandLogoImage) {
				throw new Error('Logo not found');
			}
			this.page.drawImage(await this.pdfDoc.embedPng(brandLogoImage), {
				x: MIDDLE_OF_EMPTY_SPACE - LOGO_IMG_WIDTH / 2,
				y: IMG_MARGIN_BOTTOM + (IMG_HEIGHT - LOGO_IMG_HEIGHT) / 2 + LOGO_OFFSET_Y,
				width: LOGO_IMG_WIDTH,
				height: LOGO_IMG_HEIGHT
			});
		} catch (error) {
			console.error('Error loading logo:', error);
		}

		// Generate barcode if id is provided (under the flag)
		if (this.rowData.id) {
			try {
				const barcodeCanvas = document.createElement('canvas');
				bwipjs.toCanvas(barcodeCanvas, {
					bcid: 'code128',
					text: this.rowData.id,
					scale: 3,
					height: 6,
					includetext: false
				});
				const barcodeImg = barcodeCanvas.toDataURL('image/png');
				const barcodeData = barcodeImg.split(',')[1];
				const barcodeUint8 = Uint8Array.from(atob(barcodeData), (c) => c.charCodeAt(0));
				const pngImage = await this.pdfDoc.embedPng(barcodeUint8);

				const BARCODE_WIDTH = IMG_WIDTH; // Same width as flag
				const BARCODE_HEIGHT = 10;
				const BARCODE_GAP = 2;
				this.page.drawImage(pngImage, {
					x: IMG_MARGIN_LEFT,
					y: IMG_MARGIN_BOTTOM - BARCODE_GAP - BARCODE_HEIGHT,
					width: BARCODE_WIDTH,
					height: BARCODE_HEIGHT
				});
			} catch (error) {
				console.error('Error generating barcode:', error);
			}
		}

		this.page.setFont(this.helvetica);
		this.page.drawText('Model United Nations', {
			x:
				MIDDLE_OF_EMPTY_SPACE -
				this.helvetica.widthOfTextAtSize('Model United Nations', this.styles.fontSize.normal) / 2,
			y: IMG_MARGIN_BOTTOM + 7,
			size: this.styles.fontSize.normal
		});
		this.page.drawText(conferenceName, {
			x:
				MIDDLE_OF_EMPTY_SPACE -
				this.helvetica.widthOfTextAtSize(conferenceName, this.styles.fontSize.normal) / 2,
			y: IMG_MARGIN_BOTTOM,
			size: this.styles.fontSize.normal
		});

		const TITLE_MARGIN_TOP = 25;
		drawText(
			this,
			this.helveticaBold,
			this.rowData.countryName,
			{
				x:
					width / 2 -
					widthOfTextAtSize(
						this,
						this.helveticaBold,
						this.rowData.countryName,
						this.styles.fontSize.title
					) /
						2,
				y: height - TITLE_MARGIN_TOP,
				size: this.styles.fontSize.title
			},
			[`${this.rowNumber}`, 'countryName']
		);

		const NAME_MARGIN_TOP = 40;
		const nameText = this.rowData.committee
			? `${this.rowData.name} (${this.rowData.committee})`
			: this.rowData.name;

		drawText(
			this,
			this.helvetica,
			nameText,
			{
				x:
					width / 2 -
					widthOfTextAtSize(this, this.helvetica, nameText, this.styles.fontSize.heading) / 2,
				y: height - NAME_MARGIN_TOP,
				size: this.styles.fontSize.heading
			},
			[`${this.rowNumber}`, 'name']
		);

		const PRONOUNS_MARGIN_TOP = 52;
		if (this.rowData.pronouns) {
			this.page.drawText(this.rowData.pronouns, {
				x:
					width / 2 -
					this.helvetica.widthOfTextAtSize(this.rowData.pronouns, this.styles.fontSize.heading) / 2,
				y: height - PRONOUNS_MARGIN_TOP,
				size: this.styles.fontSize.heading
			});
		}

		// Draw gray trim border at the edge if enabled
		if (this.showTrimBorder) {
			this.page.drawRectangle({
				x: 0,
				y: 0,
				width: width,
				height: height,
				borderColor: rgb(0.6, 0.6, 0.6),
				borderWidth: 0.25
			});
		}
	}

	public async generate(): Promise<PDFPage> {
		await this.initialize();
		await this.generateContent();
		return this.page;
	}
}

export async function generateHorizontalBadgePDF(
	fileData: TableSchema,
	brand: Brand,
	showTrimBorder: boolean = false
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();

	// Create base pages
	const pageGenerators = fileData.map(
		(row, i) => new PDFHorizontalBadgeGenerator(pdfDoc, defaultStyles, row, brand, i, showTrimBorder)
	);
	// Generate all pages
	for (let i = 0; i < pageGenerators.length; i++) {
		await pageGenerators[i].generate();
		setGenerationProgress(fileData.length, i + 1);
	}

	return pdfDoc.save();
}
