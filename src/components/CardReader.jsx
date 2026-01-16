import { useEffect, useRef } from 'react';

/**
 * CardReader component handles mag stripe data capture and parsing
 * It listens for keyboard input and detects card swipes
 */
export function useCardReader(onCardSwiped) {
  const bufferRef = useRef('');
  const timeoutRef = useRef(null);
  const SWIPE_TIMEOUT_MS = 500;

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only process if we're in a focused input context
      // The main process will handle the actual capture
      const char = event.key;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      bufferRef.current += char;
      
      timeoutRef.current = setTimeout(() => {
        if (bufferRef.current.length > 0) {
          const accountNumber = extractAccountNumber(bufferRef.current);
          if (accountNumber && onCardSwiped) {
            onCardSwiped(accountNumber);
          }
          bufferRef.current = '';
        }
      }, SWIPE_TIMEOUT_MS);
    };

    // Listen for keyboard events
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onCardSwiped]);
}

/**
 * Extract account number from mag stripe data
 * Format: %B5022440200591308625^HEARTLAND GIFT^391200018130?;5022440200591308625=391200018130?
 */
export function extractAccountNumber(data) {
  // Try to extract from Track 1 format: %B5022440200591308625^...
  const track1Match = data.match(/%B(\d+)\^/);
  if (track1Match) {
    return track1Match[1];
  }
  
  // Try to extract from Track 2 format: ;5022440200591308625=...
  const track2Match = data.match(/;(\d+)=/);
  if (track2Match) {
    return track2Match[1];
  }
  
  // Fallback: try to find the account number that appears in both tracks
  // This is the number that appears before ^ in track 1 and before = in track 2
  const bothTracksMatch = data.match(/%B(\d+)\^.*?;\1=/);
  if (bothTracksMatch) {
    return bothTracksMatch[1];
  }
  
  return null;
}
