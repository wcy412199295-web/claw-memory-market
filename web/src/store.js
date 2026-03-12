import { create } from 'zustand';

// Priority: URL param ?api= > runtime config.js > build-time VITE_API_URL > localhost fallback
const _urlApi = new URLSearchParams(window.location.search).get('api');
const _runtimeApi = window.__CLAW_CONFIG__?.API_URL;
const API_BASE = _urlApi || _runtimeApi || import.meta.env.VITE_API_URL || 'http://localhost:3210/api';

// ── API helper ──────────────────────────────────────
async function api(path, options = {}) {
  const token = localStorage.getItem('claw_token');
  const headers = { ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ── Store ───────────────────────────────────────────
export const useStore = create((set, get) => ({
  // ── Auth state ──────────────────────────────────
  user: null,
  token: localStorage.getItem('claw_token') || null,
  authLoading: false,
  authError: null,
  showAuthModal: false,

  // ── Listings ────────────────────────────────────
  listings: [],
  filteredListings: [],
  pagination: { total: 0, page: 1, limit: 20, pages: 0 },
  loading: false,
  error: null,

  // ── Filters ─────────────────────────────────────
  searchQuery: '',
  selectedTags: [],
  sortBy: 'newest',

  // ── Stats ───────────────────────────────────────
  marketStats: null,

  // ── Detail ──────────────────────────────────────
  selectedListing: null,
  detailLoading: false,

  // ── My data ─────────────────────────────────────
  myListings: [],
  myPurchases: [],
  mySales: [],

  // ═══ Auth actions ═════════════════════════════════
  setShowAuthModal: (show) => set({ showAuthModal: show, authError: null }),

  register: async (username, password, displayName) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await api('/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, displayName }),
      });
      localStorage.setItem('claw_token', data.token);
      set({ user: data.user, token: data.token, authLoading: false, showAuthModal: false });
    } catch (err) {
      set({ authError: err.error || 'Registration failed', authLoading: false });
    }
  },

  login: async (username, password) => {
    set({ authLoading: true, authError: null });
    try {
      const data = await api('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem('claw_token', data.token);
      set({ user: data.user, token: data.token, authLoading: false, showAuthModal: false });
    } catch (err) {
      set({ authError: err.error || 'Login failed', authLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('claw_token');
    set({ user: null, token: null, myListings: [], myPurchases: [], mySales: [] });
  },

  fetchMe: async () => {
    try {
      const data = await api('/users/me');
      set({ user: data });
    } catch {
      localStorage.removeItem('claw_token');
      set({ user: null, token: null });
    }
  },

  deposit: async (amount) => {
    const data = await api('/users/me/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    set(s => ({ user: { ...s.user, balance: data.balance } }));
  },

  // ═══ Listings actions ═════════════════════════════
  fetchListings: async () => {
    set({ loading: true, error: null });
    try {
      const { searchQuery, selectedTags, sortBy, pagination } = get();
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTags.length) params.set('tag', selectedTags[0]); // Single tag for API
      params.set('sort', sortBy);
      params.set('page', pagination.page);
      params.set('limit', pagination.limit);

      const data = await api(`/listings?${params}`);
      set({
        listings: data.listings,
        filteredListings: data.listings,
        pagination: data.pagination,
        loading: false,
      });
    } catch (err) {
      set({ error: err.error || 'Failed to fetch listings', loading: false });
    }
  },

  fetchListingDetail: async (id) => {
    set({ detailLoading: true, selectedListing: null });
    try {
      const data = await api(`/listings/${id}`);
      set({ selectedListing: data, detailLoading: false });
    } catch (err) {
      set({ detailLoading: false, error: err.error });
    }
  },

  uploadListing: async (formData) => {
    const data = await api('/listings', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
    return data;
  },

  purchaseListing: async (id) => {
    const data = await api(`/listings/${id}/purchase`, { method: 'POST' });
    return data;
  },

  downloadListing: async (id) => {
    const token = localStorage.getItem('claw_token');
    const res = await fetch(`${API_BASE}/listings/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json();
      throw err;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.clawmem`;
    a.click();
    URL.revokeObjectURL(url);
  },

  postReview: async (listingId, rating, comment) => {
    await api(`/listings/${listingId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
    // Refresh detail
    get().fetchListingDetail(listingId);
  },

  deleteListing: async (id) => {
    await api(`/listings/${id}`, { method: 'DELETE' });
    get().fetchMyListings();
  },

  // ═══ My data ══════════════════════════════════════
  fetchMyListings: async () => {
    const data = await api('/listings/my/listings');
    set({ myListings: data });
  },

  fetchMyPurchases: async () => {
    const data = await api('/listings/my/purchases');
    set({ myPurchases: data });
  },

  fetchMySales: async () => {
    const data = await api('/listings/my/sales');
    set({ mySales: data });
  },

  // ═══ Stats ════════════════════════════════════════
  fetchStats: async () => {
    try {
      const data = await api('/stats');
      set({ marketStats: data });
    } catch { /* ignore */ }
  },

  // ═══ Filter actions ═══════════════════════════════
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    // Debounce fetch in component
  },

  toggleTag: (tag) => {
    const current = get().selectedTags;
    const next = current.includes(tag)
      ? current.filter(t => t !== tag)
      : [...current, tag];
    set({ selectedTags: next });
    get().fetchListings();
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().fetchListings();
  },

  setPage: (page) => {
    set(s => ({ pagination: { ...s.pagination, page } }));
    get().fetchListings();
  },

  // ── Helpers ─────────────────────────────────────
  getAllTags: () => {
    const tags = new Set();
    get().listings.forEach(l => (l.tags || []).forEach(t => tags.add(t)));
    return [...tags].sort();
  },
}));
