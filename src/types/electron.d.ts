export interface ElectronAPI {
  getCsvPath: () => Promise<string>;
  getCsvDirectory: () => Promise<string>;
  selectCsvDirectory: () => Promise<{
    success: boolean;
    canceled?: boolean;
    directory?: string;
    csvPath?: string;
    error?: string;
  }>;
  openCsvFile: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  deduplicateCsv: () => Promise<{
    success: boolean;
    error?: string;
    duplicatesRemoved?: number;
    totalCards?: number;
    originalCount?: number;
  }>;
  writeCsvRow: (accountNumber: string) => Promise<{
    success: boolean;
    path: string;
    duplicate?: boolean;
    error?: string;
  }>;
  startCapture: () => Promise<{ success: boolean }>;
  stopCapture: () => Promise<{ success: boolean }>;
  onCardSwiped: (callback: (data: { accountNumber: string; duplicate?: boolean } | string) => void) => void;
  onCardSwipeError: (callback: (error: { error: string; accountNumber?: string; data?: string }) => void) => void;
  removeCardSwipedListener: () => void;
  removeCardSwipeErrorListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
