# Trade-Journal Feature Deep Dive: Settings

**Document Version**: 1.0  
**Last Updated**: 2025-01-18  
**Feature**: User Settings & Preferences

---

## Overview

**What Users Can Configure**:
- Profile information (username, full name, avatar)
- Account security (password change)
- Data management (export, delete account)
- Preferences (timezone, currency, date format)

**Where**: `/settings`, `/dashboard/settings`

---

## Settings Sections

### Profile Settings

- **API**: `/api/settings/profile/route.ts`, `/api/profiles/[id]/route.ts`
- **Fields**: username, full_name, avatar_url, email (read-only)
- **Validation**: Username must be unique, 3+ characters, alphanumeric + underscore

### Security Settings

- **API**: `/api/settings/security/route.ts`
- **Actions**: Change password, enable 2FA (TODO), manage sessions
- **Password Requirements**: 8+ characters, mixed case, number

### Data Management

- **API**: `/api/settings/data/route.ts`
- **Actions**: 
  - Export all data as JSON/CSV (TODO: implement export tracking)
  - Delete account (with confirmation)
- **Behavior**: Account deletion cascades via RLS (`ON DELETE CASCADE`)

### User Preferences

- **Storage**: `user_prefs` table
- **Fields**: timezone, currency, date_format, theme
- **Scope**: App-wide UI customization

---

## Database Tables

- `profiles`: User profile data
- `user_prefs`: User preferences
- `auth.users`: Supabase Auth user data (managed by Supabase)

---

**End of Document**

