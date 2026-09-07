import { Trip, ExtensionSettings, DiscountCode } from '../types/trip';

const TRIPS_KEY = 'mytrips_data_trips';
const SETTINGS_KEY = 'mytrips_data_settings';
const CACHED_DISCOUNTS_KEY = 'mytrips_cached_discounts';

// Default initial settings
const DEFAULT_SETTINGS: ExtensionSettings = {
  autoApplyDiscounts: true,
  preferredCurrency: 'EUR',
  partnerTagId: '774783',
  activeTripId: null,
};

// Storage helper wrapping browser/chrome extension storage with Promises
export class StorageService {
  /**
   * Get all user trips
   */
  static async getTrips(): Promise<Trip[]> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([TRIPS_KEY], (result) => {
          const trips = result[TRIPS_KEY] as Trip[] | undefined;
          resolve(trips && Array.isArray(trips) ? trips : []);
        });
      } else {
        const localData = localStorage.getItem(TRIPS_KEY);
        resolve(localData ? JSON.parse(localData) : []);
      }
    });
  }

  /**
   * Save all trips
   */
  static async saveTrips(trips: Trip[]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [TRIPS_KEY]: trips }, () => resolve());
      } else {
        localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
        resolve();
      }
    });
  }

  /**
   * Add a new trip or update an existing one
   */
  static async saveTrip(trip: Trip): Promise<Trip[]> {
    const trips = await this.getTrips();
    const existingIndex = trips.findIndex((t) => t.id === trip.id);

    if (existingIndex >= 0) {
      trips[existingIndex] = trip;
    } else {
      trips.push(trip);
    }

    await this.saveTrips(trips);
    return trips;
  }

  /**
   * Get extension settings
   */
  static async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([SETTINGS_KEY], (result) => {
          const settings = result[SETTINGS_KEY] as ExtensionSettings | undefined;
          resolve(settings || DEFAULT_SETTINGS);
        });
      } else {
        const localData = localStorage.getItem(SETTINGS_KEY);
        resolve(localData ? JSON.parse(localData) : DEFAULT_SETTINGS);
      }
    });
  }

  /**
   * Update extension settings
   */
  static async updateSettings(settings: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
    const currentSettings = await this.getSettings();
    const updated = { ...currentSettings, ...settings };

    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [SETTINGS_KEY]: updated }, () => resolve(updated));
      } else {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        resolve(updated);
      }
    });
  }

  /**
   * Cache fetched 3rd-party discount codes
   */
  static async setCachedDiscounts(discounts: DiscountCode[]): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ [CACHED_DISCOUNTS_KEY]: discounts }, () => resolve());
      } else {
        localStorage.setItem(CACHED_DISCOUNTS_KEY, JSON.stringify(discounts));
        resolve();
      }
    });
  }

  /**
   * Get cached discount codes
   */
  static async getCachedDiscounts(): Promise<DiscountCode[]> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get([CACHED_DISCOUNTS_KEY], (result) => {
          const discounts = result[CACHED_DISCOUNTS_KEY] as DiscountCode[] | undefined;
          resolve(discounts && Array.isArray(discounts) ? discounts : []);
        });
      } else {
        const localData = localStorage.getItem(CACHED_DISCOUNTS_KEY);
        resolve(localData ? JSON.parse(localData) : []);
      }
    });
  }
}
