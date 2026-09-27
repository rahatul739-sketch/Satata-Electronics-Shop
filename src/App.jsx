import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Home, Box, Layers, Warehouse, 
  ShoppingCart, Users, Truck, ArrowLeftRight, PieChart, Settings, 
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Eye, X, Printer, Pencil, Save, RefreshCw,
  Search, Moon, Sun, PackageSearch, Award, Clock, Sparkles, Inbox, LogOut, Loader2, Mail, Lock,
  Wallet, PackagePlus, Tag, BadgePercent, PackageOpen, Calendar, Download, Receipt, History, Boxes, ArrowRightLeft,
  Banknote, CreditCard, Undo2, Calculator, MessageCircle, AlertOctagon, Megaphone
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

// --- Supabase connection ---
// This publishable key is safe to expose in frontend code — access is controlled
// by Row Level Security policies on the database, not by keeping this key secret.
const SUPABASE_URL = 'https://hjmtbpokyuyctvlsmkyr.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_P0wRpIBl7WAe-RIwXqztjA_7DsJ1A9d';
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// --- INITIAL DEFAULT MOCK DATA ---
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

const EXPENSE_CATEGORIES = ['Food/Eating', 'Delivery/Transport', 'Rent', 'Utilities', 'Staff/Salary', 'Maintenance', 'Marketing', 'Other'];

// How many days old a due date is — used to flag overdue customer/vendor dues.
const daysOverdue = (dateStr) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

// Builds a wa.me link pre-filled with a payment reminder, from a Bangladeshi local number.
// Takes just the first number if several are stored comma/slash separated, strips everything
// but digits, and adds the 880 country code (dropping a leading 0) if it isn't already there.
const buildWhatsAppReminderLink = (phone, message) => {
  if (!phone) return null;
  const firstNumber = phone.split(/[,/]/)[0].replace(/\D/g, '');
  if (!firstNumber) return null;
  const withCountryCode = firstNumber.startsWith('880') ? firstNumber : `880${firstNumber.replace(/^0/, '')}`;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
};

// Next available product code — starts at 10001, then one past whatever the highest
// existing numeric code is, so new products never collide with one you've edited by hand.
const nextProductCode = (products) => {
  const numericCodes = products.map(p => parseInt(p.productCode, 10)).filter(n => !isNaN(n));
  return numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 10001;
};

