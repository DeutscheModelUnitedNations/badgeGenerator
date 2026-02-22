import { PDFDocument, rgb, PageSizes, PDFPage, PDFFont, degrees, PDFEmbeddedPage } from 'pdf-lib';
import type { ResolvedTableRow, ResolvedTableSchema } from './dataResolver';
import type { Brand, PlacardTemplateOptions } from './types';
import {
	type PageStyles,
	fetchUint8Array,
	fetchFinalImageData,
	drawImage,
	widthOfTextAtSize,
	drawText,
	loadCustomFonts
} from './pdfCommon';
import { resetGenerationProgress, setGenerationProgress } from '$lib/stores/progress.svelte';
import { addWarning, WarningType } from './stores/warnings.svelte';

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
	rowData!: ResolvedTableRow;
	brand!: Brand;
	rowNumber!: number;
	frontOverlayPage?: PDFEmbeddedPage;

	constructor(
		pdfDoc: PDFDocument,
		styles = defaultStyles,
		rowData: ResolvedTableRow,
		brand: Brand,
		rowNumber: number,
		frontOverlayPage?: PDFEmbeddedPage
	) {
		this.pdfDoc = pdfDoc;
		this.styles = styles;
		this.rowData = rowData;
		this.brand = brand;
		this.rowNumber = rowNumber;
		this.frontOverlayPage = frontOverlayPage;
	}

	protected async initialize(): Promise<void> {
		const fonts = await loadCustomFonts(this.pdfDoc);
		this.helvetica = fonts.regular;
		this.helveticaBold = fonts.bold;
		// Change to landscape by switching width and height
		this.page = this.pdfDoc.addPage([PageSizes.A4[1], PageSizes.A4[0]]);
	}

	async generateContent(): Promise<void> {
		const { width, height } = this.page.getSize();

		// If we have a front overlay, draw it aligned to the bottom of the page
		// Scale to fit width, align at y=0 so it grows upward
		if (this.frontOverlayPage) {
			const overlayDims = this.frontOverlayPage.scale(1);
			// Scale to fit the page width
			const scale = width / overlayDims.width;

			const scaledWidth = overlayDims.width * scale;
			const scaledHeight = overlayDims.height * scale;

			// Center horizontally, align to bottom (y=0)
			const x = (width - scaledWidth) / 2;
			const y = 0;

			this.page.drawPage(this.frontOverlayPage, {
				x,
				y,
				width: scaledWidth,
				height: scaledHeight
			});
		}

		// Media Consent Circles - only draw on bottom half if no front overlay
		const MEDIA_CONSENT_CIRCLE_RADIUS = 5;
		const MEDIA_CONSENT_MARGIN_TO_MIDDLE = 20;
		if (this.rowData.mediaConsentStatus !== 'ALLOWED_ALL') {
			// Bottom half circle - skip if front overlay
			if (!this.frontOverlayPage) {
				this.page.drawCircle({
					color:
						this.rowData.mediaConsentStatus === 'PARTIALLY_ALLOWED'
							? rgb(1, 0.647, 0)
							: rgb(0, 0.502, 1),
					size: MEDIA_CONSENT_CIRCLE_RADIUS * 2,
					x: width - this.styles.margin.right - MEDIA_CONSENT_CIRCLE_RADIUS,
					y: height / 2 - MEDIA_CONSENT_MARGIN_TO_MIDDLE - MEDIA_CONSENT_CIRCLE_RADIUS
				});
			}
			// Top half circle - always draw
			this.page.drawCircle({
				color:
					this.rowData.mediaConsentStatus === 'PARTIALLY_ALLOWED'
						? rgb(1, 0.647, 0)
						: rgb(0, 0.502, 1),
				size: MEDIA_CONSENT_CIRCLE_RADIUS * 2,
				x: this.styles.margin.left + MEDIA_CONSENT_CIRCLE_RADIUS,
				y: height / 2 + MEDIA_CONSENT_MARGIN_TO_MIDDLE + MEDIA_CONSENT_CIRCLE_RADIUS
			});
		}

		let brandLogo: string | undefined;

		switch (this.brand) {
			case 'MUN-SH':
				brandLogo = '/logo/watermark/mun-sh.png';
				break;
			case 'MUNBW':
				brandLogo = '/logo/watermark/munbw.png';
				break;
			case 'DMUN':
				brandLogo = '/logo/watermark/dmun.png';
				break;
		}

		const brandLogoImage = brandLogo ? (await fetchUint8Array(brandLogo)).img : undefined;

		const LOGO_DISTANCE_FROM_VERTICAL_MIDDLE = 160;
		const LOGO_DISTANCE_FROM_HORIZONTAL_MIDDLE = 250;
		const LOGO_IMG_WIDTH = 130;
		const LOGO_IMG_HEIGHT = 130;
		const LOGO_IMG_OPACITY = 0.1;

		try {
			if (!brandLogoImage) {
				throw new Error('Brand logo not found');
			}
			// Top half logos (always draw)
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

			// Bottom half logos - skip if front overlay
			if (!this.frontOverlayPage) {
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
			}
		} catch (error) {
			console.error('Error loading brand logo:', error);
		}

		const { img: flagImgData, type: flagImgType } = await fetchFinalImageData(this.rowData, [
			`${this.rowNumber}`,
			this.rowData.alternativeImage ? 'alternativeImage' : 'countryAlpha2Code'
		]);
		const MARGIN_FROM_MIDDLE = 20;
		const IMG_WIDTH = 200;
		const IMG_HEIGHT = 150;

		const imgPosCommon = {
			width: IMG_WIDTH,
			height: IMG_HEIGHT
		};

		const img1Pos = {
			x: width / 2 + IMG_WIDTH / 2,
			y: height / 2 + IMG_HEIGHT + MARGIN_FROM_MIDDLE,
			rotate: degrees(180),
			...imgPosCommon
		};
		const img2Pos = {
			x: width / 2 - IMG_WIDTH / 2,
			y: height / 2 - IMG_HEIGHT - MARGIN_FROM_MIDDLE,
			...imgPosCommon
		};

		try {
			if (!flagImgData || !flagImgType) {
				throw new Error('Flag not found');
			}
			// Top half flag (always draw)
			await drawImage(this, flagImgData, flagImgType, img1Pos);
			// Bottom half flag - skip if front overlay
			if (!this.frontOverlayPage) {
				await drawImage(this, flagImgData, flagImgType, img2Pos);
			}
		} catch (error) {
			console.warn('Error loading flag:', error);
			addWarning({
				type: WarningType.IMAGE,
				message: 'Flagge / Bild konnte nicht geladen werden. Ist das Bild verfügbar?',
				path: [
					`${this.rowNumber}`,
					this.rowData.alternativeImage ? 'alternativeImage' : 'countryAlpha2Code'
				]
			});
		}

		// Top half flag border (always draw)
		this.page.drawRectangle({
			...img1Pos,
			borderColor: rgb(0, 0, 0),
			borderWidth: 1
		});
		// Bottom half flag border - skip if front overlay
		if (!this.frontOverlayPage) {
			this.page.drawRectangle({
				...img2Pos,
				borderColor: rgb(0, 0, 0),
				borderWidth: 1
			});
		}

		const nameText = this.rowData.committee
			? `${this.rowData.name} (${this.rowData.committee})`
			: this.rowData.name;
		const NAME_DISTANCE_FROM_MIDDLE = 270;

		// Bottom half name - skip if front overlay
		if (!this.frontOverlayPage) {
			drawText(
				this,
				this.helvetica,
				nameText,
				{
					x:
						width / 2 -
						widthOfTextAtSize(this, this.helvetica, nameText, this.styles.fontSize.heading) / 2,
					y: height / 2 - NAME_DISTANCE_FROM_MIDDLE,
					size: this.styles.fontSize.heading
				},
				[`${this.rowNumber}`, 'name']
			);
		}
		// Top half name (always draw)
		drawText(
			this,
			this.helvetica,
			nameText,
			{
				x:
					width / 2 +
					widthOfTextAtSize(this, this.helvetica, nameText, this.styles.fontSize.heading) / 2,
				y: height / 2 + NAME_DISTANCE_FROM_MIDDLE,
				size: this.styles.fontSize.heading,
				rotate: degrees(180)
			},
			[`${this.rowNumber}`, 'name']
		);

		const TITLE_DISTANCE_FROM_MIDDLE = 225;
		// Bottom half country name - skip if front overlay
		if (!this.frontOverlayPage) {
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
					y: height / 2 - TITLE_DISTANCE_FROM_MIDDLE,
					size: this.styles.fontSize.title
				},
				[`${this.rowNumber}`, 'countryName']
			);
		}
		// Top half country name (always draw)
		drawText(
			this,
			this.helveticaBold,
			this.rowData.countryName,
			{
				x:
					width / 2 +
					widthOfTextAtSize(
						this,
						this.helveticaBold,
						this.rowData.countryName,
						this.styles.fontSize.title
					) /
						2,
				y: height / 2 + TITLE_DISTANCE_FROM_MIDDLE,
				size: this.styles.fontSize.title,
				rotate: degrees(180)
			},
			[`${this.rowNumber}`, 'countryName']
		);

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

