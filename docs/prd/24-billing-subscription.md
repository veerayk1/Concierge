# 24 -- Billing & Subscription Management

> **Status**: Draft
> **Last updated**: 2026-03-16
> **Owner**: Product
> **Depends on**: 01-Architecture, 02-Roles and Permissions, 16-Settings & Admin

---

## 1. Overview

### What It Is

Billing & Subscription Management is the revenue engine of the Concierge platform. It handles every aspect of how properties sign up, pay, upgrade, downgrade, and cancel their subscriptions. The module integrates deeply with Stripe for payment processing, tax calculation, and invoice generation -- so Concierge never touches raw credit card numbers.

This module has two faces:

1. **Admin Billing Dashboard** -- a self-service hub inside Settings where Property Admins view their plan, manage payment methods, download invoices, and change their subscription. This is a revenue-critical interface: the Admin is the buyer, and billing UX must be the smoothest experience in the entire platform.
2. **Super Admin Revenue Dashboard** -- a business intelligence view where Concierge operators monitor MRR, churn, trial conversions, and past-due accounts across all properties.

### Why It Exists

Revenue is the lifeblood of a SaaS business. Without a robust billing system:

- **Properties cannot self-serve** -- every plan change, payment update, or invoice request becomes a support ticket
- **Failed payments go unrecovered** -- without automated dunning, churn from payment failures is preventable but unaddressed
- **Tax compliance is manual** -- Canadian GST/HST varies by province and must be calculated automatically
- **Revenue visibility is zero** -- without dashboards, the business cannot forecast, detect churn, or measure growth

Self-service billing reduces support burden by an estimated 80%. When an Admin can update their credit card, download an invoice, or switch plans without contacting support, everyone wins.

### Which Roles Access It

| Role                 | Access Level           | What They See                                                                                       |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------- |
| **Super Admin**      | Full system access     | Revenue dashboard, all property subscriptions, past-due accounts, churn metrics, plan configuration |
| **Property Admin**   | Property-level billing | Current plan, usage meters, payment method, invoice history, change plan, cancel subscription       |
| **Property Manager** | Read-only billing      | Current plan and usage (no payment method access, no plan changes)                                  |
| **Board Member**     | Invoice history only   | Invoice list with PDF downloads for financial reporting                                             |
| **All other roles**  | No access              | Billing is not visible in navigation                                                                |

---

## 2. Research Summary

### SaaS Billing Best Practices

Industry research across leading SaaS platforms and billing infrastructure providers identified these essential patterns:

| Best Practice                               | Detail                                                                                                                                           | Our Approach                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **Stripe as billing backbone**              | The majority of modern SaaS products delegate subscription management, invoicing, and payment processing to Stripe rather than building in-house | Adopt. Use Stripe Billing, Checkout, Customer Portal, Tax, and Webhooks          |
| **Self-service plan management**            | Admins expect to upgrade, downgrade, and cancel without contacting support                                                                       | Adopt. Full self-service with prorated billing previews                          |
| **Transparent usage metering**              | Properties want to see how much of their plan they are consuming in real time                                                                    | Adopt. Four circular progress indicators for units, storage, API calls, and SMS  |
| **Automated dunning**                       | Failed payments should trigger a multi-step recovery sequence with escalating urgency                                                            | Adopt. 4-stage retry over 14 days with in-app banners and email notifications    |
| **Tax automation**                          | Manual tax calculation is error-prone and does not scale across Canadian provinces                                                               | Adopt. Stripe Tax for automatic GST/HST/PST/QST calculation per province         |
| **Invoice PDF generation**                  | Admins and board members need downloadable PDF invoices for accounting and audits                                                                | Adopt. Stripe Invoicing generates compliant PDF invoices                         |
| **Trial-first onboarding**                  | Allowing properties to explore the platform before committing reduces friction                                                                   | Adopt. 14-day free trial with all Professional features, no credit card required |
| **Graceful degradation on payment failure** | Locking users out immediately on a failed payment is hostile; read-only mode preserves data while motivating resolution                          | Adopt. Past-due accounts enter read-only mode, not deletion                      |

### Pitfalls Avoided

1. **No in-house card storage** -- Concierge never handles, stores, or transmits raw credit card numbers. All payment data lives in Stripe. This eliminates PCI DSS scope.
2. **No immediate account deletion on failed payment** -- accounts enter read-only mode with a 14-day grace period, then retain data for 90 days after cancellation.
3. **No hidden fees** -- pricing is per-unit, per-month, clearly displayed. No "contact us for pricing" on any tier except Enterprise custom quotes.
4. **No manual tax calculation** -- province-level tax is automated via Stripe Tax. Manual overrides are only for tax-exempt organizations.
5. **No single retry on failed payments** -- a 4-step retry schedule over 14 days maximizes recovery before restricting the account.
6. **No billing-only admin role gap** -- Board Members can access invoice history for financial oversight without seeing payment methods or plan controls.

---

## 3. Pricing Model

### 3.1 Tier Structure

Concierge uses a **per-unit, per-month** pricing model with three tiers. The unit count of the property determines which tier applies.

| Aspect              | Starter                               | Professional                          | Enterprise               |
| ------------------- | ------------------------------------- | ------------------------------------- | ------------------------ |
| **Unit Range**      | 1--50 units                           | 51--300 units                         | 300+ units               |
| **Billing**         | Per unit/month                        | Per unit/month                        | Custom quote             |
| **Annual Option**   | Pay 10 months, get 12 (2 months free) | Pay 10 months, get 12 (2 months free) | Custom terms             |
| **Volume Discount** | --                                    | --                                    | Available for 500+ units |

### 3.2 Feature Breakdown by Tier

| Feature                        | Starter   | Professional   | Enterprise       |
| ------------------------------ | --------- | -------------- | ---------------- |
| Package management             | Yes       | Yes            | Yes              |
| Event logging (standard types) | Yes       | Yes            | Yes              |
| Maintenance requests           | Yes       | Yes            | Yes              |
| Amenity booking                | Yes       | Yes            | Yes              |
| Announcements (email)          | Yes       | Yes            | Yes              |
| Resident portal                | Yes       | Yes            | Yes              |
| Shift log                      | Yes       | Yes            | Yes              |
| Unit management                | Yes       | Yes            | Yes              |
| Security console (standard)    | Yes       | Yes            | Yes              |
| Custom event types             | --        | Yes            | Yes              |
| Training / LMS module          | --        | Yes            | Yes              |
| Advanced reports & analytics   | --        | Yes            | Yes              |
| Vendor compliance tracking     | --        | Yes            | Yes              |
| 2FA enforcement                | --        | Yes            | Yes              |
| API access                     | --        | 1,000 calls/hr | 100,000 calls/hr |
| SMS notifications              | 100/month | 500/month      | 5,000/month      |
| Storage                        | 5 GB      | 50 GB          | 500 GB           |
| White-label branding           | --        | --             | Yes              |
| Multi-property dashboard       | --        | --             | Yes              |
| SLA guarantee                  | --        | --             | Yes              |
| Dedicated support              | --        | --             | Yes              |
| SSO integration                | --        | --             | Yes              |
| Custom integrations            | --        | --             | Yes              |
| Unlimited API calls            | --        | --             | Yes (100k/hr)    |

