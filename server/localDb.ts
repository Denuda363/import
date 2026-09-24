import fs from 'fs';
import path from 'path';

const DB_FILE_PATH = path.resolve(process.cwd(), 'local_database.json');

interface LocalServerDatabase {
  history: any[];
  templates: any[];
  datasets: any[];
  metadata: {
    created: string;
    version: number;
  };
}

function loadDatabase(): LocalServerDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading local_database.json:', err);
  }

  const initialDb: LocalServerDatabase = {
    history: [],
    templates: [],
    datasets: [],
    metadata: {
      created: new Date().toISOString(),
      version: 1,
    },
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: LocalServerDatabase): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local_database.json:', err);
  }
}

export function getServerDbHistory(): any[] {
  const db = loadDatabase();
  return db.history;
}

export function addServerDbHistory(item: any): any {
  const db = loadDatabase();
  const newItem = {
    ...item,
    id: `hist_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  db.history.unshift(newItem);
  if (db.history.length > 200) {
    db.history = db.history.slice(0, 200); // Limit to 200 latest
  }
  saveDatabase(db);
  return newItem;
}

export function getServerDbTemplates(): any[] {
  const db = loadDatabase();
  return db.templates;
}

export function saveServerDbTemplate(template: any): any {
  const db = loadDatabase();
  const newTemplate = {
    ...template,
    id: `tpl_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.templates.unshift(newTemplate);
  saveDatabase(db);
  return newTemplate;
}

export function getServerDbStats(): any {
  const db = loadDatabase();
  const stats = fs.existsSync(DB_FILE_PATH) ? fs.statSync(DB_FILE_PATH) : null;
  return {
    historyCount: db.history.length,
    templateCount: db.templates.length,
    datasetCount: db.datasets.length,
    fileSizeBytes: stats ? stats.size : 0,
    filePath: DB_FILE_PATH,
    lastModified: stats ? stats.mtime.toISOString() : new Date().toISOString(),
  };
}
