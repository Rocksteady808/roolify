import fs from 'fs';
import path from 'path';

type DesignElement = {
  id: string;
  name: string;
  type: string;
  selector?: string;
  tagName?: string;
  className?: string;
  isFormField?: boolean;
  source?: 'webflow' | 'dom'; // Track where the element came from
};

type DesignData = {
  siteId: string;
  siteName: string;
  elements: DesignElement[];
  lastUpdated: string;
};

const store = new Map<string, DesignData>();
const DESIGN_FILE = path.join(process.cwd(), 'design-elements.json');

// Load design data from file on startup
function loadDesignData() {
  try {
    if (fs.existsSync(DESIGN_FILE)) {
      const data = fs.readFileSync(DESIGN_FILE, 'utf8');
      const designData = JSON.parse(data);
      for (const [siteId, data] of Object.entries(designData)) {
        store.set(siteId, data as DesignData);
      }
      console.log(`Loaded design data for ${store.size} sites from file`);
    }
  } catch (err) {
    console.error('Failed to load design data:', err);
  }
}

// Save design data to file
function saveDesignData() {
  try {
    const designData: Record<string, DesignData> = {};
    for (const [siteId, data] of store.entries()) {
      designData[siteId] = data;
    }
    fs.writeFileSync(DESIGN_FILE, JSON.stringify(designData, null, 2));
    console.log(`Saved design data for ${store.size} sites to file`);
  } catch (err) {
    console.error('Failed to save design data:', err);
  }
}

// Load data on module initialization
loadDesignData();

export function setDesignData(siteId: string, data: DesignData) {
  store.set(siteId, data);
  saveDesignData();
}

export function getDesignData(siteId: string): DesignData | undefined {
  return store.get(siteId);
}

export function getAllDesignData(): Map<string, DesignData> {
  return store;
}

export default store;
