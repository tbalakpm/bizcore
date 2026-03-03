const fs = require('fs');
const path = require('path');

const indexPath = path.resolve(__dirname, '../dist/bizcore-app/browser/index.html');

if (!fs.existsSync(indexPath)) {
  process.exit(0);
}

const source = fs.readFileSync(indexPath, 'utf8');
const sanitized = source.replace(/ media="print" onload="this\.media='all'"/g, '');

if (sanitized !== source) {
  fs.writeFileSync(indexPath, sanitized, 'utf8');
}
