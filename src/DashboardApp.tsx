import { useEffect, useState } from 'react';
import {
  Plane,
  Hotel,
  LayoutDashboard,
  MapPin,
  DollarSign,
  Tag,
  Package,
  Settings,
  Search,
  Plus,
  ExternalLink,
  Trash2,
  Calendar,
  Globe,
  Sparkles,
  Ticket,
  ShoppingBag,
  PlusCircle,
  Copy,
  Check,
} from 'lucide-react';
import { StorageService } from './services/storage';
import { DiscountApiService } from './services/discountApi';
import { Trip, HotelBooking, DiscountCode, ExtensionSettings } from './types/trip';

export default function DashboardApp() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'deals' | 'packing' | 'settings'>('itinerary');
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);

  // Modals
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [showAddHotelModal, setShowAddHotelModal] = useState(false);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // New Trip Form State
  const [newTripTitle, setNewTripTitle] = useState('');
  const [newTripDest, setNewTripDest] = useState('');
  const [newTripStart, setNewTripStart] = useState(new Date().toISOString().split('T')[0]);
  const [newTripEnd, setNewTripEnd] = useState(new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]);
  const [newTripBudget, setNewTripBudget] = useState(2000);
  const [newTripCurrency, setNewTripCurrency] = useState('EUR');

  // New Hotel Form State
  const [hotelName, setHotelName] = useState('');
  const [hotelLocation, setHotelLocation] = useState('');
  const [hotelPrice, setHotelPrice] = useState(150);
  const [hotelUrl, setHotelUrl] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      const savedTrips = await StorageService.getTrips();
      const currentSettings = await StorageService.getSettings();
      const cachedDiscounts = await StorageService.getCachedDiscounts();

      setSettings(currentSettings);
      setTrips(savedTrips);

      if (cachedDiscounts.length > 0) {
        setDiscounts(cachedDiscounts);
      } else {
        const demoDiscounts = await DiscountApiService.getDiscountsForDomain('https://www.trip.com');
        setDiscounts(demoDiscounts);
      }

      if (savedTrips.length > 0) {
        const found = savedTrips.find((t) => t.id === currentSettings.activeTripId) || savedTrips[0];
        setActiveTrip(found);
      }
    }

    loadDashboardData();
  }, []);

  const handleSelectTrip = async (trip: Trip) => {
    setActiveTrip(trip);
    await StorageService.updateSettings({ activeTripId: trip.id });
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle || !newTripDest) return;

    const newTrip: Trip = {
      id: 'trip-' + Date.now(),
      title: newTripTitle,
      destination: newTripDest,
      startDate: newTripStart,
      endDate: newTripEnd,
      budgetLimit: Number(newTripBudget),
      currency: newTripCurrency,
      hotels: [],
      flights: [],
      activities: [],
      packingList: [
        { id: 'p1', title: 'Passport & Travel Documents', category: 'documents', isPacked: false },
        { id: 'p2', title: 'Universal Travel Adapter', category: 'electronics', isPacked: false, amazonAffiliateUrl: 'https://www.amazon.com/dp/B078S36XJJ?tag=mytrips2026-20' },
        { id: 'p3', title: 'Noise Cancelling Headphones', category: 'electronics', isPacked: false, amazonAffiliateUrl: 'https://www.amazon.com/dp/B08PZHYWJS?tag=mytrips2026-20' },
        { id: 'p4', title: 'Sunscreen & Toiletries', category: 'toiletries', isPacked: false },
      ],
      createdAt: new Date().toISOString(),
    };

    const updatedTrips = await StorageService.saveTrip(newTrip);
    setTrips(updatedTrips);
    setActiveTrip(newTrip);
    setShowNewTripModal(false);

    setNewTripTitle('');
    setNewTripDest('');
  };

  const handleAddHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !hotelName) return;

    const newHotel: HotelBooking = {
      id: 'h-' + Date.now(),
      name: hotelName,
      checkInDate: activeTrip.startDate,
      checkOutDate: activeTrip.endDate,
      price: Number(hotelPrice),
      currency: activeTrip.currency,
      location: hotelLocation || activeTrip.destination,
      bookingUrl: hotelUrl || 'https://www.booking.com/?aid=774783',
    };

    const updatedTrip = {
      ...activeTrip,
      hotels: [...activeTrip.hotels, newHotel],
    };

    const allTrips = await StorageService.saveTrip(updatedTrip);
    setTrips(allTrips);
    setActiveTrip(updatedTrip);
    setShowAddHotelModal(false);

    setHotelName('');
    setHotelLocation('');
    setHotelPrice(150);
    setHotelUrl('');
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    const remaining = trips.filter((t) => t.id !== tripId);
    await StorageService.saveTrips(remaining);
    setTrips(remaining);
    setActiveTrip(remaining[0] || null);
  };

  const togglePackingItem = async (itemId: string) => {
    if (!activeTrip) return;
    const updatedPacking = activeTrip.packingList.map((p) =>
      p.id === itemId ? { ...p, isPacked: !p.isPacked } : p
    );
    const updatedTrip = { ...activeTrip, packingList: updatedPacking };
    const allTrips = await StorageService.saveTrip(updatedTrip);
    setTrips(allTrips);
    setActiveTrip(updatedTrip);
  };

  const totalHotelCost = activeTrip?.hotels.reduce((sum, h) => sum + h.price, 0) || 0;
  const totalFlightCost = activeTrip?.flights.reduce((sum, f) => sum + f.price, 0) || 0;
  const totalActivityCost = activeTrip?.activities.reduce((sum, a) => sum + a.price, 0) || 0;
  const totalSpent = totalHotelCost + totalFlightCost + totalActivityCost;
  const budgetPercentage = activeTrip ? Math.min(Math.round((totalSpent / activeTrip.budgetLimit) * 100), 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex select-none">
      {/* Sidebar matching reference screenshot style */}
      <aside className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col justify-between shadow-xs">
        <div>
          {/* Top Brand Logo Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-sm">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-600 tracking-tight">MyTrips</h1>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Travel Intelligence</span>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                activeTab === 'itinerary'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Itinerary Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('budget')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                activeTab === 'budget'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Budget & Expenses</span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                activeTab === 'deals'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Discount Codes</span>
            </button>

            <button
              onClick={() => setActiveTab('packing')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                activeTab === 'packing'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Packing Checklist</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-3 ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Trips List in Sidebar */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>SAVED TRIPS</span>
            <button onClick={() => setShowNewTripModal(true)} className="text-blue-600 hover:underline flex items-center gap-0.5">
              <Plus className="w-3 h-3" /> New
            </button>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTrip(t)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition truncate flex items-center justify-between ${
                  activeTrip?.id === t.id
                    ? 'bg-white text-blue-600 font-bold border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <span className="truncate flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-slate-400" /> {t.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Workspace Area matching reference dashboard design */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-4">
            {/* Search Input Bar matching screenshot */}
            <div className="relative w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search itineraries, hotels, flights..."
                className="w-full bg-white border border-slate-200/80 text-slate-700 text-xs rounded-xl pl-9 pr-4 py-2 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTrip && (
              <button
                onClick={() => handleDeleteTrip(activeTrip.id)}
                className="text-slate-400 hover:text-rose-600 p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 transition shadow-2xs"
                title="Delete Active Trip"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowNewTripModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Trip
            </button>
          </div>
        </header>

        {/* Active Trip Title Header */}
        {activeTrip && (
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl mb-6 shadow-2xs flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{activeTrip.title}</h2>
                <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {activeTrip.destination}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
                <Calendar className="w-3.5 h-3.5" /> {activeTrip.startDate} to {activeTrip.endDate} • Budget: {activeTrip.currency} {activeTrip.budgetLimit}
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
                {activeTrip.hotels.length} Stays
              </span>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200">
                {activeTrip.flights.length} Flights
              </span>
            </div>
          </div>
        )}

        {/* TAB 1: ITINERARY BUILDER */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Trip Timeline & Reservations</h3>
              <button
                onClick={() => setShowAddHotelModal(true)}
                disabled={!activeTrip}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Reservation
              </button>
            </div>

            {!activeTrip || activeTrip.hotels.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200/80 rounded-2xl p-12 text-center select-none shadow-2xs">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Hotel className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-1">No Reservations Saved</h4>
                <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                  Use the MyTrips extension while browsing Booking.com, Trip.com, or CheapOair to clip hotels directly into your itinerary!
                </p>
                <button
                  onClick={() => setShowAddHotelModal(true)}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs"
                >
                  + Add Reservation Manually
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTrip.hotels.map((hotel) => (
                  <div key={hotel.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs hover:border-blue-300 transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1 w-fit">
                          <Hotel className="w-3 h-3" /> HOTEL STAY
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-2">{hotel.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" /> {hotel.location}
                        </p>
                      </div>
                      <span className="text-base font-black text-blue-600">
                        {hotel.currency} {hotel.price}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 border-t border-slate-100 pt-3 flex justify-between items-center">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {hotel.checkInDate} to {hotel.checkOutDate}
                      </span>
                      <a
                        href={DiscountApiService.buildAffiliateUrl(hotel.bookingUrl, settings?.partnerTagId)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition text-xs flex items-center gap-1"
                      >
                        View & Book <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BUDGET & EXPENSES */}
        {activeTab === 'budget' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Budget Overview</h3>

            {activeTrip && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs space-y-6">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL SPENT</span>
                    <h4 className="text-3xl font-black text-slate-900 mt-1">
                      {activeTrip.currency} {totalSpent} <span className="text-sm font-normal text-slate-400">/ {activeTrip.currency} {activeTrip.budgetLimit}</span>
                    </h4>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    budgetPercentage > 90
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {budgetPercentage}% Budget Used
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      budgetPercentage > 90 ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Hotel className="w-3.5 h-3.5 text-blue-600" /> Hotels & Stay
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1">{activeTrip.currency} {totalHotelCost}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Plane className="w-3.5 h-3.5 text-blue-600" /> Flights
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1">{activeTrip.currency} {totalFlightCost}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5 text-blue-600" /> Activities
                    </span>
                    <p className="text-lg font-bold text-slate-900 mt-1">{activeTrip.currency} {totalActivityCost}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 3RD-PARTY DISCOUNT HUB */}
        {activeTab === 'deals' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Partner Discount Codes</h3>
              <p className="text-xs text-slate-400">Live verified promo codes connected via Travelpayouts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discounts.map((disc) => (
                <div key={disc.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-2xs hover:border-blue-300 transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                      {disc.merchant}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-slate-900 mt-1">{disc.code}</h4>
                  <p className="text-xs font-bold text-blue-600 mb-1">{disc.discountText}</p>
                  <p className="text-xs text-slate-500 mb-4">{disc.description}</p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopyCode(disc.code, disc.id)}
                      className={`w-full text-xs font-bold py-2 rounded-xl border transition flex items-center justify-center gap-1.5 ${
                        copiedCodeId === disc.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {copiedCodeId === disc.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" /> Copy Code
                        </>
                      )}
                    </button>

                    <a
                      href={DiscountApiService.buildAffiliateUrl(disc.affiliateUrl, settings?.partnerTagId)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-2xs flex items-center justify-center gap-1"
                    >
                      Activate Deal <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PACKING CHECKLIST */}
        {activeTab === 'packing' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Packing Checklist & Travel Gear</h3>

            {activeTrip && (
              <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs space-y-3">
                {activeTrip.packingList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.isPacked}
                        onChange={() => togglePackingItem(item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className={`text-xs font-semibold ${item.isPacked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.title}
                      </span>
                    </label>

                    {item.amazonAffiliateUrl && (
                      <a
                        href={item.amazonAffiliateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Buy on Amazon <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Extension Configuration</h3>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-2xs space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Travelpayouts Partner ID</label>
                <input
                  type="password"
                  readOnly
                  value={settings?.partnerTagId || '774783'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amazon Associate Tag</label>
                <input
                  type="password"
                  readOnly
                  value="mytrips2026-20"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-mono tracking-widest"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE NEW TRIP */}
      {showNewTripModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-md p-6 rounded-2xl shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" /> Create New Trip
            </h3>
            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paris Summer Getaway"
                  value={newTripTitle}
                  onChange={(e) => setNewTripTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paris, France"
                  value={newTripDest}
                  onChange={(e) => setNewTripDest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newTripStart}
                    onChange={(e) => setNewTripStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={newTripEnd}
                    onChange={(e) => setNewTripEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Target Budget</label>
                  <input
                    type="number"
                    value={newTripBudget}
                    onChange={(e) => setNewTripBudget(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
                  <select
                    value={newTripCurrency}
                    onChange={(e) => setNewTripCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTripModal(false)}
                  className="bg-slate-100 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs"
                >
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOTEL MANUALLY */}
      {showAddHotelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 w-full max-w-md p-6 rounded-2xl shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Hotel className="w-5 h-5 text-blue-600" /> Add Hotel Reservation
            </h3>
            <form onSubmit={handleAddHotel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hotel / Stay Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hotel Le Marais Paris"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Price per Night</label>
                <input
                  type="number"
                  value={hotelPrice}
                  onChange={(e) => setHotelPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddHotelModal(false)}
                  className="bg-slate-100 text-slate-600 text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-2xs"
                >
                  Save Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
