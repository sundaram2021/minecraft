// World Persistence Engine using IndexedDB with JSON Export/Import and Sparse Delta Block Storage

export class WorldStorage {
  constructor() {
    this.dbName = 'MinecraftVoxelDB';
    this.dbVersion = 1;
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('saves')) {
          db.createObjectStore('saves', { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB failed to open, using memory fallback', e);
        resolve(null);
      };
    });
  }

  // Save current game state
  async saveWorld(saveId, worldData) {
    await this.initPromise;
    if (!this.db) {
      localStorage.setItem(`mc_save_${saveId}`, JSON.stringify(worldData));
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('saves', 'readwrite');
        const store = tx.objectStore('saves');
        const record = {
          id: saveId,
          timestamp: Date.now(),
          ...worldData,
        };
        store.put(record);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        console.warn('Save error', err);
        resolve(false);
      }
    });
  }

  // Load game state
  async loadWorld(saveId) {
    await this.initPromise;
    if (!this.db) {
      const raw = localStorage.getItem(`mc_save_${saveId}`);
      return raw ? JSON.parse(raw) : null;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction('saves', 'readonly');
        const store = tx.objectStore('saves');
        const req = store.get(saveId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      } catch (err) {
        console.warn('Load error', err);
        resolve(null);
      }
    });
  }

  // Export current world to a downloadable JSON file
  exportToJson(worldData, fileName = 'minecraft_world.json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(worldData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Import world from JSON file string
  importFromJson(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (e) {
      console.error('Failed to parse world JSON', e);
      return null;
    }
  }
}

export const worldStorage = new WorldStorage();
