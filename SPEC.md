# LawnDesk — Project Specification

## 1. Project Overview

**LawnDesk** is a SaaS business management platform for lawn care and landscaping businesses. It eliminates paperwork by consolidating client management, job scheduling, invoicing, quoting, recurring job automation, worker coordination, and online booking in a single mobile-friendly application.

**Target Users:**
- Landscaping business owners/operators (owners)
- Lawn care workers (workers)
- Their clients (receive invoices, book services)
- Platform administrators (admin.lawndesk@gmail.com)

**Business Model:**
- 14-day free trial (Pro plan), full feature access
- **Starter Plan:** $19/month — clients, jobs, invoicing, quotes, client portal
- **Pro Plan:** $39/month — Starter + unlimited team, worker app, booking page, recurring jobs, SMS, route optimization
- Subscriptions via Stripe, cancel anytime

---

## 2. Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16.2.1 |
| Runtime | React | 19.2.4 |
| Styling | Tailwind CSS | 4 (via `@tailwindcss/postcss`) |
| Database | Supabase (PostgreSQL) | 2.99.3 |
| Auth | Supabase Auth | via `@supabase/ssr` 0.9.0 |
| Payments | Stripe | 20.4.1 |
| Error Tracking | Sentry | 10.46.0 |
| Hosting | Vercel | production |
| Icons | Lucide React | 1.0.1 |

**External Services:**
- Supabase Edge Functions (SMS via Twilio, email via Resend)
- UptimeRobot (infrastructure monitoring)
- Stripe Webhooks (subscription & payment events)
- Google Maps (route optimization)

---

## 3. User Roles & Auth Flow

### Roles

| Role | Access | Notes |
|------|--------|-------|
| `admin` | `/admin` dashboard, all preview views | Platform superadmin only (admin.lawndesk@gmail.com) |
| owner (no role field) | `/dashboard` and all owner pages | Lawn care business owner |
| `worker` | `/worker` only | Scoped to owner via `owner_id` |
| client | Public pages only | No account, uses share tokens |

### Auth Redirect Logic (app/auth/callback/page.tsx)

```
Login → /auth/callback → getRedirect(userId)
  role='admin'           → /admin
  role='worker'          → /worker
  no stripe_customer_id  → /pricing
  default                → /dashboard
```

### Subscription Gate (useSubscriptionGate hook)

On every protected page load:
- No session → `/login`
- Worker → `/worker`
- Trialing + valid `trial_ends_at` → allow
- Active or past_due subscription → allow
- Else → `/pricing`

---

## 4. Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, matches auth.users.id |
| `role` | text | `'admin'` or `'worker'` (null = owner) |
| `email` | text | Mirrors auth email |
| `name` | text | Display name |
| `owner_id` | uuid | FK to profiles.id (parent for workers) |
| `business_name` | text | Lawn care business name |
| `phone` | text | Business phone |
| `stripe_customer_id` | text | Stripe customer ID |
| `subscription_status` | text | `'trialing'`, `'active'`, `'past_due'`, `'cancelled'` |
| `subscription_plan` | text | `'starter'` or `'pro'` |
| `trial_ends_at` | timestamp | Free trial expiry |
| `booking_username` | text | URL slug for `/book/[username]` (unique) |
| `booking_enabled` | boolean | Whether booking page is active |
| `booking_notify_sms` | boolean | SMS alert on new booking request |
| `booking_notify_email` | boolean | Email alert on new booking request |
| `booking_welcome_message` | text | Custom message on booking page |
| `google_review_link` | text | Google Business review URL |
| `onboarding_complete` | boolean | Completed onboarding flow |
| `permissions` | jsonb | Worker permissions e.g. `{see_all_jobs: true}` |
| `username` | text | May differ from booking_username — used for public page lookup |
| `created_at` | timestamp | Account created |

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to profiles.id (owner) |
| `name` | text | Client name |
| `email` | text | Client email |
| `phone` | text | Client phone |
| `address` | text | Property address |
| `notes` | text | Gate codes, pet warnings, parking notes |
| `created_at` | timestamp | |

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to profiles.id (owner) |
| `client_id` | uuid | FK to clients.id |
| `client_name` | text | Denormalized |
| `title` | text | Job title / service type |
| `date` | date | YYYY-MM-DD |
| `time` | text | HH:MM |
| `status` | text | `'🔵 Scheduled'`, `'🟡 In Progress'`, `'🟢 Completed'`, `'🔴 Cancelled'` |
| `notes` | text | Job instructions |
| `worker_notes` | text | Notes from assigned worker |
| `assigned_to` | uuid | FK to profiles.id (worker, optional) |
| `clocked_in_at` | timestamp | Worker clock-in time |
| `clocked_out_at` | timestamp | Worker clock-out time |
| `recurring` | text | `'🔂 One-time'`, `'🔄 Weekly'`, `'🔄 Biweekly'`, `'🔄 Monthly'` |
| `created_at` | timestamp | |

### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to profiles.id (owner) |
| `client_id` | uuid | FK to clients.id |
| `client_name` | text | Denormalized |
| `client_email` | text | |
| `client_phone` | text | |
| `amount` | numeric | Invoice total |
| `status` | text | `'🟡 Unpaid'`, `'🟢 Paid'`, `'🔴 Overdue'` |
| `due_date` | date | |
| `description` | text | Line item description |
| `invoice_number` | int | Sequential per owner |
| `share_token` | uuid | Public access token |
| `stripe_payment_id` | text | Set when paid online |
| `created_at` | timestamp | |

### `quotes`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to profiles.id (owner) |
| `client_id` | uuid | FK to clients.id (optional) |
| `client_name` | text | |
| `client_email` | text | |
| `client_phone` | text | |
| `title` | text | e.g. "Spring Cleanup" |
| `description` | text | |
| `line_items` | jsonb | Array of `{description, quantity, unit_price}` |
| `amount` | numeric | Sum of line items |
| `status` | text | `'draft'`, `'sent'`, `'approved'`, `'declined'`, `'converted'` |
| `share_token` | uuid | Public access token |
| `expires_at` | timestamp | |
| `notes` | text | Internal notes |
| `job_id` | uuid | Set if converted to job |
| `created_at` | timestamp | |

### `booking_requests`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `owner_id` | uuid | FK to profiles.id (business owner) |
| `client_name` | text | |
| `client_email` | text | Optional |
| `client_phone` | text | |
| `service_type` | text | e.g. "🌿 Lawn Mowing" |
| `preferred_date` | date | Optional |
| `preferred_time` | text | Optional |
| `message` | text | Client message |
| `status` | text | `'pending'`, `'accepted'`, `'declined'` |
| `created_at` | timestamp | |

### `stripe_webhooks` (Audit Log)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `event_id` | text | Stripe event ID (unique) |
| `event_type` | text | e.g. `'checkout.session.completed'` |
| `event_data` | jsonb | Full Stripe payload |
| `processed` | boolean | |
| `processing_error` | text | |
| `processed_at` | timestamp | |
| `retry_count` | int | Max 3 retries |
| `created_at` | timestamp | |

### RLS Summary
- `clients`, `jobs`, `invoices`, `quotes` → users see only their own (`user_id = auth.uid()`)
- `profiles` → public read (for booking page username lookup), own write only
- `stripe_webhooks` → admin only

---

## 5. Routes & Pages

### Public (No Auth)
| Route | Purpose |
|-------|---------|
| `/` | Landing page: hero, features, pricing preview, testimonials, FAQ |
| `/login` | Email/password login + signup toggle (`?signup=true`) |
| `/signup-success` | "Check your email" confirmation screen |
| `/auth/callback` | Email verification, redirects by role |
| `/pricing` | Full pricing page with Stripe checkout buttons |
| `/book/[username]` | Public booking form for clients |
| `/invoice/[token]` | View & pay invoice via share token |
| `/quote/[token]` | View & approve/decline quote via share token |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### Protected — Owner
| Route | Purpose |
|-------|---------|
| `/dashboard` | Stats, upcoming jobs, overdue invoices, quick actions |
| `/clients` | Client roster, add/edit/delete, search/filter |
| `/jobs` | Job list, create/edit, status tracking, recurring jobs |
| `/calendar` | Monthly job calendar, route optimization |
| `/quotes` | Create/send/track quotes, convert to invoice/job |
| `/invoices` | Create/send invoices, mark paid, track overdue |
| `/requests` | Incoming booking requests from public page |
| `/team` | Manage workers, assign jobs, set permissions |
| `/settings` | Billing, booking config, password, account deletion |
| `/onboarding` | 3-step setup: business name, phone, booking username |

### Protected — Worker
| Route | Purpose |
|-------|---------|
| `/worker` | Day/week job view, clock in/out, field notes, "On My Way" SMS |

### Admin Only
| Route | Purpose |
|-------|---------|
| `/admin` | User table, subscription metrics, uptime status, preview-as buttons |

---

## 6. API Routes

### `POST /api/create-checkout-session`
Creates Stripe checkout session with 14-day trial.
- Body: `{ priceId, email, userId }`
- Returns: `{ url }` → Stripe hosted checkout

### `POST /api/create-portal-session`
Creates Stripe billing portal session.
- Body: `{ userId }`
- Returns: `{ url }` → Stripe portal

