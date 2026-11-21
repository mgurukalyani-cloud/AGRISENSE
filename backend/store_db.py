"""
AgriSense Agricultural E-Commerce SQLite Database Engine
Provides ACID-compliant persistent database storage with WAL journaling,
foreign key integrity, atomic transactions, inventory deduction, and seed data.
"""

import sqlite3
import os
import json
import uuid
import datetime
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "agrisense_store.db")


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured with WAL mode and foreign keys enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_store_database():
    """Initializes the database schema and seeds initial verified agricultural catalog."""
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Categories
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            name_te TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            icon TEXT,
            display_order INTEGER DEFAULT 0
        )
        """)

        # 2. Products
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            category_id TEXT NOT NULL REFERENCES categories(id),
            name TEXT NOT NULL,
            name_te TEXT NOT NULL,
            brand TEXT NOT NULL,
            category_name TEXT NOT NULL,
            description TEXT NOT NULL,
            description_te TEXT,
            mrp REAL NOT NULL,
            original_price REAL NOT NULL,
            subsidy_saved REAL DEFAULT 0.0,
            pack_size REAL NOT NULL,
            pack_unit TEXT NOT NULL,
            stock_quantity INTEGER NOT NULL DEFAULT 100,
            gst_rate REAL NOT NULL DEFAULT 5.0,
            hsn_code TEXT NOT NULL,
            image_url TEXT,
            usage_instructions TEXT NOT NULL,
            usage_instructions_te TEXT,
            suitable_crops TEXT NOT NULL,
            cibrc_reg_no TEXT,
            is_verified INTEGER DEFAULT 1,
            is_active INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
        """)

        # 3. Users / Farmer Profiles
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            role TEXT NOT NULL DEFAULT 'farmer',
            full_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            village TEXT,
            mandal TEXT,
            district TEXT,
            state TEXT DEFAULT 'Telangana',
            pincode TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # 4. Shopping Carts
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS carts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            updated_at TEXT NOT NULL
        )
        """)

        # 5. Cart Items
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS cart_items (
            id TEXT PRIMARY KEY,
            cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL REFERENCES products(id),
            quantity INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            UNIQUE(cart_id, product_id)
        )
        """)

        # 6. Orders
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL REFERENCES users(id),
            subtotal REAL NOT NULL,
            tax_total REAL NOT NULL,
            delivery_fee REAL NOT NULL,
            discount_total REAL NOT NULL,
            grand_total REAL NOT NULL,
            subsidy_saved_total REAL NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'PENDING',
            order_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
            delivery_address_json TEXT NOT NULL,
            delivery_instructions TEXT,
            estimated_delivery TEXT NOT NULL,
            delivered_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """)

        # 7. Order Items (Preserving purchase-time product prices)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            product_id TEXT NOT NULL REFERENCES products(id),
            product_name TEXT NOT NULL,
            brand TEXT NOT NULL,
            pack_size REAL NOT NULL,
            pack_unit TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            line_subtotal REAL NOT NULL,
            gst_rate REAL NOT NULL,
            tax_amount REAL NOT NULL,
            subsidy_saved REAL NOT NULL
        )
        """)

        # 8. Payments
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id),
            gateway TEXT NOT NULL DEFAULT 'RAZORPAY',
            gateway_order_id TEXT,
            gateway_payment_id TEXT,
            gateway_signature TEXT,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'INR',
            upi_qr_payload TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'PENDING',
            raw_payload TEXT,
            paid_at TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # 9. Deliveries
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS deliveries (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            partner_name TEXT,
            partner_phone TEXT,
            hub_location TEXT,
            carrier_awb TEXT,
            status TEXT NOT NULL DEFAULT 'ORDER_RECEIVED',
            dispatched_at TEXT,
            out_for_delivery_at TEXT,
            delivered_at TEXT,
            updated_at TEXT NOT NULL
        )
        """)

        # 10. Order Status History (Audit trail)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS order_status_history (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            comment TEXT,
            created_by TEXT NOT NULL DEFAULT 'SYSTEM',
            created_at TEXT NOT NULL
        )
        """)

        # 11. Discount Coupons
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS coupons (
            code TEXT PRIMARY KEY,
            discount_type TEXT NOT NULL, -- 'FIXED' or 'PERCENT'
            discount_value REAL NOT NULL,
            min_order_amount REAL NOT NULL DEFAULT 500.0,
            max_discount_amount REAL DEFAULT 500.0,
            description TEXT NOT NULL,
            is_active INTEGER DEFAULT 1
        )
        """)

        # Check if products already seeded
        cursor.execute("SELECT COUNT(*) AS cnt FROM products")
        if cursor.fetchone()["cnt"] == 0:
            seed_initial_catalog(cursor)

        # Check if default demo user already seeded
        cursor.execute("SELECT COUNT(*) AS cnt FROM users")
        if cursor.fetchone()["cnt"] == 0:
            seed_default_users(cursor)

        conn.commit()
        print("AgriSense SQLite Database Initialized Successfully!")


def seed_default_users(cursor: sqlite3.Cursor):
    """Seeds default verified accounts for farmer, admin, supplier, and delivery partner."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    users = [
        ("user_farmer_01", "farmer", "Rameshwar Rao", "9848022338", "rameshwar.farmer@agrisense.in", "Appannapet", "Dharmaram", "Peddapalli", "Telangana", "505187", now),
        ("user_admin_01", "admin", "AgriSense Store Administrator", "9848011223", "admin@agrisense.in", "Central Hub", "Hitec City", "Hyderabad", "Telangana", "500081", now),
        ("user_supplier_01", "supplier", "Kisan Seva Fertilizer Depot", "9848033445", "supplier@agrisense.in", "Kisan Mandi", "Karimnagar", "Karimnagar", "Telangana", "505001", now),
        ("user_delivery_01", "delivery", "Suresh Goud (Delivery Partner)", "9848055667", "delivery@agrisense.in", "Hub 4", "Peddapalli", "Peddapalli", "Telangana", "505172", now)
    ]
    cursor.executemany("""
    INSERT INTO users (id, role, full_name, phone, email, village, mandal, district, state, pincode, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, users)

    # Default coupons
    coupons = [
        ("KISAN100", "FIXED", 100.0, 1000.0, 100.0, "Flat ₹100 Off on orders above ₹1,000 for verified farmers", 1),
        ("AGRI50", "FIXED", 50.0, 500.0, 50.0, "₹50 Off on orders above ₹500", 1),
        ("PMKISAN", "PERCENT", 5.0, 2000.0, 300.0, "5% Additional Farmer Subsidy rebate up to ₹300", 1)
    ]
    cursor.executemany("""
    INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount_amount, description, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, coupons)


