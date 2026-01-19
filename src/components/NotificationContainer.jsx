import React from 'react';
import { Box, Stack } from '@echo-company/echo-ui';

/**
 * NotificationContainer component for displaying toast notifications
 */
export function NotificationContainer({ notifications, onRemove }) {
  if (notifications.length === 0) return null;

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return {
          bg: 'var(--success-bg)',
          borderColor: 'var(--success-border)',
          textColor: 'var(--success-text)',
        };
      case 'error':
      case 'danger':
        return {
          bg: 'var(--danger-bg)',
          borderColor: 'var(--danger-border)',
          textColor: 'var(--danger-text)',
        };
      case 'warning':
        return {
          bg: 'var(--warning-bg)',
          borderColor: 'var(--warning-border)',
          textColor: 'var(--warning-text)',
        };
      case 'info':
      default:
        return {
          bg: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          textColor: 'var(--info-text-contrast)',
        };
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 'var(--spacing-md)',
        right: 'var(--spacing-md)',
        zIndex: 10000,
        maxWidth: '400px',
        pointerEvents: 'none',
      }}
    >
      <Stack spacing="sm" style={{ pointerEvents: 'auto' }}>
        {notifications.map((notification) => {
          const styles = getNotificationStyles(notification.type);
          return (
            <Box
              key={notification.id}
              p="md"
              bg={styles.bg}
              borderRadius="md"
              style={{
                border: `2px solid ${styles.borderColor}`,
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                animation: 'slideIn 0.3s ease-out',
              }}
              onClick={() => onRemove(notification.id)}
            >
              <p style={{ color: styles.textColor, margin: 0 }}>{notification.message}</p>
            </Box>
          );
        })}
      </Stack>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
}
