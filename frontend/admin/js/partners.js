let allPartners = [];
let selectedPartnerId = null;

document.addEventListener("DOMContentLoaded", () => {
    initializeAdmin();

    loadPartners();

    const searchInput = document.getElementById("partnerSearch");

    const statusFilter = document.getElementById(
        "partnerStatusFilter"
    );

    const refreshButton = document.getElementById(
        "refreshPartnersBtn"
    );

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyPartnerFilters
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            loadPartners
        );
    }

    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadPartners
        );
    }

    const approveButton = document.getElementById(
        "modalApproveBtn"
    );

    const rejectButton = document.getElementById(
        "modalRejectBtn"
    );

    if (approveButton) {
        approveButton.addEventListener(
            "click",
            () => handlePartnerAction("approve")
        );
    }

    if (rejectButton) {
        rejectButton.addEventListener(
            "click",
            () => handlePartnerAction("reject")
        );
    }
});


async function loadPartners() {

    showLoading(true);
    hideError();

    try {

        const status = document.getElementById(
            "partnerStatusFilter"
        )?.value || "";

        let url = "/api/admin/partners";

        if (status) {
            url += `?status=${encodeURIComponent(status)}`;
        }

        const data = await adminFetch(url);

        allPartners = Array.isArray(data)
            ? data
            : data.partners || [];

        updatePartnerStats();

        applyPartnerFilters();

        updateSidebarPending();

    } catch (error) {

        console.error("Partner loading error:", error);

        showError(
            error.message || "Unable to load partners."
        );

    } finally {

        showLoading(false);
    }
}


function updatePartnerStats() {

    const total = allPartners.length;

    const pending = allPartners.filter(
        partner => partner.partnerStatus === "pending"
    ).length;

    const approved = allPartners.filter(
        partner => partner.partnerStatus === "approved"
    ).length;

    const rejected = allPartners.filter(
        partner => partner.partnerStatus === "rejected"
    ).length;


    setText("totalPartners", total);
    setText("pendingPartners", pending);
    setText("approvedPartners", approved);
    setText("rejectedPartners", rejected);
}


function applyPartnerFilters() {

    const searchValue = (
        document.getElementById("partnerSearch")?.value || ""
    )
        .trim()
        .toLowerCase();


    let filteredPartners = [...allPartners];


    if (searchValue) {

        filteredPartners = filteredPartners.filter(
            partner => {

                const fullName = `${partner.firstName || ""} ${partner.lastName || ""}`
                    .toLowerCase();

                const email = (
                    partner.email || ""
                ).toLowerCase();

                const phone = (
                    partner.phone || ""
                ).toLowerCase();

                const city = (
                    partner.city || ""
                ).toLowerCase();


                return (
                    fullName.includes(searchValue) ||
                    email.includes(searchValue) ||
                    phone.includes(searchValue) ||
                    city.includes(searchValue)
                );
            }
        );
    }


    renderPartners(filteredPartners);
}


function renderPartners(partners) {

    const tbody = document.getElementById(
        "partnersTableBody"
    );

    const emptyState = document.getElementById(
        "partnersEmpty"
    );

    const tableContainer = document.getElementById(
        "partnersTableContainer"
    );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (!partners.length) {

        tableContainer.style.display = "none";
        emptyState.style.display = "block";

        return;
    }


    tableContainer.style.display = "block";
    emptyState.style.display = "none";


    partners.forEach(partner => {

        const row = document.createElement("tr");

        const fullName = `${partner.firstName || ""} ${partner.lastName || ""}`
            .trim() || "Unknown Partner";

        const initials = getInitials(fullName);

        const status = partner.partnerStatus || "pending";

        const registeredDate = partner.createdAt
            ? formatDate(partner.createdAt)
            : "-";


        row.innerHTML = `
            <td>
                <div class="partner-table-user">

                    <div class="partner-table-avatar">
                        ${escapeHTML(initials)}
                    </div>

                    <div>
                        <strong>
                            ${escapeHTML(fullName)}
                        </strong>

                        <small>
                            ${escapeHTML(partner.email || "-")}
                        </small>
                    </div>

                </div>
            </td>

            <td>
                ${escapeHTML(partner.phone || "-")}
            </td>

            <td>
                ${escapeHTML(partner.city || "-")}
            </td>

            <td>
                ${escapeHTML(registeredDate)}
            </td>

            <td>
                <span class="admin-status ${getStatusClass(status)}">
                    ${capitalize(status)}
                </span>
            </td>

            <td class="text-end">

                <button
                    type="button"
                    class="table-action-link"
                    onclick="openPartnerDetails('${partner._id}')"
                >
                    View
                    <i class="bi bi-arrow-right"></i>
                </button>

            </td>
        `;


        tbody.appendChild(row);
    });
}


async function openPartnerDetails(partnerId) {

    selectedPartnerId = partnerId;

    const modalElement = document.getElementById(
        "partnerDetailsModal"
    );

    const modal = bootstrap.Modal.getOrCreateInstance(
        modalElement
    );


    showPartnerDetailsLoading(true);

    modal.show();


    try {

        const data = await adminFetch(
            `/api/admin/partners/${partnerId}`
        );

        const partner = data.partner || data;

        populatePartnerDetails(partner);

    } catch (error) {

        console.error(
            "Partner details error:",
            error
        );

        alert(
            error.message ||
            "Unable to load partner details."
        );

        modal.hide();

    } finally {

        showPartnerDetailsLoading(false);
    }
}


