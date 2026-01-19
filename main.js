import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { getDarkThemeBackground } from './scripts/get-theme-color.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;
let isCapturing = false;
let swipeBuffer = '';
let swipeTimeout = null;
let keyboardListener = null;
const SWIPE_TIMEOUT_MS = 500;

// Config file path for storing CSV directory preference
const getConfigPath = () => join(app.getPath('userData'), 'config.json');

// Get the CSV directory from config, or return default
function getCsvDirectory() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf8'));
      if (config.csvDirectory && existsSync(config.csvDirectory)) {
        return config.csvDirectory;
      }
    } catch (error) {
      console.warn('Error reading config:', error);
    }
  }
  // Default to userData directory
  return app.getPath('userData');
}

// Get config object
function getConfig() {
  const configPath = getConfigPath();
  if (existsSync(configPath)) {
    try {
      return JSON.parse(readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.warn('Error reading config:', error);
    }
  }
  return {};
}

// Save config object
function saveConfig(config) {
  const configPath = getConfigPath();
  const existingConfig = getConfig();
  const mergedConfig = { ...existingConfig, ...config };
  writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), 'utf8');
}

// Save the CSV directory to config
function saveCsvDirectory(directory) {
  saveConfig({ csvDirectory: directory });
}

// Get CSV column configuration (defaults to standard columns)
function getCsvColumns() {
  const config = getConfig();
  return (
    config.csvColumns || {
      accountNumber: 'account_number',
      amount: 'amount',
      activated: 'activated',
    }
  );
}

// Save CSV column configuration
function saveCsvColumns(columns) {
  saveConfig({ csvColumns: columns });
}

// Get the full CSV file path
function getCsvPath() {
  return join(getCsvDirectory(), 'giftcards.csv');
}

// Read existing CSV and return array of card data objects
function readCsvCards() {
  const csvPath = getCsvPath();
  const cards = [];

  if (!existsSync(csvPath)) {
    return cards;
  }

  try {
    const content = readFileSync(csvPath, 'utf8');
    const lines = content.trim().split('\n');

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',');
      if (parts.length >= 1 && parts[0]) {
        cards.push({
          accountNumber: parts[0].trim(),
          amount: parts[1]?.trim() || '0',
          activated: parts[2]?.trim() || 'Y',
        });
      }
    }
  } catch (error) {
    console.error('Error reading CSV file:', error);
    throw error;
  }

  return cards;
}

// Check if a card already exists in CSV
function isCardInCsv(accountNumber) {
  try {
    const cards = readCsvCards();
    return cards.some((card) => card.accountNumber === accountNumber);
  } catch (error) {
    // If we can't read the file, assume it doesn't exist (will be created)
    return false;
  }
}

