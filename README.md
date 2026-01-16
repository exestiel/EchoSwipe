# EchoSwipe

A Windows desktop application that continuously reads gift card data from a magnetic stripe reader and automatically saves it to a CSV file with automatic deduplication and sorting.

## Features

- Continuous card swiping with magnetic stripe reader
- Automatic CSV export with account numbers
- **Automatic deduplication** - No duplicate cards in the output file
- **Sorted output** - Cards are automatically sorted by account number
- **Custom CSV directory** - Choose where to save your CSV files
- **Real-time statistics** - Track total swipes, unique cards, duplicates, and success rate
- **Audio feedback** - Audio cues for successful swipes, errors, and warnings
- **Error handling** - Graceful error handling with user-friendly notifications
- **Dark mode** - Beautiful dark theme using Echo-UI design tokens
- Real-time UI showing swipe status and recent cards
- Built with Electron, React, and Echo-UI

## Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Windows OS
- Magnetic stripe reader (HID keyboard emulation)

## Installation

```powershell
# Install dependencies
pnpm install
```

## Development

Start the development server:

```powershell
pnpm dev
```

This will:

- Start Vite dev server on <http://localhost:5173>
- Launch Electron app
- Enable hot reload

## Building

Build the application for production:

```powershell
pnpm build
```

This creates a portable executable in the `public` folder.

### Build Options

- `pnpm build` - Builds a portable executable (default)
- `pnpm build:exe` - Builds a portable executable
- `pnpm build:installer` - Builds an NSIS installer
- `pnpm build:fast` - Fast build (unpacked directory, minimal compression)
- `pnpm build:pack` - Build unpacked directory only

## Usage

1. Launch the application
2. (Optional) Click "Change Directory" to select where CSV files should be saved
3. Click "Start Capture" to begin listening for card swipes
4. Swipe gift cards through the magnetic stripe reader
5. Cards are automatically saved to `giftcards.csv` in your selected directory (or default app data directory)
6. View recent swiped cards, statistics, and duplicates in the UI
7. Use "Deduplicate" button to clean up existing CSV files
8. Use "Open File" to open the CSV file in your default application

### CSV Format

The CSV file contains:

- `account_number` - The extracted account number from the card
- `amount` - Always set to `0`
- `activated` - Always set to `Y`

**Important:** The CSV file is automatically:

- **Deduplicated** - No duplicate account numbers
- **Sorted** - Cards are sorted by account number (ascending)

Example:

```csv
account_number,amount,activated
5022440200591308625,0,Y
5022440200591308626,0,Y
5022440200591308627,0,Y
```

## Project Structure

```text
.
├── main.js                      # Electron main process
├── preload.cjs                  # Preload script for IPC (CommonJS)
├── electron-builder.config.js   # Electron builder configuration
├── vite.config.js              # Vite configuration
├── scripts/
│   ├── check-echo-ui-build.js  # Echo-UI build checker
│   └── get-theme-color.js      # Theme color utility
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main React component
│   ├── components/
│   │   ├── CardReader.jsx      # Card reader utilities
│   │   ├── NotificationContainer.jsx  # Toast notifications
│   │   ├── StatCard.jsx        # Statistics card component
│   │   └── StatusIndicator.jsx # Status indicator component
│   ├── hooks/
│   │   ├── useAudioFeedback.js # Audio feedback hook
│   │   └── useNotify.js        # Notification hook
│   ├── styles/
│   │   └── base.css            # Base styles
│   ├── types/
│   │   └── electron.d.ts       # Electron API types
│   └── utils/
│       └── csvWriter.js        # CSV writing utilities
└── package.json
```

## Troubleshooting

### Card Swipes Not Detected

**Problem:** Cards are swiped but not appearing in the app

**Solution:**

1. Make sure "Start Capture" is clicked
2. Ensure the magnetic stripe reader is in HID keyboard mode
3. Check that the app window has focus
4. Verify the card format matches the expected pattern

### CSV File Location

By default, the CSV file is saved to:

```text
%APPDATA%\echoswipe\giftcards.csv
```

You can change the save directory using the "Change Directory" button in the app. The selected directory is saved in your preferences and persists across app restarts.

### Duplicate Cards

The app automatically prevents duplicate cards from being written to the CSV file. If you swipe a card that already exists:

- A warning notification will appear
- The duplicate count will increase in statistics
- The card will NOT be added to the CSV file again

You can use the "Deduplicate" button to clean up any existing CSV files that may have duplicates from before this feature was added.

## Technology Stack

- **Electron** - Desktop application framework
- **React 19** - UI library
- **Echo-UI** - Component library (local)
- **Vite** - Build tool
- **pnpm** - Package manager

## License
