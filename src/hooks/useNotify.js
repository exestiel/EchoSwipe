import { useState, useCallback } from 'react';

/**
 * useNotify hook for managing toast notifications
 * @returns {Object} Object with notify function and notifications array
 */
export function useNotify() {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, options = {}) => {
    const {
      type = 'info', // 'success', 'error', 'warning', 'info'
      duration = 5000,
      id = Date.now() + Math.random(),
    } = options;

    const notification = {
      id,
      message,
      type,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notify,
    removeNotification,
    clearAll,
    notifications,
  };
}
