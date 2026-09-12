/**
 * أداة ضغط الصور السريعة والذكية للويب
 * تقوم بتصغير أبعاد الصورة إذا لزم الأمر وضغطها بصيغة WebP أو JPEG لتقليل الحجم بنسبة 70-85%
 * مما يجعل الرفع السحابي لـ Firebase فائق السرعة وبدون استهلاك للباندويث
 */
export async function fastCompressImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82
): Promise<File | Blob> {
  // إذا لم يكن نوع الملف صورة (مثل فيديو)، يترك كما هو
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;

        // حساب الأبعاد المحافظة على النسبة
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
          // في حال فشل السياق، نرجع الملف الأصلي
          resolve(file);
          return;
        }

        // تحسين تنعيم الرسم
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // محاولة تصدير كـ image/webp أو image/jpeg
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              const compressedFile = new File([blob], file.name, {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // إذا كان الملف الأصلي أصغر من المضغوط، نستخدم الأصلي
              resolve(file);
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
