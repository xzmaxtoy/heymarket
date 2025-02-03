import { supabase } from '../../services/supabase.js';

class BatchPreview {
  constructor() {
    this.previewCache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get preview for a batch
   */
  async getPreview(batchId, previewCount = 5) {
    try {
      // Check cache first
      const cached = this.getCachedPreview(batchId);
      if (cached) {
        return cached;
      }

      // Load batch with template and messages
      const { data: batch, error: batchError } = await supabase
        .from('sms_batches')
        .select(`
          *,
          template:templates(*),
          logs:sms_batch_log(*)
        `)
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;

      // Get sample messages
      const { data: messages, error: messagesError } = await supabase
        .from('sms_batch_log')
        .select('*')
        .eq('batch_id', batchId)
        .limit(previewCount);

      if (messagesError) throw messagesError;

      // Generate previews
      const previews = messages.map(msg => ({
        phoneNumber: msg.targets,
        content: this.generatePreviewContent(batch.template, msg.variables),
        variables: msg.variables
      }));

      // Cache the result
      this.cachePreview(batchId, {
        template: batch.template,
        messages: previews
      });

      return {
        template: batch.template,
        messages: previews
      };
    } catch (error) {
      console.error('Error getting preview:', error);
      throw new Error(`Failed to get preview: ${error.message}`);
    }
  }

  /**
   * Generate preview content by substituting variables
   */
  generatePreviewContent(template, variables) {
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return content;
  }

  /**
   * Get cached preview if valid
   */
  getCachedPreview(batchId) {
    const cached = this.previewCache.get(batchId);
    if (!cached) return null;

    const { timestamp, data } = cached;
    if (Date.now() - timestamp > this.CACHE_TTL) {
      this.previewCache.delete(batchId);
      return null;
    }

    return data;
  }

  /**
   * Cache preview data
   */
  cachePreview(batchId, data) {
    this.previewCache.set(batchId, {
      timestamp: Date.now(),
      data
    });

    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  cleanupCache() {
    const now = Date.now();
    for (const [batchId, cached] of this.previewCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.previewCache.delete(batchId);
      }
    }
  }

  /**
   * Clear preview cache for a batch
   */
  clearCache(batchId) {
    if (batchId) {
      this.previewCache.delete(batchId);
    } else {
      this.previewCache.clear();
    }
  }

  /**
   * Get preview cache stats
   */
  getCacheStats() {
    return {
      size: this.previewCache.size,
      ttl: this.CACHE_TTL,
      entries: Array.from(this.previewCache.entries()).map(([batchId, cached]) => ({
        batchId,
        age: Date.now() - cached.timestamp
      }))
    };
  }
}

export const batchPreview = new BatchPreview();
