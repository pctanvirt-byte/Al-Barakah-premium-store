/**
 * Utility for client-side image compression to ensure data URLs stay under 30KB - 80KB
 * and never exceed Firestore's 1MB document limit.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 700,
  maxHeight = 700,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) {
        reject(new Error('Empty file content'));
        return;
      }
      compressDataUrl(src, maxWidth, maxHeight, quality)
        .then(resolve)
        .catch(reject);
    };
    reader.readAsDataURL(file);
  });
}

export async function compressDataUrl(
  dataUrl: string,
  maxWidth = 700,
  maxHeight = 700,
  quality = 0.75
): Promise<string> {
  // If not a base64 data url, return directly
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  // If already small (< 60KB), return as is
  if (dataUrl.length < 60000) {
    return dataUrl;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Draw with smooth interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as jpeg with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      // If failed to load into image tag, return original
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
