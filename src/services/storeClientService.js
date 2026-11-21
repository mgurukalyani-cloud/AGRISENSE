/**
 * AgriSense Agricultural Store Client Service
 * Connects frontend React components to backend FastAPI store endpoints
 * with transparent offline fallback and persistent state.
 */

const API_BASE_URL = 'http://localhost:8000';

class StoreClientService {
  constructor() {
    this.userId = 'user_farmer_01';
    this.cartListeners = new Set();
    this.orderListeners = new Set();
  }

  // --- Subscriptions ---
  subscribeCart(callback) {
    this.cartListeners.add(callback);
    return () => this.cartListeners.delete(callback);
  }

  notifyCart(cart) {
    this.cartListeners.forEach(cb => {
      try { cb(cart); } catch (e) { console.error('Cart listener error:', e); }
    });
  }

  // --- 1. Product Catalog ---
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/categories`);
      if (res.ok) {
        const data = await res.json();
        return data.categories || [];
      }
    } catch (e) {
      console.warn('Backend store unreachable, using cached categories:', e.message);
    }
    return [
      { id: 'cat_fertilizer', name: 'Chemical Fertilizers', name_te: 'రసాయన ఎరువులు', slug: 'fertilizers', icon: 'Sprout' },
      { id: 'cat_organic', name: 'Organic Fertilizers', name_te: 'సేంద్రియ ఎరువులు', slug: 'organic-fertilizers', icon: 'Leaf' },
      { id: 'cat_micronutrient', name: 'Micronutrients', name_te: 'సూక్ష్మ పోషకాలు', slug: 'micronutrients', icon: 'Sparkles' },
      { id: 'cat_pesticide', name: 'Pesticides', name_te: 'పురుగు మరియు తెగులు మందులు', slug: 'pesticides', icon: 'ShieldAlert' },
      { id: 'cat_biopesticide', name: 'Bio-Pesticides', name_te: 'జీవ నియంత్రణ మందులు', slug: 'bio-pesticides', icon: 'Activity' },
      { id: 'cat_seed', name: 'Certified Seeds', name_te: 'ధృవీకరించిన విత్తనాలు', slug: 'seeds', icon: 'CheckCircle' },
      { id: 'cat_equipment', name: 'Agricultural Equipment', name_te: 'వ్యవసాయ పరికరాలు', slug: 'equipment', icon: 'Wrench' }
    ];
  }

  async getProducts(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.crop) query.set('crop', params.crop);
    if (params.sortBy) query.set('sort_by', params.sortBy);
    if (params.onlyInStock) query.set('only_in_stock', 'true');

    try {
      const res = await fetch(`${API_BASE_URL}/api/store/products?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.products || [];
      }
    } catch (e) {
      console.warn('Backend products fetch fallback:', e.message);
    }
    return [];
  }

  async getProductById(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/products/${productId}`);
      if (res.ok) {
        const data = await res.json();
        return data.product;
      }
    } catch (e) {
      console.warn('Backend product fetch fallback:', e.message);
    }
    return null;
  }

  // --- 2. Shopping Cart ---
  async getCart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/cart?user_id=${this.userId}`);
      if (res.ok) {
        const data = await res.json();
        const cart = data.cart;
        this.notifyCart(cart);
        return cart;
      }
    } catch (e) {
      console.warn('Backend cart fetch fallback:', e.message);
    }
    return {
      cart_id: 'local_cart',
      items: [],
      total_items: 0,
      subtotal: 0,
      delivery_fee: 0,
      subsidy_saved: 0,
      grand_total: 0
    };
  }

  async addToCart(productId, quantity = 1) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.userId, product_id: productId, quantity })
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyCart(data.cart);
        return { success: true, cart: data.cart };
      } else {
        const err = await res.json();
        return { success: false, message: err.detail || 'Could not add item to cart' };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async updateQuantity(productId, quantity) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/cart/item`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: this.userId, product_id: productId, quantity })
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyCart(data.cart);
        return { success: true, cart: data.cart };
      } else {
        const err = await res.json();
        return { success: false, message: err.detail };
      }
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async removeFromCart(productId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/cart/item/${productId}?user_id=${this.userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyCart(data.cart);
        return { success: true, cart: data.cart };
      }
    } catch (e) {
      console.warn('Remove from cart error:', e);
    }
    return this.getCart();
  }

  async clearCart() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/cart/clear?user_id=${this.userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const data = await res.json();
        this.notifyCart(data.cart);
        return { success: true, cart: data.cart };
      }
    } catch (e) {
      console.warn('Clear cart error:', e);
    }
    return this.getCart();
  }

  // --- 3. Checkout & Payment ---
  async checkout(deliveryAddress, couponCode = null, deliveryInstructions = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: this.userId,
          delivery_address: deliveryAddress,
          coupon_code: couponCode,
          delivery_instructions: deliveryInstructions
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh cart (which is now empty)
        this.getCart();
        return data;
      }
      return { success: false, message: data.detail || data.message || 'Checkout failed' };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async confirmPayment(orderId, gatewayOrderId, gatewayPaymentId, gatewaySignature) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          gateway_order_id: gatewayOrderId,
          gateway_payment_id: gatewayPaymentId,
          gateway_signature: gatewaySignature
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async simulateSandboxPayment(orderId, outcome = 'SUCCESS') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/sandbox-simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, outcome })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  // --- 4. Orders & Tracking ---
  async getOrderDetails(orderId) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        return data.order;
      }
    } catch (e) {
      console.warn('Get order details error:', e);
    }
    return null;
  }

  async getUserOrders() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/orders/user/${this.userId}`);
      if (res.ok) {
        const data = await res.json();
        return data.orders || [];
      }
    } catch (e) {
      console.warn('Get user orders error:', e);
    }
    return [];
  }

  // --- 5. Admin & Management ---
  async getAdminOrders(status = 'ALL', paymentStatus = 'ALL', search = '') {
    const query = new URLSearchParams({ status, payment_status: paymentStatus });
    if (search) query.set('search', search);

    try {
      const res = await fetch(`${API_BASE_URL}/api/store/admin/orders?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        return data.orders || [];
      }
    } catch (e) {
      console.warn('Get admin orders error:', e);
    }
    return [];
  }

  async updateOrderStatus(orderId, newStatus, comment = '', updatedBy = 'ADMIN') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_status: newStatus, comment, updated_by: updatedBy })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: e.message };
    }
  }

  async getAdminAnalytics() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/store/admin/analytics`);
      if (res.ok) {
        const data = await res.json();
        return data.analytics;
      }
    } catch (e) {
      console.warn('Get admin analytics error:', e);
    }
    return {
      summary: { total_orders: 0, total_revenue: 0, total_subsidy_saved: 0, paid_orders: 0 },
      category_sales: [],
      low_stock_warnings: []
    };
  }
}

export const storeClient = new StoreClientService();
