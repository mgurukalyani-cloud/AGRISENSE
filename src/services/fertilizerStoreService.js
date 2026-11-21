/**
 * AgriSense Commercial Fertilizer Store & Cart Service
 * 
 * Manages government-subsidized fertilizer catalog (DBT pricing standards),
 * parses crop fertilizer predictions into exact commercial bag counts,
 * and maintains shopping cart state with local storage persistence.
 */

export const FERTILIZER_CATALOG = {
  urea: {
    id: 'urea',
    name: 'Neem Coated Urea (46% N)',
    brand: 'IFFCO / KRIBHCO Neem Coated',
    category: 'Nitrogenous',
    bagWeightKg: 45,
    mrp: 266.50, // Official GoI DBT subsidized rate per 45kg bag
    originalPrice: 2450.00,
    subsidySaved: 2183.50,
    formula: 'CO(NH₂)₂',
    description: 'Slow-release Neem-coated prilled Urea. Enhances nitrogen use efficiency, promotes vigorous vegetative tillering and chlorophyll synthesis.',
    timing: 'Split: 25% Basal, 40% Tillering, 35% Panicle Initiation',
    badge: 'Govt Subsidized (DBT)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    inStock: true,
    deliveryDays: '1 - 2 Business Days'
  },
  dap: {
    id: 'dap',
    name: 'Di-Ammonium Phosphate (18-46-0)',
    brand: 'IFFCO / Coromandel Gromor DAP',
    category: 'Phosphatic & Nitrogenous',
    bagWeightKg: 50,
    mrp: 1350.00, // Official GoI subsidized rate per 50kg bag
    originalPrice: 4000.00,
    subsidySaved: 2650.00,
    formula: '(NH₄)₂HPO₄',
    description: 'Concentrated source of 46% P₂O₅ and 18% starter Nitrogen. Essential for crown root initiation, root anchorage, and early seedling establishment.',
    timing: '100% Basal incorporation during final ploughing / sowing',
    badge: 'Govt Subsidized (DBT)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    inStock: true,
    deliveryDays: '1 - 2 Business Days'
  },
  mop: {
    id: 'mop',
    name: 'Muriate of Potash (60% K₂O)',
    brand: 'IPL / Indian Potash Limited MOP',
    category: 'Potassic',
    bagWeightKg: 50,
    mrp: 1700.00, // Subsidized MOP rate per 50kg bag
    originalPrice: 3200.00,
    subsidySaved: 1500.00,
    formula: 'KCl (Potassium Chloride)',
    description: 'Supplies 60% Potassium. Regulates stomatal conductance, builds disease & drought resistance, improves lodging resistance and grain test weight.',
    timing: '50% Basal at sowing, 50% at flowering / heading',
    badge: 'Essential Potash',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    inStock: true,
    deliveryDays: '2 - 3 Business Days'
  },
  ssp: {
    id: 'ssp',
    name: 'Single Super Phosphate (16% P₂O₅, 11% S)',
    brand: 'Khaitan / Coromandel SSP',
    category: 'Phosphatic & Sulphur',
    bagWeightKg: 50,
    mrp: 425.00,
    originalPrice: 900.00,
    subsidySaved: 475.00,
    formula: 'Ca(H₂PO₄)₂ + CaSO₄',
    description: 'Multi-nutrient fertilizer providing Phosphate, 11% water-soluble Sulphur, and 21% Calcium. Ideal for oilseeds (Mustard, Groundnut) to increase oil content.',
    timing: 'Basal application at sowing',
    badge: 'Phosphate + Sulphur',
    badgeColor: 'bg-lime-100 text-lime-800 border-lime-300',
    inStock: true,
    deliveryDays: '1 - 2 Business Days'
  },
  npk_complex: {
    id: 'npk_complex',
    name: 'NPK Complex (20-20-0-13 Sulphur)',
    brand: 'IFFCO / FACT Ammonium Phosphate Sulphate',
    category: 'Complex Fertilizer',
    bagWeightKg: 50,
    mrp: 1200.00,
    originalPrice: 2600.00,
    subsidySaved: 1400.00,
    formula: '20-20-0-13',
    description: 'High-efficiency granular complex with 20% Ammoniacal Nitrogen, 20% Phosphate and 13% Sulphur. Excellent starter fertilizer for cereals, pulses and oilseeds.',
    timing: 'Basal or early top-dressing',
    badge: 'Balanced Complex',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    inStock: true,
    deliveryDays: '2 - 3 Business Days'
  },
  zinc_sulphate: {
    id: 'zinc_sulphate',
    name: 'Zinc Sulphate Heptahydrate (21% Zn, 10% S)',
    brand: 'IFFCO / Uttam Micro-Zinc 21%',
    category: 'Micronutrient',
    bagWeightKg: 25,
    mrp: 650.00,
    originalPrice: 850.00,
    subsidySaved: 200.00,
    formula: 'ZnSO₄·7H₂O',
    description: 'Essential micronutrient preventing Khaira disease in paddy, interveinal chlorosis, and stunted rosetting. Apply separately from DAP to avoid precipitation.',
    timing: 'Basal broadcast; never mix directly with DAP in same bucket',
    badge: 'Micronutrient',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    inStock: true,
    deliveryDays: '1 - 2 Business Days'
  },
  borax: {
    id: 'borax',
    name: 'Borax / Solubor (Boron 20%)',
    brand: 'Multiplex Multibor Foliar',
    category: 'Foliar Micronutrient',
    bagWeightKg: 1,
    mrp: 180.00,
    originalPrice: 240.00,
    subsidySaved: 60.00,
    formula: 'Na₂B₈O₁₃·4H₂O',
    description: 'Water-soluble foliar spray promoting pollen fertility, flower retention, and pod filling in mustard, pulses, chilli, and cotton.',
    timing: 'Foliar spray @ 1g/L at pre-flowering and pod initiation',
    badge: 'Flower Retention',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    inStock: true,
    deliveryDays: '1 - 2 Business Days'
  }
};

