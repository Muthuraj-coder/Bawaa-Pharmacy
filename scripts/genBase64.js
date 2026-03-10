const fs = require('fs');
const img = fs.readFileSync('assets/images/logo.png', 'base64');
fs.writeFileSync('src/constants/logoBase64.js', 'export const LOGO_BASE64 = `data:image/png;base64,' + img + '`;\n');
console.log('Done');
