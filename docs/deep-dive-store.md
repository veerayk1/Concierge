# Deep Dive: Online Store Module (Aquarius / Platform 1)

> **Source**: Live production instance at `https://aquarius.iconconnect.ca/online-store`
> **Property**: TSCC 2584 — Bond (single building, building_id=92)
> **Logged in as**: RAY_007 (property manager)
> **Date observed**: 2026-03-14

---

## 1. Page Overview

**URL**: `/online-store`
**Page title**: "Store"
**Sidebar label**: "Store"

### Page Layout
1. **Header**: Title "Store"
2. **Building filter**: "Select building:" dropdown (pre-filled "Bond")
3. **Tab navigation**: 3 tabs
4. **Cart**: Shopping cart icon with "Cart" label (top right of Place Order tab)

### Tabs
| Tab | Purpose | Content |
|-----|---------|---------|
| Place Order | Browse and add products to cart | Product catalog (empty — no payment configured) |
| Existing Orders | All orders placed by all residents | Order table (empty) |
| Your Orders | Orders placed by the current user | Order table (empty) |

### Warning Notice
> "Note. Keep the size of photos less than 100kb for store to work."

**Info style**: Blue info icon with text in light blue background banner.

### Error State
> "No appropriate payment methods have been set up in building settings. Online store requires you to set up online payments"

**Key insight**: The store is fully dependent on payment method configuration in building settings. Without it, the Place Order tab is non-functional.

---

## 2. Place Order Tab

**Active by default**

### Visible Elements
| Element | Notes |
|---------|-------|
| Cart icon | Shopping bag icon with "Cart" label |
| Photo size warning | Products require photos < 100kb |
| Payment error | No payment methods configured |

**Note**: No product creation form visible on this tab. Products are likely configured in Settings or a separate admin area. This tab is the **shopping/ordering** interface.

---

## 3. Existing Orders Tab (All Orders)

### Table Columns
| Column | Description |
|--------|-------------|
| Order# | Order reference number |
| Products | Products in the order |
| Person who Placed Order | Customer name/username |
| Order Date | When the order was placed |
| Status | Order status |
| Total Charges | Total cost |
| Payment Completed | Payment status (yes/no) |

**Currently empty** — no orders placed.

**Key insight**: This is a **staff/admin view** showing ALL orders from all residents. Useful for order fulfillment and tracking.

---

## 4. Your Orders Tab (Personal Orders)

### Table Columns
Same 7 columns as Existing Orders:
Order#, Products, Person who Placed Order, Order Date, Status, Total Charges, Payment Completed

**Currently empty** — no personal orders.

**Key insight**: This is a **personal view** showing only the logged-in user's orders. Same table structure as Existing Orders but filtered to current user.

---

## 5. Store Module Lifecycle (Deduced)

```
[Admin configures payment methods in Settings]
    ↓
[Admin adds products with photos to catalog]
    ↓
[Resident browses Place Order tab]
    ↓
[Resident adds to Cart → Places Order → Payment]
    ↓
[Order appears in Existing Orders (all) + Your Orders (personal)]
    ↓
[Staff fulfills order → Updates status]
```

### Key behaviors:
- **Payment-dependent** — Entire module requires payment method setup
- **Photo-based products** — Products have photos (< 100kb limit)
- **Shopping cart** — Standard e-commerce cart pattern
- **Dual order views** — All orders (staff) vs personal orders (user)
- **Building-scoped** — Store is per-building
- **Order tracking** — Status and payment completion tracking

---

## 6. Concierge Design Implications

### Strengths to Preserve
1. **Dual order views** — Staff sees all orders, residents see only theirs
2. **Order tracking table** — 7 columns cover essential order info
3. **Payment completion tracking** — Separate from order status
4. **Building-scoped** — Different buildings can have different products

### Gaps & Issues to Fix
1. **No product management visible** — Where are products created/managed?
2. **Photo size limit** — 100kb is very restrictive for product photos
3. **No product categories** — No visible category/filtering system
4. **No product search** — No search functionality on Place Order tab
5. **Payment methods unclear** — What payment methods are supported?
6. **No order status values visible** — Status column exists but no values shown
7. **No order detail view** — No click-through to order details
8. **No inventory management** — No stock count or availability
9. **No email notifications** — No visible order confirmation emails
10. **Limited use case** — Condo stores are niche (FOBs, keys, party room deposits?)

---

## 7. Data Model (Deduced)

```
Store
├── Product
│   ├── id
│   ├── name
│   ├── description
│   ├── photo (< 100kb)
│   ├── price (decimal)
│   ├── building_id → Building
│   └── status (active/inactive)
├── Order
│   ├── order_number (auto-generated)
│   ├── products[] → Product (with quantities)
│   ├── placed_by → User
│   ├── order_date (datetime)
│   ├── status (enum — values unknown)
│   ├── total_charges (decimal)
│   ├── payment_completed (boolean)
│   └── building_id → Building
└── Cart (session-based)
    ├── user_id → User
    └── items[] → {product_id, quantity}
```

---

*Last updated: 2026-03-14*
*Total fields documented: ~15*
*Module status: Not configured (no payment methods) — limited observation*
