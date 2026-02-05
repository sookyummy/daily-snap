import sharp from "sharp";
import { PHOTO_MAX_DIMENSION, THUMBNAIL_SIZE } from "@/lib/constants";

export async function processUploadedPhoto(buffer: Buffer): Promise<{
  original: Buffer;
  thumbnail: Buffer;
}> {
  const original = await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .resize(PHOTO_MAX_DIMENSION, PHOTO_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  const thumbnail = await sharp(buffer)
    .rotate()
    .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: "cover" })
    .jpeg({ quality: 75 })
    .toBuffer();

  return { original, thumbnail };
}
