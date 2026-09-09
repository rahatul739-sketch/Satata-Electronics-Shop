import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Home, Box, Layers, Warehouse, 
  ShoppingCart, Users, Truck, ArrowLeftRight, PieChart, Settings, 
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Eye, X, Printer, Pencil, Save, RefreshCw,
  Search, Moon, Sun, PackageSearch, Award, Clock, Sparkles, Inbox, LogOut, Loader2, Mail, Lock,
  Wallet, PackagePlus, Tag, BadgePercent, PackageOpen
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// --- Supabase connection ---
// This publishable key is safe to expose in frontend code — access is controlled
// by Row Level Security policies on the database, not by keeping this key secret.
const SUPABASE_URL = 'https://hjmtbpokyuyctvlsmkyr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P0wRpIBl7WAe-RIwXqztjA_7DsJ1A9d';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// --- INITIAL DEFAULT MOCK DATA ---
const defaultMonthlySales = [
  { month: 'Jan', sales: 200000 }, { month: 'Feb', sales: 240000 },
  { month: 'Mar', sales: 300000 }, { month: 'Apr', sales: 430000 },
  { month: 'May', sales: 300000 }, { month: 'Jun', sales: 486200 },
];

const defaultCategories = [
  { id: 1, name: 'Electronics', totalItems: 2, description: 'Gadgets, appliances, and electronic components' },
  { id: 2, name: 'Home Appliances', totalItems: 1, description: 'Refrigerators, TVs, and fans' },
];

const defaultProducts = [
  { id: 1, name: '43" Smart LED TV', category: 'Electronics', buyPrice: 28000, sellPrice: 35000, stock: 12, reorderLevel: 3 },
  { id: 2, name: 'Rechargeable Fan', category: 'Electronics', buyPrice: 3200, sellPrice: 4500, stock: 4, reorderLevel: 5 },
];

const defaultSales = [
  { 
    id: '#ORD-9021', 
    customer: 'Tanvir Hossain', 
    customerPhone: '01700000000',
    customerAddress: 'Gazipur, Bangladesh',
    items: [
      { productId: 1, productName: '43" Smart LED TV', qty: 1, buyPrice: 28000, sellPrice: 35000, lineTotal: 35000 }
    ],
    subtotal: 35000,
    discount: 0,
    totalSellAmount: 35000, 
    totalCostAmount: 28000,
    status: 'Paid', 
    date: '2026-09-07' 
  },
];

const defaultCustomers = [
  { id: 1, name: 'Tanvir Hossain', email: 'tanvir@example.com', phone: '01700000000', address: 'Gazipur, Bangladesh' },
];

const defaultSuppliers = [
  { id: 1, company: 'Singer BD Distribution', contact: 'Rahim Uddin', email: 'rahim@singer.com', phone: '01800112233' },
];

const defaultTransactions = [
  { id: 'TXN-ORD-9021', refId: '#ORD-9021', type: 'Income', amount: 35000, date: '2026-09-07', status: 'Success' },
];

const defaultSettings = {
  shopName: 'Satota Electronics',
  proprietor: 'Fahim Khan',
  phone: '01758392250, 01727013619',
  address: 'Sila bristy market, Pollibidduit, Kaliakoir, Gazipur',
  currency: 'Tk',
  receiptPolicies: [
    'Electronics warranty subject to manufacturer guidelines.',
    'No returns after purchase without original invoice.',
    'Exchange allowed within 7 days for manufacturing defects only.',
    'Thank you for shopping with us!'
  ]
};

// LocalStorage Hook
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// --- Mapping helpers: app uses camelCase, Supabase columns use snake_case ---
const dbMap = {
  category: {
    toDb: (c) => ({ name: c.name, description: c.description, total_items: c.totalItems || 0 }),
    fromDb: (r) => ({ id: r.id, name: r.name, description: r.description, totalItems: r.total_items }),
  },
  product: {
    toDb: (p) => ({ name: p.name, category: p.category, buy_price: p.buyPrice, sell_price: p.sellPrice, stock: p.stock, reorder_level: p.reorderLevel }),
    fromDb: (r) => ({ id: r.id, name: r.name, category: r.category, buyPrice: Number(r.buy_price), sellPrice: Number(r.sell_price), stock: r.stock, reorderLevel: r.reorder_level }),
  },
  customer: {
    toDb: (c) => ({ name: c.name, email: c.email, phone: c.phone, address: c.address }),
    fromDb: (r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, address: r.address }),
  },
  supplier: {
    toDb: (s) => ({ company: s.company, contact: s.contact, email: s.email, phone: s.phone }),
    fromDb: (r) => ({ id: r.id, company: r.company, contact: r.contact, email: r.email, phone: r.phone }),
  },
  sale: {
    toDb: (s) => ({
      id: s.id, customer: s.customer, customer_phone: s.customerPhone, customer_address: s.customerAddress,
      items: s.items, subtotal: s.subtotal, discount: s.discount, total_sell_amount: s.totalSellAmount,
      total_cost_amount: s.totalCostAmount, status: s.status, sale_date: s.date,
      paid_amount: s.paidAmount !== undefined && s.paidAmount !== null ? s.paidAmount : s.totalSellAmount,
    }),
    fromDb: (r) => ({
      id: r.id, customer: r.customer, customerPhone: r.customer_phone, customerAddress: r.customer_address,
      items: r.items || [], subtotal: Number(r.subtotal), discount: Number(r.discount),
      totalSellAmount: Number(r.total_sell_amount), totalCostAmount: Number(r.total_cost_amount),
      status: r.status, date: r.sale_date,
      paidAmount: r.paid_amount !== null && r.paid_amount !== undefined ? Number(r.paid_amount) : Number(r.total_sell_amount),
    }),
  },
  purchase: {
    // A purchase can now hold multiple line items (like a sale), and each line item
    // tracks its own ordered qty vs receivedQty — so a partial delivery from a vendor
    // (e.g. ordered 10, only 6 arrived) can be entered as one purchase where 6 units are
    // received (and go straight into stock) while 4 stay pending on Advance Payments.
    // Legacy single-item columns (product_id, product_name, qty, unit_cost) are still
    // written from the first line item for backward compatibility with old reports/rows.
    toDb: (p) => {
      const items = Array.isArray(p.items) ? p.items : [];
      const first = items[0] || {};
      return {
        id: p.id, supplier: p.supplier, items,
        product_id: first.productId || null,
        product_name: items.length > 1 ? `${first.productName || 'Item'} +${items.length - 1} more` : (first.productName || p.productName || ''),
        category: first.category || p.category || '',
        qty: items.reduce((sum, i) => sum + (parseInt(i.qty, 10) || 0), 0) || p.qty || 0,
        unit_cost: first.unitCost ?? p.unitCost ?? 0,
        total_amount: p.totalAmount, paid_amount: p.paidAmount, status: p.status, purchase_date: p.date,
        received: p.received !== false,
      };
    },
    fromDb: (r) => {
      // Old rows (created before multi-item purchases) have no items[] — synthesize a
      // single-line item from their legacy columns so the rest of the app can treat
      // every purchase uniformly as { items: [...] }.
      const items = Array.isArray(r.items) && r.items.length > 0
        ? r.items.map(i => ({
            productId: i.productId ?? null, productName: i.productName || 'Item', category: i.category || '',
            qty: parseInt(i.qty, 10) || 0, unitCost: Number(i.unitCost) || 0,
            receivedQty: i.receivedQty !== undefined && i.receivedQty !== null ? parseInt(i.receivedQty, 10) : (parseInt(i.qty, 10) || 0),
            lineTotal: (Number(i.unitCost) || 0) * (parseInt(i.qty, 10) || 0),
          }))
        : (r.product_name || r.product_id ? [{
            productId: r.product_id ?? null, productName: r.product_name || 'Item', category: r.category || '',
            qty: r.qty || 0, unitCost: Number(r.unit_cost) || 0,
            receivedQty: r.received !== false ? (r.qty || 0) : 0,
            lineTotal: (Number(r.unit_cost) || 0) * (r.qty || 0),
          }] : []);
      return {
        id: r.id, supplier: r.supplier, items,
        totalAmount: Number(r.total_amount), paidAmount: Number(r.paid_amount),
        dueAmount: Math.max(0, Number(r.total_amount) - Number(r.paid_amount)),
        status: r.status, date: r.purchase_date,
        received: items.length === 0 || items.every(i => (i.receivedQty ?? i.qty) >= i.qty),
      };
    },
  },
  transaction: {
    toDb: (t) => ({ id: t.id, ref_id: t.refId, type: t.type, amount: t.amount, txn_date: t.date, status: t.status }),
    fromDb: (r) => ({ id: r.id, refId: r.ref_id, type: r.type, amount: Number(r.amount), date: r.txn_date, status: r.status }),
  },
  settings: {
    toDb: (s) => ({ shop_name: s.shopName, proprietor: s.proprietor, phone: s.phone, address: s.address, currency: s.currency, receipt_policies: s.receiptPolicies }),
    fromDb: (r) => ({ shopName: r.shop_name, proprietor: r.proprietor, phone: r.phone, address: r.address, currency: r.currency, receiptPolicies: r.receipt_policies || [] }),
  },
  damaged: {
    toDb: (d) => ({
      product_id: d.productId || null, product_name: d.productName, qty: d.qty, reason: d.reason,
      damage_date: d.date, entry_type: d.type || 'Inventory Damage',
      customer_name: d.customerName || null, customer_phone: d.customerPhone || null,
    }),
    fromDb: (r) => ({
      id: r.id, productId: r.product_id, productName: r.product_name, qty: r.qty, reason: r.reason,
      date: r.damage_date, type: r.entry_type || 'Inventory Damage',
      customerName: r.customer_name || '', customerPhone: r.customer_phone || '',
    }),
  },
};

