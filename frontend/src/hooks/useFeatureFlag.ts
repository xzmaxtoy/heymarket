import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFeatureFlag, setLoading, setError } from '@/store/slices/featureFlagsSlice';
import { supabase } from '@/services/supabase';

interface FeatureFlag {
  enabled: boolean;
  percentage: number;
  users: string[];
  conditions: Record<string, any>;
}

export const useFeatureFlag = (flagKey: string) => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(state => state.auth?.user?.id);
  const { flags, isLoading } = useAppSelector(state => state.featureFlags);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        dispatch(setLoading(true));
        // Convert flag key to lowercase and replace underscores with hyphens
        const normalizedKey = flagKey.toLowerCase().replace(/_/g, '-');
        
        const { data, error } = await supabase
          .from('sms_feature_flags')
          .select('*')
          .eq('key', normalizedKey)
          .single();

        if (error) {
          // If flag doesn't exist, create it with default values
          if (error.code === 'PGRST116') {
            const { data: newFlag, error: insertError } = await supabase
              .from('sms_feature_flags')
              .insert([{
                key: normalizedKey,
                enabled: false,
                percentage: 0,
                users: [],
                conditions: {}
              }])
              .select()
              .single();

            if (insertError) throw insertError;
            if (!newFlag) throw new Error('Failed to create feature flag');

            dispatch(setFeatureFlag({ key: flagKey, value: false }));
            return;
          }
          throw error;
        }

        const flag: FeatureFlag = {
          enabled: data.enabled,
          percentage: data.percentage || 100,
          users: data.users || [],
          conditions: data.conditions || {}
        };

        // If flag is disabled, return false
        if (!flag.enabled) {
          dispatch(setFeatureFlag({ key: flagKey, value: false }));
          return;
        }

        // If no user ID, use percentage rollout
        if (!userId) {
          const isEnabled = Math.random() * 100 < flag.percentage;
          dispatch(setFeatureFlag({ key: flagKey, value: isEnabled }));
          return;
        }

        // Check user allowlist
        if (flag.users.includes(userId)) {
          dispatch(setFeatureFlag({ key: flagKey, value: true }));
          return;
        }

        // Use percentage rollout for users not in allowlist
        const isEnabled = Math.random() * 100 < flag.percentage;
        dispatch(setFeatureFlag({ key: flagKey, value: isEnabled }));
      } catch (err) {
        console.error('Error checking feature flag:', err);
        dispatch(setError(err instanceof Error ? err.message : 'Failed to check feature flag'));
        dispatch(setFeatureFlag({ key: flagKey, value: false }));
      } finally {
        dispatch(setLoading(false));
      }
    };

    checkFeatureFlag();
  }, [flagKey, userId, dispatch]);

  return {
    isEnabled: flags[flagKey] || false,
    isLoading
  };
};

export const FEATURE_FLAGS = {
  NEW_BATCH_SYSTEM: 'new-batch-system',
  NEW_PREVIEW_SYSTEM: 'new-preview-system',
  NEW_ANALYTICS: 'new-analytics'
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
