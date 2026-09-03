/* =========================================================
   TRIPZOVA ADMIN
   Dashboard JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();

});


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        await Promise.all([
            loadDashboardStats(),
            loadRecentPartners()
        ]);

    } catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );

    }

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

async function loadDashboardStats() {

    try {

        const data =
            await adminFetch(
                "/api/admin/dashboard"
            );


        if (!data || !data.stats) {
            return;
        }


        const stats =
            data.stats;


        /* -----------------------------------------
           MAIN STAT CARDS
        ----------------------------------------- */

        setText(
            "totalUsers",
            formatNumber(stats.totalUsers)
        );


        setText(
            "totalPartners",
            formatNumber(stats.approvedPartners)
        );


        setText(
            "pendingPartners",
            formatNumber(stats.pendingPartners)
        );


        /*
            Bookings will remain 0 until the
            Booking model/API is created.
        */

        setText(
            "totalBookings",
            "0"
        );


        /* -----------------------------------------
           USER DISTRIBUTION
        ----------------------------------------- */

        setText(
            "customerCount",
            formatNumber(stats.customers)
        );


        setText(
            "travellerCount",
            formatNumber(stats.travellers)
        );


        setText(
            "partnerCount",
            formatNumber(stats.partners)
        );


        /*
            Calculate customer percentage.
        */

        const totalAccountUsers =
            stats.customers +
            stats.travellers +
            stats.partners;


        let customerPercentage = 0;


        if (totalAccountUsers > 0) {

            customerPercentage =
                Math.round(
                    (
                        stats.customers /
                        totalAccountUsers
                    ) * 100
                );

        }


        setText(
            "customerPercentage",
            `${customerPercentage}%`
        );


        /* -----------------------------------------
           SIDEBAR PENDING BADGE
        ----------------------------------------- */

        setText(
            "pendingPartnerBadge",
            formatNumber(
                stats.pendingPartners
            )
        );


        /* -----------------------------------------
           DISABLE PENDING BADGE IF ZERO
        ----------------------------------------- */

        const pendingBadge =
            document.getElementById(
                "pendingPartnerBadge"
            );


        if (pendingBadge) {

            if (
                Number(stats.pendingPartners) === 0
            ) {

                pendingBadge.style.display =
                    "none";

            } else {

                pendingBadge.style.display =
                    "inline-flex";

            }

        }


    } catch (error) {

        console.error(
            "Could not load dashboard statistics:",
            error
        );

    }

}


/* =========================================================
   RECENT PARTNERS
========================================================= */

async function loadRecentPartners() {

    const table =
        document.getElementById(
            "recentPartnersTable"
        );


    if (!table) {
        return;
    }


    try {

        const data =
            await adminFetch(
                "/api/admin/dashboard/recent-partners"
            );


        const partners =
            data.partners || [];


        if (partners.length === 0) {

            table.innerHTML = `

                <tr>

                    <td colspan="5">

                        <div class="table-loading">

                            <i class="bi bi-person-check"></i>

                            No partner applications yet.

                        </div>

                    </td>

                </tr>

            `;

            return;

        }


        /*
            Only show the latest 5
            on dashboard.
        */

        const recentPartners =
            partners.slice(0, 5);


        table.innerHTML =
            recentPartners
                .map(
                    partner =>
                        createPartnerRow(partner)
                )
                .join("");


    } catch (error) {

        console.error(
            "Could not load recent partners:",
            error
        );


        table.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="table-loading">

                        <i class="bi bi-exclamation-circle"></i>

                        Unable to load partner requests.

                    </div>

                </td>

            </tr>

        `;

    }

}


/* =========================================================
   PARTNER TABLE ROW
========================================================= */

function createPartnerRow(partner) {

    const firstName =
        escapeHTML(
            partner.firstName || ""
        );


    const lastName =
        escapeHTML(
            partner.lastName || ""
        );


    const fullName =
        `${firstName} ${lastName}`.trim();


    const email =
        escapeHTML(
            partner.email || "-"
        );


    const phone =
        escapeHTML(
            partner.phone || "-"
        );


    const city =
        escapeHTML(
            partner.city || "-"
        );


    const status =
        String(
            partner.partnerStatus || "pending"
        ).toLowerCase();


    const statusClass =
        getStatusClass(status);


    const formattedStatus =
        status.charAt(0).toUpperCase() +
        status.slice(1);


    return `

        <tr>

            <td>

                <div class="partner-table-user">

                    <div class="partner-table-avatar">

                        ${getInitials(
                            partner.firstName,
                            partner.lastName
                        )}

                    </div>

                    <div>

                        <strong>
                            ${fullName || "Unknown"}
                        </strong>

                        <small>
                            ${email}
                        </small>

                    </div>

                </div>

            </td>


            <td>
                ${phone}
            </td>


            <td>
                ${city}
            </td>


            <td>

                <span class="
                    admin-status
                    ${statusClass}
                ">
                    ${formattedStatus}
                </span>

            </td>


            <td>

                <a
                    href="partners.html"
                    class="table-action-link"
                >
                    View
                </a>

            </td>

        </tr>

    `;

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    firstName,
    lastName
) {

    const first =
        String(firstName || "")
            .trim()
            .charAt(0)
            .toUpperCase();


    const last =
        String(lastName || "")
            .trim()
            .charAt(0)
            .toUpperCase();


    const initials =
        `${first}${last}`;


    return escapeHTML(
        initials || "U"
    );

}


/* =========================================================
   SET TEXT HELPER
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        value;

}