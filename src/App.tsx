import { useEffect, useState } from 'react';
import {
  Plane,
  Tag,
  ExternalLink,
  Plus,
  Compass,
  LayoutDashboard,
  Settings,
  BookOpen,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Sparkles,
  Ticket,
  Copy,
  Check,
} from 'lucide-react';
import { StorageService } from './services/storage';
import { DiscountApiService } from './services/discountApi';
import { DiscountCode, Trip, ExtensionSettings } from './types/trip';

export default function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'settings'>('home');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  useEffect(() => {
    async function initPopup() {
      const savedTrips = await StorageService.getTrips();
      const currentSettings = await StorageService.getSettings();
      setTrips(savedTrips);
      setSettings(currentSettings);

      if (savedTrips.length > 0) {
        const found = savedTrips.find((t) => t.id === currentSettings.activeTripId) || savedTrips[0];
        setActiveTrip(found);
      }

      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs[0] && tabs[0].url) {
            const url = tabs[0].url;
            setCurrentTabUrl(url);
            const foundDiscounts = await DiscountApiService.getDiscountsForDomain(url);
            setDiscounts(foundDiscounts);
          }
          setLoading(false);
        });
      } else {
        const dummyUrl = 'https://www.trip.com/hotels';
        setCurrentTabUrl(dummyUrl);
        const foundDiscounts = await DiscountApiService.getDiscountsForDomain(dummyUrl);
        setDiscounts(foundDiscounts);
        setLoading(false);
      }
    }

    initPopup();
  }, []);

  const handleTripChange = async (tripId: string) => {
    if (tripId === 'NEW') {
      openDashboard();
      return;
    }
    const found = trips.find((t) => t.id === tripId) || null;
    setActiveTrip(found);
    await StorageService.updateSettings({ activeTripId: tripId });
  };

  const handleSaveCurrentPage = async () => {
    if (!currentTabUrl) return;

    let targetTrip = activeTrip;
    let allTrips = [...trips];

    if (!targetTrip) {
      targetTrip = {
        id: 'trip-' + Date.now(),
        title: 'My Next Getaway',
        destination: 'Global',
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
      allTrips.push(targetTrip);
    }

    targetTrip.hotels.push({
      id: 'h-' + Date.now(),
      name: document.title || 'Saved Page',
      checkInDate: targetTrip.startDate,
      checkOutDate: targetTrip.endDate,
      price: 180,
      currency: targetTrip.currency,
      location: new URL(currentTabUrl).hostname,
      bookingUrl: currentTabUrl,
    });

    await StorageService.saveTrips(allTrips);
    setTrips(allTrips);
    setActiveTrip(targetTrip);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'dashboard.html' });
    } else {
      window.open('dashboard.html', '_blank');
    }
  };

  const toggleAutoApply = async () => {
    if (!settings) return;
    const updated = await StorageService.updateSettings({
      autoApplyDiscounts: !settings.autoApplyDiscounts,
    });
    setSettings(updated);
  };

  return (
    <div className="w-[360px] min-h-[500px] bg-slate-50 text-slate-800 font-sans flex flex-col justify-between p-4 border border-slate-200/80 shadow-2xl select-none">
      {/* Top Header matching reference design */}
      <div>
        <header className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <Plane className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-blue-600 flex items-center gap-1.5 tracking-tight">
              MyTrips
              <button onClick={openDashboard} className="text-slate-400 hover:text-blue-600 transition">
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </h1>
          </div>

          <button
            onClick={toggleAutoApply}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 ${
              settings?.autoApplyDiscounts
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>{settings?.autoApplyDiscounts ? 'Auto-Apply' : 'Off'}</span>
          </button>
        </header>

        {activeTab === 'home' && (
          <div className="space-y-3">
            {/* Active Trip Selector Card */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Active Itinerary
              </span>
              <select
                value={activeTrip?.id || ''}
                onChange={(e) => handleTripChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-medium focus:outline-none focus:border-blue-500 transition"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.destination})
                  </option>
                ))}
                {trips.length === 0 && <option value="">No Active Trips Yet</option>}
                <option value="NEW">+ Create New Trip in Dashboard</option>
              </select>
            </div>

            {/* Active Discount Alert Banner matching reference style */}
            {loading ? (
              <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl text-xs text-slate-400 animate-pulse">
                Checking tab for discounts...
              </div>
            ) : discounts.length > 0 ? (
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[11px] font-bold opacity-90 mb-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> PROMO CODE DETECTED
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">{discounts[0].merchant}</span>
                </div>
                <div className="flex items-baseline justify-between my-2">
                  <span className="text-xl font-extrabold tracking-wider bg-white/10 px-2 py-0.5 rounded-lg border border-white/20">
                    {discounts[0].code}
                  </span>
                  <span className="text-xs font-bold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                    {discounts[0].discountText}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mb-3">{discounts[0].description}</p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleCopyCode(discounts[0].code, discounts[0].id)}
                    className={`w-full text-xs font-bold py-2 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                      copiedCodeId === discounts[0].id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    }`}
                  >
                    {copiedCodeId === discounts[0].id ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>

                  <a
                    href={discounts[0].affiliateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-center w-full bg-white text-blue-600 hover:bg-slate-100 font-bold text-xs py-2 rounded-xl transition shadow-xs flex items-center justify-center gap-1"
                  >
                    Apply & Book <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl text-xs text-slate-500 flex items-start gap-2.5">
                <Ticket className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-700">No active discounts on this tab</p>
                  <p className="text-[11px] text-slate-400">Visit Trip.com, Booking.com, or CheapOair for auto-detected codes.</p>
                </div>
              </div>
            )}

            {/* Dashed Web Clipper Action Box matching reference UI */}
            <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-2xl text-center select-none">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mb-0.5">Save Web Page to Trip</h3>
              <p className="text-[11px] text-slate-400 mb-3">Clip hotel or flight info into active itinerary</p>
              <button
                onClick={handleSaveCurrentPage}
                className={`w-full text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Page Saved!
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Add Current Tab
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" /> Full Itinerary Workspace
                </span>
                <button onClick={openDashboard} className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]">
                  Launch <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Access your drag-and-drop itinerary timeline, budget manager, and packing lists in a full browser window.
              </p>
              <button
                onClick={openDashboard}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Open Full Dashboard
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-3">
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extension Settings</h3>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Travelpayouts Partner ID</label>
                <input
                  type="password"
                  readOnly
                  value={settings?.partnerTagId || '774783'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2 font-mono tracking-widest"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                <span>Version</span>
                <span className="font-semibold text-slate-700">v1.0.0</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pill-shaped Bottom Navigation Bar matching reference screenshot */}
      <footer className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-around bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
            activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
            activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-0.5 transition ${
            activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </footer>
    </div>
  );
}