/**
 * Parses crop's fertilizerDosage object and converts it to concrete commercial bag predictions
 * for a specific farm area (acres).
 */
export function getPredictedFertilizersForCrop(crop, landAreaAcres = 1.0) {
  if (!crop || !crop.fertilizerDosage) return [];

  const area = Math.max(0.1, Number(landAreaAcres) || 1.0);
  const dosage = crop.fertilizerDosage;
  const items = [];

  // Helper to extract kg number from string like "110 kg/acre (in 2-3 split doses)"
  const extractKg = (str) => {
    if (!str) return 0;
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // 1. Urea
  if (dosage.urea) {
    const kgPerAcre = extractKg(dosage.urea) || 90;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const bags = Math.max(1, Math.round(totalKg / FERTILIZER_CATALOG.urea.bagWeightKg));
    items.push({
      catalogKey: 'urea',
      ...FERTILIZER_CATALOG.urea,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: bags,
      dosageSchedule: dosage.urea,
      lineTotal: bags * FERTILIZER_CATALOG.urea.mrp,
      lineSubsidySaved: bags * FERTILIZER_CATALOG.urea.subsidySaved
    });
  }

  // 2. DAP
  if (dosage.dap) {
    const kgPerAcre = extractKg(dosage.dap) || 50;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const bags = Math.max(1, Math.round(totalKg / FERTILIZER_CATALOG.dap.bagWeightKg));
    items.push({
      catalogKey: 'dap',
      ...FERTILIZER_CATALOG.dap,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: bags,
      dosageSchedule: dosage.dap,
      lineTotal: bags * FERTILIZER_CATALOG.dap.mrp,
      lineSubsidySaved: bags * FERTILIZER_CATALOG.dap.subsidySaved
    });
  }

  // 3. MOP Potash
  if (dosage.mop) {
    const kgPerAcre = extractKg(dosage.mop) || 20;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const bags = Math.max(1, Math.round(totalKg / FERTILIZER_CATALOG.mop.bagWeightKg));
    items.push({
      catalogKey: 'mop',
      ...FERTILIZER_CATALOG.mop,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: bags,
      dosageSchedule: dosage.mop,
      lineTotal: bags * FERTILIZER_CATALOG.mop.mrp,
      lineSubsidySaved: bags * FERTILIZER_CATALOG.mop.subsidySaved
    });
  }

  // 4. Single Super Phosphate (SSP) if specified
  if (dosage.ssp) {
    const kgPerAcre = extractKg(dosage.ssp) || 75;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const bags = Math.max(1, Math.round(totalKg / FERTILIZER_CATALOG.ssp.bagWeightKg));
    items.push({
      catalogKey: 'ssp',
      ...FERTILIZER_CATALOG.ssp,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: bags,
      dosageSchedule: dosage.ssp,
      lineTotal: bags * FERTILIZER_CATALOG.ssp.mrp,
      lineSubsidySaved: bags * FERTILIZER_CATALOG.ssp.subsidySaved
    });
  }

  // 5. Zinc Sulphate
  if (dosage.zincSulphate) {
    const kgPerAcre = extractKg(dosage.zincSulphate) || 10;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const bags = Math.max(1, Math.round(totalKg / FERTILIZER_CATALOG.zinc_sulphate.bagWeightKg));
    items.push({
      catalogKey: 'zinc_sulphate',
      ...FERTILIZER_CATALOG.zinc_sulphate,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: bags,
      dosageSchedule: dosage.zincSulphate,
      lineTotal: bags * FERTILIZER_CATALOG.zinc_sulphate.mrp,
      lineSubsidySaved: bags * FERTILIZER_CATALOG.zinc_sulphate.subsidySaved
    });
  }

  // 6. Borax (for oilseeds / pulses)
  if (dosage.borax || crop.id === 'mustard' || crop.id === 'chilli') {
    const kgPerAcre = extractKg(dosage.borax) || 1.0;
    const totalKg = +(kgPerAcre * area).toFixed(1);
    const pouches = Math.max(1, Math.round(totalKg));
    items.push({
      catalogKey: 'borax',
      ...FERTILIZER_CATALOG.borax,
      recommendedKgPerAcre: kgPerAcre,
      totalKgNeeded: totalKg,
      recommendedBags: pouches,
      dosageSchedule: 'Foliar spray @ 1g/L at flowering',
      lineTotal: pouches * FERTILIZER_CATALOG.borax.mrp,
      lineSubsidySaved: pouches * FERTILIZER_CATALOG.borax.subsidySaved
    });
  }

  return items;
}

/**
 * Shopping Cart Management Service with localStorage Persistence
 */
const CART_STORAGE_KEY = 'agrisense_fertilizer_cart_v1';
const ORDERS_STORAGE_KEY = 'agrisense_fertilizer_orders_v1';

// In-memory fallback for non-browser / SSR / Node.js test environments
const memoryStorage = {};

const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryStorage[key] || null;
  },
  setItem: (key, val) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, val);
        return;
      }
    } catch {}
    memoryStorage[key] = val;
  }
};