def seed_initial_catalog(cursor: sqlite3.Cursor):
    """Seeds verified agricultural products across all 7 categories."""
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    categories = [
        ("cat_fertilizer", "Chemical Fertilizers", "రసాయన ఎరువులు", "fertilizers", "Essential NPK primary and secondary fertilizers with DBT pricing", "Sprout", 1),
        ("cat_organic", "Organic Fertilizers", "సేంద్రియ ఎరువులు", "organic-fertilizers", "Certified bio-compost, neem cake, and organic carbon enhancers", "Leaf", 2),
        ("cat_micronutrient", "Micronutrients", "సూక్ష్మ పోషకాలు", "micronutrients", "Chelated Zinc, Boron, Ferrous, and grade mixtures", "Sparkles", 3),
        ("cat_pesticide", "Pesticides", "పురుగు మరియు తెగులు మందులు", "pesticides", "CIBRC-registered plant protection insecticides and fungicides", "ShieldAlert", 4),
        ("cat_biopesticide", "Bio-Pesticides", "జీవ నియంత్రణ మందులు", "bio-pesticides", "Microbial biocontrol agents: Trichoderma, Pseudomonas, Neem oil", "Activity", 5),
        ("cat_seed", "Certified Seeds", "ధృవీకరించిన విత్తనాలు", "seeds", "High germination, high-yielding certified hybrid seeds", "CheckCircle", 6),
        ("cat_equipment", "Agricultural Equipment", "వ్యవసాయ పరికరాలు", "equipment", "Battery sprayers, soil probes, protective farm gear, and tools", "Wrench", 7)
    ]

    cursor.executemany("""
    INSERT INTO categories (id, name, name_te, slug, description, icon, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, categories)

    products = [
        # --- 1. FERTILIZERS ---
        (
            "prod_urea_45kg", "cat_fertilizer", "Neem Coated Urea (46% N)", "వేప పూత పూసిన యూరియా (46% ఎన్)",
            "IFFCO / KRIBHCO", "Chemical Fertilizers",
            "Slow-release prilled Urea coated with neem oil to retard nitrification, enhance nitrogen uptake efficiency, and promote vegetative tillering.",
            "నత్రజని వినియోగ సామర్థ్యాన్ని పెంచి, పిలకలు బాగా రావడానికి వేప పూత పూసిన యూరియా.",
            266.50, 2450.00, 2183.50, 45.0, "bag", 250, 5.0, "31021000",
            "/assets/products/urea_45kg.png",
            "Split application: 25% Basal, 40% Tillering, 35% Panicle emergence. Broadcast when soil has optimal moisture.",
            "విడతల వారీగా వేయాలి: 25% దుక్కిలో, 40% పిలకల దశలో, 35% చిరుపొట్ట దశలో.",
            "Paddy, Wheat, Maize, Cotton, Sugarcane", "CIBRC/FERT/NCU-46", 1, 1, now
        ),
        (
            "prod_dap_50kg", "cat_fertilizer", "Di-Ammonium Phosphate DAP (18-46-0)", "డి.ఎ.పి (18-46-0) ఎరువు",
            "Coromandel Gromor / IFFCO", "Chemical Fertilizers",
            "Concentrated phosphatic starter fertilizer supplying 46% water-soluble P2O5 and 18% Ammoniacal Nitrogen for vigorous root development.",
            "వేర్లు బలంగా భూమిలోకి దిగడానికి, దుక్కిలో వేయవలసిన 46% భాస్వరం గల డి.ఎ.పి.",
            1350.00, 4000.00, 2650.00, 50.0, "bag", 180, 5.0, "31053000",
            "/assets/products/dap_50kg.png",
            "100% Basal placement during final ploughing or seed drill placement. Do not broadcast on standing dry soil.",
            "100% ఆఖరి దుక్కిలో విత్తనం లేదా నాట్లకు ముందు వేయాలి.",
            "Paddy, Cotton, Chilli, Groundnut, Maize, Wheat, Pulses", "CIBRC/FERT/DAP-18-46", 1, 1, now
        ),
        (
            "prod_mop_50kg", "cat_fertilizer", "Muriate of Potash MOP (60% K2O)", "పొటాష్ ఎరువు (60% కె2ఓ)",
            "Indian Potash Limited (IPL)", "Chemical Fertilizers",
            "High-grade Muriate of Potash providing 60% Potassium for stomatal regulation, drought tolerance, disease resistance and grain filling.",
            "కాయ మరియు గింజ నాణ్యత పెంచడానికి, తెగుళ్ళను తట్టుకోవడానికి 60% పొటాష్.",
            1700.00, 3200.00, 1500.00, 50.0, "bag", 140, 5.0, "31042000",
            "/assets/products/mop_50kg.png",
            "Split application: 50% Basal at sowing, 50% at flowering / panicle initiation for heavy clay soils.",
            "50% దుక్కిలో మరియు 50% పూత / గింజ కట్టే దశలో వేయాలి.",
            "Paddy, Cotton, Chilli, Banana, Tomato, Maize", "CIBRC/FERT/MOP-60", 1, 1, now
        ),
        (
            "prod_ssp_50kg", "cat_fertilizer", "Single Super Phosphate SSP (16% P2O5, 11% S)", "సింగిల్ సూపర్ ఫాస్ఫేట్ (16% పి, 11% సల్ఫర్)",
            "Khaitan / Coromandel", "Chemical Fertilizers",
            "Multi-nutrient phosphatic fertilizer supplying 16% Phosphate, 11% Sulphur, and 21% Calcium. Ideal for oilseeds to boost oil synthesis.",
            "నూనె గింజల పంటలలో నూనె శాతాన్ని పెంచే 16% భాస్వరం మరియు 11% గంధకం.",
            425.00, 900.00, 475.00, 50.0, "bag", 200, 5.0, "31031000",
            "/assets/products/ssp_50kg.png",
            "Apply as basal dose during land preparation for Groundnut, Mustard, and Soybean.",
            "భూమి తయారీ సమయంలో ఆఖరి దుక్కిలో వేయాలి.",
            "Mustard, Groundnut, Soybean, Pulses, Sunflower", "CIBRC/FERT/SSP-16-11", 1, 1, now
        ),
        (
            "prod_npk_complex_50kg", "cat_fertilizer", "Ammonium Phosphate Sulphate (20-20-0-13)", "కాంప్లెక్స్ ఎరువు (20-20-0-13 సల్ఫర్)",
            "FACT / IFFCO Granular", "Chemical Fertilizers",
            "Balanced complex fertilizer containing 20% Ammoniacal Nitrogen, 20% Phosphate and 13% Sulphur for rapid tillering and root spread.",
            "20% నత్రజని, 20% భాస్వరం మరియు 13% సల్ఫర్ గల సమతుల్య కాంప్లెక్స్ ఎరువు.",
            1200.00, 2600.00, 1400.00, 50.0, "bag", 160, 5.0, "31052000",
            "/assets/products/npk_complex_50kg.png",
            "Apply in 2 splits: basal incorporation and early vegetative top dressing.",
            "దుక్కిలో మరియు మొదటి కలుపు తీసిన తర్వాత వేయాలి.",
            "Paddy, Cotton, Chilli, Maize, Red Gram", "CIBRC/FERT/NPKS-20-20", 1, 1, now
        ),

        # --- 2. ORGANIC FERTILIZERS ---
        (
            "prod_neem_cake_50kg", "cat_organic", "Pure De-Oiled Neem Cake Powder (50 kg)", "వేప పిండి పొడి ఎరువు (50 కేజీ)",
            "Godrej Agrovet AgroNeem", "Organic Fertilizers",
            "100% natural cold-pressed neem seed cake rich in azadirachtin and organic NPK. Protects root zone from nematodes and termites.",
            "వేరుపురుగు మరియు నెమటోడ్లను నివారించే సహజసిద్ధమైన స్వచ్ఛమైన వేప పిండి.",
            950.00, 1350.00, 400.00, 50.0, "bag", 120, 5.0, "31010099",
            "/assets/products/neem_cake_50kg.png",
            "Apply 100-150 kg per acre during final ploughing mixed with farmyard manure.",
            "ఎకరాకు 100 నుండి 150 కేజీలు ఆఖరి దుక్కిలో పశువుల ఎరువుతో కలిపి వేయాలి.",
            "Paddy, Chilli, Cotton, Vegetables, Horticultural Orchards", "NPOP/NAB/0019/ORG", 1, 1, now
        ),
        (
            "prod_vermicompost_40kg", "cat_organic", "Enriched Earthworm Vermicompost (40 kg)", "వానపాముల ఎరువు - వర్మికంపోస్ట్ (40 కేజీ)",
            "GreenEarth AgriBio", "Organic Fertilizers",
            "Humus-rich vermicompost produced via Eisenia fetida earthworms. Improves soil microbial count, aeration, and water-holding capacity.",
            "నేల సారవంతాన్ని, తేమను నిలిపే శక్తిని పెంచే వానపాముల సేంద్రియ ఎరువు.",
            480.00, 750.00, 270.00, 40.0, "bag", 150, 5.0, "31010099",
            "/assets/products/vermicompost_40kg.png",
            "Apply 200-400 kg per acre in basal furrow or ring placement around fruit plants.",
            "ఎకరాకు 200-400 కేజీలు దుక్కిలో లేదా చెట్ల పాదులలో వేయాలి.",
            "All Agricultural and Horticultural Crops, Vegetables", "FCO/ORG/VERMI-04", 1, 1, now
        ),

        # --- 3. MICRONUTRIENTS ---
        (
            "prod_zinc_sulphate_25kg", "cat_micronutrient", "Zinc Sulphate Heptahydrate 21% (25 kg)", "జింక్ సల్ఫేట్ 21% (25 కేజీ)",
            "IFFCO Micro-Zinc", "Micronutrients",
            "Agricultural grade Zinc Sulphate (21% Zn, 10% S) preventing Khaira disease in paddy, leaf bronzing, and interveinal chlorosis.",
            "వరిలో ఖైరా తెగులును, ఆకులు ముడుచుకుపోవడాన్ని నివారించే 21% జింక్ సల్ఫేట్.",
            650.00, 850.00, 200.00, 25.0, "bag", 90, 5.0, "28332990",
            "/assets/products/zinc_sulphate_25kg.png",
            "Broadcast 10-15 kg/acre as basal dose. Note: NEVER mix directly with DAP in the same bucket to prevent insoluble zinc phosphate.",
            "ఎకరాకు 10-15 కేజీలు దుక్కిలో వేయాలి. గమనిక: డి.ఎ.పితో ఎప్పుడూ కలపరాదు.",
            "Paddy, Maize, Wheat, Cotton, Citrus", "FCO/MICRO/ZN-21", 1, 1, now
        ),
        (
            "prod_borax_1kg", "cat_micronutrient", "Solubor / Borax 20% Water Soluble (1 kg)", "బోరాన్ / సాల్యుబోర్ 20% (1 కేజీ)",
            "Multiplex Multibor Foliar", "Micronutrients",
            "100% water-soluble foliar Boron promoting pollen germination, flower retention, pod setting, and preventing fruit cracking.",
            "పూత రాలడం నివారించి, గింజలు బాగా నిండటానికి 20% కరిగే బోరాన్.",
            180.00, 250.00, 70.00, 1.0, "packet", 300, 5.0, "28401900",
            "/assets/products/borax_1kg.png",
            "Foliar spray @ 1 to 1.5 grams per litre of water at flower initiation and pod formation stages.",
            "లీటరు నీటికి 1 నుండి 1.5 గ్రాములు కలిపి పూత దశలో పిచికారీ చేయాలి.",
            "Mustard, Chilli, Cotton, Tomato, Groundnut, Pulses", "FCO/MICRO/B-20", 1, 1, now
        ),

        # --- 4. PESTICIDES (CIBRC-Registered) ---
        (
            "prod_coragen_60ml", "cat_pesticide", "Coragen (Chlorantraniliprole 18.5% SC - 60 ml)", "కోరాజెన్ పురుగు మందు (60 మి.లీ)",
            "FMC India", "Pesticides",
            "CIBRC-registered anthranilic diamide insecticide providing systemic control against Paddy Stem Borer, Leaf Folder, and Cotton Bollworm.",
            "వరి కాండం తొలుచు పురుగు, ఆకు చుట్టు పురుగు మరియు పత్తి కాయ తొలుచు పురుగుల సమర్థవంతమైన నివారణ.",
            1850.00, 2200.00, 350.00, 0.06, "bottle", 85, 18.0, "38089190",
            "/assets/products/coragen_60ml.png",
            "Foliar spray @ 60 ml per acre in 200 Litres of water. Observe 14-day pre-harvest waiting interval.",
            "ఎకరాకు 60 మి.లీ చొప్పున 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయాలి.",
            "Paddy, Sugarcane, Cotton, Maize, Tomato", "CIR-68,432/2012-Chlorantraniliprole(SC)-118", 1, 1, now
        ),
        (
            "prod_contaph_1l", "cat_pesticide", "Contaf Plus (Hexaconazole 5% SC - 1 Litre)", "కాంటాఫ్ ప్లస్ తెగులు మందు (1 లీటరు)",
            "Tata Rallis India", "Pesticides",
            "Systemic triazole fungicide providing protective and curative control against Sheath Blight in Paddy, Powdery Mildew, and Rusts.",
            "వరిలో పొడ తెగులు (షీత్ బ్లైట్), బూడిద తెగులు నివారణకు సిస్టమిక్ శిలీంద్ర సంహారిణి.",
            620.00, 780.00, 160.00, 1.0, "bottle", 110, 18.0, "38089290",
            "/assets/products/contaph_1l.png",
            "Foliar spray @ 2 ml per Litre of water (400 ml per acre) upon early symptom appearance.",
            "లీటరు నీటికి 2 మి.లీ చొప్పున కలిపి తెగులు లక్షణాలు కనిపించిన వెంటనే పిచికారీ చేయాలి.",
            "Paddy, Chilli, Groundnut, Cotton, Mango", "CIR-32,198/1999-Hexaconazole(SC)-54", 1, 1, now
        ),

        # --- 5. BIO-PESTICIDES ---
        (
            "prod_trichoderma_1kg", "cat_biopesticide", "Trichoderma viride 1.5% WP (1 kg)", "ట్రైకోడెర్మా విరిడే జీవ శిలీంద్ర నాశిని (1 కేజీ)",
            "Biostadt AgriBio", "Bio-Pesticides",
            "CIBRC-approved beneficial biocontrol fungus targeting soil-borne pathogens: Fusarium root rot, collar rot, damping off, and bacterial wilt.",
            "వేరుకుళ్ళు, ఎండు తెగులును సమర్థవంతంగా అరికట్టే మేలు చేసే శిలీంద్ర సంహారిణి.",
            220.00, 320.00, 100.00, 1.0, "packet", 175, 5.0, "30029030",
            "/assets/products/trichoderma_1kg.png",
            "Seed treatment: 5-10 g/kg seed. Soil application: 2.5 kg mixed with 100 kg moist FYM per acre.",
            "విత్తన శుద్ధి: కిలో విత్తనానికి 5-10 గ్రాములు. నేలలో వేయుటకు: 2.5 కిలోలను పశువుల ఎరువుతో కలిపి వేయాలి.",
            "Paddy, Cotton, Chilli, Red Gram, Tomato, Groundnut", "CIBRC/BIO/TRICH-1.5WP-89", 1, 1, now
        ),
        (
            "prod_neem_oil_1l", "cat_biopesticide", "Pure Neem Oil 10,000 PPM Azadirachtin (1 Litre)", "వేప నూనె 10,000 పి.పి.ఎం (1 లీటరు)",
            "Multiplex Bio-Neem", "Bio-Pesticides",
            "Cold-pressed neem oil formulation acting as an anti-feedant, oviposition deterrent, and insect growth regulator for sucking pests.",
            "రసం పీల్చే పురుగులను, గుడ్లను నిరోధించే సహజ సిద్ధమైన ఆర్గానిక్ వేప నూనె.",
            450.00, 600.00, 150.00, 1.0, "bottle", 140, 5.0, "38089910",
            "/assets/products/neem_oil_1l.png",
            "Foliar spray @ 3-5 ml per Litre of water. Repeat every 10-12 days for organic IPM.",
            "లీటరు నీటికి 3 నుండి 5 మి.లీ కలిపి పిచికారీ చేయాలి.",
            "All Crops, Cotton, Chilli, Vegetables, Pulses", "CIBRC/BIO/AZA-10000PPM-45", 1, 1, now
        ),

        # --- 6. CERTIFIED SEEDS ---
        (
            "prod_seed_bpt5204_25kg", "cat_seed", "Certified Paddy Seed BPT 5204 Samba Mahsuri (25 kg)", "ధృవీకరించిన వరి విత్తనాలు - బి.పి.టి 5204 (25 కేజీ)",
            "Telangana State Seeds Dev Corp (TSSDC)", "Certified Seeds",
            "Medium-duration (145 days) high-yielding super fine table rice variety with high milling recovery and excellent cooking quality.",
            "మధ్యస్థ కాల పరిమితి (145 రోజులు) గల అత్యుత్తమ నాణ్యమైన సన్న వరి విత్తనాలు.",
            1150.00, 1400.00, 250.00, 25.0, "bag", 95, 5.0, "12099190",
            "/assets/products/seed_bpt5204_25kg.png",
            "Seed rate: 20-25 kg per acre for transplanted rice. Treat with Carbendazim before nursery sowing.",
            "ఎకరాకు 20 నుండి 25 కేజీల విత్తనం సరిపోతుంది.",
            "Paddy / Rice", "NSC/CERT/PADDY-BPT-5204", 1, 1, now
        ),
        (
            "prod_seed_rnr15048_10kg", "cat_seed", "Telangana Sona Low-GI Paddy Seed RNR 15048 (10 kg)", "తెలంగాణ సోనా వరి విత్తనాలు - ఆర్.ఎన్.ఆర్ 15048 (10 కేజీ)",
            "PJTSAU Certified Seed Wing", "Certified Seeds",
            "Short-duration (125 days) blast-resistant variety having lowest Glycemic Index (GI 51.5) suitable for diabetic nutrition.",
            "125 రోజుల స్వల్ప కాలిక, అగ్గి తెగులును తట్టుకునే తక్కువ జి.ఐ గల వరి విత్తనాలు.",
            580.00, 720.00, 140.00, 10.0, "bag", 110, 5.0, "12099190",
            "/assets/products/seed_rnr15048_10kg.png",
            "Seed rate: 10 kg per acre for direct seeding (DSR) or 15 kg for transplanting.",
            "నేరుగా విత్తడానికి ఎకరాకు 10 కేజీలు, నారుకు 15 కేజీలు వాడాలి.",
            "Paddy / Rice", "TSSDC/CERT/RNR-15048", 1, 1, now
        ),

        # --- 7. AGRICULTURAL EQUIPMENT ---
        (
            "prod_sprayer_battery_16l", "cat_equipment", "16L Dual-Motor Battery Knapsack Sprayer", "16 లీటర్ల బ్యాటరీ స్ప్రేయర్ (డ్యూయల్ మోటార్)",
            "Balwaan Krishi Power", "Agricultural Equipment",
            "12V 12Ah heavy-duty rechargeable battery sprayer with brass lance, 4 multi-purpose nozzles, pressure regulator, and continuous 6-hour operation.",
            "నిరంతరం 6 గంటలు పనిచేసే 12వి బ్యాటరీ గల బరువైన పిచికారీ యంత్రం.",
            2850.00, 3999.00, 1149.00, 5.5, "unit", 45, 18.0, "84244100",
            "/assets/products/sprayer_battery_16l.png",
            "Charge 6 hours before initial use. Clean nozzles with clean water after spraying pesticides.",
            "మొదటి సారి వాడే ముందు 6 గంటలు ఛార్జ్ చేయాలి. వాడిన తర్వాత నాజిల్స్ శుభ్రం చేసుకోవాలి.",
            "All Crops & Orchards", "BIS/IS-11313/EQUIP", 1, 1, now
        ),
        (
            "prod_soil_sensor_probe", "cat_equipment", "AgriSense Stainless Steel Soil NPK & Moisture Probe", "అగ్రిసెన్స్ సాయిల్ ఎన్.పి.కె & తేమ మీటర్",
            "AgriSense IoT Labs", "Agricultural Equipment",
            "RS485 Modbus industrial grade stainless steel 316 soil sensor probe measuring moisture (0-100%), temperature, EC, and NPK nutrients.",
            "నేలలోని తేమ, ఉష్ణోగ్రత మరియు ఎన్.పి.కె పోషకాలను క్షణాల్లో కొలిచే పరికరం.",
            1450.00, 2200.00, 750.00, 0.4, "unit", 60, 18.0, "90318000",
            "/assets/products/soil_sensor_probe.png",
            "Insert probe vertically 10-15 cm into root zone soil. Read via AgriSense ESP32 telemetry.",
            "మొక్కల వేరు మండలంలో 10-15 సెం.మీ లోతుకు చొప్పించి రీడింగ్ గమనించాలి.",
            "All Agricultural Farms & Greenhouses", "AGRI-IOT-PRB-404", 1, 1, now
        )
    ]

    cursor.executemany("""
    INSERT INTO products (
        id, category_id, name, name_te, brand, category_name, description, description_te,
        mrp, original_price, subsidy_saved, pack_size, pack_unit, stock_quantity, gst_rate, hsn_code,
        image_url, usage_instructions, usage_instructions_te, suitable_crops, cibrc_reg_no,
        is_verified, is_active, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, products)
