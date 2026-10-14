/** Slice a tall screenshot into reviewable segments. */
import sharp from 'sharp';
import { basename, join } from 'node:path';
const [, , file, outDir, sliceArg] = process.argv;
const slice = Number(sliceArg ?? 1300);
const img = sharp(file);
const { width, height } = await img.metadata();
const name = basename(file, '.png');
for (let y = 0, n = 1; y < height; y += slice, n++) {
  const h = Math.min(slice, height - y);
  await sharp(file).extract({ left: 0, top: y, width, height: h })
    .png().toFile(join(outDir, `${name}-${n}.png`));
  console.log(`${name}-${n}.png  y=${y} h=${h}`);
}
