import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  ShoppingBag, Home, Box, Layers, Warehouse, 
  ShoppingCart, Users, Truck, ArrowLeftRight, PieChart, Settings, 
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Eye, X, Printer, Pencil, Save, RefreshCw,
  Search, Moon, Sun, PackageSearch, Award, Clock, Sparkles, Inbox, LogOut, Loader2, Mail, Lock,
  Wallet, PackagePlus, Tag, BadgePercent, PackageOpen, Calendar, Download, Receipt, History, Boxes, ArrowRightLeft,
  Banknote, CreditCard, Undo2, Calculator, MessageCircle, AlertOctagon, Megaphone, Filter
} from 'lucide-react';

// --- Supabase connection ---
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
    paymentMethod: 'Cash',
    date: '2026-09-07' 
  },
];

const defaultCustomers = [
  { id: 1, name: 'Tanvir Hossain', email: 'tanvir@example.com', phone: '01700000000', address: 'Gazipur, Bangladesh' },
];

const defaultSuppliers = [
  { id: 1, company: 'Singer BD Distribution', contact: 'Rahim Uddin', email: 'rahim@singer.com', phone: '01800112233' },
];

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
      payment_method: s.paymentMethod || 'Cash',
    }),
    fromDb: (r) => ({
      id: r.id, customer: r.customer, customerPhone: r.customer_phone, customerAddress: r.customer_address,
      items: r.items || [], subtotal: Number(r.subtotal), discount: Number(r.discount),
      totalSellAmount: Number(r.total_sell_amount), totalCostAmount: Number(r.total_cost_amount),
      status: r.status, date: r.sale_date,
      paidAmount: r.paid_amount !== null && r.paid_amount !== undefined ? Number(r.paid_amount) : Number(r.total_sell_amount),
      saleType: r.sale_type || 'Retail',
      paymentMethod: r.payment_method || 'Cash',
    }),
  },
  purchase: {
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
  warehouse: {
    toDb: (w) => ({ product_id: w.productId || null, product_name: w.productName, category: w.category || '', qty: w.qty }),
    fromDb: (r) => ({ id: r.id, productId: r.product_id, productName: r.product_name, category: r.category || '', qty: Number(r.qty) || 0 }),
  },
};

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

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
      <div className="relative w-full max-w-sm">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-3xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg mb-3">
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
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [session, setSession] = useState(undefined);
  const [dataLoading, setDataLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [warehouseStock, setWarehouseStock] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [shopSettings, setShopSettings] = useState(defaultSettings);

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [dashboardMonth, setDashboardMonth] = useState(currentMonthStr);

  // Warehouse Tab Specific State
  const [warehouseCategoryFilter, setWarehouseCategoryFilter] = useState('All');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  
  // Warehouse Add Item Popup State
  const [warehouseForm, setWarehouseForm] = useState({ productId: '', productName: '', category: '', qty: 1 });
  const [warehouseModalSearch, setWarehouseModalSearch] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [catRes, prodRes, custRes, supRes, saleRes, txnRes, settingsRes, purchaseRes, warehouseRes] = await Promise.all([
        supabase.from('categories').select('*').order('id'),
        supabase.from('products').select('*').order('id'),
        supabase.from('customers').select('*').order('id'),
        supabase.from('suppliers').select('*').order('id'),
        supabase.from('sales').select('*').order('created_at', { ascending: false }),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }),
        supabase.from('shop_settings').select('*').maybeSingle(),
        supabase.from('purchases').select('*').order('created_at', { ascending: false }),
        supabase.from('warehouse_stock').select('*').order('created_at', { ascending: false }).catch(() => ({ data: [] })),
      ]);

      setCategories((catRes.data || []).map(dbMap.category.fromDb));
      setProducts((prodRes.data || []).map(dbMap.product.fromDb));
      setCustomers((custRes.data || []).map(dbMap.customer.fromDb));
      setSuppliers((supRes.data || []).map(dbMap.supplier.fromDb));
      setSales((saleRes.data || []).map(dbMap.sale.fromDb));
      setTransactions((txnRes.data || []).map(dbMap.transaction.fromDb));
      setPurchases((purchaseRes.data || []).map(dbMap.purchase.fromDb));
      setWarehouseStock((warehouseRes.data || []).map(dbMap.warehouse.fromDb));

      if (settingsRes.data) {
        setShopSettings({ ...defaultSettings, ...dbMap.settings.fromDb(settingsRes.data) });
      } else {
        await supabase.from('shop_settings').upsert({ user_id: session?.user?.id, ...dbMap.settings.toDb(defaultSettings) });
        setShopSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      showToast('Could not load shop data. Please check connection.', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (session) loadAllData();
  }, [session]);

  const [searchQueries, setSearchQueries] = useState({});
  const currentSearch = (searchQueries[activeTab] || '').toLowerCase();
  const setCurrentSearch = (value) => setSearchQueries(prev => ({ ...prev, [activeTab]: value }));

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };
  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const [settingsForm, setSettingsForm] = useState(shopSettings);
  useEffect(() => { setSettingsForm(shopSettings); }, [shopSettings]);

  const [cartItems, setCartItems] = useState([
    { productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }
  ]);

  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }
  ]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({});
    setWarehouseForm({ productId: '', productName: '', category: '', qty: 1 });
    setWarehouseModalSearch('');
    setCartItems([{ productId: '', qty: 1, customSellPrice: 0, customProductPrice: 0, categoryFilter: '' }]);
    setPurchaseItems([{ productId: '', productName: '', category: '', qty: 1, unitCost: '', receivedQty: 1, categoryFilter: '' }]);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handlePurchaseItemChange = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const selectedProd = products.find(p => p.id === parseInt(value, 10));
      updated[index].productName = selectedProd ? selectedProd.name : '';
      updated[index].category = selectedProd ? selectedProd.category : '';
      if (selectedProd) updated[index].unitCost = selectedProd.buyPrice || updated[index].unitCost;
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

  const adjustCashBalance = async (delta) => {
    const newBalance = Math.round(((shopSettings.cashBalance || 0) + delta) * 100) / 100;
    setShopSettings(prev => ({ ...prev, cashBalance: newBalance }));
    try {
      await supabase.from('shop_settings').update({ cash_balance: newBalance }).eq('user_id', session.user.id);
    } catch (err) {
      showToast('Could not update cash balance.', 'error');
    }
  };

  // Handler for adding/updating item in Warehouse Modal
  const handleSaveWarehouseItem = async (e) => {
    e.preventDefault();
    if (!warehouseForm.productName.trim()) {
      return showToast('Please select or enter a product name.', 'error');
    }
    const qtyToAdd = parseInt(warehouseForm.qty, 10) || 0;
    if (qtyToAdd <= 0) {
      return showToast('Please enter a valid stock quantity.', 'error');
    }

    try {
      const existing = warehouseStock.find(item => 
        (warehouseForm.productId && item.productId === parseInt(warehouseForm.productId, 10)) ||
        item.productName.toLowerCase() === warehouseForm.productName.trim().toLowerCase()
      );

      if (existing) {
        const updatedQty = existing.qty + qtyToAdd;
        const { error } = await supabase.from('warehouse_stock').update({ qty: updatedQty }).eq('id', existing.id);
        if (error) throw error;
        setWarehouseStock(prev => prev.map(w => w.id === existing.id ? { ...w, qty: updatedQty } : w));
      } else {
        const newItem = {
          productId: warehouseForm.productId ? parseInt(warehouseForm.productId, 10) : null,
          productName: warehouseForm.productName.trim(),
          category: warehouseForm.category || 'General',
          qty: qtyToAdd
        };
        const { data, error } = await supabase.from('warehouse_stock').insert(dbMap.warehouse.toDb(newItem)).select().single();
        if (error) throw error;
        setWarehouseStock([dbMap.warehouse.fromDb(data), ...warehouseStock]);
      }

      setShowModal(false);
      showToast('Warehouse inventory updated successfully!', 'success');
    } catch (err) {
      showToast('Error updating warehouse: ' + err.message, 'error');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'Products') {
        const productData = {
          name: formData.name,
          category: formData.category,
          productCode: formData.productCode || null,
          buyPrice: parseFloat(formData.buyPrice) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          stock: parseInt(formData.stock, 10) || 0,
          reorderLevel: parseInt(formData.reorderLevel, 10) || 5,
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
        const processedItems = [];
        let subtotal = 0;
        let totalCostAmount = 0;

        for (let item of cartItems) {
          const prod = products.find(p => p.id === parseInt(item.productId, 10));
          if (!prod) return showToast("Select a valid product.");
          const qty = parseInt(item.qty, 10) || 1;
          if (qty > prod.stock) return showToast(`Not enough stock for ${prod.name}. Available: ${prod.stock}`);

          const price = parseFloat(item.customSellPrice) || prod.sellPrice;
          subtotal += price * qty;
          totalCostAmount += prod.buyPrice * qty;

          processedItems.push({
            productId: prod.id,
            productName: prod.name,
            qty, buyPrice: prod.buyPrice, sellPrice: price, lineTotal: price * qty
          });
        }

        const discount = parseFloat(formData.discount) || 0;
        const totalSellAmount = subtotal - discount;
        const orderId = `#ORD-${Date.now().toString().slice(-5)}`;

        const saleRecord = {
          id: orderId,
          customer: formData.customer || 'Walk-in Customer',
          customerPhone: formData.customerPhone || '',
          items: processedItems,
          subtotal, discount, totalSellAmount, totalCostAmount,
          status: 'Paid',
          paymentMethod: formData.paymentMethod || 'Cash',
          date: formData.date || new Date().toISOString().split('T')[0],
        };

        await supabase.from('sales').insert(dbMap.sale.toDb(saleRecord));
        for (let i of processedItems) {
          const prod = products.find(p => p.id === i.productId);
          if (prod) {
            const newStock = Math.max(0, prod.stock - i.qty);
            await supabase.from('products').update({ stock: newStock }).eq('id', i.productId);
            setProducts(prev => prev.map(p => p.id === i.productId ? { ...p, stock: newStock } : p));
          }
        }

        setSales([saleRecord, ...sales]);
        await adjustCashBalance(totalSellAmount);
      } else if (activeTab === 'Purchases') {
        if (!formData.supplier) return showToast('Please select a supplier.');
        let totalAmount = 0;
        const processedItems = purchaseItems.map(row => {
          const qty = parseInt(row.qty, 10) || 0;
          const unitCost = parseFloat(row.unitCost) || 0;
          totalAmount += qty * unitCost;
          return {
            productId: row.productId || null,
            productName: row.productName,
            category: row.category,
            qty, unitCost, lineTotal: qty * unitCost
          };
        });

        const purchaseId = `#PUR-${Date.now().toString().slice(-5)}`;
        const purchaseRecord = {
          id: purchaseId,
          supplier: formData.supplier,
          items: processedItems,
          totalAmount,
          paidAmount: totalAmount,
          status: 'Paid',
          date: formData.date || new Date().toISOString().split('T')[0]
        };

        await supabase.from('purchases').insert(dbMap.purchase.toDb(purchaseRecord));
        setPurchases([purchaseRecord, ...purchases]);
        await adjustCashBalance(-totalAmount);
      }
      setShowModal(false);
      showToast('Saved successfully!', 'success');
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
    }
  };

  // Stock Inventory Amount Calculations (Shop, Warehouse & Combined Total)
  const shopStockItemsCount = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const shopStockTotalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.buyPrice || 0)), 0);

  const warehouseStockItemsCount = warehouseStock.reduce((sum, w) => sum + (w.qty || 0), 0);
  const warehouseStockTotalValue = warehouseStock.reduce((sum, w) => {
    const matchingProd = products.find(p => p.id === w.productId || p.name.toLowerCase() === w.productName.toLowerCase());
    const unitPrice = matchingProd ? matchingProd.buyPrice : 0;
    return sum + ((w.qty || 0) * unitPrice);
  }, 0);

  const combinedTotalStockCount = shopStockItemsCount + warehouseStockItemsCount;
  const combinedTotalStockValue = shopStockTotalValue + warehouseStockTotalValue;

  // Available unique categories for warehouse filtering
  const allWarehouseCategories = ['All', ...new Set([
    ...categories.map(c => c.name),
    ...warehouseStock.map(w => w.category).filter(Boolean)
  ])];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-lg border flex items-center justify-between gap-3 text-sm ${t.type === 'error' ? 'bg-red-950 border-red-800 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-200'}`}>
            <span>{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
        ))}
      </div>

      {session === undefined || dataLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-950">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-3" />
          <p className="text-slate-400 text-sm">Loading Satota Electronics...</p>
        </div>
      ) : session === null ? (
        <LoginScreen shopName={shopSettings.shopName} />
      ) : (
        <>
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center font-black text-white text-lg">
                {(shopSettings.shopName || 'S').charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-sm text-white truncate">{shopSettings.shopName}</h2>
                <p className="text-[10px] text-slate-400">Shop Management</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {[
                { id: 'Dashboard', label: 'Dashboard', icon: Home },
                { id: 'Products', label: 'Inventory & Products', icon: Box },
                { id: 'Warehouse', label: 'Warehouse Stock', icon: Warehouse },
                { id: 'Sales', label: 'Sales & POS', icon: ShoppingCart },
                { id: 'Purchases', label: 'Purchases / Stock In', icon: Truck },
                { id: 'Customers', label: 'Customers', icon: Users },
                { id: 'Suppliers', label: 'Suppliers', icon: Layers },
                { id: 'Reports', label: 'Reports (30 Days)', icon: PieChart },
                { id: 'Settings', label: 'Settings', icon: Settings },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 text-xs font-semibold transition-all">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between">
              <h1 className="text-lg font-bold text-white">{activeTab}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1.5 rounded-xl font-medium">
                  Cash Balance: Tk {(shopSettings.cashBalance || 0).toLocaleString()}
                </span>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
              {/* DASHBOARD TAB WITH SEPARATE & TOTAL INVENTORY METRICS */}
              {activeTab === 'Dashboard' && (() => {
                const monthlySales = sales.filter(s => s.date && s.date.startsWith(dashboardMonth));
                const monthlyRevenue = monthlySales.reduce((sum, s) => sum + (s.totalSellAmount || 0), 0);
                const availableMonths = [...new Set([currentMonthStr, ...sales.map(s => s.date?.slice(0, 7))].filter(Boolean))].sort().reverse();

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white">Dashboard Overview</h2>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Select Month:</label>
                        <select 
                          value={dashboardMonth} 
                          onChange={(e) => setDashboardMonth(e.target.value)}
                          className="bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                        >
                          {availableMonths.map(month => (
                            <option key={month} value={month}>
                              {new Date(month + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* SEPARATE & TOTAL INVENTORY STOCK CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Shop Stock Inventory Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shop Inventory Stock</h3>
                          <Box className="w-5 h-5 text-orange-400" />
                        </div>
                        <p className="text-2xl font-black text-white">Tk {shopStockTotalValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <span className="text-orange-400 font-bold">{shopStockItemsCount}</span> items in shop stock
                        </p>
                      </div>

                      {/* Warehouse Stock Inventory Card */}
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Warehouse Inventory Stock</h3>
                          <Warehouse className="w-5 h-5 text-blue-400" />
                        </div>
                        <p className="text-2xl font-black text-white">Tk {warehouseStockTotalValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                          <span className="text-blue-400 font-bold">{warehouseStockItemsCount}</span> items in warehouse
                        </p>
                      </div>

                      {/* Combined Total Stock Inventory Card */}
                      <div className="bg-gradient-to-br from-orange-500/10 via-slate-900 to-slate-900 border border-orange-500/30 rounded-2xl p-6 relative">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Total Combined Stock Inventory</h3>
                          <Boxes className="w-5 h-5 text-orange-400" />
                        </div>
                        <p className="text-2xl font-black text-orange-400">Tk {combinedTotalStockValue.toLocaleString()}</p>
                        <p className="text-xs text-slate-300 mt-2 flex items-center gap-1">
                          <span className="text-white font-bold">{combinedTotalStockCount}</span> total items overall
                        </p>
                      </div>
                    </div>

                    {/* CASH & MONTHLY METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cash in Hand</h3>
                        <p className="text-2xl font-black text-emerald-400">Tk {(shopSettings.cashBalance || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Orders ({dashboardMonth})</h3>
                        <p className="text-2xl font-black text-white">{monthlySales.length}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 border-l-4 border-l-orange-500">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Revenue ({dashboardMonth})</h3>
                        <p className="text-2xl font-black text-white">Tk {monthlyRevenue.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* PRODUCTS TAB */}
              {activeTab === 'Products' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search inventory by name, code or category..."
                        value={searchQueries['Products'] || ''}
                        onChange={(e) => setCurrentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20">
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50">
                          <th className="p-4">Product Name</th>
                          <th className="p-4">Code</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Buy Price</th>
                          <th className="p-4">Sell Price</th>
                          <th className="p-4">Stock</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {products
                          .filter(p => p.name.toLowerCase().includes(currentSearch) || (p.productCode && p.productCode.toLowerCase().includes(currentSearch)) || p.category.toLowerCase().includes(currentSearch))
                          .map(prod => (
                            <tr key={prod.id} className="hover:bg-slate-800/40">
                              <td className="p-4 font-semibold text-white">{prod.name}</td>
                              <td className="p-4 text-slate-400 font-mono text-xs">{prod.productCode || '—'}</td>
                              <td className="p-4 text-slate-300">{prod.category}</td>
                              <td className="p-4 text-slate-300">Tk {prod.buyPrice.toLocaleString()}</td>
                              <td className="p-4 text-slate-300">Tk {prod.sellPrice.toLocaleString()}</td>
                              <td className="p-4 font-bold text-orange-400">{prod.stock}</td>
                              <td className="p-4 text-right space-x-2">
                                <button onClick={() => handleOpenEdit(prod)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 inline-flex">
                                  <Pencil className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* WAREHOUSE TAB WITH SEARCH, CATEGORY-WISE FILTERS & OUT OF STOCK RED HIGHLIGHTS */}
              {activeTab === 'Warehouse' && (() => {
                const filteredWarehouseItems = warehouseStock.filter(item => {
                  const matchesCategory = warehouseCategoryFilter === 'All' || item.category === warehouseCategoryFilter;
                  const matchesSearch = item.productName.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
                                        (item.category && item.category.toLowerCase().includes(warehouseSearch.toLowerCase()));
                  return matchesCategory && matchesSearch;
                });

                // Group filtered items category-wise
                const groupedCategories = filteredWarehouseItems.reduce((acc, item) => {
                  const cat = item.category || 'General';
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {});

                return (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">Warehouse Stock Management</h2>
                        <p className="text-xs text-slate-400">Manage, search and monitor category-wise warehouse inventory</p>
                      </div>
                      
                      <button 
                        onClick={handleOpenAdd} 
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20"
                      >
                        <PackagePlus className="w-4 h-4" /> Add Item to Warehouse
                      </button>
                    </div>

                    {/* SEARCH & CATEGORY FILTER BAR */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search warehouse stock by product name or category..."
                          value={warehouseSearch}
                          onChange={(e) => setWarehouseSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>

                      {/* Category Selector Tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                        {allWarehouseCategories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setWarehouseCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                              warehouseCategoryFilter === cat 
                                ? 'bg-orange-500 text-white shadow-sm' 
                                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CATEGORY-WISE DISPLAY TABLES */}
                    {Object.keys(groupedCategories).length > 0 ? (
                      Object.entries(groupedCategories).map(([categoryName, items]) => (
                        <div key={categoryName} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                          <div className="bg-slate-800/60 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">{categoryName}</span>
                            <span className="text-xs text-slate-400">{items.length} Product(s)</span>
                          </div>

                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/30">
                                <th className="p-4">Product Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right">Warehouse Qty</th>
                                <th className="p-4 text-right">Shop Stock</th>
                                <th className="p-4 text-center">Stock Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-sm">
                              {items.map(item => {
                                const shopProduct = products.find(p => p.id === item.productId || p.name.toLowerCase() === item.productName.toLowerCase());
                                const shopQty = shopProduct ? shopProduct.stock : 0;
                                const isOutOfStock = item.qty === 0 || !shopProduct || shopQty === 0;

                                return (
                                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                                    <td className={`p-4 font-semibold ${isOutOfStock ? 'text-red-500 font-bold' : 'text-white'}`}>
                                      {item.productName} {!shopProduct && <span className="text-xs text-red-400 ml-1">(Not in Shop Catalog)</span>}
                                    </td>
                                    <td className={`p-4 ${isOutOfStock ? 'text-red-500/80' : 'text-slate-400'}`}>
                                      {item.category || 'General'}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${item.qty === 0 ? 'text-red-500 font-black' : 'text-orange-400'}`}>
                                      {item.qty}
                                    </td>
                                    <td className={`p-4 text-right font-bold ${shopQty === 0 ? 'text-red-500 font-black' : 'text-emerald-400'}`}>
                                      {shopQty}
                                    </td>
                                    <td className="p-4 text-center">
                                      {isOutOfStock ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                                          <AlertTriangle className="w-3 h-3" /> Out of Stock / Missing
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                                          In Stock
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                        <Warehouse className="w-10 h-10 mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-base font-medium text-slate-300">No warehouse items found</p>
                        <p className="text-xs text-slate-500 mt-1">Try resetting your search or filter options, or add a new item.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SALES TAB */}
              {activeTab === 'Sales' && (
                <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">New Sale & POS Entry</h3>
                  <form onSubmit={handleSaveItem} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Customer Name</label>
                        <input type="text" name="customer" value={formData.customer || ''} onChange={handleInputChange} placeholder="Walk-in Customer" className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Customer Phone</label>
                        <input type="text" name="customerPhone" value={formData.customerPhone || ''} onChange={handleInputChange} placeholder="01700000000" className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-400">Products</label>
                      {cartItems.map((cartItem, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <select
                            value={cartItem.productId}
                            onChange={(e) => handleCartChange(idx, 'productId', e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                          >
                            <option value="">Select product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) - Tk {p.sellPrice}</option>
                            ))}
                          </select>
                          <input
                            type="number" min="1" value={cartItem.qty}
                            onChange={(e) => handleCartChange(idx, 'qty', e.target.value)}
                            className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                          />
                          <button type="button" onClick={() => removeCartRow(idx)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                      <button type="button" onClick={addCartRow} className="text-xs text-orange-400 font-bold mt-1 inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add another item
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-4 gap-3">
                        {['Cash', 'bKash', 'Rocket', 'Nagad'].map(m => (
                          <button
                            type="button" key={m}
                            onClick={() => setFormData({ ...formData, paymentMethod: m })}
                            className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${formData.paymentMethod === m ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                      <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20">
                        Complete Sale
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PURCHASES TAB */}
              {activeTab === 'Purchases' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Purchase Orders / Stock In</h2>
                    <button onClick={handleOpenAdd} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20">
                      <Plus className="w-4 h-4" /> New Purchase Entry
                    </button>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50">
                          <th className="p-4">ID</th>
                          <th className="p-4">Supplier</th>
                          <th className="p-4">Items Summary</th>
                          <th className="p-4">Total Amount</th>
                          <th className="p-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {purchases.map(p => (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-mono text-xs text-orange-400">{p.id}</td>
                            <td className="p-4 font-semibold text-white">{p.supplier}</td>
                            <td className="p-4 text-slate-300">{(p.items || []).map(i => `${i.productName} (x${i.qty})`).join(', ')}</td>
                            <td className="p-4 text-white font-semibold">Tk {p.totalAmount.toLocaleString()}</td>
                            <td className="p-4 text-slate-400 text-xs">{p.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CUSTOMERS TAB */}
              {activeTab === 'Customers' && (
                <div>
                  <h2 className="text-lg font-bold text-white mb-6">Customer List</h2>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50">
                          <th className="p-4">Name</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {customers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-semibold text-white">{c.name}</td>
                            <td className="p-4 text-slate-300">{c.phone || '—'}</td>
                            <td className="p-4 text-slate-300">{c.email || '—'}</td>
                            <td className="p-4 text-slate-400">{c.address || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUPPLIERS TAB */}
              {activeTab === 'Suppliers' && (
                <div>
                  <h2 className="text-lg font-bold text-white mb-6">Suppliers Directory</h2>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/50">
                          <th className="p-4">Company</th>
                          <th className="p-4">Contact Person</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-sm">
                        {suppliers.map(s => (
                          <tr key={s.id} className="hover:bg-slate-800/40">
                            <td className="p-4 font-semibold text-white">{s.company}</td>
                            <td className="p-4 text-slate-300">{s.contact || '—'}</td>
                            <td className="p-4 text-slate-300">{s.phone || '—'}</td>
                            <td className="p-4 text-slate-400">{s.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORTS TAB (LAST 30 DAYS) */}
              {activeTab === 'Reports' && (() => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const last30DaysSales = sales.filter(s => new Date(s.date) >= thirtyDaysAgo);
                const total30DayRevenue = last30DaysSales.reduce((sum, s) => sum + (s.totalSellAmount || 0), 0);
                const total30DayCost = last30DaysSales.reduce((sum, s) => sum + (s.totalCostAmount || 0), 0);
                const profit30Day = total30DayRevenue - total30DayCost;

                return (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-white">Last 30 Days Sales & Profit Report</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">30-Day Total Revenue</h3>
                        <p className="text-2xl font-black text-white">Tk {total30DayRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">30-Day Cost of Goods</h3>
                        <p className="text-2xl font-black text-slate-300">Tk {total30DayCost.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">30-Day Net Profit</h3>
                        <p className={`text-2xl font-black ${profit30Day >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          Tk {profit30Day.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SETTINGS TAB */}
              {activeTab === 'Settings' && (
                <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Shop Settings</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setShopSettings(settingsForm);
                    await supabase.from('shop_settings').update({ shop_name: settingsForm.shopName }).eq('user_id', session.user.id);
                    showToast('Settings saved!', 'success');
                  }} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Shop Name</label>
                      <input type="text" value={settingsForm.shopName || ''} onChange={e => setSettingsForm({ ...settingsForm, shopName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                    </div>
                    <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20">
                      Save Settings
                    </button>
                  </form>
                </div>
              )}
            </div>
          </main>

          {/* UPGRADED IMPROVED WAREHOUSE ADD ITEM POPUP */}
          {showModal && activeTab === 'Warehouse' && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
                      <PackagePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Add Item to Warehouse</h3>
                      <p className="text-xs text-slate-400">Search product catalog or enter manually</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg"><X className="w-5 h-5"/></button>
                </div>

                <form onSubmit={handleSaveWarehouseItem} className="p-6 space-y-4">
                  {/* SEARCH PRODUCT FROM CATALOG */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select From Shop Catalog (Optional)
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Type to search product from shop catalog..."
                        value={warehouseModalSearch}
                        onChange={(e) => setWarehouseModalSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    {/* LIVE SEARCH RESULTS DROPDOWN */}
                    {warehouseModalSearch.trim() !== '' && (
                      <div className="mt-2 max-h-36 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
                        {products
                          .filter(p => p.name.toLowerCase().includes(warehouseModalSearch.toLowerCase()))
                          .map(p => (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => {
                                setWarehouseForm({
                                  ...warehouseForm,
                                  productId: p.id,
                                  productName: p.name,
                                  category: p.category || 'General'
                                });
                                setWarehouseModalSearch('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-slate-800/60 transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="font-semibold text-white">{p.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">{p.category}</span>
                            </button>
                          ))}
                        {products.filter(p => p.name.toLowerCase().includes(warehouseModalSearch.toLowerCase())).length === 0 && (
                          <div className="p-3 text-xs text-slate-500 text-center">No matching products in shop inventory</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PRODUCT NAME INPUT */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 43'' Smart LED TV"
                      value={warehouseForm.productName}
                      onChange={(e) => setWarehouseForm({ ...warehouseForm, productName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>

                  {/* PRODUCT CATEGORY & QUANTITY */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                      <select
                        value={warehouseForm.category}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, category: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      >
                        <option value="">Select Category...</option>
                        {allWarehouseCategories.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity <span className="text-red-400">*</span></label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={warehouseForm.qty}
                        onChange={(e) => setWarehouseForm({ ...warehouseForm, qty: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-orange-500/20"
                    >
                      Save to Warehouse
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PURCHASE MODAL */}
          {showModal && activeTab === 'Purchases' && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">New Purchase Order (Stock In)</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <form id="purchaseForm" onSubmit={handleSaveItem} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Supplier Name</label>
                      <select
                        name="supplier" value={formData.supplier || ''} onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white text-sm"
                      >
                        <option value="">Select supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.company}>{s.company}</option>)}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-slate-400">Purchased Items</label>
                      {purchaseItems.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                          <div className="md:col-span-2">
                            <input
                              type="text" placeholder="Product name"
                              value={item.productName} onChange={(e) => handlePurchaseItemChange(idx, 'productName', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="number" min="1" placeholder="Qty"
                              value={item.qty} onChange={(e) => handlePurchaseItemChange(idx, 'qty', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" placeholder="Unit Cost"
                              value={item.unitCost} onChange={(e) => handlePurchaseItemChange(idx, 'unitCost', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
                            />
                            <button type="button" onClick={() => removePurchaseItemRow(idx)} className="text-red-400 hover:text-red-300 p-2"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addPurchaseItemRow} className="text-xs text-orange-400 font-bold inline-flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add another row
                      </button>
                    </div>
                  </form>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/50">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-800">Cancel</button>
                  <button type="submit" form="purchaseForm" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-orange-500/20">Save Purchase Order</button>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS MODAL */}
          {showModal && activeTab === 'Products' && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{editingItem ? 'Edit Product' : 'Add New Product'}</h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Product Name</label>
                    <input type="text" required name="name" value={formData.name || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Product Code</label>
                    <input type="text" name="productCode" value={formData.productCode || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                    <input type="text" required name="category" value={formData.category || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Buy Price</label>
                      <input type="number" required name="buyPrice" value={formData.buyPrice || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Sell Price</label>
                      <input type="number" required name="sellPrice" value={formData.sellPrice || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Stock Quantity</label>
                    <input type="number" required name="stock" value={formData.stock || ''} onChange={handleInputChange} className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white text-sm" />
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl border border-slate-800 text-slate-300 text-xs">Cancel</button>
                    <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-xl text-xs">Save Product</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
