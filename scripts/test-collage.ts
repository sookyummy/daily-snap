import sharp from "sharp";
import { generateCollage } from "../src/lib/collage/generate";
import fs from "fs";
import path from "path";

const COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
];

const NAMES = [
  "Alice", "Bob", "Charlie", "Diana",
  "Edward", "Fiona", "George", "Hannah",
];

async function createColorPhoto(color: string, label: string): Promise<Buffer> {
  const svg = Buffer.from(`
    <svg width="400" height="400">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="200" y="200" text-anchor="middle" dominant-baseline="middle"
            font-family="Arial" font-size="40" fill="white" font-weight="bold">
        ${label}
      </text>
    </svg>
  `);
  return sharp(svg).jpeg({ quality: 90 }).toBuffer();
}

async function main() {
  const outDir = path.join(__dirname, "../collage-samples");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let count = 2; count <= 8; count++) {
    const photos = await Promise.all(
      Array.from({ length: count }, async (_, i) => ({
        buffer: await createColorPhoto(COLORS[i], NAMES[i]),
        nickname: NAMES[i],
      }))
    );

    const collage = await generateCollage({
      photos,
      keyword: "Coffee",
      emoji: "☕",
      date: "2026.02.05",
      groupName: "Best Friends",
    });

    const outPath = path.join(outDir, `collage-${count}members.jpg`);
    fs.writeFileSync(outPath, collage);
    console.log(`Generated: ${outPath}`);
  }
}

main().catch(console.error);
