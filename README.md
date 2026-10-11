# 📱 KK Mobile Shop - Official Website & Repair Management System

A modern, responsive, production-ready mobile repair shop website and management portal built with **HTML5, CSS3, JavaScript (ES6+), Firebase Firestore**, and a **Glassmorphism Tech UI**.

---

## 🏬 Shop Information
- **Shop Name**: KK Mobile Shop
- **Contact Number**: `+91 9955038309`
- **Email**: `support@kkmobileshop.com`
- **Operating Hours**: Mon - Sat: 9:30 AM - 9:00 PM | Sun: 10:00 AM - 5:00 PM

---

## 🌟 Key Features

### 👤 Customer Features
1. **Modern Hero & Brand Showcase**
   - High-impact glassmorphic tech theme with dark & light modes.
   - Highlights 90-day warranty, 30-minute express service, and 100% genuine parts.
2. **Comprehensive Services Showcase**
   - Mobile Repair (Motherboard chip-level & hardware)
   - Display & Screen Replacement (Super AMOLED, OLED, Gorilla Glass)
   - Battery Replacement (OEM health certified)
   - Charging Problem Repair (Type-C, Lightning, IC)
   - Software Installation & Flashing (OS upgrade, bootloop fix, unlock)
   - Water & Liquid Damage Repair (Ultrasonic chemical bath)
   - "Book This Service" one-click form pre-selector.
3. **Online Repair Request Form**
   - Automatic unique Repair ID generation (e.g., `KK-78210`).
   - Fields: Name, Mobile Number, Email, Brand, Model, IMEI (optional), Service Category, Problem Description.
   - Instant confirmation popup with one-click **Copy ID**, **Direct Track**, and **WhatsApp Share**.
4. **Live Repair Status Tracking Portal (`track.html`)**
   - Interactive 6-stage diagnostic stepper:
     1. `Received`
     2. `Under Inspection`
     3. `Waiting for Parts`
     4. `Repair In Progress`
     5. `Ready for Pickup`
     6. `Delivered`
   - Displays device details, reported problem, date submitted, technician diagnostic notes, estimated cost, and expected delivery date.
   - Quick sample IDs included for instant testing.
5. **Customer Feedback & Rating System**
   - Interactive 5-star rating selector and testimonial submission.
6. **WhatsApp Support & Direct Hotline**
   - Floating WhatsApp pulsing widget linking directly to `9955038309`.
   - Dynamic message generator with pre-filled repair details.
7. **PDF Receipt / Job Sheet Generator**
   - Formatted printable job sheet with shop logo, technician sign-off, warranty conditions, and cost breakdown.

---

### 🛡️ Admin Features (`admin.html`)
1. **Secure Admin Authentication**
   - Protected login portal with Firebase Authentication & cryptographic SHA-256 verification.
   - Restricted exclusively to authorized administrator: `sambhadur328@gmail.com`.
   - Unauthorized attempts immediately show "Access Denied" and block access to the customer database.
   - Secure session token management and 1-click Logout button.
2. **Realtime Dashboard Statistics**
   - Total Repairs count
   - Active In-Progress / Under Inspection
   - Waiting for Parts
   - Ready for Pickup (highlighted)
   - Delivered count
   - Total Estimated Revenue (`₹`)
3. **Repair Management Data Table**
   - Search across Customer Name, Phone, Repair ID, and Device Model.
   - Filter by status and brand.
   - Inline quick status dropdown.
   - Edit modal for full details, technician remarks, and delivery date adjustments.
   - One-click **Notify Customer on WhatsApp** with ready-for-pickup templates.
   - Print job sheet / invoice.
   - Delete records with confirmation.
4. **Walk-in Customer Check-in**
   - Log offline customers with auto-generated Repair IDs.
5. **Export to Excel (CSV)**
   - One-click full database export to standard CSV.

---

## 📂 Project Structure

```
kk-mobile-shop/
├── index.html           # Main customer landing page, services, form & reviews
├── track.html           # Dedicated 6-stage repair status tracking portal
├── admin.html           # Full-featured admin control dashboard & login
├── style.css            # Glassmorphism design system, dark/light themes & print CSS
├── script.js            # Client interactions, tracking engine & review management
├── admin.js             # Admin authentication, CRUD logic, stats & WhatsApp notifier
├── firebase-config.js   # Dual-mode Firebase Firestore & resilient LocalStorage database
├── firestore.rules      # Production-grade Firestore security rules
├── server.js            # Lightweight Node.js local dev server (zero dependencies)
├── vercel.json          # Deployment configuration for Vercel
├── .gitignore           # Git ignore rules
└── README.md            # Complete project documentation
```

---

## 🚀 How to Run Locally

### Option 1: Using Node.js Server (Recommended)
```bash
node server.js
```
Then navigate to: `http://localhost:8000`

### Option 2: Direct Browser Launch
Simply double-click `index.html` in your file explorer to open it in any modern browser (Chrome, Edge, Firefox, Safari). All features—including forms, tracking, and the admin dashboard—work instantly out of the box using the built-in storage service!

---

## ☁️ Connecting Live Firebase (Optional)

The website is already equipped with an intelligent **Hybrid Dual-Store Engine**:
- It works **immediately out-of-the-box** in resilient local database mode with realistic sample records.
- To connect your live Firebase Cloud Firestore project:
  1. Open `firebase-config.js`.
  2. Replace the `firebaseConfig` object with your keys from [Firebase Console](https://console.firebase.google.com/):
     ```javascript
     const firebaseConfig = {
         apiKey: "YOUR_ACTUAL_API_KEY",
         authDomain: "your-project.firebaseapp.com",
         projectId: "your-project-id",
         storageBucket: "your-project.appspot.com",
         messagingSenderId: "...",
         appId: "..."
     };
     ```
  3. Deploy the included `firestore.rules` to your Firebase project.

---

## 🌐 Deployment to GitHub & Vercel

### GitHub Repository:
🔗 **Repository URL**: [https://github.com/gautamkumar07-lab/kk-mobile-shop](https://github.com/gautamkumar07-lab/kk-mobile-shop)

```bash
# Clone the repository
git clone https://github.com/gautamkumar07-lab/kk-mobile-shop.git
cd kk-mobile-shop

# Run local development server
node server.js
```

### Deploy to Vercel:
1. Log in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **"Add New Project"**.
3. Select and import the **`gautamkumar07-lab/kk-mobile-shop`** repository.
4. Framework Preset: **Other** (Static Site).
5. Root Directory: `./` (leave default).
6. Click **Deploy**. Vercel will automatically configure the routing according to `vercel.json` and deploy live within seconds!
