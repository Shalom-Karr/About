'use strict';

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'img');
const OUT = path.join(SRC, 'opt');

// Dark-bg fill colour for alpha-flattening before JPEG encode
const BG = { r: 15, g: 23, b: 42 };

const SOURCES = [
  {
    file: 'ShalomProfessional.jpg',
    basename: 'avatar',
    widths: [80, 160],
    fallback: 'jpeg',
    fallbackOpts: { quality: 80, mozjpeg: true },
  },
  {
    file: 'jtech.png',
    basename: 'jtech',
    widths: [400, 800],
    fallback: 'jpeg',
    fallbackOpts: { quality: 82, mozjpeg: true },
  },
  {
    file: 'social-preview.png',
    basename: 'social-preview',
    widths: [1200],
    fallback: 'jpeg',
    fallbackOpts: { quality: 85, mozjpeg: true },
  },
];

async function processOne(src, basename, width, fallback, fallbackOpts) {
  const resized = sharp(src).resize(width, null, { withoutEnlargement: true });

  const avifPath  = path.join(OUT, `${basename}-${width}.avif`);
  const webpPath  = path.join(OUT, `${basename}-${width}.webp`);
  const fbExt     = fallback === 'jpeg' ? 'jpg' : fallback;
  const fbPath    = path.join(OUT, `${basename}-${width}.${fbExt}`);

  // AVIF
  await resized.clone().avif({ quality: 55, effort: 6 }).toFile(avifPath);

  // WebP
  await resized.clone().webp({ quality: 80 }).toFile(webpPath);

  // Fallback (flatten alpha for JPEG)
  let fbPipeline = resized.clone();
  if (fallback === 'jpeg') {
    fbPipeline = fbPipeline.flatten({ background: BG });
  }
  await fbPipeline[fallback](fallbackOpts).toFile(fbPath);

  return [avifPath, webpPath, fbPath];
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const rows = [];
  const sourceStats = [];

  for (const { file, basename, widths, fallback, fallbackOpts } of SOURCES) {
    const srcPath = path.join(SRC, file);
    const srcSize = fs.statSync(srcPath).size;
    let totalOptSize = 0;

    for (const width of widths) {
      const written = await processOne(srcPath, basename, width, fallback, fallbackOpts);
      for (const p of written) {
        const sz = fs.statSync(p).size;
        totalOptSize += sz;
        rows.push({ file: path.relative(ROOT, p).replace(/\\/g, '/'), size: sz });
      }
    }

    sourceStats.push({ source: file, srcSize, totalOptSize });
  }

  // Print table
  console.log('\nGenerated files:');
  console.log('─'.repeat(72));
  console.log(`${'File'.padEnd(52)} ${'Bytes'.padStart(9)}   ${'KB'.padStart(7)}`);
  console.log('─'.repeat(72));
  for (const r of rows) {
    console.log(`${r.file.padEnd(52)} ${String(r.size).padStart(9)}   ${(r.size / 1024).toFixed(1).padStart(7)}`);
  }
  console.log('─'.repeat(72));

  console.log('\nSource vs optimised:');
  console.log('─'.repeat(72));
  for (const s of sourceStats) {
    const saved = s.srcSize - s.totalOptSize;
    const pct   = ((saved / s.srcSize) * 100).toFixed(1);
    console.log(`${s.source.padEnd(30)} src=${(s.srcSize/1024).toFixed(1).padStart(7)} KB  opt=${(s.totalOptSize/1024).toFixed(1).padStart(8)} KB  saved=${pct}%`);
  }
  console.log('');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
