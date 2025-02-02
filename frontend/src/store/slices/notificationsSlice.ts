import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationsState {
  notifications: Notification[];
}

const initialState: NotificationsState = {
  notifications: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    showNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = crypto.randomUUID();
      state.notifications.push({
        ...action.payload,
        id,
        duration: action.payload.duration || 3000,
      });
    },
    hideNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  showNotification,
  hideNotification,
  clearNotifications,
} = notificationsSlice.actions;

export const selectNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.notifications;

export default notificationsSlice.reducer;
