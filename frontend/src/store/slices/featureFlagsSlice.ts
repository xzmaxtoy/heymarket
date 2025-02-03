import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FeatureFlagsState {
  flags: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
}

const initialState: FeatureFlagsState = {
  flags: {
    'new-batch-system': false,
    'new-preview-system': false,
    'new-analytics': false,
  },
  isLoading: false,
  error: null,
};

const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    setFeatureFlag(state, action: PayloadAction<{ key: string; value: boolean }>) {
      state.flags[action.payload.key] = action.payload.value;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const { setFeatureFlag, setLoading, setError } = featureFlagsSlice.actions;
export default featureFlagsSlice.reducer;
