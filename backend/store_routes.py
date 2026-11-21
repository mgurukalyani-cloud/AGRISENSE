"""
AgriSense Store & Payment Gateway API Endpoints
Integrated into FastAPI backend server.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Body, Header, Request
from pydantic import BaseModel

try:
    from backend import store_service as svc
    from backend.payment_service import verify_webhook_signature
except ImportError:
    import store_service as svc
    from payment_service import verify_webhook_signature

store_router = APIRouter(prefix="/api/store", tags=["E-Commerce & Store"])
payment_router = APIRouter(prefix="/api/payments", tags=["Payment Gateway"])


# -------------------------------------------------------------
# Pydantic Schemas
# -------------------------------------------------------------
class AddToCartModel(BaseModel):
    user_id: Optional[str] = "user_farmer_01"
    product_id: str
    quantity: int = 1


class UpdateCartItemModel(BaseModel):
    user_id: Optional[str] = "user_farmer_01"
    product_id: str
    quantity: int


class DeliveryAddressModel(BaseModel):
    full_name: str
    phone: str
    village: str
    mandal: str
    district: str
    state: Optional[str] = "Telangana"
    pincode: str
    farm_landmark: Optional[str] = ""


class CheckoutOrderModel(BaseModel):
    user_id: Optional[str] = "user_farmer_01"
    delivery_address: DeliveryAddressModel
    coupon_code: Optional[str] = None
    delivery_instructions: Optional[str] = None


class PaymentConfirmModel(BaseModel):
    order_id: str
    gateway_order_id: str
    gateway_payment_id: str
    gateway_signature: str


class SandboxSimulatePaymentModel(BaseModel):
    order_id: str
    outcome: Optional[str] = "SUCCESS"  # 'SUCCESS' | 'FAILED'


class UpdateOrderStatusModel(BaseModel):
    new_status: str
    comment: Optional[str] = None
    updated_by: Optional[str] = "ADMIN"


class UpdateETAModel(BaseModel):
    extra_minutes: int
    reason: str
    updated_by: Optional[str] = "ADMIN"


class AssignPartnerModel(BaseModel):
    partner_name: str
    partner_phone: str
    vehicle_number: Optional[str] = None
    updated_by: Optional[str] = "ADMIN"


# -------------------------------------------------------------
# 1. Product Catalog Endpoints
# -------------------------------------------------------------
@store_router.get("/categories")
def list_categories():
    """Retrieve all agricultural product categories."""
    return {"success": True, "categories": svc.get_categories()}


@store_router.get("/products")
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    crop: Optional[str] = None,
    sort_by: Optional[str] = "popular",
    only_in_stock: bool = False
):
    """Filter and search verified agricultural products."""
    products = svc.get_products(
        category_slug=category,
        search=search,
        crop=crop,
        sort_by=sort_by,
        only_in_stock=only_in_stock
    )
    return {"success": True, "count": len(products), "products": products}


@store_router.get("/products/{product_id}")
def get_product(product_id: str):
    """Retrieve full product specification, CIBRC registration and agronomic instructions."""
    prod = svc.get_product_by_id(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "product": prod}


# -------------------------------------------------------------
# 2. Shopping Cart Endpoints
# -------------------------------------------------------------
@store_router.get("/cart")
def get_user_cart(user_id: Optional[str] = "user_farmer_01"):
    """Get active shopping cart with live stock check and GST breakdown."""
    cart = svc.get_or_create_user_cart(user_id)
    return {"success": True, "cart": cart}


@store_router.post("/cart/add")
def add_item_to_cart(payload: AddToCartModel):
    """Add product to cart with inventory validation."""
    result = svc.add_to_cart(payload.user_id, payload.product_id, payload.quantity)
    if isinstance(result, dict) and not result.get("success", True):
        raise HTTPException(status_code=400, detail=result.get("message", "Error adding item to cart"))
    return {"success": True, "cart": result}


@store_router.put("/cart/item")
def update_item_quantity(payload: UpdateCartItemModel):
    """Update quantity of an item in the shopping cart."""
    result = svc.update_cart_item_quantity(payload.user_id, payload.product_id, payload.quantity)
    if isinstance(result, dict) and not result.get("success", True):
        raise HTTPException(status_code=400, detail=result.get("message", "Error updating quantity"))
    return {"success": True, "cart": result}


@store_router.delete("/cart/item/{product_id}")
def remove_item(product_id: str, user_id: Optional[str] = "user_farmer_01"):
    """Remove item from cart."""
    cart = svc.remove_from_cart(user_id, product_id)
    return {"success": True, "cart": cart}


@store_router.delete("/cart/clear")
def clear_all(user_id: Optional[str] = "user_farmer_01"):
    """Empty all items from user's shopping cart."""
    cart = svc.clear_cart(user_id)
    return {"success": True, "cart": cart}


