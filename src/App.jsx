import React, { useState, useEffect, useRef } from 'react';
import { Container, Stack, Box, Button, Grid } from '@echo-company/echo-ui';
import { useNotify } from './hooks/useNotify';
import { useAudioFeedback } from './hooks/useAudioFeedback';
import { NotificationContainer } from './components/NotificationContainer';
import { StatCard } from './components/StatCard';
import { StatusIndicator } from './components/StatusIndicator';

// Format card number for display (add spaces every 4 digits)
const formatCardNumber = (number) => {
  if (!number) return '';
  return number.toString().replace(/(\d{4})(?=\d)/g, '$1 ');
};

// Format timestamp for display
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

function App() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [cardCount, setCardCount] = useState(0);
  const [recentCards, setRecentCards] = useState([]); // Array of { accountNumber, timestamp, isDuplicate }
  const [csvPath, setCsvPath] = useState('');
  const [csvDirectory, setCsvDirectory] = useState('');
  const [swipedCards, setSwipedCards] = useState(new Set()); // Track all swiped cards
  const [duplicateCards, setDuplicateCards] = useState(new Set()); // Track duplicate cards
  const [duplicateCount, setDuplicateCount] = useState(0); // Total duplicate count
  const [errorCount, setErrorCount] = useState(0); // Track error count
  const [csvColumns, setCsvColumns] = useState({
    accountNumber: 'account_number',
    amount: 'amount',
    activated: 'activated',
  }); // CSV column names
  const { notify, removeNotification, notifications } = useNotify();
  const { playSound } = useAudioFeedback();
  const listenerRegisteredRef = useRef(false); // Prevent duplicate listener registration
  const errorListenerRegisteredRef = useRef(false); // Prevent duplicate error listener registration
  const isElectron = typeof window.electronAPI !== 'undefined';

  useEffect(() => {
    if (isElectron && !listenerRegisteredRef.current) {
      listenerRegisteredRef.current = true;

      // Get CSV path and directory on mount
      Promise.all([window.electronAPI.getCsvPath(), window.electronAPI.getCsvDirectory()])
        .then(([path, directory]) => {
          setCsvPath(path);
          setCsvDirectory(directory);
        })
        .catch((err) => {
          console.warn('Failed to get CSV path:', err);
        });

      // Listen for card swipes
      const handleCardSwiped = (data) => {
        // Handle both old format (string) and new format (object)
        const accountNumber = typeof data === 'string' ? data : data.accountNumber;
        const isDuplicate = typeof data === 'object' ? data.duplicate === true : false;
        const timestamp = new Date();

        if (isDuplicate) {
          // This is a duplicate - already in CSV, don't write again
          setDuplicateCards((dupPrev) => new Set([...dupPrev, accountNumber]));
          setDuplicateCount((count) => count + 1);

          // Show notification using useNotify
          notify(
            `Duplicate detected: Card ${formatCardNumber(accountNumber)} already exists in CSV file!`,
            {
              type: 'warning',
              duration: 5000,
            }
          );
          // Play warning sound
          playSound('warning');
        } else {
          // Success - new unique card written to CSV
          setSwipedCards((prev) => {
            // Check if we've seen this in the UI (might be a re-swipe that wasn't in CSV)
            const seenInUI = prev.has(accountNumber);
            if (seenInUI) {
              // This was a duplicate in UI but not in CSV (CSV was cleared or changed)
              setDuplicateCards((dupPrev) => {
                const newSet = new Set(dupPrev);
                newSet.delete(accountNumber); // Remove from duplicates since it's now in CSV
                return newSet;
              });
            }
            return new Set([...prev, accountNumber]);
          });

          // Success notification for new card
          notify(`Card ${formatCardNumber(accountNumber)} captured and saved successfully`, {
            type: 'success',
            duration: 3000,
          });
          // Play success sound
          playSound('success');
        }

        setCardCount((prev) => prev + 1);

        // Update recent cards with proper duplicate tracking
        setRecentCards((prev) => {
          const newCard = {
            accountNumber,
            timestamp,
            isDuplicate,
          };
          const updated = [newCard, ...prev].slice(0, 20);
          return updated;
        });
      };

      // Listen for card swipe errors
      const handleCardSwipeError = (errorData) => {
        setErrorCount((prev) => prev + 1);

        const errorMessage = errorData.error || 'Unknown error occurred';
        const accountNumber = errorData.accountNumber
          ? formatCardNumber(errorData.accountNumber)
          : '';

        notify(
          accountNumber
            ? `Error saving card ${accountNumber}: ${errorMessage}`
            : `Error processing swipe: ${errorMessage}`,
          {
            type: 'error',
            duration: 6000,
          }
        );
        // Play error sound
        playSound('error');

        if (process.env.NODE_ENV === 'development') {
          console.error('Card swipe error:', errorData);
        }
      };

      window.electronAPI.onCardSwiped(handleCardSwiped);

      if (!errorListenerRegisteredRef.current) {
        errorListenerRegisteredRef.current = true;
        window.electronAPI.onCardSwipeError(handleCardSwipeError);
      }

      return () => {
        listenerRegisteredRef.current = false;
        errorListenerRegisteredRef.current = false;
        window.electronAPI.removeCardSwipedListener();
        window.electronAPI.removeCardSwipeErrorListener();
      };
    } else if (!isElectron) {
      // Running in browser - show message
      setCsvPath('Browser mode - Electron features unavailable');
    }
  }, [notify, playSound]);

  const handleStartStop = async () => {
    if (typeof window.electronAPI === 'undefined') {
      notify('Card capture is only available in the Electron app, not in browser mode.', {
        type: 'warning',
        duration: 5000,
      });
      return;
    }

    try {
      if (isCapturing) {
        await window.electronAPI.stopCapture();
        setIsCapturing(false);
        notify('Card capture stopped', {
          type: 'info',
          duration: 2000,
        });
      } else {
        await window.electronAPI.startCapture();
        setIsCapturing(true);
        notify('Card capture started - Ready to swipe', {
          type: 'success',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to toggle capture:', error);
      notify('Failed to toggle card capture. Please try again.', {
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleClear = () => {
    setCardCount(0);
    setRecentCards([]);
    setSwipedCards(new Set());
    setDuplicateCards(new Set());
    setDuplicateCount(0);
    setErrorCount(0);
    notify('All data cleared', {
      type: 'info',
      duration: 2000,
    });
  };

  // Calculate success rate
  const successRate = cardCount > 0 ? Math.round((swipedCards.size / cardCount) * 100) : 100;

  // Handle CSV path click (copy to clipboard)
  const handleCsvPathClick = () => {
    if (isElectron && csvPath) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(csvPath);
        notify('CSV path copied to clipboard', {
          type: 'info',
          duration: 2000,
        });
      }
    }
  };

  // Handle opening CSV file
  const handleOpenCsvFile = async () => {
    if (!isElectron) {
      notify('Opening files is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await window.electronAPI.openCsvFile();

      if (result.success) {
        notify('CSV file opened', {
          type: 'success',
          duration: 2000,
        });
      } else {
        notify(result.error || 'Failed to open CSV file', {
          type: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error opening CSV file:', error);
      notify('Failed to open CSV file. Please try again.', {
        type: 'error',
        duration: 5000,
      });
    }
  };

  // Handle deduplicating CSV file
  const handleDeduplicateCsv = async () => {
    if (!isElectron) {
      notify('Deduplication is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await window.electronAPI.deduplicateCsv();

      if (result.success) {
        const message =
          result.duplicatesRemoved && result.duplicatesRemoved > 0
            ? `Deduplication complete: Removed ${result.duplicatesRemoved} duplicate${result.duplicatesRemoved !== 1 ? 's' : ''}. ${result.totalCards} unique cards remain.`
            : `Deduplication complete: No duplicates found. ${result.totalCards} cards in file.`;

        notify(message, {
          type: 'success',
          duration: 5000,
        });
      } else {
        notify(result.error || 'Failed to deduplicate CSV file', {
          type: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error deduplicating CSV file:', error);
      notify('Failed to deduplicate CSV file. Please try again.', {
        type: 'error',
        duration: 5000,
      });
    }
  };

  // Load cards from CSV with pagination
  const loadCards = async (page = 1, pageSize = 50) => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI.getCards(page, pageSize);
      if (result.success) {
        setAllCards(result.cards || []);
        setCardPagination({
          page: result.page || page,
          pageSize: result.pageSize || pageSize,
          total: result.total || 0,
          totalPages: result.totalPages || 0,
        });
      }
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  // Load all cards (for backward compatibility, but use pagination for large files)
  const loadAllCards = async () => {
    await loadCards(cardPagination.page, cardPagination.pageSize);
  };

  // Load CSV column configuration
  const loadCsvColumns = async () => {
    if (!isElectron) return;

    try {
      const result = await window.electronAPI.getCsvColumns();
      if (result.success && result.columns) {
        setCsvColumns(result.columns);
      }
    } catch (error) {
      console.error('Error loading CSV columns:', error);
    }
  };

  // Save CSV column configuration
  const handleSaveCsvColumns = async () => {
    if (!isElectron) {
      notify('CSV column configuration is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await window.electronAPI.saveCsvColumns(csvColumns);

      if (result.success) {
        notify('CSV column configuration saved successfully', {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        if (result.columns) {
          setCsvColumns(result.columns);
        }
      } else {
        notify(result.error || 'Failed to save CSV column configuration', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error saving CSV columns:', error);
      notify('Failed to save CSV column configuration. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Update card field (generic handler for any column)
  const handleUpdateCardField = async (accountNumber, columnId, value) => {
    if (!isElectron) {
      notify('Card management is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      // For amount column, use the existing handler for backward compatibility
      if (columnId === 'amount') {
        const result = await window.electronAPI.updateCardAmount(accountNumber, value);

        if (result.success) {
          notify(`Amount updated for card ${formatCardNumber(accountNumber)}`, {
            type: 'success',
            duration: 3000,
          });
          playSound('success');
          await loadCards(cardPagination.page, cardPagination.pageSize);
          setEditingFields((prev) => {
            const updated = { ...prev };
            if (updated[accountNumber]) {
              delete updated[accountNumber][columnId];
              if (Object.keys(updated[accountNumber]).length === 0) {
                delete updated[accountNumber];
              }
            }
            return updated;
          });
        } else {
          notify(result.error || 'Failed to update card field', {
            type: 'error',
            duration: 5000,
          });
          playSound('error');
        }
        return;
      }

      // For other columns, use the generic update handler
      const result = await window.electronAPI.updateCardField(accountNumber, columnId, value);

      if (result.success) {
        const column = csvColumns.find((col) => col.id === columnId);
        const columnName = column ? column.name : columnId;
        notify(`${columnName} updated for card ${formatCardNumber(accountNumber)}`, {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        await loadCards(cardPagination.page, cardPagination.pageSize);
        setEditingFields((prev) => {
          const updated = { ...prev };
          if (updated[accountNumber]) {
            delete updated[accountNumber][columnId];
            if (Object.keys(updated[accountNumber]).length === 0) {
              delete updated[accountNumber];
            }
          }
          return updated;
        });
      } else {
        notify(result.error || 'Failed to update card field', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error updating card field:', error);
      notify('Failed to update card field. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Add CSV column
  const handleAddCsvColumn = async () => {
    if (!isElectron) {
      notify('Column management is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    if (!newColumnForm.name.trim()) {
      notify('Column name is required', {
        type: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const columnData = {
        name: newColumnForm.name.trim(),
        type: newColumnForm.type,
        defaultValue: newColumnForm.type === 'predefined' ? newColumnForm.defaultValue || '' : '',
      };

      const result = await window.electronAPI.addCsvColumn(columnData);

      if (result.needsPrompt) {
        // Show prompt dialog
        setPromptDialog({
          show: true,
          column: columnData,
          defaultValue: columnData.defaultValue || '',
        });
        return;
      }

      if (result.success) {
        notify(`Column "${columnData.name}" added successfully`, {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        if (result.columns) {
          setCsvColumns(result.columns);
        }
        setNewColumnForm({ name: '', type: 'manual', defaultValue: '', show: false });
        await loadCards(cardPagination.page, cardPagination.pageSize);
      } else {
        notify(result.error || 'Failed to add column', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error adding CSV column:', error);
      notify('Failed to add column. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Confirm add column with default value
  const handleConfirmAddColumn = async () => {
    if (!promptDialog.column) return;

    try {
      const result = await window.electronAPI.addCsvColumn(
        promptDialog.column,
        promptDialog.defaultValue
      );

      if (result.success) {
        notify(`Column "${promptDialog.column.name}" added successfully`, {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        if (result.columns) {
          setCsvColumns(result.columns);
        }
        setNewColumnForm({ name: '', type: 'manual', defaultValue: '', show: false });
        setPromptDialog({ show: false, column: null, defaultValue: '' });
        await loadCards(cardPagination.page, cardPagination.pageSize);
      } else {
        notify(result.error || 'Failed to add column', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error adding CSV column:', error);
      notify('Failed to add column. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Delete CSV column
  const handleDeleteCsvColumn = async (columnId) => {
    if (!isElectron) {
      notify('Column management is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    if (
      !confirm(
        'Are you sure you want to delete this column? This will remove it from all cards in the CSV file.'
      )
    ) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteCsvColumn(columnId);

      if (result.success) {
        notify('Column deleted successfully', {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        if (result.columns) {
          setCsvColumns(result.columns);
        }
        await loadCards(cardPagination.page, cardPagination.pageSize);
      } else {
        notify(result.error || 'Failed to delete column', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error deleting CSV column:', error);
      notify('Failed to delete column. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Reorder CSV columns
  const handleReorderCsvColumns = async (columnIds) => {
    if (!isElectron) {
      notify('Column management is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await window.electronAPI.reorderCsvColumns(columnIds);

      if (result.success) {
        notify('Column order updated successfully', {
          type: 'success',
          duration: 3000,
        });
        playSound('success');
        if (result.columns) {
          setCsvColumns(result.columns);
        }
        await loadCards(cardPagination.page, cardPagination.pageSize);
      } else {
        notify(result.error || 'Failed to reorder columns', {
          type: 'error',
          duration: 5000,
        });
        playSound('error');
      }
    } catch (error) {
      console.error('Error reordering CSV columns:', error);
      notify('Failed to reorder columns. Please try again.', {
        type: 'error',
        duration: 5000,
      });
      playSound('error');
    }
  };

  // Move column up
  const handleMoveColumnUp = (index) => {
    if (index === 0) return; // Can't move first column up
    const newOrder = [...csvColumns];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    const columnIds = newOrder.map((col) => col.id);
    handleReorderCsvColumns(columnIds);
  };

  // Move column down
  const handleMoveColumnDown = (index) => {
    if (index === csvColumns.length - 1) return; // Can't move last column down
    const newOrder = [...csvColumns];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    const columnIds = newOrder.map((col) => col.id);
    handleReorderCsvColumns(columnIds);
  };

  // Load columns on mount
  useEffect(() => {
    if (isElectron) {
      loadCsvColumns();
    }
  }, [isElectron]);

  // Handle directory selection
  const handleSelectDirectory = async () => {
    if (!isElectron) {
      notify('Directory selection is only available in the Electron app.', {
        type: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const result = await window.electronAPI.selectCsvDirectory();

      if (result.canceled) {
        return; // User canceled
      }

      if (result.success) {
        setCsvDirectory(result.directory);
        setCsvPath(result.csvPath);
        notify(`CSV directory changed to: ${result.directory}`, {
          type: 'success',
          duration: 3000,
        });
      } else {
        notify(`Failed to select directory: ${result.error || 'Unknown error'}`, {
          type: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      notify('Failed to select directory. Please try again.', {
        type: 'error',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      <Container maxWidth="lg" padding="lg">
        <Stack spacing="xl">
          {/* Header Section */}
          <Box>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-xxl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text)',
              }}
            >
              EchoSwipe
            </h1>
            <p
              style={{
                margin: 'var(--spacing-xs) 0 0 0',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Capture and track gift card account numbers from magnetic stripe readers
            </p>
          </Box>

          {/* Control Panel */}
          <Box>
            <Stack direction="row" spacing="md">
              <Button
                variant={isCapturing ? 'secondary' : 'primary'}
                onClick={handleStartStop}
                style={{
                  minWidth: 'calc(var(--spacing-xxl) * 3)',
                }}
              >
                {isCapturing ? 'Stop Capture' : 'Start Capture'}
              </Button>
              <Button variant="outline" onClick={handleClear} disabled={cardCount === 0}>
                Clear All
              </Button>
            </Stack>
          </Box>

          {/* Status Indicator */}
          <Box>
            <StatusIndicator isActive={isCapturing} isElectron={isElectron} />
          </Box>

          {/* Statistics Dashboard */}
          {cardCount > 0 && (
            <Box>
              <h2
                style={{
                  margin: '0 0 var(--spacing-md) 0',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text)',
                }}
              >
                Statistics
              </h2>
              <Grid
                gap="md"
                style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
              >
                <StatCard label="Total Swiped" value={cardCount} variant="default" />
                <StatCard
                  label="Unique Cards"
                  value={swipedCards.size}
                  variant="success"
                  subtitle={
                    cardCount > 0
                      ? `${Math.round((swipedCards.size / cardCount) * 100)}% unique`
                      : ''
                  }
                />
                <StatCard
                  label="Duplicates"
                  value={duplicateCount}
                  variant={duplicateCount > 0 ? 'danger' : 'default'}
                  subtitle={duplicateCount > 0 ? 'Needs attention' : 'None detected'}
                />
                {errorCount > 0 && (
                  <StatCard
                    label="Errors"
                    value={errorCount}
                    variant="danger"
                    subtitle="Failed to save"
                  />
                )}
                <StatCard
                  label="Success Rate"
                  value={`${successRate}%`}
                  variant={successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'danger'}
                />
              </Grid>
            </Box>
          )}

          {/* CSV Location */}
          {csvPath && isElectron && (
            <Box
              p="md"
              bg="var(--surface)"
              borderRadius="md"
              style={{
                border: '1px solid var(--border)',
              }}
            >
              <Stack spacing="md">
                <Stack
                  direction="row"
                  spacing="sm"
                  style={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    CSV File Location
                  </p>
                  <Stack direction="row" spacing="sm">
                    <Button variant="outline" size="small" onClick={handleOpenCsvFile}>
                      Open File
                    </Button>
                    <Button variant="outline" size="small" onClick={handleDeduplicateCsv}>
                      Deduplicate
                    </Button>
                    <Button variant="outline" size="small" onClick={handleSelectDirectory}>
                      Change Directory
                    </Button>
                  </Stack>
                </Stack>
                <Box
                  style={{
                    cursor: 'pointer',
                  }}
                  onClick={handleCsvPathClick}
                >
                  <Stack spacing="xs">
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      Directory:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {csvDirectory}
                    </p>
                    <p
                      style={{
                        margin: 'var(--spacing-xs) 0 0 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      File:
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text)',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {csvPath}
                    </p>
                    <p
                      style={{
                        margin: 'var(--spacing-xs) 0 0 0',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Click path to copy
                    </p>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Recent Cards Section */}
          <Box>
            <Stack spacing="md">
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text)',
                }}
              >
                Recent Cards
              </h2>

              {recentCards.length === 0 ? (
                <Box
                  p="xl"
                  bg="var(--surface)"
                  borderRadius="md"
                  style={{
                    border: '1px dashed var(--border)',
                    textAlign: 'center',
                  }}
                >
                  <Stack spacing="sm" style={{ alignItems: 'center' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-md)',
                        color: 'var(--text-secondary)',
                        fontWeight: 'var(--font-weight-medium)',
                      }}
                    >
                      No cards swiped yet
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {isCapturing
                        ? 'Swipe a gift card to capture the account number'
                        : 'Start capture to begin swiping gift cards'}
                    </p>
                  </Stack>
                </Box>
              ) : (
                <Box
                  style={{
                    maxHeight: 'calc(var(--spacing-xxl) * 8)',
                    overflowY: 'auto',
                    padding: 'var(--spacing-xs)',
                    margin: 'calc(var(--spacing-xs) * -1)',
                  }}
                >
                  <Stack spacing="sm">
                    {recentCards.map((card, index) => {
                      const isDuplicate =
                        duplicateCards.has(card.accountNumber) || card.isDuplicate;
                      return (
                        <Box
                          key={`${card.accountNumber}-${card.timestamp?.getTime() || index}`}
                          p="md"
                          bg={isDuplicate ? 'var(--danger-bg)' : 'var(--surface)'}
                          borderRadius="md"
                          style={{
                            border: `2px solid ${isDuplicate ? 'var(--danger-border)' : 'var(--border)'}`,
                            boxShadow: isDuplicate ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Stack spacing="xs">
                            <Stack
                              direction="row"
                              spacing="md"
                              style={{ alignItems: 'center', justifyContent: 'space-between' }}
                            >
                              <Box>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: 'var(--font-size-md)',
                                    fontFamily: 'monospace',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: isDuplicate ? 'var(--danger-text)' : 'var(--text)',
                                    letterSpacing: '0.1em',
                                  }}
                                >
                                  {formatCardNumber(card.accountNumber)}
                                </p>
                              </Box>
                              {isDuplicate && (
                                <Box
                                  p="xs"
                                  bg="var(--danger-solid)"
                                  borderRadius="sm"
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                    color: 'var(--danger-text-contrast)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Duplicate
                                </Box>
                              )}
                            </Stack>
                            {card.timestamp && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--font-size-xs)',
                                  color: isDuplicate
                                    ? 'var(--danger-text)'
                                    : 'var(--text-secondary)',
                                }}
                              >
                                Swiped at {formatTimestamp(card.timestamp)}
                              </p>
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Box>

          {/* CSV Column Configuration Section */}
          {isElectron && (
            <Box>
              <Stack spacing="md">
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text)',
                  }}
                >
                  CSV Column Configuration
                </h2>
                <Box
                  p="md"
                  bg="var(--surface)"
                  borderRadius="md"
                  style={{
                    border: '1px solid var(--border)',
                  }}
                >
                  <Stack spacing="md">
                    <Stack spacing="sm">
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text)',
                        }}
                      >
                        Account Number Column:
                      </label>
                      <input
                        type="text"
                        value={csvColumns.accountNumber}
                        onChange={(e) => {
                          setCsvColumns((prev) => ({
                            ...prev,
                            accountNumber: e.target.value,
                          }));
                        }}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          fontSize: 'var(--font-size-sm)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          outline: 'none',
                        }}
                      />
                    </Stack>
                    <Stack spacing="sm">
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text)',
                        }}
                      >
                        Amount Column:
                      </label>
                      <input
                        type="text"
                        value={csvColumns.amount}
                        onChange={(e) => {
                          setCsvColumns((prev) => ({
                            ...prev,
                            amount: e.target.value,
                          }));
                        }}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          fontSize: 'var(--font-size-sm)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          outline: 'none',
                        }}
                      />
                    </Stack>
                    <Stack spacing="sm">
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text)',
                        }}
                      >
                        Activated Column:
                      </label>
                      <input
                        type="text"
                        value={csvColumns.activated}
                        onChange={(e) => {
                          setCsvColumns((prev) => ({
                            ...prev,
                            activated: e.target.value,
                          }));
                        }}
                        style={{
                          width: '100%',
                          padding: 'var(--spacing-sm)',
                          fontSize: 'var(--font-size-sm)',
                          backgroundColor: 'var(--background)',
                          color: 'var(--text)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          outline: 'none',
                        }}
                      />
                    </Stack>
                    <Button variant="primary" onClick={handleSaveCsvColumns}>
                      Save Column Configuration
                    </Button>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Changes will be applied to the CSV file header. Existing data will be
                      preserved.
                    </p>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </>
  );
}

export default App;
