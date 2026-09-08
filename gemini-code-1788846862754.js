import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Home, Box, Layers, Warehouse, 
  ShoppingCart, Users, Truck, ArrowLeftRight, PieChart, Settings, 
  Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Eye, X, Printer, Pencil, Save, RefreshCw
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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
  currency: 'Tk'
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

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Persistent States
  const [categories, setCategories] = useLocalStorage('satota_categories', defaultCategories);
  const [products, setProducts] = useLocalStorage('satota_products', defaultProducts);
  const [sales, setSales] = useLocalStorage('satota_sales', defaultSales);
  const [customers, setCustomers] = useLocalStorage('satota_customers', defaultCustomers);
  const [suppliers, setSuppliers] = useLocalStorage('satota_suppliers', defaultSuppliers);
  const [transactions, setTransactions] = useLocalStorage('satota_transactions', defaultTransactions);
  const [shopSettings, setShopSettings] = useLocalStorage('satota_settings', defaultSettings);

  // Modal & Edit States
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [formData, setFormData] = useState({});

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(shopSettings);

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

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setShopSettings(settingsForm);
    alert('Settings updated successfully!');
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
  const handleSaveItem = (e) => {
    e.preventDefault();

    if (activeTab === 'Products') {
      const newStock = parseInt(formData.stock, 10) || 0;
      const reorderLevel = parseInt(formData.reorderLevel, 10) || 5;

      if (editingItem) {
        setProducts(products.map(p => p.id === editingItem.id ? { 
          ...p, ...formData, 
          buyPrice: parseFloat(formData.buyPrice), 
          sellPrice: parseFloat(formData.sellPrice),
          stock: newStock,
          reorderLevel
        } : p));
      } else {
        const newProduct = {
          id: Date.now(),
          name: formData.name,
          category: formData.category,
          buyPrice: parseFloat(formData.buyPrice) || 0,
          sellPrice: parseFloat(formData.sellPrice) || 0,
          stock: newStock,
          reorderLevel: reorderLevel
        };
        setProducts([newProduct, ...products]);
      }

    } else if (activeTab === 'Sales') {
      const processedItems = [];
      let subtotal = 0;
      let totalCostAmount = 0;

      for (let item of cartItems) {
        const prod = products.find(p => p.id === parseInt(item.productId, 10));
        if (!prod) return alert("Please select a valid product for all rows.");
        const qty = parseInt(item.qty, 10) || 1;
        
        if (!editingItem && qty > prod.stock) {
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

      if (editingItem) {
        setSales(sales.map(s => s.id === editingItem.id ? saleRecord : s));
        setTransactions(prev => prev.map(t => 
          t.refId === editingItem.id || t.id === `TXN-${editingItem.id.replace('#', '')}`
            ? { ...t, amount: totalSellAmount, date: saleRecord.date, status: saleRecord.status === 'Paid' ? 'Success' : 'Pending' }
            : t
        ));
      } else {
        setSales([saleRecord, ...sales]);
        
        // Deduct Stock from Products directly
        setProducts(prev => prev.map(p => {
          const soldItem = processedItems.find(i => i.productId === p.id);
          return soldItem ? { ...p, stock: Math.max(0, p.stock - soldItem.qty) } : p;
        }));

        const autoTransaction = {
          id: `TXN-${orderId.replace('#', '')}`,
          refId: orderId,
          type: 'Income',
          amount: totalSellAmount,
          date: saleRecord.date,
          status: saleRecord.status === 'Paid' ? 'Success' : 'Pending'
        };
        setTransactions([autoTransaction, ...transactions]);
      }

    } else if (activeTab === 'Categories') {
      if (editingItem) {
        setCategories(categories.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
      } else {
        setCategories([...categories, { id: Date.now(), ...formData, totalItems: 0 }]);
      }
    } else if (activeTab === 'Customers') {
      if (editingItem) {
        setCustomers(customers.map(c => c.id === editingItem.id ? { ...c, ...formData } : c));
      } else {
        setCustomers([...customers, { id: Date.now(), ...formData }]);
      }
    } else if (activeTab === 'Suppliers') {
      if (editingItem) {
        setSuppliers(suppliers.map(s => s.id === editingItem.id ? { ...s, ...formData } : s));
      } else {
        setSuppliers([...suppliers, { id: Date.now(), ...formData }]);
      }
    } else if (activeTab === 'Transactions') {
      if (editingItem) {
        setTransactions(transactions.map(t => t.id === editingItem.id ? { ...t, ...formData, amount: parseFloat(formData.amount) } : t));
      } else {
        setTransactions([{ id: `TXN-${Math.floor(100 + Math.random() * 900)}`, ...formData, amount: parseFloat(formData.amount), date: new Date().toISOString().split('T')[0] }, ...transactions]);
      }
    }

    setFormData({});
    setShowModal(false);
  };

  const handleDelete = (id, type) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    if (type === 'Products') setProducts(products.filter(p => p.id !== id));
    if (type === 'Sales') {
      setSales(sales.filter(s => s.id !== id));
      setTransactions(transactions.filter(t => t.refId !== id && t.id !== `TXN-${id.replace('#', '')}`));
    }
    if (type === 'Categories') setCategories(categories.filter(c => c.id !== id));
    if (type === 'Customers') setCustomers(customers.filter(c => c.id !== id));
    if (type === 'Suppliers') setSuppliers(suppliers.filter(s => s.id !== id));
    if (type === 'Transactions') setTransactions(transactions.filter(t => t.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculations
  const totalSellAmount = sales.reduce((sum, sale) => sum + sale.totalSellAmount, 0);
  const costOfGoodsSold = sales.reduce((sum, sale) => sum + sale.totalCostAmount, 0);
  const netProfit = totalSellAmount - costOfGoodsSold;
  const currentInventoryValue = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  const lowStockProducts = products.filter(p => p.stock <= (p.reorderLevel || 5));

  const navItems = [
    { name: 'Dashboard', icon: Home }, { name: 'Products', icon: Box },
    { name: 'Categories', icon: Layers }, { name: 'Inventory', icon: Warehouse },
    { name: 'Sales', icon: ShoppingCart }, { name: 'Customers', icon: Users },
    { name: 'Suppliers', icon: Truck }, { name: 'Transactions', icon: ArrowLeftRight },
    { name: 'Reports', icon: PieChart }, { name: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* Printable Invoice Specific CSS */}
      <style>{`
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
            width: 100%;
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
      <aside className="w-72 bg-slate-900 text-white flex flex-col p-6 shrink-0 no-print">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-orange-500 text-white rounded-xl flex items-center justify-center font-black text-2xl shadow-lg">S</div>
          <div>
            <h2 className="font-extrabold text-lg text-white leading-tight">{shopSettings.shopName}</h2>
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Electronics</p>
          </div>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => { setActiveTab(item.name); setShowModal(false); }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.name ? 'bg-orange-500 text-white font-bold shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === 'Inventory' && lowStockProducts.length > 0 && (
                  <span className="ml-auto bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-bold">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 no-print">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{activeTab}</h1>
            <p className="text-xs text-slate-500 font-medium">{shopSettings.shopName} Management System</p>
          </div>
          {['Products', 'Categories', 'Sales', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
            <button 
              onClick={handleOpenAdd}
              className="bg-orange-500 text-white text-sm font-bold px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-orange-600 shadow-md transition-all"
            >
              <Plus className="w-5 h-5" /> Add New {activeTab === 'Sales' ? 'Sale' : activeTab.slice(0, -1)}
            </button>
          )}
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
            <div className={`bg-white rounded-2xl p-8 shadow-2xl border border-slate-200 ${activeTab === 'Sales' ? 'w-[700px]' : 'w-[480px]'}`}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editingItem ? 'Edit' : 'Add New'} {activeTab.slice(0, -1)}</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4 text-sm">
                {activeTab === 'Products' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Product Name" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <select required name="category" defaultValue={formData.category || ''} onChange={handleInputChange} className="w-full border p-3 rounded-xl bg-white">
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <div className="flex gap-4">
                      <input required name="buyPrice" type="number" step="0.01" defaultValue={formData.buyPrice || ''} placeholder="Buy Price (Tk)" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                      <input required name="sellPrice" type="number" step="0.01" defaultValue={formData.sellPrice || ''} placeholder="Sell Price (Tk)" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    </div>
                    <div className="flex gap-4">
                      <input required name="stock" type="number" defaultValue={formData.stock !== undefined ? formData.stock : ''} placeholder="Current Stock" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                      <input required name="reorderLevel" type="number" defaultValue={formData.reorderLevel !== undefined ? formData.reorderLevel : ''} placeholder="Reorder Level" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    </div>
                  </>
                )}

                {activeTab === 'Sales' && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input required name="customer" defaultValue={formData.customer || ''} placeholder="Customer Name" onChange={handleInputChange} className="border p-3 rounded-xl" />
                      <input name="customerPhone" defaultValue={formData.customerPhone || ''} placeholder="Customer Phone" onChange={handleInputChange} className="border p-3 rounded-xl" />
                    </div>
                    <input name="customerAddress" defaultValue={formData.customerAddress || ''} placeholder="Customer Address" onChange={handleInputChange} className="w-full border p-3 rounded-xl mb-4" />
                    
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      <label className="font-bold text-slate-700">Products in Order:</label>
                      {cartItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <select 
                            required 
                            value={item.productId}
                            onChange={(e) => handleCartChange(idx, 'productId', e.target.value)} 
                            className="flex-1 border p-2 rounded-lg bg-white text-sm"
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
                            className="w-16 border p-2 rounded-lg text-center" 
                          />
                          <input 
                            required 
                            type="number" 
                            step="0.01"
                            placeholder="Sell Price" 
                            value={item.customSellPrice} 
                            onChange={(e) => handleCartChange(idx, 'customSellPrice', e.target.value)} 
                            className="w-28 border p-2 rounded-lg text-right" 
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
                      <input name="discount" type="number" defaultValue={formData.discount || ''} placeholder="Discount (Tk)" onChange={handleInputChange} className="w-1/2 border p-3 rounded-xl" />
                      <select name="status" defaultValue={formData.status || 'Paid'} onChange={handleInputChange} className="w-1/2 border p-3 rounded-xl bg-white">
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'Categories' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Category Name" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input required name="description" defaultValue={formData.description || ''} placeholder="Description" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                  </>
                )}

                {activeTab === 'Customers' && (
                  <>
                    <input required name="name" defaultValue={formData.name || ''} placeholder="Full Name" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input required name="email" type="email" defaultValue={formData.email || ''} placeholder="Email Address" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input name="phone" defaultValue={formData.phone || ''} placeholder="Phone Number" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input name="address" defaultValue={formData.address || ''} placeholder="Address" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                  </>
                )}

                {activeTab === 'Suppliers' && (
                  <>
                    <input required name="company" defaultValue={formData.company || ''} placeholder="Company Name" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input required name="contact" defaultValue={formData.contact || ''} placeholder="Contact Person" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input name="email" defaultValue={formData.email || ''} placeholder="Email Address" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                    <input name="phone" defaultValue={formData.phone || ''} placeholder="Phone Number" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                  </>
                )}

                {activeTab === 'Transactions' && (
                  <>
                    <select name="type" defaultValue={formData.type || 'Income'} onChange={handleInputChange} className="w-full border p-3 rounded-xl bg-white">
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                    <input required name="amount" type="number" step="0.01" defaultValue={formData.amount || ''} placeholder="Amount (Tk)" onChange={handleInputChange} className="w-full border p-3 rounded-xl" />
                  </>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border rounded-xl text-slate-600 font-semibold text-sm">Cancel</button>
                  <button type="submit" className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE INVOICE MODAL */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-[700px] shadow-2xl border border-slate-200 overflow-hidden relative" id="printable-invoice-modal">
              
              <div className="relative p-8 pb-4">
                <div className="flex justify-between items-start">
                  <div className="relative bg-slate-900 text-white p-5 pr-10 rounded-r-3xl border-l-8 border-orange-500 max-w-[340px]">
                    <h3 className="text-orange-400 font-black text-xs tracking-wider uppercase mb-1">Invoice to:</h3>
                    <p className="font-bold text-slate-100 text-base">{selectedReceipt.customer}</p>
                    <p className="text-xs text-slate-300 mt-1">{selectedReceipt.customerAddress || 'Address: N/A'}</p>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">{selectedReceipt.customerPhone || 'Phone: N/A'}</p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <div className="w-9 h-9 bg-orange-500 text-white rounded-lg flex items-center justify-center font-black text-xl">S</div>
                      <span className="font-extrabold text-xl text-slate-900 tracking-tight">{shopSettings.shopName.split(' ')[0]} <span className="text-orange-500">{shopSettings.shopName.split(' ').slice(1).join(' ')}</span></span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-700 tracking-wide uppercase">Proprietor: {shopSettings.proprietor}</p>
                    <h1 className="text-3xl font-black text-orange-500 tracking-tight uppercase mt-2">INVOICE</h1>
                    <div className="text-xs text-slate-600 font-medium mt-1">
                      <p><span className="font-bold text-slate-800">Invoice No:</span> {selectedReceipt.id}</p>
                      <p><span className="font-bold text-slate-800">Issue Date:</span> {selectedReceipt.date}</p>
                      <p><span className="font-bold text-slate-800">Status:</span> {selectedReceipt.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 my-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="text-white font-bold uppercase tracking-wider">
                      <th className="bg-orange-500 p-3 rounded-tl-lg w-16 text-center">Ref</th>
                      <th className="bg-slate-900 p-3">Product Description</th>
                      <th className="bg-orange-500 p-3 text-right w-24">Price</th>
                      <th className="bg-slate-900 p-3 text-center w-16">Qty.</th>
                      <th className="bg-slate-900 p-3 text-right rounded-tr-lg w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedReceipt.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                        <td className="p-3 text-center font-mono font-bold text-slate-500">{`0${idx + 1}`}</td>
                        <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                        <td className="p-3 text-right">Tk {item.sellPrice.toLocaleString()}</td>
                        <td className="p-3 text-center font-bold">{item.qty}</td>
                        <td className="p-3 text-right font-extrabold text-slate-900">Tk {item.lineTotal.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-8 flex justify-between items-start mb-6">
                <div className="w-7/12 pr-6 text-xs text-slate-600 space-y-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="font-bold text-slate-800 mb-1 uppercase tracking-wider">Shop & Contact Info</p>
                    <p><span className="font-semibold text-slate-800">Store:</span> {shopSettings.shopName}</p>
                    <p><span className="font-semibold text-slate-800">Proprietor:</span> {shopSettings.proprietor}</p>
                    <p><span className="font-semibold text-slate-800">Phone:</span> {shopSettings.phone}</p>
                    <p><span className="font-semibold text-slate-800">Location:</span> {shopSettings.address}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 mb-0.5">Terms & Conditions</p>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Goods sold can be exchanged within 7 days with original invoice. Electronics warranty subject to manufacturer guidelines.
                    </p>
                  </div>
                </div>

                <div className="w-5/12 text-xs space-y-1.5 text-right">
                  <div className="flex justify-between py-1 border-b text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">Tk {(selectedReceipt.subtotal || selectedReceipt.totalSellAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b text-slate-600">
                    <span>Discount:</span>
                    <span className="font-bold text-slate-800">Tk {(selectedReceipt.discount || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 text-white p-3 rounded-xl flex justify-between items-center mt-3 shadow-md">
                    <span className="font-black uppercase tracking-wider text-orange-400 text-sm">TOTAL</span>
                    <span className="font-black text-xl text-white">Tk {selectedReceipt.totalSellAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-6 flex justify-between items-end border-t border-slate-100 pt-4">
                <div className="text-center pt-6">
                  <div className="w-36 border-b-2 border-slate-400 mb-1 mx-auto"></div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase">Authorized Sign</p>
                </div>

                <div className="bg-slate-900 text-white text-[10px] p-2.5 px-5 rounded-l-2xl border-r-4 border-orange-500 text-right">
                  <p className="font-bold text-orange-400">{shopSettings.shopName}</p>
                  <p className="text-slate-300">{shopSettings.address}</p>
                </div>
              </div>

              <div className="bg-slate-100 p-4 flex justify-between items-center no-print">
                <button onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all">
                  <Printer className="w-4 h-4" /> Print Invoice
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-slate-600 hover:text-slate-900 font-bold text-sm px-4 py-2">
                  Close Preview
                </button>
              </div>

            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'Dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2"><ShoppingBag className="w-5 h-5 text-orange-500" /> Total Sales</div>
                <div className="text-3xl font-black text-slate-900">Tk {totalSellAmount.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2"><Box className="w-5 h-5 text-orange-500" /> Inventory Value</div>
                <div className="text-3xl font-black text-slate-900">Tk {currentInventoryValue.toLocaleString()}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-2"><TrendingUp className="w-5 h-5 text-emerald-600" /> Net Profit</div>
                <div className={`text-3xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Tk {netProfit.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6">Monthly Revenue Overview</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={defaultMonthlySales}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `Tk ${val / 1000}k`} />
                    <Tooltip formatter={(value) => [`Tk ${value.toLocaleString()}`, 'Sales']} />
                    <Bar dataKey="sales" radius={[6, 6, 0, 0]} fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'Products' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="pb-3">PRODUCT</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">BUY PRICE</th>
                  <th className="pb-3">SELL PRICE</th>
                  <th className="pb-3">STOCK</th>
                  <th className="pb-3">TOTAL ASSET</th>
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-4 text-slate-600">{p.category}</td>
                    <td className="py-4 text-slate-600">Tk {p.buyPrice.toLocaleString()}</td>
                    <td className="py-4 font-bold text-slate-800">Tk {p.sellPrice.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.stock} units {p.stock <= p.reorderLevel && '⚠️'}
                      </span>
                    </td>
                    <td className="py-4 font-black text-slate-900">Tk {(p.buyPrice * p.stock).toLocaleString()}</td>
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => handleOpenEdit(p)} title="Edit Product" className="text-slate-400 hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id, 'Products')} title="Delete Product" className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* INVENTORY TAB (Directly synced with Products) */}
        {activeTab === 'Inventory' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-slate-900 text-lg">Stock Assets Overview</h3>
              <div className="bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl text-orange-900 text-sm font-bold">
                Total Inventory Capital Asset: Tk {currentInventoryValue.toLocaleString()}
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="pb-3">PRODUCT ITEM</th>
                  <th className="pb-3">CATEGORY</th>
                  <th className="pb-3">UNIT BUY PRICE</th>
                  <th className="pb-3">AVAILABLE QTY</th>
                  <th className="pb-3">TOTAL ASSET VALUE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-4 text-slate-600">{p.category}</td>
                    <td className="py-4 text-slate-600">Tk {p.buyPrice.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= p.reorderLevel ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-4 font-black text-slate-900">Tk {(p.buyPrice * p.stock).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SALES TAB */}
        {activeTab === 'Sales' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="pb-3">ORDER ID</th><th className="pb-3">CUSTOMER</th><th className="pb-3">ITEMS</th><th className="pb-3">TOTAL AMOUNT</th><th className="pb-3">DATE</th><th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sales.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-4 font-bold text-orange-600">{s.id}</td>
                    <td className="py-4 font-medium text-slate-800">{s.customer}</td>
                    <td className="py-4 text-slate-600">{s.items.length} item(s)</td>
                    <td className="py-4 font-bold text-slate-900">Tk {s.totalSellAmount.toLocaleString()}</td>
                    <td className="py-4 text-slate-500">{s.date}</td>
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => setSelectedReceipt(s)} title="View & Print Invoice" className="text-slate-400 hover:text-orange-600 p-2"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleOpenEdit(s)} title="Edit Sale Record" className="text-slate-400 hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id, 'Sales')} title="Delete Sale" className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'Reports' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Financial Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-1">Cost of Goods Sold (COGS)</p>
                <p className="text-2xl font-bold text-slate-800">Tk {costOfGoodsSold.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Sales Revenue</p>
                <p className="text-2xl font-bold text-orange-600">Tk {totalSellAmount.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-1">Net Profit / Loss</p>
                <p className={`text-2xl font-bold flex items-center gap-2 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {netProfit >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  Tk {Math.abs(netProfit).toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border shadow-sm">
                <p className="text-sm font-semibold text-slate-500 mb-1">Total Inventory Assets</p>
                <p className="text-2xl font-bold text-slate-800">Tk {currentInventoryValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'Settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-2">Shop & Invoice Configuration</h3>
            <p className="text-xs text-slate-500 mb-6">Update your store identity. These details will automatically sync with your printed invoices and dashboard headers.</p>
            
            <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Shop / Business Name</label>
                <input required name="shopName" value={settingsForm.shopName} onChange={handleSettingsChange} className="w-full border p-3 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Proprietor Name</label>
                <input required name="proprietor" value={settingsForm.proprietor} onChange={handleSettingsChange} className="w-full border p-3 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Phone Number(s)</label>
                <input required name="phone" value={settingsForm.phone} onChange={handleSettingsChange} className="w-full border p-3 rounded-xl" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Store Address / Location</label>
                <input required name="address" value={settingsForm.address} onChange={handleSettingsChange} className="w-full border p-3 rounded-xl" />
              </div>
              <div className="pt-4 flex items-center justify-between border-t">
                <button 
                  type="button" 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to reset all data back to factory defaults?")) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }} 
                  className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reset App Data
                </button>
                <button type="submit" className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 shadow-md flex items-center gap-2">
                  <Save className="w-4 h-4" /> Save Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* GENERIC TABLES FOR OTHER TABS */}
        {['Categories', 'Customers', 'Suppliers', 'Transactions'].includes(activeTab) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  {Object.keys(eval(activeTab.toLowerCase())[0] || {}).map(k => (
                    <th key={k} className="pb-3 uppercase">{k}</th>
                  ))}
                  <th className="pb-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eval(activeTab.toLowerCase()).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    {Object.values(item).map((val, i) => (
                      <td key={i} className="py-4 font-medium text-slate-700">{typeof val === 'object' ? JSON.stringify(val) : val}</td>
                    ))}
                    <td className="py-4 text-right flex justify-end gap-1">
                      <button onClick={() => handleOpenEdit(item)} title="Edit Entry" className="text-slate-400 hover:text-orange-600 p-2"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id, activeTab)} title="Delete Entry" className="text-slate-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}