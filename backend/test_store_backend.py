"""
Automated Verification Suite for AgriSense Agricultural E-Commerce, Billing,
QR Payment, and Order Management Backend.
"""

import sys
import os
import asyncio

# Ensure project path in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.store_db import init_store_database, get_db_connection
from backend import store_service as svc
from backend.payment_service import verify_payment_signature, create_test_payment_signature


async def run_store_backend_verification():
    print("=" * 65)
    print("AGRISENSE E-COMMERCE BACKEND & PAYMENT VERIFICATION SUITE")
    print("=" * 65)

    # 1. Initialize DB
    init_store_database()
    print("[PASS] Database initialized successfully.")

    # 2. Test Category & Product Retrieval
    categories = svc.get_categories()
    assert len(categories) >= 7, f"Expected at least 7 categories, got {len(categories)}"
    print(f"[PASS] Retrieved {len(categories)} product categories.")

    products = svc.get_products()
    assert len(products) >= 14, f"Expected at least 14 products, got {len(products)}"
    print(f"[PASS] Retrieved {len(products)} verified agricultural products.")

    # Test filtering by category and crop
    fert_products = svc.get_products(category_slug="fertilizers")
    assert len(fert_products) >= 5, "Failed to filter fertilizers"
    print(f"[PASS] Filtered {len(fert_products)} fertilizers.")

    paddy_products = svc.get_products(crop="Paddy")
    assert len(paddy_products) >= 5, "Failed to filter products for Paddy"
    print(f"[PASS] Filtered {len(paddy_products)} products suitable for Paddy.")

    # 3. Test Shopping Cart Operations
    user_id = "user_farmer_01"
    svc.clear_cart(user_id)
    print("[PASS] User cart cleared.")

    # Add Urea (45kg, ₹266.50) x 3
    cart1 = svc.add_to_cart(user_id, "prod_urea_45kg", 3)
    assert cart1["total_items"] == 3
    assert cart1["subtotal"] == 3 * 266.50
    print(f"[PASS] Added 3 bags of Urea. Subtotal: ₹{cart1['subtotal']}")

    # Add Coragen (60ml, ₹1,850.00, GST 18%) x 2
    cart2 = svc.add_to_cart(user_id, "prod_coragen_60ml", 2)
    assert cart2["total_items"] == 5
    print(f"[PASS] Added 2 bottles of Coragen. Grand Total: ₹{cart2['grand_total']}")

    # Update item quantity
    cart3 = svc.update_cart_item_quantity(user_id, "prod_urea_45kg", 4)
    assert cart3["total_items"] == 6
    print(f"[PASS] Updated Urea quantity to 4. Total units in cart: {cart3['total_items']}")

    # Verify inventory stock limit prevention
    oversell_res = svc.add_to_cart(user_id, "prod_sprayer_battery_16l", 9999)
    assert oversell_res.get("success") is False, "Overselling should be rejected"
    print("[PASS] Overselling inventory prevention verified.")

    # 4. Test Checkout & Order Creation
    delivery_addr = {
        "full_name": "Rameshwar Rao",
        "phone": "9848022338",
        "village": "Appannapet",
        "mandal": "Dharmaram",
        "district": "Peddapalli",
        "state": "Telangana",
        "pincode": "505187",
        "farm_landmark": "Near Gram Panchayat Well"
    }

    checkout_res = await svc.create_checkout_order(
        user_id=user_id,
        delivery_address=delivery_addr,
        coupon_code="KISAN100",
        delivery_instructions="Deliver directly to farm gate storage shed."
    )
    assert checkout_res["success"] is True
    order_id = checkout_res["order_id"]
    order_number = checkout_res["order_number"]
    grand_total = checkout_res["grand_total"]
    payment_info = checkout_res["payment"]
    print(f"[PASS] Order created: {order_number} (ID: {order_id})")
    print(f"       Subtotal: ₹{checkout_res['subtotal']}, Tax: ₹{checkout_res['tax_total']}, Discount: ₹{checkout_res['discount_total']}, Grand Total: ₹{grand_total}")
    print(f"       Subsidy Saved: ₹{checkout_res['subsidy_saved']}")

    # Verify QR Code & UPI Intent
    assert "upi://pay?" in payment_info["upi_intent"]
    assert "<svg" in payment_info["qr_svg"]
    print(f"[PASS] Genuine UPI Dynamic QR & SVG generated successfully.")

    # 5. Test Cryptographic Payment Verification
    gateway_order_id = payment_info["gateway_order_id"]
    test_payment_id = "pay_test_verified_99182"
    valid_sig = create_test_payment_signature(gateway_order_id, test_payment_id)

    # Verify invalid signature is rejected
    fake_confirm = svc.confirm_order_payment(order_id, gateway_order_id, test_payment_id, "invalid_signature_hex")
    assert fake_confirm["success"] is False, "Fake signature should be rejected"
    print("[PASS] Rejected fraudulent payment signature.")

    # Verify valid signature succeeds
    real_confirm = svc.confirm_order_payment(order_id, gateway_order_id, test_payment_id, valid_sig)
    assert real_confirm["success"] is True
    assert real_confirm["order_status"] == "CONFIRMED"
    print(f"[PASS] Cryptographic payment signature verified. Order status updated to CONFIRMED. AWB: {real_confirm['tracking_awb']}")

    # 6. Test Order Status Lifecycle (Admin / Logistics)
    for next_stage in ["PROCESSING", "PACKED", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED"]:
        stage_res = svc.update_order_status(order_id, next_stage, f"Progressing to {next_stage}", "LOGISTICS_HUB")
        assert stage_res["success"] is True
        print(f"[PASS] Order transitioned to stage: {next_stage}")

    # 7. Test Order Tracking & Audit History
    order_details = svc.get_order_details(order_id)
    assert order_details is not None
    assert order_details["order_status"] == "DELIVERED"
    assert len(order_details["status_history"]) >= 6
    print(f"[PASS] Order tracking timeline verified ({len(order_details['status_history'])} audit milestones).")

    # 8. Test Farmer Orders History
    farmer_orders = svc.get_user_orders(user_id)
    assert len(farmer_orders) >= 1
    print(f"[PASS] Farmer dashboard retrieved {len(farmer_orders)} order(s).")

    # 9. Test Admin Analytics
    analytics = svc.get_admin_business_analytics()
    assert analytics["summary"]["paid_orders"] >= 1
    assert analytics["summary"]["total_revenue"] >= grand_total
    print(f"[PASS] Admin business analytics verified:")
    print(f"       Total Revenue: ₹{analytics['summary']['total_revenue']}")
    print(f"       Delivered Orders: {analytics['summary']['delivered_orders']}")
    print(f"       Subsidy Saved: ₹{analytics['summary']['total_subsidy_saved']}")

    print("=" * 65)
    print("ALL 9 BACKEND & PAYMENT TESTS PASSED (100% SUCCESS)!")
    print("=" * 65)


if __name__ == "__main__":
    asyncio.run(run_store_backend_verification())
