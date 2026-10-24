import sharp from 'sharp';
import fs from 'node:fs/promises';
const root = 'C:/Users/mmuba/.codex/generated_images/01a14fc4-eb74-7df0-a462-b160646eee70/';
const inputs = {
  'living-room-rug': 'exec-253ac0ed-2a9c-455f-942e-e54be4955d07.png',
  'bedroom-curtains': 'exec-5ba574cb-fc87-4abb-ba76-324b312eb305.png',
  'rental-entryway': 'exec-aa249753-cce5-4e38-9ba1-60ca7c8e40ae.png',
};
await fs.mkdir('public/images/generated', { recursive: true });
for (const [name, input] of Object.entries(inputs)) {
  for (const width of [480, 960, 1536]) {
    await sharp(root + input).resize({ width }).webp({ quality: 84 }).toFile(`public/images/generated/${name}-${width}.webp`);
  }
}
