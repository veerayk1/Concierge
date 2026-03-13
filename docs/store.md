# Store (Online Store)

The Store section provides an online marketplace for building-related purchases and services.

**URL**: `/online-store`

---

## Page Header

- **Title**: "Store" (with grid icon)
- **Select Building**: Dropdown to filter by building (e.g., "Bond")
- **Cart Icon**: Shopping cart with item count badge

## Navigation Tabs

| Tab | Description |
|-----|-------------|
| **Place Order** | Browse products and place new orders |
| **Existing Orders** | View and manage all current orders |
| **Your Orders** | View personal order history |

---

## Place Order Tab

- Displays available products for the selected building
- **Photo Size Note**: Info banner — product photos must be under 100kb
- **Payment Setup Required**: Shows warning if payment methods not configured: "No appropriate payment methods have been set up in building settings"

---

## Existing Orders Tab

### Orders Table

| Column | Description |
|--------|-------------|
| Order # | Unique order identifier |
| Products | Items included in the order |
| Person who Placed Order | Username/name of the person who ordered |
| Order Date | Date the order was placed |
| Status | Current order status |
| Total Charges | Total cost of the order |
| Payment Completed | Whether payment has been received |

---

## Your Orders Tab

- Displays orders placed by the currently logged-in user
- Same table structure as Existing Orders

---

## Features Summary

- Product browsing and ordering
- Shopping cart functionality
- Three-tab interface (Place Order, Existing Orders, Your Orders)
- Building-specific product catalog
- Order tracking with status updates
- Payment tracking
- Photo size restrictions for product images (<100kb)
- Requires online payment method configuration in building settings
