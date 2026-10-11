/**
 * KK Mobile Shop - Firebase Configuration & Database Service
 * Shop: KK Mobile Shop | Contact: 9955038309 | Email: support@kkmobileshop.com
 * 
 * Supports both Live Firebase (Firestore + Auth) and Resilient LocalStorage Fallback.
 * If Firebase keys are not yet configured, the system seamlessly operates on a local
 * mock database with sample data so all features work immediately out of the box!
 */

// --- 1. FIREBASE CONFIGURATION ---
// Replace the placeholder values below with your actual Firebase project configuration:
const firebaseConfig = {
    apiKey: "AIzaSyYOUR_API_KEY_HERE",
    authDomain: "kk-mobile-shop.firebaseapp.com",
    projectId: "kk-mobile-shop",
    storageBucket: "kk-mobile-shop.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456"
};

// Global flags and references
let isFirebaseInitialized = false;
let authInstance = null;
let dbInstance = null;

// Initialize Firebase if valid config exists
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
        firebase.initializeApp(firebaseConfig);
        authInstance = firebase.auth();
        dbInstance = firebase.firestore();
        isFirebaseInitialized = true;
        console.log("✅ Firebase initialized successfully in live cloud mode.");
    } else {
        console.info("ℹ️ Running in Local Storage Mock Mode. To connect live Firebase, update firebaseConfig in firebase-config.js.");
    }
} catch (error) {
    console.warn("⚠️ Firebase init warning, falling back to local database:", error.message);
    isFirebaseInitialized = false;
}

// --- 2. SAMPLE INITIAL SEED DATA ---
const INITIAL_SAMPLE_REPAIRS = [
    {
        id: "KK-78210",
        customerName: "Rahul Sharma",
        phone: "9876543210",
        email: "rahul.sharma@example.com",
        brand: "Apple",
        model: "iPhone 13 Pro",
        imei: "354892019283741",
        serviceType: "Display Change",
        problemDescription: "Screen shattered after drop. Touch working intermittently. Green vertical line on right side.",
        status: "Repair In Progress", // Received, Under Inspection, Waiting for Parts, Repair In Progress, Ready for Pickup, Delivered
        estimatedCost: 8500,
        expectedDeliveryDate: "2026-10-13",
        createdAt: "2026-10-10T10:30:00.000Z",
        technicianNotes: "Original OLED panel mounted. Testing TrueTone and FaceID sensors."
    },
    {
        id: "KK-54391",
        customerName: "Pooja Verma",
        phone: "9911223344",
        email: "pooja.v@example.com",
        brand: "Samsung",
        model: "Galaxy S22 Ultra",
        imei: "359102837482910",
        serviceType: "Battery Replacement",
        problemDescription: "Battery drains within 3 hours. Phone randomly shuts down at 20%.",
        status: "Ready for Pickup",
        estimatedCost: 2800,
        expectedDeliveryDate: "2026-10-12",
        createdAt: "2026-10-09T14:15:00.000Z",
        technicianNotes: "OEM 5000mAh battery installed. 100% health verified, passed 20W charging cycle test."
    },
    {
        id: "KK-91042",
        customerName: "Amit Kumar",
        phone: "9123456780",
        email: "amit.k99@example.com",
        brand: "OnePlus",
        model: "OnePlus 11R",
        imei: "867123459012384",
        serviceType: "Charging Problem Repair",
        problemDescription: "Warp charge not working. Loose Type-C port, device only charges at weird angles.",
        status: "Under Inspection",
        estimatedCost: 1400,
        expectedDeliveryDate: "2026-10-14",
        createdAt: "2026-10-11T09:00:00.000Z",
        technicianNotes: "Examining charging flex cable and motherboard pin connections."
    },
    {
        id: "KK-38290",
        customerName: "Vikram Singh",
        phone: "9810239485",
        email: "vikram.singh@example.com",
        brand: "Xiaomi",
        model: "Redmi Note 12 Pro",
        imei: "869283746152019",
        serviceType: "Water Damage Repair",
        problemDescription: "Dropped in swimming pool. Powered off immediately. No power turning on.",
        status: "Waiting for Parts",
        estimatedCost: 3200,
        expectedDeliveryDate: "2026-10-15",
        createdAt: "2026-10-08T16:45:00.000Z",
        technicianNotes: "Ultrasonic cleaning completed. Sourcing power IC chip from distributor."
    },
    {
        id: "KK-12948",
        customerName: "Neha Patel",
        phone: "9712398471",
        email: "neha.patel@example.com",
        brand: "Vivo",
        model: "Vivo V27",
        imei: "860192837461928",
        serviceType: "Software Installation",
        problemDescription: "Stuck on Vivo boot logo after OTA update failed.",
        status: "Delivered",
        estimatedCost: 800,
        expectedDeliveryDate: "2026-10-08",
        createdAt: "2026-10-07T11:20:00.000Z",
        technicianNotes: "Fresh firmware flashed successfully. Customer data backed up & handed over."
    }
];

