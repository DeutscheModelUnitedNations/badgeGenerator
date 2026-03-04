import { PDFDocument, rgb, type PDFPage } from 'pdf-lib';
import type { ResolvedTableRow, ResolvedTableSchema } from './dataResolver';
import { fetchFinalImageData } from './pdfCommon';
import { setGenerationProgress } from './stores/progress.svelte';
import { addWarning, WarningType } from './stores/warnings.svelte';

class PDFFlagGenerator {
	pdfDoc: PDFDocument;
	page!: PDFPage;
	rowData: ResolvedTableRow;
	rowNumber: number;
	showTrimBorder: boolean;

	constructor(
		pdfDoc: PDFDocument,
		rowData: ResolvedTableRow,
		rowNumber: number,
		showTrimBorder: boolean = false
	) {
		this.pdfDoc = pdfDoc;
		this.rowData = rowData;
		this.rowNumber = rowNumber;
		this.showTrimBorder = showTrimBorder;
	}

	protected async initialize(): Promise<void> {
		// Landscape 4:3 aspect ratio to match flag-icons library (1000x750)
		this.page = this.pdfDoc.addPage([155.91 * (4 / 3), 155.91]);
	}

	async generateContent(): Promise<void> {
		const { width, height } = this.page.getSize();

		const { img: flagImgData, type: flagImgType } = await fetchFinalImageData(this.rowData, [
			`${this.rowNumber}`,
			this.rowData.alternativeImage ? 'alternativeImage' : 'countryAlpha2Code'
		]);

		try {
			if (!flagImgData || !flagImgType) {
				throw new Error('Flag not found');
			}

			let embeddedImage;
			if (flagImgType === 'image/jpeg' || flagImgType === 'image/jpg') {
				embeddedImage = await this.pdfDoc.embedJpg(flagImgData);
			} else {
				embeddedImage = await this.pdfDoc.embedPng(flagImgData);
			}

			// Fill the entire page edge-to-edge
			this.page.drawImage(embeddedImage, {
				x: 0,
				y: 0,
				width: width,
				height: height
			});
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

export async function generateFlagPDF(
	fileData: ResolvedTableSchema,
	showTrimBorder: boolean = false
): Promise<Uint8Array> {
	const pdfDoc = await PDFDocument.create();

	const pageGenerators = fileData.map(
		(row, i) => new PDFFlagGenerator(pdfDoc, row, i, showTrimBorder)
	);

	for (let i = 0; i < pageGenerators.length; i++) {
		await pageGenerators[i].generate();
		setGenerationProgress(fileData.length, i + 1);
	}

	return pdfDoc.save();
}
