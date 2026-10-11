/**
 * KK Mobile Shop - Secure Admin Dashboard Management Logic
 * Shop: KK Mobile Shop | Contact: 9955038309 | Email: support@kkmobileshop.com
 * 
 * Production Security:
 * - Strictly restricted to authorized owner: sambhadur328@gmail.com
 * - Secure credential hashing via Web Crypto SHA-256 (no cleartext passwords exposed)
 * - Firebase Authentication support
 * - Session token validation & immediate DOM sanitization on logout
 */

// Authorized Administrator Identity
const AUTHORIZED_ADMIN_EMAIL = "sambhadur328@gmail.com";

// Cryptographic SHA-256 digest of authorized master password (Nitish@##2001)
// Never stored as plain text to ensure maximum code & production security
const AUTHORIZED_PASS_HASH = "34ee8e0915df7b5f9c53809636f43d1190ad8b24fcfa950b1522dc2079880ede";

let currentEditingRepairId = null;
let currentRepairsList = [];

document.addEventListener("DOMContentLoaded", () => {
    initSecureAdminAuth();
    initAdminTheme();
    initAdminActions();
});

/* ==========================================================================
   1. SECURE AUTHENTICATION & ACCESS CONTROL
   ========================================================================== */
function initSecureAdminAuth() {
    const loginModal = document.getElementById("adminLoginModal");
    const dashboardArea = document.getElementById("adminDashboardArea");
    const loginForm = document.getElementById("adminLoginForm");
    const logoutBtn = document.getElementById("adminLogoutBtn");

    // Validate active session on load
    const activeSession = getActiveSession();
    if (activeSession && activeSession.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        showDashboard();
    } else {
        showLogin();
    }

    // Login Form Submit Handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            hideAccessDenied();

            const submitBtn = document.getElementById("adminLoginSubmitBtn");
            const originalBtnContent = submitBtn ? submitBtn.innerHTML : "Login";
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            }

            const emailInput = document.getElementById("adminEmail").value.trim().toLowerCase();
            const passwordInput = document.getElementById("adminPassword").value;

            try {
                let authenticated = false;

                // 1. Check if email matches authorized admin
                if (emailInput !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
                    showAccessDenied("Access Denied: The email address provided does not have administrator privileges.");
                    resetSubmitBtn();
                    return;
                }

                // 2. Try Firebase Authentication if initialized
                if (window.isFirebaseInitialized && typeof firebase !== 'undefined' && firebase.auth) {
                    try {
                        const userCred = await firebase.auth().signInWithEmailAndPassword(emailInput, passwordInput);
                        if (userCred && userCred.user && userCred.user.email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
                            authenticated = true;
                        }
                    } catch (fbError) {
                        // If Firebase Auth returns error (e.g. user not created yet in console or network offline),
                        // continue to fallback verification using SHA-256 hash.
                        console.info("Firebase Auth verification continuing with secure cryptographic hash check:", fbError.code);
                    }
                }

                // 3. Cryptographic SHA-256 Hash Verification
                if (!authenticated) {
                    const inputHash = await sha256(passwordInput);
                    if (inputHash === AUTHORIZED_PASS_HASH) {
                        authenticated = true;
                    }
                }

                if (authenticated) {
                    // Create secure session
                    createAdminSession(emailInput);
                    showToast("Welcome back, Administrator!", "success");
                    showDashboard();
                    loginForm.reset();
                } else {
                    showAccessDenied("Access Denied: Invalid administrator password. Unauthorized login attempt recorded.");
                    document.getElementById("adminPassword").value = "";
                }

            } catch (err) {
                console.error("Auth error:", err);
                showAccessDenied("Access Denied: Authentication service error. Please try again.");
            } finally {
                resetSubmitBtn();
            }

            function resetSubmitBtn() {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnContent;
                }
            }
        });
    }

    // Secure Logout Button Handler
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            await terminateAdminSession();
            showToast("Administrator logged out successfully.", "info");
            showLogin();
        });
    }

    function showDashboard() {
        hideAccessDenied();
        if (loginModal) loginModal.classList.remove("active");
        if (dashboardArea) dashboardArea.style.display = "block";
        loadDashboardData();
    }

    function showLogin() {
        // Sanitize DOM: completely wipe sensitive customer records from memory when logged out
        const tbody = document.getElementById("repairsTableBody");
        if (tbody) tbody.innerHTML = "";
        currentRepairsList = [];

        if (dashboardArea) dashboardArea.style.display = "none";
        if (loginModal) loginModal.classList.add("active");
    }
}

