const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputPath = path.resolve(__dirname, '../public/room/screenshot.png');
const url = 'http://localhost:3000/office';

// Use virtual-time-budget to allow Next.js client-side fetch to load data
const cmd = `"${chromePath}" --headless=new --disable-gpu --screenshot="${outputPath}" --window-size=1920,1080 --virtual-time-budget=5000 "${url}"`;
console.log('Running:', cmd);

try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully captured screenshot with data to:', outputPath);
} catch (err) {
  console.error('Error capturing screenshot:', err);
}
