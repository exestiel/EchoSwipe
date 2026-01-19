# EchoSwipe - User Guide

**Version 1.1.0-rc** | [Release Notes](RELEASE_NOTES.md)

A Windows desktop application that continuously reads gift card data from a magnetic stripe reader and automatically saves it to a CSV file with automatic deduplication and sorting.

---

## Overview

EchoSwipe simplifies gift card data collection by automatically capturing account numbers from magnetic stripe readers and organizing them into a clean, deduplicated CSV file. Perfect for retail operations, inventory management, and gift card processing workflows.

---

## Features

### Core Functionality

- **Continuous Card Swiping** - Automatically captures gift card data from magnetic stripe readers
- **Automatic Deduplication** - Prevents duplicate cards from being added to your CSV file
- **Sorted Output** - Cards are automatically sorted by account number for easy reference
- **Custom CSV Directory** - Choose where to save your CSV files
- **Customizable Column Names** - Configure CSV column headers to match your system requirements

### User Experience

- **Real-time Statistics** - Track total swipes, unique cards, duplicates, and success rate
- **Audio Feedback** - Audio cues for successful swipes, errors, and warnings
- **Visual Notifications** - User-friendly notifications for all actions and errors
- **Dark Mode** - Beautiful dark theme for comfortable extended use
- **Real-time Status** - See swipe status and recent cards at a glance

### Data Management

- **Deduplicate Tool** - Clean up existing CSV files to remove duplicates
- **Open File** - Quickly open your CSV file in your default application
- **Persistent Settings** - Your preferences are saved and remembered

---

## System Requirements

- **Operating System:** Windows 10 or later
- **Hardware:** Magnetic stripe reader (HID keyboard emulation mode)
- **No additional software required** - EchoSwipe runs as a standalone application

---

## Installation

EchoSwipe v1.1.0-rc is available in two formats. Choose the option that best fits your needs:

### Option 1: Portable Executable

**Best for:** Quick testing, USB drives, or when you don't want to install software on your system.

1. Download `EchoSwipe-1.1.0-rc-portable.exe` from the releases page
2. Run the executable - no installation required
3. The application will launch immediately
4. You can move the executable to any location and run it from there

**Note:** The portable version saves settings and CSV files to `%APPDATA%\echoswipe\` by default.

### Option 2: Installer

**Best for:** Permanent installation, desktop shortcuts, and integration with Windows Start menu.

1. Download `EchoSwipe Setup 1.1.0-rc.exe` (NSIS installer) from the releases page
2. Run the installer and follow the setup wizard
3. Choose your installation directory (optional - defaults to Program Files)
4. The installer will create:
   - Desktop shortcut for easy access
   - Start menu entry
   - Uninstaller in Windows Settings
5. Launch EchoSwipe from the desktop shortcut or Start menu

**Note:** The installed version also saves settings and CSV files to `%APPDATA%\echoswipe\` by default.

---

## Quick Start Guide

### First Time Setup

1. **Launch EchoSwipe** - Open the application
2. **(Optional) Configure CSV Columns** - Go to the CSV Column Configuration section to customize column names if needed
3. **(Optional) Choose Save Location** - Click "Change Directory" to select where CSV files should be saved
   - Default location: `%APPDATA%\echoswipe\giftcards.csv`

### Using EchoSwipe

1. **Start Capture** - Click the "Start Capture" button to begin listening for card swipes
2. **Swipe Cards** - Swipe gift cards through your magnetic stripe reader
3. **Monitor Progress** - Watch the real-time statistics and recent cards display
4. **Access Your Data** - Click "Open File" to view your CSV file, or use "Deduplicate" to clean up existing files

### CSV Column Configuration

EchoSwipe allows you to customize the column names in your CSV output:

1. Navigate to the **CSV Column Configuration** section
2. Modify the column names as needed:
   - **Account Number Column** - Default: `account_number`
   - **Amount Column** - Default: `amount`
   - **Activated Column** - Default: `activated`
3. Click **"Save Column Configuration"** to apply your changes
4. Your settings are saved and will be used for all future CSV exports

---

## CSV File Format

Your CSV file contains three columns:

- **Account Number** - The extracted account number from the card (customizable column name)
- **Amount** - Always set to `0` (customizable column name)
- **Activated** - Always set to `Y` (customizable column name)

### Example CSV Output

```csv
account_number,amount,activated
5022440200591308625,0,Y
5022440200591308626,0,Y
5022440200591308627,0,Y
```

### Important Notes

- **Automatic Deduplication** - Duplicate account numbers are automatically prevented
- **Automatic Sorting** - Cards are sorted by account number in ascending order
- **Persistent Configuration** - Your column name settings are saved and persist across app restarts

---

## Supported Card Formats

EchoSwipe supports a wide variety of gift card formats:

- **Track 1 + Track 2 formats** - Full magnetic stripe data with both tracks
- **Track 2 with equals sign** - Standard Track 2 format with field separators
- **Track 2 only formats** - Cards that only contain Track 2 data

The application automatically detects and extracts account numbers from these formats, ensuring compatibility with most magnetic stripe readers and gift card types.

---

## Troubleshooting

### Card Swipes Not Detected

**Problem:** Cards are swiped but not appearing in the app

**Solutions:**

1. **Check Capture Status** - Make sure "Start Capture" is clicked (button should show "Stop Capture" when active)
2. **Reader Mode** - Ensure your magnetic stripe reader is in HID keyboard emulation mode
3. **Window Focus** - Make sure the EchoSwipe window has focus (click on it)
4. **Card Format** - Verify your card format is supported (see Supported Card Formats above)
5. **Try Again** - Sometimes a second swipe resolves timing issues

### CSV File Location

**Default Location:**
```
%APPDATA%\echoswipe\giftcards.csv
```

**To Change Location:**
- Click the "Change Directory" button in the app
- Select your desired folder
- The new location is saved automatically

### Duplicate Cards

**How It Works:**
- EchoSwipe automatically prevents duplicate cards from being written to the CSV file
- If you swipe a card that already exists:
  - A warning notification will appear
  - The duplicate count will increase in statistics
  - The card will NOT be added to the CSV file again

**Cleaning Existing Files:**
- Use the "Deduplicate" button to clean up any existing CSV files that may have duplicates from before using EchoSwipe

### Audio Feedback Not Working

- Check your system volume settings
- Ensure Windows notifications are enabled
- Try restarting the application

---

## Tips & Best Practices

1. **Test First** - Swipe a test card to verify everything is working before processing large batches
2. **Monitor Statistics** - Keep an eye on the statistics panel to track your progress
3. **Regular Backups** - Periodically backup your CSV files
4. **Column Configuration** - Set up your CSV column names before starting a large batch to avoid reconfiguration
5. **Deduplicate Regularly** - Use the deduplicate tool on existing files before importing into other systems

---

## Support

For issues, questions, or feedback:

- Check the [Release Notes](RELEASE_NOTES.md) for known issues and updates
- Review the troubleshooting section above
- Report issues through your support channel

---

## Version Information

**Current Version:** 1.1.0-rc (Release Candidate)

This is the first published release of EchoSwipe. We welcome your feedback to help improve the application for the final v1.1.0 release.

See [RELEASE_NOTES.md](RELEASE_NOTES.md) for detailed information about this release.

---

## License

Copyright © 2026 The Echo Company. All rights reserved.
