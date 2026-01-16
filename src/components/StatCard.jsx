import React from 'react';
import { Box, Stack } from '@echo-company/echo-ui';

/**
 * StatCard component for displaying statistics
 */
export function StatCard({ label, value, variant = 'default', subtitle }) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: 'var(--danger-bg)',
          borderColor: 'var(--danger-border)',
          textColor: 'var(--danger-text)',
          labelColor: 'var(--danger-text)',
        };
      case 'success':
        return {
          bg: 'var(--success-bg)',
          borderColor: 'var(--success-border)',
          textColor: 'var(--success-text)',
          labelColor: 'var(--success-text)',
        };
      case 'warning':
        return {
          bg: 'var(--warning-bg)',
          borderColor: 'var(--warning-border)',
          textColor: 'var(--warning-text)',
          labelColor: 'var(--warning-text)',
        };
      case 'info':
        return {
          bg: 'var(--info-bg)',
          borderColor: 'var(--info-border)',
          textColor: 'var(--info-text-contrast)',
          labelColor: 'var(--info-text-contrast)',
        };
      default:
        return {
          bg: 'var(--surface)',
          borderColor: 'var(--border)',
          textColor: 'var(--text)',
          labelColor: 'var(--text-secondary)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Box
      p="lg"
      bg={styles.bg}
      borderRadius="md"
      style={{
        border: `1px solid ${styles.borderColor}`,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Stack spacing="xs">
        <Box>
          <p
            style={{
              color: styles.labelColor,
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </p>
        </Box>
        <Box>
          <p
            style={{
              color: styles.textColor,
              fontSize: 'var(--font-size-xxl)',
              fontWeight: 'var(--font-weight-bold)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
        </Box>
        {subtitle && (
          <Box>
            <p
              style={{
                color: styles.labelColor,
                fontSize: 'var(--font-size-xs)',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