function populatePartnerDetails(partner) {

    const fullName = `${partner.firstName || ""} ${partner.lastName || ""}`
        .trim() || "Unknown Partner";

    const status = partner.partnerStatus || "pending";


    setText(
        "detailAvatar",
        getInitials(fullName)
    );

    setText(
        "detailName",
        fullName
    );

    setText(
        "detailEmail",
        partner.email || "-"
    );

    setText(
        "detailPhone",
        partner.phone || "-"
    );

    setText(
        "detailCity",
        partner.city || "-"
    );

    setText(
        "detailAddress",
        partner.address || "-"
    );

    setText(
        "detailRegistered",
        partner.createdAt
            ? formatDate(partner.createdAt)
            : "-"
    );

    setText(
        "detailPhoneVerified",
        partner.phoneVerified
            ? "Verified"
            : "Not verified"
    );

    setText(
        "detailAccountStatus",
        capitalize(
            partner.accountStatus || "-"
        )
    );


    const statusElement = document.getElementById(
        "detailStatus"
    );

    if (statusElement) {

        statusElement.textContent =
            capitalize(status);

        statusElement.className =
            `admin-status ${getStatusClass(status)}`;
    }


    const approveButton = document.getElementById(
        "modalApproveBtn"
    );

    const rejectButton = document.getElementById(
        "modalRejectBtn"
    );


    if (approveButton) {

        approveButton.style.display =
            status === "approved"
                ? "none"
                : "inline-flex";
    }


    if (rejectButton) {

        rejectButton.style.display =
            status === "rejected"
                ? "none"
                : "inline-flex";
    }


    const content = document.getElementById(
        "partnerDetailsContent"
    );

    if (content) {
        content.style.display = "block";
    }
}


async function handlePartnerAction(action) {

    if (!selectedPartnerId) {
        return;
    }


    const partner = allPartners.find(
        item => item._id === selectedPartnerId
    );


    if (!partner) {
        return;
    }


    const fullName =
        `${partner.firstName || ""} ${partner.lastName || ""}`
            .trim();


    let confirmationMessage;


    if (action === "approve") {

        confirmationMessage =
            `Approve ${fullName} as a TRIPZOVA partner?`;

    } else {

        confirmationMessage =
            `Reject ${fullName}'s partner application?`;
    }


    const confirmed = confirm(
        confirmationMessage
    );


    if (!confirmed) {
        return;
    }


    const approveButton = document.getElementById(
        "modalApproveBtn"
    );

    const rejectButton = document.getElementById(
        "modalRejectBtn"
    );


    if (approveButton) {
        approveButton.disabled = true;
    }

    if (rejectButton) {
        rejectButton.disabled = true;
    }


    try {

        const endpoint =
            action === "approve"
                ? `/api/admin/partners/${selectedPartnerId}/approve`
                : `/api/admin/partners/${selectedPartnerId}/reject`;


        const data = await adminFetch(
            endpoint,
            {
                method: "PUT"
            }
        );


        alert(
            data.message ||
            `Partner ${action}d successfully.`
        );


        const modalElement = document.getElementById(
            "partnerDetailsModal"
        );

        const modal = bootstrap.Modal.getInstance(
            modalElement
        );

        if (modal) {
            modal.hide();
        }


        selectedPartnerId = null;

        await loadPartners();

    } catch (error) {

        console.error(
            `Partner ${action} error:`,
            error
        );

        alert(
            error.message ||
            `Unable to ${action} partner.`
        );

    } finally {

        if (approveButton) {
            approveButton.disabled = false;
        }

        if (rejectButton) {
            rejectButton.disabled = false;
        }
    }
}


async function updateSidebarPending() {

    try {

        const data = await adminFetch(
            "/api/admin/dashboard"
        );

        const pending =
            data.pendingPartners || 0;

        const badge = document.getElementById(
            "sidebarPendingBadge"
        );

        if (!badge) {
            return;
        }

        badge.textContent = pending;

        badge.style.display =
            pending > 0
                ? "inline-flex"
                : "none";

    } catch (error) {

        console.error(
            "Unable to update pending badge:",
            error
        );
    }
}


function showLoading(show) {

    const loading = document.getElementById(
        "partnersLoading"
    );

    if (loading) {
        loading.style.display =
            show ? "flex" : "none";
    }
}


function showPartnerDetailsLoading(show) {

    const loading = document.getElementById(
        "partnerDetailsLoading"
    );

    const content = document.getElementById(
        "partnerDetailsContent"
    );


    if (loading) {

        loading.style.display =
            show ? "flex" : "none";
    }


    if (content && show) {
        content.style.display = "none";
    }
}


function showError(message) {

    const errorElement = document.getElementById(
        "partnersError"
    );

    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;

    errorElement.style.display = "block";
}


function hideError() {

    const errorElement = document.getElementById(
        "partnersError"
    );

    if (errorElement) {
        errorElement.style.display = "none";
    }
}


function getInitials(name) {

    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) {
        return "P";
    }

    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


function formatDate(dateString) {

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


function capitalize(value) {

    if (!value) {
        return "-";
    }

    return value.charAt(0).toUpperCase() +
        value.slice(1);
}


function setText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "-"
                : value;
    }
}