### 3.3 Free Trial

| Aspect                        | Detail                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| **Duration**                  | 14 calendar days                                                                        |
| **Credit card required**      | No                                                                                      |
| **Features available**        | All Professional tier features                                                          |
| **Unit limit during trial**   | 300 units (Professional maximum)                                                        |
| **Storage during trial**      | 50 GB                                                                                   |
| **API during trial**          | 1,000 calls/hr                                                                          |
| **SMS during trial**          | 50 messages (reduced to prevent abuse)                                                  |
| **Trial expiration behavior** | Account enters read-only mode. Data retained for 90 days.                               |
| **Trial extension**           | Super Admin can extend trial by up to 14 additional days                                |
| **Conversion prompt**         | Banner appears on day 10: "Your trial ends in 4 days. Choose a plan to keep your data." |

### 3.4 Annual Billing

Annual billing gives the property **12 months of service for the price of 10** -- effectively a 16.7% discount. The system calculates the annual price as:

```
annual_price = monthly_price_per_unit * unit_count * 10
```

Annual subscriptions:

- Are billed in a single upfront charge
- Auto-renew unless canceled at least 30 days before the renewal date
- Prorated refunds are available for the unused portion if canceled mid-term (at Super Admin discretion)
- Downgrades during an annual term take effect at the next renewal

---

## 4. Stripe Integration

### 4.1 Stripe Products Used

| Stripe Product             | Purpose in Concierge                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Stripe Billing**         | Manages subscription lifecycle -- creation, upgrades, downgrades, cancellations, prorations                                    |
| **Stripe Checkout**        | Hosted payment page for initial signup. Concierge redirects the Admin to Stripe's PCI-compliant checkout form                  |
| **Stripe Customer Portal** | Self-service portal where Admins update payment methods, view invoices, and manage billing details                             |
| **Stripe Webhooks**        | Asynchronous event notifications from Stripe to Concierge for subscription state changes, payment outcomes, and invoice events |
| **Stripe Tax**             | Automatic tax calculation based on the property's province. Handles GST, HST, PST, and QST                                     |
| **Stripe Invoicing**       | PDF invoice generation with tax breakdown, line items, and company details                                                     |

### 4.2 PCI Compliance

Concierge **never** handles raw credit card numbers. The payment flow is:

1. Admin clicks "Update Payment Method" in Concierge
2. Concierge creates a Stripe Customer Portal session via the API
3. Admin is redirected to Stripe's hosted portal (stripe.com domain)
4. Admin enters or updates card details on Stripe's PCI-compliant form
5. Stripe stores the card and returns a token
6. Concierge stores only: card brand, last 4 digits, and expiry date (for display purposes)

This architecture keeps Concierge entirely out of PCI DSS scope.

### 4.3 Webhook Events

Concierge listens for the following Stripe webhook events. Every webhook handler is **idempotent** -- processing the same event twice produces the same result.

| Webhook Event                   | Concierge Action                                                                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkout.session.completed`    | Activate the subscription. Set status to `active`. Record the Stripe customer ID, subscription ID, and payment method. Send welcome email. |
| `invoice.payment_succeeded`     | Record the payment in the Invoice table. Update subscription status to `active` if it was `past_due`. Store the Stripe invoice PDF URL.    |
| `invoice.payment_failed`        | Increment the `failed_payment_count`. Trigger the dunning sequence (see Section 6). Send failure notification to the billing contact.      |
| `customer.subscription.updated` | Sync plan changes (upgrades/downgrades). Update the local subscription record with new plan ID, unit count, and pricing.                   |
| `customer.subscription.deleted` | Set subscription status to `canceled`. Record the cancellation timestamp. Begin the 90-day data retention countdown.                       |
| `invoice.created`               | Store the draft invoice locally for display in the Admin billing dashboard.                                                                |
| `customer.tax_id.created`       | Record the tax exemption certificate association.                                                                                          |
| `payment_method.attached`       | Update the stored payment method display (brand, last4, expiry).                                                                           |

### 4.4 Webhook Security

| Measure                    | Implementation                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signature verification** | Every incoming webhook is verified using the Stripe webhook signing secret (`whsec_...`). Requests that fail verification are rejected with HTTP 400.                                  |
| **Idempotency**            | Each webhook event has a unique `event.id`. Concierge stores processed event IDs in a `stripe_webhook_events` table. Duplicate events are acknowledged (HTTP 200) but not reprocessed. |
| **Replay protection**      | Events older than 5 minutes (based on `event.created` timestamp) are rejected.                                                                                                         |
| **HTTPS only**             | The webhook endpoint (`/api/webhooks/stripe`) is only accessible over HTTPS.                                                                                                           |
| **IP allowlisting**        | Optional: restrict the webhook endpoint to Stripe's published IP ranges.                                                                                                               |

---

## 5. Subscription Lifecycle

### 5.1 State Machine

Every subscription passes through a defined set of states. Transitions are triggered by user actions or Stripe webhook events.

```
                     +---------+
                     |  trial  |
                     +----+----+
                          |
              user enters payment + selects plan
                          |
                     +----v----+
               +---->|  active |<----+
               |     +----+----+     |
               |          |          |
         payment     payment fails   payment
         succeeds         |          succeeds
               |     +----v----+     |
               +-----|past_due |-----+
                     +----+----+
                          |
                  3 failed retries over 14 days
                          |
                     +----v-----+
                     | canceled  |
                     +----+-----+
                          |
                   90 days elapsed (data anonymized)
                          |
                     +----v----+
                     | expired  |
                     +---------+
