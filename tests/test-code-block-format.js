import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocxMarkdownConverter } from '../dist/converter/markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const markdown = [
    '# Code Block Format Test',
    '',
    '```javascript',
    'function hello() {',
    '  console.log("hello");',
    '  return 42;',
    '}',
    '```',
    ''
  ].join('\n');

  const converter = new DocxMarkdownConverter();
  const buffer = await converter.convert(markdown);

  if (!Buffer.isBuffer(buffer) || buffer.length < 1000) {
    throw new Error('Unexpected DOCX output for code block test');
  }

  const outputPath = path.join(__dirname, '../test-output-code-block.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Code block DOCX generated: ${outputPath}`);
}

main().catch((error) => {
  console.error('❌ Code block test failed:', error);
  process.exit(1);
});
