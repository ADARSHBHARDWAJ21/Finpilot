import sharp from "sharp";

export async function preprocessImage(buffer) {
  return sharp(buffer).grayscale().normalize().sharpen().toBuffer();
}
