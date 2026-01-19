import React from 'react';
import { Box, Stack } from '@echo-company/echo-ui';

/**
 * StatusIndicator component for displaying capture status
 */
export function StatusIndicator({ isActive, isElectron }) {
  if (!isElectron) {
    return (
      <Box
        p="md"
        bg="var(--warning-bg)"
        borderRadius="md"
        style={{
          border: '2px solid var(--warning-border)',
        }}
      >
        <Stack direction="row" spacing="sm" style={{ alignItems: 'center' }}>
          <Box
            style={{
              width: 'var(--spacing-sm)',
              height: 'var(--spacing-sm)',
              borderRadius: '50%',
              backgroundColor: 'var(--warning-solid)',
            }}
          />
          <p
            style={{
              color: 'var(--warning-text)',
              margin: 0,
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            <strong>Browser Mode:</strong> Card capture features are only available in the Electron
            app.
          </p>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      p="lg"
      bg={isActive ? 'var(--success-bg)' : 'var(--surface)'}
      borderRadius="md"
      style={{
        border: `2px solid ${isActive ? 'var(--success-border)' : 'var(--border)'}`,
        boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        transition: 'all 0.3s ease',
      }}
    >
      <Stack direction="row" spacing="md" style={{ alignItems: 'center' }}>
        <Box
          style={{
            width: 'var(--spacing-md)',
            height: 'var(--spacing-md)',
            borderRadius: '50%',
            backgroundColor: isActive ? 'var(--success-solid)' : 'var(--text-secondary)',
            boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
            animation: isActive ? 'pulse 2s infinite' : 'none',
          }}
        />
        <Stack spacing="xs" style={{ flex: 1 }}>
          <p
            style={{
              color: isActive ? 'var(--success-text)' : 'var(--text)',
              margin: 0,
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            {isActive ? 'Active - Ready to Swipe' : 'Inactive'}
          </p>
          <p
            style={{
              color: isActive ? 'var(--success-text)' : 'var(--text-secondary)',
              margin: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {isActive
              ? 'Swipe a gift card to capture the account number'
              : 'Click "Start Capture" to begin capturing gift cards'}
          </p>
        </Stack>
      </Stack>
      <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}