// --- Email/password login screen. New accounts are granted by the owner,
// so "Create account" sends an access request by email instead of self-signup. ---
function LoginScreen({ shopName }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestAccessHref =
    'mailto:rahatulislamfahim0172@gmail.com' +
    '?subject=' + encodeURIComponent('Satota Electronics - Access Request') +
    '&body=' + encodeURIComponent("Hi,\n\nI'd like access to the Satota Electronics shop management app.\n\nName:\nPhone:\n");

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* decorative circuit-trace background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15] pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#f97316" strokeWidth="1.5" fill="none">
          <path d="M0 180 H260 V340 V340 H620 V80 H1000" />
          <path d="M0 560 H160 V700 H480 V860 H1000" />
          <path d="M0 920 H320 V980" />
        </g>
        <g fill="#f97316">
          <circle cx="260" cy="180" r="5" />
          <circle cx="620" cy="340" r="5" />
          <circle cx="160" cy="560" r="5" />
          <circle cx="480" cy="700" r="5" />
          <circle cx="320" cy="920" r="5" />
        </g>
      </svg>

      <div className="relative w-full max-w-sm">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg mb-3 ring-4 ring-orange-500/20">
              {(shopName || 'S').charAt(0)}
            </div>
            <h1 className="text-xl font-black text-white">{shopName}</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to your shop dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" minLength={6}
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] uppercase tracking-widest text-slate-600">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400 mb-2">Don't have access yet? Email this address to request it:</p>
            <a
              href={requestAccessHref}
              className="inline-flex w-full items-center justify-center gap-2 border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-bold py-3 rounded-xl text-sm transition-all break-all"
            >
              <Mail className="w-4 h-4 shrink-0" /> rahatulislamfahim0172@gmail.com
            </a>
            <p className="text-[10px] text-slate-500 mt-2">
              Tap to open your email app, or copy the address and send it manually.
            </p>
          </div>
        </div>

        {/* feature strip */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl py-3">
            <Box className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 font-semibold">Inventory</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl py-3">
            <ShoppingCart className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 font-semibold">Sales</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl py-3">
            <PieChart className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-[10px] text-slate-400 font-semibold">Reports</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable empty-state placeholder for tables with no rows
function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
      <h4 className="font-bold text-[var(--text-primary)] text-base mb-1">{title}</h4>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">{message}</p>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  // --- Auth state ---
  const [session, setSession] = useState(undefined); // undefined = checking, null = logged out, object = logged in
  const [dataLoading, setDataLoading] = useState(false);

  // Data States — now sourced from Supabase, not localStorage, once logged in
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [damagedProducts, setDamagedProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [shopSettings, setShopSettings] = useState(defaultSettings);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Load everything for this user once they're signed in
  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [catRes, prodRes, custRes, supRes, saleRes, txnRes, settingsRes, damagedRes, purchaseRes] = await Promise.all([
        supabase.from('categories').select('*').order('id'),
        supabase.from('products').select('*').order('id'),
        supabase.from('customers').select('*').order('id'),
        supabase.from('suppliers').select('*').order('id'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_settings').select('*').maybeSingle(),
        supabase.from('damaged_products').select('*').order('created_at', { ascending: false }),
        supabase.from('purchases').select('*').order('created_at', { ascending: false }),
      ]);

      setCategories((catRes.data || []).map(dbMap.category.fromDb));
      setProducts((prodRes.data || []).map(dbMap.product.fromDb));
      setCustomers((custRes.data || []).map(dbMap.customer.fromDb));
      setSuppliers((supRes.data || []).map(dbMap.supplier.fromDb));
      setSales((saleRes.data || []).map(dbMap.sale.fromDb));
      setTransactions((txnRes.data || []).map(dbMap.transaction.fromDb));
      setDamagedProducts((damagedRes.data || []).map(dbMap.damaged.fromDb));
      setPurchases((purchaseRes.data || []).map(dbMap.purchase.fromDb));

      if (settingsRes.data) {
        setShopSettings({ ...defaultSettings, ...dbMap.settings.fromDb(settingsRes.data) });
      } else {
        // First time this user has logged in — create their settings row with defaults
        await supabase.from('shop_settings').upsert({ user_id: session?.user?.id, ...dbMap.settings.toDb(defaultSettings) });
        setShopSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
      alert('Could not load your shop data. Please check your internet connection and refresh.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAllData();
    }
  }, [session]);

  const handleLogout = async () => {
    if (!window.confirm('Sign out of your shop account?')) return;
    await supabase.auth.signOut();
    setCategories([]); setProducts([]); setCustomers([]); setSuppliers([]); setSales([]); setTransactions([]);
  };

  // Theme (Dark Mode)
  const [isDarkMode, setIsDarkMode] = useLocalStorage('satota_theme_dark', false);

  // Search / filter text, kept per-tab so switching tabs doesn't lose your search
  const [searchQueries, setSearchQueries] = useState({});
  const currentSearch = (searchQueries[activeTab] || '').toLowerCase();
  const setCurrentSearch = (value) => setSearchQueries(prev => ({ ...prev, [activeTab]: value }));

  // Modal & Edit States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedPurchaseReceipt, setSelectedPurchaseReceipt] = useState(null);
  const [formData, setFormData] = useState({});
  // Styled "Mark as Received" modal state — replaces the old window.prompt() flow
  const [receiveModal, setReceiveModal] = useState(null); // { purchase, itemIndex, item, pendingQty }
  const [receiveQtyInput, setReceiveQtyInput] = useState('');

  // Settings Form State — kept in sync with shopSettings once it loads from Supabase
  const [settingsForm, setSettingsForm] = useState(shopSettings);
  useEffect(() => { setSettingsForm(shopSettings); }, [shopSettings]);

  // POS Cart State — each row can be narrowed to a category first, then a product.
  // customProductPrice = the regular/catalog price (editable); customSellPrice = the actual
  // price the item is sold for (editable). If sell < product price, the difference is the discount.
  const [cartItems, setCartItems] = useState([
    { productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }
  ]);

  // Purchase Items State — one row per product being bought from a supplier in this
  // purchase. receivedQty defaults to the ordered qty (assume full delivery) but can be
  // lowered when the vendor only ships part of the order; the remainder (qty - receivedQty)
  // automatically shows up on the Advance Payments page until it's received later.
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }
  ]);

  // Category-wise browsing: which category is currently selected for filtering the Products list
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  // Due Amounts tab: which side is showing — customer dues or vendor dues
  const [dueView, setDueView] = useState('customer');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSettingsChange = (e) => {
    setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('shop_settings').upsert({
        user_id: session.user.id,
        ...dbMap.settings.toDb(settingsForm),
      });
      if (error) throw error;
      setShopSettings(settingsForm);
      alert('Settings updated successfully!');
    } catch (err) {
      alert('Could not save settings: ' + (err.message || 'unknown error'));
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({});
    setCartItems([{ productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }]);
    setPurchaseItems([{ productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }]);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    const normalizedItem = (activeTab === 'Sales' && item.status === 'Pending') ? { ...item, status: 'Due' } : item;
    setFormData({ ...normalizedItem });
    if (activeTab === 'Sales' && item.items) {
      setCartItems(item.items.map(i => ({
        productId: i.productId,
        qty: i.qty,
        customSellPrice: i.sellPrice,
        customProductPrice: i.originalPrice ?? i.sellPrice,
        categoryFilter: ''
      })));
    }
    if (activeTab === 'Purchases' && item.items) {
      setPurchaseItems(item.items.length > 0 ? item.items.map(i => ({
        productId: i.productId || '',
        productName: i.productName || '',
        category: i.category || '',
        qty: i.qty,
        unitCost: i.unitCost,
        receivedQty: i.receivedQty !== undefined ? i.receivedQty : i.qty,
        categoryFilter: '',
      })) : [{ productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }]);
    }
    setShowModal(true);
  };

  const handleCartChange = (index, field, value) => {
    const updatedCart = [...cartItems];
    updatedCart[index][field] = value;

    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === parseInt(value, 10));
      if (selectedProd) {
        updatedCart[index].customSellPrice = selectedProd.sellPrice;
        updatedCart[index].customProductPrice = selectedProd.sellPrice;
      }
    }
    if (field === 'categoryFilter') {
      // Switching category clears the previously chosen product for this row
      updatedCart[index].productId = '';
      updatedCart[index].customSellPrice = 0;
      updatedCart[index].customProductPrice = 0;
    }
    setCartItems(updatedCart);
  };

  const addCartRow = () => {
    setCartItems([...cartItems, { productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }]);
  };

  const removeCartRow = (index) => {
    if (cartItems.length > 1) {
      setCartItems(cartItems.filter((_, i) => i !== index));
    }
  };

  // --- Purchase item rows (multi-product purchases) ---
  const handlePurchaseItemChange = (index, field, value) => {
    const updated = [...purchaseItems];
    const wasFullyReceived = parseInt(updated[index].receivedQty, 10) >= (parseInt(updated[index].qty, 10) || 0);
    updated[index][field] = value;

    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === parseInt(value, 10));
      updated[index].productName = selectedProd ? selectedProd.name : '';
      updated[index].category = selectedProd ? selectedProd.category : '';
      if (selectedProd) updated[index].unitCost = selectedProd.buyPrice || updated[index].unitCost;
    }
    if (field === 'categoryFilter') {
      updated[index].productId = '';
      updated[index].productName = '';
    }
    // Keep receivedQty sane whenever the ordered qty changes: if the row was fully
    // received before, keep it fully received at the new qty (default assumption).
    // Otherwise just make sure receivedQty never exceeds the new ordered qty.
    if (field === 'qty') {
      const qtyNum = parseInt(value, 10) || 0;
      const prevReceived = parseInt(updated[index].receivedQty, 10) || 0;
      updated[index].receivedQty = wasFullyReceived ? qtyNum : Math.min(prevReceived, qtyNum);
    }
    setPurchaseItems(updated);
  };

  const addPurchaseItemRow = () => {
    setPurchaseItems([...purchaseItems, { productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }]);
  };

  const removePurchaseItemRow = (index) => {
    if (purchaseItems.length > 1) {
      setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    }
  };

  // Save Item Handler
  const handleSaveItem = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === 'Products') {
        const newStock = parseInt(formData.stock, 10) || 0;
        const reorderLevel = parseInt(formData.reorderLevel, 10) || 5;
        const productData = {
          name: formData.name,
          category: formData.category,
          buyPrice: parseFloat(formData.buyPrice) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          stock: newStock,
          reorderLevel,
        };

        if (editingItem) {
          const { error } = await supabase.from('products').update(dbMap.product.toDb(productData)).eq('id', editingItem.id);
          if (error) throw error;
          setProducts(products.map(p => p.id === editingItem.id ? { ...p, ...productData, id: editingItem.id } : p));
        } else {
          const { data, error } = await supabase.from('products').insert(dbMap.product.toDb(productData)).select().single();
          if (error) throw error;
          setProducts([dbMap.product.fromDb(data), ...products]);
        }

      } else if (activeTab === 'Sales') {
        // If editing, restore the stock that was originally deducted for this sale
        // so quantity checks and calculations are based on true available stock.
        let workingProducts = products;
        if (editingItem) {
          workingProducts = products.map(p => {
            const oldItem = editingItem.items.find(i => i.productId === p.id);
            return oldItem ? { ...p, stock: p.stock + oldItem.qty } : p;
          });
        }

        const processedItems = [];
        let subtotal = 0;
        let totalCostAmount = 0;
        let totalLineDiscount = 0;

        for (let item of cartItems) {
          const prod = workingProducts.find(p => p.id === parseInt(item.productId, 10));
          if (!prod) return alert("Please select a valid product for all rows.");
          const qty = parseInt(item.qty, 10) || 1;

          if (qty > prod.stock) {
            return alert(`Not enough stock for ${prod.name}. Available: ${prod.stock}`);
          }

          const originalPrice = parseFloat(item.customProductPrice) || prod.sellPrice;
          const customPrice = parseFloat(item.customSellPrice) || prod.sellPrice;
          const lineTotal = customPrice * qty;
          const lineCost = prod.buyPrice * qty;
          const lineDiscount = Math.max(0, originalPrice - customPrice) * qty;

          subtotal += lineTotal;
          totalCostAmount += lineCost;
          totalLineDiscount += lineDiscount;

          processedItems.push({
            productId: prod.id,
            productName: prod.name,
            qty: qty,
            buyPrice: prod.buyPrice,
            originalPrice: originalPrice,
            sellPrice: customPrice,
            lineDiscount: lineDiscount,
            lineTotal: lineTotal
          });
        }

        const discount = parseFloat(formData.discount) || 0;
        const totalSellAmount = subtotal - discount;
        const orderId = editingItem ? editingItem.id : `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

        const saleStatus = formData.status || 'Paid';
        let paidAmount;
        if (saleStatus === 'Paid') paidAmount = totalSellAmount;
        else if (saleStatus === 'Due') paidAmount = 0;
        else paidAmount = Math.min(parseFloat(formData.paidAmount) || 0, totalSellAmount); // Partial

        const saleRecord = {
          id: orderId,
          customer: formData.customer || 'Walk-in Customer',
          customerPhone: formData.customerPhone || '',
          customerAddress: formData.customerAddress || '',
          items: processedItems,
          subtotal: subtotal,
          discount: discount,
          totalSellAmount: totalSellAmount,
          totalCostAmount: totalCostAmount,
          status: saleStatus,
          paidAmount: paidAmount,
          date: formData.date || new Date().toISOString().split('T')[0]
        };

        // Auto-add this customer to the Customers list if they gave us details and
        // aren't already on file (matched by phone, or by name if no phone given).
        if (saleRecord.customer && saleRecord.customer !== 'Walk-in Customer') {
          const alreadyExists = customers.some(c =>
            (saleRecord.customerPhone && c.phone && c.phone === saleRecord.customerPhone) ||
            (!saleRecord.customerPhone && (c.name || '').toLowerCase() === saleRecord.customer.toLowerCase())
          );
          if (!alreadyExists) {
            const newCustomerData = {
              name: saleRecord.customer,
              email: '',
              phone: saleRecord.customerPhone || '',
              address: saleRecord.customerAddress || '',
            };
            const { data: newCustRow, error: custError } = await supabase
              .from('customers').insert(dbMap.customer.toDb(newCustomerData)).select().single();
            if (!custError && newCustRow) {
              setCustomers(prev => [...prev, dbMap.customer.fromDb(newCustRow)]);
            }
          }
        }

        // Build the list of { productId, newStock } for every product touched by this sale
        const stockUpdates = processedItems.map(item => {
          const prod = workingProducts.find(p => p.id === item.productId);
          return { productId: item.productId, newStock: Math.max(0, prod.stock - item.qty) };
        });

        if (editingItem) {
          const { error: saleError } = await supabase.from('sales').update(dbMap.sale.toDb(saleRecord)).eq('id', editingItem.id);
          if (saleError) throw saleError;

          const { error: txnError } = await supabase.from('transactions')
            .update({ amount: totalSellAmount, txn_date: saleRecord.date, status: saleRecord.status === 'Paid' ? 'Success' : 'Pending' })
            .eq('ref_id', editingItem.id);
          if (txnError) throw txnError;

          await Promise.all(stockUpdates.map(u => supabase.from('products').update({ stock: u.newStock }).eq('id', u.productId)));

          setSales(sales.map(s => s.id === editingItem.id ? saleRecord : s));
          setTransactions(prev => prev.map(t =>
            t.refId === editingItem.id || t.id === `TXN-${editingItem.id.replace('#', '')}`
              ? { ...t, amount: totalSellAmount, date: saleRecord.date, status: saleRecord.status === 'Paid' ? 'Success' : 'Pending' }
              : t
          ));
          setProducts(prev => prev.map(p => {
            const u = stockUpdates.find(s => s.productId === p.id);
            return u ? { ...p, stock: u.newStock } : p;
          }));
        } else {
          const { error: saleError } = await supabase.from('sales').insert(dbMap.sale.toDb(saleRecord));
          if (saleError) throw saleError;

          const autoTransaction = {
            id: `TXN-${orderId.replace('#', '')}`,
            refId: orderId,
            type: 'Income',
            amount: totalSellAmount,
            date: saleRecord.date,
            status: saleRecord.status === 'Paid' ? 'Success' : 'Pending'
          };
          const { error: txnError } = await supabase.from('transactions').insert(dbMap.transaction.toDb(autoTransaction));
          if (txnError) throw txnError;

          await Promise.all(stockUpdates.map(u => supabase.from('products').update({ stock: u.newStock }).eq('id', u.productId)));

          setSales([saleRecord, ...sales]);
          setProducts(prev => prev.map(p => {
            const u = stockUpdates.find(s => s.productId === p.id);
            return u ? { ...p, stock: u.newStock } : p;
          }));
          setTransactions([autoTransaction, ...transactions]);
        }

      } else if (activeTab === 'Categories') {
        if (editingItem) {
          const { error } = await supabase.from('categories').update(dbMap.category.toDb(formData)).eq('id', editingItem.id);
          if (error) throw error;
          setCategories(categories.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
        } else {
          const newCat = { ...formData, totalItems: 0 };
          const { data, error } = await supabase.from('categories').insert(dbMap.category.toDb(newCat)).select().single();
          if (error) throw error;
          setCategories([...categories, dbMap.category.fromDb(data)]);
        }
      } else if (activeTab === 'Customers') {
        if (editingItem) {
          const { error } = await supabase.from('customers').update(dbMap.customer.toDb(formData)).eq('id', editingItem.id);
          if (error) throw error;
          setCustomers(customers.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
        } else {
          const { data, error } = await supabase.from('customers').insert(dbMap.customer.toDb(formData)).select().single();
          if (error) throw error;
          setCustomers([...customers, dbMap.customer.fromDb(data)]);
        }
      } else if (activeTab === 'Suppliers') {
        if (editingItem) {
          const { error } = await supabase.from('suppliers').update(dbMap.supplier.toDb(formData)).eq('id', editingItem.id);
          if (error) throw error;
          setSuppliers(suppliers.map(s => s.id === editingItem.id ? { ...s, ...formData } : s));
        } else {
          const { data, error } = await supabase.from('suppliers').insert(dbMap.supplier.toDb(formData)).select().single();
          if (error) throw error;
          setSuppliers([...suppliers, dbMap.supplier.fromDb(data)]);
        }
      } else if (activeTab === 'Damaged') {
        const prod = products.find(p => p.id === parseInt(formData.productId, 10));
        if (!prod) return alert('Please select a valid product.');
        const qty = parseInt(formData.qty, 10) || 1;
        const entryType = formData.type || 'Inventory Damage';
        const isInventoryDamage = entryType === 'Inventory Damage';

        if (entryType === 'After-Sales Service' && (!formData.customerName || !formData.customerPhone)) {
          return alert('Please enter the customer name and phone number.');
        }

        // When editing, restore any previously-deducted qty first so the stock check is accurate
        // (only relevant for Inventory Damage entries — After-Sales Service never touched stock)
        const previouslyDeducted = (editingItem && editingItem.type !== 'After-Sales Service' && editingItem.productId === prod.id)
          ? (parseInt(editingItem.qty, 10) || 0) : 0;
        const availableStock = prod.stock + previouslyDeducted;

        if (isInventoryDamage && qty > availableStock) {
          return alert(`Not enough stock for ${prod.name}. Available: ${availableStock}`);
        }

        const damagedRecord = {
          productId: prod.id,
          productName: prod.name,
          qty,
          reason: formData.reason || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          type: entryType,
          customerName: entryType === 'After-Sales Service' ? (formData.customerName || '') : '',
          customerPhone: entryType === 'After-Sales Service' ? (formData.customerPhone || '') : '',
        };

        const newStock = isInventoryDamage ? availableStock - qty : prod.stock;

        if (editingItem) {
          const { error } = await supabase.from('damaged_products').update(dbMap.damaged.toDb(damagedRecord)).eq('id', editingItem.id);
          if (error) throw error;
          setDamagedProducts(damagedProducts.map(d => d.id === editingItem.id ? { ...damagedRecord, id: editingItem.id } : d));
        } else {
          const { data, error } = await supabase.from('damaged_products').insert(dbMap.damaged.toDb(damagedRecord)).select().single();
          if (error) throw error;
          setDamagedProducts([dbMap.damaged.fromDb(data), ...damagedProducts]);
        }

        if (isInventoryDamage || previouslyDeducted > 0) {
          await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
          setProducts(products.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
        }

      } else if (activeTab === 'Purchases') {
        if (!formData.supplier) return alert('Please select a supplier.');

        // Build the line items: each row can be a catalog product or a free-text
        // description, with its own ordered qty vs receivedQty (partial delivery support).
        const processedItems = [];
        let totalAmount = 0;
        for (let row of purchaseItems) {
          const prod = row.productId ? products.find(p => p.id === parseInt(row.productId, 10)) : null;
          const qty = parseInt(row.qty, 10) || 0;
          if (qty <= 0) return alert('Enter a valid quantity for every item.');
          if (!prod && !row.productName) return alert('Select a product or enter an item description for every row.');
          const unitCost = parseFloat(row.unitCost) || 0;
          let receivedQty = row.receivedQty === '' || row.receivedQty === undefined || row.receivedQty === null
            ? qty : parseInt(row.receivedQty, 10);
          if (isNaN(receivedQty) || receivedQty < 0) receivedQty = 0;
          if (receivedQty > qty) receivedQty = qty;
          const lineTotal = unitCost * qty;
          totalAmount += lineTotal;
          processedItems.push({
            productId: prod ? prod.id : null,
            productName: prod ? prod.name : row.productName,
            category: prod ? prod.category : (row.category || ''),
            qty, unitCost, receivedQty, lineTotal,
          });
        }

        // If the user opted to roll a previous outstanding balance from this same
        // supplier into this purchase, fold it into the total and settle the old entries.
        const priorDuePurchases = purchases.filter(p => p.supplier === formData.supplier && p.id !== editingItem?.id && (p.dueAmount ?? Math.max(0, p.totalAmount - p.paidAmount)) > 0);
        const priorDueTotal = priorDuePurchases.reduce((sum, p) => sum + (p.dueAmount ?? Math.max(0, p.totalAmount - p.paidAmount)), 0);
        const rollingOverDue = formData.rollPreviousDue && priorDueTotal > 0;
        if (rollingOverDue) {
          totalAmount += priorDueTotal;
        }

        const paidAmount = Math.min(parseFloat(formData.paidAmount) || 0, totalAmount);
        const status = paidAmount <= 0 ? 'Due' : paidAmount >= totalAmount ? 'Paid' : 'Partial';
        const purchaseId = editingItem ? editingItem.id : `#PUR-${Math.floor(1000 + Math.random() * 9000)}`;
        const fullyReceived = processedItems.every(i => i.receivedQty >= i.qty);

        const purchaseRecord = {
          id: purchaseId,
          supplier: formData.supplier,
          items: processedItems,
          totalAmount, paidAmount, status, received: fullyReceived,
          date: formData.date || new Date().toISOString().split('T')[0],
        };

        if (editingItem) {
          const { error } = await supabase.from('purchases').update(dbMap.purchase.toDb(purchaseRecord)).eq('id', editingItem.id);
          if (error) throw error;
          setPurchases(purchases.map(p => p.id === editingItem.id ? { ...purchaseRecord, dueAmount: Math.max(0, totalAmount - paidAmount) } : p));
        } else {
          const { error } = await supabase.from('purchases').insert(dbMap.purchase.toDb(purchaseRecord));
          if (error) throw error;
          setPurchases([{ ...purchaseRecord, dueAmount: Math.max(0, totalAmount - paidAmount) }, ...purchases]);
        }

        // Settle the old due purchases from this supplier now that their balance has
        // been folded into the new record, so they no longer double-count on the Due Amounts page.
        if (rollingOverDue) {
          await Promise.all(priorDuePurchases.map(p =>
            supabase.from('purchases').update({ paid_amount: p.totalAmount, status: 'Paid' }).eq('id', p.id)
          ));
          setPurchases(prev => prev.map(p =>
            priorDuePurchases.some(pd => pd.id === p.id)
              ? { ...p, paidAmount: p.totalAmount, dueAmount: 0, status: 'Paid' }
              : p
          ));
        }

        // Whatever quantity actually arrived goes straight into stock, automatically —
        // only for brand-new purchases, and only the receivedQty of each item (not the
        // full ordered qty), so an item the vendor only part-shipped doesn't overcredit
        // stock. Later batches of the same purchase are received from the Advance
        // Payments page instead, which applies its own stock delta — this keeps stock
        // changes from ever double-counting on a subsequent edit of this purchase.
        if (!editingItem) {
          const deltaByProduct = {};
          processedItems.forEach(i => {
            if (i.productId && i.receivedQty > 0) {
              deltaByProduct[i.productId] = (deltaByProduct[i.productId] || 0) + i.receivedQty;
            }
          });
          const ids = Object.keys(deltaByProduct);
          if (ids.length) {
            await Promise.all(ids.map(pid => {
              const prod = products.find(p => p.id === parseInt(pid, 10));
              if (!prod) return null;
              return supabase.from('products').update({ stock: prod.stock + deltaByProduct[pid] }).eq('id', prod.id);
            }));
            setProducts(prev => prev.map(p => deltaByProduct[p.id] ? { ...p, stock: p.stock + deltaByProduct[p.id] } : p));
          }
        }

      } else if (activeTab === 'Transactions') {
        if (editingItem) {
          const updated = { ...editingItem, ...formData, amount: parseFloat(formData.amount) };
          const { error } = await supabase.from('transactions').update(dbMap.transaction.toDb(updated)).eq('id', editingItem.id);
          if (error) throw error;
          setTransactions(transactions.map(t => t.id === editingItem.id ? updated : t));
        } else {
          const newTxn = {
            id: `TXN-${Math.floor(100 + Math.random() * 900)}`,
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date().toISOString().split('T')[0]
          };
          const { error } = await supabase.from('transactions').insert(dbMap.transaction.toDb(newTxn));
          if (error) throw error;
          setTransactions([newTxn, ...transactions]);
        }
      }

      setFormData({});
      setShowModal(false);
    } catch (err) {
      alert('Could not save — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  // Receive some or all of the still-pending quantity for one line item of a purchase.
  // Vendors often deliver in batches, so this asks how many units just arrived (defaulting
  // to the full pending amount) rather than assuming the whole order showed up at once.
  const handleReceivePurchaseItem = (purchase, itemIndex) => {
    const item = purchase.items[itemIndex];
    if (!item) return;
    const pendingQty = item.qty - (item.receivedQty || 0);
    if (pendingQty <= 0) return;

    setReceiveModal({ purchase, itemIndex, item, pendingQty });
    setReceiveQtyInput(String(pendingQty));
  };

  const submitReceivePurchaseItem = async (e) => {
    e.preventDefault();
    if (!receiveModal) return;
    const { purchase, itemIndex, item, pendingQty } = receiveModal;

    let receiveNow = parseInt(receiveQtyInput, 10);
    if (isNaN(receiveNow) || receiveNow <= 0) return alert('Enter a valid quantity greater than 0.');
    if (receiveNow > pendingQty) receiveNow = pendingQty;

    const updatedItems = purchase.items.map((it, idx) =>
      idx === itemIndex ? { ...it, receivedQty: (it.receivedQty || 0) + receiveNow } : it
    );
    const fullyReceived = updatedItems.every(i => i.receivedQty >= i.qty);

    try {
      const { error } = await supabase.from('purchases').update({ items: updatedItems, received: fullyReceived }).eq('id', purchase.id);
      if (error) throw error;
      setPurchases(prev => prev.map(p => p.id === purchase.id ? { ...p, items: updatedItems, received: fullyReceived } : p));

      if (item.productId) {
        const prod = products.find(pr => pr.id === item.productId);
        if (prod) {
          const newStock = prod.stock + receiveNow;
          const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
          if (stockError) throw stockError;
          setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
        }
      }
      setReceiveModal(null);
      setReceiveQtyInput('');
    } catch (err) {
      alert('Could not update — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const tableMap = { Products: 'products', Sales: 'sales', Categories: 'categories', Customers: 'customers', Suppliers: 'suppliers', Transactions: 'transactions', Damaged: 'damaged_products', Purchases: 'purchases' };

      if (type === 'Sales') {
        // Put the sold quantities back into inventory before removing the sale record.
        const saleToDelete = sales.find(s => s.id === id);
        if (saleToDelete) {
          const restoredProducts = products.map(p => {
            const soldItem = saleToDelete.items.find(i => i.productId === p.id);
            return soldItem ? { ...p, stock: p.stock + soldItem.qty } : p;
          });
          await Promise.all(
            saleToDelete.items.map(i => {
              const restored = restoredProducts.find(p => p.id === i.productId);
              return restored ? supabase.from('products').update({ stock: restored.stock }).eq('id', i.productId) : null;
            })
          );
          setProducts(restoredProducts);
        }
      }

      if (type === 'Damaged') {
        // Put the deducted quantity back into inventory — but only if this entry
        // actually deducted stock in the first place (Inventory Damage, not After-Sales Service).
        const entryToDelete = damagedProducts.find(d => d.id === id);
        if (entryToDelete && entryToDelete.productId && entryToDelete.type !== 'After-Sales Service') {
          const prod = products.find(p => p.id === entryToDelete.productId);
          if (prod) {
            const restoredStock = prod.stock + (parseInt(entryToDelete.qty, 10) || 0);
            await supabase.from('products').update({ stock: restoredStock }).eq('id', prod.id);
            setProducts(products.map(p => p.id === prod.id ? { ...p, stock: restoredStock } : p));
          }
        }
      }

      const { error } = await supabase.from(tableMap[type]).delete().eq('id', id);
      if (error) throw error;

      if (type === 'Products') setProducts(products.filter(p => p.id !== id));
      if (type === 'Sales') {
        // The matching transaction is deleted via ref_id in the DB automatically? No —
        // sales and transactions are separate tables, so remove the linked transaction too.
        await supabase.from('transactions').delete().eq('ref_id', id);
        setSales(sales.filter(s => s.id !== id));
        setTransactions(transactions.filter(t => t.refId !== id && t.id !== `TXN-${id.replace('#', '')}`));
      }
      if (type === 'Categories') setCategories(categories.filter(c => c.id !== id));
      if (type === 'Customers') setCustomers(customers.filter(c => c.id !== id));
      if (type === 'Suppliers') setSuppliers(suppliers.filter(s => s.id !== id));
      if (type === 'Transactions') setTransactions(transactions.filter(t => t.id !== id));
      if (type === 'Damaged') setDamagedProducts(damagedProducts.filter(d => d.id !== id));
      if (type === 'Purchases') setPurchases(purchases.filter(p => p.id !== id));
    } catch (err) {
      alert('Could not delete — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handleResetAllData = async () => {
    if (!window.confirm("This will permanently delete ALL your shop data — products, sales, customers, everything — from the cloud database. This cannot be undone. Consider exporting a backup first. Continue?")) return;
    if (!window.confirm("Are you absolutely sure? This is your last chance to cancel.")) return;
    try {
      await Promise.all([
        supabase.from('sales').delete().gte('created_at', '1900-01-01'),
        supabase.from('transactions').delete().gte('created_at', '1900-01-01'),
        supabase.from('products').delete().gte('created_at', '1900-01-01'),
        supabase.from('categories').delete().gte('created_at', '1900-01-01'),
        supabase.from('customers').delete().gte('created_at', '1900-01-01'),
        supabase.from('suppliers').delete().gte('created_at', '1900-01-01'),
      ]);
      setSales([]); setTransactions([]); setProducts([]); setCategories([]); setCustomers([]); setSuppliers([]);
      alert('All shop data has been reset.');
    } catch (err) {
      alert('Could not reset data — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- FREE BACKUP: Export all app data to a JSON file the user saves themselves ---
  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      shopName: shopSettings.shopName,
      categories,
      products,
      sales,
      customers,
      suppliers,
      transactions,
      shopSettings
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `${(shopSettings.shopName || 'shop').replace(/\s+/g, '_')}_backup_${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- FREE RESTORE: Import a previously exported JSON backup file ---
  const handleImportData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        const looksValid = data && (
          Array.isArray(data.products) || Array.isArray(data.sales) ||
          Array.isArray(data.categories) || Array.isArray(data.customers) ||
          Array.isArray(data.suppliers) || Array.isArray(data.transactions)
        );
        if (!looksValid) {
          alert('This file does not look like a valid backup. Import cancelled.');
          return;
        }

        if (!window.confirm('Importing will REPLACE all your current cloud data with this backup file (existing data will be deleted first). Continue?')) {
          return;
        }

        // Wipe existing cloud data first, same as a full reset
        await Promise.all([
          supabase.from('sales').delete().gte('created_at', '1900-01-01'),
          supabase.from('transactions').delete().gte('created_at', '1900-01-01'),
          supabase.from('products').delete().gte('created_at', '1900-01-01'),
          supabase.from('categories').delete().gte('created_at', '1900-01-01'),
          supabase.from('customers').delete().gte('created_at', '1900-01-01'),
          supabase.from('suppliers').delete().gte('created_at', '1900-01-01'),
        ]);

        let newCategories = [], newProducts = [], newCustomers = [], newSuppliers = [], newSales = [], newTransactions = [];
        const productIdMap = {}; // old product id (from the backup file) -> new DB-generated id

        if (Array.isArray(data.categories) && data.categories.length) {
          const { data: inserted, error } = await supabase.from('categories').insert(data.categories.map(dbMap.category.toDb)).select();
          if (error) throw error;
          newCategories = inserted.map(dbMap.category.fromDb);
        }

        if (Array.isArray(data.products) && data.products.length) {
          const { data: inserted, error } = await supabase.from('products').insert(data.products.map(dbMap.product.toDb)).select();
          if (error) throw error;
          data.products.forEach((oldP, idx) => { productIdMap[oldP.id] = inserted[idx].id; });
          newProducts = inserted.map(dbMap.product.fromDb);
        }

        if (Array.isArray(data.customers) && data.customers.length) {
          const { data: inserted, error } = await supabase.from('customers').insert(data.customers.map(dbMap.customer.toDb)).select();
          if (error) throw error;
          newCustomers = inserted.map(dbMap.customer.fromDb);
        }

        if (Array.isArray(data.suppliers) && data.suppliers.length) {
          const { data: inserted, error } = await supabase.from('suppliers').insert(data.suppliers.map(dbMap.supplier.toDb)).select();
          if (error) throw error;
          newSuppliers = inserted.map(dbMap.supplier.fromDb);
        }

        if (Array.isArray(data.sales) && data.sales.length) {
          // Re-point each sale's line items at the newly generated product ids
          const remappedSales = data.sales.map(s => ({
            ...s,
            items: (s.items || []).map(i => ({ ...i, productId: productIdMap[i.productId] ?? i.productId })),
          }));
          const { error } = await supabase.from('sales').insert(remappedSales.map(dbMap.sale.toDb));
          if (error) throw error;
          newSales = remappedSales;
        }

        if (Array.isArray(data.transactions) && data.transactions.length) {
          const { error } = await supabase.from('transactions').insert(data.transactions.map(dbMap.transaction.toDb));
          if (error) throw error;
          newTransactions = data.transactions;
        }

        setCategories(newCategories);
        setProducts(newProducts);
        setCustomers(newCustomers);
        setSuppliers(newSuppliers);
        setSales(newSales);
        setTransactions(newTransactions);

        if (data.shopSettings) {
          const merged = { ...defaultSettings, ...data.shopSettings };
          await supabase.from('shop_settings').upsert({ user_id: session.user.id, ...dbMap.settings.toDb(merged) });
          setShopSettings(merged);
          setSettingsForm(merged);
        }

        alert('Backup restored successfully to your cloud database!');
      } catch (err) {
        alert('Could not import backup — ' + (err.message || 'please check the file and your internet connection.'));
      }
    };
    reader.readAsText(file);
    // Reset the input so importing the same file again re-triggers onChange
    e.target.value = '';
  };

  // Calculations
  const totalSellAmount = sales.reduce((sum, sale) => sum + sale.totalSellAmount, 0);
  const costOfGoodsSold = sales.reduce((sum, sale) => sum + sale.totalCostAmount, 0);
  const netProfit = totalSellAmount - costOfGoodsSold;
  const currentInventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= (p.reorderLevel || 5));

  // Safe lookup map used by the generic tables instead of eval()
  const genericDataMap = { categories, customers, suppliers, transactions, damaged: damagedProducts, purchases };

  // --- Due Amounts: customer dues come from sales that aren't fully paid,
  // vendor dues come from purchases that aren't fully paid to the supplier. ---
  const customerDues = sales
    .map(s => ({ ...s, dueAmount: Math.max(0, s.totalSellAmount - (s.paidAmount ?? (s.status === 'Paid' ? s.totalSellAmount : 0))) }))
    .filter(s => s.dueAmount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalCustomerDue = customerDues.reduce((sum, s) => sum + s.dueAmount, 0);

  const vendorDues = purchases
    .map(p => ({ ...p, dueAmount: p.dueAmount ?? Math.max(0, p.totalAmount - p.paidAmount) }))
    .filter(p => p.dueAmount > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalVendorDue = vendorDues.reduce((sum, p) => sum + p.dueAmount, 0);

  // --- Advance Payments: individual line items that are still owed by a supplier —
  // one purchase can have some items fully delivered and others still pending, so this
  // is flattened per item rather than per whole purchase. ---
  const pendingDeliveries = purchases
    .flatMap(p => (p.items || []).map((item, itemIndex) => ({ purchase: p, item, itemIndex, pendingQty: item.qty - (item.receivedQty || 0) })))
    .filter(x => x.pendingQty > 0)
    .sort((a, b) => new Date(b.purchase.date) - new Date(a.purchase.date));
  const totalAdvancePaid = pendingDeliveries.reduce((sum, x) => sum + x.pendingQty * x.item.unitCost, 0);
  const filteredPendingDeliveries = pendingDeliveries.filter(({ purchase, item }) =>
    !currentSearch ||
    (purchase.id || '').toLowerCase().includes(currentSearch) ||
    (purchase.supplier || '').toLowerCase().includes(currentSearch) ||
    (item.productName || '').toLowerCase().includes(currentSearch)
  );

  // --- Search filtering, applied per active tab ---
  const filteredProducts = products.filter(p =>
    (!currentSearch || p.name.toLowerCase().includes(currentSearch) || (p.category || '').toLowerCase().includes(currentSearch)) &&
    (!productCategoryFilter || p.category === productCategoryFilter)
  );
  const purchaseItemsSummary = (p) => (p.items || []).map(i => i.productName).join(', ');
  const filteredPurchases = (purchases || []).filter(p =>
    !currentSearch ||
    (p.id || '').toLowerCase().includes(currentSearch) ||
    (p.supplier || '').toLowerCase().includes(currentSearch) ||
    purchaseItemsSummary(p).toLowerCase().includes(currentSearch)
  );
  // Products grouped by category, for the category-wise browsing view
  const productsByCategory = filteredProducts.reduce((acc, p) => {
    const key = p.category || 'Uncategorized';
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});
  const filteredSales = sales.filter(s =>
    !currentSearch ||
    s.id.toLowerCase().includes(currentSearch) ||
    (s.customer || '').toLowerCase().includes(currentSearch) ||
    (s.customerPhone || '').toLowerCase().includes(currentSearch)
  );
  const filteredGenericRows = (list) => (list || []).filter(item =>
    !currentSearch || Object.values(item).some(v => String(v).toLowerCase().includes(currentSearch))
  );

  // --- Dashboard insights ---
  const bestSellers = (() => {
    const totalsByProduct = {};
    sales.forEach(s => s.items.forEach(i => {
      totalsByProduct[i.productId] = totalsByProduct[i.productId] || { name: i.productName, qty: 0, revenue: 0 };
      totalsByProduct[i.productId].qty += i.qty;
      totalsByProduct[i.productId].revenue += i.lineTotal;
    }));
    return Object.values(totalsByProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);
  })();

  const recentSales = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const navItems = [
    { name: 'Dashboard', icon: Home }, { name: 'Products', icon: Box },
    { name: 'Categories', icon: Layers }, { name: 'Inventory', icon: Warehouse },
    { name: 'Sales', icon: ShoppingCart }, { name: 'Purchases', icon: PackagePlus },
    { name: 'Advance Payments', icon: PackageOpen },
    { name: 'Damaged', icon: AlertTriangle },
    { name: 'Customers', icon: Users },
    { name: 'Suppliers', icon: Truck }, { name: 'Transactions', icon: ArrowLeftRight },
    { name: 'Due Amounts', icon: Wallet },
    { name: 'Reports', icon: PieChart }, { name: 'Settings', icon: Settings }
  ];

  // --- Auth gate: show loading, then login screen, then the real app ---
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen shopName={defaultSettings.shopName} />;
  }

  if (dataLoading && products.length === 0 && sales.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-950">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        <p className="text-sm text-slate-400">Loading your shop data...</p>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark' : ''} bg-[var(--bg-page)] text-[var(--text-primary)] font-sans transition-colors duration-300`}>
      
      {/* Theming variables + Printable Invoice Specific CSS */}
      <style>{`
        :root {
          --bg-page: #f8fafc;
          --bg-card: #ffffff;
          --bg-sidebar: #0f172a;
          --bg-hover: #f8fafc;
          --border-card: #e2e8f0;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --text-muted: #94a3b8;
          --input-bg: #ffffff;
          --input-border: #cbd5e1;
        }
        .dark {
          --bg-page: #0a0f1c;
          --bg-card: #121a2b;
          --bg-sidebar: #060a13;
          --bg-hover: #1a2338;
          --border-card: #232f47;
          --text-primary: #f1f5f9;
          --text-secondary: #b3bfd1;
          --text-muted: #6b7a94;
          --input-bg: #0f1830;
          --input-border: #2c3a56;
        }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tab-enter { animation: fadeSlideIn 0.25s ease-out; }

        /* Sales receipts print small, on a thermal-receipt roll. Supplier invoices print
           big, full-page — so the two use separate named @page sizes. */
        @page { size: A4; margin: 12mm; }
        @page pos-receipt { size: 2.5in auto; margin: 2mm; }

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-modal, #printable-invoice-modal *,
          #printable-purchase-modal, #printable-purchase-modal * {
            visibility: visible;
          }
          #printable-invoice-modal {
            page: pos-receipt;
            position: absolute;
            left: 0;
            top: 0;
            width: 2.5in !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          #printable-purchase-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Sidebar Navigation */}
      <aside className="w-72 bg-[var(--bg-sidebar)] text-white flex flex-col p-6 shrink-0 no-print transition-colors duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-900/30">
            {(shopSettings.shopName || 'S').charAt(0)}
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-white leading-tight">{shopSettings.shopName}</h2>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Electronics</p>
          </div>
        </div>
        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setShowModal(false); }}
                className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-300" />}
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === 'Inventory' && lowStockProducts.length > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="mt-4 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-all"
        >
          <span className="flex items-center gap-2.5">
            {isDarkMode ? <Moon className="w-4 h-4 text-orange-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </span>
          <span className={`relative w-9 h-5 rounded-full transition-colors ${isDarkMode ? 'bg-orange-500' : 'bg-slate-600'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isDarkMode ? 'translate-x-4' : ''}`} />
          </span>
        </button>

        {/* Logged-in user + Logout */}
        <div className="mt-2 flex items-center justify-between gap-2 px-4 py-2">
          <span className="text-[11px] text-slate-500 truncate">{session?.user?.email}</span>
          <button onClick={handleLogout} title="Sign out" className="text-slate-400 hover:text-red-400 transition-colors shrink-0">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main key={activeTab} className="tab-enter flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 no-print gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">{activeTab}</h1>
            <p className="text-xs text-[var(--text-muted)] font-medium">{shopSettings.shopName} Management System</p>
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'Products' && (
              <div className="relative">
                <Tag className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all appearance-none"
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            {['Products', 'Categories', 'Sales', 'Purchases', 'Damaged', 'Customers', 'Suppliers', 'Transactions', 'Advance Payments'].includes(activeTab) && (
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={searchQueries[activeTab] || ''}
                  onChange={(e) => setCurrentSearch(e.target.value)}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  className="pl-9 pr-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm w-56 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                />
              </div>
            )}
            {['Products', 'Categories', 'Sales', 'Purchases', 'Damaged', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
              <button 
                onClick={handleOpenAdd}
                className="bg-orange-500 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Add New {activeTab === 'Sales' ? 'Sale' : activeTab === 'Damaged' ? 'Damage Entry' : activeTab.slice(0, -1)}
              </button>
            )}
          </div>
        </div>

        {/* Low Stock Banner */}
        {lowStockProducts.length > 0 && (activeTab === 'Dashboard' || activeTab === 'Inventory') && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4 no-print">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-amber-900 font-bold text-base">Low Stock Alert ({lowStockProducts.length} Items Below Threshold)</h4>
              <p className="text-amber-700 text-sm mt-1">
                The following products need restocking: {lowStockProducts.map(p => `${p.name} (${p.stock} left)`).join(', ')}.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className={`bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] transition-colors ${activeTab === 'Sales' ? 'w-[700px]' : 'w-[480px]'}`}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingItem ? 'Edit' : 'Add New'} {activeTab === 'Damaged' ? 'Damage Entry' : activeTab.slice(0, -1)}</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
                {activeTab === 'Products' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Product Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <select required name="category" defaultValue={formData.category || ''} onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-4">
                      <input required name="buyPrice" type="number" step="0.01" defaultValue={formData.buyPrice || ''} placeholder="Buy Price (Tk)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <div className="relative">
                        <input
                          required name="sellPrice" type="number" step="50"
                          value={formData.sellPrice ?? ''}
                          placeholder="Sell Price (Tk)"
                          onChange={handleInputChange}
                          className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 pr-16 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <div className="absolute right-1.5 top-1.5 bottom-1.5 flex flex-col">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, sellPrice: (parseFloat(formData.sellPrice) || 0) + 50 })}
                            className="flex-1 px-1.5 text-[10px] font-bold text-orange-500 hover:text-orange-600 leading-none"
                            title="Increase by 50"
                          >▲</button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, sellPrice: Math.max(0, (parseFloat(formData.sellPrice) || 0) - 50) })}
                            className="flex-1 px-1.5 text-[10px] font-bold text-orange-500 hover:text-orange-600 leading-none"
                            title="Decrease by 50"
                          >▼</button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <input required name="stock" type="number" defaultValue={formData.stock !== undefined ? formData.stock : ''} placeholder="Current Stock" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input required name="reorderLevel" type="number" defaultValue={formData.reorderLevel !== undefined ? formData.reorderLevel : ''} placeholder="Reorder Level" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </>
                )}

                {activeTab === 'Sales' && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input required name="customer" defaultValue={formData.customer || ''} placeholder="Customer Name" onChange={handleInputChange} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input name="customerPhone" defaultValue={formData.customerPhone || ''} placeholder="Customer Phone" onChange={handleInputChange} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <input name="customerAddress" defaultValue={formData.customerAddress || ''} placeholder="Customer Address" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      <label className="font-bold text-[var(--text-secondary)]">Products in Order:</label>
                      {cartItems.map((item, idx) => {
                        const rowProducts = item.categoryFilter ? products.filter(p => p.category === item.categoryFilter) : products;
                        const lineDiscount = Math.max(0, (parseFloat(item.customProductPrice) || 0) - (parseFloat(item.customSellPrice) || 0));
                        return (
                        <div key={idx} className="bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-card)] space-y-2">
                          <div className="flex gap-2 items-center">
                            <select
                              value={item.categoryFilter}
                              onChange={(e) => handleCartChange(idx, 'categoryFilter', e.target.value)}
                              title="Filter by category"
                              className="w-32 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                              <option value="">All Categories</option>
                              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <select 
                              required 
                              value={item.productId}
                              onChange={(e) => handleCartChange(idx, 'productId', e.target.value)} 
                              className="flex-1 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            >
                              <option value="">Select Product...</option>
                              {rowProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                            </select>
                            <input 
                              required 
                              type="number" 
                              placeholder="Qty" 
                              value={item.qty} 
                              min="1"
                              onChange={(e) => handleCartChange(idx, 'qty', e.target.value)} 
                              className="w-16 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-400" 
                            />
                            {cartItems.length > 1 && (
                              <button type="button" onClick={() => removeCartRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2 items-center pl-1">
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Product Price</label>
                              <input 
                                required 
                                type="number" 
                                step="0.01"
                                placeholder="Product Price" 
                                value={item.customProductPrice} 
                                onChange={(e) => handleCartChange(idx, 'customProductPrice', e.target.value)} 
                                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-400" 
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Sell Price</label>
                              <input 
                                required 
                                type="number" 
                                step="0.01"
                                placeholder="Sell Price" 
                                value={item.customSellPrice} 
                                onChange={(e) => handleCartChange(idx, 'customSellPrice', e.target.value)} 
                                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-400" 
                              />
                            </div>
                            {lineDiscount > 0 && (
                              <span className="shrink-0 self-end mb-1.5 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-lg">
                                <BadgePercent className="w-3 h-3" /> Tk {lineDiscount.toLocaleString()} off
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={addCartRow} className="text-orange-600 font-bold text-xs flex items-center gap-1 hover:underline pt-1">
                      <Plus className="w-4 h-4" /> Add Another Item
                    </button>
                    <div className="flex gap-4 pt-2">
                      <input name="discount" type="number" defaultValue={formData.discount || ''} placeholder="Extra Discount (Tk)" onChange={handleInputChange} className="w-1/2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <select name="status" defaultValue={formData.status || 'Paid'} onChange={handleInputChange} className="w-1/2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="Paid">Paid in Full</option>
                        <option value="Partial">Partially Paid (Half Due)</option>
                        <option value="Due">Fully Due / Pending</option>
                      </select>
                    </div>
                    {formData.status === 'Partial' && (
                      <input
                        name="paidAmount" type="number" step="0.01" defaultValue={formData.paidAmount || ''}
                        placeholder="Amount Paid Now (Tk)" onChange={handleInputChange}
                        className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    )}
                  </>
                )}

                {activeTab === 'Categories' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Category Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input required name="description" defaultValue={formData.description || ''} placeholder="Description" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </>
                )}

                {activeTab === 'Customers' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Full Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input required name="email" type="email" defaultValue={formData.email || ''} placeholder="Email Address" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="phone" defaultValue={formData.phone || ''} placeholder="Phone Number" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="address" defaultValue={formData.address || ''} placeholder="Address" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </>
                )}

                {activeTab === 'Suppliers' && (
                  <>
                    <input required name="company" defaultValue={formData.company || ''} placeholder="Company Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input required name="contact" defaultValue={formData.contact || ''} placeholder="Contact Person" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="email" defaultValue={formData.email || ''} placeholder="Email Address" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="phone" defaultValue={formData.phone || ''} placeholder="Phone Number" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </>
                )}

                {activeTab === 'Purchases' && (
                  <>
                    <select
                      required name="supplier" defaultValue={formData.supplier || ''}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => <option key={s.id} value={s.company}>{s.company}</option>)}
                    </select>
                    {suppliers.length === 0 && (
                      <p className="text-xs text-amber-600">You don't have any suppliers yet — add one on the Suppliers tab first, then come back here.</p>
                    )}

                    {(() => {
                      const existingSupplierDue = formData.supplier
                        ? purchases
                            .filter(p => p.supplier === formData.supplier && p.id !== editingItem?.id)
                            .reduce((sum, p) => sum + (p.dueAmount ?? Math.max(0, p.totalAmount - p.paidAmount)), 0)
                        : 0;
                      if (existingSupplierDue <= 0) return null;
                      return (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                          <p className="text-xs text-amber-800">
                            <span className="font-bold">{formData.supplier}</span> already has <span className="font-bold">Tk {existingSupplierDue.toLocaleString()}</span> due from earlier purchases.
                          </p>
                          <label className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                            <input
                              type="checkbox" checked={!!formData.rollPreviousDue}
                              onChange={(e) => setFormData({ ...formData, rollPreviousDue: e.target.checked })}
                              className="w-4 h-4 accent-amber-600"
                            />
                            Add that Tk {existingSupplierDue.toLocaleString()} to this purchase's total (marks the old due as settled)
                          </label>
                        </div>
                      );
                    })()}

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      <label className="font-bold text-[var(--text-secondary)]">Products in this Purchase:</label>
                      {purchaseItems.map((row, idx) => {
                        const rowProducts = row.categoryFilter ? products.filter(p => p.category === row.categoryFilter) : products;
                        const qtyNum = parseInt(row.qty, 10) || 0;
                        const receivedNum = row.receivedQty === '' || row.receivedQty === undefined ? qtyNum : (parseInt(row.receivedQty, 10) || 0);
                        const pendingNum = Math.max(0, qtyNum - receivedNum);
                        return (
                          <div key={idx} className="bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-card)] space-y-2">
                            <div className="flex gap-2 items-center">
                              <select
                                value={row.categoryFilter}
                                onChange={(e) => handlePurchaseItemChange(idx, 'categoryFilter', e.target.value)}
                                title="Filter by category"
                                className="w-32 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                              <select
                                value={row.productId}
                                onChange={(e) => handlePurchaseItemChange(idx, 'productId', e.target.value)}
                                className="flex-1 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              >
                                <option value="">Not in Products list...</option>
                                {rowProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                              </select>
                              {purchaseItems.length > 1 && (
                                <button type="button" onClick={() => removePurchaseItemRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {!row.productId && (
                              <input
                                required
                                value={row.productName}
                                onChange={(e) => handlePurchaseItemChange(idx, 'productName', e.target.value)}
                                placeholder="Item description (if not in your Products list)"
                                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            )}
                            <div className="flex gap-2 items-center pl-1">
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Ordered Qty</label>
                                <input
                                  required type="number" min="1" value={row.qty}
                                  onChange={(e) => handlePurchaseItemChange(idx, 'qty', e.target.value)}
                                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Unit Cost (Tk)</label>
                                <input
                                  required type="number" step="0.01" value={row.unitCost}
                                  onChange={(e) => handlePurchaseItemChange(idx, 'unitCost', e.target.value)}
                                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-400"
                                />
                              </div>
                            </div>
                            <div className="pl-1">
                              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Received Qty Now (leave lower than Ordered if the vendor only sent part)</label>
                              <input
                                type="number" min="0" max={qtyNum || undefined} value={row.receivedQty}
                                onChange={(e) => handlePurchaseItemChange(idx, 'receivedQty', e.target.value)}
                                className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                              />
                            </div>
                            {pendingNum > 0 && (
                              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-1 rounded-lg">
                                ⏳ {pendingNum} unit{pendingNum !== 1 ? 's' : ''} still pending — will show on Advance Payments
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button type="button" onClick={addPurchaseItemRow} className="text-orange-600 font-bold text-xs flex items-center gap-1 hover:underline pt-1">
                      <Plus className="w-4 h-4" /> Add Another Item
                    </button>

                    {(() => {
                      const purchaseTotal = purchaseItems.reduce((sum, r) => sum + ((parseFloat(r.unitCost) || 0) * (parseInt(r.qty, 10) || 0)), 0);
                      return (
                        <div className="flex justify-between items-center bg-[var(--bg-hover)] rounded-xl p-3 text-sm">
                          <span className="font-bold text-[var(--text-secondary)]">Purchase Total</span>
                          <span className="font-black text-[var(--text-primary)]">Tk {purchaseTotal.toLocaleString()}</span>
                        </div>
                      );
                    })()}

                    <input name="paidAmount" type="number" step="0.01" defaultValue={formData.paidAmount || ''} placeholder="Amount Paid Now (Tk)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <p className="text-xs text-[var(--text-muted)]">
                      Leave "Amount Paid Now" blank or 0 for a fully due purchase, equal to the total for fully paid, or anything in between for a partial/half-due payment. The remaining due amount will show on the Due Amounts page under this supplier.
                    </p>
                    {!editingItem && (
                      <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-xl p-3">
                        Whatever "Received Qty Now" you enter above is added to that product's stock automatically when you save — no extra step needed.
                      </p>
                    )}
                    {editingItem && (
                      <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-xl p-3">
                        To receive more of a pending item later, use "Mark as Received" on the Advance Payments page — that adds it to stock automatically and keeps counts from being added twice.
                      </p>
                    )}
                    <input
                      required name="date" type="date"
                      defaultValue={formData.date || new Date().toISOString().split('T')[0]}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </>
                )}

                {activeTab === 'Damaged' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'Inventory Damage' })}
                        className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                          (formData.type || 'Inventory Damage') === 'Inventory Damage'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-[var(--input-border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Inventory Damage
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'After-Sales Service' })}
                        className={`p-3 rounded-xl text-sm font-bold border transition-all ${
                          formData.type === 'After-Sales Service'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'border-[var(--input-border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        After-Sales Service
                      </button>
                    </div>

                    <select
                      required name="productId"
                      defaultValue={formData.productId || ''}
                      onChange={(e) => {
                        const selected = products.find(p => p.id === parseInt(e.target.value, 10));
                        setFormData({ ...formData, productId: e.target.value, productName: selected ? selected.name : '' });
                      }}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                    </select>

                    {formData.type === 'After-Sales Service' && (
                      <>
                        <input
                          required name="customerName" defaultValue={formData.customerName || ''}
                          placeholder="Customer Name" onChange={handleInputChange}
                          className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                        <input
                          required name="customerPhone" defaultValue={formData.customerPhone || ''}
                          placeholder="Customer Phone Number" onChange={handleInputChange}
                          className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                        />
                      </>
                    )}

                    <input
                      required name="qty" type="number" min="1" defaultValue={formData.qty || 1}
                      placeholder="Quantity" onChange={handleInputChange}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <input
                      name="reason" defaultValue={formData.reason || ''}
                      placeholder={formData.type === 'After-Sales Service' ? 'Issue reported (e.g. not turning on)' : 'Reason (e.g. dropped, water damage)'}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                    <input
                      required name="date" type="date"
                      defaultValue={formData.date || new Date().toISOString().split('T')[0]}
                      onChange={handleInputChange}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />

                    <p className="text-xs text-[var(--text-muted)]">
                      {formData.type === 'After-Sales Service'
                        ? "This won't change your inventory stock — the item was already sold."
                        : "This will remove the quantity from that product's stock automatically."}
                    </p>
                  </div>
                )}

                {activeTab === 'Transactions' && (
                  <>
                    <select name="type" defaultValue={formData.type || 'Income'} onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                    <input required name="amount" type="number" step="0.01" defaultValue={formData.amount || ''} placeholder="Amount (Tk)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MARK AS RECEIVED MODAL — styled to match the Add New Purchase modal instead of a native browser prompt */}
        {receiveModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] w-[440px] transition-colors">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Mark as Received</h3>
                <button onClick={() => { setReceiveModal(null); setReceiveQtyInput(''); }} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={submitReceivePurchaseItem} className="space-y-4 text-sm">
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border-card)]">
                  <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-wide mb-1">Item</p>
                  <p className="text-[var(--text-primary)] font-bold">{receiveModal.item.productName || '—'}</p>
                  <p className="text-[var(--text-secondary)] text-xs mt-1">Pending: {receiveModal.pendingQty} of {receiveModal.item.qty} · Purchase {receiveModal.purchase.id}</p>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">How many units just arrived?</label>
                  <input
                    required
                    autoFocus
                    type="number"
                    min="1"
                    max={receiveModal.pendingQty}
                    value={receiveQtyInput}
                    onChange={(e) => setReceiveQtyInput(e.target.value)}
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <p className="text-[var(--text-muted)] text-xs mt-1.5">Leave lower than {receiveModal.pendingQty} if the vendor only sent part of it. This is added to stock automatically.</p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => { setReceiveModal(null); setReceiveQtyInput(''); }} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE INVOICE MODAL — sized for a 2.5in thermal receipt printer */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white text-slate-800 rounded-xl w-[300px] shadow-2xl border border-slate-200 overflow-hidden relative font-mono" id="printable-invoice-modal">

              <div className="p-4 text-center border-b border-dashed border-slate-300">
                <div className="w-9 h-9 mx-auto mb-1.5 bg-orange-500 text-white rounded-lg flex items-center justify-center font-black text-base">
                  {(shopSettings.shopName || 'S').charAt(0)}
                </div>
                <p className="font-extrabold text-sm uppercase tracking-wide leading-tight">{shopSettings.shopName}</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{shopSettings.address}</p>
                <p className="text-[10px] text-slate-500">{shopSettings.phone}</p>
              </div>

              <div className="px-4 py-3 text-[10px] space-y-0.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>Invoice:</span><span className="font-bold">{selectedReceipt.id}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{selectedReceipt.date}</span></div>
                <div className="flex justify-between"><span>Status:</span><span className="font-bold">{selectedReceipt.status}</span></div>
                <div className="flex justify-between"><span>Customer:</span><span className="font-bold text-right">{selectedReceipt.customer}</span></div>
                {selectedReceipt.customerPhone && <div className="flex justify-between"><span>Phone:</span><span>{selectedReceipt.customerPhone}</span></div>}
              </div>

              <div className="px-4 py-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                  <span>Item</span><span>Total</span>
                </div>
                <div className="space-y-1.5">
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="text-[11px]">
                      <div className="flex justify-between font-semibold">
                        <span className="pr-2">{item.productName}</span>
                        <span className="whitespace-nowrap">Tk {item.lineTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{item.qty} x Tk {item.sellPrice.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 py-3 text-[11px] space-y-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>Subtotal</span><span>Tk {(selectedReceipt.subtotal || selectedReceipt.totalSellAmount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>Tk {(selectedReceipt.discount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm font-black pt-1.5 mt-1 border-t border-slate-300">
                  <span>TOTAL</span><span>Tk {selectedReceipt.totalSellAmount.toLocaleString()}</span>
                </div>
                {(() => {
                  const paid = selectedReceipt.paidAmount ?? (selectedReceipt.status === 'Paid' ? selectedReceipt.totalSellAmount : 0);
                  const due = Math.max(0, selectedReceipt.totalSellAmount - paid);
                  if (due <= 0) return null;
                  return (
                    <>
                      <div className="flex justify-between"><span>Paid</span><span>Tk {paid.toLocaleString()}</span></div>
                      <div className="flex justify-between font-bold text-red-600"><span>DUE</span><span>Tk {due.toLocaleString()}</span></div>
                    </>
                  );
                })()}
              </div>

              {(shopSettings.receiptPolicies && shopSettings.receiptPolicies.filter(Boolean).length > 0) && (
                <div className="px-4 py-3 text-[9px] text-slate-500 leading-relaxed border-b border-dashed border-slate-300 space-y-0.5">
                  {shopSettings.receiptPolicies.filter(Boolean).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}

              <div className="px-4 py-4 text-center text-[10px] text-slate-400">
                — {shopSettings.proprietor} —
              </div>

              <div className="bg-slate-50 p-4 flex justify-between items-center no-print">
                <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all font-sans">
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-slate-600 hover:text-slate-900 font-bold text-xs px-3 py-2 font-sans">
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* PRINTABLE SUPPLIER INVOICE MODAL — a full, big, letter-style invoice (unlike the
            small thermal-receipt customer invoice), since this is the paperwork kept for
            supplier/accounting records and needs room for a full line-item table. */}
        {selectedPurchaseReceipt && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-start justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white text-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden relative font-sans my-6" id="printable-purchase-modal">

              {/* Letterhead */}
              <div className="flex items-start justify-between px-10 pt-10 pb-6 border-b-2 border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-3xl shrink-0">
                    {(shopSettings.shopName || 'S').charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-2xl uppercase tracking-wide leading-tight">{shopSettings.shopName}</p>
                    <p className="text-sm text-slate-500 mt-1 leading-snug">{shopSettings.address}</p>
                    <p className="text-sm text-slate-500">{shopSettings.phone}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black uppercase tracking-wider text-slate-800">Supplier Invoice</p>
                  <p className="text-sm text-slate-500 mt-1">{selectedPurchaseReceipt.id}</p>
                </div>
              </div>

              {/* Purchase + supplier details */}
              <div className="grid grid-cols-2 gap-6 px-10 py-6 border-b border-slate-200 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Supplier</p>
                  <p className="font-bold text-base text-slate-800">{selectedPurchaseReceipt.supplier}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-6"><span className="text-slate-500">Purchase Date</span><span className="font-semibold">{selectedPurchaseReceipt.date}</span></div>
                  <div className="flex justify-between gap-6"><span className="text-slate-500">Payment Status</span><span className="font-semibold">{selectedPurchaseReceipt.status}</span></div>
                  <div className="flex justify-between gap-6">
                    <span className="text-slate-500">Delivery Status</span>
                    <span className="font-semibold">{selectedPurchaseReceipt.received === false ? 'Partially / Not Received' : 'Fully Received'}</span>
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div className="px-10 py-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-800 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <th className="pb-2 text-left">Product</th>
                      <th className="pb-2 text-right">Ordered</th>
                      <th className="pb-2 text-right">Received</th>
                      <th className="pb-2 text-right">Pending</th>
                      <th className="pb-2 text-right">Unit Cost</th>
                      <th className="pb-2 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedPurchaseReceipt.items || []).map((item, idx) => {
                      const pending = Math.max(0, item.qty - (item.receivedQty || 0));
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 font-semibold text-slate-800">{item.productName}</td>
                          <td className="py-2.5 text-right">{item.qty}</td>
                          <td className="py-2.5 text-right">{item.receivedQty ?? item.qty}</td>
                          <td className="py-2.5 text-right">
                            {pending > 0 ? <span className="font-bold text-blue-600">{pending}</span> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="py-2.5 text-right">Tk {item.unitCost.toLocaleString()}</td>
                          <td className="py-2.5 text-right font-semibold">Tk {item.lineTotal.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedPurchaseReceipt.received === false && (
                <div className="mx-10 mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">⏳ Some quantity is still pending delivery — see Advance Payments</span>
                </div>
              )}

              {/* Totals */}
              <div className="px-10 pb-8 flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between text-lg font-black pt-2 border-t-2 border-slate-800">
                    <span>TOTAL</span><span>Tk {selectedPurchaseReceipt.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700"><span>Paid</span><span>Tk {selectedPurchaseReceipt.paidAmount.toLocaleString()}</span></div>
                  {(() => {
                    const due = selectedPurchaseReceipt.dueAmount ?? Math.max(0, selectedPurchaseReceipt.totalAmount - selectedPurchaseReceipt.paidAmount);
                    if (due <= 0) return null;
                    return <div className="flex justify-between font-bold text-red-600"><span>DUE</span><span>Tk {due.toLocaleString()}</span></div>;
                  })()}
                </div>
              </div>

              <div className="px-10 py-6 border-t border-slate-200 text-center text-xs text-slate-400">
                Authorized by — {shopSettings.proprietor}
              </div>

              <div className="bg-slate-50 px-10 py-5 flex justify-between items-center no-print">
                <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all">
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
                <button onClick={() => setSelectedPurchaseReceipt(null)} className="text-slate-600 hover:text-slate-900 font-bold text-sm px-3 py-2">
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-muted)]">Total Sales</span>
                  <span className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-orange-500" /></span>
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)]">Tk {totalSellAmount.toLocaleString()}</div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{sales.length} order{sales.length !== 1 ? 's' : ''} recorded</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-muted)]">Inventory Value</span>
                  <span className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Box className="w-5 h-5 text-blue-500" /></span>
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)]">Tk {currentInventoryValue.toLocaleString()}</div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{products.length} product{products.length !== 1 ? 's' : ''} in stock</p>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[var(--text-muted)]">Net Profit</span>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {netProfit >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                  </span>
                </div>
                <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Tk {Math.abs(netProfit).toLocaleString()}</div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{netProfit >= 0 ? 'Profit' : 'Loss'} across all sales</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 shadow-sm transition-colors">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-6">Monthly Revenue Overview</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defaultMonthlySales}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="var(--text-muted)" />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Tk ${val / 1000}k`} stroke="var(--text-muted)" />
                    <Tooltip formatter={(value) => [`Tk ${value.toLocaleString()}`, 'Sales']} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: '12px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="sales" radius={[6, 6, 0, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[var(--text-primary)] mb-4"><Award className="w-4.5 h-4.5 text-orange-500" /> Best Selling Products</h3>
                {bestSellers.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] py-6 text-center">No sales yet — your top products will show up here.</p>
                ) : (
                  <div className="space-y-3">
                    {bestSellers.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black flex items-center justify-center">{idx + 1}</span>
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{p.qty} sold</p>
                          <p className="text-xs text-[var(--text-muted)]">Tk {p.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[var(--text-primary)] mb-4"><Clock className="w-4.5 h-4.5 text-orange-500" /> Recent Activity</h3>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] py-6 text-center">No sales yet — recent orders will appear here.</p>
                ) : (
                  <div className="space-y-3">
                    {recentSales.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{s.customer}</p>
                          <p className="text-xs text-[var(--text-muted)]">{s.id} · {s.date}</p>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)]">Tk {s.totalSellAmount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'Products' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={products.length === 0 ? Box : PackageSearch}
                title={products.length === 0 ? 'No products yet' : 'No matching products'}
                message={products.length === 0 ? "Click 'Add New Product' to add your first item." : 'Try a different search term.'}
              />
            ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                  <th className="pb-3">PRODUCT</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">BUY PRICE</th>
                  <th className="pb-3">SELL PRICE</th>
                  <th className="pb-3">STOCK</th>
                  <th className="pb-3">TOTAL ASSET</th>
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              {Object.keys(productsByCategory).sort().map(catName => (
                <tbody key={catName} className="divide-y divide-[var(--border-card)]">
                  <tr>
                    <td colSpan={7} className="pt-5 pb-2">
                      <span className="inline-flex items-center gap-1.5 text-orange-600 font-black text-xs uppercase tracking-wide">
                        <Tag className="w-3.5 h-3.5" /> {catName} <span className="text-[var(--text-muted)] font-semibold normal-case">({productsByCategory[catName].length})</span>
                      </span>
                    </td>
                  </tr>
                  {productsByCategory[catName].map(p => (
                    <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-4 font-bold text-[var(--text-primary)]">{p.name}</td>
                      <td className="py-4 text-[var(--text-secondary)]">{p.category}</td>
                      <td className="py-4 text-[var(--text-secondary)]">Tk {p.buyPrice.toLocaleString()}</td>
                      <td className="py-4 font-bold text-[var(--text-primary)]">Tk {p.sellPrice.toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                          {p.stock} units {p.stock <= p.reorderLevel && '⚠️'}
                        </span>
                      </td>
                      <td className="py-4 font-black text-[var(--text-primary)]">Tk {(p.buyPrice * p.stock).toLocaleString()}</td>
                      <td className="py-4 text-right flex justify-end gap-1">
                        <button onClick={() => handleOpenEdit(p)} title="Edit Product" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id, 'Products')} title="Delete Product" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
            )}
          </div>
        )}

        {/* INVENTORY TAB (Directly synced with Products) */}
        {activeTab === 'Inventory' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-[var(--text-primary)] text-lg">Stock Assets Overview</h3>
              <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-600 text-sm font-bold">
                Total Inventory Capital Asset: Tk {currentInventoryValue.toLocaleString()}
              </div>
            </div>
            {products.length === 0 ? (
              <EmptyState icon={Warehouse} title="No inventory yet" message="Add products to see your stock assets here." />
            ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                  <th className="pb-3">PRODUCT ITEM</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">UNIT BUY PRICE</th>
                  <th className="pb-3">AVAILABLE QTY</th>
                  <th className="pb-3">TOTAL ASSET VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 font-bold text-[var(--text-primary)]">{p.name}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{p.category}</td>
                    <td className="py-4 text-[var(--text-secondary)]">Tk {p.buyPrice.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-4 font-black text-[var(--text-primary)]">Tk {(p.buyPrice * p.stock).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'Sales' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
            {filteredSales.length === 0 ? (
              <EmptyState
                icon={sales.length === 0 ? ShoppingCart : PackageSearch}
                title={sales.length === 0 ? 'No sales yet' : 'No matching sales'}
                message={sales.length === 0 ? "Click 'Add New Sale' to record your first order." : 'Try a different search term.'}
              />
            ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                  <th className="pb-3">ORDER ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">ITEMS</th><th className="pb-3">TOTAL AMOUNT</th><th className="pb-3">PAYMENT</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredSales.map(s => {
                  const paid = s.paidAmount ?? (s.status === 'Paid' ? s.totalSellAmount : 0);
                  const due = Math.max(0, s.totalSellAmount - paid);
                  return (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 font-bold text-orange-600">{s.id}</td>
                    <td className="py-4 font-medium text-[var(--text-primary)]">{s.customer}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{s.items.length} item(s)</td>
                    <td className="py-4 font-bold text-[var(--text-primary)]">Tk {s.totalSellAmount.toLocaleString()}</td>
                    <td className="py-4">
                      {due <= 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Paid</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700" title={`Paid Tk ${paid.toLocaleString()}`}>
                          Due Tk {due.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-[var(--text-muted)]">{s.date}</td>
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => setSelectedReceipt(s)} title="View & Print Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(s)} title="Edit Sale Record" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id, 'Sales')} title="Delete Sale" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* PURCHASES TAB — what you've bought from suppliers, and what you still owe them */}
        {activeTab === 'Purchases' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
            {filteredPurchases.length === 0 ? (
              <EmptyState
                icon={purchases.length === 0 ? PackagePlus : PackageSearch}
                title={purchases.length === 0 ? 'No purchases yet' : 'No matching purchases'}
                message={purchases.length === 0 ? "Click 'Add New Purchase' to record what you bought from a supplier." : 'Try a different search term.'}
              />
            ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                  <th className="pb-3">PURCHASE ID</th><th className="pb-3">SUPPLIER</th><th className="pb-3">ITEMS</th><th className="pb-3">QTY</th><th className="pb-3">TOTAL</th><th className="pb-3">PAYMENT</th><th className="pb-3">DELIVERY</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredPurchases.map(p => {
                  const due = p.dueAmount ?? Math.max(0, p.totalAmount - p.paidAmount);
                  const items = p.items || [];
                  const totalQty = items.reduce((s, i) => s + i.qty, 0);
                  const totalPending = items.reduce((s, i) => s + Math.max(0, i.qty - (i.receivedQty || 0)), 0);
                  return (
                  <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 font-bold text-orange-600">{p.id}</td>
                    <td className="py-4 font-medium text-[var(--text-primary)]">{p.supplier}</td>
                    <td className="py-4 text-[var(--text-secondary)]">
                      {items.length > 0 ? items.map(i => i.productName).join(', ') : '—'}
                    </td>
                    <td className="py-4 text-[var(--text-secondary)]">{totalQty}</td>
                    <td className="py-4 font-bold text-[var(--text-primary)]">Tk {p.totalAmount.toLocaleString()}</td>
                    <td className="py-4">
                      {due <= 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Paid</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700" title={`Paid Tk ${p.paidAmount.toLocaleString()}`}>
                          Due Tk {due.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      {totalPending > 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{totalPending} Pending</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">Received</span>
                      )}
                    </td>
                    <td className="py-4 text-[var(--text-muted)]">{p.date}</td>
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => setSelectedPurchaseReceipt(p)} title="View & Print Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(p)} title="Edit Purchase" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id, 'Purchases')} title="Delete Purchase" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* ADVANCE PAYMENTS TAB — individual line items still owed by a supplier, e.g. the
            leftover quantity from a partially-delivered purchase */}
        {activeTab === 'Advance Payments' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-sm text-white">
              <p className="text-sm font-semibold text-blue-100 mb-1">Value of Goods Still Awaiting Delivery</p>
              <p className="text-2xl font-black">Tk {totalAdvancePaid.toLocaleString()}</p>
              <p className="text-xs mt-1 text-blue-100">{pendingDeliveries.length} pending item{pendingDeliveries.length !== 1 ? 's' : ''} from your suppliers</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              {filteredPendingDeliveries.length === 0 ? (
                <EmptyState
                  icon={PackageOpen}
                  title={currentSearch ? 'No matching pending items' : 'No advance payments pending'}
                  message={currentSearch
                    ? `Nothing matches "${searchQueries[activeTab]}". Try a different purchase ID, supplier, or item name.`
                    : 'Nothing owed to you in goods right now. When a purchase has some or all of its quantity marked "not received yet," it will show up here until you mark it received.'}
                />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                      <th className="pb-3">PURCHASE ID</th><th className="pb-3">SUPPLIER</th><th className="pb-3">ITEM</th><th className="pb-3">PENDING QTY</th><th className="pb-3">VALUE</th><th className="pb-3">PURCHASE DATE</th><th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-card)]">
                    {filteredPendingDeliveries.map(({ purchase, item, itemIndex, pendingQty }) => (
                      <tr key={`${purchase.id}-${itemIndex}`} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-4 font-bold text-orange-600">{purchase.id}</td>
                        <td className="py-4 font-medium text-[var(--text-primary)]">{purchase.supplier}</td>
                        <td className="py-4 text-[var(--text-secondary)]">{item.productName || '—'}</td>
                        <td className="py-4 font-bold text-blue-600">{pendingQty} of {item.qty}</td>
                        <td className="py-4 text-[var(--text-secondary)]">Tk {(pendingQty * item.unitCost).toLocaleString()}</td>
                        <td className="py-4 text-[var(--text-muted)]">{purchase.date}</td>
                        <td className="py-4 text-right flex justify-end items-center gap-1">
                          <button onClick={() => setSelectedPurchaseReceipt(purchase)} title="View Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                          <button
                            onClick={() => handleReceivePurchaseItem(purchase, itemIndex)}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all whitespace-nowrap"
                          >
                            Mark as Received
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* DUE AMOUNTS TAB — customers who owe you, and suppliers you owe */}
        {activeTab === 'Due Amounts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setDueView('customer')}
                className={`text-left p-6 rounded-2xl border shadow-sm transition-colors ${dueView === 'customer' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-primary)]'}`}
              >
                <p className={`text-sm font-semibold mb-1 ${dueView === 'customer' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>Customers Owe You</p>
                <p className="text-2xl font-black">Tk {totalCustomerDue.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${dueView === 'customer' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>{customerDues.length} pending sale{customerDues.length !== 1 ? 's' : ''}</p>
              </button>
              <button
                onClick={() => setDueView('vendor')}
                className={`text-left p-6 rounded-2xl border shadow-sm transition-colors ${dueView === 'vendor' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-primary)]'}`}
              >
                <p className={`text-sm font-semibold mb-1 ${dueView === 'vendor' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>You Owe Suppliers</p>
                <p className="text-2xl font-black">Tk {totalVendorDue.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${dueView === 'vendor' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>{vendorDues.length} pending purchase{vendorDues.length !== 1 ? 's' : ''}</p>
              </button>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              {dueView === 'customer' ? (
                customerDues.length === 0 ? (
                  <EmptyState icon={Wallet} title="No customer dues" message="Every sale is fully paid — nice work!" />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                        <th className="pb-3">ORDER ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">PHONE</th><th className="pb-3">TOTAL</th><th className="pb-3">PAID</th><th className="pb-3">DUE</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)]">
                      {customerDues.map(s => {
                        const paid = s.paidAmount ?? 0;
                        return (
                          <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                            <td className="py-4 font-bold text-orange-600">{s.id}</td>
                            <td className="py-4 font-medium text-[var(--text-primary)]">{s.customer}</td>
                            <td className="py-4 text-[var(--text-secondary)]">{s.customerPhone || '—'}</td>
                            <td className="py-4 text-[var(--text-secondary)]">Tk {s.totalSellAmount.toLocaleString()}</td>
                            <td className="py-4 text-emerald-700">Tk {paid.toLocaleString()}</td>
                            <td className="py-4 font-black text-red-600">Tk {s.dueAmount.toLocaleString()}</td>
                            <td className="py-4 text-[var(--text-muted)]">{s.date}</td>
                            <td className="py-4 text-right flex justify-end gap-1">
                              <button onClick={() => setSelectedReceipt(s)} title="View Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => { setActiveTab('Sales'); handleOpenEdit(s); }} title="Update Payment" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                vendorDues.length === 0 ? (
                  <EmptyState icon={Wallet} title="No vendor dues" message="You're all settled up with your suppliers." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                        <th className="pb-3">PURCHASE ID</th><th className="pb-3">SUPPLIER</th><th className="pb-3">ITEM</th><th className="pb-3">TOTAL</th><th className="pb-3">PAID</th><th className="pb-3">DUE</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)]">
                      {vendorDues.map(p => (
                        <tr key={p.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="py-4 font-bold text-orange-600">{p.id}</td>
                          <td className="py-4 font-medium text-[var(--text-primary)]">{p.supplier}</td>
                          <td className="py-4 text-[var(--text-secondary)]">{(p.items || []).map(i => i.productName).join(', ') || '—'}</td>
                          <td className="py-4 text-[var(--text-secondary)]">Tk {p.totalAmount.toLocaleString()}</td>
                          <td className="py-4 text-emerald-700">Tk {p.paidAmount.toLocaleString()}</td>
                          <td className="py-4 font-black text-red-600">Tk {p.dueAmount.toLocaleString()}</td>
                          <td className="py-4 text-[var(--text-muted)]">{p.date}</td>
                          <td className="py-4 text-right flex justify-end gap-1">
                            <button onClick={() => setSelectedPurchaseReceipt(p)} title="View Receipt" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => { setActiveTab('Purchases'); handleOpenEdit(p); }} title="Update Payment" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'Reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Cost of Goods Sold (COGS)</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">Tk {costOfGoodsSold.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Total Sales Revenue</p>
                <p className="text-2xl font-bold text-orange-600">Tk {totalSellAmount.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Net Profit / Loss</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  Tk {Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Total Inventory Assets</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">Tk {currentInventoryValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'Settings' && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-8 shadow-sm max-w-2xl transition-colors">
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Shop & Invoice Configuration</h3>
            <p className="text-xs text-[var(--text-muted)] mb-6">Update your store identity. These details will automatically sync with your printed invoices and dashboard headers.</p>
            
            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Shop / Business Name</label>
                <input required name="shopName" value={settingsForm.shopName} onChange={handleSettingsChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Proprietor Name</label>
                <input required name="proprietor" value={settingsForm.proprietor} onChange={handleSettingsChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Contact Phone Number(s)</label>
                <input required name="phone" value={settingsForm.phone} onChange={handleSettingsChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Store Address / Location</label>
                <input required name="address" value={settingsForm.address} onChange={handleSettingsChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Receipt Policy Lines</label>
                <p className="text-xs text-[var(--text-muted)] mb-1.5">One line per policy — printed at the bottom of every receipt.</p>
                <textarea
                  name="receiptPoliciesText"
                  rows={4}
                  value={(settingsForm.receiptPolicies || defaultSettings.receiptPolicies).join('\n')}
                  onChange={(e) => setSettingsForm({ ...settingsForm, receiptPolicies: e.target.value.split('\n') })}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono text-xs"
                  placeholder={'Electronics warranty subject to manufacturer guidelines.\nNo returns after purchase without original invoice.'}
                />
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-[var(--border-card)]">
                <button 
                  type="button" 
                  onClick={handleResetAllData} 
                  className="text-red-500 hover:text-red-600 font-bold text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset All Shop Data
                </button>
                <button type="submit" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 shadow-md flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Settings
                </button>
              </div>
            </form>

            {/* BACKUP & RESTORE */}
            <div className="mt-8 pt-6 border-t border-[var(--border-card)]">
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">Data Backup &amp; Restore</h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Your data is only stored in this browser. Export a backup file regularly (e.g. daily,
                end of shift) and keep it somewhere safe — a USB drive, email, or cloud storage folder.
                If this browser's data is ever lost, you can restore everything from the last backup file.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="bg-orange-500 text-white font-bold px-5 py-3 rounded-xl hover:bg-orange-600 shadow-md flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" /> Export Backup (JSON)
                </button>

                <label className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] font-bold px-5 py-3 rounded-xl hover:bg-[var(--bg-hover)] shadow-sm flex items-center gap-2 text-sm cursor-pointer transition-colors">
                  <RefreshCw className="w-4 h-4" /> Import Backup (JSON)
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* GENERIC TABLES FOR OTHER TABS */}
        {['Categories', 'Customers', 'Suppliers', 'Transactions', 'Damaged'].includes(activeTab) && (
          <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
            {genericDataMap[activeTab.toLowerCase()].length === 0 ? (
              <EmptyState icon={Inbox} title={`No ${activeTab.toLowerCase()} yet`} message={`Click 'Add New ${activeTab.slice(0, -1)}' to create your first entry.`} />
            ) : filteredGenericRows(genericDataMap[activeTab.toLowerCase()]).length === 0 ? (
              <EmptyState icon={PackageSearch} title="No matching results" message="Try a different search term." />
            ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                  {Object.keys(genericDataMap[activeTab.toLowerCase()][0] || {}).map(k => (
                    <th key={k} className="pb-3 uppercase">{k}</th>
                  ))}
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredGenericRows(genericDataMap[activeTab.toLowerCase()]).map(item => (
                  <tr key={item.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    {Object.values(item).map((val, i) => (
                      <td key={i} className="py-4 font-medium text-[var(--text-secondary)]">{typeof val === 'object' ? JSON.stringify(val) : val}</td>
                    ))}
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => handleOpenEdit(item)} title="Edit Entry" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id, activeTab)} title="Delete Entry" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
