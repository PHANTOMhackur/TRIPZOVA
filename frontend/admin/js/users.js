let allUsers = [];
let selectedUserId = null;

document.addEventListener("DOMContentLoaded", () => {

    initializeAdmin();

    loadUsers();


    const searchInput =
        document.getElementById("userSearch");

    const roleFilter =
        document.getElementById("userRoleFilter");

    const statusFilter =
        document.getElementById("userStatusFilter");

    const refreshButton =
        document.getElementById("refreshUsersBtn");


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            applyUserFilters
        );
    }


    if (roleFilter) {
        roleFilter.addEventListener(
            "change",
            loadUsers
        );
    }


    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            loadUsers
        );
    }


    if (refreshButton) {
        refreshButton.addEventListener(
            "click",
            loadUsers
        );
    }

});


async function loadUsers() {

    showUsersLoading(true);
    hideUsersError();


    try {

        const search =
            document.getElementById("userSearch")?.value.trim() || "";

        const role =
            document.getElementById("userRoleFilter")?.value || "";

        const status =
            document.getElementById("userStatusFilter")?.value || "";


        const params = new URLSearchParams();


        if (search) {
            params.append("search", search);
        }

        if (role) {
            params.append("role", role);
        }

        if (status) {
            params.append("status", status);
        }


        let url = "/api/admin/users";


        if (params.toString()) {
            url += `?${params.toString()}`;
        }


        const data = await adminFetch(url);


        allUsers = Array.isArray(data)
            ? data
            : data.users || [];


        updateUserStats();

        applyUserFilters();

        updateSidebarPending();


    } catch (error) {

        console.error(
            "Users loading error:",
            error
        );

        showUsersError(
            error.message ||
            "Unable to load users."
        );

    } finally {

        showUsersLoading(false);

    }

}


function updateUserStats() {

    const total =
        allUsers.length;


    const customers =
        allUsers.filter(
            user => user.role === "customer"
        ).length;


    const travellers =
        allUsers.filter(
            user => user.role === "traveller"
        ).length;


    const partners =
        allUsers.filter(
            user => user.role === "partner"
        ).length;


    setText(
        "totalUsers",
        total
    );

    setText(
        "customerUsers",
        customers
    );

    setText(
        "travellerUsers",
        travellers
    );

    setText(
        "partnerUsers",
        partners
    );

}


function applyUserFilters() {

    const searchValue = (
        document.getElementById("userSearch")?.value || ""
    )
        .trim()
        .toLowerCase();


    const role =
        document.getElementById("userRoleFilter")?.value || "";


    const status =
        document.getElementById("userStatusFilter")?.value || "";


    let filteredUsers = [...allUsers];


    if (searchValue) {

        filteredUsers =
            filteredUsers.filter(user => {

                const name =
                    `${user.firstName || ""} ${user.lastName || ""}`
                        .toLowerCase();

                const email =
                    (user.email || "").toLowerCase();

                const phone =
                    (user.phone || "").toLowerCase();

                const city =
                    (user.city || "").toLowerCase();


                return (
                    name.includes(searchValue) ||
                    email.includes(searchValue) ||
                    phone.includes(searchValue) ||
                    city.includes(searchValue)
                );

            });

    }


    if (role) {

        filteredUsers =
            filteredUsers.filter(
                user => user.role === role
            );

    }


    if (status) {

        filteredUsers =
            filteredUsers.filter(
                user => user.accountStatus === status
            );

    }


    renderUsers(filteredUsers);

}


