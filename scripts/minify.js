/**
 * SafeGuard SMS — Standalone Zero-Dependency Asset Minifier
 * Fast, reliable, 100% offline (no npx or network downloads required).
 *
 * Usage: node scripts/minify.js
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('=== SafeGuard SMS Asset Minification (Zero-Dependency) ===');

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove comments
    .replace(/\s+/g, ' ')             // collapse spaces
    .replace(/\s*([\{\};:,>~+])\s*/g, '$1') // remove space around delimiters
    .replace(/;}/g, '}')              // remove last semicolon in rule
    .trim();
}

function minifyJs(code) {
  // Tokenize while protecting string literals and regex literals
  let out = '';
  let i = 0;
  const len = code.length;

  while (i < len) {
    const ch = code[i];
    const next = code[i + 1];

    // Single-line comment
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < len && code[i] !== '\n' && code[i] !== '\r') i++;
      continue;
    }

    // Multi-line comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < len && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // String literals ('', "", ``)
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      out += quote;
      i++;
      while (i < len) {
        const c = code[i];
        out += c;
        if (c === '\\') {
          i++;
          if (i < len) out += code[i];
        } else if (c === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Whitespace collapse
    if (/\s/.test(ch)) {
      if (out.length > 0 && !/[\s;{}(),:!=+\-*/&|<>]/.test(out[out.length - 1])) {
        out += ' ';
      }
      i++;
      while (i < len && /\s/.test(code[i])) i++;
      continue;
    }

    out += ch;
    i++;
  }

  // Clean redundant spaces around operators
  return out
    .replace(/ ([\{\};(),:!=+\-*/&|<>]) /g, '$1')
    .replace(/ ([;{},()])/g, '$1')
    .replace(/([;{},()]) /g, '$1')
    .trim();
}

const cssTasks = [
  { src: 'assets/css/style.css', dest: 'assets/css/style.min.css' },
  { src: 'assets/css/blog.css', dest: 'assets/css/blog.min.css' },
  { src: 'assets/css/sms-chatbot.css', dest: 'assets/css/sms-chatbot.min.css' }
];

const jsTasks = [
  { src: 'assets/js/main.js', dest: 'assets/js/main.min.js' },
  { src: 'assets/js/sms-contact-sheet.js', dest: 'assets/js/sms-contact-sheet.min.js' },
  { src: 'assets/js/sms-chatbot.js', dest: 'assets/js/sms-chatbot.min.js' }
];

console.log('\n[1/2] Minifying CSS files...');
for (const task of cssTasks) {
  const srcPath = path.join(rootDir, task.src);
  const destPath = path.join(rootDir, task.dest);
  if (!fs.existsSync(srcPath)) continue;
  const raw = fs.readFileSync(srcPath, 'utf8');
  const minified = minifyCss(raw);
  fs.writeFileSync(destPath, minified, 'utf8');
  const srcSize = (raw.length / 1024).toFixed(1);
  const destSize = (minified.length / 1024).toFixed(1);
  const savings = (((raw.length - minified.length) / raw.length) * 100).toFixed(0);
  console.log(`  ✓ ${task.src} (${srcSize} KB -> ${destSize} KB, -${savings}%)`);
}

console.log('\n[2/2] Minifying JavaScript files...');
for (const task of jsTasks) {
  const srcPath = path.join(rootDir, task.src);
  const destPath = path.join(rootDir, task.dest);
  if (!fs.existsSync(srcPath)) continue;
  const raw = fs.readFileSync(srcPath, 'utf8');
  const minified = minifyJs(raw);
  fs.writeFileSync(destPath, minified, 'utf8');
  const srcSize = (raw.length / 1024).toFixed(1);
  const destSize = (minified.length / 1024).toFixed(1);
  const savings = (((raw.length - minified.length) / raw.length) * 100).toFixed(0);
  console.log(`  ✓ ${task.src} (${srcSize} KB -> ${destSize} KB, -${savings}%)`);
}

console.log('\nMinification complete! All assets successfully generated.');
