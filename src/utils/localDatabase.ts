/**
 * Local Database Engine (IndexedDB)
 * Runs 100% locally on user machine with offline persistence.
 */

import {
  DatabaseBackup,
  LocalDatabaseStats,
  SavedDataset,
  SavedHistoryItem,
  SavedTemplate,
} from '../types/database';

const DB_NAME = 'ExcelTransformerLocalDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openLocalDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung pada browser ini.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store: history
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id' });
        historyStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Store: templates
      if (!db.objectStoreNames.contains('templates')) {
        const templatesStore = db.createObjectStore('templates', { keyPath: 'id' });
        templatesStore.createIndex('name', 'name', { unique: false });
        templatesStore.createIndex('category', 'category', { unique: false });
      }

      // Store: datasets
      if (!db.objectStoreNames.contains('datasets')) {
        const datasetsStore = db.createObjectStore('datasets', { keyPath: 'id' });
        datasetsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ----------------------------------------------------
// HISTORY CRUD
// ----------------------------------------------------

export async function saveHistoryItem(item: Omit<SavedHistoryItem, 'id' | 'createdAt'>): Promise<SavedHistoryItem> {
  const db = await openLocalDB();
  const fullItem: SavedHistoryItem = {
    ...item,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.put(fullItem);

    req.onsuccess = () => resolve(fullItem);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllHistory(): Promise<SavedHistoryItem[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as SavedHistoryItem[]) || [];
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllHistory(): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------------------------------------------
// TEMPLATES CRUD
// ----------------------------------------------------

export async function saveCustomTemplate(
  template: Omit<SavedTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedTemplate> {
  const db = await openLocalDB();
  const now = new Date().toISOString();
  const fullTemplate: SavedTemplate = {
    ...template,
    id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const req = store.put(fullTemplate);

    req.onsuccess = () => resolve(fullTemplate);
    req.onerror = () => reject(req.error);
  });
}

export async function updateCustomTemplate(template: SavedTemplate): Promise<void> {
  const db = await openLocalDB();
  const updated = {
    ...template,
    updatedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const req = store.put(updated);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTemplates(): Promise<SavedTemplate[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readonly');
    const store = tx.objectStore('templates');
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as SavedTemplate[]) || [];
      items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------------------------------------------
// DATASETS CRUD
// ----------------------------------------------------

export async function saveDataset(
  dataset: Omit<SavedDataset, 'id' | 'createdAt'>
): Promise<SavedDataset> {
  const db = await openLocalDB();
  const fullDataset: SavedDataset = {
    ...dataset,
    id: `ds_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readwrite');
    const store = tx.objectStore('datasets');
    const req = store.put(fullDataset);

    req.onsuccess = () => resolve(fullDataset);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllDatasets(): Promise<SavedDataset[]> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readonly');
    const store = tx.objectStore('datasets');
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as SavedDataset[]) || [];
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteDataset(id: string): Promise<void> {
  const db = await openLocalDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('datasets', 'readwrite');
    const store = tx.objectStore('datasets');
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ----------------------------------------------------
// DATABASE STATS & BACKUP
// ----------------------------------------------------

export async function getLocalDatabaseStats(): Promise<LocalDatabaseStats> {
  const history = await getAllHistory();
  const templates = await getAllTemplates();
  const datasets = await getAllDatasets();

  const str = JSON.stringify({ history, templates, datasets });
  const estimatedSizeBytes = new Blob([str]).size;

  return {
    historyCount: history.length,
    templateCount: templates.length,
    datasetCount: datasets.length,
    estimatedSizeBytes,
    lastUpdated: new Date().toISOString(),
  };
}

export async function exportDatabaseBackup(): Promise<void> {
  const history = await getAllHistory();
  const templates = await getAllTemplates();
  const datasets = await getAllDatasets();

  const backup: DatabaseBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    history,
    templates,
    datasets,
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `Backup_Database_Lokal_Excel_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseBackup(backup: DatabaseBackup): Promise<{ importedHistory: number; importedTemplates: number; importedDatasets: number }> {
  const db = await openLocalDB();

  let importedHistory = 0;
  let importedTemplates = 0;
  let importedDatasets = 0;

  if (backup.history && backup.history.length > 0) {
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    for (const item of backup.history) {
      store.put(item);
      importedHistory++;
    }
  }

  if (backup.templates && backup.templates.length > 0) {
    const tx = db.transaction('templates', 'readwrite');
    const store = tx.objectStore('templates');
    for (const item of backup.templates) {
      store.put(item);
      importedTemplates++;
    }
  }

  if (backup.datasets && backup.datasets.length > 0) {
    const tx = db.transaction('datasets', 'readwrite');
    const store = tx.objectStore('datasets');
    for (const item of backup.datasets) {
      store.put(item);
      importedDatasets++;
    }
  }

  return { importedHistory, importedTemplates, importedDatasets };
}

export async function clearEntireLocalDatabase(): Promise<void> {
  const db = await openLocalDB();
  const storeNames = ['history', 'templates', 'datasets'];
  for (const name of storeNames) {
    const tx = db.transaction(name, 'readwrite');
    tx.objectStore(name).clear();
  }
}