// Write all unique cards to CSV in sorted order
function writeCsvSorted(cards) {
  const csvPath = getCsvPath();
  const columns = getCsvColumns();

  // Remove duplicates by account number (keep first occurrence)
  const uniqueCards = [];
  const seen = new Set();

  for (const card of cards) {
    if (!seen.has(card.accountNumber)) {
      seen.add(card.accountNumber);
      uniqueCards.push(card);
    }
  }

  // Sort by account number (ascending)
  uniqueCards.sort((a, b) => {
    // Compare as strings to handle numeric sorting correctly
    return a.accountNumber.localeCompare(b.accountNumber, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  // Write header using configured column names
  const header = `${columns.accountNumber},${columns.amount},${columns.activated}`;
  const lines = [header];

  // Write rows
  for (const card of uniqueCards) {
    lines.push(`${card.accountNumber},${card.amount},${card.activated}`);
  }

  try {
    writeFileSync(csvPath, lines.join('\n') + '\n', 'utf8');
    return { success: true, count: uniqueCards.length };
  } catch (error) {
    console.error('Error writing CSV file:', error);
    throw error;
  }
}

function createWindow() {
  // Get dark theme background color from design tokens
  const darkBackground = getDarkThemeBackground();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    backgroundColor: darkBackground, // Uses design token from Echo-UI
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Set up keyboard capture when window is ready
  if (mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      if (isCapturing && !keyboardListener) {
        setupKeyboardCapture();
      }
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-csv-path', () => {
  return getCsvPath();
});

ipcMain.handle('get-csv-directory', () => {
  return getCsvDirectory();
});

ipcMain.handle('select-csv-directory', async () => {
  if (!mainWindow) {
    return { success: false, error: 'Window not available' };
  }

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select CSV Save Directory',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const selectedDirectory = result.filePaths[0];
    saveCsvDirectory(selectedDirectory);

    return {
      success: true,
      directory: selectedDirectory,
      csvPath: join(selectedDirectory, 'giftcards.csv'),
    };
  } catch (error) {
    console.error('Error selecting directory:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-csv-file', async () => {
  const csvPath = getCsvPath();

  try {
    if (!existsSync(csvPath)) {
      return {
        success: false,
        error: 'CSV file does not exist yet. Swipe a card to create it.',
      };
    }

    // Open the file with the default application
    await shell.openPath(csvPath);

    return { success: true };
  } catch (error) {
    console.error('Error opening CSV file:', error);
    return {
      success: false,
      error: error.message || 'Failed to open CSV file',
    };
  }
});

ipcMain.handle('deduplicate-csv', async () => {
  const csvPath = getCsvPath();

  try {
    if (!existsSync(csvPath)) {
      return {
        success: false,
        error: 'CSV file does not exist yet. Swipe a card to create it.',
      };
    }

    // Read existing cards
    let cards = [];
    try {
      cards = readCsvCards();
    } catch (readError) {
      let errorMessage = 'Failed to read CSV file';

      if (readError.code === 'EACCES' || readError.code === 'EPERM') {
        errorMessage = 'Permission denied. Please check file permissions.';
      } else if (readError.message) {
        errorMessage = readError.message;
      }

      return {
        success: false,
        error: errorMessage,
        duplicatesRemoved: 0,
        totalCards: 0,
      };
    }

    const originalCount = cards.length;

    // Deduplicate and sort using existing helper
    const result = writeCsvSorted(cards);

    const duplicatesRemoved = originalCount - result.count;

    return {
      success: true,
      duplicatesRemoved,
      totalCards: result.count,
      originalCount,
    };
  } catch (error) {
    let errorMessage = 'Unknown error occurred';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorMessage = 'Permission denied. Please check file permissions.';
    } else if (error.code === 'ENOSPC') {
      errorMessage = 'Disk full. Please free up space.';
    } else if (error.code === 'ENOENT') {
      errorMessage = 'Directory not found. Please check CSV directory settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error deduplicating CSV file:', error);

    return {
      success: false,
      error: errorMessage,
      duplicatesRemoved: 0,
      totalCards: 0,
    };
  }
});

ipcMain.handle('write-csv-row', async (event, accountNumber) => {
  const csvPath = getCsvPath();

  try {
    // Validate account number
    if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.trim() === '') {
      return {
        success: false,
        error: 'Invalid account number',
        path: csvPath,
      };
    }

    const trimmedAccountNumber = accountNumber.trim();

    // Check if card already exists in CSV
    if (isCardInCsv(trimmedAccountNumber)) {
      return {
        success: false,
        duplicate: true,
        error: 'Card already exists in CSV',
        path: csvPath,
      };
    }

    // Read existing cards
    let cards = [];
    try {
      cards = readCsvCards();
    } catch (readError) {
      // If file doesn't exist or is empty, start fresh
      if (readError.code !== 'ENOENT') {
        // Re-throw if it's a different error (permissions, etc.)
        throw readError;
      }
    }

    // Add new card
    cards.push({
      accountNumber: trimmedAccountNumber,
      amount: '0',
      activated: 'Y',
    });

    // Write sorted and deduplicated CSV
    const result = writeCsvSorted(cards);

    return {
      success: true,
      path: csvPath,
      duplicate: false,
    };
  } catch (error) {
    // Handle different types of errors
    let errorMessage = 'Unknown error occurred';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorMessage = 'Permission denied. Please check file permissions.';
    } else if (error.code === 'ENOSPC') {
      errorMessage = 'Disk full. Please free up space.';
    } else if (error.code === 'ENOENT') {
      errorMessage = 'Directory not found. Please check CSV directory settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error writing CSV row:', error);

    return {
      success: false,
      error: errorMessage,
      path: csvPath,
      duplicate: false,
    };
  }
});

ipcMain.handle('start-capture', () => {
  isCapturing = true;

  // Ensure window is focused to receive keyboard input
  if (mainWindow) {
    mainWindow.focus();
    // Set up capture after a short delay to ensure focus is set
    setTimeout(() => {
      setupKeyboardCapture();
    }, 100);
  } else {
    setupKeyboardCapture();
  }

  return { success: true };
});

ipcMain.handle('stop-capture', () => {
  isCapturing = false;
  removeKeyboardCapture();
  if (swipeTimeout) {
    clearTimeout(swipeTimeout);
    swipeTimeout = null;
  }
  swipeBuffer = '';
  return { success: true };
});

// Get CSV column configuration
ipcMain.handle('get-csv-columns', () => {
  return {
    success: true,
    columns: getCsvColumns(),
  };
});

// Save CSV column configuration
ipcMain.handle('save-csv-columns', async (event, columns) => {
  try {
    // Validate columns object
    if (!columns || typeof columns !== 'object') {
      return {
        success: false,
        error: 'Invalid columns configuration',
      };
    }

    // Validate required fields
    const requiredFields = ['accountNumber', 'amount', 'activated'];
    for (const field of requiredFields) {
      if (!columns[field] || typeof columns[field] !== 'string' || columns[field].trim() === '') {
        return {
          success: false,
          error: `Column name for "${field}" is required and must be a non-empty string`,
        };
      }
    }

    // Save columns
    saveCsvColumns(columns);

    // Re-write CSV with new headers if file exists
    const csvPath = getCsvPath();
    if (existsSync(csvPath)) {
      const cards = readCsvCards();
      writeCsvSorted(cards);
    }

    return {
      success: true,
      columns: getCsvColumns(),
    };
  } catch (error) {
    console.error('Error saving CSV columns:', error);
    return {
      success: false,
      error: error.message || 'Failed to save column configuration',
    };
  }
});

function setupKeyboardCapture() {
  if (!mainWindow || keyboardListener) return;

  // Set up keyboard capture using before-input-event
  // This captures input even when the window has focus
  keyboardListener = (event, input) => {
    if (!isCapturing) return;

    // Prevent default to avoid typing in the window
    event.preventDefault();

    // Handle all characters including special ones
    let char = null;

    // Use input.char if available (more reliable for special chars)
    if (input.char && input.char.length === 1) {
      char = input.char;
    } else {
      // Fallback to key property with special character mapping
      if (input.key === '%' || (input.code === 'Digit5' && input.shift)) char = '%';
      else if (input.key === ';' || input.code === 'Semicolon') char = ';';
      else if (input.key === '=' || input.code === 'Equal') char = '=';
      else if (input.key === '?' || (input.code === 'Slash' && input.shift)) char = '?';
      else if (input.key === '^' || (input.code === 'Digit6' && input.shift)) char = '^';
      else if (input.key === 'Backspace') {
        // Handle backspace - might be part of swipe or user input
        if (swipeBuffer.length > 0) {
          swipeBuffer = swipeBuffer.slice(0, -1);
        }
        return;
      } else if (input.key && input.key.length === 1 && !input.ctrl && !input.meta && !input.alt) {
        // Regular printable character
        char = input.key;
      }
    }

    if (char) {
      // Reset timeout on new input
      if (swipeTimeout) {
        clearTimeout(swipeTimeout);
      }

      // Add character to buffer
      swipeBuffer += char;

      // Set timeout to process swipe when input stops
      swipeTimeout = setTimeout(() => {
        if (swipeBuffer.length > 0) {
          processSwipe(swipeBuffer);
          swipeBuffer = '';
        }
      }, SWIPE_TIMEOUT_MS);
    }
  };

  mainWindow.webContents.on('before-input-event', keyboardListener);
}

function removeKeyboardCapture() {
  if (mainWindow && keyboardListener) {
    mainWindow.webContents.removeListener('before-input-event', keyboardListener);
    keyboardListener = null;
  }
}

// Set up keyboard capture when window gains focus
app.on('browser-window-focus', (event, window) => {
  if (window === mainWindow && isCapturing && !keyboardListener) {
    setupKeyboardCapture();
  }
});

function processSwipe(data) {
  // Parse mag stripe data
  // Format: %B5022440200591308625^HEARTLAND GIFT^391200018130?;5022440200591308625=391200018130?

  const accountNumber = extractAccountNumber(data);

  if (!accountNumber) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠ Failed to extract account number from swipe data');
    }
    // Send error event to renderer
    if (mainWindow) {
      mainWindow.webContents.send('card-swipe-error', {
        error: 'Failed to extract account number from swipe data',
        data: data.substring(0, 50) + '...', // Truncate for logging
      });
    }
    return;
  }

  // Write to CSV using the same logic as IPC handler
  try {
    const csvPath = getCsvPath();

    // Validate account number
    const trimmedAccountNumber = accountNumber.trim();
    if (!trimmedAccountNumber) {
      throw new Error('Invalid account number');
    }

    // Check if card already exists in CSV
    if (isCardInCsv(trimmedAccountNumber)) {
      // Duplicate detected - notify renderer but don't write
      if (mainWindow) {
        mainWindow.webContents.send('card-swiped', {
          accountNumber: trimmedAccountNumber,
          duplicate: true,
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('⚠ Duplicate card detected:', trimmedAccountNumber);
      }
      return;
    }

    // Read existing cards
    let cards = [];
    try {
      cards = readCsvCards();
    } catch (readError) {
      // If file doesn't exist or is empty, start fresh
      if (readError.code !== 'ENOENT') {
        throw readError;
      }
    }

    // Add new card
    cards.push({
      accountNumber: trimmedAccountNumber,
      amount: '0',
      activated: 'Y',
    });

    // Write sorted and deduplicated CSV
    writeCsvSorted(cards);

    // Notify renderer of successful write
    if (mainWindow) {
      mainWindow.webContents.send('card-swiped', {
        accountNumber: trimmedAccountNumber,
        duplicate: false,
      });
    }

    // Log success (less verbose)
    if (process.env.NODE_ENV === 'development') {
      console.log('✓ Card swiped:', trimmedAccountNumber);
    }
  } catch (error) {
    // Handle errors gracefully
    let errorMessage = 'Unknown error occurred';

    if (error.code === 'EACCES' || error.code === 'EPERM') {
      errorMessage = 'Permission denied. Please check file permissions.';
    } else if (error.code === 'ENOSPC') {
      errorMessage = 'Disk full. Please free up space.';
    } else if (error.code === 'ENOENT') {
      errorMessage = 'Directory not found. Please check CSV directory settings.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error processing swipe:', error);

    // Send error event to renderer
    if (mainWindow) {
      mainWindow.webContents.send('card-swipe-error', {
        error: errorMessage,
        accountNumber: accountNumber,
      });
    }
  }
}

function extractAccountNumber(data) {
  // Try to extract from Track 1 format: %B5022440200591308625^...
  const track1Match = data.match(/%B(\d+)\^/);
  if (track1Match) {
    return track1Match[1];
  }

  // Try to extract from Track 2 format with equals: ;5022440200591308625=...
  const track2WithEqualsMatch = data.match(/;(\d+)=/);
  if (track2WithEqualsMatch) {
    return track2WithEqualsMatch[1];
  }

  // Try to extract from Track 2 format ending with ?: ;2130000000100080999?
  // This handles cards that only have Track 2 data ending with the end sentinel
  const track2WithQuestionMatch = data.match(/;(\d+)\?/);
  if (track2WithQuestionMatch) {
    return track2WithQuestionMatch[1];
  }

  // Fallback: try to find the account number that appears in both tracks
  // This is the number that appears before ^ in track 1 and before = in track 2
  const bothTracksMatch = data.match(/%B(\d+)\^.*?;\1=/);
  if (bothTracksMatch) {
    return bothTracksMatch[1];
  }

  return null;
}
