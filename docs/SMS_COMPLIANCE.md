# SMS Messaging Compliance Setup

## Overview
LawnDesk is compliant with carrier requirements for SMS campaign registration. All users must explicitly opt-in to receive SMS notifications.

## Implementation

### 1. Database Schema
New columns added to `profiles` table:
- `sms_consent` (BOOLEAN) — Tracks whether user has opted in to receive SMS
- `sms_consent_at` (TIMESTAMPTZ) — Timestamp of when consent was given

### 2. Signup Flow
**Location**: `/login?signup=true`

New users must check a consent checkbox before creating their account:

```
☐ I agree to receive SMS notifications regarding my service, scheduling, and billing. Terms apply.
```

This consent is:
- **Required** — User cannot create account without checking the box
- **Explicit** — Checkbox clearly states what they're opting into
- **Tracked** — `sms_consent: true` and `sms_consent_at: <timestamp>` stored in database

### 3. Booking Page Opt-In
**Location**: `/book/[username]`

Clients requesting services can provide their phone number on the public booking form. When they submit:
- Their phone number is stored in `booking_requests.client_phone`
- This serves as implicit consent for the business owner to contact them about that specific request
- Business owner is only notified if they have `booking_notify_sms: true` in settings

### 4. Settings Page
**Location**: `/settings`

Business owners can toggle SMS notifications in settings:
- `booking_notify_sms` — Notify when client requests booking
- `ai_notify_owner` — Notify when AI receptionist takes a call
- `ai_text_caller` — Text caller with confirmation link

These are **opt-out** mechanisms — users can disable SMS at any time.

## Carrier Registration Checklist

When registering SMS campaigns with carriers like Twilio, you can confirm:

- ✅ Users explicitly opt-in during signup with clear consent language
- ✅ Consent timestamp is recorded (`sms_consent_at`)
- ✅ Privacy policy available at `https://lawndesk.pro/privacy`
- ✅ Terms of service available at `https://lawndesk.pro/terms`
- ✅ Opt-out mechanism: Users can disable SMS in settings at any time
- ✅ Clear purpose: SMS are for service, scheduling, and billing notifications

## Messaging Compliance

All SMS messages sent from LawnDesk will include:
- **Clear sender ID** — "LawnDesk" or your Twilio number
- **Opt-out instructions** — "Reply HELP for help, STOP to cancel" in footer of automated messages
- **No age-gated content** — All content is business/service related
- **No embedded links to external sites** — Only links to LawnDesk

## Files Modified

1. `supabase/migrations/20260402000001_sms_consent_column.sql` — Database schema
2. `app/login/page.tsx` — Added consent checkbox to signup form
