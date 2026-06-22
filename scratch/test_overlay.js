const sharp = require("sharp");
const TextToSVG = require("text-to-svg");
const path = require("path");
const fs = require("fs");

async function run() {
  const fontFile = "ProtestRevolution-Regular.ttf";
  const fontPath = path.join(__dirname, "../src/trigger/story/fonts", fontFile);
  console.log("Loading font from:", fontPath);
  const textToSVG = TextToSVG.loadSync(fontPath);

  const thumbnailText = "CRITICAL FAILURE!";

  // Simple wrapping utility
  const wrapText = (txt, maxChars = 11) => {
    const words = txt.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const lines = wrapText(thumbnailText.toUpperCase(), 11);
  const fontSize = 140;
  const lineHeight = fontSize * 1.15;
  const strokeWidth = 16;
  
  let combinedPaths = '';
  const startX = 120;
  const startY = (1080 - (lines.length * lineHeight)) / 2 + 20;

  lines.forEach((line, index) => {
    const y = startY + index * lineHeight;
    const pathData = textToSVG.getD(line, {
      x: startX,
      y: y,
      fontSize: fontSize,
      anchor: 'left top'
    });
    
    // Background Stroke
    combinedPaths += `<path d="${pathData}" fill="none" stroke="black" stroke-width="${strokeWidth}" stroke-linejoin="round" stroke-linecap="round" />`;
    // Foreground Fill
    const fill = index === 0 ? '#FBBF24' : '#FFFFFF';
    combinedPaths += `<path d="${pathData}" fill="${fill}" />`;
  });

  const svgString = `<svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
    ${combinedPaths}
  </svg>`;

  console.log("Overlaying text on stoic.jpg");
  const inputImagePath = path.join(__dirname, "../stoic.jpg");
  const outputImagePath = path.join(__dirname, "test_output.png");

  const buffer = await sharp(inputImagePath)
    .resize(1920, 1080)
    .composite([{ input: Buffer.from(svgString) }])
    .toBuffer();

  fs.writeFileSync(outputImagePath, buffer);
  console.log("Successfully generated test output at:", outputImagePath);
}

run().catch(console.error);
