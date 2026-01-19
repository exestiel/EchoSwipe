# EchoSwipe Release Notes

## Version 1.1.0-rc

**Release Date:** January 2026

---

## Overview

Welcome to EchoSwipe! This is our first published release (v1.1.0-rc), introducing a powerful Windows desktop application for capturing and managing gift card data from magnetic stripe readers. This release candidate includes enhanced customization options and improved card reading capabilities, making the application flexible for different workflows with support for various gift card formats.

---

## New Features

### Customizable CSV Column Names

You can now customize the column names in your CSV output files to match your specific requirements. This feature allows you to:

- **Configure column headers** - Change the default column names (`account_number`, `amount`, `activated`) to match your system's requirements
- **Persistent settings** - Your column configuration is saved and automatically applied to all future CSV exports
- **Easy configuration** - Access the CSV Column Configuration section in the app to update column names at any time

This makes it easier to integrate EchoSwipe with other systems that may require specific column naming conventions.

### Enhanced Card Format Support

Improved card extraction logic now supports a wider variety of gift card formats:

- **Track 1 + Track 2 formats** - Full magnetic stripe data with both tracks
- **Track 2 with equals sign** - Standard Track 2 format with field separators
- **Track 2 only formats** - Cards that only contain Track 2 data
- **Better fallback detection** - More reliable account number extraction across different card types

These improvements ensure that EchoSwipe can accurately read account numbers from a broader range of gift card types and magnetic stripe readers.

---

## Improvements

### Better Card Field Handling

- Enhanced validation and error handling for card data processing
- More robust account number extraction with improved pattern matching
- Better handling of edge cases in card swipe data

### Documentation

- Added example gift card documentation files showing different card formats
- These examples help users understand the various card data formats that EchoSwipe can process

---

## Technical Improvements

- Refactored CSV column management system for better maintainability
- Improved card extraction algorithm with support for multiple card formats
- Enhanced error handling and validation throughout the application
- Updated internal APIs for CSV column configuration management

---

## Getting Started

This is our first published release (release candidate). 

### Installation Options

EchoSwipe v1.1.0-rc is available in two formats:

- **Portable Executable** - No installation required, run directly from any location
- **Installer** - Full installation with desktop shortcuts and Start menu integration

Both formats are available in the release package. Choose the option that best fits your needs.

### Recommendations

We recommend:

- Reviewing the USER_README.md (included in the release) for installation and usage instructions
- Testing the CSV column configuration with your workflows
- Verifying that your gift card formats are properly detected with the enhanced extraction logic
- Backing up any existing CSV files if you're migrating from another system

---

## Known Issues

None at this time. If you encounter any issues, please report them for the final v1.1.0 release.

---

## What's Next

As this is our first published release, we're actively gathering feedback to improve EchoSwipe. The final v1.1.0 release will include any bug fixes and improvements based on feedback from this release candidate. Future releases will continue to enhance functionality and add new features based on user needs.

---

## Feedback

We welcome your feedback on this release candidate. Please test the new features and let us know about your experience or any issues you encounter.
