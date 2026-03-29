/**
 * AirHunt App Icon Generator
 *
 * Generates a 1024x1024 PNG app icon from SVG.
 *
 * Requirements:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icon.js
 *
 * If sharp is not available, you can convert the SVG manually:
 *   - Open assets/icon.svg in a browser
 *   - Screenshot at 1024x1024
 *   - Or use an online SVG-to-PNG converter
 */

const path = require("path");
const fs = require("fs");

const SVG_PATH = path.join(__dirname, "..", "assets", "icon.svg");
const ICON_PATH = path.join(__dirname, "..", "assets", "icon.png");
const ADAPTIVE_ICON_PATH = path.join(__dirname, "..", "assets", "adaptive-icon.png");

async function generateIcon() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("sharp is not installed. Install it with: npm install sharp");
    console.log("Alternatively, convert assets/icon.svg to PNG manually.");
    console.log("The SVG is at:", SVG_PATH);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(SVG_PATH);

  const pngBuffer = await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toBuffer();

  fs.writeFileSync(ICON_PATH, pngBuffer);
  console.log("Written:", ICON_PATH);

  fs.writeFileSync(ADAPTIVE_ICON_PATH, pngBuffer);
  console.log("Written:", ADAPTIVE_ICON_PATH);

  console.log("App icons generated successfully.");
}

generateIcon().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
