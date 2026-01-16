import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Extracts the dark theme background color from Echo-UI CSS
 * This ensures the Electron window uses the same design token
 */
export function getDarkThemeBackground() {
  try {
    // Path to Echo-UI dark theme colors
    const colorsPath = join(__dirname, '../../Echo-UI/src/styles/colors-dark.css');
    const cssContent = readFileSync(colorsPath, 'utf8');
    
    // Extract --gray-1 value from dark theme (used as base background)
    // Pattern: --gray-1: #111111; (handles various whitespace)
    const gray1Match = cssContent.match(/--gray-1\s*:\s*(#[0-9a-fA-F]{6})\s*;/);
    if (gray1Match) {
      return gray1Match[1];
    }
    
    // Fallback: try to find it in semantic aliases
    const semanticPath = join(__dirname, '../../Echo-UI/src/styles/semantic-aliases.css');
    const semanticContent = readFileSync(semanticPath, 'utf8');
    
    // Look for dark theme background-base fallback
    // Pattern: --background-base: var(--background-1, var(--neutral-1, var(--gray-1, #111111)));
    const backgroundMatch = semanticContent.match(/\[data-theme="dark"\]\s*\{[^}]*--background-base:[^}]*var\(--gray-1,\s*(#[0-9a-fA-F]{6})\)/s);
    if (backgroundMatch) {
      return backgroundMatch[1];
    }
    
    // Final fallback
    console.warn('Could not extract dark theme background from CSS, using fallback');
    return '#111111';
  } catch (error) {
    console.warn('Error reading theme CSS files:', error.message);
    return '#111111';
  }
}
