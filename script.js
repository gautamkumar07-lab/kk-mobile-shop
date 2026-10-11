/**
 * KK Mobile Shop - Main Client JavaScript
 * Shop: KK Mobile Shop | Contact: 9955038309 | Email: support@kkmobileshop.com
 */

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initMobileNav();
    initRepairForm();
    initTracker();
    initReviews();
    initFAQ();
    initServiceBookingButtons();
});

/* ==========================================================================
   1. THEME TOGGLE (DARK / LIGHT MODE)
   ========================================================================== */
function initTheme() {
    const savedTheme = localStorage.getItem("kk_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);

    const toggleBtns = document.querySelectorAll(".theme-toggle-btn");
    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", newTheme);
            localStorage.setItem("kk_theme", newTheme);
            updateThemeIcon(newTheme);
            showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, "info");
        });
    });
}

function updateThemeIcon(theme) {
    const toggleBtns = document.querySelectorAll(".theme-toggle-btn i");
    toggleBtns.forEach(icon => {
        if (theme === "light") {
            icon.className = "fa-solid fa-moon";
        } else {
            icon.className = "fa-solid fa-sun";
        }
    });
}

/* ==========================================================================
   2. MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
    const toggle = document.querySelector(".mobile-nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
            navLinks.classList.toggle("mobile-open");
            const isOpen = navLinks.classList.contains("mobile-open");
            toggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        // Close when clicking nav link
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("mobile-open");
                if (toggle) toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }
}

/* ==========================================================================
   3. ONLINE REPAIR REQUEST FORM
   ========================================================================== */
function initRepairForm() {
    const form = document.getElementById("repairRequestForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Request...';

        try {
            const customerName = document.getElementById("customerName").value.trim();
            const phone = document.getElementById("customerPhone").value.trim();
            const email = document.getElementById("customerEmail").value.trim();
            const brand = document.getElementById("deviceBrand").value;
            const model = document.getElementById("deviceModel").value.trim();
            const imei = document.getElementById("deviceImei") ? document.getElementById("deviceImei").value.trim() : "";
            const serviceType = document.getElementById("serviceType").value;
            const problemDescription = document.getElementById("problemDesc").value.trim();

            if (!customerName || !phone || !brand || !model || !serviceType || !problemDescription) {
                showToast("Please fill in all required fields", "error");
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }

            // Generate Expected Delivery Date (Default: 2 days from today)
            const deliveryDateObj = new Date();
            deliveryDateObj.setDate(deliveryDateObj.getDate() + 2);
            const expectedDeliveryDate = deliveryDateObj.toISOString().split("T")[0];

            // Build new record object
            const newRepair = {
                id: window.KKDatabase.generateRepairId(),
                customerName,
                phone,
                email: email || "Not Provided",
                brand,
                model,
                imei: imei || "N/A",
                serviceType,
                problemDescription,
                status: "Received",
                estimatedCost: calculateEstimatedBaseCost(serviceType),
                expectedDeliveryDate,
                createdAt: new Date().toISOString(),
                technicianNotes: "Device registered online. Please visit KK Mobile Shop or prepare device for pickup."
            };

            // Save to DB
            await window.KKDatabase.createRepair(newRepair);

            // Show Success Modal
            showSuccessModal(newRepair);

            // Reset form
            form.reset();
            showToast("Repair Request Booked Successfully!", "success");

        } catch (err) {
            console.error(err);
            showToast("Failed to submit request. Please try again or WhatsApp us.", "error");
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

function calculateEstimatedBaseCost(serviceType) {
    switch (serviceType) {
        case "Display Change": return 2500;
        case "Battery Replacement": return 1200;
        case "Charging Problem Repair": return 750;
        case "Software Installation": return 500;
        case "Water Damage Repair": return 1800;
        default: return 800;
    }
}

// Show Booking Confirmation Modal
function showSuccessModal(repair) {
    const modal = document.getElementById("repairSuccessModal");
    if (!modal) return;

    document.getElementById("modalRepairId").textContent = repair.id;
    document.getElementById("modalCustName").textContent = repair.customerName;
    document.getElementById("modalDevice").textContent = `${repair.brand} ${repair.model}`;
    document.getElementById("modalDelivery").textContent = formatDate(repair.expectedDeliveryDate);

    // Track Link
    const trackBtn = document.getElementById("modalTrackBtn");
    if (trackBtn) {
        trackBtn.href = `track.html?id=${repair.id}`;
    }

    // WhatsApp Confirmation Share Link
    const waBtn = document.getElementById("modalWhatsAppBtn");
    if (waBtn) {
        const text = encodeURIComponent(
            `Hello KK Mobile Shop! I have booked a repair for my ${repair.brand} ${repair.model}.\n` +
            `Repair ID: ${repair.id}\nCustomer Name: ${repair.customerName}\nIssue: ${repair.serviceType}\n` +
            `Please confirm my booking.`
        );
        waBtn.href = `https://wa.me/919955038309?text=${text}`;
    }

    modal.classList.add("active");

    // Copy Repair ID functionality
    const copyBtn = document.getElementById("copyRepairIdBtn");
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(repair.id).then(() => {
                showToast("Repair ID copied to clipboard!", "success");
            });
        };
    }
}

/* ==========================================================================
   4. REPAIR STATUS TRACKER (track.html & quick tracker)
   ========================================================================== */
const STATUS_LEVELS = [
    { key: "Received", title: "Received", icon: "fa-inbox", percent: 15 },
    { key: "Under Inspection", title: "Under Inspection", icon: "fa-magnifying-glass", percent: 35 },
    { key: "Waiting for Parts", title: "Waiting for Parts", icon: "fa-boxes-packing", percent: 55 },
    { key: "Repair In Progress", title: "Repair In Progress", icon: "fa-screwdriver-wrench", percent: 75 },
    { key: "Ready for Pickup", title: "Ready for Pickup", icon: "fa-bell", percent: 90 },
    { key: "Delivered", title: "Delivered", icon: "fa-circle-check", percent: 100 }
];

function initTracker() {
    const trackForm = document.getElementById("trackStatusForm");
    const trackInput = document.getElementById("trackRepairIdInput");

    // Check URL parameters for direct tracking: ?id=KK-XXXX
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get("id");

    if (idFromUrl && trackInput) {
        trackInput.value = idFromUrl.trim();
        performTracking(idFromUrl.trim());
    }

    if (trackForm) {
        trackForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const id = trackInput ? trackInput.value.trim() : "";
            if (!id) {
                showToast("Please enter a Repair ID (e.g. KK-78210)", "error");
                return;
            }
            performTracking(id);
        });
    }
}

