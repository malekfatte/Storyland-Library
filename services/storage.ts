import { Story } from '../types';

const DB_NAME = 'storyverse_db';
const STORE_NAME = 'stories';
const DB_VERSION = 1;

export class StorageService {
  private static db: IDBDatabase | null = null;

  static async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject("Error opening database");

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // Create object store with 'id' as key path
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
    });
  }

  static async saveStories(stories: Story[]): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      stories.forEach(story => {
        store.put(story);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  static async getAllStories(): Promise<Record<string, Story[]>> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allStories = request.result as Story[];
        const cache: Record<string, Story[]> = {};
        
        // Reconstruct the cache structure "CAT|AGE|LANG" -> Story[]
        allStories.forEach(story => {
          const key = `${story.category}|${story.ageBracket}|${story.language}`;
          if (!cache[key]) cache[key] = [];
          cache[key].push(story);
        });
        
        resolve(cache);
      };
      request.onerror = () => reject(request.error);
    });
  }

  static async clearDatabase(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}