import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocxMarkdownConverter } from '../dist/converter/markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const markdown = [
    '# Mermaid Test',
    '',
    '```mermaid',
    'flowchart TD',
    '  A[Start] --> B{Check}',
    '  B -->|Yes| C[Done]',
    '  B -->|No| D[Retry]',
    '```',
    ''
  ].join('\n');

  const converter = new DocxMarkdownConverter();
  const buffer = await converter.convert(markdown);

  if (!Buffer.isBuffer(buffer) || buffer.length < 1000) {
    throw new Error('Unexpected DOCX output for mermaid test');
  }

  const outputPath = path.join(__dirname, '../test-output-mermaid.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Mermaid DOCX generated: ${outputPath}`);
}

main().catch((error) => {
  console.error('❌ Mermaid test failed:', error);
  process.exit(1);
});
