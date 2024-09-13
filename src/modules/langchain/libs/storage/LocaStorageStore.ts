import { BaseStore } from "@langchain/core/stores";

export class LocalStorageStore<T = any> extends BaseStore<string, T> {
  lc_namespace: string[] = [];
  
  /**
   * Helper function to check if a key has expired.
   * @param {string} key - The key to check.
   * @returns {boolean} - True if the key has expired, false otherwise.
   */
  private isExpired(key: string): boolean {
      const item = localStorage.getItem(key);
      if (!item) return true;

      try {
          const data = JSON.parse(item);
          if (!data.expiresAt || data.expiresAt > Date.now()) {
              return false;
          }
      } catch (e) {
          return true;
      }

      // Key has expired, remove it.
      localStorage.removeItem(key);
      return true;
  }

  /**
   * Retrieves the values associated with the given keys from localStorage.
   * @param {string[]} keys - Keys to retrieve values for.
   * @returns {Promise<T[]>} - Promise that resolves with an array of values.
   */
  async mget(keys: string[]): Promise<(T | undefined)[]> {
      return keys.map((key) => {
          if (this.isExpired(key)) return undefined;
          
          const item = localStorage.getItem(key);
          if (!item) return undefined;

          try {
              const data = JSON.parse(item);
              return data.value;
          } catch (e) {
              return undefined;
          }
      });
  }

  /**
   * Sets the values for the given keys in localStorage.
   * @param {[string, T][]} keyValuePairs - Array of key-value pairs to set.
   * @param {number} [expiration] - Optional expiration time in milliseconds.
   * @returns {Promise<void>} - Promise that resolves when all key-value pairs have been set.
   */
  async mset(keyValuePairs: [string, T][], expiration?: number): Promise<void> {
      keyValuePairs.forEach(([key, value]) => {
          const expiresAt = expiration ? Date.now() + expiration : null;
          const data = { value, expiresAt };
          localStorage.setItem(key, JSON.stringify(data));
      });
  }

  /**
   * Deletes the given keys and their associated values from localStorage.
   * @param {string[]} keys - Keys to delete from the store.
   * @returns {Promise<void>} - Promise that resolves when all keys have been deleted.
   */
  async mdelete(keys: string[]): Promise<void> {
      keys.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Asynchronous generator that yields keys from localStorage.
   * If a prefix is provided, it only yields keys that start with the prefix.
   * @param {string} [prefix] - Optional prefix to filter keys.
   * @returns {AsyncGenerator<string>} - Async generator that yields keys.
   */
  async *yieldKeys(prefix?: string): AsyncGenerator<string> {
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (!prefix || key.startsWith(prefix))) {
              if (!this.isExpired(key)) {
                  yield key;
              }
          }
      }
  }
}