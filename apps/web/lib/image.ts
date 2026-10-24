const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * A URL for the image at roughly `width` pixels. Cloudinary images are resized and served in the
 * best format for the browser (f_auto, q_auto); local development images are returned unchanged.
 */
export function sizedImageUrl(url: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  return match ? `${match[1]}f_auto,q_auto,c_limit,w_${width}/${match[2]}` : url;
}

/** srcSet offering the image at several widths (only meaningful for Cloudinary images). */
export function imageSrcSet(url: string, widths: number[]): string | undefined {
  if (!CLOUDINARY_UPLOAD.test(url)) return undefined;
  return widths.map((width) => `${sizedImageUrl(url, width)} ${width}w`).join(', ');
}
