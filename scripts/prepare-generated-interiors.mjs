import sharp from 'sharp';
import fs from 'node:fs/promises';
const root = 'C:/Users/mmuba/.codex/generated_images/01a14fc4-eb74-7df0-a462-b160646eee70/';
const inputs = {
  'living-room-rug': 'exec-253ac0ed-2a9c-455f-942e-e54be4955d07.png',
  'bedroom-curtains': 'exec-5ba574cb-fc87-4abb-ba76-324b312eb305.png',
  'rental-entryway': 'exec-aa249753-cce5-4e38-9ba1-60ca7c8e40ae.png',
  bedroom: 'exec-2d79252f-4fcd-40c7-a989-b0ff57ad4529.png',
  'small-spaces': 'exec-3a4d2db8-f435-4f8f-b99a-e4275714af39.png',
  outdoor: 'exec-3e5a7cb7-cae6-4c0f-8dc4-1129ff2d3738.png',
  bathroom: 'exec-4cfd2e5d-8a6e-4872-a27f-ac1b1a52d9b2.png',
  kitchen: 'exec-765121f4-47c8-4741-9d9c-7ad9edddf034.png',
  'home-office': 'exec-b4a7644f-ab2d-46d9-b0c3-07b3497f4fd6.png',
  'kids-bedroom': 'exec-ef45457e-2c63-41ec-a129-926de7239d36.png',
  'christmas-table': 'exec-ff5922d2-9b70-4159-84c0-4cf99d45a433.png',
  autumn: 'exec-253ac0ed-2a9c-455f-942e-e54be4955d07.png',
  christmas: 'exec-ff5922d2-9b70-4159-84c0-4cf99d45a433.png',
  'diy-decor': 'exec-b4a7644f-ab2d-46d9-b0c3-07b3497f4fd6.png',
  halloween: 'exec-3e5a7cb7-cae6-4c0f-8dc4-1129ff2d3738.png',
};
await fs.mkdir('public/images/generated', { recursive: true });
for (const [name, input] of Object.entries(inputs)) {
  for (const width of [480, 960, 1536]) {
    await sharp(root + input).resize({ width }).webp({ quality: 84 }).toFile(`public/images/generated/${name}-${width}.webp`);
  }
}
