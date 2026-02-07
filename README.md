# MEDIX – Medical Shop Billing App

A comprehensive, single-owner medical billing system built with **React Native (Expo)** for the frontend and **Node.js + Express + MongoDB** for the backend. This application streamlines inventory management, stock tracking, and generates GST-compliant invoices.

## 🚀 Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo (Managed Workflow)
- **UI Styling**: Custom stylesheets with `LinearGradient` support
- **Navigation**: React Navigation (Stack)
- **API Communication**: `fetch` API with centralized service configuration
- **PDF Generation**: `expo-print` and `expo-sharing` (for invoices)

### Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Environment Management**: `dotenv`

---

## 🔄 Project Flow & Features

### 1. Authentication
- **Secure Access**: The app is designed for a single owner/admin.
- **Login Flow**: Users log in using credentials stored in the backend environment variables (`OWNER_EMAIL`, `OWNER_PASSWORD`).
- **Session Management**: On successful login, a JWT `access_token` is returned and used for subsequent authenticated requests.

### 2. Medicine & Inventory Management
The system uses a two-tiered structure for managing stock:
- **Medicine (Generic)**: Represents the drug itself (e.g., "Paracetamol", "Amoxicillin").
- **Medicine Variant (Stock Unit)**: Specific purchasable units linked to a generic medicine.
  - **Properties**: Brand Name, Dosage (e.g., 500mg), Form (Tablet/Syrup), Packing, Batch Number, Expiry Date, Selling Price, and Quantity.
  - **Low Stock Alerts**: Each variant checks against a `minThreshold`. When `quantity <= minThreshold` after a sale, a `LowStockNotification` is automatically triggered.

### 3. Billing & Invoicing (Core Feature)
The billing module allows the owner to create invoices for customers, automatically calculating taxes and reducing stock.

#### **Flow:**
1.  **Customer Details**: Optional entry of Customer Name and Doctor Name.
2.  **Add Items**: Search for medicines by name/brand. Select a specific **Batch** (Variant) to add to the cart.
3.  **Real-time Preview**: As items are added, the backend calculates subtotal, taxes, and final total immediately.
4.  **Confirm & Generate**: On confirmation, the invoice is saved to the database, and stock is deducted.
5.  **PDF Output**: A professional PDF invoice is generated and can be shared or printed.

---

## 💰 Detailed GST Billing Logic

The application implements a robust GST calculation mechanism on the backend (`invoiceController.js`) to ensure accuracy and compliance.

### **Calculation Steps:**

1.  **Item Selection**:
    - Each item in the cart is linked to a specific `MedicineVariant`.
    - The system retrieves the `sellingPrice` and `gstRate` for that variant.
    - **Default GST**: If no specific GST rate is defined for the medicine, it defaults to **5%**.

2.  **Line Calculation**:
    - `Line Total` = `Selling Price` × `Quantity`

3.  **Discount Logic**:
    - A global discount amount can be applied to the invoice.
    - This discount is distributed proportionally across all items to calculate the `Taxable Value` for each line.
    - `Line Discount` = (`Line Total` / `Sub Total`) × `Total Discount`
    - `Taxable Value` = `Line Total` - `Line Discount`

4.  **Tax Components (CGST & SGST)**:
    - The total GST rate is split equally between Central GST (CGST) and State GST (SGST).
    - `CGST Rate` = `GST Rate` / 2
    - `SGST Rate` = `GST Rate` / 2
    - `CGST Amount` = `Taxable Value` × (`CGST Rate` / 100)
    - `SGST Amount` = `Taxable Value` × (`SGST Rate` / 100)

5.  **Final Totals**:
    - `Total Taxable Amount` = Sum of all items' taxable values
    - `Total CGST` = Sum of all items' CGST amounts
    - `Total SGST` = Sum of all items' SGST amounts
    - **Grand Total** = `Total Taxable Amount` + `Total CGST` + `Total SGST`

### **Example Calculation:**
*   **Item**: Paracetamol (Qty: 10, Price: ₹10/unit)
*   **Subtotal**: ₹100
*   **Discount**: ₹0
*   **Taxable Value**: ₹100
*   **GST Rate**: 12% (CGST 6% + SGST 6%)
*   **CGST**: ₹100 × 6% = ₹6.00
*   **SGST**: ₹100 × 6% = ₹6.00
*   **Total Payable**: ₹100 + ₹6 + ₹6 = **₹112.00**

---

## 🛠️ API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | | |
| `POST` | `/auth/login` | Owner login, returns JWT |
| **Stock** | | |
| `GET` | `/api/stock/medicines-with-variants` | Fetch all inventory |
| `POST` | `/api/stock/medicines` | Create generic medicine |
| `POST` | `/api/stock/medicines/:id/variants` | Add new stock batch |
| `PATCH` | `/api/stock/variants/:id/quantity` | Update stock quantity |
| **Invoicing** | | |
| `POST` | `/api/invoices/preview` | Calculate totals (dry-run) |
| `POST` | `/api/invoices` | Create invoice & reduce stock |
| `GET` | `/api/invoices` | List invoice history |
| `GET` | `/api/invoices/:id` | Get full invoice details |

---

## ⚙️ Setup & Installation

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env`:
    - Create a `.env` file with: `MONGODB_URI`, `JWT_SECRET`, `PORT`, `OWNER_EMAIL`, `OWNER_PASSWORD`.
4.  Start the server:
    ```bash
    npm run start      # or: npm run dev
    ```
    - Verify health: `curl http://localhost:8000/health`

### 2. Frontend Setup
1.  Navigate to the project root:
    ```bash
    cd ..
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Expo app:
    ```bash
    npm run start      # or: npx expo start
    ```
4.  **Device Testing**:
    - Ensure your phone/emulator is on the same Wi-Fi as your PC.
    - Scan the QR code with Expo Go (Android/iOS).

### 3. Usage
1.  **Login** using the credentials from your backend `.env`.
2.  Go to **Add Stock** to populate your inventory.
3.  Use **Billing** to create test invoices and verify the GST calculations.

---

*This documentation reflects the system state as of the latest analysis.*
