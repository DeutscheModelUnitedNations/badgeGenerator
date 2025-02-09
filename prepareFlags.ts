import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import svg2img from 'svg2img';
import { readdirSync, writeFileSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const flagsDir = join(__dirname, 'node_modules', 'flag-icons', 'flags', '4x3');
const outputDir = join(__dirname, 'static', 'flags');

const svgFiles = readdirSync(flagsDir).filter((f) => f.endsWith('.svg'));

for (const file of svgFiles) {
	const svgContent = readFileSync(join(flagsDir, file), 'utf-8');
	const outputPath = join(outputDir, file.replace('.svg', '.png'));

	svg2img(svgContent, (error, buffer) => {
		writeFileSync(outputPath, buffer);
	});
	console.log(`Converted ${file} to ${outputPath}`);
}
