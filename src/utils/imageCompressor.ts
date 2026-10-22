/**
 * High-performance client-side image compression and resizing utility.
 * Drastically reduces payload size before saving avatars/photos to the database,
 * preventing megabyte-sized base64 strings from consuming Supabase egress.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 200,
  maxHeight = 200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Draw with high smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with chosen quality
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(src);
        }
      };

      img.onerror = () => {
        // If image loading fails, resolve original safely
        resolve(src);
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      // Already a data URL or external URL
      if (fileOrDataUrl.startsWith('data:image')) {
        processImage(fileOrDataUrl);
      } else {
        // Normal URL, no compression needed
        resolve(fileOrDataUrl);
      }
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          processImage(reader.result);
        } else {
          reject(new Error('Failed to read file buffer'));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve('');
    }
  });
}
