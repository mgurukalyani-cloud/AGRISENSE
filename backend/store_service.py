"""
AgriSense Agricultural E-Commerce Business Logic Service
Handles product filtering, cart management, checkout calculations, atomic inventory deductions,
payment verification, delivery tracking, and administrative analytics.
"""

import json
import uuid
import datetime
from typing import List, Dict, Any, Optional

try:
    from backend.store_db import get_db_connection
    from backend.payment_service import (
        create_gateway_order,
        verify_payment_signature,
        create_test_payment_signature,
        PAYMENT_TIMEOUT_SECONDS
    )
except ImportError:
    from store_db import get_db_connection
    from payment_service import (
        create_gateway_order,
        verify_payment_signature,
        create_test_payment_signature,
        PAYMENT_TIMEOUT_SECONDS
    )


# -------------------------------------------------------------
# 1. Product Catalog Services
# -------------------------------------------------------------
def get_categories() -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM categories ORDER BY display_order ASC")
        return [dict(row) for row in cursor.fetchall()]


def get_products(
    category_slug: Optional[str] = None,
    search: Optional[str] = None,
    crop: Optional[str] = None,
    sort_by: Optional[str] = "popular",
    only_in_stock: bool = False
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = """
        SELECT p.*, c.slug AS category_slug, c.name AS category_display_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        """
        params = []

        if category_slug and category_slug != "all":
            query += " AND c.slug = ?"
            params.append(category_slug)

        if search:
            query += " AND (p.name LIKE ? OR p.name_te LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)"
            term = f"%{search.strip()}%"
            params.extend([term, term, term, term])

        if crop:
            query += " AND (p.suitable_crops LIKE ? OR p.suitable_crops LIKE '%All%')"
            params.append(f"%{crop.strip()}%")

        if only_in_stock:
            query += " AND p.stock_quantity > 0"

        if sort_by == "price_asc":
            query += " ORDER BY p.mrp ASC"
        elif sort_by == "price_desc":
            query += " ORDER BY p.mrp DESC"
        elif sort_by == "name":
            query += " ORDER BY p.name ASC"
        else:
            query += " ORDER BY p.stock_quantity DESC, p.mrp ASC"

        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


def get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT p.*, c.slug AS category_slug, c.name AS category_display_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
        """, (product_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


# -------------------------------------------------------------
# 2. Shopping Cart Management
# -------------------------------------------------------------
def get_or_create_user_cart(user_id: str = "user_farmer_01") -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart_row = cursor.fetchone()
        if not cart_row:
            cart_id = f"cart_{uuid.uuid4().hex[:12]}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("INSERT INTO carts (id, user_id, updated_at) VALUES (?, ?, ?)", (cart_id, user_id, now))
            conn.commit()
        else:
            cart_id = cart_row["id"]

        # Fetch cart items with live product inventory and pricing
        cursor.execute("""
        SELECT ci.id AS item_id, ci.quantity, p.*
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at ASC
        """, (cart_id,))
        items = [dict(r) for r in cursor.fetchall()]

        # Compute totals
        subtotal = sum(i["mrp"] * i["quantity"] for i in items)
        subsidy_saved = sum(i["subsidy_saved"] * i["quantity"] for i in items)
        total_items = sum(i["quantity"] for i in items)
        
        # Calculate itemized GST
        gst_5_tax = sum((i["mrp"] * i["quantity"] * 0.05 / 1.05) for i in items if i["gst_rate"] == 5.0)
        gst_18_tax = sum((i["mrp"] * i["quantity"] * 0.18 / 1.18) for i in items if i["gst_rate"] == 18.0)
        total_tax = round(gst_5_tax + gst_18_tax, 2)

        # Free delivery for orders above ₹1,000, else ₹80 standard agricultural freight
        delivery_fee = 0.0 if (subtotal >= 1000.0 or subtotal == 0) else 80.0

        return {
            "cart_id": cart_id,
            "user_id": user_id,
            "items": items,
            "total_items": total_items,
            "subtotal": round(subtotal, 2),
            "gst_breakdown": {
                "gst_5_pct": round(gst_5_tax, 2),
                "gst_18_pct": round(gst_18_tax, 2),
                "total_tax": total_tax
            },
            "delivery_fee": delivery_fee,
            "subsidy_saved": round(subsidy_saved, 2),
            "grand_total": round(subtotal + delivery_fee, 2)
        }


def add_to_cart(user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check product stock
        cursor.execute("SELECT id, stock_quantity, mrp FROM products WHERE id = ?", (product_id,))
        prod = cursor.fetchone()
        if not prod:
            return {"success": False, "error": "PRODUCT_NOT_FOUND", "message": "Product does not exist"}

        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart_row = cursor.fetchone()
        if not cart_row:
            cart_id = f"cart_{uuid.uuid4().hex[:12]}"
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            cursor.execute("INSERT INTO carts (id, user_id, updated_at) VALUES (?, ?, ?)", (cart_id, user_id, now))
        else:
            cart_id = cart_row["id"]

        # Check existing quantity in cart
        cursor.execute("SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?", (cart_id, product_id))
        existing_item = cursor.fetchone()
        
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if existing_item:
            new_qty = existing_item["quantity"] + quantity
            if new_qty > prod["stock_quantity"]:
                return {
                    "success": False,
                    "error": "INSUFFICIENT_STOCK",
                    "message": f"Only {prod['stock_quantity']} units available in stock."
                }
            cursor.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_qty, existing_item["id"]))
        else:
            if quantity > prod["stock_quantity"]:
                return {
                    "success": False,
                    "error": "INSUFFICIENT_STOCK",
                    "message": f"Only {prod['stock_quantity']} units available in stock."
                }
            item_id = f"item_{uuid.uuid4().hex[:12]}"
            cursor.execute("""
            INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (item_id, cart_id, product_id, quantity, now))

        cursor.execute("UPDATE carts SET updated_at = ? WHERE id = ?", (now, cart_id))
        conn.commit()

    return get_or_create_user_cart(user_id)


