import fs from 'fs';
import path from 'path';

type FormField = { 
  id?: string; 
  name?: string; 
  type?: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  label?: string;
  position?: number;
  displayName?: string;
  elementId?: string;
  formId?: string;
  fieldName?: string;
  formName?: string;
  pageUrl?: string;
  options?: string[];
};

type FormMeta = { 
  id?: string; 
  name?: string; 
  fields: FormField[];
  // Global form detection fields
  formId?: string;
  siteId?: string;
  url?: string;
  title?: string;
  formElement?: {
    id?: string;
    name?: string;
    action?: string;
    method?: string;
    className?: string;
    enctype?: string;
  };
  detectedAt?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  submissionData?: Record<string, any>;
  submittedAt?: string;
  event?: string;
};

const formsStore = new Map<string, FormMeta[]>();
const FORMS_FILE = path.join(process.cwd(), 'forms-data.json');

// Load forms from file on startup
function loadFormsFromFile() {
  try {
    if (fs.existsSync(FORMS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FORMS_FILE, 'utf8'));
      Object.entries(data).forEach(([siteId, forms]) => {
        formsStore.set(siteId, forms as FormMeta[]);
      });
      console.log(`Loaded forms for ${Object.keys(data).length} sites from file`);
    }
  } catch (error) {
    console.error('Error loading forms from file:', error);
  }
}

// Save forms to file
function saveFormsToFile() {
  try {
    const data = Object.fromEntries(formsStore);
    fs.writeFileSync(FORMS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving forms to file:', error);
  }
}

// Load forms on startup
loadFormsFromFile();

export function saveFormsForSite(siteId: string, forms: FormMeta[]) {
  console.log(`[FormsStore] Saving ${forms.length} forms for site ${siteId}`);
  
  const existingForms = formsStore.get(siteId) || [];
  
  // Merge with existing forms, updating duplicates
  const mergedForms = [...existingForms];
  
  forms.forEach(newForm => {
    const existingIndex = mergedForms.findIndex(f => 
      f.formId === newForm.formId || 
      f.id === newForm.id ||
      (f.formElement?.id === newForm.formElement?.id && f.formElement?.id)
    );
    
    if (existingIndex >= 0) {
      // Update existing form
      mergedForms[existingIndex] = { ...mergedForms[existingIndex], ...newForm };
    } else {
      // Add new form
      mergedForms.push(newForm);
    }
  });
  
  formsStore.set(siteId, mergedForms);
  saveFormsToFile();
  
  console.log(`[FormsStore] Now have ${mergedForms.length} forms for site ${siteId}`);
}

export function getFormsForSite(siteId: string) {
  return formsStore.get(siteId) ?? [];
}

export function clearFormsForSite(siteId: string) {
  formsStore.delete(siteId);
  saveFormsToFile();
}

export default formsStore;
