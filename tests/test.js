import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DocxMarkdownConverter } from '../dist/converter/markdown.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🧪 Running mdtoword smoke test...');

  const markdown = `# Smoke Test\n\nThis is a basic conversion test.\n\n- item 1\n- item 2\n\n| A | B |\n|---|---|\n| 1 | 2 |`;

  const converter = new DocxMarkdownConverter({
    headerFooter: {
      footer: {
        showPageNumber: true,
        alignment: 'center'
      }
    }
  });

  const buffer = await converter.convert(markdown);

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Conversion did not return a non-empty Buffer');
  }

  const outputPath = path.join(__dirname, '../test-output-smoke.docx');
  fs.writeFileSync(outputPath, buffer);

  console.log(`✅ Smoke test passed: ${outputPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error('❌ Smoke test failed:', error);
  process.exit(1);
});
