const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const allowed = new Set([
  'return-of-the-sunday-afternoon.webp',
  'house-house.webp',
  'infested-creature-double-feature.webp',
  'retail-rampage-prom-dance-bloodbath.webp',
  'merry-axe-mas.jpg',
  'it-came-from-outer-space.jpg',
]);

async function main() {
  const [source, name] = process.argv.slice(2);
  if (!source || !allowed.has(name)) throw new Error('Provide a source image and one of the six event poster filenames.');
  const metadata = await sharp(source).metadata();
  if (metadata.width / metadata.height !== 2 / 3) throw new Error('Source must already be 2:3; refusing to crop.');
  const destination = path.resolve('public/posters', name);
  const backup = path.resolve('output/poster-previews/originals', name);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  if (!fs.existsSync(backup)) fs.copyFileSync(destination, backup, fs.constants.COPYFILE_EXCL);
  const image = sharp(source).resize(800, 1200);
  await (name.endsWith('.webp') ? image.webp({ quality: 94 }) : image.jpeg({ quality: 95, chromaSubsampling: '4:4:4' })).toFile(destination);
  const result = await sharp(destination).metadata();
  if (result.width !== 800 || result.height !== 1200) throw new Error('Unexpected output dimensions.');
  console.log(`${destination}: ${result.width} x ${result.height}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
