import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { formatPhoneNumber } from './messageHistory.js';
import config from '../config/config.js';

// Use Azure's persistent storage path if available
const CACHE_DIR = process.env.WEBSITE_CONTENTSHARE 
  ? path.join('/home/site/wwwroot', 'data')
  : path.join(process.cwd(), 'cache');
const EMPLOYEE_FILE = 'employees.json';
const SYNC_INTERVAL = 3600000; // 1 hour

class EmployeeList {
  constructor() {
    this.employees = new Map();
    this.lastSync = null;
    this.syncInProgress = false;
    
    // Auto-sync every hour
    setInterval(() => this.sync(), SYNC_INTERVAL);
    
    // Initial sync
    this.sync();
  }
  
  // Load employees from cache file
  async loadFromCache() {
    try {
      const cacheFile = path.join(CACHE_DIR, EMPLOYEE_FILE);
      const data = await fs.readFile(cacheFile, 'utf8');
      const cache = JSON.parse(data);
      
      this.employees = new Map(Object.entries(cache.employees));
      this.lastSync = new Date(cache.lastSync);
      
      console.log(`Loaded ${this.employees.size} employees from cache`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading employee cache:', error);
      }
    }
  }
  
  // Save employees to cache file
  async saveToCache() {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const cacheFile = path.join(CACHE_DIR, EMPLOYEE_FILE);
      
      const cache = {
        lastSync: this.lastSync.toISOString(),
        employees: Object.fromEntries(this.employees)
      };
      
      await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
      console.log(`Saved ${this.employees.size} employees to cache`);
    } catch (error) {
      console.error('Error saving employee cache:', error);
    }
  }
  
  // Sync with Google Sheet
  async sync() {
    if (this.syncInProgress) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // Load from cache first
      if (!this.lastSync) {
        await this.loadFromCache();
      }
      
      // Fetch latest CSV
      const response = await axios.get(config.employeeListUrl);
      const csv = response.data;
      
      // Parse CSV
      const records = parse(csv, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Update employee map
      const newEmployees = new Map();
      
      for (const record of records) {
        const phoneNumber = record['全职工'];
        const status = record['状态'];
        
        // Only process active employees with phone numbers
        if (phoneNumber && status === '在职') {
          try {
            const phone = formatPhoneNumber(phoneNumber);
            newEmployees.set(phone, {
              name: record['英文名'] || '',
              store: record['所属公司'] || '',
              employeeId: record['编码'] || '',
              lastUpdated: new Date().toISOString()
            });
          } catch (error) {
            console.warn(`Invalid phone number for employee ${record.英文名}:`, error.message);
          }
        }
      }
      
      this.employees = newEmployees;
      this.lastSync = new Date();
      
      // Save to cache
      await this.saveToCache();
      
      console.log(`Employee list synced: ${this.employees.size} employees`);
    } catch (error) {
      console.error('Error syncing employee list:', error);
      
      // Load from cache as fallback
      if (this.employees.size === 0) {
        await this.loadFromCache();
      }
    } finally {
      this.syncInProgress = false;
    }
  }
  
  // Check if a phone number belongs to an employee
  isEmployee(phoneNumber) {
    try {
      const phone = formatPhoneNumber(phoneNumber);
      return this.employees.has(phone);
    } catch (error) {
      console.error('Error checking employee status:', error);
      return false;
    }
  }
  
  // Get employee details
  getEmployee(phoneNumber) {
    try {
      const phone = formatPhoneNumber(phoneNumber);
      return this.employees.get(phone);
    } catch (error) {
      console.error('Error getting employee details:', error);
      return null;
    }
  }
  
  // Get sync status
  getStatus() {
    return {
      employeeCount: this.employees.size,
      lastSync: this.lastSync,
      syncInProgress: this.syncInProgress,
      healthy: this.lastSync && (Date.now() - this.lastSync.getTime() < SYNC_INTERVAL * 2)
    };
  }
}

// Export singleton instance
export const employeeList = new EmployeeList();
