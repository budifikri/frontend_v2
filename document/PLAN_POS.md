# POS Implementation Plan

This document outlines the plan for implementing the POS (Point of Sale) system based on the reference design in `document/POS/code.html`.

## 1. Role-Based Routing (COMPLETED)

- **File:** `src/App.jsx`
- Cashiers are redirected to POS screen after login.
- Other roles go to the admin dashboard.

## 2. POS Component Development

### Reference Design Layout (from `document/POS/code.html`)

The POS interface consists of 4 main sections:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo, Shop Name, Cashier Name, System Status, Dark Mode       │
├───────────────────────────────────┬─────────────────────────┬───────────┤
│                                   │                         │           │
│  RECEIPT PAPER (40%)             │  MONITOR + PROMO (60%)  │ SIDEBAR   │
│  ┌───────────────────────────┐   │  ┌───────────────────┐ │  (24px)   │
│  │ NOTA PENJUALAN           │   │  │ CUSTOMER DISPLAY  │ │           │
│  │ INV/xxx  Date Time       │   │  │ - Item Name       │ │ [PENDING] │
│  │---------------------------│   │  │ - Price           │ │ [CETAK]   │
│  │ Item 1        Rp xxx     │   │  │ - Total Amount    │ │ [CASH IN] │
│  │ Item 2        Rp xxx     │   │  └───────────────────┘ │ [CASH OUT]│
│  │ Item 3        Rp xxx     │   │  ┌───────────────────┐ │ [SETTING] │
│  │---------------------------│   │  │ PROMO HARI INI    │ │ [HELP]    │
│  │ TOTAL         Rp xxx     │   │  │ - Buy 2 Free 1   │ │           │
│  │ Tax (11%)     Rp xxx     │   │  │ - Diskon 10%     │ │ [CLOSE]   │
│  ├───────────────────────────┤   │  │ - Flash Sale...   │ │           │
│  │ [Search Bar] [BAYAR]     │   │  └───────────────────┘ │           │
│  └───────────────────────────┘   │                         │           │
├───────────────────────────────────┴─────────────────────────┴───────────┤
│ FOOTER: Shortcuts (F2, F4, F10, ESC), Status, Shift, Logout          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Structure
- **Folder:** `src/components/POS/`
- **Files:**
    - `POS.jsx`: Main component
    - `POS.css`: Custom styles

### UI Layout Details

#### 2.1 Header (Top Bar)
- Left: Material icon + Shop name ("Vista POS Pro")
- Right: Cashier name, System status badge (green "Online"), Dark mode toggle

#### 2.2 Main Area (Left 40%) - Receipt Paper
- Title: "NOTA PENJUALAN"
- Invoice number and date/time
- Items list with:
  - Product name (uppercase)
  - Quantity and unit price
  - Line total
- Summary section:
  - TOTAL (bold)
  - Tax (PPN 11%)
- Bottom: Search input + BAYAR button

#### 2.3 Display Area (Right 60%)
- **Customer Display Monitor** (dark frame):
  - Green status indicator
  - Current item name and price
  - Item count
  - Amount due (large cyan glowing text)
- **Promo Sticky Note** (yellow):
  - "PROMO HARI INI" header
  - List of promotions

#### 2.4 Right Sidebar (Action Keys)
- Pending (amber)
- Cetak/Print (slate)
- Cash In (emerald)
- Cash Out (rose)
- Setting (gray)
- Help (indigo)
- Close/Power (dark) - with red icon

#### 2.5 Footer/Status Bar
- Shortcut keys display
- Status indicator
- Shift info
- Logout button

### Styling Patterns (from code.html)
- Blurred background with overlay
- Receipt paper with shadow and dashed border
- 3D keyboard-style buttons with shadow
- Sticky note with push-pin effect
- Monitor frame with gradient
- Glow effect for customer display
- Custom scrollbar styling

## 3. Implementation Schedule

### Step 1: Routing & Scaffolding (COMPLETED)
- [x] Create `src/components/POS` directory
- [x] Implement role-based routing in `src/App.jsx`
- [x] Export POS component

### Step 2: UI Layout Implementation (IN PROGRESS)
- [x] Basic POS component shell
- [ ] Header with cashier info
- [ ] Receipt paper section with items
- [ ] Customer display monitor
- [ ] Promo sticky note
- [ ] Action sidebar buttons
- [ ] Footer with shortcuts

### Step 3: Core Logic (PENDING)
- [ ] Cart management (add/remove/update items)
- [ ] Search/barcode functionality
- [ ] Payment flow
- [ ] Keyboard shortcuts
- [ ] API integration for transactions

## 4. Key Features to Implement

1. **Receipt Paper Section**
   - Dynamic item list
   - Real-time total calculation
   - Tax calculation (11%)

2. **Customer Display**
   - Show last added item
   - Running total display
   - Cyan glow effect

3. **Action Sidebar**
   - Pending transactions
   - Print receipt
   - Cash in/out
   - Settings access

4. **Keyboard Shortcuts**
   - F2: Search product
   - F4: Customer selection
   - F10: Pay
   - ESC: Exit/Close
