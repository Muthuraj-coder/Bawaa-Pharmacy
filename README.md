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


*This documentation reflects the system state as of the latest analysis.*

---

## 🛠️ Git Workflow (Clone, Pull, Push)

Here are the basic commands to manage the project using Git:

### 1. Clone the Project
To download the project to your local machine for the first time:
```bash
git clone <repository-url>
cd medical-billing-app
```

### 2. Pull Latest Changes
To update your local code with the latest changes from the remote repository:
```bash
git pull origin main
```
*(Note: If the main branch is named `master`, use `git pull origin master`)*

### 3. Push Your Changes
To save your changes and upload them to the repository:

1.  **Check Status** (See what files changed):
    ```bash
    git status
    ```
2.  **Add Changes** (Stage files for commit):
    ```bash
    git add .
    ```
3.  **Commit Changes** (Save with a message):
    ```bash
    git commit -m "Description of what you changed"
    ```
4.  **Push** (Upload to remote):
    ```bash
    git push origin main
    ```

