import { COLLAGE_SIZE } from "@/lib/constants";

export type CellPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollageLayout = {
  cells: CellPosition[];
  headerHeight: number;
  footerHeight: number;
};

const HEADER_H = 80;
const FOOTER_H = 60;
const GAP = 4;
const CONTENT_Y = HEADER_H;
const CONTENT_H = COLLAGE_SIZE - HEADER_H - FOOTER_H;

function makeGrid(
  rows: number,
  cols: number,
  totalCells: number
): CellPosition[] {
  const cells: CellPosition[] = [];
  const cellW = Math.floor((COLLAGE_SIZE - GAP * (cols - 1)) / cols);
  const cellH = Math.floor((CONTENT_H - GAP * (rows - 1)) / rows);
  let idx = 0;

  for (let r = 0; r < rows && idx < totalCells; r++) {
    // For uneven rows (like 3 in top, 4 in bottom), we need special handling
    const cellsInRow = r === 0 && totalCells % rows !== 0
      ? totalCells - (rows - 1) * cols
      : Math.min(cols, totalCells - idx);

    const rowCellW = Math.floor(
      (COLLAGE_SIZE - GAP * (cellsInRow - 1)) / cellsInRow
    );

    for (let c = 0; c < cellsInRow && idx < totalCells; c++) {
      cells.push({
        x: c * (rowCellW + GAP),
        y: CONTENT_Y + r * (cellH + GAP),
        width: rowCellW,
        height: cellH,
      });
      idx++;
    }
  }

  return cells;
}

export function getLayout(memberCount: number): CollageLayout {
  let cells: CellPosition[];

  switch (memberCount) {
    case 2:
      cells = makeGrid(1, 2, 2);
      break;
    case 3: {
      // 1 top + 2 bottom
      const topW = COLLAGE_SIZE;
      const topH = Math.floor(CONTENT_H / 2) - GAP;
      const botW = Math.floor((COLLAGE_SIZE - GAP) / 2);
      const botH = topH;
      const botY = CONTENT_Y + topH + GAP;
      cells = [
        { x: 0, y: CONTENT_Y, width: topW, height: topH },
        { x: 0, y: botY, width: botW, height: botH },
        { x: botW + GAP, y: botY, width: botW, height: botH },
      ];
      break;
    }
    case 4:
      cells = makeGrid(2, 2, 4);
      break;
    case 5: {
      // 2 top + 3 bottom
      const h = Math.floor(CONTENT_H / 2) - GAP;
      const topW = Math.floor((COLLAGE_SIZE - GAP) / 2);
      const botW = Math.floor((COLLAGE_SIZE - GAP * 2) / 3);
      const botY = CONTENT_Y + h + GAP;
      cells = [
        { x: 0, y: CONTENT_Y, width: topW, height: h },
        { x: topW + GAP, y: CONTENT_Y, width: topW, height: h },
        { x: 0, y: botY, width: botW, height: h },
        { x: botW + GAP, y: botY, width: botW, height: h },
        { x: (botW + GAP) * 2, y: botY, width: botW, height: h },
      ];
      break;
    }
    case 6:
      cells = makeGrid(2, 3, 6);
      break;
    case 7: {
      // 3 top + 4 bottom
      const h = Math.floor(CONTENT_H / 2) - GAP;
      const topW = Math.floor((COLLAGE_SIZE - GAP * 2) / 3);
      const botW = Math.floor((COLLAGE_SIZE - GAP * 3) / 4);
      const botY = CONTENT_Y + h + GAP;
      cells = [
        { x: 0, y: CONTENT_Y, width: topW, height: h },
        { x: topW + GAP, y: CONTENT_Y, width: topW, height: h },
        { x: (topW + GAP) * 2, y: CONTENT_Y, width: topW, height: h },
        { x: 0, y: botY, width: botW, height: h },
        { x: botW + GAP, y: botY, width: botW, height: h },
        { x: (botW + GAP) * 2, y: botY, width: botW, height: h },
        { x: (botW + GAP) * 3, y: botY, width: botW, height: h },
      ];
      break;
    }
    case 8:
      cells = makeGrid(2, 4, 8);
      break;
    default:
      cells = makeGrid(2, 2, Math.min(memberCount, 4));
  }

  return { cells, headerHeight: HEADER_H, footerHeight: FOOTER_H };
}
