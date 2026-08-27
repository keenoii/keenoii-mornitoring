const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = path.join(__dirname, '..', 'public', 'room', 'screenshot-tour.png');

try {
  console.log('Capturing Office Tour ...');
  // We can open and capture
  execSync(`"${chromePath}" --headless=new --disable-gpu --screenshot="${out}" --window-size=1920,1080 --virtual-time-budget=4000 "http://localhost:3000/office"`, { stdio: 'inherit' });
  console.log('Done!');
} catch (e) {
  console.error(e);
}
