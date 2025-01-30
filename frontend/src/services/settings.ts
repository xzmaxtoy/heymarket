import { supabase } from './supabase';

const COLUMN_VISIBILITY_KEY = 'sms_column_visibility';
const SAVED_FILTERS_KEY = 'sms_saved_filters';

export interface ColumnVisibilitySettings {
  selectedColumns: string[];
  lastUpdated: string;
}

export const settingsService = {
  async getColumnVisibility(): Promise<ColumnVisibilitySettings | null> {
    try {
      console.log('Fetching column visibility settings...');
      const { data, error } = await supabase
        .from('sms_app_settings')
        .select('value')
        .eq('key', COLUMN_VISIBILITY_KEY)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No column visibility settings found, will create on first save');
          return null;
        }
        console.error('Error fetching column visibility:', error);
        return null;
      }

      console.log('Retrieved column visibility settings:', data?.value);
      return data?.value as ColumnVisibilitySettings;
    } catch (error) {
      console.error('Error in getColumnVisibility:', error);
      return null;
    }
  },

  async saveColumnVisibility(columns: string[]): Promise<boolean> {
    try {
      console.log('Saving column visibility:', columns);
      const settings: ColumnVisibilitySettings = {
        selectedColumns: columns,
        lastUpdated: new Date().toISOString()
      };

      // First try to update
      const { data: existingData, error: checkError } = await supabase
        .from('sms_app_settings')
        .select('key')
        .eq('key', COLUMN_VISIBILITY_KEY)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing settings:', checkError);
        return false;
      }

      let result;
      if (!existingData) {
        // Insert new record
        console.log('Inserting new column visibility settings');
        result = await supabase
          .from('sms_app_settings')
          .insert({
            key: COLUMN_VISIBILITY_KEY,
            value: settings
          });
      } else {
        // Update existing record
        console.log('Updating existing column visibility settings');
        result = await supabase
          .from('sms_app_settings')
          .update({ value: settings })
          .eq('key', COLUMN_VISIBILITY_KEY);
      }

      if (result.error) {
        console.error('Error saving column visibility:', result.error);
        return false;
      }

      console.log('Column visibility saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveColumnVisibility:', error);
      return false;
    }
  },

  async getSavedFilters(): Promise<any[]> {
    try {
      console.log('Fetching saved filters...');
      const { data, error } = await supabase
        .from('sms_app_settings')
        .select('value')
        .eq('key', SAVED_FILTERS_KEY)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No saved filters found');
          return [];
        }
        console.error('Error fetching saved filters:', error);
        return [];
      }

      console.log('Retrieved saved filters:', data?.value?.filters);
      return data?.value?.filters || [];
    } catch (error) {
      console.error('Error in getSavedFilters:', error);
      return [];
    }
  },

  async saveSavedFilters(filters: any[]): Promise<boolean> {
    try {
      console.log('Saving filters:', filters);
      const settings = {
        filters,
        lastUpdated: new Date().toISOString()
      };

      // First try to update
      const { data: existingData, error: checkError } = await supabase
        .from('sms_app_settings')
        .select('key')
        .eq('key', SAVED_FILTERS_KEY)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing filters:', checkError);
        return false;
      }

      let result;
      if (!existingData) {
        // Insert new record
        console.log('Inserting new saved filters');
        result = await supabase
          .from('sms_app_settings')
          .insert({
            key: SAVED_FILTERS_KEY,
            value: settings
          });
      } else {
        // Update existing record
        console.log('Updating existing saved filters');
        result = await supabase
          .from('sms_app_settings')
          .update({ value: settings })
          .eq('key', SAVED_FILTERS_KEY);
      }

      if (result.error) {
        console.error('Error saving filters:', result.error);
        return false;
      }

      console.log('Filters saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveSavedFilters:', error);
      return false;
    }
  }
};