# Gift Card Swipe Tool

A Windows desktop application that continuously reads gift card data from a magnetic stripe reader and automatically saves it to a CSV file.

## Features

- Continuous card swiping with magnetic stripe reader
- Automatic CSV export with account numbers
- Real-time UI showing swipe status and recent cards
- Built with Electron, React, and Echo-UI

## Prerequisites

- Node.js (v18 or higher)
- pnpm (package manager)
- Windows OS
- Magnetic stripe reader (HID keyboard emulation)

## Installation

### Quick Setup

1. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

2. **If Electron installation fails** (due to Cursor/VS Code locking files):
   - Close Cursor/VS Code
   - Run: `pnpm add electron`
   - Or run the setup script again: `.\setup.ps1`

### Manual Installation

```powershell
# Install dependencies
pnpm install

# If electron fails to install due to file locks:
# 1. Close Cursor/VS Code
# 2. Delete: node_modules\electron (if it exists)
# 3. Run: pnpm add electron
```

## Development

Start the development server:

```powershell
pnpm dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron app
- Enable hot reload

## Building

Build the application for production:

```powershell
pnpm build
```

This creates a distributable Windows installer in the `release` folder.

## Usage

1. Launch the application
2. Click "Start Capture" to begin listening for card swipes
3. Swipe gift cards through the magnetic stripe reader
4. Cards are automatically saved to `giftcards.csv` in the app's user data directory
5. View recent swiped cards in the UI

### CSV Format

The CSV file contains:
- `account_number` - The extracted account number from the card
- `amount` - Always set to `0`
- `activated` - Always set to `Y`

Example:
```csv
account_number,amount,activated
5022440200591308625,0,Y
5022440200591308626,0,Y
```

## Project Structure

```
.
├── main.js                 # Electron main process
├── preload.js              # Preload script for IPC
├── vite.config.js         # Vite configuration
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main React component
│   ├── components/
│   │   └── CardReader.jsx  # Card reader utilities
│   └── utils/
│       └── csvWriter.js   # CSV writing utilities
└── package.json
```

## Troubleshooting

### Electron Installation Fails

**Problem:** `ERR_PNPM_EPERM` or `EBUSY` error when installing electron

**Solution:**
1. Close all Cursor/VS Code windows
2. Wait 5 seconds
3. Delete `node_modules\electron` folder manually
4. Run `pnpm add electron`

### Card Swipes Not Detected

**Problem:** Cards are swiped but not appearing in the app

**Solution:**
1. Make sure "Start Capture" is clicked
2. Ensure the magnetic stripe reader is in HID keyboard mode
3. Check that the app window has focus
4. Verify the card format matches the expected pattern

### CSV File Location

The CSV file is saved to:
```
%APPDATA%\gift-card-swipe-tool\giftcards.csv
```

Or in Electron's user data directory.

## Technology Stack

- **Electron** - Desktop application framework
- **React 19** - UI library
- **Echo-UI** - Component library (local)
- **Vite** - Build tool
- **pnpm** - Package manager

## License

MIT
