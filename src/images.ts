import stockImages from './data/stock-images.json';

type StockAsset = {
  provider?: string;
  source_url?: string;
  stock?: boolean;
  variants: Array<{ src: string; width: number; height: number }>;
};
const assets = { ...stockImages } as Record<string, StockAsset>;
for (const name of ['living-room-rug', 'bedroom-curtains', 'rental-entryway']) {
  const key = `/images/generated/${name}-1536.webp`;
  assets[key] = { provider: 'AI-generated illustration', stock: false, variants: [480, 960, 1536].map(width => ({ src: `/images/generated/${name}-${width}.webp`, width, height: width * 2 / 3 })) };
}

export function imageAsset(src: string): StockAsset | undefined {
  return assets[src];
}

export function localImage(src: string): string {
  const asset = imageAsset(src);
  if (asset) return asset.variants.at(-1)!.src;
  if (src.startsWith('photo-') || /^https?:\/\//.test(src)) {
    throw new Error(`Image has not been self-hosted: ${src}. Run scripts/self-host-images.mjs.`);
  }
  return src;
}
