# TheLegendsWiki — Security Specification & Access Control Model

## 1. Threat Model & Role Hierarchy
The system enforces strict multi-tier Role-Based Access Control (RBAC):
- **Super Administrator (`super_admin`)**: Root governance level. Can promote/demote administrators, configure platform governance settings, delete user accounts, and view the immutable system audit log.
  - *Designated Root Account*: `michiganshandilya@gmail.com` is protected from deletion, role demotion, or restriction under all conditions.
- **Administrator (`admin` / `administrator` / `editor`)**: Editorial level. Can review articles, approve/reject/request changes on pending submissions, curate taxonomy categories, and moderate standard user accounts. Cannot elevate accounts to `super_admin` or alter `super_admin` profiles.
- **Scholar / Contributor (`user` / `registered_user`)**: Authoring level. Can create articles, draft content, submit articles for editorial review, update their own public biography/avatar, and vote/comment. Cannot approve articles or modify security fields (`role`, `disabled`, `id`).
- **Guest / Public (`guest`)**: Unauthenticated reading access for published articles and taxonomy categories.

---

## 2. Invariants & Data Integrity Rules
1. **Root Super Admin Immunity**: The designated root Super Admin (`michiganshandilya@gmail.com`) can never be demoted, suspended, or deleted by any actor or API call.
2. **Self-Escalation Prohibition**: Users updating their own profiles cannot alter `role`, `disabled`, or `id`.
3. **Article Status Governance**:
   - `published`: Can only be set by an authorized `admin` or `super_admin`.
   - `pending_review`: Can be submitted by the article's author or an editor.
   - `draft` / `changes_requested`: Editable by the author.
4. **Immediate Real-Time Synchronization**:
   - `onSnapshot` subscriptions on Firestore collections (`users`, `articles`) ensure changes propagate instantly across active sessions without page reloads.
   - Cross-component event broadcasting (`thelegendswiki:user-role-changed`) synchronizes navigation bars, badge indicators, and role gates immediately.

---

## 3. The "Dirty Dozen" Security Test Payloads
The following payloads and attack scenarios are tested and defended:

| # | Attack / Invariant Test | Expected Result | Enforced Layer |
|---|-------------------------|-----------------|----------------|
| 1 | Normal user attempts to `create` or `setDoc` with `role: "admin"` | **Blocked (PERMISSION_DENIED)** | `firestore.rules` + `userService.ts` |
| 2 | Normal user attempts to update own profile with `role: "super_admin"` | **Blocked (PERMISSION_DENIED)** | `firestore.rules` (affectedKeys check) |
| 3 | Normal user attempts to update own profile with `disabled: false` when suspended | **Blocked (PERMISSION_DENIED)** | `firestore.rules` |
| 4 | Admin attempts to demote or modify the designated root Super Admin account | **Blocked (PERMISSION_DENIED)** | `firestore.rules` + `userService.ts` |
| 5 | Non-admin user attempts to directly write `status: "published"` on an article | **Blocked (PERMISSION_DENIED)** | `firestore.rules` (status transition guard) |
| 6 | Unauthenticated user attempts to create or delete an article | **Blocked (PERMISSION_DENIED)** | `firestore.rules` |
| 7 | User attempts to delete another user's article without admin permissions | **Blocked (PERMISSION_DENIED)** | `firestore.rules` |
| 8 | Suspended user attempts to publish or submit articles | **Blocked (PERMISSION_DENIED)** | `firestore.rules` (`!isUserDisabled()`) |
| 9 | Large oversized base64/image upload payload (>5MB) | **Blocked / Client-side compressed** | `storageService.ts` (`validateImageUpload`) |
| 10 | Script injection in article Markdown or author handle | **Sanitized & Normalized** | `sanitize.ts` + `DOMPurify` / Regex validation |
| 11 | Malformed timestamp or missing ID in article submission | **Auto-assigned ISO timestamp & UID** | `timestamps.ts` + `articleService.ts` |
| 12 | Stale state when Admin is demoted to User | **Immediate UI removal & Permission Revocation** | `subscribeToUsers` + `AuthContext` snapshot |
