const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getCsvPath: () => ipcRenderer.invoke('get-csv-path'),
  getCsvDirectory: () => ipcRenderer.invoke('get-csv-directory'),
  selectCsvDirectory: () => ipcRenderer.invoke('select-csv-directory'),
  openCsvFile: () => ipcRenderer.invoke('open-csv-file'),
  deduplicateCsv: () => ipcRenderer.invoke('deduplicate-csv'),
  writeCsvRow: (accountNumber) => ipcRenderer.invoke('write-csv-row', accountNumber),
  startCapture: () => ipcRenderer.invoke('start-capture'),
  stopCapture: () => ipcRenderer.invoke('stop-capture'),
  onCardSwiped: (callback) => {
    ipcRenderer.on('card-swiped', (event, data) => {
      // Handle both old format (string) and new format (object)
      if (typeof data === 'string') {
        callback({ accountNumber: data, duplicate: false });
      } else {
        callback(data);
      }
    });
  },
  onCardSwipeError: (callback) => {
    ipcRenderer.on('card-swipe-error', (event, error) => callback(error));
  },
  removeCardSwipedListener: () => {
    ipcRenderer.removeAllListeners('card-swiped');
  },
  removeCardSwipeErrorListener: () => {
    ipcRenderer.removeAllListeners('card-swipe-error');
  },
});
