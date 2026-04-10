const fs = require('fs');
const path = require('path');

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace hardcoded rounded corners
      content = content.replace(/rounded-lg/g, 'rounded-none');
      content = content.replace(/rounded-xl/g, 'rounded-none');
      content = content.replace(/rounded-md/g, 'rounded-none');
      content = content.replace(/rounded-2xl/g, 'rounded-none');
      content = content.replace(/rounded-3xl/g, 'rounded-none');
      content = content.replace(/rounded-sm/g, 'rounded-none');

      // Replace hardcoded original backgrounds and borders
      content = content.replace(/bg-\[#1a1a25\]/g, 'bg-[var(--hawk-card)]');
      content = content.replace(/border-\[#1a1a25\]/g, 'border-[var(--hawk-border)]');
      content = content.replace(/bg-\[#111118\]/g, 'bg-[var(--hawk-bg)]');
      content = content.replace(/border-\[#111118\]/g, 'border-[var(--hawk-border)]');

      // Specifically for AI Chat lines that might use it
      content = content.replace(/#1a1a25/g, 'var(--hawk-border)');
      content = content.replace(/#111118/g, 'var(--hawk-bg)');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

// Process components/results
processDirectory(path.join(__dirname, 'components/results'));
processDirectory(path.join(__dirname, 'app/analyze'));

console.log('Mass replacement complete!');