export async function generatePlacardPDF(
	fileData: ResolvedTableSchema,
	brand: Brand,
	templateOptions?: PlacardTemplateOptions
): Promise<Uint8Array> {
	try {
		const pdfDoc = await PDFDocument.create();

		// Load and prepare template if provided
		let frontOverlayPage: PDFEmbeddedPage | undefined;
		let templateDoc: PDFDocument | undefined;

		if (templateOptions) {
			templateDoc = await PDFDocument.load(templateOptions.templateBytes);

			// Embed front overlay page if mode is 'front' or 'both'
			if (templateOptions.mode === 'front' || templateOptions.mode === 'both') {
				const [embeddedPage] = await pdfDoc.embedPdf(templateDoc, [0]);
				frontOverlayPage = embeddedPage;
			}
		}

		for (let i = 0; i < fileData.length; i++) {
			const row = fileData[i];
			const generator = new PDFPlacardGenerator(pdfDoc, defaultStyles, row, brand, i, frontOverlayPage);
			await generator.generate();

			// Insert back page after each placard if template mode is 'back' or 'both'
			if (templateDoc && (templateOptions?.mode === 'back' || templateOptions?.mode === 'both')) {
				const backPageIndex = templateOptions?.mode === 'back' ? 0 : 1;
				if (backPageIndex < templateDoc.getPageCount()) {
					const [copiedBackPage] = await pdfDoc.copyPages(templateDoc, [backPageIndex]);
					pdfDoc.addPage(copiedBackPage);
				}
			}

			setGenerationProgress(fileData.length, i + 1);
		}

		return pdfDoc.save();
	} catch (error) {
		console.error('Error generating placard PDF:', error);
		throw error;
	}
}
