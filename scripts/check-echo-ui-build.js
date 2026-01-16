import { statSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const echoUIDir = join(__dirname, '../../Echo-UI');
const distIndex = join(echoUIDir, 'dist/index.js');
const distStyles = join(echoUIDir, 'dist/styles.css');

// Simple check: if dist files exist, assume up to date
// For more accuracy, you can check file timestamps
if (existsSync(distIndex) && existsSync(distStyles)) {
  console.log('Echo-UI is up to date');
  process.exit(0);
} else {
  console.log('Echo-UI needs rebuild');
  process.exit(1);
}
