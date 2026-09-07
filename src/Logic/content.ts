import { DiscountCode, HotelBooking } from '../types/trip';
import { StorageService } from '../services/storage';

console.log('[MyTrips Content Script] Injected on:', window.location.hostname);

class ContentOverlay {
  private overlayContainer: HTMLElement | null = null;
  private activeDiscounts: DiscountCode[] = [];

  constructor() {
    this.initMessageListener();
    this.checkCurrentPageDiscounts();
  }

  private initMessageListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'MYTRIPS_DISCOUNTS_FOUND') {
          this.activeDiscounts = message.discounts;
          this.renderOverlay();
        }
      });
    }
  }

  private async checkCurrentPageDiscounts() {
    const hostname = window.location.hostname.toLowerCase();
    
    // Default fallback discount for demo on popular travel domains
    if (hostname.includes('trip.com')) {
      this.activeDiscounts = [
        {
          id: 'disc-1',
          code: 'TRIP10OFF',
          merchant: 'Trip.com',
          domain: 'trip.com',
          discountText: '10% OFF',
          description: '10% discount on global hotel bookings',
          affiliateUrl: 'https://www.trip.com/?allianceid=MYTRIPS_PARTNER',
          isVerified: true,
        },
      ];
    } else if (hostname.includes('cheapoair.com')) {
      this.activeDiscounts = [
        {
          id: 'disc-2',
          code: 'FLYCHEAP20',
          merchant: 'CheapOair',
          domain: 'cheapoair.com',
          discountText: '$20 OFF',
          description: '$20 off flight bookings',
          affiliateUrl: 'https://www.cheapoair.com/?fp_affiliate=MYTRIPS_PARTNER',
          isVerified: true,
        },
      ];
    } else if (hostname.includes('booking.com')) {
      this.activeDiscounts = [
        {
          id: 'disc-3',
          code: 'BOOKINGSAFE5',
          merchant: 'Booking.com',
          domain: 'booking.com',
          discountText: '5% CASHBACK',
          description: '5% reward credit on hotel stay',
          affiliateUrl: 'https://www.booking.com/?aid=MYTRIPS_PARTNER',
          isVerified: true,
        },
      ];
    }

    if (this.activeDiscounts.length > 0) {
      this.renderOverlay();
    }
  }

  /**
   * Scrape basic travel details from current page
   */
  private extractTravelDetails(): Partial<HotelBooking> {
    const pageTitle = document.title || 'Saved Travel Item';
    const location = window.location.hostname;
    
    // Simple heuristic to detect prices on page ($120 or €150)
    const priceMatch = document.body.innerText.match(/(\$|€|£)\s?(\d{2,4})/);
    const price = priceMatch ? parseFloat(priceMatch[2]) : 150;
    const currency = priceMatch ? (priceMatch[1] === '€' ? 'EUR' : priceMatch[1] === '£' ? 'GBP' : 'USD') : 'USD';

    return {
      id: 'h-' + Date.now(),
      name: pageTitle.substring(0, 50),
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      price,
      currency,
      location,
      bookingUrl: window.location.href,
    };
  }

  /**
   * Try to auto-fill promo code into checkout input box
   */
  private autoFillPromoCode(code: string) {
    const selectors = [
      'input[name*="promo" i]',
      'input[name*="coupon" i]',
      'input[name*="voucher" i]',
      'input[name*="gutschein" i]',
      'input[placeholder*="promo" i]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="voucher" i]',
      'input[placeholder*="gutschein" i]',
      'input[id*="promo" i]',
      'input[id*="coupon" i]',
      'input[id*="voucher" i]',
      'input[id*="gutschein" i]',
    ];

    let filled = false;
    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLInputElement | null;
      if (input) {
        input.value = code;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.style.border = '2px solid #10b981';
        filled = true;
        break;
      }
    }

    if (filled) {
      alert(`🎉 MyTrips: Applied discount code "${code}"!`);
    } else {
      // Copy code to clipboard if input box not automatically detected
      navigator.clipboard.writeText(code);
      alert(`📋 Code "${code}" copied to clipboard! Paste it in the promo code box at checkout.`);
    }
  }

  /**
   * Render floating WebExtensions UI overlay on the travel site
   */
  private renderOverlay() {
    if (this.overlayContainer) return;

    const discount = this.activeDiscounts[0];

    const host = document.createElement('div');
    host.id = 'mytrips-extension-root';
    host.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    const shadow = host.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        .card {
          width: 310px;
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          animation: slideIn 0.3s ease-out;
          font-family: -apple-system, BlinkMacSystemFont, "Plus Jakarta Sans", "Segoe UI", Roboto, sans-serif;
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f1f5f9;
        }
        .title {
          font-weight: 700;
          font-size: 13px;
          color: #2563eb;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .close-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .close-btn:hover {
          background: #f1f5f9;
        }
        .discount-badge {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 12px;
        }
        .code-title {
          font-size: 10px;
          font-weight: 700;
          color: #1d4ed8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .code-val {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .btn-primary {
          width: 100%;
          background: #2563eb;
          color: #ffffff;
          border: none;
          font-weight: 700;
          font-size: 12px;
          padding: 9px;
          border-radius: 10px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: background 0.2s;
        }
        .btn-primary:hover {
          background: #1d4ed8;
        }
        .btn-secondary {
          width: 100%;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          font-weight: 600;
          font-size: 12px;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
        }
        .btn-secondary:hover {
          background: #f1f5f9;
        }
      </style>
      <div class="card">
        <div class="header">
          <div class="title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.7 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
            MyTrips Assistant
          </div>
          <button class="close-btn" id="closeBtn">✕</button>
        </div>
        <div class="discount-badge">
          <div class="code-title">PROMO CODE FOUND FOR ${discount.merchant.toUpperCase()}</div>
          <div class="code-val">${discount.code} — (${discount.discountText})</div>
        </div>
        <button class="btn-primary" id="applyBtn">Apply Code & Save</button>
        <button class="btn-secondary" id="saveTripBtn">Save Item to Itinerary</button>
      </div>
    `;

    document.body.appendChild(host);
    this.overlayContainer = host;

    // Attach event listeners inside shadow DOM
    shadow.getElementById('closeBtn')?.addEventListener('click', () => {
      host.remove();
      this.overlayContainer = null;
    });

    shadow.getElementById('applyBtn')?.addEventListener('click', () => {
      this.autoFillPromoCode(discount.code);
    });

    shadow.getElementById('saveTripBtn')?.addEventListener('click', async () => {
      const details = this.extractTravelDetails();
      const trips = await StorageService.getTrips();
      
      let activeTrip = trips[0];
      if (!activeTrip) {
        activeTrip = {
          id: 'trip-' + Date.now(),
          title: 'My Next Adventure',
          destination: details.location || 'Global',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          budgetLimit: 2000,
          currency: 'EUR',
          hotels: [],
          flights: [],
          activities: [],
          packingList: [],
          createdAt: new Date().toISOString(),
        };
      }

      activeTrip.hotels.push(details as HotelBooking);
      await StorageService.saveTrip(activeTrip);
      alert(`✅ Saved "${details.name}" to trip "${activeTrip.title}"!`);
    });
  }
}

// Initialize content script
new ContentOverlay();
