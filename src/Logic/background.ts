import { DiscountApiService } from '../services/discountApi';
import { StorageService } from '../services/storage';

console.log('[MyTrips Background Worker] Initialized for Mozilla WebExtensions / Chrome MV3');

// Listen for extension installation or update
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[MyTrips] Extension installed successfully.');
  });

  // Listen for tab URL updates to check for available discounts on travel sites
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
      const discounts = await DiscountApiService.getDiscountsForDomain(tab.url);

      if (discounts.length > 0) {
        // Cache found discounts
        await StorageService.setCachedDiscounts(discounts);

        // Update badge text on extension icon (e.g. "PROMO" or "3")
        if (chrome.action && chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ tabId, text: `${discounts.length}` });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#16a34a' }); // Green badge
        }

        // Notify content script on the page
        try {
          chrome.tabs.sendMessage(tabId, {
            type: 'MYTRIPS_DISCOUNTS_FOUND',
            discounts: discounts,
          });
        } catch {
          // Content script might not be injected on this page yet
        }
      } else {
        if (chrome.action && chrome.action.setBadgeText) {
          chrome.action.setBadgeText({ tabId, text: '' });
        }
      }
    }
  });

  // Handle messages from Popup or Content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_DISCOUNTS_FOR_TAB') {
      const tabUrl = message.url;
      DiscountApiService.getDiscountsForDomain(tabUrl).then((discounts) => {
        sendResponse({ discounts });
      });
      return true; // Asynchronous response
    }
  });
}
