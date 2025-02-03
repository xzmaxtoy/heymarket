import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import customersReducer from './slices/customersSlice';
import templatesReducer from './slices/templatesSlice';
import batchesReducer from './slices/batchesSlice';
import analyticsReducer from './slices/analyticsSlice';
import notificationsReducer from './slices/notificationsSlice';
import authReducer from './slices/authSlice';
import featureFlagsReducer from './slices/featureFlagsSlice';

export const store = configureStore({
  reducer: {
    customers: customersReducer,
    templates: templatesReducer,
    batches: batchesReducer,
    analytics: analyticsReducer,
    notifications: notificationsReducer,
    auth: authReducer,
    featureFlags: featureFlagsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Set objects in the state
        ignoredPaths: ['customers.visibleColumns'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
