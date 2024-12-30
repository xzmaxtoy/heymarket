import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), 'cache');
const TEMPLATES_FILE = 'templates.json';

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.access(CACHE_DIR);
  } catch {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  }
}

// Get templates file path
function getTemplatesFile() {
  return path.join(CACHE_DIR, TEMPLATES_FILE);
}

// Load all templates
export async function loadTemplates() {
  try {
    await ensureCacheDir();
    const templatesFile = getTemplatesFile();
    
    try {
      const data = await fs.readFile(templatesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, return empty object
        return {};
      }
      throw error;
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    return {};
  }
}

// Save all templates
export async function saveTemplates(templates) {
  try {
    await ensureCacheDir();
    const templatesFile = getTemplatesFile();
    await fs.writeFile(templatesFile, JSON.stringify(templates, null, 2));
  } catch (error) {
    console.error('Error saving templates:', error);
    throw error;
  }
}

// Get single template
export async function getTemplate(id) {
  const templates = await loadTemplates();
  return templates[id] || null;
}

// Save single template
export async function saveTemplate(id, template) {
  const templates = await loadTemplates();
  templates[id] = template;
  await saveTemplates(templates);
}

// Delete template
export async function deleteTemplate(id) {
  const templates = await loadTemplates();
  if (!templates[id]) {
    return false;
  }
  delete templates[id];
  await saveTemplates(templates);
  return true;
}