async function performTracking(repairId) {
    const resultContainer = document.getElementById("trackingResultContainer");
    const emptyState = document.getElementById("trackingEmptyState");
    const notFoundState = document.getElementById("trackingNotFoundState");

    if (!resultContainer) return;

    // Show loading state
    resultContainer.style.display = "none";
    if (emptyState) emptyState.style.display = "none";
    if (notFoundState) notFoundState.style.display = "none";

    const repair = await window.KKDatabase.getRepairById(repairId);

    if (!repair) {
        if (notFoundState) {
            notFoundState.style.display = "block";
            const searchIdElem = document.getElementById("searchedRepairId");
            if (searchIdElem) searchIdElem.textContent = repairId;
        }
        showToast(`No repair found with ID "${repairId}"`, "error");
        return;
    }

    // Populate Fields
    document.getElementById("trackResultId").textContent = repair.id;
    document.getElementById("trackResultCust").textContent = repair.customerName;
    document.getElementById("trackResultPhone").textContent = maskPhone(repair.phone);
    document.getElementById("trackResultDevice").textContent = `${repair.brand} ${repair.model}`;
    document.getElementById("trackResultIssue").textContent = repair.serviceType;
    document.getElementById("trackResultDesc").textContent = repair.problemDescription;
    document.getElementById("trackResultDate").textContent = formatDate(repair.createdAt);
    document.getElementById("trackResultExpected").textContent = formatDate(repair.expectedDeliveryDate || "TBD");
    document.getElementById("trackResultCost").textContent = repair.estimatedCost ? `₹${repair.estimatedCost}` : "Under Diagnostics";
    document.getElementById("trackResultNotes").textContent = repair.technicianNotes || "Diagnostic test in progress.";

    // Status Pill
    const statusPill = document.getElementById("trackResultStatusBadge");
    if (statusPill) {
        statusPill.textContent = repair.status;
        statusPill.className = `status-pill ${getStatusPillClass(repair.status)}`;
    }

    // Render Stepper
    renderStepper(repair.status);

    // Update Action Buttons
    const waInquiryBtn = document.getElementById("trackWhatsAppBtn");
    if (waInquiryBtn) {
        const msg = encodeURIComponent(
            `Hello KK Mobile Shop! Regarding Repair ID: ${repair.id} (${repair.brand} ${repair.model}). Current status is "${repair.status}". Could you provide an update?`
        );
        waInquiryBtn.href = `https://wa.me/919955038309?text=${msg}`;
    }

    const printBtn = document.getElementById("trackPrintBtn");
    if (printBtn) {
        printBtn.onclick = () => printJobReceipt(repair);
    }

    resultContainer.style.display = "block";
    resultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderStepper(currentStatus) {
    const stepperContainer = document.getElementById("stepperNodesContainer");
    const activeLine = document.getElementById("stepperActiveLine");
    if (!stepperContainer) return;

    stepperContainer.innerHTML = "";

    const currentIndex = STATUS_LEVELS.findIndex(s => s.key.toLowerCase() === (currentStatus || "").toLowerCase());
    const validCurrentIndex = currentIndex >= 0 ? currentIndex : 0;

    STATUS_LEVELS.forEach((step, index) => {
        const node = document.createElement("div");
        node.className = "step-node";

        let stateClass = "";
        let iconToUse = step.icon;

        if (index < validCurrentIndex) {
            stateClass = "completed";
            iconToUse = "fa-check";
        } else if (index === validCurrentIndex) {
            stateClass = "current";
        }

        if (stateClass) node.classList.add(stateClass);

        node.innerHTML = `
            <div class="step-icon-circle">
                <i class="fa-solid ${iconToUse}"></i>
            </div>
            <div class="step-title">${step.title}</div>
        `;
        stepperContainer.appendChild(node);
    });

    if (activeLine) {
        const percent = STATUS_LEVELS[validCurrentIndex].percent;
        activeLine.style.width = `${percent}%`;
    }
}

function getStatusPillClass(status) {
    switch (status) {
        case "Received": return "status-received";
        case "Under Inspection": return "status-inspection";
        case "Waiting for Parts": return "status-parts";
        case "Repair In Progress": return "status-progress";
        case "Ready for Pickup": return "status-ready";
        case "Delivered": return "status-delivered";
        default: return "status-received";
    }
}

/* ==========================================================================
   5. CUSTOMER REVIEWS & RATING
   ========================================================================== */
function initReviews() {
    renderReviews();

    const reviewForm = document.getElementById("customerReviewForm");
    if (!formExists(reviewForm)) return;

    // Rating star selector
    let selectedRating = 5;
    const starButtons = document.querySelectorAll(".rating-select-stars i");
    starButtons.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.getAttribute("data-rating"), 10);
            updateStarSelectUI(selectedRating);
        });
    });

    reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("reviewCustName").value.trim();
        const device = document.getElementById("reviewDevice").value.trim();
        const comment = document.getElementById("reviewComment").value.trim();

        if (!name || !device || !comment) {
            showToast("Please complete all review fields", "error");
            return;
        }

        window.KKDatabase.addReview({
            name,
            device,
            rating: selectedRating,
            comment
        });

        reviewForm.reset();
        updateStarSelectUI(5);
        closeAllModals();
        renderReviews();
        showToast("Thank you for your valuable feedback!", "success");
    });
}