const defaultSettings = {
  shopName: 'Satota Electronics',
  proprietor: 'Fahim Khan',
  phone: '01758392250, 01727013619',
  address: 'Sila bristy market, Pollibidduit, Kaliakoir, Gazipur',
  currency: 'Tk',
  cashBalance: 0,
  lastBackupAt: null,
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
    toDb: (p) => ({ name: p.name, category: p.category, buy_price: p.buyPrice, sell_price: p.sellPrice, wholesale_price: p.wholesalePrice ?? null, product_code: p.productCode ?? null, stock: p.stock, reorder_level: p.active === false ? 0 : p.reorderLevel, active: p.active !== false, last_sold_at: p.lastSoldAt || null }),
    fromDb: (r) => ({ id: r.id, name: r.name, category: r.category, buyPrice: Number(r.buy_price), sellPrice: Number(r.sell_price), wholesalePrice: r.wholesale_price !== null && r.wholesale_price !== undefined ? Number(r.wholesale_price) : null, productCode: r.product_code || null, stock: r.stock, reorderLevel: r.reorder_level, active: r.active !== false, lastSoldAt: r.last_sold_at }),
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
      sale_type: s.saleType || 'Retail',
    }),
    fromDb: (r) => ({
      id: r.id, customer: r.customer, customerPhone: r.customer_phone, customerAddress: r.customer_address,
      items: r.items || [], subtotal: Number(r.subtotal), discount: Number(r.discount),
      totalSellAmount: Number(r.total_sell_amount), totalCostAmount: Number(r.total_cost_amount),
      status: r.status, date: r.sale_date,
      paidAmount: r.paid_amount !== null && r.paid_amount !== undefined ? Number(r.paid_amount) : Number(r.total_sell_amount),
      saleType: r.sale_type || 'Retail',
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
    toDb: (t) => ({ id: t.id, ref_id: t.refId, type: t.type, amount: t.amount, txn_date: t.date, status: t.status, category: t.category || '', note: t.note || '' }),
    fromDb: (r) => ({ id: r.id, refId: r.ref_id, type: r.type, amount: Number(r.amount), date: r.txn_date, status: r.status, category: r.category || '', note: r.note || '' }),
  },
  settings: {
    toDb: (s) => ({ shop_name: s.shopName, proprietor: s.proprietor, phone: s.phone, address: s.address, currency: s.currency, receipt_policies: s.receiptPolicies, cash_balance: s.cashBalance ?? 0, last_backup_at: s.lastBackupAt || null }),
    fromDb: (r) => ({ shopName: r.shop_name, proprietor: r.proprietor, phone: r.phone, address: r.address, currency: r.currency, receiptPolicies: r.receipt_policies || [], cashBalance: r.cash_balance !== null && r.cash_balance !== undefined ? Number(r.cash_balance) : 0, lastBackupAt: r.last_backup_at || null }),
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
  warehouse: {
    toDb: (w) => ({ product_id: w.productId || null, product_name: w.productName, category: w.category || '', qty: w.qty }),
    fromDb: (r) => ({ id: r.id, productId: r.product_id, productName: r.product_name, category: r.category || '', qty: r.qty }),
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
  const [warehouseStock, setWarehouseStock] = useState([]);
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
      const [catRes, prodRes, custRes, supRes, saleRes, txnRes, settingsRes, damagedRes, purchaseRes, warehouseRes] = await Promise.all([
        supabase.from('categories').select('*').order('id'),
        supabase.from('products').select('*').order('id'),
        supabase.from('customers').select('*').order('id'),
        supabase.from('suppliers').select('*').order('id'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_settings').select('*').maybeSingle(),
        supabase.from('damaged_products').select('*').order('created_at', { ascending: false }),
        supabase.from('purchases').select('*').order('created_at', { ascending: false }),
        Promise.resolve(supabase.from('warehouse_stock').select('*').order('created_at', { ascending: false }))
          .catch(() => ({ data: [] })),
      ]);

      setCategories((catRes.data || []).map(dbMap.category.fromDb));
      setProducts((prodRes.data || []).map(dbMap.product.fromDb));
      setCustomers((custRes.data || []).map(dbMap.customer.fromDb));
      setSuppliers((supRes.data || []).map(dbMap.supplier.fromDb));
      setSales((saleRes.data || []).map(dbMap.sale.fromDb));
      setTransactions((txnRes.data || []).map(dbMap.transaction.fromDb));
      setDamagedProducts((damagedRes.data || []).map(dbMap.damaged.fromDb));
      setPurchases((purchaseRes.data || []).map(dbMap.purchase.fromDb));
      setWarehouseStock((warehouseRes.data || []).map(dbMap.warehouse.fromDb));

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  // Styled delete-confirmation modal state — replaces the old window.confirm() flow
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type }

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
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('All'); // 'All' | 'Retail' | 'Wholesale'
  // Due Amounts tab: which side is showing — customer dues or vendor dues
  const [dueView, setDueView] = useState('customer');
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');
  const [duePartyFilter, setDuePartyFilter] = useState('');
  // Reports tab: which date the daily breakdown is showing
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);

  // "Add Previous Due" modal — records an opening balance a customer already owed
  // before you started using this software, without touching product stock at all.
  const [showPreviousDueModal, setShowPreviousDueModal] = useState(false);
  const [previousDueForm, setPreviousDueForm] = useState({ customer: '', customerPhone: '', amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  // "Record Payment" modal on the Due Amounts page — a quick, dedicated way to log a
  // partial or full payment against a due sale/purchase without opening the full editor.
  const [paymentModal, setPaymentModal] = useState(null); // { kind: 'customer' | 'vendor', record }
  const [paymentAmountInput, setPaymentAmountInput] = useState('');

  // "Add Money" modal on the Expenses page — logs a capital injection (owner deposit,
  // loan, cash from another source) into the business and tops up the cash balance.
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });

  // "Process Return" modal on the Sales page — returns some or all items from a past
  // sale: restocks the product(s), shrinks the sale's total, and refunds any cash that's
  // now owed back to the customer, without deleting the original sale record.
  const [returnModal, setReturnModal] = useState(null); // the sale being returned against
  const [returnQtyInputs, setReturnQtyInputs] = useState({}); // { [itemIndex]: qtyToReturnNow }

  // "Close Till" modal on the Expenses page — end-of-day cash count vs. what the system
  // expects, so a counting mistake or shortage surfaces the same day instead of drifting.
  const [showCloseTillModal, setShowCloseTillModal] = useState(false);
  const [closeTillForm, setCloseTillForm] = useState({ countedAmount: '', note: '' });

  // Promotions page — build a WhatsApp promo message for a newly-arrived product and  // click through your customer list to send it. WhatsApp has no bulk-send API for a
  // personal account, so this is a "generate links, click each one" workflow.
  const [promoProductId, setPromoProductId] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [promoSelectedCustomerIds, setPromoSelectedCustomerIds] = useState([]);
  const [promoSentIds, setPromoSentIds] = useState([]);
  const [promoCustomerSearch, setPromoCustomerSearch] = useState('');

  const handleOpenPreviousDue = (customer) => {
    setPreviousDueForm({
      customer: customer ? customer.name : '',
      customerPhone: customer ? (customer.phone || '') : '',
      amount: '', note: '', date: new Date().toISOString().split('T')[0]
    });
    setShowPreviousDueModal(true);
  };

  const handleSavePreviousDue = async (e) => {
    e.preventDefault();
    const amount = parseFloat(previousDueForm.amount) || 0;
    if (!previousDueForm.customer.trim()) return alert('Please enter a customer name.');
    if (amount <= 0) return alert('Please enter a due amount greater than 0.');

    try {
      const orderId = await nextSequentialId(sales.map(s => s.id), 'DUE', '#DUE-');
      const saleRecord = {
        id: orderId,
        customer: previousDueForm.customer.trim(),
        customerPhone: previousDueForm.customerPhone || '',
        customerAddress: '',
        items: [{
          productId: null,
          productName: previousDueForm.note?.trim() || 'Previous Due (Opening Balance)',
          qty: 1, buyPrice: 0, originalPrice: amount, sellPrice: amount, lineDiscount: 0, lineTotal: amount
        }],
        subtotal: amount, discount: 0, totalSellAmount: amount, totalCostAmount: 0,
        status: 'Due', paidAmount: 0,
        date: previousDueForm.date || new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase.from('sales').insert(dbMap.sale.toDb(saleRecord));
      if (error) throw error;
      setSales(prev => [saleRecord, ...prev]);

      // Auto-add this customer if they aren't already on file
      const alreadyExists = customers.some(c =>
        (saleRecord.customerPhone && c.phone && c.phone === saleRecord.customerPhone) ||
        (!saleRecord.customerPhone && (c.name || '').toLowerCase() === saleRecord.customer.toLowerCase())
      );
      if (!alreadyExists) {
        const { data, error: custError } = await supabase.from('customers')
          .insert(dbMap.customer.toDb({ name: saleRecord.customer, email: '', phone: saleRecord.customerPhone, address: '' }))
          .select().single();
        if (!custError && data) setCustomers(prev => [...prev, dbMap.customer.fromDb(data)]);
      }

      setShowPreviousDueModal(false);
      alert('Previous due recorded — it now shows on the Due Amounts page for this customer.');
    } catch (err) {
      alert('Could not save — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const openPaymentModal = (kind, record) => {
    setPaymentModal({ kind, record });
    setPaymentAmountInput('');
  };

  const submitRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    const { kind, record } = paymentModal;
    const paymentNow = parseFloat(paymentAmountInput) || 0;
    if (paymentNow <= 0) return alert('Enter a payment amount greater than 0.');

    try {
      if (kind === 'customer') {
        const total = record.totalSellAmount;
        const oldPaid = record.paidAmount ?? 0;
        const newPaid = Math.min(oldPaid + paymentNow, total);
        const actuallyApplied = newPaid - oldPaid; // in case the input overshoots the due amount
        const newStatus = newPaid >= total ? 'Paid' : 'Partial';

        const { error: saleError } = await supabase.from('sales').update({ paid_amount: newPaid, status: newStatus }).eq('id', record.id);
        if (saleError) throw saleError;
        const { error: txnError } = await supabase.from('transactions')
          .update({ status: newStatus === 'Paid' ? 'Success' : 'Pending' }).eq('ref_id', record.id);
        if (txnError) throw txnError;

        setSales(prev => prev.map(s => s.id === record.id ? { ...s, paidAmount: newPaid, status: newStatus } : s));
        setTransactions(prev => prev.map(t => t.refId === record.id ? { ...t, status: newStatus === 'Paid' ? 'Success' : 'Pending' } : t));

        // Cash actually came in from the customer.
        await adjustCashBalance(actuallyApplied);
      } else {
        const total = record.totalAmount;
        const oldPaid = record.paidAmount ?? 0;
        const newPaid = Math.min(oldPaid + paymentNow, total);
        const actuallyApplied = newPaid - oldPaid;
        const newStatus = newPaid >= total ? 'Paid' : 'Partial';

        const { error } = await supabase.from('purchases').update({ paid_amount: newPaid, status: newStatus }).eq('id', record.id);
        if (error) throw error;

        setPurchases(prev => prev.map(p => p.id === record.id ? { ...p, paidAmount: newPaid, status: newStatus, dueAmount: Math.max(0, total - newPaid) } : p));

        // Cash actually went out to the supplier.
        await adjustCashBalance(-actuallyApplied);
      }
      setPaymentModal(null);
      setPaymentAmountInput('');
    } catch (err) {
      alert('Could not record payment — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handleSaveAddMoney = async (e) => {
    e.preventDefault();
    const amount = parseFloat(addMoneyForm.amount) || 0;
    if (amount <= 0) return alert('Enter an amount greater than 0.');

    try {
      const newEntry = {
        id: await nextSequentialId(transactions.map(t => t.id), 'TXN', 'TXN-'),
        type: 'Capital',
        amount,
        category: 'Owner Investment',
        note: addMoneyForm.note || '',
        status: 'Success',
        date: addMoneyForm.date || new Date().toISOString().split('T')[0],
      };
      const { error } = await supabase.from('transactions').insert(dbMap.transaction.toDb(newEntry));
      if (error) throw error;
      setTransactions(prev => [newEntry, ...prev]);

      const ok = await adjustCashBalance(amount);
      if (!ok) {
        // Balance update failed but the log entry is already saved — let them know
        // the money-in was recorded even though the running total didn't move.
        alert('Money-in was logged, but the balance total could not be updated. Please refresh.');
      }

      setShowAddMoneyModal(false);
      setAddMoneyForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('Could not save — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const openReturnModal = (sale) => {
    setReturnModal(sale);
    setReturnQtyInputs({});
  };

  const submitProcessReturn = async (e) => {
    e.preventDefault();
    if (!returnModal) return;
    const sale = returnModal;

    const entries = Object.entries(returnQtyInputs)
      .map(([idx, val]) => ({ idx: parseInt(idx, 10), qty: parseInt(val, 10) || 0 }))
      .filter(e => e.qty > 0);
    if (entries.length === 0) return alert('Enter a quantity to return for at least one item.');

    // Build the updated items array, clamping each return to what's actually left to return.
    let returnValue = 0;
    let returnCost = 0;
    const stockBumps = []; // { productId, qty }
    const updatedItems = sale.items.map((item, idx) => {
      const entry = entries.find(e => e.idx === idx);
      if (!entry) return item;
      const alreadyReturned = item.returnedQty || 0;
      const remaining = item.qty - alreadyReturned;
      const returningNow = Math.min(entry.qty, remaining);
      if (returningNow <= 0) return item;
      returnValue += returningNow * item.sellPrice;
      returnCost += returningNow * (item.buyPrice || 0);
      if (item.productId) stockBumps.push({ productId: item.productId, qty: returningNow });
      return { ...item, returnedQty: alreadyReturned + returningNow };
    });

    if (returnValue <= 0) return alert('Enter a quantity to return for at least one item.');

    const newSubtotal = Math.max(0, sale.subtotal - returnValue);
    const newDiscount = Math.min(sale.discount || 0, newSubtotal);
    const newTotalSellAmount = Math.max(0, newSubtotal - newDiscount);
    const newTotalCostAmount = Math.max(0, sale.totalCostAmount - returnCost);
    const oldPaid = sale.paidAmount ?? 0;
    const cashRefund = Math.max(0, oldPaid - newTotalSellAmount);
    const newPaid = oldPaid - cashRefund;
    const newStatus = newTotalSellAmount <= 0 ? 'Paid' : (newPaid >= newTotalSellAmount ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Due'));

    try {
      // Restock every returned product.
      const stockUpdates = stockBumps.map(b => {
        const prod = products.find(p => p.id === b.productId);
        return prod ? { productId: b.productId, newStock: prod.stock + b.qty } : null;
      }).filter(Boolean);
      await Promise.all(stockUpdates.map(u => supabase.from('products').update({ stock: u.newStock }).eq('id', u.productId)));

      const { error: saleError } = await supabase.from('sales').update({
        items: updatedItems, subtotal: newSubtotal, discount: newDiscount,
        total_sell_amount: newTotalSellAmount, total_cost_amount: newTotalCostAmount,
        paid_amount: newPaid, status: newStatus,
      }).eq('id', sale.id);
      if (saleError) throw saleError;

      const { error: txnError } = await supabase.from('transactions')
        .update({ amount: newTotalSellAmount, status: newStatus === 'Paid' ? 'Success' : 'Pending' })
        .eq('ref_id', sale.id);
      if (txnError) throw txnError;

      setProducts(prev => prev.map(p => {
        const u = stockUpdates.find(s => s.productId === p.id);
        return u ? { ...p, stock: u.newStock } : p;
      }));
      const updatedSale = {
        ...sale, items: updatedItems, subtotal: newSubtotal, discount: newDiscount,
        totalSellAmount: newTotalSellAmount, totalCostAmount: newTotalCostAmount,
        paidAmount: newPaid, status: newStatus,
      };
      setSales(prev => prev.map(s => s.id === sale.id ? updatedSale : s));
      setTransactions(prev => prev.map(t => t.refId === sale.id ? { ...t, amount: newTotalSellAmount, status: newStatus === 'Paid' ? 'Success' : 'Pending' } : t));

      // If the customer had already paid for what they're now returning, that cash goes back to them.
      if (cashRefund > 0) await adjustCashBalance(-cashRefund);

      setReturnModal(null);
      setReturnQtyInputs({});
    } catch (err) {
      alert('Could not process the return — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handleCloseTill = async (e) => {
    e.preventDefault();
    const counted = parseFloat(closeTillForm.countedAmount);
    if (isNaN(counted) || counted < 0) return alert('Enter the amount actually counted in the till.');

    const expected = shopSettings.cashBalance || 0;
    const difference = counted - expected; // positive = overage, negative = shortage

    try {
      if (difference !== 0) {
        const entry = {
          id: await nextSequentialId(transactions.map(t => t.id), 'TXN', 'TXN-'),
          type: difference > 0 ? 'Capital' : 'Expense',
          amount: Math.abs(difference),
          category: 'Till Reconciliation',
          note: closeTillForm.note || `Till count: Tk ${counted.toLocaleString()} vs expected Tk ${expected.toLocaleString()}`,
          status: 'Success',
          date: new Date().toISOString().split('T')[0],
        };
        const { error } = await supabase.from('transactions').insert(dbMap.transaction.toDb(entry));
        if (error) throw error;
        setTransactions(prev => [entry, ...prev]);
      }
      // Either way, the balance now reflects what was actually counted.
      await adjustCashBalance(difference);

      setShowCloseTillModal(false);
      setCloseTillForm({ countedAmount: '', note: '' });
      if (difference === 0) {
        alert('Till matches exactly — nice.');
      } else {
        alert(`Till closed. ${difference > 0 ? 'Overage' : 'Shortage'} of Tk ${Math.abs(difference).toLocaleString()} logged and balance updated.`);
      }
    } catch (err) {
      alert('Could not close the till — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  // Auto-fills a starting promo message when a product is picked; the shop owner can
  // still edit it freely before sending. {name} is replaced per-customer at send time.
  const handleSelectPromoProduct = (productId) => {
    setPromoProductId(productId);
    const prod = products.find(p => p.id === parseInt(productId, 10));
    if (prod) {
      setPromoMessage(
        `Hi {name}! 🎉 New arrival at ${shopSettings.shopName}: *${prod.name}* is now in stock for Tk ${prod.sellPrice.toLocaleString()}. Visit us or reply to this message to order — while stock lasts!`
      );
    }
  };

  const togglePromoCustomer = (id) => {
    setPromoSelectedCustomerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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

  // Business cash balance — "money I actually have on hand". Adjusted automatically by
  // Expenses (deduct), "Add Money" top-ups (add), and Due payments collected/paid (add/deduct).
  // Positive delta = cash coming in, negative delta = cash going out.
  const adjustCashBalance = async (delta) => {
    const newBalance = Math.round(((shopSettings.cashBalance || 0) + delta) * 100) / 100;
    const previousBalance = shopSettings.cashBalance || 0;
    setShopSettings(prev => ({ ...prev, cashBalance: newBalance }));
    try {
      const { error } = await supabase.from('shop_settings').update({ cash_balance: newBalance }).eq('user_id', session.user.id);
      if (error) throw error;
      return true;
    } catch (err) {
      // Roll back the optimistic update so the on-screen balance never drifts from the database.
      setShopSettings(prev => ({ ...prev, cashBalance: previousBalance }));
      alert('Could not update balance — ' + (err.message || 'please check your internet connection and try again.'));
      return false;
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData(activeTab === 'Products' ? { productCode: String(nextProductCode(products)) } : {});
    setCartItems([{ productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }]);
    setPurchaseItems([{ productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }]);
    setShowModal(true);
  };

  // Sales is now a full-screen, always-visible entry form rather than a modal, so it
  // needs its own explicit reset — otherwise a half-finished or just-edited sale would
  // still be sitting in the form the next time someone lands on this tab.
  const resetSaleForm = () => {
    setEditingItem(null);
    setFormData({});
    setCartItems([{ productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }]);
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
        const price = formData.saleType === 'Wholesale' ? (selectedProd.wholesalePrice ?? selectedProd.sellPrice) : selectedProd.sellPrice;
        updatedCart[index].customSellPrice = price;
        updatedCart[index].customProductPrice = price;
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

  // Switching between Retail and Wholesale re-prices every row already in the cart from
  // the product's retail vs. wholesale price, so the whole order stays consistent.
  const handleToggleSaleType = (newType) => {
    setFormData({ ...formData, saleType: newType });
    setCartItems(cartItems.map(item => {
      const prod = products.find(p => p.id === parseInt(item.productId, 10));
      if (!prod) return item;
      const newPrice = newType === 'Wholesale' ? (prod.wholesalePrice ?? prod.sellPrice) : prod.sellPrice;
      return { ...item, customSellPrice: newPrice, customProductPrice: newPrice };
    }));
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
  // Generates the next sequential id for a given prefix, starting at 10001.
  // This asks the database for the number atomically (via next_sequential_id RPC),
  // so two devices saving at the same time can never be handed the same number.
  // Falls back to a locally-computed guess only if that function isn't set up yet
  // (e.g. the fix-sequential-id-collisions.sql migration hasn't been run).
  const nextSequentialId = async (existingIds, dbPrefix, displayPrefix) => {
    try {
      const { data, error } = await supabase.rpc('next_sequential_id', { p_prefix: dbPrefix });
      if (error) throw error;
      if (data != null) return `${displayPrefix}${data}`;
    } catch (err) {
      console.warn('next_sequential_id RPC unavailable, falling back to local guess:', err.message);
    }
    const nums = existingIds
      .filter(id => id && id.startsWith(displayPrefix))
      .map(id => parseInt(id.slice(displayPrefix.length).replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 10001;
    return `${displayPrefix}${next}`;
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === 'Products') {
        const newStock = parseInt(formData.stock, 10) || 0;
        const active = formData.active !== false;
        const reorderLevel = active ? (parseInt(formData.reorderLevel, 10) || 5) : 0;
        const trimmedCode = (formData.productCode || '').toString().trim();
        if (trimmedCode) {
          const codeTaken = products.some(p => p.productCode === trimmedCode && (!editingItem || p.id !== editingItem.id));
          if (codeTaken) return alert(`Product code "${trimmedCode}" is already used by another product — pick a different one.`);
        }
        const productData = {
          name: formData.name,
          category: formData.category,
          productCode: trimmedCode || null,
          buyPrice: parseFloat(formData.buyPrice) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          wholesalePrice: formData.wholesalePrice !== '' && formData.wholesalePrice !== undefined && formData.wholesalePrice !== null ? parseFloat(formData.wholesalePrice) : null,
          stock: newStock,
          reorderLevel, active,
          lastSoldAt: formData.lastSoldAt || null,
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

        const isCombo = !!formData.isCombo;
        const comboPrice = parseFloat(formData.comboPrice) || 0;
        if (isCombo && comboPrice <= 0) return alert('Please enter the combo total price.');

        // First pass: validate stock and, for combo sales, work out each item's
        // share of the one combo price (weighted by its normal catalog price).
        const rawItems = [];
        let totalCatalogWeight = 0;
        for (let item of cartItems) {
          const prod = workingProducts.find(p => p.id === parseInt(item.productId, 10));
          if (!prod) return alert("Please select a valid product for all rows.");
          const qty = parseInt(item.qty, 10) || 1;
          if (qty > prod.stock) return alert(`Not enough stock for ${prod.name}. Available: ${prod.stock}`);
          const weight = prod.sellPrice * qty;
          totalCatalogWeight += weight;
          rawItems.push({ item, prod, qty, weight });
        }

        for (let { item, prod, qty, weight } of rawItems) {
          let originalPrice, customPrice;
          if (isCombo) {
            originalPrice = prod.sellPrice;
            const shareOfCombo = totalCatalogWeight > 0 ? (comboPrice * weight / totalCatalogWeight) : (comboPrice / rawItems.length);
            customPrice = shareOfCombo / qty;
          } else {
            originalPrice = parseFloat(item.customProductPrice) || prod.sellPrice;
            customPrice = parseFloat(item.customSellPrice) || prod.sellPrice;
          }
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
        if (isCombo) {
          // Rounding across items can leave a tiny remainder — fold it into the recorded subtotal
          // so the receipt always shows exactly the combo price the customer agreed to pay.
          subtotal = comboPrice;
        }

        const discount = parseFloat(formData.discount) || 0;
        const totalSellAmount = subtotal - discount;
        const orderId = editingItem ? editingItem.id : await nextSequentialId(sales.map(s => s.id), 'ORD', '#ORD-');

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
          date: formData.date || new Date().toISOString().split('T')[0],
          saleType: formData.saleType || 'Retail',
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
        const nowIso = new Date().toISOString();
        const stockUpdates = processedItems.map(item => {
          const prod = workingProducts.find(p => p.id === item.productId);
          return { productId: item.productId, newStock: Math.max(0, prod.stock - item.qty), lastSoldAt: nowIso };
        });

        if (editingItem) {
          const { error: saleError } = await supabase.from('sales').update(dbMap.sale.toDb(saleRecord)).eq('id', editingItem.id);
          if (saleError) throw saleError;

          const { error: txnError } = await supabase.from('transactions')
            .update({ amount: totalSellAmount, txn_date: saleRecord.date, status: saleRecord.status === 'Paid' ? 'Success' : 'Pending' })
            .eq('ref_id', editingItem.id);
          if (txnError) throw txnError;

          await Promise.all(stockUpdates.map(u => supabase.from('products').update({ stock: u.newStock, last_sold_at: u.lastSoldAt }).eq('id', u.productId)));

          setSales(sales.map(s => s.id === editingItem.id ? saleRecord : s));
          setTransactions(prev => prev.map(t =>
            t.refId === editingItem.id || t.id === `TXN-${editingItem.id.replace('#', '')}`
              ? { ...t, amount: totalSellAmount, date: saleRecord.date, status: saleRecord.status === 'Paid' ? 'Success' : 'Pending' }
              : t
          ));
          setProducts(prev => prev.map(p => {
            const u = stockUpdates.find(s => s.productId === p.id);
            return u ? { ...p, stock: u.newStock, lastSoldAt: u.lastSoldAt } : p;
          }));

          // Cash on hand moves by however much the paid amount changed on this edit.
          const paidDelta = saleRecord.paidAmount - (editingItem.paidAmount ?? 0);
          if (paidDelta !== 0) await adjustCashBalance(paidDelta);
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

          await Promise.all(stockUpdates.map(u => supabase.from('products').update({ stock: u.newStock, last_sold_at: u.lastSoldAt }).eq('id', u.productId)));

          setSales([saleRecord, ...sales]);
          setProducts(prev => prev.map(p => {
            const u = stockUpdates.find(s => s.productId === p.id);
            return u ? { ...p, stock: u.newStock, lastSoldAt: u.lastSoldAt } : p;
          }));
          setTransactions([autoTransaction, ...transactions]);

          // Whatever was actually paid right now (full, partial, or 0 for a due sale) hits the cash balance.
          if (saleRecord.paidAmount > 0) await adjustCashBalance(saleRecord.paidAmount);
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
        const customerData = { ...formData, name: formData.name || 'Walk-in Customer' };
        if (editingItem) {
          const { error } = await supabase.from('customers').update(dbMap.customer.toDb(customerData)).eq('id', editingItem.id);
          if (error) throw error;
          setCustomers(customers.map(c => c.id === editingItem.id ? { ...c, ...customerData } : c));
        } else {
          const { data, error } = await supabase.from('customers').insert(dbMap.customer.toDb(customerData)).select().single();
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
        const purchaseId = editingItem ? editingItem.id : await nextSequentialId(purchases.map(p => p.id), 'PUR', '#PUR-');
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

          // Cash on hand moves by however much the paid amount changed on this edit.
          const paidDelta = paidAmount - (editingItem.paidAmount ?? 0);
          if (paidDelta !== 0) await adjustCashBalance(-paidDelta);
        } else {
          const { error } = await supabase.from('purchases').insert(dbMap.purchase.toDb(purchaseRecord));
          if (error) throw error;
          setPurchases([{ ...purchaseRecord, dueAmount: Math.max(0, totalAmount - paidAmount) }, ...purchases]);

          // Whatever was actually paid to the supplier right now comes straight out of the cash balance.
          if (paidAmount > 0) await adjustCashBalance(-paidAmount);
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
            id: await nextSequentialId(transactions.map(t => t.id), 'TXN', 'TXN-'),
            ...formData,
            amount: parseFloat(formData.amount),
            date: new Date().toISOString().split('T')[0]
          };
          const { error } = await supabase.from('transactions').insert(dbMap.transaction.toDb(newTxn));
          if (error) throw error;
          setTransactions([newTxn, ...transactions]);
        }
      } else if (activeTab === 'Expenses') {
        if (!formData.category) return alert('Please choose an expense category.');
        const amount = parseFloat(formData.amount) || 0;
        if (amount <= 0) return alert('Please enter an amount greater than 0.');

        if (editingItem) {
          const oldAmount = editingItem.amount || 0;
          const updated = {
            ...editingItem, type: 'Expense', amount,
            category: formData.category, note: formData.note || '',
            date: formData.date || editingItem.date,
          };
          const { error } = await supabase.from('transactions').update(dbMap.transaction.toDb(updated)).eq('id', editingItem.id);
          if (error) throw error;
          setTransactions(transactions.map(t => t.id === editingItem.id ? updated : t));
          // Re-deduct only the difference so the balance reflects the corrected amount.
          if (amount !== oldAmount) await adjustCashBalance(oldAmount - amount);
        } else {
          const newExpense = {
            id: await nextSequentialId(transactions.map(t => t.id), 'TXN', 'TXN-'),
            type: 'Expense', amount,
            category: formData.category, note: formData.note || '',
            status: 'Success',
            date: formData.date || new Date().toISOString().split('T')[0],
          };
          const { error } = await supabase.from('transactions').insert(dbMap.transaction.toDb(newExpense));
          if (error) throw error;
          setTransactions([newExpense, ...transactions]);
          await adjustCashBalance(-amount);
        }
      } else if (activeTab === 'Warehouse') {
        const qty = parseInt(formData.qty, 10) || 0;
        if (qty < 0) return alert('Quantity cannot be negative.');
        const prod = formData.productId ? products.find(p => p.id === parseInt(formData.productId, 10)) : null;
        const warehouseData = {
          productId: prod ? prod.id : null,
          productName: prod ? prod.name : (formData.productName || 'Unnamed item'),
          category: prod ? prod.category : (formData.category || ''),
          qty,
        };

        if (editingItem) {
          const { error } = await supabase.from('warehouse_stock').update(dbMap.warehouse.toDb(warehouseData)).eq('id', editingItem.id);
          if (error) throw error;
          setWarehouseStock(warehouseStock.map(w => w.id === editingItem.id ? { ...w, ...warehouseData } : w));
        } else {
          const { data, error } = await supabase.from('warehouse_stock').insert(dbMap.warehouse.toDb(warehouseData)).select().single();
          if (error) throw error;
          setWarehouseStock([dbMap.warehouse.fromDb(data), ...warehouseStock]);
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
  // Move some or all of a warehouse item's quantity onto the shop floor —
  // deducts from the warehouse row and adds the same amount to the linked product's stock.
  // Quick +1/-1 stock adjustment straight from the Products list, no need to open the edit form.
  const handleAdjustStock = async (product, delta) => {
    const newStock = Math.max(0, product.stock + delta);
    if (newStock === product.stock) return;
    setProducts(products.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
    try {
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
      if (error) throw error;
    } catch (err) {
      setProducts(products.map(p => p.id === product.id ? { ...p, stock: product.stock } : p)); // revert on failure
      alert('Could not update stock — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  const handleTransferToShop = async (warehouseItem) => {
    const maxQty = warehouseItem.qty;
    const input = window.prompt(`How many units of "${warehouseItem.productName}" to move to the shop? (Available in warehouse: ${maxQty})`, String(maxQty));
    if (input === null) return;
    const transferQty = parseInt(input, 10);
    if (!transferQty || transferQty <= 0) return alert('Please enter a quantity greater than 0.');
    if (transferQty > maxQty) return alert(`You only have ${maxQty} units in the warehouse.`);

    try {
      const remaining = maxQty - transferQty;

      if (remaining <= 0) {
        const { error } = await supabase.from('warehouse_stock').delete().eq('id', warehouseItem.id);
        if (error) throw error;
        setWarehouseStock(warehouseStock.filter(w => w.id !== warehouseItem.id));
      } else {
        const { error } = await supabase.from('warehouse_stock').update({ qty: remaining }).eq('id', warehouseItem.id);
        if (error) throw error;
        setWarehouseStock(warehouseStock.map(w => w.id === warehouseItem.id ? { ...w, qty: remaining } : w));
      }

      if (warehouseItem.productId) {
        const prod = products.find(p => p.id === warehouseItem.productId);
        if (prod) {
          const newStock = prod.stock + transferQty;
          const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
          if (stockError) throw stockError;
          setProducts(products.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
        } else {
          alert(`Moved ${transferQty} units out of the warehouse, but couldn't find a matching shop product to add them to — you may need to add stock manually.`);
        }
      } else {
        alert(`Moved ${transferQty} units out of the warehouse. This item isn't linked to a shop product, so add it manually on the Products page if needed.`);
      }
    } catch (err) {
      alert('Could not transfer stock — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

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

  const handleDelete = (id, type) => {
    setDeleteConfirm({ id, type });
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    try {
      const tableMap = { Products: 'products', Sales: 'sales', Categories: 'categories', Customers: 'customers', Suppliers: 'suppliers', Transactions: 'transactions', Expenses: 'transactions', Damaged: 'damaged_products', Purchases: 'purchases', Warehouse: 'warehouse_stock' };

      // Looked up once, up front, so both the stock-restore step below and the
      // cash-balance-reversal step after the delete can both reference them.
      const saleToDelete = type === 'Sales' ? sales.find(s => s.id === id) : null;
      const purchaseToDelete = type === 'Purchases' ? purchases.find(p => p.id === id) : null;

      if (type === 'Sales') {
        // Put the sold quantities back into inventory before removing the sale record.
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
        // Whatever cash this sale had brought in comes back out of the balance.
        if (saleToDelete && saleToDelete.paidAmount > 0) await adjustCashBalance(-saleToDelete.paidAmount);
      }
      if (type === 'Categories') setCategories(categories.filter(c => c.id !== id));
      if (type === 'Customers') setCustomers(customers.filter(c => c.id !== id));
      if (type === 'Suppliers') setSuppliers(suppliers.filter(s => s.id !== id));
      if (type === 'Transactions') setTransactions(transactions.filter(t => t.id !== id));
      if (type === 'Expenses') {
        setTransactions(transactions.filter(t => t.id !== id));
        // This deleted transaction could be an Expense (deducted balance) or a Capital
        // entry (added to balance) — either way, undo exactly what it did.
        const deletedTxn = transactions.find(t => t.id === id);
        if (deletedTxn) {
          if (deletedTxn.type === 'Expense') await adjustCashBalance(deletedTxn.amount);
          else if (deletedTxn.type === 'Capital') await adjustCashBalance(-deletedTxn.amount);
        }
      }
      if (type === 'Warehouse') setWarehouseStock(warehouseStock.filter(w => w.id !== id));
      if (type === 'Damaged') setDamagedProducts(damagedProducts.filter(d => d.id !== id));
      if (type === 'Purchases') {
        setPurchases(purchases.filter(p => p.id !== id));
        // Whatever cash this purchase had paid out to the supplier comes back into the balance.
        if (purchaseToDelete && purchaseToDelete.paidAmount > 0) await adjustCashBalance(purchaseToDelete.paidAmount);
      }
      setDeleteConfirm(null);
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
  const handleExportData = async () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      shopName: shopSettings.shopName,
      categories,
      products,
      sales,
      customers,
      suppliers,
      transactions,
      purchases,
      damagedProducts,
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

    // Record when this happened, so the "backup reminder" banner knows to stay quiet for a while.
    const nowIso = new Date().toISOString();
    setShopSettings(prev => ({ ...prev, lastBackupAt: nowIso }));
    await supabase.from('shop_settings').update({ last_backup_at: nowIso }).eq('user_id', session.user.id);
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
          supabase.from('purchases').delete().gte('created_at', '1900-01-01'),
          supabase.from('damaged_products').delete().gte('created_at', '1900-01-01'),
          supabase.from('products').delete().gte('created_at', '1900-01-01'),
          supabase.from('categories').delete().gte('created_at', '1900-01-01'),
          supabase.from('customers').delete().gte('created_at', '1900-01-01'),
          supabase.from('suppliers').delete().gte('created_at', '1900-01-01'),
        ]);

        let newCategories = [], newProducts = [], newCustomers = [], newSuppliers = [], newSales = [], newTransactions = [], newPurchases = [], newDamaged = [];
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

        if (Array.isArray(data.purchases) && data.purchases.length) {
          // Re-point each purchase's line items at the newly generated product ids
          const remappedPurchases = data.purchases.map(p => ({
            ...p,
            items: (p.items || []).map(i => ({ ...i, productId: productIdMap[i.productId] ?? i.productId })),
          }));
          const { error } = await supabase.from('purchases').insert(remappedPurchases.map(dbMap.purchase.toDb));
          if (error) throw error;
          newPurchases = remappedPurchases;
        }

        if (Array.isArray(data.damagedProducts) && data.damagedProducts.length) {
          const remappedDamaged = data.damagedProducts.map(d => ({
            ...d, productId: productIdMap[d.productId] ?? d.productId,
          }));
          const { data: inserted, error } = await supabase.from('damaged_products').insert(remappedDamaged.map(dbMap.damaged.toDb)).select();
          if (error) throw error;
          newDamaged = inserted.map(dbMap.damaged.fromDb);
        }

        setCategories(newCategories);
        setProducts(newProducts);
        setCustomers(newCustomers);
        setSuppliers(newSuppliers);
        setSales(newSales);
        setTransactions(newTransactions);
        setPurchases(newPurchases);
        setDamagedProducts(newDamaged);

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

  // Merge-import products: matches existing products by name (case-insensitive, same
  // category), updating their price/stock/etc — everything else in the shop is untouched.
  const handleMergeImportProducts = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const incoming = Array.isArray(data) ? data : data.products;
        if (!Array.isArray(incoming) || incoming.length === 0) {
          alert('This file does not look like a product list. Expected an array of products, or an object with a "products" array.');
          return;
        }

        const existingByKey = {};
        products.forEach(p => { existingByKey[`${p.name.trim().toLowerCase()}__${(p.category || '').trim().toLowerCase()}`] = p; });

        const toUpdate = [];
        const toInsert = [];
        for (const np of incoming) {
          if (!np.name) continue;
          const key = `${String(np.name).trim().toLowerCase()}__${String(np.category || '').trim().toLowerCase()}`;
          const match = existingByKey[key];
          const productData = {
            name: np.name,
            category: np.category || 'Uncategorized',
            buyPrice: np.buyPrice ?? 0,
            sellPrice: np.sellPrice ?? 0,
            stock: np.stock ?? 0,
            reorderLevel: np.reorderLevel ?? 3,
            active: np.active !== false,
          };
          if (match) toUpdate.push({ id: match.id, productData });
          else toInsert.push(productData);
        }

        if (!window.confirm(`This will update ${toUpdate.length} existing product(s) and add ${toInsert.length} new product(s). Everything else in your shop stays untouched. Continue?`)) {
          return;
        }

        await Promise.all(toUpdate.map(u => supabase.from('products').update(dbMap.product.toDb(u.productData)).eq('id', u.id)));

        let insertedRows = [];
        if (toInsert.length > 0) {
          const { data: inserted, error } = await supabase.from('products').insert(toInsert.map(dbMap.product.toDb)).select();
          if (error) throw error;
          insertedRows = inserted.map(dbMap.product.fromDb);
        }

        setProducts(prev => [
          ...prev.map(p => {
            const u = toUpdate.find(x => x.id === p.id);
            return u ? { ...p, ...u.productData, id: p.id } : p;
          }),
          ...insertedRows,
        ]);

        alert(`Done — ${toUpdate.length} product(s) updated, ${toInsert.length} added.`);
      } catch (err) {
        alert('Could not import products — ' + (err.message || 'please check the file and your internet connection.'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Bulk-import customers: adds new customers, skips ones that already match by phone or name.
  const handleImportCustomers = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const incoming = Array.isArray(data) ? data : data.customers;
        if (!Array.isArray(incoming) || incoming.length === 0) {
          alert('This file does not look like a customer list. Expected an array of customers, or an object with a "customers" array.');
          return;
        }

        const existingKeys = new Set(customers.map(c => (c.phone || c.name || '').trim().toLowerCase()).filter(Boolean));
        const toInsert = incoming
          .filter(c => c.name || c.phone)
          .filter(c => !existingKeys.has((c.phone || c.name || '').trim().toLowerCase()))
          .map(c => ({ name: c.name || 'Walk-in Customer', email: c.email || '', phone: c.phone || '', address: c.address || '' }));

        if (toInsert.length === 0) {
          alert('No new customers to add — everyone in this file already matches an existing customer.');
          return;
        }
        if (!window.confirm(`This will add ${toInsert.length} new customer(s). Continue?`)) return;

        const { data: inserted, error } = await supabase.from('customers').insert(toInsert.map(dbMap.customer.toDb)).select();
        if (error) throw error;
        setCustomers(prev => [...prev, ...inserted.map(dbMap.customer.fromDb)]);
        alert(`Added ${inserted.length} new customer(s).`);
      } catch (err) {
        alert('Could not import customers — ' + (err.message || 'please check the file and your internet connection.'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportDailyReportCSV = () => {
    const headers = ['Date', 'Sales Paid', 'Sales With Due', 'Sales Total', 'Sales Due', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit', 'Purchases Total', 'Purchases Paid', 'Purchases Due'];
    const rows = [...last14DaysStats].reverse().map(d => [d.date, d.salesPaidTotal, d.salesWithDueTotal, d.salesTotal, d.salesDue, d.cogs, d.grossProfit, d.expensesTotal, d.netProfit, d.purchasesTotal, d.purchasesPaid, d.purchasesDue]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(shopSettings.shopName || 'shop').replace(/\s+/g, '_')}_daily_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculations
  // "Previous Due" entries (id starts with #DUE-) record old debt from before this software
  // was in use — they're real for Due Amounts tracking, but must NOT count as new sales
  // revenue/profit, or they inflate performance numbers and pollute Best Sellers with a
  // fake "product" called "Previous Due (Opening Balance)".
  const realSales = sales.filter(s => !(s.id || '').startsWith('#DUE-'));
  const totalSellAmount = realSales.reduce((sum, sale) => sum + sale.totalSellAmount, 0);
  const costOfGoodsSold = realSales.reduce((sum, sale) => sum + sale.totalCostAmount, 0);
  const netProfit = totalSellAmount - costOfGoodsSold;
  const currentInventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  const lowStockProducts = products.filter(p => p.active !== false && p.stock <= (p.reorderLevel || 5));
  const totalProductCount = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const [showLowStock, setShowLowStock] = useState(false);
  const productsWithoutCode = products.filter(p => !p.productCode);

  const handleAssignAllProductCodes = async () => {
    if (productsWithoutCode.length === 0) return;
    if (!window.confirm(`Assign sequential codes (starting from ${nextProductCode(products)}) to the ${productsWithoutCode.length} product(s) that don't have one yet?`)) return;
    try {
      let nextCode = nextProductCode(products);
      const updates = productsWithoutCode.map(p => ({ id: p.id, productCode: String(nextCode++) }));
      await Promise.all(updates.map(u => supabase.from('products').update({ product_code: u.productCode }).eq('id', u.id)));
      setProducts(prev => prev.map(p => {
        const u = updates.find(x => x.id === p.id);
        return u ? { ...p, productCode: u.productCode } : p;
      }));
    } catch (err) {
      alert('Could not assign codes — ' + (err.message || 'please check your internet connection and try again.'));
    }
  };

  // Backup reminder — nudge if it's been a while (or never) since the last export.
  const daysSinceBackup = shopSettings.lastBackupAt
    ? Math.floor((Date.now() - new Date(shopSettings.lastBackupAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const backupIsOverdue = daysSinceBackup === null || daysSinceBackup >= 1;

  // Dashboard "Monthly Revenue Overview" — the last 6 calendar months of real sales,
  // built from actual sale dates instead of the old hardcoded sample numbers.
  const monthlyRevenueData = (() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, month: d.toLocaleString('en-US', { month: 'short' }), sales: 0 });
    }
    sales.forEach(s => {
      if (!s.date || (s.id || '').startsWith('#DUE-')) return;
      const key = s.date.slice(0, 7);
      const bucket = months.find(m => m.key === key);
      if (bucket) bucket.sales += s.totalSellAmount;
    });
    return months;
  })();

  // Safe lookup map used by the generic tables instead of eval()
  const genericDataMap = { categories, customers, suppliers, damaged: damagedProducts, purchases };

  // --- Daily Report: sales, purchases, and profit grouped by calendar day ---
  const dailyStatsFor = (dateStr) => {
    const daySales = sales.filter(s => s.date === dateStr && !(s.id || '').startsWith('#DUE-'));
    const salesFullyPaid = daySales.filter(s => s.status === 'Paid');
    const salesWithDue = daySales.filter(s => s.status !== 'Paid'); // Due or Partial

    const dayPurchases = purchases.filter(p => p.date === dateStr);
    const dayExpenses = transactions.filter(t => t.type === 'Expense' && t.date === dateStr);

    const salesTotal = daySales.reduce((sum, s) => sum + s.totalSellAmount, 0);
    const salesCollected = daySales.reduce((sum, s) => sum + (s.paidAmount ?? s.totalSellAmount), 0);
    const salesPaidTotal = salesFullyPaid.reduce((sum, s) => sum + s.totalSellAmount, 0);
    const salesWithDueTotal = salesWithDue.reduce((sum, s) => sum + s.totalSellAmount, 0);

    const cogs = daySales.reduce((sum, s) => sum + s.totalCostAmount, 0);
    const purchasesTotal = dayPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const purchasesPaid = dayPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const expensesTotal = dayExpenses.reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = salesTotal - cogs;
    const netProfit = grossProfit - expensesTotal;

    return {
      date: dateStr,
      salesCount: daySales.length, salesTotal, salesCollected, salesDue: Math.max(0, salesTotal - salesCollected),
      salesPaidCount: salesFullyPaid.length, salesPaidTotal,
      salesWithDueCount: salesWithDue.length, salesWithDueTotal,
      cogs, profit: grossProfit, grossProfit,
      expensesCount: dayExpenses.length, expensesTotal, netProfit,
      purchasesCount: dayPurchases.length, purchasesTotal, purchasesPaid, purchasesDue: Math.max(0, purchasesTotal - purchasesPaid),
    };
  };
  const selectedDayStats = dailyStatsFor(reportDate);
  // Last 14 calendar days (including today), most recent first, for the trend table
  const last14DaysStats = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return dailyStatsFor(d.toISOString().split('T')[0]);
  });

  // --- Expenses: transactions of type 'Expense', with category breakdown ---
  const expenseTransactions = transactions
    .filter(t => t.type === 'Expense')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalExpensesAllTime = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const totalExpensesToday = expenseTransactions.filter(t => t.date === todayStr).reduce((sum, t) => sum + t.amount, 0);
  const thisMonthPrefix = todayStr.slice(0, 7); // YYYY-MM
  const totalExpensesThisMonth = expenseTransactions.filter(t => t.date.startsWith(thisMonthPrefix)).reduce((sum, t) => sum + t.amount, 0);
  const expensesByCategory = expenseTransactions.reduce((acc, t) => {
    const cat = t.category || 'Other';
    acc[cat] = (acc[cat] || 0) + t.amount;
    return acc;
  }, {});
  const netProfitAfterExpenses = netProfit - totalExpensesAllTime;

  // --- Retail vs. Wholesale breakdown, for the Reports page ---
  const retailSales = realSales.filter(s => (s.saleType || 'Retail') === 'Retail');
  const wholesaleSales = realSales.filter(s => s.saleType === 'Wholesale');
  const retailRevenue = retailSales.reduce((sum, s) => sum + s.totalSellAmount, 0);
  const retailProfit = retailSales.reduce((sum, s) => sum + (s.totalSellAmount - s.totalCostAmount), 0);
  const wholesaleRevenue = wholesaleSales.reduce((sum, s) => sum + s.totalSellAmount, 0);
  const wholesaleProfit = wholesaleSales.reduce((sum, s) => sum + (s.totalSellAmount - s.totalCostAmount), 0);
  const capitalTotal = transactions.filter(t => t.type === 'Capital').reduce((sum, t) => sum + t.amount, 0);

  // --- Money added to the business (capital injections logged via "Add Money") ---
  const capitalTransactions = transactions
    .filter(t => t.type === 'Capital')
    .sort((a, b) => new Date(b.date) - new Date(a.date));

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

  // Due Amounts page: apply the date-range + customer/supplier filters on top of the base lists
  const filteredCustomerDues = customerDues.filter(s =>
    (!dueDateFrom || s.date >= dueDateFrom) &&
    (!dueDateTo || s.date <= dueDateTo) &&
    (!duePartyFilter || s.customer === duePartyFilter)
  );
  const filteredVendorDues = vendorDues.filter(p =>
    (!dueDateFrom || p.date >= dueDateFrom) &&
    (!dueDateTo || p.date <= dueDateTo) &&
    (!duePartyFilter || p.supplier === duePartyFilter)
  );
  const filteredCustomerDueTotal = filteredCustomerDues.reduce((sum, s) => sum + s.dueAmount, 0);
  const filteredVendorDueTotal = filteredVendorDues.reduce((sum, p) => sum + p.dueAmount, 0);

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
    (!currentSearch || p.name.toLowerCase().includes(currentSearch) || (p.category || '').toLowerCase().includes(currentSearch) || (p.productCode || '').toLowerCase().includes(currentSearch)) &&
    (!productCategoryFilter || p.category === productCategoryFilter)
  );
  const purchaseItemsSummary = (p) => (p.items || []).map(i => i.productName).join(', ');
  const filteredPurchases = (purchases || []).filter(p =>
    !currentSearch ||
    (p.id || '').toLowerCase().includes(currentSearch) ||
    (p.supplier || '').toLowerCase().includes(currentSearch) ||
    purchaseItemsSummary(p).toLowerCase().includes(currentSearch)
  );
  // Products grouped by category, for the category-wise browsing view.
  // Within each category: items sold today surface first (most recent first), then the rest A-Z.
  const productsByCategory = filteredProducts.reduce((acc, p) => {
    const key = p.category || 'Uncategorized';
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});
  const todayDateStr = new Date().toISOString().split('T')[0];
  Object.keys(productsByCategory).forEach(key => {
    productsByCategory[key].sort((a, b) => {
      const aSoldToday = a.lastSoldAt && a.lastSoldAt.startsWith(todayDateStr);
      const bSoldToday = b.lastSoldAt && b.lastSoldAt.startsWith(todayDateStr);
      if (aSoldToday && bSoldToday) return new Date(b.lastSoldAt) - new Date(a.lastSoldAt);
      if (aSoldToday) return -1;
      if (bSoldToday) return 1;
      return a.name.localeCompare(b.name);
    });
  });
  const filteredSales = sales.filter(s =>
    !currentSearch ||
    s.id.toLowerCase().includes(currentSearch) ||
    (s.customer || '').toLowerCase().includes(currentSearch) ||
    (s.customerPhone || '').toLowerCase().includes(currentSearch)
  );
  const totalWarehouseUnits = warehouseStock.reduce((sum, w) => sum + w.qty, 0);
  const filteredWarehouseStock = warehouseStock.filter(w =>
    !currentSearch ||
    (w.productName || '').toLowerCase().includes(currentSearch) ||
    (w.category || '').toLowerCase().includes(currentSearch)
  );

  const filteredExpenses = expenseTransactions.filter(t =>
    !currentSearch ||
    (t.category || '').toLowerCase().includes(currentSearch) ||
    (t.note || '').toLowerCase().includes(currentSearch)
  );
  const salesById = sales.reduce((acc, s) => { acc[s.id] = s; return acc; }, {});
  const transactionProfit = (t) => {
    if (t.type !== 'Income' || !t.refId) return null;
    const sale = salesById[t.refId];
    return sale ? sale.totalSellAmount - sale.totalCostAmount : null;
  };
  const filteredTransactions = transactions
    .filter(t =>
      !currentSearch ||
      (t.id || '').toLowerCase().includes(currentSearch) ||
      (t.refId || '').toLowerCase().includes(currentSearch) ||
      (t.type || '').toLowerCase().includes(currentSearch) ||
      (salesById[t.refId]?.customer || '').toLowerCase().includes(currentSearch)
    )
    .filter(t => {
      if (transactionTypeFilter === 'All') return true;
      const linkedSale = t.type === 'Income' ? salesById[t.refId] : null;
      return linkedSale && (linkedSale.saleType || 'Retail') === transactionTypeFilter;
    });
  const filteredGenericRows = (list) => (list || []).filter(item =>
    !currentSearch || Object.values(item).some(v => String(v).toLowerCase().includes(currentSearch))
  );

  // --- Dashboard insights ---
  const allSoldProducts = (() => {
    const totalsByProduct = {};
    realSales.forEach(s => s.items.forEach(i => {
      totalsByProduct[i.productId] = totalsByProduct[i.productId] || { productId: i.productId, name: i.productName, qty: 0, revenue: 0 };
      totalsByProduct[i.productId].qty += i.qty;
      totalsByProduct[i.productId].revenue += i.lineTotal;
    }));
    return Object.values(totalsByProduct)
      .map(p => ({ ...p, currentStock: products.find(prod => prod.id === p.productId)?.stock ?? null }))
      .sort((a, b) => b.qty - a.qty);
  })();

  const recentSales = [...realSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const navItems = [
    { name: 'Dashboard', icon: Home }, { name: 'Products', icon: Box },
    { name: 'Categories', icon: Layers }, { name: 'Inventory', icon: Warehouse },
    { name: 'Sales', icon: ShoppingCart }, { name: 'Purchases', icon: PackagePlus },
    { name: 'Advance Payments', icon: PackageOpen },
    { name: 'Warehouse', icon: Boxes },
    { name: 'Damaged', icon: AlertTriangle },
    { name: 'Customers', icon: Users },
    { name: 'Promotions', icon: Megaphone },
    { name: 'Suppliers', icon: Truck }, { name: 'Transactions', icon: ArrowLeftRight },
    { name: 'Expenses', icon: Receipt },
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

        /* Sales receipts print small, on a 2in x 4in thermal label/receipt.
           Supplier invoices print big, full-page — so the two use separate named @page sizes. */
        @page { size: A4; margin: 12mm; }
        @page pos-receipt { size: 2in 4in; margin: 1mm; }

        @media print {
          html, body {
            width: 2in;
          }
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
            width: 2in !important;
            max-width: 2in !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          #printable-invoice-modal * {
            box-sizing: border-box;
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

      {/* Mobile hamburger toggle — only visible on small screens */}
      <button
        onClick={() => setMobileSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl bg-[var(--bg-sidebar)] text-white flex items-center justify-center shadow-lg no-print"
      >
        <Layers className="w-5 h-5" />
      </button>

      {/* Backdrop behind the mobile sidebar drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40 no-print" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-72 bg-[var(--bg-sidebar)] text-white flex flex-col p-6 shrink-0 no-print transition-transform duration-300 fixed md:static inset-y-0 left-0 z-50 md:translate-x-0 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
        <button onClick={() => setMobileSidebarOpen(false)} className="md:hidden self-end text-slate-400 hover:text-white mb-2">
          <X className="w-5 h-5" />
        </button>
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
                onClick={() => { setActiveTab(item.name); setShowModal(false); setMobileSidebarOpen(false); if (item.name === 'Sales') resetSaleForm(); }}
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
      <main key={activeTab} className="tab-enter flex-1 p-4 pt-16 md:p-8 md:pt-8 overflow-y-auto w-full">
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
            {['Products', 'Categories', 'Purchases', 'Damaged', 'Customers', 'Suppliers', 'Transactions', 'Advance Payments', 'Expenses', 'Warehouse'].includes(activeTab) && (
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
            {activeTab === 'Customers' && (
              <button
                onClick={() => handleOpenPreviousDue(null)}
                className="bg-white border-2 border-orange-500 text-orange-600 text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-50 shadow-sm transition-all"
              >
                <Wallet className="w-5 h-5" /> Add Previous Due
              </button>
            )}
            {['Products', 'Categories', 'Purchases', 'Damaged', 'Customers', 'Suppliers', 'Transactions', 'Expenses', 'Warehouse'].includes(activeTab) && (
              <button 
                onClick={handleOpenAdd}
                className="bg-orange-500 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Add New {activeTab === 'Damaged' ? 'Damage Entry' : activeTab === 'Warehouse' ? 'Warehouse Stock' : activeTab.slice(0, -1)}
              </button>
            )}
          </div>
        </div>

        {/* Low Stock Banner — hidden by default, click to reveal, grouped by category */}
        {lowStockProducts.length > 0 && (activeTab === 'Dashboard' || activeTab === 'Inventory') && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 no-print">
            <button
              type="button"
              onClick={() => setShowLowStock(!showLowStock)}
              className="w-full flex items-start gap-4 text-left"
            >
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-amber-900 font-bold text-base flex items-center gap-2">
                  Low Stock Alert ({lowStockProducts.length} Items Below Threshold)
                  <span className="text-xs font-semibold text-amber-600 underline">{showLowStock ? 'Hide' : 'Show'}</span>
                </h4>
                {!showLowStock && <p className="text-amber-700 text-sm mt-1">Click to see which products need restocking.</p>}
              </div>
            </button>
            {showLowStock && (
              <div className="mt-4 pl-10 space-y-3">
                {Object.entries(
                  lowStockProducts.reduce((acc, p) => {
                    const key = p.category || 'Uncategorized';
                    (acc[key] = acc[key] || []).push(p);
                    return acc;
                  }, {})
                ).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">{cat}</p>
                    <p className="text-amber-700 text-sm">{items.map(p => `${p.name} (${p.stock} left)`).join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backup Reminder Banner — nudges when it's been a week+ (or never) since the last export */}
        {backupIsOverdue && activeTab === 'Dashboard' && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 no-print flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Download className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-900 font-bold text-base">
                  {daysSinceBackup === null ? "You haven't backed up your data yet" : `It's been ${daysSinceBackup} day${daysSinceBackup !== 1 ? 's' : ''} since your last backup`}
                </h4>
                <p className="text-blue-700 text-sm mt-1">Export a copy regularly so a lost device or browser issue never costs you your records.</p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-sm transition-all shrink-0"
            >
              <Download className="w-4 h-4" /> Backup Now
            </button>
          </div>
        )}

        {/* Dynamic Add / Edit Modal */}
        {showModal && activeTab !== 'Sales' && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className={`bg-[var(--bg-card)] rounded-2xl p-5 md:p-8 shadow-2xl border border-[var(--border-card)] transition-colors w-full max-w-[95vw] max-h-[90vh] overflow-y-auto ${activeTab === 'Sales' ? 'md:w-[700px]' : 'md:w-[480px]'}`}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingItem ? 'Edit' : 'Add New'} {activeTab === 'Damaged' ? 'Damage Entry' : activeTab === 'Warehouse' ? 'Warehouse Stock' : activeTab.slice(0, -1)}</h3>
                <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
                {activeTab === 'Products' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Product Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <div>
                      <input name="productCode" defaultValue={formData.productCode || ''} placeholder="Product Code" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Your own reference number for this product — auto-suggested, but you can change it to anything.</p>
                    </div>
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
                    <div>
                      <input name="wholesalePrice" type="number" step="0.01" defaultValue={formData.wholesalePrice ?? ''} placeholder="Wholesale Price (Tk) — optional" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <p className="text-[11px] text-[var(--text-muted)] mt-1">Used automatically when a sale is switched to Wholesale mode. Leave blank to fall back to the retail sell price.</p>
                    </div>
                    <div className="flex gap-4">
                      <input required name="stock" type="number" defaultValue={formData.stock !== undefined ? formData.stock : ''} placeholder="Current Stock" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <input required name="reorderLevel" type="number" disabled={formData.active === false} defaultValue={formData.reorderLevel !== undefined ? formData.reorderLevel : ''} placeholder="Reorder Level" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50" />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border-card)] rounded-xl p-3">
                      <input
                        type="checkbox"
                        checked={formData.active !== false}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked, reorderLevel: e.target.checked ? formData.reorderLevel : 0 })}
                        className="w-4 h-4 accent-orange-500"
                      />
                      Active — included in low-stock alerts and reorder suggestions
                    </label>
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
                    <input name="name" defaultValue={formData.name || ''} placeholder="Full Name (optional)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="email" type="email" defaultValue={formData.email || ''} placeholder="Email Address (optional)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="phone" defaultValue={formData.phone || ''} placeholder="Phone Number (optional)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
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

                {activeTab === 'Expenses' && (
                  <>
                    <select required name="category" defaultValue={formData.category || ''} onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                      <option value="">Select Expense Category...</option>
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input required name="amount" type="number" step="0.01" defaultValue={formData.amount || ''} placeholder="Amount (Tk)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="date" type="date" defaultValue={formData.date || new Date().toISOString().split('T')[0]} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="note" defaultValue={formData.note || ''} placeholder="Note (optional — e.g. 'lunch for staff')" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </>
                )}

                {activeTab === 'Warehouse' && (
                  <>
                    <p className="text-xs text-[var(--text-muted)]">
                      Link this to a shop product so "Transfer to Shop" can add straight into its stock — or leave it unlinked for a custom/unlisted item.
                    </p>
                    <select
                      name="productId"
                      defaultValue={formData.productId || ''}
                      onChange={(e) => {
                        const prod = products.find(p => p.id === parseInt(e.target.value, 10));
                        setFormData({ ...formData, productId: e.target.value, productName: prod ? prod.name : formData.productName, category: prod ? prod.category : formData.category });
                      }}
                      className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Not linked to a tracked product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input required name="productName" defaultValue={formData.productName || ''} placeholder="Item Name" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input name="category" defaultValue={formData.category || ''} placeholder="Category (optional)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    <input required name="qty" type="number" min="0" defaultValue={formData.qty ?? ''} placeholder="Quantity in Warehouse" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
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

        {/* DELETE CONFIRMATION MODAL — replaces the native window.confirm() dialog */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] w-[400px] transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-red-100 rounded-full p-3 flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Delete this record?</h3>
                  <p className="text-[var(--text-secondary)] text-sm mt-1">This will permanently remove it{deleteConfirm.type ? ` from ${deleteConfirm.type}` : ''}. This action cannot be undone.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                <button onClick={confirmDeleteItem} className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PREVIOUS DUE MODAL — records a customer's pre-existing balance without a real sale */}
        {showPreviousDueModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 shadow-2xl border border-[var(--border-card)] transition-colors w-full max-w-[95vw] md:w-[420px]">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" /> Add Previous Due
                </h3>
                <button onClick={() => setShowPreviousDueModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Records money a customer already owed you before you started using this app — no product sale needed, just the amount and who owes it.
              </p>

              <form onSubmit={handleSavePreviousDue} className="space-y-3">
                <input
                  required
                  value={previousDueForm.customer}
                  onChange={(e) => setPreviousDueForm({ ...previousDueForm, customer: e.target.value })}
                  placeholder="Customer Name"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  value={previousDueForm.customerPhone}
                  onChange={(e) => setPreviousDueForm({ ...previousDueForm, customerPhone: e.target.value })}
                  placeholder="Phone Number (optional)"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  required
                  type="number" step="0.01" min="0.01"
                  value={previousDueForm.amount}
                  onChange={(e) => setPreviousDueForm({ ...previousDueForm, amount: e.target.value })}
                  placeholder="Amount Owed (Tk)"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  type="date"
                  value={previousDueForm.date}
                  onChange={(e) => setPreviousDueForm({ ...previousDueForm, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  value={previousDueForm.note}
                  onChange={(e) => setPreviousDueForm({ ...previousDueForm, note: e.target.value })}
                  placeholder="Note (optional — e.g. 'Opening balance from notebook')"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />

                <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setShowPreviousDueModal(false)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Save Due</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RECORD PAYMENT MODAL — a fast, dedicated way to log a partial or full payment
           against a due sale/purchase from the Due Amounts page, without opening the full editor. */}
        {paymentModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] w-[420px] transition-colors">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Record Payment</h3>
                <button onClick={() => setPaymentModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={submitRecordPayment} className="space-y-4 text-sm">
                {(() => {
                  const { kind, record } = paymentModal;
                  const total = kind === 'customer' ? record.totalSellAmount : record.totalAmount;
                  const paid = record.paidAmount ?? 0;
                  const due = Math.max(0, total - paid);
                  return (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border-card)] space-y-1">
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">{kind === 'customer' ? 'Customer' : 'Supplier'}</span><span className="font-bold text-[var(--text-primary)]">{kind === 'customer' ? record.customer : record.supplier}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">{kind === 'customer' ? 'Order' : 'Purchase'} ID</span><span className="font-bold text-orange-600">{record.id}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total</span><span className="text-[var(--text-primary)]">Tk {total.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Already Paid</span><span className="text-emerald-700">Tk {paid.toLocaleString()}</span></div>
                      <div className="flex justify-between pt-1 mt-1 border-t border-[var(--border-card)]"><span className="font-bold text-[var(--text-primary)]">Due Now</span><span className="font-black text-red-600">Tk {due.toLocaleString()}</span></div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">
                    {paymentModal.kind === 'customer' ? 'Amount received now' : 'Amount you\'re paying now'}
                  </label>
                  <input
                    required
                    autoFocus
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentAmountInput}
                    onChange={(e) => setPaymentAmountInput(e.target.value)}
                    placeholder="Tk"
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    {paymentModal.kind === 'customer'
                      ? "This is added to the sale's paid amount and to your business balance."
                      : "This is added to the purchase's paid amount and deducted from your business balance."}
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setPaymentModal(null)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">Record Payment</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD MONEY MODAL — logs a capital injection (owner deposit, loan, etc.) and tops up the business cash balance */}
        {showAddMoneyModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] w-[420px] transition-colors">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Add Money to Balance</h3>
                <button onClick={() => setShowAddMoneyModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveAddMoney} className="space-y-4 text-sm">
                <input
                  required autoFocus type="number" step="0.01" min="0.01"
                  value={addMoneyForm.amount}
                  onChange={(e) => setAddMoneyForm({ ...addMoneyForm, amount: e.target.value })}
                  placeholder="Amount (Tk)"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                />
                <input
                  type="date"
                  value={addMoneyForm.date}
                  onChange={(e) => setAddMoneyForm({ ...addMoneyForm, date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <input
                  value={addMoneyForm.note}
                  onChange={(e) => setAddMoneyForm({ ...addMoneyForm, note: e.target.value })}
                  placeholder="Note (optional — e.g. 'Own savings deposit')"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-[11px] text-[var(--text-muted)]">
                  This adds straight to your business balance and is logged below so you can always see where it came from.
                </p>
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setShowAddMoneyModal(false)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">Add Money</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PROCESS RETURN MODAL — returns some or all items from a past sale: restocks
           product(s), shrinks the sale's total, and refunds cash if the customer had
           already paid for what's coming back, without deleting the original sale. */}
        {returnModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm p-4 no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 md:p-8 shadow-2xl border border-[var(--border-card)] w-full max-w-[95vw] md:w-[560px] max-h-[90vh] overflow-y-auto transition-colors">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Process Return</h3>
                  <p className="text-xs text-[var(--text-muted)]">{returnModal.id} · {returnModal.customer}</p>
                </div>
                <button onClick={() => setReturnModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={submitProcessReturn} className="space-y-4 text-sm">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {returnModal.items.map((item, idx) => {
                    const remaining = item.qty - (item.returnedQty || 0);
                    if (remaining <= 0) return null;
                    return (
                      <div key={idx} className="bg-[var(--bg-hover)] rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--text-primary)] truncate">{item.productName}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            Sold {item.qty} @ Tk {item.sellPrice.toLocaleString()}
                            {item.returnedQty > 0 && ` · ${item.returnedQty} already returned`}
                            {' · '}{remaining} returnable
                          </p>
                        </div>
                        <input
                          type="number" min="0" max={remaining}
                          value={returnQtyInputs[idx] || ''}
                          onChange={(e) => setReturnQtyInputs({ ...returnQtyInputs, [idx]: e.target.value })}
                          placeholder="0"
                          className="w-20 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-center font-bold shrink-0"
                        />
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  let refundPreview = 0;
                  returnModal.items.forEach((item, idx) => {
                    const remaining = item.qty - (item.returnedQty || 0);
                    const qty = Math.min(parseInt(returnQtyInputs[idx], 10) || 0, remaining);
                    refundPreview += qty * item.sellPrice;
                  });
                  const oldPaid = returnModal.paidAmount ?? 0;
                  const newTotal = Math.max(0, returnModal.totalSellAmount - refundPreview);
                  const cashBack = Math.max(0, oldPaid - newTotal);
                  if (refundPreview <= 0) return null;
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-blue-700">Value being returned</span><span className="font-bold text-blue-900">Tk {refundPreview.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-blue-700">New sale total</span><span className="font-bold text-blue-900">Tk {newTotal.toLocaleString()}</span></div>
                      {cashBack > 0 && (
                        <div className="flex justify-between pt-1 mt-1 border-t border-blue-200"><span className="font-bold text-blue-900">Cash refund to customer</span><span className="font-black text-blue-900">Tk {cashBack.toLocaleString()}</span></div>
                      )}
                    </div>
                  );
                })()}

                <p className="text-[11px] text-[var(--text-muted)]">Returned quantities go back into stock automatically. If the customer already paid for these items, that amount comes out of your business balance as a refund.</p>

                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setReturnModal(null)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700">Process Return</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CLOSE TILL MODAL — end-of-day cash count vs. what the system expects */}
        {showCloseTillModal && (
          <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center z-50 backdrop-blur-sm no-print">
            <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-2xl border border-[var(--border-card)] w-[420px] transition-colors">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Close Till</h3>
                <button onClick={() => setShowCloseTillModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCloseTill} className="space-y-4 text-sm">
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border-card)] flex justify-between">
                  <span className="text-[var(--text-muted)]">System expects</span>
                  <span className="font-bold text-[var(--text-primary)]">Tk {(shopSettings.cashBalance || 0).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-[var(--text-secondary)] font-semibold mb-1.5">Cash actually counted</label>
                  <input
                    required autoFocus type="number" step="0.01" min="0"
                    value={closeTillForm.countedAmount}
                    onChange={(e) => setCloseTillForm({ ...closeTillForm, countedAmount: e.target.value })}
                    placeholder="Tk"
                    className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                  />
                </div>
                {closeTillForm.countedAmount !== '' && !isNaN(parseFloat(closeTillForm.countedAmount)) && (() => {
                  const diff = parseFloat(closeTillForm.countedAmount) - (shopSettings.cashBalance || 0);
                  if (diff === 0) return <p className="text-emerald-600 text-sm font-semibold">Matches exactly.</p>;
                  return (
                    <p className={`text-sm font-semibold ${diff > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {diff > 0 ? `Tk ${diff.toLocaleString()} over` : `Tk ${Math.abs(diff).toLocaleString()} short`} — this will be logged and the balance corrected to match what you counted.
                    </p>
                  );
                })()}
                <input
                  value={closeTillForm.note}
                  onChange={(e) => setCloseTillForm({ ...closeTillForm, note: e.target.value })}
                  placeholder="Note (optional)"
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-card)]">
                  <button type="button" onClick={() => setShowCloseTillModal(false)} className="px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">Close Till</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE INVOICE MODAL — sized for a 2in x 4in thermal receipt printer */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white text-slate-800 rounded-xl w-[220px] shadow-2xl border border-slate-200 overflow-hidden relative font-mono" id="printable-invoice-modal">

              <div className="p-3 text-center border-b border-dashed border-slate-300">
                <div className="w-8 h-8 mx-auto mb-1.5 bg-orange-500 text-white rounded-lg flex items-center justify-center font-black text-sm">
                  {(shopSettings.shopName || 'S').charAt(0)}
                </div>
                <p className="font-extrabold text-xs uppercase tracking-wide leading-tight">{shopSettings.shopName}</p>
                <p className="text-[9px] text-slate-500 mt-1 leading-snug">{shopSettings.address}</p>
                <p className="text-[9px] text-slate-500">{shopSettings.phone}</p>
              </div>

              <div className="px-3 py-2.5 text-[9px] space-y-0.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>Invoice:</span><span className="font-bold">{selectedReceipt.id}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{selectedReceipt.date}</span></div>
                <div className="flex justify-between"><span>Status:</span><span className="font-bold">{selectedReceipt.status}</span></div>
                <div className="flex justify-between gap-1"><span>Customer:</span><span className="font-bold text-right">{selectedReceipt.customer}</span></div>
                {selectedReceipt.customerPhone && <div className="flex justify-between"><span>Phone:</span><span>{selectedReceipt.customerPhone}</span></div>}
              </div>

              <div className="px-3 py-2.5 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-[9px] font-bold uppercase text-slate-500 mb-1.5">
                  <span>Item</span><span>Total</span>
                </div>
                <div className="space-y-1.5">
                  {selectedReceipt.items.map((item, idx) => (
                    <div key={idx} className="text-[10px]">
                      <div className="flex justify-between font-semibold gap-1">
                        <span className="pr-1 break-words">{item.productName}</span>
                        <span className="whitespace-nowrap">Tk {item.lineTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">{item.qty} x Tk {item.sellPrice.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-3 py-2.5 text-[10px] space-y-1 border-b border-dashed border-slate-300">
                <div className="flex justify-between"><span>Subtotal</span><span>Tk {(selectedReceipt.subtotal || selectedReceipt.totalSellAmount).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Discount</span><span>Tk {(selectedReceipt.discount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-xs font-black pt-1.5 mt-1 border-t border-slate-300">
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
                <div className="px-3 py-2.5 text-[8px] text-slate-500 leading-relaxed border-b border-dashed border-slate-300 space-y-0.5">
                  {shopSettings.receiptPolicies.filter(Boolean).map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              )}

              <div className="px-3 py-3 text-center text-[9px] text-slate-400">
                — {shopSettings.proprietor} —
              </div>

              <div className="bg-slate-50 p-3 flex justify-between items-center no-print">
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
                <p className="text-xs text-[var(--text-muted)] mt-1">{realSales.length} order{realSales.length !== 1 ? 's' : ''} recorded</p>
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
                  <BarChart data={monthlyRevenueData}>
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
                <h3 className="flex items-center gap-2 text-base font-extrabold text-[var(--text-primary)] mb-4"><Award className="w-4.5 h-4.5 text-orange-500" /> All Sold Products <span className="text-xs font-semibold text-[var(--text-muted)]">({allSoldProducts.length})</span></h3>
                {allSoldProducts.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] py-6 text-center">No sales yet — your sold products will show up here.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {allSoldProducts.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold text-[var(--text-primary)] block truncate">{p.name}</span>
                            {p.currentStock !== null && (
                              <span className={`text-[11px] font-semibold ${p.currentStock <= 0 ? 'text-red-600' : 'text-[var(--text-muted)]'}`}>{p.currentStock} in stock now</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
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
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)]">
                <span>{totalProductCount} product{totalProductCount !== 1 ? 's' : ''}</span>
                <span>·</span>
                <span>{totalStockUnits.toLocaleString()} units in stock</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] italic">Buy price &amp; profit are blurred — hover to reveal</p>
            </div>
            {productsWithoutCode.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-blue-800 text-xs font-semibold">{productsWithoutCode.length} product{productsWithoutCode.length !== 1 ? 's' : ''} don't have a product code yet.</p>
                <button onClick={handleAssignAllProductCodes} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">Assign Codes (from {nextProductCode(products)})</button>
              </div>
            )}
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
                  <th className="pb-3">CODE</th>
                  <th className="pb-3">PRODUCT</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">BUY PRICE</th>
                  <th className="pb-3">SELL PRICE</th>
                  <th className="pb-3">PROFIT/UNIT</th>
                  <th className="pb-3">STOCK</th>
                  <th className="pb-3">STATUS</th>
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              {Object.keys(productsByCategory).sort().map(catName => (
                <tbody key={catName} className="divide-y divide-[var(--border-card)]">
                  <tr>
                    <td colSpan={9} className="pt-5 pb-2">
                      <span className="inline-flex items-center gap-1.5 text-orange-600 font-black text-xs uppercase tracking-wide">
                        <Tag className="w-3.5 h-3.5" /> {catName} <span className="text-[var(--text-muted)] font-semibold normal-case">({productsByCategory[catName].length})</span>
                      </span>
                    </td>
                  </tr>
                  {productsByCategory[catName].map(p => (
                    <tr key={p.id} className={`hover:bg-[var(--bg-hover)] transition-colors ${p.active === false ? 'opacity-50' : ''}`}>
                      <td className="py-4 text-[var(--text-muted)] font-mono text-xs">{p.productCode || '—'}</td>
                      <td className="py-4 font-bold text-[var(--text-primary)]">{p.name}</td>
                      <td className="py-4 text-[var(--text-secondary)]">{p.category}</td>
                      <td className="py-4 text-[var(--text-secondary)]">
                        <span className="blur-sm hover:blur-none transition-all cursor-pointer select-none" title="Hover to reveal">Tk {p.buyPrice.toLocaleString()}</span>
                      </td>
                      <td className="py-4 font-bold text-[var(--text-primary)]">Tk {p.sellPrice.toLocaleString()}</td>
                      <td className="py-4">
                        <span className="blur-sm hover:blur-none transition-all cursor-pointer select-none text-emerald-600 font-bold" title="Hover to reveal">Tk {(p.sellPrice - p.buyPrice).toLocaleString()}</span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(p, -1)}
                            title="Remove 1 unit"
                            className="w-6 h-6 rounded-md bg-[var(--bg-hover)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-red-100 hover:text-red-600 hover:border-red-300 flex items-center justify-center font-bold text-sm leading-none transition-colors"
                          >
                            −
                          </button>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel && p.active !== false ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                            {p.stock} units {p.stock <= p.reorderLevel && p.active !== false && '⚠️'}
                          </span>
                          <button
                            onClick={() => handleAdjustStock(p, 1)}
                            title="Add 1 unit (restock)"
                            className="w-6 h-6 rounded-md bg-[var(--bg-hover)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-emerald-100 hover:text-emerald-600 hover:border-emerald-300 flex items-center justify-center font-bold text-sm leading-none transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-4">
                        {p.active === false ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">Inactive</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Active</span>
                        )}
                      </td>
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
            <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
              <h3 className="font-extrabold text-[var(--text-primary)] text-lg">Stock Assets Overview</h3>
              <div className="bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl text-orange-600 text-sm font-bold">
                Total Inventory Capital Asset: Tk {currentInventoryValue.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-[var(--text-muted)] mb-6">
              <span>{totalProductCount} product{totalProductCount !== 1 ? 's' : ''}</span>
              <span>·</span>
              <span>{totalStockUnits.toLocaleString()} units in stock</span>
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
                {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                  <tr key={p.id} className={`hover:bg-[var(--bg-hover)] transition-colors ${p.active === false ? 'opacity-50' : ''}`}>
                    <td className="py-4 font-bold text-[var(--text-primary)]">{p.name}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{p.category}</td>
                    <td className="py-4 text-[var(--text-secondary)]">
                      <span className="blur-sm hover:blur-none transition-all cursor-pointer select-none" title="Hover to reveal">Tk {p.buyPrice.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel && p.active !== false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-4 font-black text-[var(--text-primary)]">
                      <span className="blur-sm hover:blur-none transition-all cursor-pointer select-none" title="Hover to reveal">Tk {(p.buyPrice * p.stock).toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}

        {/* SALES TAB — full-screen entry form. History, receipts, returns and payment status
           now live on the Transactions page; this tab is purely for entering a new sale
           (or editing one, when arrived at via "Edit Sale" from Transactions/Due Amounts). */}
        {activeTab === 'Sales' && (
          <form onSubmit={handleSaveItem} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 md:p-8 shadow-sm transition-colors space-y-4 text-sm">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{editingItem ? `Edit Sale ${editingItem.id}` : 'New Sale'}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Full sale history, receipts and returns are on the Transactions page.</p>
                </div>
                {editingItem && (
                  <button type="button" onClick={resetSaleForm} className="text-orange-600 font-bold text-xs flex items-center gap-1 hover:underline shrink-0">
                    <Plus className="w-4 h-4" /> New Sale Instead
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="customer" defaultValue={formData.customer || ''} placeholder="Customer Name (optional)" onChange={handleInputChange} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <input name="customerPhone" defaultValue={formData.customerPhone || ''} placeholder="Customer Phone" onChange={handleInputChange} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="customerAddress" defaultValue={formData.customerAddress || ''} placeholder="Customer Address" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                <div className="relative">
                  <Calendar className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    name="date"
                    type="date"
                    defaultValue={formData.date || new Date().toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-9 pr-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] -mt-2">Date defaults to today — change it if you're catching up on a sale from an earlier day.</p>

              <div className="flex bg-[var(--bg-hover)] border border-[var(--border-card)] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleToggleSaleType('Retail')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${(formData.saleType || 'Retail') === 'Retail' ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                >
                  Retail Sale
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSaleType('Wholesale')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${formData.saleType === 'Wholesale' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                >
                  Wholesale Order
                </button>
              </div>

              <div className="space-y-3">
                <label className="font-bold text-[var(--text-secondary)]">Products in Order:</label>
                {cartItems.map((item, idx) => {
                  const searchTerm = (item.productSearch || '').toLowerCase().trim();
                  const rowProducts = products
                    .filter(p => !item.categoryFilter || p.category === item.categoryFilter)
                    .filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm) || (p.productCode || '').toLowerCase().includes(searchTerm));
                  const lineDiscount = Math.max(0, (parseFloat(item.customProductPrice) || 0) - (parseFloat(item.customSellPrice) || 0));
                  const selectedProduct = products.find(p => p.id === parseInt(item.productId, 10));
                  return (
                  <div key={idx} className="bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-card)] space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={item.productSearch || ''}
                        onChange={(e) => handleCartChange(idx, 'productSearch', e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== 'Enter') return;
                          e.preventDefault();
                          const typed = (item.productSearch || '').trim();
                          if (!typed) return;
                          // An exact product-code match wins outright — built for fast, scanner-style entry.
                          const exactCodeMatch = products.find(p => p.productCode && p.productCode.toLowerCase() === typed.toLowerCase());
                          const candidate = exactCodeMatch || (rowProducts.length === 1 ? rowProducts[0] : null);
                          if (!candidate) return;
                          handleCartChange(idx, 'productId', String(candidate.id));
                          handleCartChange(idx, 'productSearch', '');
                          if (idx === cartItems.length - 1) addCartRow();
                        }}
                        placeholder="Search by name or item code, or scan a code + Enter..."
                        className="w-full pl-9 pr-3 py-2.5 text-base border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />
                    </div>
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
                        <option value="">{rowProducts.length === 0 ? 'No matching products' : 'Select Product...'}</option>
                        {rowProducts.map(p => <option key={p.id} value={p.id}>{p.productCode ? `[${p.productCode}] ` : ''}{p.name} (Stock: {p.stock})</option>)}
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
                    {selectedProduct?.productCode && (
                      <p className="text-[11px] text-[var(--text-muted)] pl-1">Item Code: <span className="font-mono font-semibold">{selectedProduct.productCode}</span></p>
                    )}
                    {!formData.isCombo && (
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
                        <div className="flex items-center justify-between gap-1">
                          <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{item.priceEntryMode === 'total' ? `Total (x${item.qty || 1})` : 'Sell Price'}</label>
                          {parseInt(item.qty, 10) > 1 && (
                            <button
                              type="button"
                              onClick={() => handleCartChange(idx, 'priceEntryMode', item.priceEntryMode === 'total' ? 'unit' : 'total')}
                              className="text-[9px] font-bold text-orange-500 hover:text-orange-600 underline"
                            >
                              {item.priceEntryMode === 'total' ? 'switch to per-unit' : 'enter total instead'}
                            </button>
                          )}
                        </div>
                        <input 
                          required 
                          type="number" 
                          step="0.01"
                          placeholder={item.priceEntryMode === 'total' ? 'Total Price' : 'Sell Price'}
                          value={item.priceEntryMode === 'total' ? Math.round(((parseFloat(item.customSellPrice) || 0) * (parseInt(item.qty, 10) || 1)) * 100) / 100 : item.customSellPrice}
                          onChange={(e) => {
                            if (item.priceEntryMode === 'total') {
                              const qty = parseInt(item.qty, 10) || 1;
                              const perUnit = (parseFloat(e.target.value) || 0) / qty;
                              handleCartChange(idx, 'customSellPrice', perUnit);
                            } else {
                              handleCartChange(idx, 'customSellPrice', e.target.value);
                            }
                          }}
                          className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-400" 
                        />
                        {item.priceEntryMode === 'total' && (
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">= Tk {(parseFloat(item.customSellPrice) || 0).toLocaleString()} / unit on the invoice</p>
                        )}
                      </div>
                      {lineDiscount > 0 && (
                        <span className="shrink-0 self-end mb-1.5 inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-1 rounded-lg">
                          <BadgePercent className="w-3 h-3" /> Tk {lineDiscount.toLocaleString()} off
                        </span>
                      )}
                    </div>
                    )}
                  </div>
                  );
                })}
              </div>
              <button type="button" onClick={addCartRow} className="text-orange-600 font-bold text-xs flex items-center gap-1 hover:underline pt-1">
                <Plus className="w-4 h-4" /> Add Another Item
              </button>

              <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-hover)] border border-[var(--border-card)] rounded-xl p-3 mt-2">
                <input
                  type="checkbox"
                  checked={!!formData.isCombo}
                  onChange={(e) => setFormData({ ...formData, isCombo: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                Combo Sale — charge one total price for all items together
              </label>
              {formData.isCombo && (
                <input
                  required name="comboPrice" type="number" step="0.01" defaultValue={formData.comboPrice || ''}
                  placeholder="Combo Total Price (Tk)" onChange={handleInputChange}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-bold"
                />
              )}
            </div>

            {/* Right-hand summary panel — sticky on large screens so it stays visible
               while scrolling through a long list of products in the order. */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 md:p-6 shadow-sm transition-colors space-y-4 text-sm lg:sticky lg:top-6">
              <h4 className="font-bold text-[var(--text-primary)] text-base">Order Summary</h4>

              <div className="flex gap-3">
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

              {/* Live running total, so the amount is clear before you hit save */}
              {(() => {
                const liveItemCount = cartItems.reduce((sum, item) => sum + (parseInt(item.qty, 10) || 0), 0);
                const liveSubtotal = formData.isCombo
                  ? (parseFloat(formData.comboPrice) || 0)
                  : cartItems.reduce((sum, item) => sum + (parseFloat(item.customSellPrice) || 0) * (parseInt(item.qty, 10) || 0), 0);
                const liveDiscount = parseFloat(formData.discount) || 0;
                const liveTotal = Math.max(0, liveSubtotal - liveDiscount);
                return (
                  <div className="bg-[var(--bg-hover)] border border-[var(--border-card)] rounded-xl p-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-[var(--text-muted)]">
                      <span>{liveItemCount} unit{liveItemCount !== 1 ? 's' : ''}</span>
                      <span>{(formData.saleType || 'Retail')}</span>
                    </div>
                    {liveDiscount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Subtotal</span>
                        <span className="text-[var(--text-secondary)]">Tk {liveSubtotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border-card)]">
                      <span className="font-bold text-[var(--text-secondary)]">Order Total</span>
                      <span className="text-2xl font-black text-[var(--text-primary)]">Tk {liveTotal.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex flex-col gap-2 pt-2">
                <button type="submit" className="w-full px-6 py-3.5 bg-orange-500 text-white rounded-xl font-bold text-base hover:bg-orange-600 shadow-md transition-all">{editingItem ? 'Save Changes' : 'Complete Sale'}</button>
                <button type="button" onClick={resetSaleForm} className="w-full px-4 py-2.5 border border-[var(--input-border)] rounded-xl text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-hover)] transition-colors">Clear</button>
              </div>
            </div>
          </form>
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
                onClick={() => { setDueView('customer'); setDuePartyFilter(''); }}
                className={`text-left p-6 rounded-2xl border shadow-sm transition-colors ${dueView === 'customer' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-primary)]'}`}
              >
                <p className={`text-sm font-semibold mb-1 ${dueView === 'customer' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>Customers Owe You</p>
                <p className="text-2xl font-black">Tk {totalCustomerDue.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${dueView === 'customer' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>{customerDues.length} pending sale{customerDues.length !== 1 ? 's' : ''}</p>
              </button>
              <button
                onClick={() => { setDueView('vendor'); setDuePartyFilter(''); }}
                className={`text-left p-6 rounded-2xl border shadow-sm transition-colors ${dueView === 'vendor' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-primary)]'}`}
              >
                <p className={`text-sm font-semibold mb-1 ${dueView === 'vendor' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>You Owe Suppliers</p>
                <p className="text-2xl font-black">Tk {totalVendorDue.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${dueView === 'vendor' ? 'text-orange-100' : 'text-[var(--text-muted)]'}`}>{vendorDues.length} pending purchase{vendorDues.length !== 1 ? 's' : ''}</p>
              </button>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3 transition-colors">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">From</label>
                <input type="date" value={dueDateFrom} onChange={(e) => setDueDateFrom(e.target.value)} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">To</label>
                <input type="date" value={dueDateTo} onChange={(e) => setDueDateTo(e.target.value)} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{dueView === 'customer' ? 'Customer' : 'Supplier'}</label>
                <select value={duePartyFilter} onChange={(e) => setDuePartyFilter(e.target.value)} className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                  <option value="">All {dueView === 'customer' ? 'Customers' : 'Suppliers'}</option>
                  {[...new Set((dueView === 'customer' ? customerDues.map(s => s.customer) : vendorDues.map(p => p.supplier)))].sort().map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              {(dueDateFrom || dueDateTo || duePartyFilter) && (
                <button type="button" onClick={() => { setDueDateFrom(''); setDueDateTo(''); setDuePartyFilter(''); }} className="text-xs font-bold text-orange-600 hover:underline mb-2">
                  Clear filters
                </button>
              )}
              <div className="ml-auto text-right">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Filtered Total</p>
                <p className="text-lg font-black text-red-600">Tk {(dueView === 'customer' ? filteredCustomerDueTotal : filteredVendorDueTotal).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              {dueView === 'customer' ? (
                filteredCustomerDues.length === 0 ? (
                  <EmptyState icon={Wallet} title="No customer dues" message="Every sale in this range is fully paid — nice work!" />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                        <th className="pb-3">ORDER ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">PHONE</th><th className="pb-3">TOTAL</th><th className="pb-3">PAID</th><th className="pb-3">DUE</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)]">
                      {filteredCustomerDues.map(s => {
                        const paid = s.paidAmount ?? 0;
                        const overdue = daysOverdue(s.date);
                        const isOverdue = overdue >= 7;
                        const reminderLink = buildWhatsAppReminderLink(
                          s.customerPhone,
                          `Hi ${s.customer}, this is a reminder from ${shopSettings.shopName} that Tk ${s.dueAmount.toLocaleString()} is still due on order ${s.id}. Please let us know when you can settle it. Thank you!`
                        );
                        return (
                          <tr key={s.id} className={`transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[var(--bg-hover)]'}`}>
                            <td className="py-4 font-bold text-orange-600">{s.id}</td>
                            <td className="py-4 font-medium text-[var(--text-primary)]">{s.customer}</td>
                            <td className="py-4 text-[var(--text-secondary)]">{s.customerPhone || '—'}</td>
                            <td className="py-4 text-[var(--text-secondary)]">Tk {s.totalSellAmount.toLocaleString()}</td>
                            <td className="py-4 text-emerald-700">Tk {paid.toLocaleString()}</td>
                            <td className="py-4 font-black text-red-600">Tk {s.dueAmount.toLocaleString()}</td>
                            <td className="py-4 text-[var(--text-muted)]">
                              {s.date}
                              {isOverdue && (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-0.5">
                                  <AlertOctagon className="w-3 h-3" /> {overdue}d overdue
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right flex justify-end gap-1">
                              <button onClick={() => setSelectedReceipt(s)} title="View Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                              {reminderLink && (
                                <a href={reminderLink} target="_blank" rel="noopener noreferrer" title="Send WhatsApp Reminder" className="text-[var(--text-muted)] hover:text-emerald-600 p-2 inline-flex"><MessageCircle className="w-4 h-4" /></a>
                              )}
                              <button onClick={() => openPaymentModal('customer', s)} title="Record Payment" className="text-[var(--text-muted)] hover:text-emerald-600 p-2"><Banknote className="w-4 h-4" /></button>
                              <button onClick={() => { setActiveTab('Sales'); handleOpenEdit(s); }} title="Edit Full Sale" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )
              ) : (
                filteredVendorDues.length === 0 ? (
                  <EmptyState icon={Wallet} title="No vendor dues" message="You're all settled up with your suppliers in this range." />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                        <th className="pb-3">PURCHASE ID</th><th className="pb-3">SUPPLIER</th><th className="pb-3">ITEM</th><th className="pb-3">TOTAL</th><th className="pb-3">PAID</th><th className="pb-3">DUE</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-card)]">
                      {filteredVendorDues.map(p => {
                        const overdue = daysOverdue(p.date);
                        const isOverdue = overdue >= 7;
                        return (
                        <tr key={p.id} className={`transition-colors ${isOverdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[var(--bg-hover)]'}`}>
                          <td className="py-4 font-bold text-orange-600">{p.id}</td>
                          <td className="py-4 font-medium text-[var(--text-primary)]">{p.supplier}</td>
                          <td className="py-4 text-[var(--text-secondary)]">{(p.items || []).map(i => i.productName).join(', ') || '—'}</td>
                          <td className="py-4 text-[var(--text-secondary)]">Tk {p.totalAmount.toLocaleString()}</td>
                          <td className="py-4 text-emerald-700">Tk {p.paidAmount.toLocaleString()}</td>
                          <td className="py-4 font-black text-red-600">Tk {p.dueAmount.toLocaleString()}</td>
                          <td className="py-4 text-[var(--text-muted)]">
                            {p.date}
                            {isOverdue && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 mt-0.5">
                                <AlertOctagon className="w-3 h-3" /> {overdue}d overdue
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right flex justify-end gap-1">
                            <button onClick={() => setSelectedPurchaseReceipt(p)} title="View Receipt" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => openPaymentModal('vendor', p)} title="Record Payment" className="text-[var(--text-muted)] hover:text-emerald-600 p-2"><Banknote className="w-4 h-4" /></button>
                            <button onClick={() => { setActiveTab('Purchases'); handleOpenEdit(p); }} title="Edit Full Purchase" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                          </td>
                        </tr>
                        );
                      })}
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
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Gross Profit (before expenses)</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  Tk {Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Total Inventory Assets</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">Tk {currentInventoryValue.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Total Other Expenses</p>
                <p className="text-2xl font-bold text-red-500">Tk {totalExpensesAllTime.toLocaleString()}</p>
              </div>
              <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-card)] shadow-sm transition-colors lg:col-span-2">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Net Profit (after expenses) — Your Real Take-Home</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${netProfitAfterExpenses >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfitAfterExpenses >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  Tk {Math.abs(netProfitAfterExpenses).toLocaleString()}
                </p>
              </div>
            </div>

            {/* RETAIL VS WHOLESALE — same revenue/profit split as above, broken out by sale type */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
              <h3 className="text-lg font-extrabold text-[var(--text-primary)] mb-5">Retail vs. Wholesale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-500/10 rounded-xl p-5">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-3">Retail — {retailSales.length} order{retailSales.length !== 1 ? 's' : ''}</p>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Tk {retailRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Profit</span>
                    <span className={`text-sm font-bold ${retailProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Tk {retailProfit.toLocaleString()}</span>
                  </div>
                </div>
                <div className="bg-indigo-500/10 rounded-xl p-5">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">Wholesale — {wholesaleSales.length} order{wholesaleSales.length !== 1 ? 's' : ''}</p>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-[var(--text-secondary)]">Revenue</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">Tk {wholesaleRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--text-secondary)]">Profit</span>
                    <span className={`text-sm font-bold ${wholesaleProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Tk {wholesaleProfit.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* DAILY REPORT — sales, purchases, and profit for a specific day, plus a 14-day trend */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" /> Daily Report
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <button
                    type="button"
                    onClick={() => setReportDate(new Date().toISOString().split('T')[0])}
                    className="text-xs font-bold text-orange-600 hover:underline whitespace-nowrap"
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-500/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Sales — Fully Paid ({selectedDayStats.salesPaidCount})</p>
                  <p className="text-lg font-black text-emerald-700">Tk {selectedDayStats.salesPaidTotal.toLocaleString()}</p>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Sales — With Due ({selectedDayStats.salesWithDueCount})</p>
                  <p className="text-lg font-black text-amber-700">Tk {selectedDayStats.salesWithDueTotal.toLocaleString()}</p>
                  {selectedDayStats.salesDue > 0 && <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Tk {selectedDayStats.salesDue.toLocaleString()} still uncollected</p>}
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Total Sales ({selectedDayStats.salesCount})</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">Tk {selectedDayStats.salesTotal.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Purchases ({selectedDayStats.purchasesCount})</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">Tk {selectedDayStats.purchasesTotal.toLocaleString()}</p>
                  {selectedDayStats.purchasesDue > 0 && <p className="text-[11px] text-red-500 font-semibold mt-0.5">Tk {selectedDayStats.purchasesDue.toLocaleString()} due</p>}
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Other Expenses ({selectedDayStats.expensesCount})</p>
                  <p className="text-lg font-black text-[var(--text-primary)]">Tk {selectedDayStats.expensesTotal.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-xl p-4">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Net Profit (after expenses)</p>
                  <p className={`text-lg font-black flex items-center gap-1 ${selectedDayStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedDayStats.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    Tk {Math.abs(selectedDayStats.netProfit).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">Last 14 Days</p>
                <button
                  type="button"
                  onClick={handleExportDailyReportCSV}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-orange-600 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold text-xs">
                      <th className="pb-2 pr-4">DATE</th>
                      <th className="pb-2 pr-4">SALES PAID</th>
                      <th className="pb-2 pr-4">SALES DUE</th>
                      <th className="pb-2 pr-4">PURCHASES</th>
                      <th className="pb-2 pr-4">EXPENSES</th>
                      <th className="pb-2">NET PROFIT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-card)]">
                    {last14DaysStats.map(d => (
                      <tr
                        key={d.date}
                        onClick={() => setReportDate(d.date)}
                        className={`cursor-pointer transition-colors ${d.date === reportDate ? 'bg-orange-500/10' : 'hover:bg-[var(--bg-hover)]'}`}
                      >
                        <td className="py-2.5 pr-4 font-semibold text-[var(--text-primary)]">{d.date}</td>
                        <td className="py-2.5 pr-4 text-emerald-700">Tk {d.salesPaidTotal.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-amber-700">Tk {d.salesWithDueTotal.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-[var(--text-secondary)]">Tk {d.purchasesTotal.toLocaleString()}</td>
                        <td className="py-2.5 pr-4 text-[var(--text-secondary)]">Tk {d.expensesTotal.toLocaleString()}</td>
                        <td className={`py-2.5 font-bold ${d.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.netProfit >= 0 ? '+' : '-'}Tk {Math.abs(d.netProfit).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

            {/* BACKUP & RESTORE — redesigned as clearly separated action cards */}
            <div className="mt-8 pt-6 border-t border-[var(--border-card)]">
              <h3 className="text-lg font-black text-[var(--text-primary)] mb-1">Data Backup &amp; Import</h3>
              <p className="text-xs text-[var(--text-muted)] mb-5">
                Your data lives in the cloud, but it's still smart to keep your own backup file somewhere safe —
                a phone, USB drive, or cloud folder — in case anything ever goes wrong.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export — always safe */}
                <div className="border border-[var(--border-card)] rounded-2xl p-5 bg-[var(--bg-hover)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Save className="w-4 h-4 text-emerald-600" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">Export Full Backup</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Downloads everything — products, sales, customers, suppliers, purchases — as one JSON file. Safe to run anytime.</p>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="w-full bg-orange-500 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-orange-600 shadow-sm flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" /> Export Backup (JSON)
                  </button>
                </div>

                {/* Merge-import products — safe, additive */}
                <div className="border border-[var(--border-card)] rounded-2xl p-5 bg-[var(--bg-hover)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Box className="w-4 h-4 text-emerald-600" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">Import / Update Products</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Adds new products and updates matching ones by name — everything else in your shop is left untouched. Safe to run anytime.</p>
                  <label className="w-full border border-[var(--input-border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors">
                    <Box className="w-4 h-4" /> Choose Product File (JSON)
                    <input type="file" accept="application/json,.json" onChange={handleMergeImportProducts} className="hidden" />
                  </label>
                </div>

                {/* Bulk import customers — safe, additive */}
                <div className="border border-[var(--border-card)] rounded-2xl p-5 bg-[var(--bg-hover)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <p className="font-bold text-sm text-[var(--text-primary)]">Import Customers</p>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Adds new customers from a JSON file, skipping any that already match by phone or name. Safe to run anytime.</p>
                  <label className="w-full border border-[var(--input-border)] bg-[var(--bg-card)] text-[var(--text-primary)] font-bold px-4 py-2.5 rounded-xl hover:bg-[var(--bg-hover)] shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors">
                    <Users className="w-4 h-4" /> Choose Customer File (JSON)
                    <input type="file" accept="application/json,.json" onChange={handleImportCustomers} className="hidden" />
                  </label>
                </div>

                {/* Full restore — destructive, clearly flagged */}
                <div className="border border-red-300 rounded-2xl p-5 bg-red-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="font-bold text-sm text-red-700">Restore Full Backup</p>
                  </div>
                  <p className="text-xs text-red-600 mb-4">⚠️ Replaces ALL your current data with what's in the file. Only use this for disaster recovery — not for adding a few products.</p>
                  <label className="w-full border border-red-300 bg-white text-red-700 font-bold px-4 py-2.5 rounded-xl hover:bg-red-50 shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer transition-colors">
                    <RefreshCw className="w-4 h-4" /> Choose Backup File (JSON)
                    <input type="file" accept="application/json,.json" onChange={handleImportData} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB — every money movement, with profit shown for sale-linked income */}
        {activeTab === 'Transactions' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-orange-500/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">Retail Revenue</p>
                <p className="text-xl font-black text-orange-700">Tk {retailRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-500/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-1">Wholesale Revenue</p>
                <p className="text-xl font-black text-indigo-700">Tk {wholesaleRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-red-500/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-1">Expenses</p>
                <p className="text-xl font-black text-red-700">Tk {totalExpensesAllTime.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-5">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1">Money Added</p>
                <p className="text-xl font-black text-emerald-700">Tk {capitalTotal.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-[var(--bg-hover)] border border-[var(--border-card)] rounded-xl p-1 text-xs font-bold">
                  {['All', 'Retail', 'Wholesale'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setTransactionTypeFilter(opt)}
                      className={`px-4 py-2 rounded-lg transition-colors ${transactionTypeFilter === opt ? 'bg-orange-500 text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {filteredTransactions.length === 0 ? (
                <EmptyState
                  icon={transactions.length === 0 ? ArrowLeftRight : PackageSearch}
                  title={transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
                  message={transactions.length === 0 ? "Transactions from sales are logged automatically — you can also click 'Add New Transaction' for anything else." : 'Try a different search term or filter.'}
                />
              ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                    <th className="pb-3">DATE</th><th className="pb-3">ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">REF</th><th className="pb-3">AMOUNT</th><th className="pb-3">PROFIT</th><th className="pb-3">STATUS</th><th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-card)]">
                  {filteredTransactions.map(t => {
                    const profit = transactionProfit(t);
                    const linkedSaleForType = t.type === 'Income' ? salesById[t.refId] : null;
                    return (
                      <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-4 text-[var(--text-muted)]">{t.date}</td>
                        <td className="py-4 font-bold text-orange-600">{t.id}</td>
                        <td className="py-4">
                          {linkedSaleForType ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${linkedSaleForType.saleType === 'Wholesale' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {linkedSaleForType.customer || 'Walk-in Customer'}
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.type === 'Capital' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'}`}>{t.type}</span>
                          )}
                        </td>
                        <td className="py-4 text-[var(--text-secondary)]">
                          {t.refId || '—'}
                          {(() => {
                            const linkedSale = t.type === 'Income' ? salesById[t.refId] : null;
                            if (!linkedSale) return null;
                            const returnedQty = linkedSale.items.reduce((sum, i) => sum + (i.returnedQty || 0), 0);
                            return (
                              <span className="block text-[11px] text-[var(--text-muted)]">
                                {linkedSale.items.length} item(s){linkedSale.saleType === 'Wholesale' && <span className="text-indigo-600 font-semibold"> · Wholesale</span>}
                                {returnedQty > 0 && <span className="text-blue-600 font-semibold"> · {returnedQty} returned</span>}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-4 font-bold text-[var(--text-primary)]">Tk {t.amount.toLocaleString()}</td>
                        <td className="py-4 font-bold">
                          {profit === null ? <span className="text-[var(--text-muted)]">—</span> : (
                            <span className={profit >= 0 ? 'text-emerald-600' : 'text-red-600'}>Tk {profit.toLocaleString()}</span>
                          )}
                        </td>
                        <td className="py-4 text-[var(--text-secondary)]">{t.status}</td>
                        <td className="py-4 text-right flex justify-end gap-1">
                          {(() => {
                            const linkedSale = t.type === 'Income' ? salesById[t.refId] : null;
                            if (linkedSale) {
                              return (
                                <>
                                  <button onClick={() => setSelectedReceipt(linkedSale)} title="View & Print Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                                  {!linkedSale.id.startsWith('#DUE-') && linkedSale.items.some(i => (i.returnedQty || 0) < i.qty) && (
                                    <button onClick={() => openReturnModal(linkedSale)} title="Process Return" className="text-[var(--text-muted)] hover:text-blue-600 p-2"><Undo2 className="w-4 h-4" /></button>
                                  )}
                                  <button onClick={() => { setActiveTab('Sales'); handleOpenEdit(linkedSale); }} title="Edit Sale" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(linkedSale.id, 'Sales')} title="Delete Sale" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                                </>
                              );
                            }
                            return (
                              <>
                                <button onClick={() => handleOpenEdit(t)} title="Edit Transaction" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(t.id, 'Transactions')} title="Delete Transaction" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                              </>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            </div>
          </div>
        )}

        {/* WAREHOUSE TAB — stock held separately from the shop floor, with a one-click transfer */}
        {activeTab === 'Warehouse' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 shadow-sm text-white">
              <p className="text-sm font-semibold text-slate-300 mb-1">Total Units in Warehouse</p>
              <p className="text-2xl font-black">{totalWarehouseUnits.toLocaleString()} units</p>
              <p className="text-xs mt-1 text-slate-300">{warehouseStock.length} item{warehouseStock.length !== 1 ? 's' : ''} tracked separately from your shop floor</p>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              {filteredWarehouseStock.length === 0 ? (
                <EmptyState
                  icon={Boxes}
                  title={warehouseStock.length === 0 ? 'No warehouse stock yet' : 'No matching items'}
                  message={warehouseStock.length === 0 ? "Click 'Add New Warehouse Stock' to start tracking inventory held outside the shop." : 'Try a different search term.'}
                />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                      <th className="pb-3">ITEM</th><th className="pb-3">CATEGORY</th><th className="pb-3">WAREHOUSE QTY</th><th className="pb-3">LINKED SHOP PRODUCT</th><th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-card)]">
                    {filteredWarehouseStock.map(w => {
                      const linkedProduct = w.productId ? products.find(p => p.id === w.productId) : null;
                      return (
                        <tr key={w.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                          <td className="py-4 font-bold text-[var(--text-primary)]">{w.productName}</td>
                          <td className="py-4 text-[var(--text-secondary)]">{w.category || '—'}</td>
                          <td className="py-4">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">{w.qty} units</span>
                          </td>
                          <td className="py-4 text-[var(--text-secondary)]">
                            {linkedProduct ? (
                              <span className="text-emerald-700 font-semibold">{linkedProduct.name} ({linkedProduct.stock} on shop floor)</span>
                            ) : (
                              <span className="text-[var(--text-muted)] italic">Not linked</span>
                            )}
                          </td>
                          <td className="py-4 text-right flex justify-end items-center gap-1">
                            <button onClick={() => handleOpenEdit(w)} title="Edit" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(w.id, 'Warehouse')} title="Delete" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                            <button
                              onClick={() => handleTransferToShop(w)}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer to Shop
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* EXPENSES TAB — operating costs (food, delivery, rent, etc) tracked separately from COGS */}
        {activeTab === 'Expenses' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-white">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold text-emerald-100 mb-1 uppercase tracking-wide">Business Balance</p>
                  <p className="text-3xl font-black">Tk {(shopSettings.cashBalance || 0).toLocaleString()}</p>
                  <p className="text-xs text-emerald-100 mt-1">Money you have on hand right now — expenses deduct from this automatically.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setCloseTillForm({ countedAmount: '', note: '' }); setShowCloseTillModal(true); }}
                    className="bg-emerald-800/40 border border-white/30 text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md hover:bg-emerald-800/60 transition-colors"
                  >
                    <Calculator className="w-5 h-5" /> Close Till
                  </button>
                  <button
                    onClick={() => { setAddMoneyForm({ amount: '', note: '', date: new Date().toISOString().split('T')[0] }); setShowAddMoneyModal(true); }}
                    className="bg-white text-emerald-700 font-bold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md hover:bg-emerald-50 transition-colors"
                  >
                    <Banknote className="w-5 h-5" /> Add Money
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wide">Today</p>
                  <p className="text-lg font-black">Tk {totalExpensesToday.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wide">This Month</p>
                  <p className="text-lg font-black">Tk {totalExpensesThisMonth.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wide">All Time</p>
                  <p className="text-lg font-black">Tk {totalExpensesAllTime.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {(Object.keys(expensesByCategory).length > 0 || capitalTransactions.length > 0) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(expensesByCategory).length > 0 && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 shadow-sm transition-colors">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">By Category (All Time)</p>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                        <div key={cat} className="bg-[var(--bg-hover)] rounded-xl p-3">
                          <p className="text-[11px] font-semibold text-[var(--text-muted)] truncate">{cat}</p>
                          <p className="text-sm font-bold text-[var(--text-primary)]">Tk {amt.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {capitalTransactions.length > 0 && (
                  <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-5 shadow-sm transition-colors">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide mb-3">Money Added to Balance</p>
                    <div className="divide-y divide-[var(--border-card)] max-h-56 overflow-y-auto">
                      {capitalTransactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                          <div className="min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">{t.note || 'Money added'}</p>
                            <p className="text-[var(--text-muted)] text-xs">{t.date}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-emerald-600">+ Tk {t.amount.toLocaleString()}</span>
                            <button onClick={() => handleDelete(t.id, 'Expenses')} title="Delete Entry" className="text-[var(--text-muted)] hover:text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm overflow-x-auto transition-colors">
              {filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title={expenseTransactions.length === 0 ? 'No expenses logged yet' : 'No matching expenses'}
                  message={expenseTransactions.length === 0 ? "Click 'Add New Expense' to log your first cost — food, delivery, rent, whatever it takes to run the shop." : 'Try a different search term.'}
                />
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-card)] text-[var(--text-muted)] font-bold">
                      <th className="pb-3">DATE</th><th className="pb-3">CATEGORY</th><th className="pb-3">NOTE</th><th className="pb-3">AMOUNT</th><th className="pb-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-card)]">
                    {filteredExpenses.map(t => (
                      <tr key={t.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-4 text-[var(--text-muted)]">{t.date}</td>
                        <td className="py-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{t.category || 'Other'}</span>
                        </td>
                        <td className="py-4 text-[var(--text-secondary)]">{t.note || '—'}</td>
                        <td className="py-4 font-bold text-[var(--text-primary)]">Tk {t.amount.toLocaleString()}</td>
                        <td className="py-4 text-right flex justify-end gap-1">
                          <button onClick={() => handleOpenEdit(t)} title="Edit Expense" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(t.id, 'Expenses')} title="Delete Expense" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* GENERIC TABLES FOR OTHER TABS */}
        {['Categories', 'Customers', 'Suppliers', 'Damaged'].includes(activeTab) && (
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
                      {activeTab === 'Customers' && (
                        <button onClick={() => handleOpenPreviousDue(item)} title="Add Previous Due" className="text-[var(--text-muted)] hover:text-blue-600 p-2"><Wallet className="w-4 h-4" /></button>
                      )}
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

        {/* PROMOTIONS TAB — build a WhatsApp promo message for a newly-arrived product,
           pick which customers to tell, and click through to send it. WhatsApp has no
           bulk-send API for a personal number, so this is a guided "one click per
           customer" workflow rather than a true one-click blast. */}
        {activeTab === 'Promotions' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors space-y-4">
              <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><Megaphone className="w-5 h-5 text-orange-500" /> Promote a Product</h3>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Which product just arrived?</label>
                <select
                  value={promoProductId}
                  onChange={(e) => handleSelectPromoProduct(e.target.value)}
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Select Product...</option>
                  {products.filter(p => p.active !== false).map(p => <option key={p.id} value={p.id}>{p.name} — Tk {p.sellPrice.toLocaleString()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Message</label>
                <textarea
                  value={promoMessage}
                  onChange={(e) => setPromoMessage(e.target.value)}
                  rows={5}
                  placeholder="Pick a product above to generate a starting message, or write your own here."
                  className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Use <code className="bg-[var(--bg-hover)] px-1 rounded">{'{name}'}</code> anywhere — it's swapped for each customer's name when you click Send.</p>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-2xl p-6 shadow-sm transition-colors flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[var(--text-primary)]">Send To</h3>
                <div className="flex gap-3 text-xs font-bold">
                  <button type="button" onClick={() => setPromoSelectedCustomerIds(customers.filter(c => c.phone).map(c => c.id))} className="text-orange-600 hover:underline">Select All</button>
                  <button type="button" onClick={() => setPromoSelectedCustomerIds([])} className="text-[var(--text-muted)] hover:underline">Clear</button>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={promoCustomerSearch}
                  onChange={(e) => setPromoCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {customers.filter(c => c.phone).length === 0 ? (
                <EmptyState icon={Users} title="No customer phone numbers yet" message="Add a phone number to your customers to be able to message them here." />
              ) : (
              <div className="flex-1 overflow-y-auto max-h-96 divide-y divide-[var(--border-card)] -mx-1">
                {customers
                  .filter(c => c.phone)
                  .filter(c => !promoCustomerSearch || c.name.toLowerCase().includes(promoCustomerSearch.toLowerCase()))
                  .map(c => {
                    const isSelected = promoSelectedCustomerIds.includes(c.id);
                    const isSent = promoSentIds.includes(c.id);
                    const link = promoMessage ? buildWhatsAppReminderLink(c.phone, promoMessage.replace(/{name}/g, c.name)) : null;
                    return (
                      <div key={c.id} className={`flex items-center justify-between gap-3 px-1 py-2.5 ${isSelected ? 'bg-[var(--bg-hover)]' : ''}`}>
                        <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                          <input type="checkbox" checked={isSelected} onChange={() => togglePromoCustomer(c.id)} className="w-4 h-4 accent-orange-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)] truncate">{c.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{c.phone}</p>
                          </div>
                        </label>
                        {isSelected && link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setPromoSentIds(prev => prev.includes(c.id) ? prev : [...prev, c.id])}
                            className={`shrink-0 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${isSent ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> {isSent ? 'Sent' : 'Send'}
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
              )}

              {promoSelectedCustomerIds.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-card)]">
                  {promoSentIds.filter(id => promoSelectedCustomerIds.includes(id)).length} of {promoSelectedCustomerIds.length} selected sent this session · click each "Send" to open WhatsApp with the message ready
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