// Helper to initialize local storage if empty
function initializeLocalStorageDB() {
    if (!localStorage.getItem("kk_repairs")) {
        localStorage.setItem("kk_repairs", JSON.stringify(INITIAL_SAMPLE_REPAIRS));
    }
    if (!localStorage.getItem("kk_admin_session")) {
        // No session initially
    }
    if (!localStorage.getItem("kk_reviews")) {
        const sampleReviews = [
            {
                id: "REV-101",
                name: "Rohan Gupta",
                device: "iPhone 12",
                rating: 5,
                comment: "Got my iPhone 12 screen replaced in just 45 minutes! Original display quality, True Tone working perfectly. Outstanding service by KK Mobile Shop!",
                date: "2026-10-05"
            },
            {
                id: "REV-102",
                name: "Ananya Roy",
                device: "Samsung Galaxy S21",
                rating: 5,
                comment: "Very honest technicians. Other shops told me to replace the motherboard, but KK Mobile Shop fixed only the charging IC for ₹1200. Saved my money!",
                date: "2026-10-08"
            },
            {
                id: "REV-103",
                name: "Mohit Singhania",
                device: "OnePlus 9 Pro",
                rating: 5,
                comment: "The repair tracking feature is brilliant. Got live updates on WhatsApp and collected my phone the same evening. 100% recommended!",
                date: "2026-10-10"
            }
        ];
        localStorage.setItem("kk_reviews", JSON.stringify(sampleReviews));
    }
}

initializeLocalStorageDB();

// --- 3. UNIFIED DATABASE SERVICE API ---
const KKDatabase = {
    // Generate a unique, professional repair tracking ID: e.g. KK-68241
    generateRepairId: function() {
        const randNum = Math.floor(10000 + Math.random() * 90000);
        return `KK-${randNum}`;
    },

    // Save a new repair request
    createRepair: async function(repairData) {
        if (!repairData.id) {
            repairData.id = this.generateRepairId();
        }
        if (!repairData.createdAt) {
            repairData.createdAt = new Date().toISOString();
        }
        if (!repairData.status) {
            repairData.status = "Received";
        }

        // Try Firebase Cloud Firestore first
        if (isFirebaseInitialized && dbInstance) {
            try {
                await dbInstance.collection("repairs").doc(repairData.id).set(repairData);
                console.log("Saved repair to Firebase Firestore:", repairData.id);
            } catch (err) {
                console.warn("Firebase save failed, saving locally:", err);
            }
        }

        // Always save to LocalStorage for instant persistence & offline backup
        const repairs = this.getLocalRepairs();
        // Check if already exists, else unshift
        const index = repairs.findIndex(r => r.id === repairData.id);
        if (index >= 0) {
            repairs[index] = repairData;
        } else {
            repairs.unshift(repairData);
        }
        localStorage.setItem("kk_repairs", JSON.stringify(repairs));
        return repairData;
    },

    // Get all repairs
    getAllRepairs: async function() {
        if (isFirebaseInitialized && dbInstance) {
            try {
                const snapshot = await dbInstance.collection("repairs").orderBy("createdAt", "desc").get();
                if (!snapshot.empty) {
                    const list = [];
                    snapshot.forEach(doc => list.push(doc.data()));
                    // Sync into local storage
                    localStorage.setItem("kk_repairs", JSON.stringify(list));
                    return list;
                }
            } catch (err) {
                console.warn("Firebase fetch failed, reading from local DB:", err);
            }
        }
        return this.getLocalRepairs();
    },

    // Get single repair by ID (case-insensitive & trimmed)
    getRepairById: async function(repairId) {
        if (!repairId) return null;
        const normalizedId = repairId.trim().toUpperCase();

        if (isFirebaseInitialized && dbInstance) {
            try {
                const doc = await dbInstance.collection("repairs").doc(normalizedId).get();
                if (doc.exists) {
                    return doc.data();
                }
            } catch (err) {
                console.warn("Firebase lookup failed:", err);
            }
        }

        // LocalStorage fallback
        const repairs = this.getLocalRepairs();
        const found = repairs.find(r => r.id.toUpperCase() === normalizedId);
        return found || null;
    },

    // Update an existing repair
    updateRepair: async function(repairId, updateFields) {
        if (!repairId) return false;
        const normalizedId = repairId.trim().toUpperCase();

        if (isFirebaseInitialized && dbInstance) {
            try {
                await dbInstance.collection("repairs").doc(normalizedId).update(updateFields);
            } catch (err) {
                console.warn("Firebase update failed:", err);
            }
        }

        const repairs = this.getLocalRepairs();
        const index = repairs.findIndex(r => r.id.toUpperCase() === normalizedId);
        if (index >= 0) {
            repairs[index] = { ...repairs[index], ...updateFields };
            localStorage.setItem("kk_repairs", JSON.stringify(repairs));
            return repairs[index];
        }
        return null;
    },

    // Delete a repair record
    deleteRepair: async function(repairId) {
        if (!repairId) return false;
        const normalizedId = repairId.trim().toUpperCase();

        if (isFirebaseInitialized && dbInstance) {
            try {
                await dbInstance.collection("repairs").doc(normalizedId).delete();
            } catch (err) {
                console.warn("Firebase delete failed:", err);
            }
        }

        let repairs = this.getLocalRepairs();
        repairs = repairs.filter(r => r.id.toUpperCase() !== normalizedId);
        localStorage.setItem("kk_repairs", JSON.stringify(repairs));
        return true;
    },

    // Reviews Service
    getReviews: function() {
        const data = localStorage.getItem("kk_reviews");
        return data ? JSON.parse(data) : [];
    },

    addReview: function(review) {
        review.id = "REV-" + Date.now();
        review.date = new Date().toISOString().split("T")[0];
        const reviews = this.getReviews();
        reviews.unshift(review);
        localStorage.setItem("kk_reviews", JSON.stringify(reviews));
        return review;
    },

    // Helper to read local repairs
    getLocalRepairs: function() {
        const data = localStorage.getItem("kk_repairs");
        return data ? JSON.parse(data) : [];
    }
};

// Export to window
window.KKDatabase = KKDatabase;
window.isFirebaseInitialized = isFirebaseInitialized;
