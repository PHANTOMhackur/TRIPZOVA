// =====================================================
// TRIPZOVA PARTNER PROFILE
// =====================================================

(function () {
    "use strict";


    let originalProfile = null;
    let selectedProfilePicture = "";


    // =================================================
    // LOAD PROFILE
    // =================================================

    async function loadPartnerProfile() {

        try {

            const response =
                await partnerFetch(
                    "/api/partners/profile"
                );

            const profile =
                response.profile ||
                response.data?.profile ||
                response.data;


            if (!profile) {
                throw new Error(
                    "Profile data not found."
                );
            }


            originalProfile =
                JSON.parse(
                    JSON.stringify(profile)
                );


            populateProfile(profile);

        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );

            showProfileError(
                error.message ||
                "Unable to load your profile."
            );
        }
    }


    // =================================================
    // POPULATE FORM
    // =================================================

    function populateProfile(profile) {

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

        setValue(
            "partnerType",
            profile.partnerType ||
            "individual"
        );


        // Languages

        const languages =
            Array.isArray(profile.languages)
                ? profile.languages.join(", ")
                : "";

        setValue(
            "languages",
            languages
        );


        selectedProfilePicture =
            profile.profilePicture || "";


        updateAvatar(
            profile
        );


        updateVisibility(
            profile
        );


        updateProfileStatus(
            profile
        );
    }


    // =================================================
    // SAVE PROFILE
    // =================================================

    async function saveProfile(event) {

        event.preventDefault();


        const displayName =
            getValue("displayName").trim();


        if (!displayName) {

            showProfileError(
                "Display name is required."
            );

            document
                .getElementById("displayName")
                ?.focus();

            return;
        }


        const experienceValue =
            Number(
                getValue(
                    "experienceYears"
                ) || 0
            );


        if (
            experienceValue < 0 ||
            experienceValue > 100
        ) {

            showProfileError(
                "Experience must be between 0 and 100 years."
            );

            return;
        }


        const languages =
            getValue("languages")
                .split(",")
                .map(
                    function (language) {
                        return language.trim();
                    }
                )
                .filter(Boolean);


        const profileData = {

            profilePicture:
                selectedProfilePicture,

            businessName:
                getValue(
                    "businessName"
                ).trim(),

            displayName,

            phone:
                getValue(
                    "phone"
                ).trim(),

            email:
                getValue(
                    "email"
                ).trim(),

            city:
                getValue(
                    "city"
                ).trim(),

            address:
                getValue(
                    "address"
                ).trim(),

            about:
                getValue(
                    "about"
                ).trim(),

            experienceYears:
                experienceValue,

            languages,

            partnerType:
                getValue(
                    "partnerType"
                ),

            profileStatus:
                "complete"
        };


        const saveButton =
            document.getElementById(
                "saveProfileBtn"
            );


        try {

            setButtonLoading(
                saveButton,
                true
            );


            hideProfileMessages();


            const response =
                await partnerFetch(
                    "/api/partners/profile",
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            profileData
                        )
                    }
                );


            const updatedProfile =
                response.profile ||
                response.data?.profile ||
                response.data;


            if (updatedProfile) {

                originalProfile =
                    JSON.parse(
                        JSON.stringify(
                            updatedProfile
                        )
                    );

                populateProfile(
                    updatedProfile
                );
            }


            showProfileSuccess(
                response.message ||
                "Profile updated successfully."
            );


        } catch (error) {

            console.error(
                "Profile save error:",
                error
            );

            showProfileError(
                error.message ||
                "Unable to save your profile."
            );

        } finally {

            setButtonLoading(
                saveButton,
                false
            );
        }
    }


    // =================================================
    // PROFILE PICTURE
    // =================================================

    function initializeProfilePicture() {

        const input =
            document.getElementById(
                "profilePicture"
            );


        if (!input) {
            return;
        }


        input.addEventListener(
            "change",
            function () {

                const file =
                    input.files?.[0];


                if (!file) {
                    return;
                }


                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {

                    showProfileError(
                        "Please select a valid image."
                    );

                    input.value = "";

                    return;
                }


                if (
                    file.size >
                    5 * 1024 * 1024
                ) {

                    showProfileError(
                        "Profile picture must be smaller than 5 MB."
                    );

                    input.value = "";

                    return;
                }


                const reader =
                    new FileReader();


                reader.onload =
                    function (event) {

                        selectedProfilePicture =
                            event.target.result;


                        updateAvatar({
                            displayName:
                                getValue(
                                    "displayName"
                                ),
                            profilePicture:
                                selectedProfilePicture
                        });
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    // =================================================
    // REMOVE PROFILE PICTURE
    // =================================================

    function initializeRemovePicture() {

        const button =
            document.getElementById(
                "removeProfilePictureBtn"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                selectedProfilePicture =
                    "";


                const input =
                    document.getElementById(
                        "profilePicture"
                    );


                if (input) {
                    input.value = "";
                }


                updateAvatar({
                    displayName:
                        getValue(
                            "displayName"
                        ),
                    profilePicture: ""
                });
            }
        );
    }


    // =================================================
    // CANCEL
    // =================================================

    function initializeCancel() {

        const button =
            document.getElementById(
                "cancelProfileBtn"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function () {

                if (
                    originalProfile
                ) {

                    populateProfile(
                        originalProfile
                    );

                    hideProfileMessages();

                } else {

                    loadPartnerProfile();
                }
            }
        );
    }


    // =================================================
    // AVATAR
    // =================================================

    function updateAvatar(profile) {

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


        if (
            profile.profilePicture
        ) {

            avatar.innerHTML = `
                <img
                    src="${escapeHTML(
                        profile.profilePicture
                    )}"
                    alt="${escapeHTML(
                        profile.displayName ||
                        "Partner"
                    )}"
                >
            `;

        } else {

            const name =
                profile.displayName ||
                "Partner";


            avatar.innerHTML = `
                <span>
                    ${escapeHTML(
                        getInitials(name)
                    )}
                </span>
            `;
        }
    }


    // =================================================
    // VISIBILITY
    // =================================================

    function updateVisibility(profile) {

        setText(
            "visibilityName",
            profile.displayName ||
            "-"
        );


        setText(
            "visibilityLocation",
            profile.city ||
            "-"
        );


        setText(
            "visibilityType",
            formatStatus(
                profile.partnerType ||
                "individual"
            )
        );
    }


    // =================================================
    // PROFILE STATUS
    // =================================================

    function updateProfileStatus(profile) {

        const statusElement =
            document.getElementById(
                "profileStatus"
            );


        if (!statusElement) {
            return;
        }


        const status =
            profile.user?.partnerStatus ||
            profile.partnerStatus ||
            "pending";


        statusElement.textContent =
            formatStatus(status);


        statusElement.className =
            `partner-status ${getStatusClass(
                status
            )}`;
    }


    // =================================================
    // FORM HELPERS
    // =================================================

    function getValue(id) {

        const element =
            document.getElementById(id);

        return element
            ? element.value
            : "";
    }


    function setValue(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.value =
                value ?? "";
        }
    }


    // =================================================
    // BUTTON LOADING
    // =================================================

    function setButtonLoading(
        button,
        loading
    ) {

        if (!button) {
            return;
        }


        if (loading) {

            button.dataset.originalText =
                button.innerHTML;

            button.disabled = true;

            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>
                Saving...
            `;

        } else {

            button.disabled = false;

            button.innerHTML =
                button.dataset.originalText ||
                `
                    <i class="bi bi-check-lg"></i>
                    Save Changes
                `;
        }
    }


    // =================================================
    // MESSAGES
    // =================================================

    function hideProfileMessages() {

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


    function showProfileError(message) {

        const element =
            document.getElementById(
                "partnerProfileError"
            );


        if (!element) {
            return;
        }


        element.className =
            "partner-alert partner-alert-danger mb-4";


        element.innerHTML = `
            <i class="bi bi-exclamation-triangle"></i>
            <span>
                ${escapeHTML(message)}
            </span>
        `;


        element.style.display =
            "block";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }


    function showProfileSuccess(message) {

        const element =
            document.getElementById(
                "partnerProfileSuccess"
            );


        if (!element) {
            return;
        }


        element.className =
            "partner-alert partner-alert-success mb-4";


        element.innerHTML = `
            <i class="bi bi-check-circle"></i>
            <span>
                ${escapeHTML(message)}
            </span>
        `;


        element.style.display =
            "block";


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        setTimeout(
            function () {

                element.style.display =
                    "none";

            },
            5000
        );
    }


    // =================================================
    // START
    // =================================================

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            if (
                typeof requirePartnerLogin ===
                "function"
            ) {

                if (
                    !requirePartnerLogin()
                ) {
                    return;
                }
            }


            loadPartnerProfile();

            initializeProfilePicture();

            initializeRemovePicture();

            initializeCancel();


            const form =
                document.getElementById(
                    "partnerProfileForm"
                );


            if (form) {

                form.addEventListener(
                    "submit",
                    saveProfile
                );
            }
        }
    );

})();