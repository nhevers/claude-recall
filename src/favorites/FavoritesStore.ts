/**
 * Favorites Store
 * 
 * Persistent storage for favorited observations.
 */

export interface FavoriteItem {
  observationId: number;
  note?: string;
  createdAt: number;
}

export interface FavoritesStoreOptions {
  storageKey?: string;
  maxItems?: number;
}

export class FavoritesStore {
  private favorites: Map<number, FavoriteItem> = new Map();
  private options: FavoritesStoreOptions;

  constructor(options: FavoritesStoreOptions = {}) {
    this.options = {
      storageKey: 'claude-recall-favorites',
      maxItems: 1000,
      ...options,
    };

    this.load();
  }

  /**
   * Add an observation to favorites
   */
  add(observationId: number, note?: string): FavoriteItem {
    const item: FavoriteItem = {
      observationId,
      note,
      createdAt: Date.now(),
    };

    this.favorites.set(observationId, item);
    this.enforceLimit();
    this.save();

    return item;
  }

  /**
   * Remove an observation from favorites
   */
  remove(observationId: number): boolean {
    const existed = this.favorites.delete(observationId);
    if (existed) {
      this.save();
    }
    return existed;
  }

  /**
   * Check if an observation is favorited
   */
  isFavorite(observationId: number): boolean {
    return this.favorites.has(observationId);
  }

  /**
   * Toggle favorite status
   */
  toggle(observationId: number, note?: string): boolean {
    if (this.isFavorite(observationId)) {
      this.remove(observationId);
      return false;
    } else {
      this.add(observationId, note);
      return true;
    }
  }

  /**
   * Get a favorite item
   */
  get(observationId: number): FavoriteItem | undefined {
    return this.favorites.get(observationId);
  }

  /**
   * Get all favorites
   */
  getAll(): FavoriteItem[] {
    return Array.from(this.favorites.values());
  }

  /**
   * Get all favorite observation IDs
   */
  getAllIds(): number[] {
    return Array.from(this.favorites.keys());
  }

  /**
   * Get favorites count
   */
  count(): number {
    return this.favorites.size;
  }

  /**
   * Update note for a favorite
   */
  updateNote(observationId: number, note: string): boolean {
    const item = this.favorites.get(observationId);
    if (item) {
      item.note = note;
      this.save();
      return true;
    }
    return false;
  }

  /**
   * Get favorites sorted by date (newest first)
   */
  getSortedByDate(): FavoriteItem[] {
    return this.getAll().sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Search favorites by note
   */
  searchByNote(query: string): FavoriteItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(item => 
      item.note?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all favorites
   */
  clear(): void {
    this.favorites.clear();
    this.save();
  }

  /**
   * Export favorites data
   */
  export(): FavoriteItem[] {
    return this.getAll();
  }

  /**
   * Import favorites data
   */
  import(items: FavoriteItem[]): void {
    for (const item of items) {
      this.favorites.set(item.observationId, item);
    }
    this.enforceLimit();
    this.save();
  }

  private load(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = localStorage.getItem(this.options.storageKey!);
      if (data) {
        const items: FavoriteItem[] = JSON.parse(data);
        for (const item of items) {
          this.favorites.set(item.observationId, item);
        }
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  private save(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = JSON.stringify(this.getAll());
      localStorage.setItem(this.options.storageKey!, data);
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }

  private enforceLimit(): void {
    if (this.favorites.size <= this.options.maxItems!) return;

    // Remove oldest items
    const sorted = this.getSortedByDate();
    const toRemove = sorted.slice(this.options.maxItems!);
    
    for (const item of toRemove) {
      this.favorites.delete(item.observationId);
    }
  }
}

// Singleton instance
let instance: FavoritesStore | null = null;

export function getFavoritesStore(options?: FavoritesStoreOptions): FavoritesStore {
  if (!instance) {
    instance = new FavoritesStore(options);
  }
  return instance;
}
