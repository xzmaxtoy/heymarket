import fs from 'fs/promises';
import path from 'path';

// Use Azure's temp directory in production, local cache directory in development
const CACHE_DIR = process.env.NODE_ENV === 'production' 
  ? path.join(process.env.TEMP || '/tmp', 'heymarket-cache')
  : path.join(process.cwd(), 'cache');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Generate cache key for date range
function getCacheKey(startDate, endDate) {
  return `messages_${startDate}_${endDate}.json`;
}

// Check if date is in the past
function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

// Get cached data if it exists and is valid
export async function getCachedData(startDate, endDate) {
  if (!isPastDate(endDate)) {
    return null;
  }

  try {
    await ensureCacheDir();
    const cacheFile = path.join(CACHE_DIR, getCacheKey(startDate, endDate));
    
    const data = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    
    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_TTL) {
      await fs.unlink(cacheFile); // Delete expired cache
      return null;
    }
    
    return data.content;
  } catch (error) {
    console.error('Cache read error:', {
      error: error.message,
      code: error.code,
      startDate,
      endDate,
      cacheDir: CACHE_DIR,
      timestamp: new Date().toISOString()
    });
    return null; // Return null if cache doesn't exist or is invalid
  }
}

// Save data to cache
export async function setCachedData(startDate, endDate, data) {
  if (!isPastDate(endDate)) {
    return;
  }

  try {
    await ensureCacheDir();
    const cacheFile = path.join(CACHE_DIR, getCacheKey(startDate, endDate));
    
    const cacheData = {
      timestamp: Date.now(),
      content: data
    };
    
    await fs.writeFile(cacheFile, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Cache write error:', {
      error: error.message,
      code: error.code,
      startDate,
      endDate,
      cacheDir: CACHE_DIR,
      timestamp: new Date().toISOString()
    });
    // Continue even if caching fails
  }
}
