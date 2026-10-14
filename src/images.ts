import stockImages from './data/stock-images.json';

type StockAsset = { variants: Array<{ src: string; width: number; height: number }> };
const assets = stockImages as Record<string, StockAsset>;

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