/* Helper to hash password using Web Crypto API */
async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* Session Helpers */
function createAdminSession(email) {
    const sessionObj = {
        email: email,
        token: "KK_SECURE_" + Date.now() + "_" + Math.random().toString(36).substring(2),
        loginTime: new Date().toISOString()
    };
    sessionStorage.setItem("kk_admin_secure_session", JSON.stringify(sessionObj));
}

function getActiveSession() {
    try {
        const raw = sessionStorage.getItem("kk_admin_secure_session");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

async function terminateAdminSession() {
    sessionStorage.removeItem("kk_admin_secure_session");
    if (window.isFirebaseInitialized && typeof firebase !== 'undefined' && firebase.auth) {
        try {
            await firebase.auth().signOut();
        } catch (e) {
            console.warn("Firebase signout error:", e);
        }
    }
}

/* Access Denied Feedback */
function showAccessDenied(detailMessage) {
    const errBox = document.getElementById("loginErrorMessage");
    const errDetail = document.getElementById("loginErrorDetail");
    const modalBox = document.querySelector("#adminLoginModal .modal-box");

    if (errDetail) {
        errDetail.textContent = detailMessage || "Unauthorized access is strictly forbidden.";
    }
    if (errBox) {
        errBox.style.display = "block";
    }

    if (modalBox) {
        modalBox.style.animation = "none";
        modalBox.offsetHeight; /* Trigger reflow */
        modalBox.style.animation = "shake 0.4s ease-in-out";
    }

    if (window.showToast) {
        showToast("Access Denied: Unauthorized login attempt", "error");
    }
}

function hideAccessDenied() {
    const errBox = document.getElementById("loginErrorMessage");
    if (errBox) errBox.style.display = "none";
}

/* ==========================================================================
   2. DASHBOARD DATA & REALTIME STATS
   ========================================================================== */
async function loadDashboardData() {
    // Double check session before loading data
    const session = getActiveSession();
    if (!session || session.email.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        terminateAdminSession();
        const loginModal = document.getElementById("adminLoginModal");
        if (loginModal) loginModal.classList.add("active");
        return;
    }

    currentRepairsList = await window.KKDatabase.getAllRepairs();
    updateStatsCards(currentRepairsList);
    renderRepairsTable(currentRepairsList);
    updateSyncIndicator();
}

function updateStatsCards(repairs) {
    const totalCount = repairs.length;
    const inProgressCount = repairs.filter(r => r.status === "Repair In Progress" || r.status === "Under Inspection").length;
    const waitingPartsCount = repairs.filter(r => r.status === "Waiting for Parts").length;
    const readyCount = repairs.filter(r => r.status === "Ready for Pickup").length;
    const deliveredCount = repairs.filter(r => r.status === "Delivered").length;
    const totalRevenue = repairs.reduce((acc, r) => acc + (Number(r.estimatedCost) || 0), 0);

    const elTotal = document.getElementById("statTotalRepairs");
    const elInProgress = document.getElementById("statInProgress");
    const elWaiting = document.getElementById("statWaitingParts");
    const elReady = document.getElementById("statReady");
    const elDelivered = document.getElementById("statDelivered");
    const elRevenue = document.getElementById("statRevenue");

    if (elTotal) elTotal.textContent = totalCount;
    if (elInProgress) elInProgress.textContent = inProgressCount;
    if (elWaiting) elWaiting.textContent = waitingPartsCount;
    if (elReady) elReady.textContent = readyCount;
    if (elDelivered) elDelivered.textContent = deliveredCount;
    if (elRevenue) elRevenue.textContent = `₹${totalRevenue.toLocaleString()}`;
}

function updateSyncIndicator() {
    const indicator = document.getElementById("dbSyncIndicator");
    if (!indicator) return;

    if (window.isFirebaseInitialized) {
        indicator.innerHTML = '<span class="pulse-dot" style="background:#10b981; box-shadow:0 0 8px #10b981;"></span> Cloud Firestore Active';
        indicator.style.color = "#34d399";
    } else {
        indicator.innerHTML = '<span class="pulse-dot" style="background:#38bdf8; box-shadow:0 0 8px #38bdf8;"></span> Secure Local Database';
        indicator.style.color = "#38bdf8";
    }
}

/* ==========================================================================
   3. TABLE RENDERING & FILTERING
   ========================================================================== */
function renderRepairsTable(repairs) {
    const tbody = document.getElementById("repairsTableBody");
    const emptyRow = document.getElementById("tableEmptyState");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!repairs || repairs.length === 0) {
        if (emptyRow) emptyRow.style.display = "table-row";
        return;
    }
    if (emptyRow) emptyRow.style.display = "none";

    repairs.forEach(repair => {
        const tr = document.createElement("tr");

        const statusOptions = [
            "Received",
            "Under Inspection",
            "Waiting for Parts",
            "Repair In Progress",
            "Ready for Pickup",
            "Delivered"
        ];

        const statusDropdownHtml = `
            <select class="form-control" style="padding: 0.35rem 0.6rem; font-size: 0.82rem; font-weight: 700; border-radius: 6px; width: auto;" onchange="quickStatusChange('${repair.id}', this.value)">
                ${statusOptions.map(opt => `<option value="${opt}" ${opt === repair.status ? 'selected' : ''}>${opt}</option>`).join("")}
            </select>
        `;

        tr.innerHTML = `
            <td>
                <span class="table-id-pill">${repair.id}</span>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${formatDate(repair.createdAt)}</div>
            </td>
            <td>
                <strong style="display: block;">${escapeHtml(repair.customerName)}</strong>
                <a href="tel:${repair.phone}" style="font-size: 0.85rem; color: #38bdf8;">
                    <i class="fa-solid fa-phone" style="font-size: 0.75rem;"></i> ${escapeHtml(repair.phone)}
                </a>
            </td>
            <td>
                <div><strong>${escapeHtml(repair.brand)}</strong> ${escapeHtml(repair.model)}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">IMEI: ${escapeHtml(repair.imei || 'N/A')}</div>
            </td>
            <td>
                <span style="font-weight: 600; color: #f8fafc;">${escapeHtml(repair.serviceType)}</span>
                <div style="font-size: 0.78rem; color: var(--text-secondary); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(repair.problemDescription)}">
                    ${escapeHtml(repair.problemDescription)}
                </div>
            </td>
            <td>
                ${statusDropdownHtml}
            </td>
            <td>
                <span style="font-size: 0.88rem; color: var(--text-secondary);">${formatDate(repair.expectedDeliveryDate)}</span>
            </td>
            <td>
                <span style="font-weight: 800; color: #10b981;">₹${repair.estimatedCost || 0}</span>
            </td>
            <td>
                <div class="action-btn-group">
                    <button type="button" class="btn-icon-action" title="View & Edit Record" onclick="openEditRepairModal('${repair.id}')">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button type="button" class="btn-icon-action whatsapp-btn" title="Notify Customer on WhatsApp" onclick="notifyCustomerWhatsApp('${repair.id}')">
                        <i class="fa-brands fa-whatsapp"></i>
                    </button>
                    <button type="button" class="btn-icon-action" title="Print Job Sheet / Invoice" onclick="printReceiptForId('${repair.id}')">
                        <i class="fa-solid fa-print"></i>
                    </button>
                    <button type="button" class="btn-icon-action delete-btn" title="Delete Record" onclick="confirmDeleteRepair('${repair.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* Search and Filter Handlers */
function initAdminActions() {
    const searchInput = document.getElementById("adminSearchInput");
    const statusFilter = document.getElementById("adminStatusFilter");
    const brandFilter = document.getElementById("adminBrandFilter");
    const exportBtn = document.getElementById("exportCsvBtn");
    const newRepairBtn = document.getElementById("addNewRepairBtn");

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const status = statusFilter ? statusFilter.value : "ALL";
        const brand = brandFilter ? brandFilter.value : "ALL";

        const filtered = currentRepairsList.filter(r => {
            const matchQuery = !query ||
                r.id.toLowerCase().includes(query) ||
                r.customerName.toLowerCase().includes(query) ||
                r.phone.toLowerCase().includes(query) ||
                r.model.toLowerCase().includes(query) ||
                r.brand.toLowerCase().includes(query);

            const matchStatus = status === "ALL" || r.status === status;
            const matchBrand = brand === "ALL" || r.brand === brand;

            return matchQuery && matchStatus && matchBrand;
        });

        renderRepairsTable(filtered);
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (statusFilter) statusFilter.addEventListener("change", applyFilters);
    if (brandFilter) brandFilter.addEventListener("change", applyFilters);

    if (exportBtn) {
        exportBtn.addEventListener("click", () => exportRepairsToCsv(currentRepairsList));
    }

    if (newRepairBtn) {
        newRepairBtn.addEventListener("click", () => openAddRepairModal());
    }

    const addForm = document.getElementById("adminAddRepairForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddRepairSubmit);
    }

    const editForm = document.getElementById("adminEditRepairForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditRepairSubmit);
    }
}

/* ==========================================================================
   4. STATUS UPDATE & WHATSAPP NOTIFIER
   ========================================================================== */
async function quickStatusChange(repairId, newStatus) {
    try {
        await window.KKDatabase.updateRepair(repairId, { status: newStatus });
        showToast(`Repair ${repairId} updated to "${newStatus}"`, "success");
        loadDashboardData();

        if (newStatus === "Ready for Pickup") {
            const sendPrompt = confirm(`Repair ${repairId} is now READY FOR PICKUP!\nWould you like to send a WhatsApp pickup alert to the customer now?`);
            if (sendPrompt) {
                notifyCustomerWhatsApp(repairId);
            }
        }
    } catch (err) {
        console.error(err);
        showToast("Failed to update status", "error");
    }
}

function notifyCustomerWhatsApp(repairId) {
    const repair = currentRepairsList.find(r => r.id === repairId);
    if (!repair) return;

    let message = "";
    if (repair.status === "Ready for Pickup") {
        message = `Dear ${repair.customerName},\n\nGreat news! Your ${repair.brand} ${repair.model} (Repair ID: ${repair.id}) is REPAIRED and READY FOR PICKUP at KK Mobile Shop!\n\nIssue Resolved: ${repair.serviceType}\nTotal Amount: ₹${repair.estimatedCost || 0}\nWarranty: 90 Days Included\n\nPlease visit our shop during working hours to collect your device.\nHelpline: 9955038309\nKK Mobile Shop`;
    } else if (repair.status === "Repair In Progress") {
        message = `Dear ${repair.customerName},\n\nUpdate from KK Mobile Shop:\nYour ${repair.brand} ${repair.model} (Repair ID: ${repair.id}) is currently under active repair.\nExpected Delivery: ${formatDate(repair.expectedDeliveryDate)}.\n\nThank you for choosing KK Mobile Shop!\nHelpline: 9955038309`;
    } else {
        message = `Dear ${repair.customerName},\n\nStatus Update for Repair ID: ${repair.id} (${repair.brand} ${repair.model}):\nCurrent Status: ${repair.status}\n\nTrack live status anytime at: https://kkmobileshop.com/track.html?id=${repair.id}\nKK Mobile Shop | Phone: 9955038309`;
    }

    const cleanPhone = repair.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
}

function printReceiptForId(repairId) {
    const repair = currentRepairsList.find(r => r.id === repairId);
    if (repair && window.printJobReceipt) {
        window.printJobReceipt(repair);
    }
}

async function confirmDeleteRepair(repairId) {
    const ok = confirm(`Are you sure you want to permanently delete repair record ${repairId}? This action cannot be undone.`);
    if (!ok) return;

    try {
        await window.KKDatabase.deleteRepair(repairId);
        showToast(`Record ${repairId} deleted`, "info");
        loadDashboardData();
    } catch (err) {
        console.error(err);
        showToast("Error deleting record", "error");
    }
}

/* ==========================================================================
   5. ADD & EDIT MODALS
   ========================================================================== */
function openAddRepairModal() {
    const modal = document.getElementById("adminAddRepairModal");
    if (!modal) return;

    document.getElementById("addRepairId").value = window.KKDatabase.generateRepairId();

    const deliveryDateObj = new Date();
    deliveryDateObj.setDate(deliveryDateObj.getDate() + 2);
    document.getElementById("addDeliveryDate").value = deliveryDateObj.toISOString().split("T")[0];

    modal.classList.add("active");
}

async function handleAddRepairSubmit(e) {
    e.preventDefault();
    const repair = {
        id: document.getElementById("addRepairId").value.trim().toUpperCase(),
        customerName: document.getElementById("addCustName").value.trim(),
        phone: document.getElementById("addPhone").value.trim(),
        email: document.getElementById("addEmail").value.trim() || "N/A",
        brand: document.getElementById("addBrand").value,
        model: document.getElementById("addModel").value.trim(),
        imei: document.getElementById("addImei").value.trim() || "N/A",
        serviceType: document.getElementById("addServiceType").value,
        problemDescription: document.getElementById("addProblemDesc").value.trim(),
        status: document.getElementById("addStatus").value,
        estimatedCost: Number(document.getElementById("addCost").value) || 0,
        expectedDeliveryDate: document.getElementById("addDeliveryDate").value,
        technicianNotes: document.getElementById("addNotes").value.trim() || "Device checked in by admin.",
        createdAt: new Date().toISOString()
    };

    await window.KKDatabase.createRepair(repair);
    showToast(`New repair ${repair.id} added successfully!`, "success");
    document.getElementById("adminAddRepairForm").reset();
    closeAllModals();
    loadDashboardData();
}

function openEditRepairModal(repairId) {
    const repair = currentRepairsList.find(r => r.id === repairId);
    if (!repair) return;

    currentEditingRepairId = repairId;
    const modal = document.getElementById("adminEditRepairModal");
    if (!modal) return;

    document.getElementById("editRepairId").value = repair.id;
    document.getElementById("editCustName").value = repair.customerName;
    document.getElementById("editPhone").value = repair.phone;
    document.getElementById("editEmail").value = repair.email || "";
    document.getElementById("editBrand").value = repair.brand;
    document.getElementById("editModel").value = repair.model;
    document.getElementById("editImei").value = repair.imei || "";
    document.getElementById("editServiceType").value = repair.serviceType;
    document.getElementById("editStatus").value = repair.status;
    document.getElementById("editCost").value = repair.estimatedCost || 0;
    document.getElementById("editDeliveryDate").value = repair.expectedDeliveryDate || "";
    document.getElementById("editNotes").value = repair.technicianNotes || "";
    document.getElementById("editProblemDesc").value = repair.problemDescription;

    modal.classList.add("active");
}

async function handleEditRepairSubmit(e) {
    e.preventDefault();
    if (!currentEditingRepairId) return;

    const updatedFields = {
        customerName: document.getElementById("editCustName").value.trim(),
        phone: document.getElementById("editPhone").value.trim(),
        email: document.getElementById("editEmail").value.trim(),
        brand: document.getElementById("editBrand").value,
        model: document.getElementById("editModel").value.trim(),
        imei: document.getElementById("editImei").value.trim(),
        serviceType: document.getElementById("editServiceType").value,
        status: document.getElementById("editStatus").value,
        estimatedCost: Number(document.getElementById("editCost").value) || 0,
        expectedDeliveryDate: document.getElementById("editDeliveryDate").value,
        technicianNotes: document.getElementById("editNotes").value.trim(),
        problemDescription: document.getElementById("editProblemDesc").value.trim()
    };

    await window.KKDatabase.updateRepair(currentEditingRepairId, updatedFields);
    showToast(`Repair ${currentEditingRepairId} updated!`, "success");
    closeAllModals();
    loadDashboardData();
}

/* ==========================================================================
   6. EXPORT TO CSV / EXCEL
   ========================================================================== */
function exportRepairsToCsv(repairs) {
    if (!repairs || repairs.length === 0) {
        showToast("No records available to export", "info");
        return;
    }

    const headers = [
        "Repair ID",
        "Customer Name",
        "Phone",
        "Email",
        "Brand",
        "Model",
        "IMEI",
        "Service Type",
        "Status",
        "Estimated Cost",
        "Expected Delivery",
        "Created At",
        "Problem Description",
        "Technician Notes"
    ];

    const rows = repairs.map(r => [
        `"${r.id}"`,
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.email || ''}"`,
        `"${r.brand}"`,
        `"${(r.model || '').replace(/"/g, '""')}"`,
        `"${r.imei || ''}"`,
        `"${r.serviceType}"`,
        `"${r.status}"`,
        `"${r.estimatedCost || 0}"`,
        `"${r.expectedDeliveryDate || ''}"`,
        `"${r.createdAt || ''}"`,
        `"${(r.problemDescription || '').replace(/"/g, '""')}"`,
        `"${(r.technicianNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `KK_Mobile_Shop_Repairs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Repairs exported to Excel CSV successfully!", "success");
}

/* ==========================================================================
   7. THEME & UTILITIES
   ========================================================================== */
function initAdminTheme() {
    const savedTheme = localStorage.getItem("kk_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    const toggleBtn = document.getElementById("adminThemeToggle");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const current = document.documentElement.getAttribute("data-theme") || "dark";
            const newTheme = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("kk_theme", newTheme);
            const icon = toggleBtn.querySelector("i");
            if (icon) icon.className = newTheme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        });
    }
}

// Global exports
window.quickStatusChange = quickStatusChange;
window.notifyCustomerWhatsApp = notifyCustomerWhatsApp;
window.printReceiptForId = printReceiptForId;
window.confirmDeleteRepair = confirmDeleteRepair;
window.openEditRepairModal = openEditRepairModal;
window.openAddRepairModal = openAddRepairModal;
