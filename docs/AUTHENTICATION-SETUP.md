# LifelineX — Production Authentication & Identity Setup Guide

**Architecture Version**: 2.0  
**Authentication Standard**: Supabase Auth (OAuth 2.0 PKCE + E.164 Phone SMS OTP)  
**Security Standard**: Row-Level Security (RLS) + Canonical `auth.users.id`  
**Authentication Status**: **CONDITIONALLY READY — CONFIGURATION REQUIRED**

---

## 1. Overview & Canonical Identity Model

LifelineX uses a zero-trust, privacy-conscious authentication architecture designed for emergency healthcare coordination:
- **Canonical Identity**: Every user account is strictly anchored to Supabase `auth.users.id`.
- **Database Linking**: The `profiles` table references `auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE`.
- **Phone-First Architecture**: Email is optional for citizen and trauma emergency dispatch. Phone numbers are stored with unique constraints.
- **Role Isolation**: Only unprivileged citizen roles (`PATIENT`, `DONOR`) can be self-assigned during initial onboarding. Privileged roles (`HOSPITAL_ADMIN`, `BLOOD_BANK_ADMIN`, `AMBULANCE_PROVIDER_ADMIN`, `LIFELINEX_ADMIN`, `SUPER_ADMIN`) require verified state institutional authorization.

---

## 2. Authentication Methods

### Method 1: Google OAuth Sign-In
- **Protocol**: OAuth 2.0 Authorization Code with PKCE.
- **Frontend Method**: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: VITE_APP_URL } })`.
- **Secret Safety**: No Google Client Secrets are stored or exposed in client bundles. Supabase handles backend token exchange securely.
- **Profile Matching**: Upon redirect callback, LifelineX checks whether a profile exists with `auth_user_id = user.id`. If no profile exists, the user is automatically transitioned to `/profile-setup`.

### Method 2: Phone Number + SMS OTP
- **Protocol**: E.164 format international phone authentication.
- **Default Calling Code**: India (`+91`). Supported international codes: `+1`, `+44`, `+65`, `+971`.
- **Frontend Methods**:
  - Send OTP: `supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } })`.
  - Verify OTP: `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`.
- **Input Experience**:
  - 6 individual auto-advancing input boxes.
  - Backspace navigation.
  - Full 6-digit paste support.
  - 60-second resend countdown timer with rate limiting protection.
  - Number masking (e.g. `+91 98765 XXXXX`) for on-screen privacy.

---

## 3. Step-by-Step Provider Configuration

### Step A: Google Cloud Console Setup
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Application type: **Web application**).
3. Under **Authorized JavaScript Origins**, add:
   ```text
   http://localhost:5173
   https://<your-supabase-project-id>.supabase.co
   ```
4. Under **Authorized Redirect URIs**, add your Supabase Auth callback URL:
   ```text
   https://<your-supabase-project-id>.supabase.co/auth/v1/callback
   ```
5. Copy the generated **Client ID** and **Client Secret**.

### Step B: Supabase Auth Configuration (Google)
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** -> **Providers** -> **Google**.
3. Toggle Google to **Enabled**.
4. Paste the **Client ID** and **Client Secret** obtained from Google Cloud.
5. Save changes.

### Step C: Supabase Auth Configuration (Phone / SMS Gateway)
1. In Supabase Dashboard, go to **Authentication** -> **Providers** -> **Phone**.
2. Toggle Phone to **Enabled**.
3. Select an SMS Provider:
   - **Twilio** (Account SID, Auth Token, Message Service SID / Sender Phone)
   - **MessageBird**
   - **Vonage**
   - **Textlocal / MSG91** (for India-native DLT compliance)
4. Set SMS Template:
   ```text
   Your LifelineX emergency verification code is: {{ .Code }}. Valid for 5 minutes.
   ```
5. Save changes.

### Step D: URL & Redirect Whitelisting
1. In Supabase Dashboard, navigate to **Authentication** -> **URL Configuration**.
2. Set **Site URL**: `http://localhost:5173` (or production domain).
3. Add to **Redirect URLs**:
   ```text
   http://localhost:5173/**
   http://127.0.0.1:5173/**
   ```

---

## 4. Environment Variables Setup

Configure the following variables in `.env.development` or `.env.production`:

```bash
# Public Client Variables (Browser-safe)
VITE_SUPABASE_URL=https://<your-real-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
```

> [!CAUTION]
> Never set `SUPABASE_SERVICE_ROLE_KEY` or `GOOGLE_CLIENT_SECRET` in `.env.development` or any file bundled with Vite! These must reside strictly on the server or in Supabase Edge Function Secrets.

---

## 5. Profile Onboarding & RBAC Rules

When an authenticated user signs in for the first time without a pre-existing profile:
1. **Step 1 (Identity)**: Collects legal name, date of birth, and language preference.
2. **Step 2 (Contact)**: Collects email/phone confirmation and Next-of-Kin emergency contact.
3. **Step 3 (Role)**: Restricts self-onboarding strictly to citizen tiers:
   - `PATIENT`: Immediate access to 108 SOS dispatch, hospital bed search, ambulance tracking.
   - `DONOR`: Blood group registration, blood donation appointment booking, and emergency shortage alerts.
4. **Privileged Roles Protection**:
   - `HOSPITAL_ADMIN`, `HOSPITAL_STAFF`, `BLOOD_BANK_ADMIN`, `AMBULANCE_PROVIDER_ADMIN`, `LIFELINEX_ADMIN`, and `SUPER_ADMIN` cannot be selected by citizens.
   - Any attempt to self-insert these roles is rejected by Postgres Row-Level Security policy `User roles manageable by admin only`.

---

## 6. Testing & Developer Sandbox

If live Google OAuth credentials or SMS gateway credits have not yet been provisioned:
1. LifelineX will not crash or fake authentication.
2. An informative banner will display:
   ```text
   CONFIGURATION REQUIRED: Unable to connect to Supabase Auth endpoint. Please ensure valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in your environment.
   ```
3. Testers and reviewers can click **"⚡ Developer Sandbox / Evaluation Mode"** at the bottom of the login card to immediately enter the application using verified persona profiles (`Priya Sundaram`, `Dr. Anand`, `Ramesh`, etc.).

---

## 7. Status Declaration

- **Implementation Integrity**: FULLY IMPLEMENTED (Components, types, state machine, migration, error mappers, responsive layout).
- **External Dependencies**: Requires binding live project credentials in `.env.development` or Supabase cloud console.
- **Formal Status**:
  ### `CONDITIONALLY READY — CONFIGURATION REQUIRED`
