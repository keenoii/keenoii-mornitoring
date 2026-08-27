const { execSync } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out1 = path.join(__dirname, '..', 'public', 'room', 'screenshot-main.png');
const out2 = path.join(__dirname, '..', 'public', 'room', 'screenshot-office.png');

try {
  console.log('Capturing http://localhost:3000 ...');
  execSync(`"${chromePath}" --headless=new --disable-gpu --screenshot="${out1}" --window-size=1920,1080 --virtual-time-budget=5000 "http://localhost:3000"`, { stdio: 'inherit' });
  
  console.log('Capturing http://localhost:3000/office ...');
  execSync(`"${chromePath}" --headless=new --disable-gpu --screenshot="${out2}" --window-size=1920,1080 --virtual-time-budget=5000 "http://localhost:3000/office"`, { stdio: 'inherit' });
  
  console.log('Done!');
} catch (e) {
  console.error(e);
}
