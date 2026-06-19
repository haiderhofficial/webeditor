// Run with Node.js: node generate-icons.js
// Requires the 'canvas' package: npm install canvas
// OR just use any 16x16, 48x48, 128x128 PNG images and place them in /icons

const { createCanvas } = require("canvas");
const fs = require("fs");

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const s = size;

  // Background circle
  ctx.fillStyle = "#1e1e2e";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2);
  ctx.fill();

  // Letter "T"
  ctx.fillStyle = "#cba6f7";
  ctx.font = `bold ${Math.round(s * 0.55)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("T", s / 2, s / 2 + s * 0.04);

  return canvas.toBuffer("image/png");
}

[16, 48, 128].forEach((size) => {
  fs.writeFileSync(`icons/icon${size}.png`, makeIcon(size));
  console.log(`icons/icon${size}.png created`);
});