def update_cart_item_quantity(user_id: str, product_id: str, quantity: int) -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart = cursor.fetchone()
        if not cart:
            return get_or_create_user_cart(user_id)

        cart_id = cart["id"]

        if quantity <= 0:
            cursor.execute("DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?", (cart_id, product_id))
        else:
            cursor.execute("SELECT stock_quantity FROM products WHERE id = ?", (product_id,))
            prod = cursor.fetchone()
            if prod and quantity > prod["stock_quantity"]:
                return {
                    "success": False,
                    "error": "INSUFFICIENT_STOCK",
                    "message": f"Requested quantity exceeds available inventory ({prod['stock_quantity']} units)."
                }
            cursor.execute("UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?", (quantity, cart_id, product_id))

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("UPDATE carts SET updated_at = ? WHERE id = ?", (now, cart_id))
        conn.commit()

    return get_or_create_user_cart(user_id)


def remove_from_cart(user_id: str, product_id: str) -> Dict[str, Any]:
    return update_cart_item_quantity(user_id, product_id, 0)


def clear_cart(user_id: str) -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart = cursor.fetchone()
        if cart:
            cursor.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart["id"],))
            conn.commit()
    return get_or_create_user_cart(user_id)


# -------------------------------------------------------------
# 3. Checkout, Billing & Atomic Inventory Deduction
# -------------------------------------------------------------
async def create_checkout_order(
    user_id: str,
    delivery_address: Dict[str, Any],
    coupon_code: Optional[str] = None,
    delivery_instructions: Optional[str] = None
) -> Dict[str, Any]:
    """
    Executes ACID transaction to:
    1. Lock and validate inventory for each cart item.
    2. Compute exact invoice: subtotal, taxes, delivery, coupon discount, grand total.
    3. Atomically decrement stock_quantity.
    4. Insert order and order_items records.
    5. Generate real Razorpay / UPI QR payment request.
    6. Record initial audit status.
    """
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    now_iso = now_dt.isoformat()
    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order_number = f"AGRI-{now_dt.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Fetch cart
        cursor.execute("SELECT id FROM carts WHERE user_id = ?", (user_id,))
        cart = cursor.fetchone()
        if not cart:
            return {"success": False, "error": "EMPTY_CART", "message": "Shopping cart is empty"}

        cursor.execute("""
        SELECT ci.quantity, p.*
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        """, (cart["id"],))
        items = [dict(r) for r in cursor.fetchall()]

        if not items:
            return {"success": False, "error": "EMPTY_CART", "message": "No items in cart to checkout"}

        # Validate inventory
        for item in items:
            if item["quantity"] > item["stock_quantity"]:
                return {
                    "success": False,
                    "error": "INSUFFICIENT_STOCK",
                    "message": f"Item '{item['name']}' has only {item['stock_quantity']} units in stock (requested {item['quantity']})."
                }

        # Calculate totals
        subtotal = sum(i["mrp"] * i["quantity"] for i in items)
        subsidy_saved = sum(i["subsidy_saved"] * i["quantity"] for i in items)
        gst_5_tax = sum((i["mrp"] * i["quantity"] * 0.05 / 1.05) for i in items if i["gst_rate"] == 5.0)
        gst_18_tax = sum((i["mrp"] * i["quantity"] * 0.18 / 1.18) for i in items if i["gst_rate"] == 18.0)
        tax_total = round(gst_5_tax + gst_18_tax, 2)
        delivery_fee = 0.0 if subtotal >= 1000.0 else 80.0

        # Apply coupon if valid
        discount_total = 0.0
        applied_coupon = None
        if coupon_code:
            clean_code = coupon_code.strip().upper()
            cursor.execute("SELECT * FROM coupons WHERE code = ? AND is_active = 1", (clean_code,))
            coupon_row = cursor.fetchone()
            if coupon_row:
                c = dict(coupon_row)
                if subtotal >= c["min_order_amount"]:
                    if c["discount_type"] == "FIXED":
                        discount_total = min(c["discount_value"], subtotal)
                    elif c["discount_type"] == "PERCENT":
                        pct_discount = (subtotal * c["discount_value"]) / 100.0
                        discount_total = min(pct_discount, c.get("max_discount_amount", 500.0))
                    applied_coupon = clean_code

        grand_total = max(1.0, round(subtotal + delivery_fee - discount_total, 2))

        # Estimated delivery date: 2 business days from order
        est_delivery_dt = now_dt + datetime.timedelta(days=2, hours=4)
        estimated_delivery = est_delivery_dt.isoformat()

        # Atomically deduct inventory
        for item in items:
            new_stock = item["stock_quantity"] - item["quantity"]
            cursor.execute("UPDATE products SET stock_quantity = ? WHERE id = ?", (new_stock, item["id"]))

        # Insert Order
        cursor.execute("""
        INSERT INTO orders (
            id, order_number, user_id, subtotal, tax_total, delivery_fee, discount_total,
            grand_total, subsidy_saved_total, payment_status, order_status,
            delivery_address_json, delivery_instructions, estimated_delivery, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING_PAYMENT', ?, ?, ?, ?, ?)
        """, (
            order_id, order_number, user_id, subtotal, tax_total, delivery_fee, discount_total,
            grand_total, subsidy_saved, json.dumps(delivery_address), delivery_instructions or "",
            estimated_delivery, now_iso, now_iso
        ))

        # Insert Order Items
        for item in items:
            item_line_subtotal = item["mrp"] * item["quantity"]
            item_tax = (item_line_subtotal * (item["gst_rate"] / (100.0 + item["gst_rate"])))
            cursor.execute("""
            INSERT INTO order_items (
                id, order_id, product_id, product_name, brand, pack_size, pack_unit,
                unit_price, quantity, line_subtotal, gst_rate, tax_amount, subsidy_saved
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"oi_{uuid.uuid4().hex[:12]}", order_id, item["id"], item["name"], item["brand"],
                item["pack_size"], item["pack_unit"], item["mrp"], item["quantity"],
                item_line_subtotal, item["gst_rate"], round(item_tax, 2), item["subsidy_saved"] * item["quantity"]
            ))

        # Record Initial Status History
        cursor.execute("""
        INSERT INTO order_status_history (id, order_id, status, comment, created_by, created_at)
        VALUES (?, ?, 'PENDING_PAYMENT', 'Order created awaiting UPI/QR payment confirmation', 'CUSTOMER', ?)
        """, (f"osh_{uuid.uuid4().hex[:12]}", order_id, now_iso))

        # Clear cart items since order has been created
        cursor.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart["id"],))

        conn.commit()

    # Generate Payment Gateway / QR Order
    customer_info = {
        "full_name": delivery_address.get("full_name", "Kisan Farmer"),
        "phone": delivery_address.get("phone", "9848022338"),
        "village": delivery_address.get("village", "Appannapet")
    }
    payment_res = await create_gateway_order(order_number, grand_total, customer_info)

    # Store Payment Record
    with get_db_connection() as conn:
        cursor = conn.cursor()
        payment_id = f"pay_{uuid.uuid4().hex[:12]}"
        cursor.execute("""
        INSERT INTO payments (
            id, order_id, gateway, gateway_order_id, amount, currency, upi_qr_payload, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'INR', ?, 'PENDING', ?)
        """, (
            payment_id, order_id, payment_res.get("gateway", "RAZORPAY_TEST"),
            payment_res.get("gateway_order_id"), grand_total,
            payment_res.get("upi_intent", ""), now_iso
        ))
        conn.commit()

    return {
        "success": True,
        "order_id": order_id,
        "order_number": order_number,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "delivery_fee": delivery_fee,
        "discount_total": discount_total,
        "applied_coupon": applied_coupon,
        "grand_total": grand_total,
        "subsidy_saved": subsidy_saved,
        "estimated_delivery": estimated_delivery,
        "payment": {
            "payment_id": payment_id,
            "gateway_order_id": payment_res.get("gateway_order_id"),
            "upi_intent": payment_res.get("upi_intent"),
            "qr_svg": payment_res.get("qr_svg"),
            "expires_at": payment_res.get("expires_at"),
            "supported_apps": payment_res.get("supported_apps", [])
        }
    }


# -------------------------------------------------------------
# 4. Payment Verification & Order Confirmation
# -------------------------------------------------------------
def confirm_order_payment(
    order_id: str,
    gateway_order_id: str,
    gateway_payment_id: str,
    gateway_signature: str
) -> Dict[str, Any]:
    """
    Verifies cryptographic signature. If verified:
    - Sets payment status to SUCCESS.
    - Sets order status to CONFIRMED.
    - Creates delivery tracking record.
    - Appends audit log.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    # Cryptographic Verification
    is_valid = verify_payment_signature(gateway_order_id, gateway_payment_id, gateway_signature)
    if not is_valid:
        return {
            "success": False,
            "error": "SIGNATURE_VERIFICATION_FAILED",
            "message": "Payment signature verification failed. Untrusted transaction rejected."
        }

    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Check order
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            return {"success": False, "error": "ORDER_NOT_FOUND", "message": "Order not found"}

        # Prevent duplicate payment confirmation
        if order["payment_status"] == "SUCCESS":
            return {
                "success": True,
                "message": "Payment already confirmed and verified.",
                "order_id": order_id,
                "order_number": order["order_number"],
                "status": order["order_status"]
            }

        # Update Payment record
        cursor.execute("""
        UPDATE payments
        SET status = 'SUCCESS',
            gateway_payment_id = ?,
            gateway_signature = ?,
            paid_at = ?
        WHERE order_id = ?
        """, (gateway_payment_id, gateway_signature, now_iso, order_id))

        # Update Order record
        cursor.execute("""
        UPDATE orders
        SET payment_status = 'SUCCESS',
            order_status = 'CONFIRMED',
            updated_at = ?
        WHERE id = ?
        """, (now_iso, order_id))

        # Create Initial Delivery Tracking Record
        delivery_id = f"del_{uuid.uuid4().hex[:12]}"
        awb_no = f"AGRI-EXPR-{datetime.datetime.now().strftime('%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        cursor.execute("""
        INSERT INTO deliveries (
            id, order_id, partner_name, partner_phone, hub_location, carrier_awb,
            status, updated_at
        ) VALUES (?, ?, 'Kisan Express Logistics (IFFCO Depot)', '+91 98480 33445', 'Dharmaram Central Mandi Hub', ?, 'CONFIRMED', ?)
        """, (delivery_id, order_id, awb_no, now_iso))

        # Record Audit History
        cursor.execute("""
        INSERT INTO order_status_history (id, order_id, status, comment, created_by, created_at)
        VALUES (?, ?, 'CONFIRMED', 'Payment verified successfully via UPI/Gateway. Order confirmed for dispatch.', 'PAYMENT_GATEWAY', ?)
        """, (f"osh_{uuid.uuid4().hex[:12]}", order_id, now_iso))

        conn.commit()

    return {
        "success": True,
        "message": "Payment verified and order confirmed successfully!",
        "order_id": order_id,
        "order_number": order["order_number"],
        "payment_status": "SUCCESS",
        "order_status": "CONFIRMED",
        "tracking_awb": awb_no
    }


def simulate_sandbox_payment(order_id: str, outcome: str = "SUCCESS") -> Dict[str, Any]:
    """
    Simulates payment completion or failure in sandbox test mode with authentic HMAC signatures.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE order_id = ?", (order_id,))
        payment = cursor.fetchone()
        if not payment:
            return {"success": False, "error": "PAYMENT_RECORD_NOT_FOUND"}

        gateway_order_id = payment["gateway_order_id"]

    if outcome == "SUCCESS":
        payment_id = f"pay_test_{uuid.uuid4().hex[:14]}"
        sig = create_test_payment_signature(gateway_order_id, payment_id)
        return confirm_order_payment(order_id, gateway_order_id, payment_id, sig)
    else:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE payments SET status = 'FAILED' WHERE order_id = ?", (order_id,))
            cursor.execute("UPDATE orders SET payment_status = 'FAILED', updated_at = ? WHERE id = ?", (now_iso, order_id))
            cursor.execute("""
            INSERT INTO order_status_history (id, order_id, status, comment, created_by, created_at)
            VALUES (?, ?, 'PAYMENT_FAILED', 'Customer cancelled or bank authorization declined in UPI gateway', 'BANK_GATEWAY', ?)
            """, (f"osh_{uuid.uuid4().hex[:12]}", order_id, now_iso))
            conn.commit()
        return {"success": False, "error": "PAYMENT_FAILED", "message": "Payment declined by UPI authorization bank."}


# -------------------------------------------------------------
# 5. Order Management, Tracking & Status Transitions
# -------------------------------------------------------------
def get_order_details(order_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ? OR order_number = ?", (order_id, order_id))
        order_row = cursor.fetchone()
        if not order_row:
            return None

        order = dict(order_row)
        order["delivery_address"] = json.loads(order["delivery_address_json"])

        # Items
        cursor.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],))
        order["items"] = [dict(r) for r in cursor.fetchall()]

        # Payment
        cursor.execute("SELECT * FROM payments WHERE order_id = ?", (order["id"],))
        pay_row = cursor.fetchone()
        order["payment"] = dict(pay_row) if pay_row else None

        # Delivery
        cursor.execute("SELECT * FROM deliveries WHERE order_id = ?", (order["id"],))
        del_row = cursor.fetchone()
        order["delivery"] = dict(del_row) if del_row else None

        # Status History
        cursor.execute("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC", (order["id"],))
        order["status_history"] = [dict(r) for r in cursor.fetchall()]

        return order