# -------------------------------------------------------------
# 3. Checkout & Order Creation
# -------------------------------------------------------------
@store_router.post("/checkout")
async def checkout_cart_order(payload: CheckoutOrderModel):
    """
    ACID transaction to validate inventory, create order, deduct stock,
    and generate Indian payment gateway QR code.
    """
    result = await svc.create_checkout_order(
        user_id=payload.user_id,
        delivery_address=payload.delivery_address.model_dump(),
        coupon_code=payload.coupon_code,
        delivery_instructions=payload.delivery_instructions
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Checkout failed"))
    return result


# -------------------------------------------------------------
# 4. Payment Gateway Verification & Webhooks
# -------------------------------------------------------------
@payment_router.post("/confirm")
def confirm_payment(payload: PaymentConfirmModel):
    """Verifies cryptographic HMAC signature and marks order CONFIRMED."""
    result = svc.confirm_order_payment(
        order_id=payload.order_id,
        gateway_order_id=payload.gateway_order_id,
        gateway_payment_id=payload.gateway_payment_id,
        gateway_signature=payload.gateway_signature
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Payment verification failed"))
    return result


@payment_router.post("/sandbox-simulate")
def simulate_sandbox_payment(payload: SandboxSimulatePaymentModel):
    """Allows instant testing of payment flows with authentic cryptographic HMAC signatures."""
    result = svc.simulate_sandbox_payment(payload.order_id, payload.outcome or "SUCCESS")
    return result


@payment_router.post("/webhook")
async def razorpay_webhook(request: Request, x_razorpay_signature: Optional[str] = Header(None)):
    """Official Razorpay webhook handler for payment.captured and payment.failed events."""
    body_bytes = await request.body()
    if x_razorpay_signature:
        is_valid = verify_webhook_signature(body_bytes, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    import json
    try:
        event = json.loads(body_bytes.decode('utf-8'))
        event_name = event.get("event")
        payload_data = event.get("payload", {})

        if event_name == "payment.captured":
            payment_entity = payload_data.get("payment", {}).get("entity", {})
            order_id_gateway = payment_entity.get("order_id")
            payment_id_gateway = payment_entity.get("id")
            # Lookup order by gateway order ID
            with svc.get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT order_id FROM payments WHERE gateway_order_id = ?", (order_id_gateway,))
                row = cursor.fetchone()
                if row:
                    svc.confirm_order_payment(
                        order_id=row["order_id"],
                        gateway_order_id=order_id_gateway,
                        gateway_payment_id=payment_id_gateway,
                        gateway_signature="webhook_verified_signature"
                    )
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# -------------------------------------------------------------
# 5. Orders, Delivery Tracking & History
# -------------------------------------------------------------
@store_router.get("/orders/{order_id}")
def get_order_tracking(order_id: str):
    """Retrieve complete invoice, delivery ETA, timeline, and audit history."""
    order = svc.get_order_details(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True, "order": order}


@store_router.get("/orders/user/{user_id}")
def get_farmer_orders(user_id: str, limit: int = 50):
    """Retrieve farmer's purchase and payment history."""
    orders = svc.get_user_orders(user_id, limit)
    return {"success": True, "count": len(orders), "orders": orders}


# -------------------------------------------------------------
# 6. Admin, Supplier & Delivery Management
# -------------------------------------------------------------
@store_router.get("/admin/orders")
def get_admin_orders(
    status: Optional[str] = "ALL",
    payment_status: Optional[str] = "ALL",
    search: Optional[str] = None,
    limit: int = 100
):
    """Admin/Supplier view of all customer orders."""
    orders = svc.get_all_orders_admin(status, payment_status, search, limit)
    return {"success": True, "count": len(orders), "orders": orders}


@store_router.put("/admin/orders/{order_id}/status")
def update_order_stage(order_id: str, payload: UpdateOrderStatusModel):
    """Update order delivery lifecycle stage (Packed, Dispatched, Delivered, Cancelled)."""
    result = svc.update_order_status(
        order_id=order_id,
        new_status=payload.new_status,
        comment=payload.comment,
        updated_by=payload.updated_by or "ADMIN"
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Status update failed"))
    return result


@store_router.put("/admin/orders/{order_id}/eta")
def update_delivery_eta(order_id: str, payload: UpdateETAModel):
    """Adjusts estimated delivery arrival duration in minutes with a documented delay reason."""
    result = svc.update_delivery_eta(
        order_id=order_id,
        extra_minutes=payload.extra_minutes,
        reason=payload.reason,
        updated_by=payload.updated_by or "ADMIN"
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "ETA adjustment failed"))
    return result


@store_router.put("/admin/orders/{order_id}/partner")
def assign_partner(order_id: str, payload: AssignPartnerModel):
    """Assigns or updates the delivery personnel assigned to the order."""
    result = svc.assign_delivery_partner(
        order_id=order_id,
        partner_name=payload.partner_name,
        partner_phone=payload.partner_phone,
        vehicle_number=payload.vehicle_number,
        updated_by=payload.updated_by or "ADMIN"
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Partner assignment failed"))
    return result


@store_router.get("/admin/analytics")
def get_admin_analytics():
    """Returns verified financial summaries, category sales, and low stock warnings."""
    analytics = svc.get_admin_business_analytics()
    return {"success": True, "analytics": analytics}
