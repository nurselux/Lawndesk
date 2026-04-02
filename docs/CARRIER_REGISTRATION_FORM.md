# Carrier Registration Form — Completed Answers

Use these values when registering your SMS campaigns with carriers (Twilio, RingCentral, etc.).

---

## How Do End-Users Consent to Receive Messages?

**Answer:**
> End users opt-in by creating an account at https://lawndesk.pro/signup where they check a box that says 'I agree to receive SMS notifications regarding my service, scheduling, and billing.' Consent is also gathered when customers request a quote via the public booking page at https://lawndesk.pro/book/[username].

**Why this answer is compliant:**
- Explicit checkbox consent on dedicated signup page
- Consent is tracked with timestamp in database (`sms_consent_at`)
- Public booking page captures phone number (implicit consent for that specific request)
- Users can opt-out at any time via account settings
- Clear Terms & Privacy links on signup form

**Why this answer is compliant:**
- Explicit checkbox consent during account creation
- Consent is tracked with timestamp in database (`sms_consent_at`)
- Public booking page captures phone number (implicit consent for that specific request)
- Users can opt-out at any time via account settings

---

## Privacy Policy URL

**Enter:** `https://lawndesk.pro/privacy`

---

## Terms and Conditions URL

**Enter:** `https://lawndesk.pro/terms`

---

## Opt-in Keywords

**Answer:** Leave blank

**Why:** LawnDesk does not support text-to-join opt-in. Users must opt-in via the signup form checkbox or booking page phone submission.

---

## Opt-in Message

**Enter:**
> LawnDesk: You are now opted-in for service alerts. Message frequency varies. Msg & data rates may apply. Reply HELP for help, STOP to cancel.

**Why this works:**
- Confirms enrollment to recurring message campaign
- Includes clear opt-out instructions (STOP to cancel)
- Includes help keyword (HELP)
- Mentions message frequency and data rates (required by carriers)
- Includes brand name "LawnDesk" (carrier requirement)

---

## Sample Messages for Carrier Registration

### Sample Message #4
**Enter:**
> LawnDesk: A new quote for your seasonal aeration is ready for approval at https://lawndesk.pro/dashboard. Text HELP for help.

### Sample Message #5
**Enter:** (Leave blank - not applicable)

**Why:** No one-time passcodes are used. All access is via account login.

---

## Compliance Checklist

Before submitting your carrier registration:

- ✅ Explicit opt-in mechanism documented
- ✅ Privacy policy URL is live and accessible
- ✅ Terms of service URL is live and accessible
- ✅ Opt-out instructions in Terms of Service
- ✅ Support contact available (support@lawndesk.com)
- ✅ Message samples provided
- ✅ No marketing/age-gated content
- ✅ Clear opt-out path (STOP keyword + settings toggle)
- ✅ Help keyword defined (HELP)

---

## Notes for Review

**Carrier approval tips:**
1. **Be specific** — "service reminders, scheduling, and billing" is more compliant than vague "promotional messages"
2. **Provide real examples** — Show actual message content you'll send
3. **Document opt-out** — Multiple methods (STOP keyword + account settings)
4. **Include support** — Carriers want to know users can get help

Your registration should be approved quickly with these answers!
