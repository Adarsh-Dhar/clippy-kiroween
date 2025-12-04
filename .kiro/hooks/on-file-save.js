const fs = require('fs');
const path = require('path');
const { generateFileSaveResponse } = require('./lib/geminiHookService');

console.log("💾 File Operation Detected.");

const fileName = process.argv[2];

async function handleFileSave() {
  let fileSize = 0;
  let displayName = 'unknown file';
  
  if (fileName && fs.existsSync(fileName)) {
    const stats = fs.statSync(fileName);
    fileSize = stats.size;
    displayName = path.basename(fileName);
  }
  
  const message = await generateFileSaveResponse(displayName, fileSize);
  console.log(`📎 Clippy says: "${message}"`);
}

handleFileSave().catch(err => {
  console.error("💥 Clippy malfunctioned:", err.message);
  console.log('📎 Clippy says: "I am watching you. Always."');
});