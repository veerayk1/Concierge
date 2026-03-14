# Store — Granular Deep Dive

Field-level documentation of every element in Condo Control's Store module.

**Platform**: Condo Control (app.condocontrol.com)
**Property observed**: M.T.C.C. 872 (Toronto, ON)
**Logged-in role**: Security & Concierge (user "Temp Concierge", Royal Concierge and Security)

---

## 1. Module Overview

**URL**: `/store/overview/`
**Sidebar menu**: Store (shopping bag icon)
**Breadcrumb**: Home > New Order
**Page title**: "New Order | Condo Control"

The Store module is an **online ordering system** for property-related purchases. It requires a configured credit card payment system (Stripe integration) to function.

**Role access**: Security & Concierge can access the Store, but the module is **non-functional** at this property because the credit card payment system is not configured.

---

## 2. Store Page

**URL**: `/store/overview/`

### 2.1 Layout

| # | Element | Description |
|---|---------|-------------|
| 1 | Breadcrumb | Home > New Order |
| 2 | Error banner | Pink/red background banner with error text |
| 3 | Footer | Standard footer |

### 2.2 Error State

| # | Element | Description |
|---|---------|-------------|
| 1 | Banner style | Light pink/red background (`alert-danger` style) |
| 2 | Error text | "Credit card payment system is not configured properly. Please contact your property manager." |

**Note**: The entire module is blocked by this configuration error. No product listings, categories, cart, or checkout flow are visible. The page title ("New Order") suggests this is an order placement page, not a product catalog landing.

---

## 3. Data Model Observations

### 3.1 Inferred Store Capabilities

Based on the URL pattern (`/store/overview/`), page title ("New Order"), and Stripe integration context:

| Feature | Evidence |
|---------|----------|
| Online ordering | Page title "New Order" |
| Credit card payments | Error message references "credit card payment system" |
| Stripe integration | Stripe JS library observed in other CondoControl modules |
| Property manager configuration | Error instructs to "contact your property manager" |

### 3.2 Possible Use Cases

Common condo store items (inferred from industry knowledge, not observed):
- Key/FOB replacement orders
- Parking permit purchases
- Amenity booking payment
- Move-in/move-out deposits
- Party room damage deposits
- Common element access devices

---

## 4. URL Map

| Page | URL Pattern |
|------|-------------|
| Store overview / New Order | `/store/overview/` |

---

## 5. Key Observations for Concierge Project

### What CondoControl Gets Right
1. **Dedicated store module** — Having a separate purchasing workflow is better than embedding payments into other modules
2. **Payment gateway integration** — Stripe integration suggests modern payment processing
3. **Property-level configuration** — Payment system is configured per-property, allowing different Stripe accounts

### What CondoControl Gets Wrong
1. **Entire module blocked by configuration** — If payment isn't configured, the entire Store is a dead end. Should show a "Store coming soon" or list items without purchase capability
2. **No graceful degradation** — Error message is the only content. No explanation of what the Store offers or what would be available once configured
3. **Page title mismatch** — Sidebar says "Store" but page title says "New Order". Inconsistent naming
4. **No product catalog visible** — Even without payment, showing available products/services would set expectations
5. **Error message is user-hostile** — "Contact your property manager" puts the burden on the user. Should provide more context about what the Store is for

---

*Documented: 2026-03-13*
*Role observed: Security & Concierge*
*Lines: ~80+*