function updateStarSelectUI(rating) {
    const starButtons = document.querySelectorAll(".rating-select-stars i");
    starButtons.forEach(star => {
        const val = parseInt(star.getAttribute("data-rating"), 10);
        if (val <= rating) {
            star.className = "fa-solid fa-star";
            star.style.color = "#fbbf24";
        } else {
            star.className = "fa-regular fa-star";
            star.style.color = "var(--text-muted)";
        }
    });
}

function renderReviews() {
    const grid = document.getElementById("reviewsContainerGrid");
    if (!grid) return;

    const reviews = window.KKDatabase.getReviews();
    grid.innerHTML = "";

    reviews.forEach(rev => {
        const card = document.createElement("div");
        card.className = "glass-card review-card";

        const starsHtml = Array.from({ length: 5 }, (_, i) => {
            return i < rev.rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
        }).join("");

        const initials = rev.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

        card.innerHTML = `
            <div>
                <div class="review-stars">${starsHtml}</div>
                <p class="review-text">"${escapeHtml(rev.comment)}"</p>
            </div>
            <div class="reviewer-meta">
                <div class="reviewer-avatar">${initials}</div>
                <div>
                    <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(rev.name)}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(rev.device)} • Verified Customer</div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ==========================================================================
   6. FAQ ACCORDION
   ========================================================================== */
function initFAQ() {
    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        if (question) {
            question.addEventListener("click", () => {
                const isActive = item.classList.contains("active");
                faqItems.forEach(i => i.classList.remove("active"));
                if (!isActive) item.classList.add("active");
            });
        }
    });
}

/* ==========================================================================
   7. SERVICE CARD "BOOK NOW" AUTO-FILL
   ========================================================================== */
function initServiceBookingButtons() {
    const buttons = document.querySelectorAll("[data-book-service]");
    buttons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            const serviceName = btn.getAttribute("data-book-service");
            const serviceSelect = document.getElementById("serviceType");
            const formSection = document.getElementById("repair-booking-section");

            if (serviceSelect) {
                serviceSelect.value = serviceName;
            }
            if (formSection) {
                formSection.scrollIntoView({ behavior: "smooth" });
            }
        });
    });
}

/* ==========================================================================
   8. PRINTABLE PDF RECEIPT / JOB SHEET GENERATOR
   ========================================================================== */
function printJobReceipt(repair) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        showToast("Popup blocked. Please allow popups to print receipt.", "error");
        return;
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Receipt - ${repair.id} - KK Mobile Shop</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 18px; margin-bottom: 25px; }
            .shop-title { font-size: 26px; font-weight: 800; color: #1d4ed8; }
            .shop-contact { font-size: 13px; color: #64748b; line-height: 1.5; }
            .receipt-id-badge { background: #eff6ff; border: 2px dashed #2563eb; padding: 10px 18px; border-radius: 8px; text-align: right; }
            .receipt-id { font-size: 22px; font-weight: 800; color: #2563eb; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; }
            .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
            .value { font-size: 15px; font-weight: 600; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
            th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 13px; border-bottom: 2px solid #cbd5e1; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .total-box { text-align: right; margin-top: 15px; font-size: 18px; font-weight: 700; color: #1e293b; }
            .terms { border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #64748b; line-height: 1.5; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-line { width: 200px; border-top: 1px solid #94a3b8; text-align: center; font-size: 12px; padding-top: 5px; color: #475569; }
            @media print { .no-print { display: none; } }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <div class="shop-title">KK MOBILE SHOP</div>
                <div class="shop-contact">
                    Expert Smartphone & Tablet Repair Services<br>
                    Phone: <strong>+91 9955038309</strong> | Email: support@kkmobileshop.com<br>
                    Main Market Road, Near City Center
                </div>
            </div>
            <div class="receipt-id-badge">
                <div class="label">JOB SHEET / REPAIR ID</div>
                <div class="receipt-id">${repair.id}</div>
                <div style="font-size: 12px; color: #64748b;">${formatDate(repair.createdAt)}</div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-box">
                <div class="label">Customer Information</div>
                <div class="value">${repair.customerName}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">Phone: ${repair.phone}</div>
                <div style="font-size: 13px; color: #475569;">Email: ${repair.email || 'N/A'}</div>
            </div>
            <div class="info-box">
                <div class="label">Device & Status</div>
                <div class="value">${repair.brand} ${repair.model}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">IMEI: ${repair.imei || 'N/A'}</div>
                <div style="font-size: 13px; color: #475569;">Current Status: <strong>${repair.status}</strong></div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Service / Issue Category</th>
                    <th>Reported Problem Description</th>
                    <th>Expected Delivery</th>
                    <th style="text-align: right;">Estimated Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>${repair.serviceType}</strong></td>
                    <td>${repair.problemDescription}</td>
                    <td>${formatDate(repair.expectedDeliveryDate || 'TBD')}</td>
                    <td style="text-align: right; font-weight: 700;">₹${repair.estimatedCost || 0}</td>
                </tr>
            </tbody>
        </table>

        <div class="info-box" style="margin-bottom: 20px;">
            <div class="label">Technician Notes & Diagnostics</div>
            <div style="font-size: 13px; color: #334155;">${repair.technicianNotes || 'Standard repair procedure.'}</div>
        </div>

        <div class="total-box">
            Estimated Total: ₹${repair.estimatedCost || 0}
        </div>

        <div class="signatures">
            <div class="sig-line">Customer Signature</div>
            <div class="sig-line">KK Mobile Shop Authorized Seal</div>
        </div>

        <div class="terms" style="margin-top: 40px;">
            <strong>Terms & Warranty Conditions:</strong><br>
            1. 90-day warranty on replaced parts (excluding physical and water damage).<br>
            2. Customer is requested to retain this job sheet to collect their device.<br>
            3. KK Mobile Shop is not responsible for data loss. Please back up data before repair.<br>
            4. Unclaimed devices after 30 days are subject to standard warehouse recycling policy.
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

/* ==========================================================================
   9. UTILITIES & TOASTS
   ========================================================================== */
function showToast(message, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-exclamation";

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 3800);
}

function formatDate(dateStr) {
    if (!dateStr || dateStr === "TBD") return "To Be Determined";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {
        return dateStr;
    }
}

function maskPhone(phone) {
    if (!phone) return "";
    if (phone.length <= 4) return phone;
    return phone.slice(0, 2) + "******" + phone.slice(-2);
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formExists(elem) {
    return elem !== null && elem !== undefined;
}

function closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("active"));
}

// Global modal close binding
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay") || e.target.closest(".modal-close-btn")) {
        closeAllModals();
    }
});

// Expose helpers globally
window.showToast = showToast;
window.printJobReceipt = printJobReceipt;
window.formatDate = formatDate;
window.closeAllModals = closeAllModals;
