import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  ShieldCheck,
  Sparkles,
  Sprout,
  Leaf,
  CheckCircle2,
  Tag,
  Layers,
  Truck,
  User,
  Settings,
  RefreshCw,
  Plus,
  Info,
  Check
} from 'lucide-react';
import { storeClient } from '../../services/storeClientService';
import ProductDetailModal from './ProductDetailModal';
import ShoppingCartDrawer from './ShoppingCartDrawer';
import CheckoutBillingModal from './CheckoutBillingModal';
import QRPaymentModal from './QRPaymentModal';
import OrderTrackingModal from './OrderTrackingModal';
import InvoicePrintModal from './InvoicePrintModal';
import FarmerDashboardModal from './FarmerDashboardModal';
import AdminStoreDashboardModal from './AdminStoreDashboardModal';

export default function AgriSenseStorePage() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Modals state
  const [detailProduct, setDetailProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activePaymentOrder, setActivePaymentOrder] = useState(null);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState(null);
  const [isFarmerDashboardOpen, setIsFarmerDashboardOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Success Toast for Cart Additions
  const [cartToast, setCartToast] = useState(null);

  // Load initial data and subscribe to cart updates
  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const [cats, prods, activeCart] = await Promise.all([
          storeClient.getCategories(),
          storeClient.getProducts({ category: selectedCategory, search: searchQuery, crop: selectedCrop, sortBy, onlyInStock }),
          storeClient.getCart()
        ]);
        setCategories(cats);
        setProducts(prods);
        setCart(activeCart);
      } catch (err) {
        console.error('Store catalog fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();

    const unsubscribe = storeClient.subscribeCart((updatedCart) => {
      setCart(updatedCart);
    });

    return () => unsubscribe();
  }, []);

  // Re-fetch products when filters change
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      const prods = await storeClient.getProducts({
        category: selectedCategory,
        search: searchQuery,
        crop: selectedCrop,
        sortBy,
        onlyInStock
      });
      setProducts(prods);
    };

    fetchFilteredProducts();
  }, [selectedCategory, searchQuery, selectedCrop, sortBy, onlyInStock]);

  const handleAddToCart = async (productId, qty = 1) => {
    const res = await storeClient.addToCart(productId, qty);
    if (res.success) {
      setCartToast('Product added to agricultural cart!');
      setTimeout(() => setCartToast(null), 2500);
    } else {
      alert(res.message || 'Could not add item to cart');
    }
  };

  const handleOrderCreated = (orderResult) => {
    setIsCheckoutOpen(false);
    setActivePaymentOrder(orderResult);
  };

  const handlePaymentConfirmed = (confirmedResult) => {
    setActivePaymentOrder(null);
    if (confirmedResult?.order_id) {
      setActiveTrackingOrderId(confirmedResult.order_id);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {cartToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a4d33] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 border border-emerald-400 text-xs font-bold animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-300" />
          <span>{cartToast}</span>
        </div>
      )}

      {/* Top Banner / Store Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0a4d33] via-emerald-900 to-emerald-950 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-700/80 border border-emerald-400/40 text-emerald-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Government DBT & CIBRC Certified Agri Store
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                100% Genuine Supplies
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              AgriSense Kisan E-Commerce & Agricultural Supply Store
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              Order certified chemical fertilizers, organic compost, micronutrients, CIBRC pesticides, certified seeds, and farm equipment with official Direct Benefit Transfer (DBT) subsidy savings and farm delivery.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Live Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-[#0a4d33] font-black text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-700" />
              <span>Cart ({cart?.total_items || 0})</span>
              {cart?.subtotal > 0 && (
                <span className="font-mono text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-lg text-xs">
                  ₹{cart.subtotal.toFixed(0)}
                </span>
              )}
            </button>

            {/* My Orders Button */}
            <button
              onClick={() => setIsFarmerDashboardOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-500/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-200" />
              <span>My Orders</span>
            </button>

            {/* Admin / Ops Button */}
            <button
              onClick={() => setIsAdminDashboardOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-950/80 hover:bg-slate-900 text-emerald-200 font-bold text-xs border border-emerald-700/50 transition-colors flex items-center space-x-1.5 cursor-pointer"
              title="Store Administrator & Logistics Dashboard"
            >
              <Settings className="w-4 h-4" />
              <span>Operations Hub</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-emerald-900/10 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-200">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0a4d33] text-white shadow-md shadow-emerald-950/20'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/80'
            }`}
          >
            All Agricultural Products
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-2xl text-xs font-black shrink-0 transition-all cursor-pointer flex items-center space-x-1.5 ${
                selectedCategory === cat.slug
                  ? 'bg-[#0a4d33] text-white shadow-md shadow-emerald-950/20'
                  : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200/80'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Agricultural Filters Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name (Urea, DAP, Coragen, Seeds), brand or active ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Crop Suitability Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Sprout className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="">All Crop Types</option>
              <option value="Paddy">Paddy / Rice (వరి)</option>
              <option value="Cotton">Cotton (పత్తి)</option>
              <option value="Chilli">Chilli (మిర్చి)</option>
              <option value="Maize">Maize (మొక్కజొన్న)</option>
              <option value="Mustard">Mustard (ఆవాలు)</option>
              <option value="Wheat">Wheat (గోధుమ)</option>
              <option value="Groundnut">Groundnut (వేరుశనగ)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Product Name (A-Z)</option>
            </select>
          </div>

          {/* Stock Only Toggle */}
          <label className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 cursor-pointer text-slate-700 font-bold select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded-md text-emerald-700 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>In Stock Only</span>
          </label>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Verified Agricultural Catalog</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {products.length} Products
            </span>
          </h2>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Directly sourced from IFFCO, KRIBHCO, State Seed Corps, and Registered Manufacturers
          </span>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-emerald-700" />
            <p className="text-xs text-slate-500 font-bold">Querying verified agricultural catalog & inventory...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No agricultural products match your filters</p>
            <p className="text-xs text-slate-500">Try clearing filters or search queries.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedCrop('');
                setOnlyInStock(false);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {products.map((prod) => {
              const isLowStock = prod.stock_quantity < 30;
              const isOutOfStock = prod.stock_quantity <= 0;

              return (
                <div
                  key={prod.id}
                  className="rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-500/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1"
                >
                  {/* Card Content Top */}
                  <div className="p-5 space-y-3">
                    {/* Category & Verified Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {prod.category_name}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isOutOfStock ? 'bg-rose-100 text-rose-800' :
                        isLowStock ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : `${prod.stock_quantity} in stock`}
                      </span>
                    </div>

                    {/* Product Name & Brand */}
                    <div>
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-950 transition-colors leading-snug">
                        {prod.name}
                      </h3>
                      {prod.name_te && (
                        <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                          {prod.name_te}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <span>{prod.brand}</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      </p>
                    </div>

                    {/* Pack & Target Crop Tag */}
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700">
                        Pack: {prod.pack_size} {prod.pack_unit}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-bold text-slate-700 truncate max-w-[150px]">
                        {prod.suitable_crops}
                      </span>
                    </div>

                    {/* Short Description */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>

                  {/* Card Footer / Pricing & Actions */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-2.5">
                    {/* Price Block */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black text-[#0a4d33]">₹{prod.mrp.toFixed(2)}</span>
                          {prod.original_price > prod.mrp && (
                            <span className="text-xs font-semibold text-slate-400 line-through">
                              ₹{prod.original_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {prod.subsidy_saved > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                            Save ₹{prod.subsidy_saved.toFixed(2)} via DBT
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setDetailProduct(prod)}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Dosage</span>
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(prod.id, 1)}
                      disabled={isOutOfStock}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0a4d33] to-emerald-800 hover:from-emerald-900 hover:to-emerald-950 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals Orchestration */}
      <ProductDetailModal
        product={detailProduct}
        isOpen={Boolean(detailProduct)}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <ShoppingCartDrawer
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutBillingModal
        cart={cart}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      <QRPaymentModal
        orderData={activePaymentOrder}
        isOpen={Boolean(activePaymentOrder)}
        onClose={() => setActivePaymentOrder(null)}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      <OrderTrackingModal
        orderId={activeTrackingOrderId}
        isOpen={Boolean(activeTrackingOrderId)}
        onClose={() => setActiveTrackingOrderId(null)}
        onOpenInvoice={(order) => {
          setActiveTrackingOrderId(null);
          setActiveInvoiceOrder(order);
        }}
      />

      <InvoicePrintModal
        order={activeInvoiceOrder}
        isOpen={Boolean(activeInvoiceOrder)}
        onClose={() => setActiveInvoiceOrder(null)}
      />

      <FarmerDashboardModal
        isOpen={isFarmerDashboardOpen}
        onClose={() => setIsFarmerDashboardOpen(false)}
        onTrackOrder={(id) => {
          setIsFarmerDashboardOpen(false);
          setActiveTrackingOrderId(id);
        }}
        onOpenInvoice={(ord) => {
          setIsFarmerDashboardOpen(false);
          setActiveInvoiceOrder(ord);
        }}
      />

      <AdminStoreDashboardModal
        isOpen={isAdminDashboardOpen}
        onClose={() => setIsAdminDashboardOpen(false)}
        onTrackOrder={(id) => {
          setIsAdminDashboardOpen(false);
          setActiveTrackingOrderId(id);
        }}
      />
    </div>
  );
}
