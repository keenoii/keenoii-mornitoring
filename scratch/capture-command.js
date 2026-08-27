const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = path.join(__dirname, '..', 'public', 'room', 'screenshot-command-view.png');

try {
  // Use node script to evaluate clicking Command View
  console.log('Capturing Command View in /office ...');
  // We can open the page and capture
  execSync(`"${chromePath}" --headless=new --disable-gpu --screenshot="${out}" --window-size=1920,1080 --virtual-time-budget=5000 "http://localhost:3000/office?mode=command"`, { stdio: 'inherit' });
  console.log('Done!');
} catch (e) {
  console.error(e);
}
