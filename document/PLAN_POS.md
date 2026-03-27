# POS Implementation Plan

This document outlines the plan for implementing the POS (Point of Sale) system in the application, specifically handling role-based routing for cashiers and creating the POS user interface.

## 1. Role-Based Routing

### Objective
Users with the `cashier` role should be directed to the POS screen immediately after login, bypassing the main admin dashboard.

### Implementation Steps
- **File:** `src/App.jsx`
- **Changes:**
    - Update `handleLogin` to check `auth.role`.
    - If `role === 'cashier'`, set the application view to `pos`.
    - Update the `useEffect` hook that monitors `auth.token` to ensure the correct view is maintained upon refresh.
    - Ensure `handleLogout` correctly resets the view back to `login`.

## 2. POS Component Development

### Objective
Create a dedicated POS interface in `src/components/POS` that is optimized for fast transactions, referencing `document/code.html` for styling patterns and `document/POS/screen.png` for layout.

### Component Structure
- **Folder:** `src/components/POS/`
- **Files:**
    - `POS.jsx`: Main logic and layout.
    - `POS.css`: Custom styles for the POS interface.

### UI Layout (based on standard POS patterns)
1. **Header (Top Bar):**
    - Display Shop/Company Name.
    - Display Current Date & Time.
    - Display Active Cashier Name.
2. **Main Transaction Area (Left/Center):**
    - **Product Input:** A focused text field for barcode scanning or manual entry.
    - **Transaction Table:** Lists added items with columns: No, Item Name, Price, Qty, Discount, and Total.
3. **Information & Action Panel (Right/Side):**
    - **Grand Total:** Very large font display of the total amount.
    - **Payment Details:** Subtotal, Tax, Discounts.
    - **Action Buttons:** Large touch-friendly buttons for "BAYAR" (Pay), "PENDING" (Hold), "BATAL" (Cancel), and "MEMBER".
4. **Footer (Status Bar):**
    - Shortcut key indicators (e.g., `F2: Cari Barang`, `F4: Pelanggan`, `F10: Bayar`, `ESC: Keluar`).

## 3. Implementation Schedule

1. **Step 1: Routing & Scaffolding**
    - Create `src/components/POS` directory.
    - Implement the logic in `src/App.jsx` to switch views.
    - Export `POS` component from `src/components/index.js`.
2. **Step 2: UI Layout Implementation**
    - Build the POS shell using Tailwind CSS and custom styles.
    - Ensure it matches the "Desktop" look and feel established in the project.
3. **Step 3: Core Logic**
    - Implement cart management (add/remove/update items).
    - Handle keyboard shortcuts for efficiency.
