import sharp from "sharp";
import { COLLAGE_SIZE } from "@/lib/constants";
import { getLayout } from "./layouts";

type CollageParams = {
  photos: { buffer: Buffer; nickname: string }[];
  keyword: string;
  emoji: string;
  date: string;
  groupName: string;
};

export async function generateCollage(params: CollageParams): Promise<Buffer> {
  const { photos, keyword, emoji, date, groupName } = params;
  const layout = getLayout(photos.length);
  const SIZE = COLLAGE_SIZE;

  // Create header SVG
  const headerSvg = Buffer.from(`
    <svg width="${SIZE}" height="${layout.headerHeight}">
      <rect width="100%" height="100%" fill="white"/>
      <text x="${SIZE / 2}" y="52" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="26" font-weight="bold"
            fill="#333">${date} · ${keyword} ${emoji}</text>
    </svg>
  `);

  // Create footer SVG
  const footerSvg = Buffer.from(`
    <svg width="${SIZE}" height="${layout.footerHeight}">
      <rect width="100%" height="100%" fill="white"/>
      <text x="${SIZE / 2}" y="35" text-anchor="middle"
            font-family="Arial, sans-serif" font-size="16" fill="#999">
        ${groupName} | Daily Snap
      </text>
    </svg>
  `);

  // Resize each photo to fit its cell
  const photoComposites = await Promise.all(
    photos.map(async (photo, i) => {
      if (i >= layout.cells.length) return null;
      const cell = layout.cells[i];
      const resized = await sharp(photo.buffer)
        .resize(cell.width, cell.height, { fit: "cover" })
        .jpeg({ quality: 90 })
        .toBuffer();
      return { input: resized, left: cell.x, top: cell.y };
    })
  );

  // Create nickname overlays
  const nicknameOverlays = photos
    .map((photo, i) => {
      if (i >= layout.cells.length) return null;
      const cell = layout.cells[i];
      // Escape special XML characters
      const safeName = photo.nickname
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      const svg = Buffer.from(`
        <svg width="${cell.width}" height="28">
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" rx="0"/>
          <text x="${cell.width / 2}" y="19" text-anchor="middle"
                font-family="Arial, sans-serif" font-size="13" fill="white">
            ${safeName}
          </text>
        </svg>
      `);
      return {
        input: svg,
        left: cell.x,
        top: cell.y + cell.height - 28,
      };
    })
    .filter(Boolean);

  // Compose final image
  const result = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([
      { input: headerSvg, top: 0, left: 0 },
      ...(photoComposites.filter(Boolean) as sharp.OverlayOptions[]),
      ...(nicknameOverlays as sharp.OverlayOptions[]),
      { input: footerSvg, top: SIZE - layout.footerHeight, left: 0 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
