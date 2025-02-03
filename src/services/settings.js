import { supabase } from './supabase.js';

class SettingsService {
  constructor() {
    this.settings = new Map();
    this.featureFlags = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.lastFetch = 0;
  }

  /**
   * Initialize settings and feature flags
   */
  async init() {
    await this.loadSettings();
    await this.loadFeatureFlags();
  }

  /**
   * Load settings from Supabase
   */
  async loadSettings() {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      this.settings.clear();
      data.forEach(setting => {
        this.settings.set(setting.key, setting.value);
      });

      this.lastFetch = Date.now();
    } catch (error) {
      console.error('Error loading settings:', error);
      throw error;
    }
  }

  /**
   * Load feature flags from Supabase
   */
  async loadFeatureFlags() {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');

      if (error) throw error;

      this.featureFlags.clear();
      data.forEach(flag => {
        this.featureFlags.set(flag.key, {
          enabled: flag.enabled,
          percentage: flag.percentage || 100,
          users: flag.users || [],
          conditions: flag.conditions || {}
        });
      });
    } catch (error) {
      console.error('Error loading feature flags:', error);
      throw error;
    }
  }

  /**
   * Get a setting value
   */
  getSetting(key, defaultValue = null) {
    // Reload if cache expired
    if (Date.now() - this.lastFetch > this.CACHE_TTL) {
      this.loadSettings().catch(console.error);
    }
    return this.settings.get(key) ?? defaultValue;
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  isFeatureEnabled(flagKey, userId = null) {
    const flag = this.featureFlags.get(flagKey);
    if (!flag) return false;

    // If flag is disabled, return false
    if (!flag.enabled) return false;

    // If no user ID, use percentage rollout
    if (!userId) {
      return Math.random() * 100 < flag.percentage;
    }

    // Check user allowlist
    if (flag.users.includes(userId)) return true;

    // Check conditions
    if (flag.conditions) {
      // Add condition checks here based on your needs
      // Example: check user role, account type, etc.
    }

    // Use percentage rollout for users not in allowlist
    return Math.random() * 100 < flag.percentage;
  }

  /**
   * Update a feature flag
   */
  async updateFeatureFlag(key, updates) {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('key', key);

      if (error) throw error;

      // Reload flags
      await this.loadFeatureFlags();
    } catch (error) {
      console.error('Error updating feature flag:', error);
      throw error;
    }
  }

  /**
   * Get all feature flags
   */
  getFeatureFlags() {
    return Array.from(this.featureFlags.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }
}

export const settingsService = new SettingsService();

// Initialize settings on import
settingsService.init().catch(console.error);