class FertilizerStoreService {
  constructor() {
    this.listeners = [];
  }

  getCart() {
    try {
      const raw = safeStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveCart(cart) {
    try {
      safeStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      this.notify(cart);
    } catch (e) {
      console.error('Failed to save fertilizer cart:', e);
    }
  }

  addToCart(item, quantity = 1, cropContext = null) {
    const cart = this.getCart();
    const itemId = item.catalogKey || item.id;
    const existingIndex = cart.findIndex((i) => i.id === itemId);

    const safeQty = Math.max(1, Number(quantity) || 1);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += safeQty;
      cart[existingIndex].cropName = cropContext?.name || cart[existingIndex].cropName || 'General Farm';
    } else {
      cart.push({
        id: itemId,
        name: item.name,
        brand: item.brand,
        bagWeightKg: item.bagWeightKg,
        mrp: item.mrp,
        originalPrice: item.originalPrice,
        subsidySaved: item.subsidySaved,
        quantity: safeQty,
        cropName: cropContext?.name || 'General Farm',
        cropId: cropContext?.id || null,
        addedAt: new Date().toISOString()
      });
    }

    this.saveCart(cart);
    return cart;
  }

  addAllToCart(itemsList, cropContext = null) {
    let cart = this.getCart();
    itemsList.forEach((item) => {
      const itemId = item.catalogKey || item.id;
      const existingIndex = cart.findIndex((i) => i.id === itemId);
      const qty = Math.max(1, Number(item.recommendedBags) || 1);

      if (existingIndex >= 0) {
        cart[existingIndex].quantity += qty;
        cart[existingIndex].cropName = cropContext?.name || cart[existingIndex].cropName;
      } else {
        cart.push({
          id: itemId,
          name: item.name,
          brand: item.brand,
          bagWeightKg: item.bagWeightKg,
          mrp: item.mrp,
          originalPrice: item.originalPrice,
          subsidySaved: item.subsidySaved,
          quantity: qty,
          cropName: cropContext?.name || 'General Farm',
          cropId: cropContext?.id || null,
          addedAt: new Date().toISOString()
        });
      }
    });

    this.saveCart(cart);
    return cart;
  }

  updateQuantity(itemId, quantity) {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter((i) => i.id !== itemId);
    } else {
      const idx = cart.findIndex((i) => i.id === itemId);
      if (idx >= 0) {
        cart[idx].quantity = quantity;
      }
    }
    this.saveCart(cart);
    return cart;
  }

