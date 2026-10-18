import mustardImg from '../assets/images/mustard_oil_5l_1792332417134.jpg';
import groundnutImg from '../assets/images/groundnut_oil_5l_1792332419392.jpg';
import attaImg from '../assets/images/sharbati_atta_10kg_1792332419142.jpg';
import basmatiImg from '../assets/images/basmati_rice_10kg_1792332418496.jpg';

const imageMap: Record<string, string> = {
  'mustard_oil_5l_1792332417134.jpg': mustardImg,
  'groundnut_oil_5l_1792332419392.jpg': groundnutImg,
  'sharbati_atta_10kg_1792332419142.jpg': attaImg,
  'basmati_rice_10kg_1792332418496.jpg': basmatiImg,
};

export const FALLBACK_PRODUCT_IMAGE = mustardImg;

/**
 * Resolves a product image URL safely across development, Vite production bundles, and Vercel CDN.
 */
export function getProductImageUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return FALLBACK_PRODUCT_IMAGE;
  }

  const cleanUrl = rawUrl.trim();

  // If already a full external URL or data URI, return as is
  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('data:') ||
    cleanUrl.startsWith('blob:')
  ) {
    return cleanUrl;
  }

  // Check if it matches any bundled asset by filename
  for (const [filename, bundledUrl] of Object.entries(imageMap)) {
    if (cleanUrl.includes(filename)) {
      return bundledUrl;
    }
  }

  return cleanUrl;
}