def get_user_orders(user_id: str = "user_farmer_01", limit: int = 50) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
        SELECT * FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
        """, (user_id, limit))
        rows = cursor.fetchall()
        orders = []
        for r in rows:
            ord_dict = dict(r)
            ord_dict["delivery_address"] = json.loads(ord_dict["delivery_address_json"])
            cursor.execute("SELECT COUNT(*) as item_count, SUM(quantity) as total_units FROM order_items WHERE order_id = ?", (ord_dict["id"],))
            cnt_row = cursor.fetchone()
            ord_dict["item_count"] = cnt_row["item_count"]
            ord_dict["total_units"] = cnt_row["total_units"]
            orders.append(ord_dict)
        return orders


def get_all_orders_admin(
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM orders WHERE 1=1"
        params = []

        if status and status != "ALL":
            query += " AND order_status = ?"
            params.append(status)

        if payment_status and payment_status != "ALL":
            query += " AND payment_status = ?"
            params.append(payment_status)

        if search:
            query += " AND (order_number LIKE ? OR delivery_address_json LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        orders = []
        for r in cursor.fetchall():
            o = dict(r)
            o["delivery_address"] = json.loads(o["delivery_address_json"])
            orders.append(o)
        return orders


def update_order_status(
    order_id: str,
    new_status: str,
    comment: Optional[str] = None,
    updated_by: str = "ADMIN"
) -> Dict[str, Any]:
    """
    Valid transitions:
    CONFIRMED -> PROCESSING -> PACKED -> DISPATCHED -> OUT_FOR_DELIVERY -> DELIVERED
    or CANCELLED (restores stock inventory if cancelled before dispatch).
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    valid_statuses = [
        "PENDING_PAYMENT", "CONFIRMED", "PROCESSING", "PACKED",
        "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"
    ]
    if new_status not in valid_statuses:
        return {"success": False, "error": "INVALID_STATUS", "message": f"Status '{new_status}' is invalid."}

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?", (order_id,))
        order = cursor.fetchone()
        if not order:
            return {"success": False, "error": "ORDER_NOT_FOUND"}

        # If transitioning to CANCELLED, restore inventory
        if new_status == "CANCELLED" and order["order_status"] not in ("CANCELLED", "DELIVERED"):
            cursor.execute("SELECT product_id, quantity FROM order_items WHERE order_id = ?", (order_id,))
            items = cursor.fetchall()
            for it in items:
                cursor.execute("UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?", (it["quantity"], it["product_id"]))

        # Update deliveries table timestamp if applicable
        if new_status == "DISPATCHED":
            cursor.execute("UPDATE deliveries SET status = 'DISPATCHED', dispatched_at = ?, updated_at = ? WHERE order_id = ?", (now_iso, now_iso, order_id))
        elif new_status == "OUT_FOR_DELIVERY":
            cursor.execute("UPDATE deliveries SET status = 'OUT_FOR_DELIVERY', out_for_delivery_at = ?, updated_at = ? WHERE order_id = ?", (now_iso, now_iso, order_id))
        elif new_status == "DELIVERED":
            cursor.execute("UPDATE deliveries SET status = 'DELIVERED', delivered_at = ?, updated_at = ? WHERE order_id = ?", (now_iso, now_iso, order_id))
            cursor.execute("UPDATE orders SET delivered_at = ? WHERE id = ?", (now_iso, order_id))

        cursor.execute("UPDATE orders SET order_status = ?, updated_at = ? WHERE id = ?", (new_status, now_iso, order_id))

        # Record Audit
        cursor.execute("""
        INSERT INTO order_status_history (id, order_id, status, comment, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (f"osh_{uuid.uuid4().hex[:12]}", order_id, new_status, comment or f"Status changed to {new_status}", updated_by, now_iso))

        conn.commit()

    return {"success": True, "order_id": order_id, "new_status": new_status, "updated_at": now_iso}


# -------------------------------------------------------------
# 6. Admin Business Analytics
# -------------------------------------------------------------
def get_admin_business_analytics() -> Dict[str, Any]:
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # Revenue and payment stats from verified transactions
        cursor.execute("""
        SELECT 
            COUNT(*) AS total_orders,
            SUM(CASE WHEN payment_status = 'SUCCESS' THEN grand_total ELSE 0 END) AS total_revenue,
            SUM(CASE WHEN payment_status = 'SUCCESS' THEN subsidy_saved_total ELSE 0 END) AS total_subsidy_saved,
            SUM(CASE WHEN payment_status = 'SUCCESS' THEN 1 ELSE 0 END) AS paid_orders,
            SUM(CASE WHEN payment_status = 'PENDING' THEN 1 ELSE 0 END) AS pending_payment_orders,
            SUM(CASE WHEN order_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders,
            SUM(CASE WHEN order_status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders
        FROM orders
        """)
        summary = dict(cursor.fetchone())

        # Category sales volume
        cursor.execute("""
        SELECT p.category_name, SUM(oi.quantity) as units_sold, SUM(oi.line_subtotal) as category_revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'SUCCESS'
        GROUP BY p.category_name
        ORDER BY category_revenue DESC
        """)
        category_sales = [dict(r) for r in cursor.fetchall()]

        # Low Stock warnings (< 20 units)
        cursor.execute("""
        SELECT id, name, brand, stock_quantity, mrp, category_name
        FROM products
        WHERE stock_quantity < 50
        ORDER BY stock_quantity ASC
        """)
        low_stock_items = [dict(r) for r in cursor.fetchall()]

        return {
            "summary": {
                "total_orders": summary["total_orders"] or 0,
                "total_revenue": round(summary["total_revenue"] or 0.0, 2),
                "total_subsidy_saved": round(summary["total_subsidy_saved"] or 0.0, 2),
                "paid_orders": summary["paid_orders"] or 0,
                "pending_payment_orders": summary["pending_payment_orders"] or 0,
                "cancelled_orders": summary["cancelled_orders"] or 0,
                "delivered_orders": summary["delivered_orders"] or 0
            },
            "category_sales": category_sales,
            "low_stock_warnings": low_stock_items
        }
