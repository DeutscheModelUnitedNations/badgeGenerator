import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import svgToImg from 'svg-to-img';
import { readdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const flagsDir = join(__dirname, 'node_modules', 'flag-icons', 'flags', '4x3');
const outputDir = join(__dirname, 'static', 'flags');

console.log(flagsDir, outputDir);

const svgFiles = readdirSync(flagsDir).filter((f) => f.endsWith('.svg'));

console.log(svgFiles);

for (const file of svgFiles) {
	console.log(file);
	const svgContent = readFileSync(join(flagsDir, file), 'utf-8');
	const pngBuffer = await svgToImg.from(svgContent).toPng({ width: 900 });
	const outputPath = join(outputDir, file.replace('.svg', '.png'));
	writeFileSync(outputPath, pngBuffer);
}
