/**
 * CSV Writer utility for appending gift card data
 * This is a renderer-side utility that uses IPC to communicate with main process
 */

export async function appendCardToCsv(accountNumber) {
  try {
    const result = await window.electronAPI.writeCsvRow(accountNumber);
    return result;
  } catch (error) {
    console.error('Error writing to CSV:', error);
    throw error;
  }
}

export async function getCsvPath() {
  try {
    const path = await window.electronAPI.getCsvPath();
    return path;
  } catch (error) {
    console.error('Error getting CSV path:', error);
    throw error;
  }
}
