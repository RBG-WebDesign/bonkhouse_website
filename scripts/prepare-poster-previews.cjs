const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

// Convert generated output to the requested delivery size without cropping.
async function main() {
  const source = process.argv[2];
  const destination = path.resolve('output/poster-previews');
  fs.mkdirSync(destination, { recursive: true });
  for (const name of fs.readdirSync(source).filter(name => name.endsWith('.png'))) {
    const input = path.join(source, name);
    const metadata = await sharp(input).metadata();
    if (metadata.width / metadata.height !== 2 / 3) {
      throw new Error(`${name} does not have a 2:3 aspect ratio`);
    }
    const output = path.join(destination, name);
    await sharp(input).resize(800, 1200).png().toFile(output);
    console.log(output);
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