function renderUsers(users) {

    const tbody =
        document.getElementById(
            "usersTableBody"
        );


    const emptyState =
        document.getElementById(
            "usersEmpty"
        );


    const tableContainer =
        document.getElementById(
            "usersTableContainer"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = "";


    if (!users.length) {

        tableContainer.style.display =
            "none";

        emptyState.style.display =
            "block";

        return;
    }


    tableContainer.style.display =
        "block";

    emptyState.style.display =
        "none";


    users.forEach(user => {

        const row =
            document.createElement("tr");


        const fullName =
            `${user.firstName || ""} ${user.lastName || ""}`
                .trim() ||
            "Unknown User";


        const initials =
            getInitials(fullName);


        const role =
            user.role || "customer";


        const status =
            user.accountStatus || "active";


        const registeredDate =
            user.createdAt
                ? formatDate(user.createdAt)
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
                            ${escapeHTML(user.email || "-")}
                        </small>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(user.phone || "-")}
            </td>


            <td>

                <span class="admin-status ${getRoleClass(role)}">
                    ${capitalize(role)}
                </span>

            </td>


            <td>
                ${escapeHTML(registeredDate)}
            </td>


            <td>

                ${
                    user.phoneVerified
                        ? `
                            <span class="phone-verified">
                                <i class="bi bi-check-circle-fill"></i>
                                Verified
                            </span>
                        `
                        : `
                            <span class="phone-unverified">
                                Not verified
                            </span>
                        `
                }

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
                    onclick="openUserDetails('${user._id}')"
                >
                    View
                    <i class="bi bi-arrow-right"></i>
                </button>

            </td>

        `;


        tbody.appendChild(row);

    });

}


async function openUserDetails(userId) {

    selectedUserId = userId;


    const modalElement =
        document.getElementById(
            "userDetailsModal"
        );


    const modal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );


    showUserDetailsLoading(true);

    modal.show();


    try {

        const data =
            await adminFetch(
                `/api/admin/users/${userId}`
            );


        /*
         * The partner endpoint should only be used
         * for partners. For normal users, use the
         * data already loaded in the users table.
         */

        let user =
            allUsers.find(
                item => item._id === userId
            );


        if (!user && data) {
            user = data.user || data.partner || data;
        }


        if (!user) {
            throw new Error(
                "User details could not be found."
            );
        }


        populateUserDetails(user);


    } catch (error) {

        console.error(
            "User details error:",
            error
        );


        /*
         * If the generic user endpoint isn't available,
         * we still show the information already loaded.
         */

        const user =
            allUsers.find(
                item => item._id === userId
            );


        if (user) {

            populateUserDetails(user);

        } else {

            alert(
                error.message ||
                "Unable to load user details."
            );

            modal.hide();

        }

    } finally {

        showUserDetailsLoading(false);

    }

}


function populateUserDetails(user) {

    const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`
            .trim() ||
        "Unknown User";


    const role =
        user.role || "customer";


    const status =
        user.accountStatus || "active";


    setText(
        "userDetailAvatar",
        getInitials(fullName)
    );


    setText(
        "userDetailName",
        fullName
    );


    setText(
        "userDetailEmail",
        user.email || "-"
    );


    setText(
        "userDetailPhone",
        user.phone || "-"
    );


    setText(
        "userDetailCity",
        user.city || "-"
    );


    setText(
        "userDetailAddress",
        user.address || "-"
    );


    setText(
        "userDetailRegistered",
        user.createdAt
            ? formatDate(user.createdAt)
            : "-"
    );


    setText(
        "userDetailPhoneVerified",
        user.phoneVerified
            ? "Verified"
            : "Not verified"
    );


    setText(
        "userDetailStatus",
        capitalize(status)
    );


    setText(
        "userDetailAuth",
        capitalize(
            user.authProvider || "-"
        )
    );


    setText(
        "userDetailPartnerStatus",
        capitalize(
            user.partnerStatus || "Not applicable"
        )
    );


    const roleElement =
        document.getElementById(
            "userDetailRole"
        );


    if (roleElement) {

        roleElement.textContent =
            capitalize(role);

        roleElement.className =
            `admin-status ${getRoleClass(role)}`;

    }


    const content =
        document.getElementById(
            "userDetailsContent"
        );


    if (content) {
        content.style.display = "block";
    }


    renderUserStatusActions(
        user
    );

}

function renderUserStatusActions(user) {

    const container =
        document.getElementById(
            "userStatusActions"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const status =
        user.accountStatus || "active";


    /*
     * Admin accounts cannot be modified
     * from the normal user management screen.
     */

    if (user.role === "admin") {

        container.innerHTML = `
            <span class="admin-account-note">
                <i class="bi bi-shield-lock-fill"></i>
                Admin account
            </span>
        `;

        return;
    }


    // ACTIVE
    if (status === "active") {

        container.innerHTML = `

            <button
                type="button"
                class="user-action-btn suspend"
                onclick="changeUserStatus(
                    '${user._id}',
                    'suspended'
                )"
            >
                <i class="bi bi-pause-circle"></i>
                Suspend Account
            </button>


            <button
                type="button"
                class="user-action-btn block"
                onclick="changeUserStatus(
                    '${user._id}',
                    'blocked'
                )"
            >
                <i class="bi bi-slash-circle"></i>
                Block Account
            </button>

        `;

        return;
    }


    // SUSPENDED
    if (status === "suspended") {

        container.innerHTML = `

            <button
                type="button"
                class="user-action-btn activate"
                onclick="changeUserStatus(
                    '${user._id}',
                    'active'
                )"
            >
                <i class="bi bi-check-circle"></i>
                Reactivate Account
            </button>


            <button
                type="button"
                class="user-action-btn block"
                onclick="changeUserStatus(
                    '${user._id}',
                    'blocked'
                )"
            >
                <i class="bi bi-slash-circle"></i>
                Block Account
            </button>

        `;

        return;
    }


    // BLOCKED
    if (status === "blocked") {

        container.innerHTML = `

            <button
                type="button"
                class="user-action-btn activate"
                onclick="changeUserStatus(
                    '${user._id}',
                    'active'
                )"
            >
                <i class="bi bi-check-circle"></i>
                Reactivate Account
            </button>

        `;

    }

}

async function changeUserStatus(
    userId,
    newStatus
) {

    const user =
        allUsers.find(
            item => item._id === userId
        );


    if (!user) {
        return;
    }


    const fullName =
        `${user.firstName || ""} ${user.lastName || ""}`
            .trim();


    let actionText = "";


    if (newStatus === "suspended") {

        actionText =
            `Suspend ${fullName}'s account?`;

    } else if (newStatus === "blocked") {

        actionText =
            `Block ${fullName}'s account?`;

    } else {

        actionText =
            `Reactivate ${fullName}'s account?`;

    }


    const confirmed =
        window.confirm(
            actionText
        );


    if (!confirmed) {
        return;
    }


    try {

        const data =
            await adminFetch(
                `/api/admin/users/${userId}/status`,
                {
                    method: "PUT",

                    body: JSON.stringify({
                        status: newStatus
                    })
                }
            );


        /*
         * Update local user data
         */

        const index =
            allUsers.findIndex(
                item => item._id === userId
            );


        if (index !== -1) {

            allUsers[index].accountStatus =
                newStatus;

        }


        /*
         * Update table
         */

        applyUserFilters();


        /*
         * Update modal
         */

        const updatedUser =
            allUsers.find(
                item => item._id === userId
            );


        if (updatedUser) {

            populateUserDetails(
                updatedUser
            );

        }


        alert(
            data.message ||
            "Account status updated successfully."
        );


    } catch (error) {

        console.error(
            "Change user status error:",
            error
        );


        alert(
            error.message ||
            "Unable to update account status."
        );

    }

}

function getRoleClass(role) {

    switch (role) {

        case "admin":
            return "status-approved";

        case "partner":
            return "status-pending";

        case "traveller":
            return "status-default";

        case "customer":
            return "status-approved";

        default:
            return "status-default";

    }

}


function updateSidebarPending() {

    /*
     * We don't need to reload the entire dashboard
     * just to display the badge, but keeping this
     * updated makes navigation consistent.
     */

    adminFetch(
        "/api/admin/dashboard"
    )
        .then(data => {

            const badge =
                document.getElementById(
                    "sidebarPendingBadge"
                );


            if (!badge) {
                return;
            }


            const pending =
                data.pendingPartners || 0;


            badge.textContent =
                pending;


            badge.style.display =
                pending > 0
                    ? "inline-flex"
                    : "none";

        })
        .catch(error => {

            console.error(
                "Pending partner badge error:",
                error
            );

        });

}


function showUsersLoading(show) {

    const loading =
        document.getElementById(
            "usersLoading"
        );


    if (loading) {

        loading.style.display =
            show ? "flex" : "none";

    }

}


function showUserDetailsLoading(show) {

    const loading =
        document.getElementById(
            "userDetailsLoading"
        );


    const content =
        document.getElementById(
            "userDetailsContent"
        );


    if (loading) {

        loading.style.display =
            show ? "flex" : "none";

    }


    if (content && show) {

        content.style.display =
            "none";

    }

}


function showUsersError(message) {

    const errorElement =
        document.getElementById(
            "usersError"
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        message;


    errorElement.style.display =
        "block";

}


function hideUsersError() {

    const errorElement =
        document.getElementById(
            "usersError"
        );


    if (errorElement) {

        errorElement.style.display =
            "none";

    }

}


function getInitials(name) {

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (!parts.length) {
        return "U";
    }


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


function formatDate(dateString) {

    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value === undefined ||
            value === null ||
            value === ""
                ? "-"
                : value;

    }

}