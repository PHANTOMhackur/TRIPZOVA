/* =========================================================
   TRIPZOVA PARTNER - PROFILE PAGE
========================================================= */

(function () {
    "use strict";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const profileForm =
        document.getElementById("partnerProfileForm");

    const saveButton =
        document.getElementById("saveProfileBtn");

    const cancelButton =
        document.getElementById("cancelProfileBtn");

    const profilePictureInput =
        document.getElementById("profilePicture");

    const removeProfilePictureButton =
        document.getElementById(
            "removeProfilePictureBtn"
        );


    /* =====================================================
       ORIGINAL PROFILE
    ===================================================== */

    let originalProfile = null;

    let selectedProfilePicture = "";


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    async function loadProfile() {

        try {

            const data =
                await partnerFetch(
                    "/api/partners/profile"
                );

            const profile =
                data.profile || data;

            originalProfile =
                JSON.parse(
                    JSON.stringify(profile)
                );

            fillProfile(profile);

        } catch (error) {

            console.error(
                "Partner profile loading error:",
                error
            );

            showError(
                error.message ||
                "Unable to load your profile."
            );

        }

    }


    /* =====================================================
       FILL FORM
    ===================================================== */

    function fillProfile(profile) {

        setValue(
            "displayName",
            profile.displayName
        );

        setValue(
            "businessName",
            profile.businessName
        );

        setValue(
            "phone",
            profile.phone
        );

        setValue(
            "email",
            profile.email
        );

        setValue(
            "city",
            profile.city
        );

        setValue(
            "partnerType",
            profile.partnerType ||
            "individual"
        );

        setValue(
            "address",
            profile.address
        );

        setValue(
            "about",
            profile.about
        );

        setValue(
            "experienceYears",
            profile.experienceYears || 0
        );


        const languages =
            Array.isArray(profile.languages)
                ? profile.languages.join(", ")
                : profile.languages || "";


        setValue(
            "languages",
            languages
        );


        /* Profile status */

        updateProfileStatus(
            profile.profileStatus
        );


        /* Visibility */

        updateVisibility(
            profile
        );


        /* Profile picture */

        if (profile.profilePicture) {

            selectedProfilePicture =
                profile.profilePicture;

            showProfilePicture(
                profile.profilePicture
            );

        } else {

            showInitials(
                profile.displayName
            );

        }


        /* Navbar */

        updateNavbar(
            profile
        );

    }


    /* =====================================================
       SET INPUT VALUE
    ===================================================== */

    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.value =
            value === null ||
            value === undefined
                ? ""
                : value;

    }


    /* =====================================================
       PROFILE STATUS
    ===================================================== */

    function updateProfileStatus(status) {

        const element =
            document.getElementById(
                "profileStatus"
            );

        if (!element) {
            return;
        }


        const cleanStatus =
            status || "incomplete";


        element.textContent =
            cleanStatus === "complete"
                ? "Complete"
                : "Incomplete";


        element.classList.remove(
            "partner-status-pending",
            "partner-status-approved",
            "partner-status-rejected",
            "partner-status-inactive"
        );


        if (cleanStatus === "complete") {

            element.classList.add(
                "partner-status-approved"
            );

        } else {

            element.classList.add(
                "partner-status-pending"
            );

        }

    }


    /* =====================================================
       VISIBILITY
    ===================================================== */

    function updateVisibility(profile) {

        const nameElement =
            document.getElementById(
                "visibilityName"
            );

        const locationElement =
            document.getElementById(
                "visibilityLocation"
            );

        const typeElement =
            document.getElementById(
                "visibilityType"
            );


        if (nameElement) {

            nameElement.textContent =
                profile.displayName ||
                "-";

        }


        if (locationElement) {

            locationElement.textContent =
                profile.city ||
                "-";

        }


        if (typeElement) {

            let type =
                profile.partnerType ||
                "-";

            type =
                type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, function (letter) {
                        return letter.toUpperCase();
                    });

            typeElement.textContent =
                type;

        }

    }


    /* =====================================================
       PROFILE AVATAR
    ===================================================== */

    function showProfilePicture(url) {

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        const initials =
            document.getElementById(
                "profileInitials"
            );


        if (!avatar) {
            return;
        }


        let image =
            avatar.querySelector("img");


        if (!image) {

            image =
                document.createElement("img");

            avatar.appendChild(image);

        }


        image.src = url;

        image.alt = "Profile Picture";


        if (initials) {
            initials.style.display = "none";
        }

    }


    function showInitials(name) {

        const avatar =
            document.getElementById(
                "profileAvatar"
            );

        const initials =
            document.getElementById(
                "profileInitials"
            );


        if (!avatar) {
            return;
        }


        const oldImage =
            avatar.querySelector("img");

        if (oldImage) {
            oldImage.remove();
        }


        if (initials) {

            initials.textContent =
                window.getInitials
                    ? window.getInitials(name)
                    : "P";

            initials.style.display =
                "block";

        }

    }


    /* =====================================================
       NAVBAR
    ===================================================== */

    function updateNavbar(profile) {

        const name =
            profile.displayName ||
            "Partner";


        const navbarName =
            document.getElementById(
                "partnerNavbarName"
            );

        const navbarInitials =
            document.getElementById(
                "partnerNavbarInitials"
            );


        if (navbarName) {
            navbarName.textContent =
                name;
        }


        if (navbarInitials) {

            navbarInitials.textContent =
                window.getInitials
                    ? window.getInitials(name)
                    : "P";

        }


        const navbarAvatar =
            document.getElementById(
                "partnerNavbarAvatar"
            );


        if (
            navbarAvatar &&
            profile.profilePicture
        ) {

            let image =
                navbarAvatar.querySelector("img");


            if (!image) {

                image =
                    document.createElement("img");

                navbarAvatar.appendChild(image);

            }


            image.src =
                profile.profilePicture;

            image.alt =
                "Partner Profile";

        }

    }


    /* =====================================================
       PROFILE PHOTO SELECTION
    ===================================================== */

    if (profilePictureInput) {

        profilePictureInput.addEventListener(
            "change",
            function () {

                const file =
                    this.files &&
                    this.files[0];


                if (!file) {
                    return;
                }


                const allowedTypes = [
                    "image/jpeg",
                    "image/png",
                    "image/webp"
                ];


                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    showError(
                        "Please select a JPG, PNG or WEBP image."
                    );

                    this.value = "";

                    return;
                }


                /* 5 MB maximum */

                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    showError(
                        "Profile photo must be smaller than 5 MB."
                    );

                    this.value = "";

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        selectedProfilePicture =
                            event.target.result;

                        showProfilePicture(
                            selectedProfilePicture
                        );

                        hideMessages();

                    };


                reader.readAsDataURL(file);

            }
        );

    }


    /* =====================================================
       REMOVE PROFILE PHOTO
    ===================================================== */

    if (removeProfilePictureButton) {

        removeProfilePictureButton.addEventListener(
            "click",
            function () {

                selectedProfilePicture =
                    "";

                if (profilePictureInput) {
                    profilePictureInput.value =
                        "";
                }


                const displayName =
                    document.getElementById(
                        "displayName"
                    )?.value ||
                    "Partner";


                showInitials(
                    displayName
                );

            }
        );

    }


    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                hideMessages();


                const displayName =
                    getValue("displayName");


                if (!displayName) {

                    showError(
                        "Display Name is required."
                    );

                    document
                        .getElementById("displayName")
                        ?.focus();

                    return;
                }


                const experienceValue =
                    getValue(
                        "experienceYears"
                    );


                let experienceYears =
                    Number(experienceValue);


                if (
                    Number.isNaN(
                        experienceYears
                    ) ||
                    experienceYears < 0
                ) {

                    experienceYears = 0;

                }


                const languagesText =
                    getValue("languages");


                const languages =
                    languagesText
                        ? languagesText
                            .split(",")
                            .map(function (language) {
                                return language.trim();
                            })
                            .filter(Boolean)
                        : [];


                const profileData = {

                    displayName,

                    businessName:
                        getValue("businessName"),

                    phone:
                        getValue("phone"),

                    email:
                        getValue("email"),

                    city:
                        getValue("city"),

                    partnerType:
                        getValue("partnerType") ||
                        "individual",

                    address:
                        getValue("address"),

                    about:
                        getValue("about"),

                    experienceYears,

                    languages

                };


                /*
                 * IMPORTANT:
                 *
                 * The current backend does not have
                 * an image-upload endpoint yet.
                 *
                 * Therefore we don't send the local
                 * base64 preview to MongoDB.
                 *
                 * Photo upload backend will be added
                 * separately.
                 */


                setSaving(true);


                try {

                    const data =
                        await partnerFetch(
                            "/api/partners/profile",
                            {
                                method: "PUT",
                                body:
                                    JSON.stringify(
                                        profileData
                                    )
                            }
                        );


                    const updatedProfile =
                        data.profile ||
                        data;


                    originalProfile =
                        JSON.parse(
                            JSON.stringify(
                                updatedProfile
                            )
                        );


                    fillProfile(
                        updatedProfile
                    );


                    showSuccess(
                        data.message ||
                        "Profile updated successfully."
                    );


                } catch (error) {

                    console.error(
                        "Profile update error:",
                        error
                    );

                    showError(
                        error.message ||
                        "Unable to update your profile."
                    );

                } finally {

                    setSaving(false);

                }

            }
        );

    }


    /* =====================================================
       CANCEL
    ===================================================== */

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            function () {

                if (!originalProfile) {
                    return;
                }


                fillProfile(
                    originalProfile
                );


                hideMessages();

            }
        );

    }


    /* =====================================================
       GET VALUE
    ===================================================== */

    function getValue(id) {

        const element =
            document.getElementById(id);

        if (!element) {
            return "";
        }

        return element.value.trim();

    }


    /* =====================================================
       BUTTON STATE
    ===================================================== */

    function setSaving(isSaving) {

        if (!saveButton) {
            return;
        }


        if (isSaving) {

            saveButton.disabled =
                true;

            saveButton.innerHTML =
                `
                <span
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true"
                ></span>
                Saving...
                `;

        } else {

            saveButton.disabled =
                false;

            saveButton.innerHTML =
                `
                <i class="bi bi-check-lg"></i>
                Save Changes
                `;

        }

    }


    /* =====================================================
       MESSAGES
    ===================================================== */

    function showError(message) {

        const element =
            document.getElementById(
                "partnerProfileError"
            );

        if (!element) {
            alert(message);
            return;
        }


        element.textContent =
            message;

        element.className =
            "partner-alert partner-alert-danger";

        element.style.display =
            "block";

    }


    function showSuccess(message) {

        const element =
            document.getElementById(
                "partnerProfileSuccess"
            );

        if (!element) {
            return;
        }


        element.textContent =
            message;

        element.className =
            "partner-alert partner-alert-success";

        element.style.display =
            "block";

    }


    function hideMessages() {

        const error =
            document.getElementById(
                "partnerProfileError"
            );

        const success =
            document.getElementById(
                "partnerProfileSuccess"
            );


        if (error) {
            error.style.display =
                "none";
        }


        if (success) {
            success.style.display =
                "none";
        }

    }


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        loadProfile
    );

})();