  removeFromCart(itemId) {
    const cart = this.getCart().filter((i) => i.id !== itemId);
    this.saveCart(cart);
    return cart;
  }

  clearCart() {
    this.saveCart([]);
    return [];
  }

  getCartTotals() {
    const cart = this.getCart();
    const totalBags = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const totalSubsidySaved = cart.reduce((sum, item) => sum + (item.subsidySaved * item.quantity), 0);
    const marketValue = subtotal + totalSubsidySaved;
    const deliveryFee = subtotal > 400 ? 0 : 50; // Free delivery for orders above ₹400
    const grandTotal = subtotal + deliveryFee;

    return {
      itemCount: cart.length,
      totalBags,
      subtotal: +subtotal.toFixed(2),
      totalSubsidySaved: +totalSubsidySaved.toFixed(2),
      marketValue: +marketValue.toFixed(2),
      deliveryFee,
      grandTotal: +grandTotal.toFixed(2)
    };
  }

  createOrder({ farmerName, phone, village, mandal, district, state, paymentMode = 'kisan_cod' }) {
    const cart = this.getCart();
    if (cart.length === 0) return null;

    const totals = this.getCartTotals();
    const orderId = `AGRI-DBT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const orderRecord = {
      orderId,
      timestamp: new Date().toISOString(),
      farmer: {
        name: farmerName || 'Registered Farmer',
        phone: phone || '+91 98765 43210',
        location: `${village || 'Main Village'}, ${mandal || 'Mandal'}, ${district || 'District'}, ${state || 'State'}`
      },
      items: cart,
      totals,
      paymentMode,
      status: 'BOOKED_AT_KISAN_KENDRA',
      estimatedDelivery: new Date(Date.now() + 48 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    };

    try {
      const rawOrders = safeStorage.getItem(ORDERS_STORAGE_KEY);
      const orders = rawOrders ? JSON.parse(rawOrders) : [];
      orders.unshift(orderRecord);
      safeStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('Failed to save order record:', e);
    }

    // Clear cart upon successful checkout
    this.clearCart();
    return orderRecord;
  }

  generateWhatsAppOrderUrl(order) {
    if (!order) return '';
    const itemsText = order.items
      .map((it) => `• ${it.name} - ${it.quantity} bags (₹${(it.mrp * it.quantity).toFixed(0)})`)
      .join('\n');

    const msg = `*AgriSense Kisan Fertilizer Booking*\n` +
      `*Order ID:* ${order.orderId}\n` +
      `*Farmer:* ${order.farmer.name} (${order.farmer.phone})\n` +
      `*Delivery Address:* ${order.farmer.location}\n\n` +
      `*Required Fertilizers:*\n${itemsText}\n\n` +
      `*Total Bags:* ${order.totals.totalBags} bags\n` +
      `*Subsidized Payable:* ₹${order.totals.grandTotal.toLocaleString()}\n` +
      `*Govt Subsidy Saved:* ₹${order.totals.totalSubsidySaved.toLocaleString()}\n` +
      `*Payment:* ${order.paymentMode.toUpperCase()}\n\n` +
      `Please dispatch to the registered field address. Thank you!`;

    return `https://wa.me/919876543210?text=${encodeURIComponent(msg)}`;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(cart) {
    this.listeners.forEach((listener) => {
      try {
        listener(cart);
      } catch (e) {
        console.error('Error in cart listener:', e);
      }
    });
  }
}

export const fertilizerStoreService = new FertilizerStoreService();
export default fertilizerStoreService;