### `POST /api/stripe-webhook`
Handles Stripe events (signature verified).
- `checkout.session.completed` → create/update subscription or mark invoice paid
- `customer.subscription.updated` → update status & plan
- `customer.subscription.deleted` → status = cancelled
- `invoice.payment_failed` → status = past_due
- `invoice.payment_succeeded` → status = active
- Idempotent via `stripe_webhooks` table

### `GET /api/admin/users`
Returns all user accounts with subscription info.
- Auth: Bearer token, must match `ADMIN_EMAIL`

### `GET /api/uptimerobot-status`
Fetches UptimeRobot API for monitor health.
- Returns: `{ allUp, downCount, totalMonitors }`

---

## 7. Third-Party Integrations

### Stripe Price IDs
- Starter: `price_1TDXflC4da9Jmue97LkfChat` ($19/mo)
- Pro: `price_1TDXsmC4da9Jmue93UnMFCbZ` ($39/mo)

### Supabase Edge Functions
- `send-sms` → Twilio SMS
- `send-quote-email` → Resend email with quote
- `send-invoice-email` → Resend email with invoice

### UptimeRobot
- Public page: https://stats.uptimerobot.com/hAsUIV5kKi
- API used by `/api/uptimerobot-status`

### Sentry
- Initialized via `SentryInitializer` component in root layout
- Client config: `sentry.client.config.ts`
- Server config: `sentry.server.config.ts`

---

## 8. Business Logic

### Trial Logic
```ts
const inTrial =
  subscription_status === 'trialing' &&
  trial_ends_at &&
  new Date(trial_ends_at) > new Date()
```

### Worker Scoping
- Worker's `owner_id` → filters all data queries
- `permissions.see_all_jobs` → sees all owner jobs vs only assigned jobs
- Workers redirected away from `/admin` and all owner pages

### Client Booking Flow
1. Owner sets `booking_username` in onboarding/settings
2. Client visits `/book/[username]`
3. Form: name, phone, service, date, message
4. Inserted into `booking_requests` table
5. Owner notified via SMS/email based on settings

### Invoice Flow
1. Create invoice → sequential `invoice_number`, generate `share_token`
2. Auto-send email if client email exists
3. Client pays at `/invoice/[token]` via Stripe
4. Webhook marks `status = '🟢 Paid'`

### Quote Flow
1. Create quote with line items → calculate total
2. Generate `share_token`, send to client
3. Client approves/declines at `/quote/[token]`
4. Owner converts to invoice or job

### Recurring Jobs
- Creating a recurring job generates instances 3 months out
- Each instance is a separate `jobs` row

### Admin Preview Mode
- Admin clicks "Owner Dashboard", "Worker View", or "Client Booking" in `/admin`
- `AdminViewBanner` component shown on destination pages
- Banner indicates current preview mode with link back to `/admin`

---

## 9. Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdminViewBanner` | `components/AdminViewBanner.tsx` | Banner shown when admin previews a user view |
| `UptimeRobotStatus` | `components/UptimeRobotStatus.tsx` | Fetches and displays infrastructure status |
| `SentryInitializer` | `components/SentryInitializer.tsx` | Initializes Sentry client-side (null render) |
| `StructuredData` | `components/StructuredData.tsx` | JSON-LD SEO data in `<head>` |
| `JobPhotoUpload` | `components/JobPhotoUpload.tsx` | Before/after photo upload for workers |
| `JobPhotoGallery` | `components/JobPhotoGallery.tsx` | Display uploaded job photos |

### Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `lib/useAuth.ts` | Session management, auto-redirect if unauthenticated |
| `useProfile` | `lib/useProfile.ts` | Fetch profile row (role, name, owner_id) |
| `useSubscriptionGate` | `lib/useSubscriptionGate.ts` | Gate pages behind active subscription |

---

## 10. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Admin
ADMIN_EMAIL=admin.lawndesk@gmail.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# UptimeRobot
NEXT_PUBLIC_UPTIMEROBOT_API_KEY=
```

---

## 11. Key Business Rules

1. One business per account — one `business_name`, one `booking_username`
2. Workers scoped to owner via `owner_id` — can never see another owner's data
3. Invoices auto-mark overdue if `due_date < today` on dashboard load
4. Booking page requires `booking_enabled = true`
5. Trial auto-converts at end — active if card valid, past_due if not
6. Share tokens are permanent (invoices/quotes accessible forever)
7. Photos are per-job (before/after tied to specific job)
8. SMS notifications require owner phone to be set
9. Admin account (admin.lawndesk@gmail.com) redirects to `/admin` on login
10. Admin can preview owner/worker/client views with persistent banner