```

### 5.2 State Definitions

| State        | Description                                                    | User Experience                                                                                                       | Data Access                                                                                        |
| ------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **trial**    | Property is in a 14-day free trial. No payment method on file. | Full Professional features. Banner shows days remaining.                                                              | Full read/write                                                                                    |
| **active**   | Subscription is paid and current.                              | Normal operation. No banners.                                                                                         | Full read/write                                                                                    |
| **past_due** | Payment has failed. Dunning sequence is in progress.           | Warning banner: "Payment failed. Update your payment method." All features still work during the 14-day grace period. | Full read/write (grace period)                                                                     |
| **canceled** | Subscription was canceled (by Admin or by dunning completion). | Read-only mode. Banner: "Your subscription has been canceled. Reactivate to regain full access."                      | Read-only. No new events, no new maintenance requests, no new bookings. Existing data is viewable. |
| **expired**  | 90 days after cancellation. Data has been anonymized.          | Login disabled.                                                                                                       | None. Data anonymized per retention policy.                                                        |

### 5.3 Transition Rules

| From     | To       | Trigger                                      | Automated?                                 |
| -------- | -------- | -------------------------------------------- | ------------------------------------------ |
| trial    | active   | Admin enters payment and selects a plan      | No -- requires Admin action                |
| trial    | canceled | Trial expires without conversion             | Yes -- automatic after 14 days             |
| active   | past_due | `invoice.payment_failed` webhook received    | Yes -- automatic                           |
| active   | canceled | Admin cancels subscription                   | No -- requires Admin action + confirmation |
| past_due | active   | `invoice.payment_succeeded` webhook received | Yes -- automatic                           |
| past_due | canceled | 3 failed retries over 14 days                | Yes -- automatic                           |
| canceled | active   | Admin reactivates within 90 days and pays    | No -- requires Admin action                |
| canceled | expired  | 90 days elapse after cancellation            | Yes -- automatic (cron job)                |

### 5.4 Reactivation

Properties that canceled (voluntarily or via dunning) can reactivate within 90 days:

1. Admin logs in (login is still permitted in `canceled` state)
2. Admin navigates to Settings > Billing
3. System shows a "Reactivate" button with the last active plan pre-selected
4. Admin updates payment method if needed (via Stripe Customer Portal)
5. Admin confirms reactivation
6. Concierge creates a new Stripe subscription
7. Status transitions to `active`
8. All existing data becomes fully accessible again

After 90 days (in `expired` state), reactivation is not possible. The Admin must create a new property and re-import data.

---

## 6. Dunning Management (Failed Payments)

### 6.1 Retry Schedule

When a payment fails, Stripe and Concierge work together to recover the payment:

| Attempt     | Day    | Stripe Action             | Concierge Notification                                                                                                                                 |
| ----------- | ------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1st         | Day 0  | Automatic retry by Stripe | Email to billing contact: "Your payment of $X.XX failed. We will retry automatically. No action needed."                                               |
| 2nd         | Day 3  | Automatic retry by Stripe | Email to billing contact: "Second payment attempt failed. Please verify your payment method." In-app banner appears.                                   |
| 3rd         | Day 7  | Automatic retry by Stripe | Email to billing contact + all Property Admins: "Third attempt failed. Update your payment method within 7 days to avoid service interruption."        |
| 4th (final) | Day 14 | Final retry by Stripe     | Email to billing contact + all Property Admins: "Final notice: your account will be restricted to read-only mode tomorrow unless payment is resolved." |

### 6.2 Post-Dunning Actions

| Scenario           | Action                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Any retry succeeds | Subscription returns to `active`. Banners removed. Success email sent.                                                  |
| All 4 retries fail | Subscription transitions to `canceled`. Read-only mode enabled. Cancellation email sent with reactivation instructions. |

### 6.3 In-App Banners

During the dunning period, a persistent banner displays at the top of every page for Property Admins:

| Dunning Stage      | Banner Text                                                                                                                       | Banner Color     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Day 0--2           | "A recent payment failed. We're retrying automatically."                                                                          | Yellow (warning) |
| Day 3--6           | "Payment failed twice. Please update your payment method." [Update Payment] button                                                | Orange (urgent)  |
| Day 7--13          | "Action required: update your payment method within {days_remaining} days to avoid service interruption." [Update Payment] button | Red (critical)   |
| Day 14+ (canceled) | "Your subscription has been canceled due to payment failure. Your account is in read-only mode." [Reactivate] button              | Red (critical)   |

### 6.4 Banner Visibility Rules

- Banners are visible to **Property Admin** and **Property Manager** roles only
- Banners are **not** visible to residents, board members, or front-line staff (security, concierge)
- Banners persist across page navigation -- they cannot be dismissed
- The [Update Payment] button opens the Stripe Customer Portal in a new tab

### 6.5 Dunning Email Templates

All dunning emails are sent to the billing contact from `noreply@concierge.com`. Every email includes the invoice amount, the payment method last 4 digits, and a direct link to the Stripe Customer Portal for payment method updates.

| Stage  | Subject Line                                        | Body Summary                                                                                                         | CTA Button              |
| ------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Day 0  | "Payment failed — retrying automatically"           | "We couldn't process your payment for {PropertyName}. We'll retry automatically."                                    | "Update Payment Method" |
| Day 3  | "Action needed: Update your payment method"         | "Your payment for {PropertyName} has failed twice. Please update your payment method to avoid service interruption." | "Update Payment Method" |
| Day 7  | "Urgent: Service interruption in 7 days"            | "We've been unable to process your payment for {PropertyName}. Your account will be restricted on {Date}."           | "Update Payment Method" |
| Day 14 | "Final notice: Account will be restricted tomorrow" | "This is our final attempt. If payment cannot be processed, your property will enter read-only mode on {Date}."      | "Update Payment Method" |

---

## 7. Usage Metering

### 7.1 Tracked Metrics

Four metrics are tracked per property per billing cycle:

| Metric           | What It Measures                                    | How It Is Counted                                                                                                    |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Active Units** | Number of units with at least one resident assigned | Count of units where `unit.status = 'occupied'` or `unit.status = 'active'`. Determines billing tier.                |
| **Storage Used** | Total file storage consumed by uploads              | Sum of all file sizes: photos, documents, attachments across all modules. Measured in GB.                            |
| **API Calls**    | External API requests from integrations             | Count of authenticated requests to `/api/*` endpoints (excluding webhook endpoints). Tracked per hour and per month. |
| **SMS Sent**     | SMS notifications dispatched                        | Count of SMS messages sent via the notification system. Each recipient counts as one message.                        |

### 7.2 Tier Limits

| Metric               | Starter           | Professional | Enterprise |
| -------------------- | ----------------- | ------------ | ---------- |
| Active Units         | 50                | 300          | Unlimited  |
| Storage              | 5 GB              | 50 GB        | 500 GB     |
| API Calls (per hour) | 0 (no API access) | 1,000        | 100,000    |
| API Calls (monthly)  | 0                 | 100,000      | 10,000,000 |
| SMS (per month)      | 100               | 500          | 5,000      |

### 7.3 Overage Handling

Concierge uses a **warn-then-cap** approach. No surprise charges.

| Threshold            | Action                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **80% of any limit** | In-app notification to Property Admin: "You have used 80% of your {metric} allocation." Logged in the audit trail. |
| **90% of any limit** | Email notification to billing contact: "You are approaching your {metric} limit. Consider upgrading your plan."    |
| **100% of limit**    | Behavior depends on the metric (see below).                                                                        |

**At-limit behavior per metric:**

| Metric              | At 100%                                                                 | Enforcement                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active Units        | Cannot add new units. Existing units remain active.                     | Hard cap. Error message: "Unit limit reached. Upgrade your plan to add more units."                                                                                         |
| Storage             | Warning banner. Uploads continue but a 110% hard cap stops new uploads. | Soft cap at 100%, hard cap at 110%. Error: "Storage limit exceeded. Delete files or upgrade your plan."                                                                     |
| API Calls (hourly)  | API returns HTTP 429 (Too Many Requests) with a `Retry-After` header.   | Hard cap. Resets every hour.                                                                                                                                                |
| API Calls (monthly) | API returns HTTP 429 for the remainder of the billing cycle.            | Hard cap. Resets on billing cycle renewal.                                                                                                                                  |
| SMS                 | SMS notifications silently degrade to email-only.                       | Soft cap. No error shown to end users. Admin receives notification: "SMS limit reached. Notifications will be delivered via email for the remainder of this billing cycle." |

### 7.4 Usage Recording

Usage metrics are recorded in the `usage_records` table:

- **Active Units**: Recalculated daily at 00:00 UTC via a scheduled job. The billing-relevant count is the **peak daily value** during the billing cycle.
- **Storage**: Updated in real-time on every file upload or deletion. The billing-relevant value is the **current total**.
- **API Calls**: Incremented in real-time via middleware. Hourly counts reset on the hour. Monthly counts reset on the billing cycle date.
- **SMS**: Incremented in real-time when a message is dispatched. Resets on the billing cycle date.

---

## 8. Admin Billing Dashboard

This is the primary billing interface for Property Admins. It lives at **Settings > Billing** (Tab 12 in the Settings module).

### 8.1 Layout

The billing dashboard is a single scrollable page with 7 sections arranged vertically:

```
+----------------------------------------------------------+
|  CURRENT PLAN                                             |
|  [Plan name] [Unit count] [Monthly price] [Next billing]  |
|  [Change Plan]                                            |
+----------------------------------------------------------+
|  USAGE THIS BILLING CYCLE                                 |
|  [Units ○] [Storage ○] [API Calls ○] [SMS ○]             |
+----------------------------------------------------------+
|  PAYMENT METHOD                                           |
|  [Card icon] [Brand] ending [last4] | Expires [MM/YY]    |
|  [Update Payment Method]                                  |
+----------------------------------------------------------+
|  BILLING CONTACT                                          |
|  [Name] [Email]  [Edit]                                   |
+----------------------------------------------------------+
|  INVOICE HISTORY                                          |
|  [Table: Date | Description | Amount | Status | PDF]      |
+----------------------------------------------------------+
|  CANCEL SUBSCRIPTION                                      |
|  [Cancel Subscription] (destructive action, bottom of page)|
+----------------------------------------------------------+
```

### 8.2 Current Plan Card

| Element            | Detail                                                                          |
| ------------------ | ------------------------------------------------------------------------------- |
| Plan name          | "Starter", "Professional", or "Enterprise" displayed as a badge with tier color |
| Unit count         | "147 of 300 units" -- current occupied units vs tier maximum                    |
| Monthly price      | "$X.XX/month" or "$X.XX/year (annual billing)"                                  |
| Next billing date  | "Next invoice: April 1, 2026"                                                   |
| Billing cycle      | "Monthly" or "Annual" label                                                     |
| Change Plan button | Opens the plan comparison modal (see Section 8.5)                               |

### 8.3 Usage Meters

Four circular progress indicators displayed in a horizontal row. Each meter shows:

| Component                  | Description                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Circular progress ring** | Fills clockwise from 0% to 100%. Green (0--79%), yellow (80--89%), orange (90--99%), red (100%).                   |
| **Center number**          | Current value displayed large (e.g., "147" for units, "12.4 GB" for storage)                                       |
| **Label beneath**          | Metric name and limit (e.g., "Units: 147 / 300")                                                                   |
| **Tooltip on hover**       | Detailed breakdown. For storage: top 5 file categories by size. For API: calls in the last hour and monthly total. |

### 8.4 Payment Method

| Element        | Detail                                                               |
| -------------- | -------------------------------------------------------------------- |
| Card icon      | Visa, Mastercard, or Amex icon based on `brand` from Stripe          |
| Card details   | "{Brand} ending in {last4}"                                          |
| Expiry         | "Expires {MM/YY}"                                                    |
| Update button  | "Update Payment Method" -- opens Stripe Customer Portal in a new tab |
| Expiry warning | If the card expires within 30 days: yellow badge "Expiring soon"     |

### 8.5 Change Plan Modal

When the Admin clicks "Change Plan", a modal appears with a side-by-side comparison:

| Section                  | Content                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Current Plan column**  | Tier name, feature list with checkmarks, current price                                                               |
| **Target Plan column**   | Tier name, feature list with checkmarks, new price                                                                   |
| **Price Change Preview** | "Your new monthly price: $X.XX/month"                                                                                |
| **Proration**            | "Prorated credit for unused time on current plan: -$X.XX" or "Prorated charge for upgrade: +$X.XX"                   |
| **Effective Date**       | "Changes take effect immediately" (for upgrades) or "Changes take effect on your next billing date" (for downgrades) |
| **Confirm button**       | "Confirm Plan Change" -- primary action                                                                              |
| **Cancel button**        | "Keep Current Plan" -- secondary action                                                                              |

**Upgrade behavior**: Immediate. The property gains access to new features right away. Prorated charge for the remainder of the billing cycle.

**Downgrade behavior**: Deferred to next billing cycle. Current features remain available until the cycle ends. The system validates that the property's current usage fits within the lower tier's limits before allowing the downgrade.

**Downgrade validation rules:**

Before allowing a downgrade, the system validates current usage against the lower tier's limits. Downgrade validation runs at the moment of request, NOT at the end of the billing period. The following checks execute in order:

1. **Active units**: If the property's active unit count exceeds the lower tier's limit, reject the request. Message: "You have {N} active units. {TierName} supports up to {limit}. Reduce active units or choose a higher tier."
2. **Tier-locked features**: If the property is using features that require the current tier (custom event types, API webhooks, Training/LMS, white-label branding), reject the request. Message: "You are using features that require {CurrentTier}: {list}. Disable these features first or keep your current plan."
3. **Storage**: If the property's current storage usage exceeds the lower tier's limit, reject the request. Message: "Your storage usage ({X} GB) exceeds the {TierName} limit ({Y} GB). Free up storage before downgrading."

If all checks pass, the confirmation dialog shows the effective date (next billing cycle) and a summary of feature differences between the current and target tiers.

### 8.6 Cancel Subscription

Cancellation is a multi-step process designed to reduce churn:

**Step 1: Reason Survey**

When the Admin clicks "Cancel Subscription", a dialog appears:

| Field               | Type                     | Options                                                                                                                                                              |
| ------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cancellation reason | Radio buttons (required) | "Too expensive", "Switching to another product", "Missing features we need", "Building no longer needs management software", "Temporary -- we will be back", "Other" |
| Additional feedback | Textarea (optional)      | Max 1000 characters. Placeholder: "Tell us more about your decision so we can improve."                                                                              |

**Step 2: Retention Offer**

After submitting the reason, a retention offer is presented:

| Element        | Detail                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Headline       | "Before you go -- would 1 free month change your mind?"                                                           |
| Offer detail   | "We would like to offer you one month free on your current plan. Your next invoice would be on {date + 1 month}." |
| Accept button  | "Accept Free Month" -- applies the credit and closes the dialog                                                   |
| Decline button | "No thanks, proceed with cancellation"                                                                            |

**Step 3: Confirmation**

If the Admin declines the retention offer:

| Element        | Detail                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Warning text   | "Your subscription will remain active until {end_of_current_billing_cycle}. After that, your account will enter read-only mode. Your data will be retained for 90 days." |
| Confirm button | "Cancel My Subscription" -- destructive red button                                                                                                                       |
| Back button    | "Keep My Subscription" -- primary blue button                                                                                                                            |

### 8.7 Invoice History Table

| Column      | Type     | Description                                                  |
| ----------- | -------- | ------------------------------------------------------------ |
| Date        | Date     | Invoice creation date, formatted as "Mar 1, 2026"            |
| Description | Text     | "Professional Plan -- 147 units" or "Plan upgrade proration" |
| Amount      | Currency | "$1,470.00 CAD" -- always shows currency code                |
| Tax         | Currency | "$191.10 (HST 13%)" -- shows tax name and rate               |
| Total       | Currency | "$1,661.10 CAD"                                              |
| Status      | Badge    | Green "Paid", yellow "Pending", red "Failed"                 |
| PDF         | Link     | "Download" link to the Stripe-hosted invoice PDF             |

The table displays the most recent 12 invoices by default. A "View All" link loads the full history with pagination (20 per page).

### 8.8 Billing Contact

| Field         | Type                 | Validation                   | Description                                                                   |
| ------------- | -------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| Contact Name  | Text, max 200 chars  | Required, non-empty          | Person who receives billing communications                                    |
| Contact Email | Email, max 254 chars | Required, valid email format | Email address for invoices, payment failure alerts, and receipt confirmations |

The billing contact defaults to the Property Admin who created the property. It can be changed to any valid email address (does not need to be an existing user in the system).

---

## 9. Super Admin Revenue Dashboard

The Super Admin Revenue Dashboard provides a system-wide view of Concierge's business metrics. It is accessible only to users with the Super Admin role via **Super Admin Panel > Revenue**.

### 9.1 Key Metrics Cards

Six metric cards displayed in a 3-column, 2-row grid at the top of the dashboard:

| Metric                           | Calculation                                                                                         | Display Format                                                                   |
| -------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Total MRR**                    | Sum of all active subscriptions' monthly equivalent revenue                                         | "$XX,XXX.XX CAD"                                                                 |
| **Total Properties**             | Count of all properties in `active` or `past_due` state                                             | "XX properties" with tier breakdown (Starter: X, Professional: Y, Enterprise: Z) |
| **Churn Rate (30 days)**         | Properties canceled in the last 30 days / total active properties at the start of the period \* 100 | "X.X%" with up/down arrow vs previous period                                     |
| **Trial Conversion Rate**        | Trials converted to paid in the last 30 days / trials expired in the last 30 days \* 100            | "XX.X%" with up/down arrow                                                       |
| **Average Revenue Per Property** | Total MRR / total active properties                                                                 | "$X,XXX.XX CAD"                                                                  |
| **Past-Due Accounts**            | Count of properties in `past_due` state                                                             | "X accounts" -- red text if > 0                                                  |

### 9.2 MRR Growth Chart

A line chart showing MRR over time:

| Aspect  | Detail                                                                           |
| ------- | -------------------------------------------------------------------------------- |
| X-axis  | Months (scrollable, default: last 12 months)                                     |
| Y-axis  | Revenue in CAD                                                                   |
| Lines   | Total MRR (solid blue), New MRR (green), Churned MRR (red), Expansion MRR (teal) |
| Tooltip | Hover on any point shows exact value and date                                    |
| Export  | "Export as CSV" and "Export as PNG" buttons                                      |

### 9.3 Properties Table

A searchable, sortable, filterable table of all properties:

| Column        | Sortable | Filterable                                 | Description                                |
| ------------- | -------- | ------------------------------------------ | ------------------------------------------ |
| Property Name | Yes      | Search                                     | Property name with link to property detail |
| Plan          | Yes      | Dropdown (Starter/Professional/Enterprise) | Current tier                               |
| Units         | Yes      | Range slider                               | Active unit count                          |
| MRR           | Yes      | Range slider                               | Monthly revenue from this property         |
| Status        | Yes      | Dropdown (trial/active/past_due/canceled)  | Subscription status with color badge       |
| Last Payment  | Yes      | Date range                                 | Date of last successful payment            |
| Created       | Yes      | Date range                                 | Property creation date                     |

### 9.4 Churn Detail

A secondary view accessible via the "Churn Rate" metric card:

| Data Point              | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| Churned properties list | Table of properties that canceled in the selected period     |
| Cancellation reasons    | Aggregated pie chart of reasons from the cancellation survey |
| Revenue impact          | Total MRR lost to churn in the period                        |
| Average lifetime        | Mean subscription duration of churned properties             |

### 9.5 Past-Due Accounts List

A dedicated table showing all properties in dunning:

| Column          | Description                                           |
| --------------- | ----------------------------------------------------- |
| Property Name   | Link to property                                      |
| Amount Owed     | Outstanding invoice amount                            |
| Days Past Due   | Number of days since first failed payment             |
| Retry Stage     | "Attempt 1/4", "Attempt 2/4", etc.                    |
| Next Retry      | Date of the next automatic retry                      |
| Billing Contact | Name and email of the billing contact                 |
| Action          | "Send Reminder" button (sends a manual dunning email) |

---

## 10. Canadian Tax Handling

### 10.1 Tax Rates by Province

Concierge operates primarily in Canada. Tax rates are calculated automatically by Stripe Tax based on the property's billing address province.

| Province/Territory         | Tax Type  | Rate        | Total Tax |
| -------------------------- | --------- | ----------- | --------- |
| Ontario (ON)               | HST       | 13%         | 13%       |
| New Brunswick (NB)         | HST       | 15%         | 15%       |
| Newfoundland (NL)          | HST       | 15%         | 15%       |
| Nova Scotia (NS)           | HST       | 15%         | 15%       |
| Prince Edward Island (PE)  | HST       | 15%         | 15%       |
| Quebec (QC)                | GST + QST | 5% + 9.975% | 14.975%   |
| British Columbia (BC)      | GST + PST | 5% + 7%     | 12%       |
| Saskatchewan (SK)          | GST + PST | 5% + 6%     | 11%       |
| Manitoba (MB)              | GST + PST | 5% + 7%     | 12%       |
| Alberta (AB)               | GST       | 5%          | 5%        |
| Northwest Territories (NT) | GST       | 5%          | 5%        |
| Nunavut (NU)               | GST       | 5%          | 5%        |
| Yukon (YT)                 | GST       | 5%          | 5%        |

### 10.2 Tax on Invoices

Every Stripe-generated invoice includes:

| Invoice Element | Example                       |
| --------------- | ----------------------------- |
| Subtotal        | $1,470.00                     |
| GST (5%)        | $73.50                        |
| PST (7%)        | $102.90 (only for BC, SK, MB) |
| HST (13%)       | $191.10 (only for ON)         |
| QST (9.975%)    | $146.63 (only for QC)         |
| Total           | $1,661.10                     |

Only the applicable tax lines appear. An Ontario property sees only HST. A BC property sees GST and PST as separate lines.

### 10.3 Tax Exemption

Some properties (non-profit housing cooperatives, government buildings, Indigenous communities) may be tax-exempt:

| Step | Action                                                                  |
| ---- | ----------------------------------------------------------------------- |
| 1    | Admin navigates to Settings > Billing > Tax Exemption                   |
| 2    | Admin uploads a PDF of their tax exemption certificate                  |
| 3    | System stores the document and flags the subscription for manual review |
| 4    | Super Admin reviews the certificate in the Super Admin panel            |
| 5    | Super Admin approves or rejects the exemption                           |
| 6    | If approved: Stripe Tax ID is created, future invoices exclude tax      |
| 7    | If rejected: Admin is notified with the reason                          |

Tax exemption certificates expire. The system tracks the expiry date and sends a 30-day advance warning to the billing contact.

### 10.4 Annual Tax Summary

At the end of each calendar year (January 1--7), the system generates an annual tax summary for each property:

| Field          | Description                                  |
| -------------- | -------------------------------------------- |
| Total paid     | Sum of all invoices in the calendar year     |
| Total tax paid | Broken down by tax type (GST, HST, PST, QST) |
| Invoice count  | Number of invoices in the year               |
| PDF download   | A single PDF summarizing all tax payments    |

This report is accessible at Settings > Billing > Tax Summary and is also emailed to the billing contact.

---

## 11. Data Model

### 11.1 Subscription

| Field                  | Type        | Constraints                | Description                                                                        |
| ---------------------- | ----------- | -------------------------- | ---------------------------------------------------------------------------------- |
| id                     | UUID        | PK                         | Internal subscription ID                                                           |
| property_id            | UUID        | FK → properties.id, unique | One subscription per property                                                      |
| stripe_customer_id     | string(255) | Not null, unique           | Stripe Customer object ID (`cus_...`)                                              |
| stripe_subscription_id | string(255) | Nullable, unique           | Stripe Subscription object ID (`sub_...`). Null during trial if no payment method. |
| plan_tier              | enum        | Not null                   | `starter`, `professional`, `enterprise`                                            |
| status                 | enum        | Not null                   | `trial`, `active`, `past_due`, `canceled`, `expired`                               |
| unit_count             | integer     | Not null, min 1            | Number of units the property is billed for                                         |
| billing_cycle          | enum        | Not null                   | `monthly`, `annual`                                                                |
| trial_start            | timestamp   | Nullable                   | Start of the free trial period                                                     |
| trial_end              | timestamp   | Nullable                   | End of the free trial period                                                       |
| current_period_start   | timestamp   | Nullable                   | Start of the current billing period                                                |
| current_period_end     | timestamp   | Nullable                   | End of the current billing period                                                  |
| canceled_at            | timestamp   | Nullable                   | When the subscription was canceled                                                 |
| expires_at             | timestamp   | Nullable                   | 90 days after canceled_at. Data anonymized after this date.                        |
| billing_contact_name   | string(200) | Not null                   | Name of the billing contact                                                        |
| billing_contact_email  | string(254) | Not null                   | Email of the billing contact                                                       |
| cancellation_reason    | string(50)  | Nullable                   | Reason selected during cancellation                                                |
| cancellation_feedback  | text        | Nullable                   | Free-text feedback provided during cancellation                                    |
| failed_payment_count   | integer     | Not null, default 0        | Number of consecutive failed payment attempts                                      |
| created_at             | timestamp   | Not null                   | Record creation time                                                               |
| updated_at             | timestamp   | Not null                   | Last modification time                                                             |

### 11.2 Invoice

| Field             | Type        | Constraints             | Description                                                    |
| ----------------- | ----------- | ----------------------- | -------------------------------------------------------------- |
| id                | UUID        | PK                      | Internal invoice ID                                            |
| property_id       | UUID        | FK → properties.id      | The billed property                                            |
| subscription_id   | UUID        | FK → subscriptions.id   | The associated subscription                                    |
| stripe_invoice_id | string(255) | Not null, unique        | Stripe Invoice object ID (`in_...`)                            |
| amount_subtotal   | integer     | Not null                | Subtotal in cents (CAD)                                        |
| amount_tax        | integer     | Not null                | Tax amount in cents                                            |
| amount_total      | integer     | Not null                | Total in cents (subtotal + tax)                                |
| currency          | string(3)   | Not null, default 'cad' | ISO 4217 currency code                                         |
| status            | enum        | Not null                | `draft`, `open`, `paid`, `void`, `uncollectible`               |
| description       | string(500) | Nullable                | Line item description (e.g., "Professional Plan -- 147 units") |
| tax_breakdown     | jsonb       | Nullable                | Array of `{tax_type, rate, amount}` objects                    |
| invoice_pdf_url   | text        | Nullable                | URL to the Stripe-hosted PDF invoice                           |
| period_start      | timestamp   | Not null                | Billing period start                                           |
| period_end        | timestamp   | Not null                | Billing period end                                             |
| paid_at           | timestamp   | Nullable                | When the invoice was paid                                      |
| created_at        | timestamp   | Not null                | Record creation time                                           |

### 11.3 UsageRecord

| Field        | Type      | Constraints        | Description                                                                          |
| ------------ | --------- | ------------------ | ------------------------------------------------------------------------------------ |
| id           | UUID      | PK                 | Internal record ID                                                                   |
| property_id  | UUID      | FK → properties.id | The property being metered                                                           |
| metric       | enum      | Not null           | `active_units`, `storage_bytes`, `api_calls_hourly`, `api_calls_monthly`, `sms_sent` |
| value        | bigint    | Not null           | Current value of the metric                                                          |
| limit_value  | bigint    | Not null           | Tier limit for this metric                                                           |
| period_start | timestamp | Not null           | Start of the measurement period                                                      |
| period_end   | timestamp | Not null           | End of the measurement period                                                        |
| recorded_at  | timestamp | Not null           | When this record was captured                                                        |

### 11.4 PaymentMethod

| Field                    | Type        | Constraints            | Description                                 |
| ------------------------ | ----------- | ---------------------- | ------------------------------------------- |
| id                       | UUID        | PK                     | Internal ID                                 |
| property_id              | UUID        | FK → properties.id     | The property this payment method belongs to |
| stripe_payment_method_id | string(255) | Not null, unique       | Stripe PaymentMethod object ID (`pm_...`)   |
| brand                    | string(20)  | Not null               | Card brand: `visa`, `mastercard`, `amex`    |
| last4                    | string(4)   | Not null               | Last 4 digits of the card number            |
| exp_month                | integer     | Not null               | Card expiration month (1--12)               |
| exp_year                 | integer     | Not null               | Card expiration year (e.g., 2028)           |
| is_default               | boolean     | Not null, default true | Whether this is the default payment method  |
| created_at               | timestamp   | Not null               | Record creation time                        |
| updated_at               | timestamp   | Not null               | Last modification time                      |

### 11.5 StripeWebhookEvent

| Field           | Type        | Constraints      | Description                                           |
| --------------- | ----------- | ---------------- | ----------------------------------------------------- |
| id              | UUID        | PK               | Internal ID                                           |
| stripe_event_id | string(255) | Not null, unique | Stripe event ID for idempotency (`evt_...`)           |
| event_type      | string(100) | Not null         | Stripe event type (e.g., `invoice.payment_succeeded`) |
| processed_at    | timestamp   | Not null         | When the event was processed                          |
| payload         | jsonb       | Not null         | Full event payload for debugging                      |

---

## 12. API Endpoints

### 12.1 Admin Billing Endpoints

All endpoints require authentication. Role-based access is enforced per endpoint.

| Method | Path                         | Auth                             | Description                                                           | Request Body                     | Response                              |
| ------ | ---------------------------- | -------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ------------------------------------- |
| GET    | `/api/billing/subscription`  | Property Admin+                  | Get current subscription details                                      | --                               | `{ subscription }`                    |
| POST   | `/api/billing/checkout`      | Property Admin                   | Create a Stripe Checkout session for initial signup                   | `{ plan_tier, billing_cycle }`   | `{ checkout_url }`                    |
| POST   | `/api/billing/portal`        | Property Admin                   | Create a Stripe Customer Portal session for payment method management | --                               | `{ portal_url }`                      |
| GET    | `/api/billing/invoices`      | Property Admin, Board Member     | List invoices with pagination                                         | Query: `?page=1&per_page=20`     | `{ invoices[], total, page }`         |
| GET    | `/api/billing/usage`         | Property Admin, Property Manager | Get current usage metrics                                             | --                               | `{ units, storage, api_calls, sms }`  |
| POST   | `/api/billing/change-plan`   | Property Admin                   | Upgrade or downgrade the subscription                                 | `{ target_tier, billing_cycle }` | `{ subscription, proration_preview }` |
| POST   | `/api/billing/cancel`        | Property Admin                   | Cancel the subscription                                               | `{ reason, feedback? }`          | `{ subscription }`                    |
| POST   | `/api/billing/reactivate`    | Property Admin                   | Reactivate a canceled subscription                                    | `{ plan_tier, billing_cycle }`   | `{ checkout_url }`                    |
| GET    | `/api/billing/tax-summary`   | Property Admin                   | Get annual tax summary                                                | Query: `?year=2025`              | `{ summary, pdf_url }`                |
| POST   | `/api/billing/tax-exemption` | Property Admin                   | Upload tax exemption certificate                                      | Multipart: `certificate` (PDF)   | `{ exemption_request }`               |

### 12.2 Super Admin Revenue Endpoints

| Method | Path                                  | Auth        | Description                                        | Response                                                                            |
| ------ | ------------------------------------- | ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| GET    | `/api/admin/revenue/overview`         | Super Admin | Revenue dashboard metrics (MRR, churn, conversion) | `{ mrr, properties_by_tier, churn_rate, conversion_rate, avg_revenue }`             |
| GET    | `/api/admin/revenue/mrr-history`      | Super Admin | MRR over time for charting                         | `{ data_points[] }` with `{ date, total_mrr, new_mrr, churned_mrr, expansion_mrr }` |
| GET    | `/api/admin/revenue/properties`       | Super Admin | All properties with billing info                   | `{ properties[], total, page }`                                                     |
| GET    | `/api/admin/revenue/past-due`         | Super Admin | Properties in dunning                              | `{ properties[] }`                                                                  |
| GET    | `/api/admin/revenue/churn`            | Super Admin | Churn analysis                                     | `{ churned_properties[], reasons_breakdown, revenue_impact }`                       |
| POST   | `/api/admin/revenue/send-reminder`    | Super Admin | Send manual dunning reminder                       | `{ property_id }`                                                                   | `{ success }`      |
| POST   | `/api/admin/trial/extend`             | Super Admin | Extend a property's trial                          | `{ property_id, days }`                                                             | `{ subscription }` |
| PUT    | `/api/admin/tax-exemption/:id/review` | Super Admin | Approve or reject tax exemption                    | `{ status, reason? }`                                                               | `{ exemption }`    |

### 12.3 Stripe Webhook Endpoint

| Method | Path                   | Auth                          | Description                                                                                                  |
| ------ | ---------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| POST   | `/api/webhooks/stripe` | Stripe signature verification | Receives all Stripe webhook events. Not authenticated via user session -- verified by Stripe signing secret. |

**Webhook handler pseudocode:**

```
POST /api/webhooks/stripe
1. Read raw request body
2. Verify Stripe signature using webhook signing secret
3. If signature invalid → return 400
4. Parse event from body
5. Check stripe_webhook_events table for event.id
6. If already processed → return 200 (idempotent)
7. Check event.created timestamp (reject if > 5 minutes old)
8. Switch on event.type:
   - checkout.session.completed → activateSubscription()
   - invoice.payment_succeeded → recordPayment()
   - invoice.payment_failed → triggerDunning()
   - customer.subscription.updated → syncPlanChange()
   - customer.subscription.deleted → handleCancellation()
   - invoice.created → storeDraftInvoice()
   - customer.tax_id.created → recordTaxExemption()
   - payment_method.attached → updatePaymentMethod()
9. Insert event.id into stripe_webhook_events
10. Return 200
```

---

## 13. Edge Cases

### 13.1 Downgrade Validation

| Scenario                                                                                                | Behavior                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Admin on Professional (147 units) tries to downgrade to Starter (max 50 units)                          | Block the downgrade. Display: "Your property has 147 active units. Starter plan supports up to 50 units. Reduce your unit count before downgrading." |
| Admin on Professional (45 units) with 30 GB storage tries to downgrade to Starter (max 5 GB)            | Block the downgrade. Display: "Your property is using 30 GB of storage. Starter plan includes 5 GB. Delete files before downgrading."                |
| Admin on Professional (45 units, 3 GB storage, using API) tries to downgrade to Starter (no API access) | Warn but allow. Display: "Starter plan does not include API access. Your existing API integrations will stop working. Proceed?"                      |
| Admin on Enterprise tries to downgrade to Professional with active SSO                                  | Block. Display: "SSO is an Enterprise feature. Disable SSO before downgrading."                                                                      |

### 13.2 Trial Edge Cases

| Scenario                                                                  | Behavior                                                                                                                                                               |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trial expires on a Saturday or Sunday                                     | Extend automatically to the following Monday at 09:00 local time (based on property timezone)                                                                          |
| Admin starts trial, imports 200 units, trial expires                      | Account enters read-only. All 200 units and data are preserved for 90 days.                                                                                            |
| Admin starts trial, converts to Starter (max 50 units) but has 200 units  | Block conversion to Starter. Suggest Professional. Display: "You have 200 active units. The Starter plan supports up to 50 units. We recommend the Professional plan." |
| Two Admins from the same property try to convert the trial simultaneously | The first request wins. The second receives: "This subscription has already been activated."                                                                           |

### 13.3 Currency

| Scenario                                       | Behavior                                                                                                                          |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Property billing address is in Canada          | All pricing, invoices, and payments in CAD                                                                                        |
| Property billing address is in the US          | All pricing, invoices, and payments in USD. Stripe handles currency. Tax calculation uses US address rules (no Canadian GST/HST). |
| Property requests a currency not in {CAD, USD} | Not supported. Display: "Concierge currently supports billing in Canadian Dollars (CAD) and US Dollars (USD)."                    |

### 13.4 Tax Edge Cases

| Scenario                                           | Behavior                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe Tax API fails during invoice creation       | Default to the highest applicable rate for the province. Log the failure. Alert the engineering team via monitoring. Retry tax calculation on the next invoice. |
| Property moves provinces (billing address changes) | New tax rate applies starting from the next billing cycle. Current cycle continues at the old rate.                                                             |
| Tax exemption certificate expires                  | 30-day advance email warning. If not renewed by expiry, tax is re-applied on the next invoice.                                                                  |

### 13.5 Stripe Outage

| Scenario                                       | Behavior                                                                                                                                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe API unreachable during checkout         | Display: "Payment processing is temporarily unavailable. Please try again in a few minutes." Log the error. No retry queue for user-initiated actions.                                                                                        |
| Stripe API unreachable during webhook delivery | Stripe automatically retries webhooks for up to 3 days with exponential backoff. No action needed from Concierge.                                                                                                                             |
| Stripe API unreachable during plan change      | Queue the plan change request in a `pending_plan_changes` table. A background job retries every 5 minutes for up to 1 hour. If still failing, notify the Admin: "Your plan change is being processed. We will email you when it is complete." |
| Stripe API unreachable during usage metering   | Usage data is stored locally regardless of Stripe availability. Stripe sync is eventually consistent.                                                                                                                                         |

### 13.6 Duplicate Webhook Events

| Scenario                                                                                                                       | Behavior                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe sends the same `invoice.payment_succeeded` event twice                                                                  | The `stripe_webhook_events` table is checked for the event ID. The second delivery is acknowledged with HTTP 200 but not reprocessed.                                        |
| Stripe sends two different events for the same logical action (e.g., `customer.subscription.updated` for the same plan change) | Each event has a unique ID and is processed independently. The subscription record is updated idempotently -- applying the same plan change twice results in the same state. |

### 13.7 Concurrency

| Scenario                                                   | Behavior                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two Admins attempt to change the plan simultaneously       | Optimistic locking on the `subscriptions` table using `updated_at`. The second request fails with: "The subscription was just modified. Please refresh and try again." |
| Admin changes plan while a webhook is processing a payment | Database transactions ensure atomicity. The plan change and payment processing use row-level locks on the subscription record.                                         |

---

_Last updated: 2026-03-16_
_Author: Concierge Product Team_
