import React, { useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotifications, hideNotification } from '@/store/slices/notificationsSlice';

const Notifications: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  useEffect(() => {
    notifications.forEach(notification => {
      const timer = setTimeout(() => {
        dispatch(hideNotification(notification.id));
      }, notification.duration);

      return () => clearTimeout(timer);
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          onClose={() => dispatch(hideNotification(notification.id))}
        >
          <Alert
            onClose={() => dispatch(hideNotification(notification.id))}
            severity={notification.type}
            sx={{ width: '100%' }}
            elevation={6}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default Notifications;
