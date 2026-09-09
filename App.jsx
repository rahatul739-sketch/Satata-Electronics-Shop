import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Home, Box, Layers, Warehouse, 
  ShoppingCart, Users, Truck, ArrowLeftRight, PieChart, Settings, 
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Eye, X, Printer, Pencil, Save, RefreshCw,
  Search, Moon, Sun, PackageSearch, Award, Clock, Sparkles, Inbox, LogOut, Loader2, Mail, Lock
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
    }),
    fromDb: (r) => ({
      id: r.id, customer: r.customer, customerPhone: r.customer_phone, customerAddress: r.customer_address,
      items: r.items || [], subtotal: Number(r.subtotal), discount: Number(r.discount),
      totalSellAmount: Number(r.total_sell_amount), totalCostAmount: Number(r.total_cost_amount),
      status: r.status, date: r.sale_date,
    }),
  },
  transaction: {
    toDb: (t) => ({ id: t.id, ref_id: t.refId, type: t.type, amount: t.amount, txn_date: t.date, status: t.status }),
    fromDb: (r) => ({ id: r.id, refId: r.ref_id, type: r.type, amount: Number(r.amount), date: r.txn_date, status: r.status }),
  },
  settings: {
    toDb: (s) => ({ shop_name: s.shopName, proprietor: s.proprietor, phone: s.phone, address: s.address, currency: s.currency, receipt_policies: s.receiptPolicies }),
    fromDb: (r) => ({ shopName: r.shop_name, proprietor: r.proprietor, phone: r.phone, address: r.address, currency: r.currency, receiptPolicies: r.receipt_policies || [] }),
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
            <p className="text-xs text-slate-400 mb-2">Don't have access yet?</p>
            <a
              href={requestAccessHref}
              className="inline-flex w-full items-center justify-center gap-2 border border-orange-500 text-orange-400 hover:bg-orange-500/10 font-bold py-3 rounded-xl text-sm transition-all"
            >
              <Mail className="w-4 h-4" /> Request Access
            </a>
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
      const [catRes, prodRes, custRes, supRes, saleRes, txnRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('id'),
        supabase.from('products').select('*').order('id'),
        supabase.from('customers').select('*').order('id'),
        supabase.from('suppliers').select('*').order('id'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_settings').select('*').maybeSingle(),
      ]);

      setCategories((catRes.data || []).map(dbMap.category.fromDb));
      setProducts((prodRes.data || []).map(dbMap.product.fromDb));
      setCustomers((custRes.data || []).map(dbMap.customer.fromDb));
      setSuppliers((supRes.data || []).map(dbMap.supplier.fromDb));
      setSales((saleRes.data || []).map(dbMap.sale.fromDb));
      setTransactions((txnRes.data || []).map(dbMap.transaction.fromDb));

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
  const [formData, setFormData] = useState({});

  // Settings Form State — kept in sync with shopSettings once it loads from Supabase
  const [settingsForm, setSettingsForm] = useState(shopSettings);
  useEffect(() => { setSettingsForm(shopSettings); }, [shopSettings]);

  // POS Cart State
  const [cartItems, setCartItems] = useState([
    { productId: '', qty: 1, customSellPrice: 0 }
  ]);

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
    setCartItems([{ productId: '', qty: 1, customSellPrice: 0 }]);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    if (activeTab === 'Sales' && item.items) {
      setCartItems(item.items.map(i => ({
        productId: i.productId,
        qty: i.qty,
        customSellPrice: i.sellPrice
      })));
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
      }
    }
    setCartItems(updatedCart);
  };

  const addCartRow = () => {
    setCartItems([...cartItems, { productId: '', qty: 1, customSellPrice: 0 }]);
  };

  const removeCartRow = (index) => {
    if (cartItems.length > 1) {
      setCartItems(cartItems.filter((_, i) => i !== index));
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

        for (let item of cartItems) {
          const prod = workingProducts.find(p => p.id === parseInt(item.productId, 10));
          if (!prod) return alert("Please select a valid product for all rows.");
          const qty = parseInt(item.qty, 10) || 1;

          if (qty > prod.stock) {
            return alert(`Not enough stock for ${prod.name}. Available: ${prod.stock}`);
          }

          const customPrice = parseFloat(item.customSellPrice) || prod.sellPrice;
          const lineTotal = customPrice * qty;
          const lineCost = prod.buyPrice * qty;

          subtotal += lineTotal;
          totalCostAmount += lineCost;

          processedItems.push({
            productId: prod.id,
            productName: prod.name,
            qty: qty,
            buyPrice: prod.buyPrice,
            sellPrice: customPrice,
            lineTotal: lineTotal
          });
        }

        const discount = parseFloat(formData.discount) || 0;
        const totalSellAmount = subtotal - discount;
        const orderId = editingItem ? editingItem.id : `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;

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
          status: formData.status || 'Paid',
          date: formData.date || new Date().toISOString().split('T')[0]
        };

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

  const handleDelete = async (id, type) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const tableMap = { Products: 'products', Sales: 'sales', Categories: 'categories', Customers: 'customers', Suppliers: 'suppliers', Transactions: 'transactions' };
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
  const genericDataMap = { categories, customers, suppliers, transactions };

  // --- Search filtering, applied per active tab ---
  const filteredProducts = products.filter(p =>
    !currentSearch || p.name.toLowerCase().includes(currentSearch) || (p.category || '').toLowerCase().includes(currentSearch)
  );
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
    { name: 'Sales', icon: ShoppingCart }, { name: 'Customers', icon: Users },
    { name: 'Suppliers', icon: Truck }, { name: 'Transactions', icon: ArrowLeftRight },
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

        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice-modal, #printable-invoice-modal * {
            visibility: visible;
          }
          #printable-invoice-modal {
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
          @page {
            size: 2.5in auto;
            margin: 2mm;
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
            {['Products', 'Categories', 'Sales', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
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
            {['Products', 'Categories', 'Sales', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
              <button 
                onClick={handleOpenAdd}
                className="bg-orange-500 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Add New {activeTab === 'Sales' ? 'Sale' : activeTab.slice(0, -1)}
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
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h3>
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
                      <input required name="sellPrice" type="number" step="0.01" defaultValue={formData.sellPrice || ''} placeholder="Sell Price (Tk)" onChange={handleInputChange} className="w-full border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
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
                    
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      <label className="font-bold text-[var(--text-secondary)]">Products in Order:</label>
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-[var(--bg-hover)] p-3 rounded-xl border border-[var(--border-card)]">
                          <select 
                            required 
                            value={item.productId}
                            onChange={(e) => handleCartChange(idx, 'productId', e.target.value)} 
                            className="flex-1 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                          >
                            <option value="">Select Product...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
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
                          <input 
                            required 
                            type="number" 
                            step="0.01"
                            placeholder="Sell Price" 
                            value={item.customSellPrice} 
                            onChange={(e) => handleCartChange(idx, 'customSellPrice', e.target.value)} 
                            className="w-28 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-2 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-orange-400" 
                          />
                          {cartItems.length > 1 && (
                            <button type="button" onClick={() => removeCartRow(idx)} className="text-red-500 hover:text-red-700 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addCartRow} className="text-orange-600 font-bold text-xs flex items-center gap-1 hover:underline pt-1">
                      <Plus className="w-4 h-4" /> Add Another Item
                    </button>
                    <div className="flex gap-4 pt-2">
                      <input name="discount" type="number" defaultValue={formData.discount || ''} placeholder="Discount (Tk)" onChange={handleInputChange} className="w-1/2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
                      <select name="status" defaultValue={formData.status || 'Paid'} onChange={handleInputChange} className="w-1/2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
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
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredProducts.map(p => (
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
                  <th className="pb-3">ORDER ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">ITEMS</th><th className="pb-3">TOTAL AMOUNT</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-card)]">
                {filteredSales.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-4 font-bold text-orange-600">{s.id}</td>
                    <td className="py-4 font-medium text-[var(--text-primary)]">{s.customer}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{s.items.length} item(s)</td>
                    <td className="py-4 font-bold text-[var(--text-primary)]">Tk {s.totalSellAmount.toLocaleString()}</td>
                    <td className="py-4 text-[var(--text-muted)]">{s.date}</td>
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => setSelectedReceipt(s)} title="View & Print Invoice" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(s)} title="Edit Sale Record" className="text-[var(--text-muted)] hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id, 'Sales')} title="Delete Sale" className="text-[var(--text-muted)] hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
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
        {['Categories', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
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