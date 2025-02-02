import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { templatesSlice } from '@/store/slices/templatesSlice';
import { subscribeToTemplates } from '@/services/supabase';
import { Template } from '../types';

export const useTemplateSubscription = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Subscribe to template changes
    const unsubscribe = subscribeToTemplates((payload) => {
      const { eventType, new: newTemplate, old: oldTemplate } = payload;
      
      // Convert Supabase payload to our Template type
      const template: Template = {
        id: newTemplate?.id || oldTemplate?.id,
        name: newTemplate?.name || oldTemplate?.name,
        content: newTemplate?.content || oldTemplate?.content,
        description: newTemplate?.description,
        variables: newTemplate?.variables || oldTemplate?.variables || [],
        created_at: newTemplate?.created_at || oldTemplate?.created_at,
        updated_at: newTemplate?.updated_at || oldTemplate?.updated_at,
      };

      // Dispatch change to Redux store
      dispatch(templatesSlice.actions.handleTemplateChange({
        template,
        eventType,
      }));
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [dispatch]);
};

export default useTemplateSubscription;
