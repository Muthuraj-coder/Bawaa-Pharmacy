# MEDIX – Medical Shop Billing App

A comprehensive, single-owner medical billing system built with **React Native (Expo)** for the frontend and **Node.js + Express + MongoDB** for the backend. This application streamlines inventory management, stock tracking, and generates professional invoices.

## 🚀 Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native with Expo (Managed Workflow)
- **UI Styling**: Custom stylesheets with `LinearGradient` support
- **Navigation**: React Navigation (Native Stack, Bottom Tabs)
- **API Communication**: `fetch` API with centralized service configuration
- **Document Management**: `expo-document-picker`, `expo-print`, `expo-sharing` (for invoices and PDFs)

### Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs`
- **File Processing**: `multer`, `pdf-parse`, `exceljs`, `xlsx`
- **Environment Management**: `dotenv`

---

## 🔄 Project Flow & Comprehensive Features

### 1. Authentication (`/api/auth`)
- **Screens**: `LoginScreen`, `SignupScreen`.
- **Backend**: Employs industry-standard JWT for generating securely signed `access_token`s.
- **Access**: Designed for single owner/admin architecture. Once authenticated, user securely navigates to the app's protected core routes.

### 2. Dashboard (`/api/stats`)
- **Screen**: `HomeScreen`
- **Functionality**: Offers a quick, real-time snapshot of business health based on database metrics:
  - Total number of registered medicines `totalMedicines`
  - Number of invoices created today `invoicesToday`
  - Count of medicines severely low on stock `lowStockCount`

### 3. Medicine & Inventory Management (`/api/medicineMaster` & `/api/medicines`)
The system introduces a robust two-tiered structure for precise stock management:
- **Screens**: `AddMedicineScreen` (addition), `MedicineScreen` (listing/management).
- **Medicine Master (Generic)**: Represents the base drug identity (e.g., "Paracetamol").
- **Medicine Variant (Stock Unit)**: The specific batch loaded by the pharmacist.
  - Features complete itemization: Brand Name, Dosage (e.g., 500mg), Form (Tablet/Syrup), Packing, Batch Number, Expiry Date, Selling Price, and Quantity.
- **Low Stock Notification Module (`LowStockNotification`)**:
  - Implements a safety `minThreshold` property on every Variant.
  - System checks quantities post-sale and auto-generates a low-stock alert when variants breach the safety threshold.

### 4. Billing & Invoicing Module (`/api/invoices`)
The core functionality allowing owners to facilitate sales, deduct stock in real-time, and format beautiful bills.
- **Screens**: `BillingScreen` (point-of-sale interface), `InvoiceHistoryScreen` (audit logs), `InvoiceScreen` (pdf view).
- **Billing Mechanics**:
  - Select Customer Details & Doctor.
  - Search medicines and pick from specific batch variants (Quantity logic dynamically checked).
  - Calculates subtotal and final total (Note: Specific GST calculation logic was deliberately removed in favor of streamlined subtotals).
- **Post-Confirmation**: Logs the sale in the database (`Invoice` Schema) and intelligently deducts variant stock.
- **Redesigned PDF Generation**: Generates a polished, professional PDF receipt. Features reordered columns for enhanced layout, visually emphasized and right-aligned pricing data, a bold totals section, and seamlessly dynamically integrates the pharmacy's logo directly onto the invoice header.

### 5. Supplier Invoice Processing: PDF → ADC Importer (Newest Engine)
A powerful internal tool specifically built to handle distributor/vendor supply invoices mapping directly to our inventory ecosystem (`/api/import`).
- **Screens**: `PdfToAdcScreen` (Uploader), `PdfPreviewScreen` (Verificaton Data Grid).
- **File Upload (`expo-document-picker` & `multer`)**: User uploads raw PDF supplier invoices directly from the device.
- **Parsing logic (`/api/import/parse-pdf`)**: Node backend leverages `pdf-parse` to perform OCR/text extraction converting messy supplier pdf strings into structural JSON arrays containing batches, quantities, forms, and pricing.
- **Data Preview & Editing (Grid)**: Frontend displays this converted array structurally in `PdfPreviewScreen` using `FlatList` layout with inline `TextInput` fields. This provides the user with an intuitive opportunity to manual-scan, correct parsing errors, or fill missing supplier data dynamically before saving.
- **Excel Export Utility (`/api/import/export-excel`)**: The precisely verified grid-data is packaged back to the server where `exceljs` efficiently transforms it into an `.xlsx` workbook, paving the way for one-click bulk-stock loading (ADC).

### 6. UI/UX & Design Overhaul (Mobile Frontend)
A comprehensive frontend restructuring focusing on delivering a premium, modern, and highly intuitive mobile experience without compromising underlying functionality.
- **Professional Aesthetics**: Implemented consistent typography, optimal padding/margins, and a clean hierarchical layout across all screens to reflect a modern application feel.
- **Component & Layout enhancements**: Redesigned standard interactive elements (buttons, cards with improved shadow profiles) and improved table layouts for excellent data readability on mobile devices.
- **Header Structure**: Integrated safe-area adjustments and the customized pharmacy logo seamlessly into a clean, unified header to establish consistent brand identity across app navigation.

---

## 🛠️ Git Workflow (Clone, Pull, Push)

Here are the basic commands to manage the project using Git:

### 1. Clone the Project
```bash
git clone <repository-url>
cd Bawaa-Pharmacy
```

### 2. Pull Latest Changes
```bash
git pull origin main
```

### 3. Push Your Changes (Standard WorkFlow)
1. **Check Status**: `git status`
2. **Add Changes**: `git add .`
3. **Commit Changes**: `git commit -m "Description of what you changed"`
4. **Push**: `git push origin main`

*This documentation reflects every major capability embedded within Bawaa-Pharmacy's system state as of the latest analysis.*
