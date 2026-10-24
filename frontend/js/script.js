/* =========================================================
   VISION STUDIO
   Complete Frontend Application Logic
   ========================================================= */

"use strict";

const VISION_CONFIG = {
    API_BASE_URL: "http://127.0.0.1:8000",
    ENDPOINTS: {
        HEALTH: "/api/health",
        CREATE_USER: "/api/enrollment/user",
        RECOGNIZE: "/api/recognition",
        FILTERS_ASCII: "/api/filters/ascii",
        ENROLL_EMBEDDING: (userId, pose) =>
            `/api/enrollment/${encodeURIComponent(userId)}/embedding?pose=${encodeURIComponent(pose)}`
    },

    CAMERA: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user"
    },

    IMAGE: {
        maxSizeMB: 10,
        acceptedTypes: [
            "image/jpeg",
            "image/png",
            "image/webp"
        ],
        captureType: "image/jpeg",
        captureQuality: 0.92
    },

    STORAGE: {
        THEME: "vision-studio-theme"
    },

    MOBILE_BREAKPOINT: 768,
    API_TIMEOUT: 60000
};


const state = {
    theme: "light",
    selectedDeviceId: "",
    availableVideoDevices: [],

    currentUser: {
        verified: false,
        name: null,
        userId: null
    },

    recognition: {
        stream: null,
        cameraActive: false,
        cameraStarting: false,
        selectedFile: null,
        previewUrl: null,
        loading: false,
        result: null
    },

    enrollment: {
        stream: null,
        cameraActive: false,
        cameraStarting: false,
        userId: null,
        activePose: "CENTER",
        selectedFile: null,
        previewUrl: null,
        completedPoses: new Set(),
        loading: false
    },

    filters: {
        stream: null,
        cameraActive: false,
        cameraStarting: false,
        activeFilter: "ascii",
        isFrozen: false,
        frozenImageData: null,
        lastAsciiArt: "",
        fps: 0,
        asciiWidth: 90,
        retroPixelSize: 8,
        halftoneDotSize: 8,
        neonThreshold: 35,
        thermalBias: 0,
        contrast: 1.2,
        theme: "matrix",
        invert: false,
        mirror: true,
        animationFrameId: null,
        lastFrameTime: performance.now(),
        frameCount: 0
    }
};


const DOM = {};


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    cacheDOM();

    initializeTheme();
    initializeNavigation();
    initializeMobileNavigation();
    initializeBackToTop();

    initializeRecognition();
    initializeEnrollment();
    initializeGuidedEnrollment();
    initializeCameraDeviceSelection();
    initializeFilters();

    initializeGlobalFormValidation();

    updateRecognitionUI();
    updateEnrollmentUI();
});


window.addEventListener(
    "pagehide",
    stopAllCameras
);

window.addEventListener(
    "beforeunload",
    stopAllCameras
);


/* =========================================================
   DOM CACHE
   ========================================================= */

function cacheDOM() {

    DOM.themeToggle =
        document.getElementById("theme-toggle");

    DOM.menuToggle =
        document.querySelector(".mobile-menu-btn");

    DOM.navLinks =
        document.querySelector(".nav-links");


    /* -----------------------------------------------------
       Recognition
       ----------------------------------------------------- */

    DOM.recognitionVideo =
        document.getElementById("recognition-video");

    DOM.recognitionPreview =
        document.getElementById("recognition-preview");

    DOM.cameraPlaceholder =
        document.getElementById("camera-placeholder");

    DOM.cameraStatus =
        document.getElementById("camera-status");

    DOM.faceGuides =
        document.querySelectorAll(
            ".camera-frame .face-guide"
        );

    DOM.startCameraButton =
        document.getElementById("start-camera-btn");

    DOM.captureButton =
        document.getElementById("capture-btn");

    DOM.recognitionFileInput =
        document.getElementById("recognition-image");

    DOM.recognitionFileName =
        document.getElementById("recognition-file-name");

    DOM.recognitionDropzone =
        document
            .querySelector("#recognition-image")
            ?.closest(".upload-area")
            ?.querySelector(".upload-dropzone");

    DOM.recognitionResult =
        document.getElementById("recognition-result");

    DOM.recognitionDetails =
        document.getElementById("recognition-details");

    DOM.recognitionStatus =
        document.getElementById("recognition-status");

    DOM.recognizedName =
        document.getElementById("recognized-name");

    DOM.recognizedUserId =
        document.getElementById("recognized-user-id");

    DOM.recognitionSimilarity =
        document.getElementById("recognition-similarity");

    DOM.recognitionBestSimilarity =
        document.getElementById(
            "recognition-best-similarity"
        );

    DOM.recognitionPose =
        document.getElementById("recognition-pose");

    DOM.recognizeButton =
        document.getElementById("recognize-btn");

    DOM.recognitionMessage =
        document.getElementById("recognition-message");


    /* -----------------------------------------------------
       Enrollment
       ----------------------------------------------------- */

    DOM.enrollmentForm =
        document.getElementById("enrollment-form");

    DOM.fullNameInput =
        document.getElementById("user-name");

    DOM.emailInput =
        document.getElementById("user-email");

    DOM.phoneInput =
        document.getElementById("user-phone");

    DOM.dobInput =
        document.getElementById("user-dob");

    DOM.createUserButton =
        document.getElementById("create-user-btn");

    DOM.enrollmentFormMessage =
        document.getElementById(
            "enrollment-form-message"
        );

    DOM.enrollmentUserStatus =
        document.getElementById(
            "enrollment-user-status"
        );

    DOM.enrollmentVideo =
        document.getElementById("enrollment-video");

    DOM.enrollmentPreview =
        document.getElementById("enrollment-preview");

    DOM.enrollmentPlaceholder =
        document.getElementById(
            "enrollment-camera-placeholder"
        );

    DOM.enrollmentFaceGuide =
        document.querySelector(
            ".enrollment-camera .face-guide"
        );

    DOM.enrollmentCameraButton =
        document.getElementById(
            "enrollment-camera-btn"
        );

    DOM.enrollmentCaptureButton =
        document.getElementById(
            "enrollment-capture-btn"
        );

    DOM.enrollmentFileInput =
        document.getElementById(
            "enrollment-image"
        );

    DOM.enrollmentFileName =
        document.getElementById(
            "enrollment-file-name"
        );

    DOM.enrollmentDropzone =
        document.querySelector(
            "label[for='enrollment-image']"
        );

    DOM.enrollPoseButton =
        document.getElementById(
            "enroll-pose-btn"
        );

    DOM.enrollmentMessage =
        document.getElementById(
            "enrollment-message"
        );

    DOM.poseProgress =
        document.getElementById(
            "pose-progress"
        );

    DOM.poseOptions =
        Array.from(
            document.querySelectorAll(
                "#pose-grid .pose-option"
            )
        );

    DOM.backToTop =
        document.getElementById("back-to-top");

    /* -----------------------------------------------------
       Camera Selects & Cross-Component Elements
       ----------------------------------------------------- */

    DOM.recognitionCameraSelect =
        document.getElementById("recognition-camera-select");

    DOM.enrollmentCameraSelect =
        document.getElementById("enrollment-camera-select");

    DOM.filterCameraSelect =
        document.getElementById("filter-camera-select");

    DOM.recognitionVerifiedBanner =
        document.getElementById("recognition-verified-banner");

    DOM.enrollmentGuideBox =
        document.getElementById("enrollment-guide-box");

    DOM.guideStepBadge =
        document.getElementById("guide-step-badge");

    DOM.guideIcon =
        document.getElementById("guide-icon");

    DOM.guideStepNumber =
        document.getElementById("guide-step-number");

    DOM.guidePoseTitle =
        document.getElementById("guide-pose-title");

    DOM.guidePoseDesc =
        document.getElementById("guide-pose-desc");

    DOM.enrollmentSuccessCard =
        document.getElementById("enrollment-success-card");

    DOM.enrollmentLaunchFiltersBtn =
        document.getElementById("enrollment-launch-filters-btn");

    DOM.filtersNavBadge =
        document.getElementById("filters-nav-badge");

    DOM.filtersAccessBanner =
        document.getElementById("filters-access-banner");

    DOM.filtersAccessText =
        document.getElementById("filters-access-text");

    /* -----------------------------------------------------
       Stage Flow & Stepper DOM
       ----------------------------------------------------- */

    DOM.recognitionSection =
        document.getElementById("recognition");

    DOM.enrollmentSection =
        document.getElementById("enrollment");

    DOM.filtersSection =
        document.getElementById("filters");

    DOM.stepChips =
        Array.from(document.querySelectorAll(".step-chip"));

    DOM.btnGotoEnroll =
        document.getElementById("btn-goto-enroll");

    DOM.btnBackToRecog =
        document.getElementById("btn-back-to-recog");

    DOM.btnFiltersBackToRecog =
        document.getElementById("btn-filters-back-to-recog");

    DOM.btnVerifiedOpenFilters =
        document.getElementById("btn-verified-open-filters");

    /* -----------------------------------------------------
       Filters Studio DOM
       ----------------------------------------------------- */

    DOM.filterTabs =
        Array.from(
            document.querySelectorAll(".filter-tab")
        );

    DOM.currentFilterTitle =
        document.getElementById("current-filter-title");

    DOM.filterFpsBadge =
        document.getElementById("filter-fps-badge");

    DOM.filterStage =
        document.getElementById("filter-stage");

    DOM.filterVideo =
        document.getElementById("filter-video");

    DOM.filterCanvas =
        document.getElementById("filter-canvas");

    DOM.asciiDisplay =
        document.getElementById("ascii-display");

    DOM.filterPlaceholder =
        document.getElementById("filter-placeholder");

    DOM.filterStartBtn =
        document.getElementById("filter-start-btn");

    DOM.filterFreezeBtn =
        document.getElementById("filter-freeze-btn");

    DOM.filterCopyAsciiBtn =
        document.getElementById("filter-copy-ascii-btn");

    DOM.filterDownloadTxtBtn =
        document.getElementById("filter-download-txt-btn");

    DOM.filterDownloadPngBtn =
        document.getElementById("filter-download-png-btn");

    DOM.filterFullscreenBtn =
        document.getElementById("filter-fullscreen-btn");

    DOM.filterMessage =
        document.getElementById("filter-message");

    DOM.ctrlAsciiWidth =
        document.getElementById("ctrl-ascii-width");

    DOM.resolutionSliderLabel =
        document.getElementById("resolution-slider-label");

    DOM.asciiResolutionSlider =
        document.getElementById("ascii-resolution-slider");

    DOM.asciiResolutionVal =
        document.getElementById("ascii-resolution-val");

    DOM.filterContrastSlider =
        document.getElementById("filter-contrast-slider");

    DOM.filterContrastVal =
        document.getElementById("filter-contrast-val");

    DOM.filterThemeSelect =
        document.getElementById("filter-theme-select");

    DOM.filterInvertToggle =
        document.getElementById("filter-invert-toggle");

    DOM.filterMirrorToggle =
        document.getElementById("filter-mirror-toggle");

    DOM.asciiLegend =
        document.getElementById("ascii-legend");
}


/* =========================================================
   THEME
   ========================================================= */

function initializeTheme() {

    if (!DOM.themeToggle) {
        return;
    }

    const saved =
        localStorage.getItem(
            VISION_CONFIG.STORAGE.THEME
        );

    state.theme =
        saved === "dark" ||
        saved === "light"
            ? saved
            : (
                window
                    .matchMedia?.(
                        "(prefers-color-scheme: dark)"
                    )
                    .matches
                    ? "dark"
                    : "light"
            );

    applyTheme(state.theme);


    DOM.themeToggle.addEventListener(
        "click",
        () => {

            state.theme =
                state.theme === "dark"
                    ? "light"
                    : "dark";

            applyTheme(state.theme);

            localStorage.setItem(
                VISION_CONFIG.STORAGE.THEME,
                state.theme
            );
        }
    );
}


function applyTheme(theme) {

    if (theme === "dark") {

        document.documentElement.setAttribute(
            "data-theme",
            "dark"
        );

    } else {

        document.documentElement.removeAttribute(
            "data-theme"
        );
    }


    const icon =
        DOM.themeToggle?.querySelector("i");

    if (icon) {

        icon.className =
            theme === "dark"
                ? "fas fa-sun"
                : "fas fa-moon";
    }


    DOM.themeToggle?.setAttribute(
        "aria-label",
        theme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode"
    );
}


/* =========================================================
   STAGE FLOW & NAVIGATION
   ========================================================= */

function initializeNavigation() {
    // Stepper chips
    DOM.stepChips?.forEach(chip => {
        chip.addEventListener("click", () => {
            const target = chip.dataset.target;
            if (target) {
                navigateToStage(target);
            }
        });
    });

    // Desktop & mobile nav links
    document.querySelectorAll(".nav-links a[href^='#']").forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            const target = href.replace("#", "");
            if (["recognition", "enrollment", "filters"].includes(target)) {
                event.preventDefault();
                navigateToStage(target);
            }
            closeMobileNavigation();
        });
    });

    // Logo click goes directly to stage 1 (Identify Face)
    document.querySelector(".logo")?.addEventListener("click", event => {
        event.preventDefault();
        navigateToStage("recognition");
    });

    // Button: "New user? Enroll face" in Identification stage
    DOM.btnGotoEnroll?.addEventListener("click", () => {
        navigateToStage("enrollment");
    });

    // Button: "Back to Face Identification" in Enrollment stage
    DOM.btnBackToRecog?.addEventListener("click", () => {
        navigateToStage("recognition");
    });

    // Button: "Back to Face Identification" in Filters Studio stage
    DOM.btnFiltersBackToRecog?.addEventListener("click", () => {
        navigateToStage("recognition");
    });

    // Button: "Open Filters Studio" in Recognition verified banner
    DOM.btnVerifiedOpenFilters?.addEventListener("click", () => {
        navigateToStage("filters", true);
    });

    // Button: "Launch Filters Studio" in Enrollment success card
    DOM.enrollmentLaunchFiltersBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToStage("filters", true);
    });

    // Handle initial stage on page load based on URL hash
    const initialHash = window.location.hash.replace("#", "");
    if (["enrollment", "filters"].includes(initialHash)) {
        navigateToStage(initialHash);
    } else {
        navigateToStage("recognition");
    }
}


function navigateToStage(stageName, autoStartCamera = false) {
    if (!["recognition", "enrollment", "filters"].includes(stageName)) {
        stageName = "recognition";
    }

    // Always stop running cameras from the previous view to prevent multi-feed overlap
    stopAllCameras();

    // Toggle active classes and display property on stage sections
    const stages = [
        { id: "recognition", el: DOM.recognitionSection },
        { id: "enrollment", el: DOM.enrollmentSection },
        { id: "filters", el: DOM.filtersSection }
    ];

    stages.forEach(s => {
        if (!s.el) return;
        const isActive = s.id === stageName;
        s.el.classList.toggle("active", isActive);
        s.el.style.display = isActive ? "block" : "none";
    });

    // Update stepper chips
    DOM.stepChips?.forEach(chip => {
        const isChipActive = chip.dataset.target === stageName;
        chip.classList.toggle("active", isChipActive);
        chip.setAttribute("aria-selected", isChipActive ? "true" : "false");
    });

    // Update navbar active link
    DOM.navLinks?.querySelectorAll(".nav-link").forEach(link => {
        const href = link.getAttribute("href");
        link.classList.toggle("active", href === `#${stageName}`);
    });

    // Smooth scroll to top of workspace
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update URL hash without reload
    try {
        history.replaceState(null, "", `#${stageName}`);
    } catch (_) {}

    // Auto-start camera if requested (e.g. entering Filters after verification or enrollment)
    if (autoStartCamera && stageName === "filters") {
        setTimeout(() => {
            if (!state.filters.cameraActive) {
                startFiltersCamera();
            }
        }, 350);
    }
}


function initializeMobileNavigation() {

    if (
        !DOM.menuToggle ||
        !DOM.navLinks
    ) {
        return;
    }


    DOM.menuToggle.addEventListener(
        "click",
        () => {

            const open =
                DOM.navLinks.classList.toggle(
                    "active"
                );

            DOM.menuToggle.setAttribute(
                "aria-expanded",
                String(open)
            );
        }
    );


    DOM.navLinks
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMobileNavigation
            );
        });


    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >
                VISION_CONFIG.MOBILE_BREAKPOINT
            ) {
                closeMobileNavigation();
            }
        }
    );
}


function closeMobileNavigation() {

    DOM.navLinks?.classList.remove(
        "active"
    );

    DOM.menuToggle?.setAttribute(
        "aria-expanded",
        "false"
    );
}


function initializeBackToTop() {

    if (!DOM.backToTop) {
        return;
    }


    const update = () => {

        DOM.backToTop.classList.toggle(
            "visible",
            window.scrollY > 500
        );
    };


    window.addEventListener(
        "scroll",
        update,
        { passive: true }
    );

    update();


    DOM.backToTop.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );
}


/* =========================================================
   RECOGNITION
   ========================================================= */

function initializeRecognition() {

    DOM.startCameraButton?.addEventListener(
        "click",
        startRecognitionCamera
    );

    DOM.captureButton?.addEventListener(
        "click",
        captureRecognitionImage
    );

    DOM.recognizeButton?.addEventListener(
        "click",
        recognizeSelectedImage
    );

    DOM.recognitionFileInput?.addEventListener(
        "change",
        handleRecognitionFile
    );


    initializeDropzone(
        DOM.recognitionDropzone,
        DOM.recognitionFileInput,
        processRecognitionFile
    );


    showRecognitionPlaceholder();
}


async function startRecognitionCamera() {

    if (
        state.recognition.cameraStarting ||
        state.recognition.cameraActive
    ) {
        return;
    }


    if (
        !navigator.mediaDevices?.getUserMedia
    ) {

        setRecognitionMessage(
            "Camera access is not supported by this browser.",
            "error"
        );

        return;
    }


    state.recognition.cameraStarting = true;

    setButtonLoading(
        DOM.startCameraButton,
        true,
        "Starting..."
    );


    try {

        const stream =
            await getCameraStream();

        stopRecognitionCamera();


        state.recognition.stream =
            stream;

        state.recognition.cameraActive =
            true;


        attachStream(
            DOM.recognitionVideo,
            stream
        );

        showLiveRecognitionCamera();


        setButtonDisabled(
            DOM.captureButton,
            false
        );


        setCameraStatus(
            "Camera ready",
            "success"
        );


        setRecognitionMessage(
            "Camera ready. Position your face inside the frame.",
            "success"
        );

    } catch (error) {

        state.recognition.stream =
            null;

        state.recognition.cameraActive =
            false;


        setCameraStatus(
            "Unavailable",
            "error"
        );


        setRecognitionMessage(
            getCameraErrorMessage(error),
            "error"
        );

    } finally {

        state.recognition.cameraStarting =
            false;

        setButtonLoading(
            DOM.startCameraButton,
            false
        );
    }
}


async function getCameraStream(preferredDeviceId = null) {

    // If no device ID explicitly selected, try resolving Integrated Camera first
    if (!preferredDeviceId && !state.selectedDeviceId && navigator.mediaDevices?.enumerateDevices) {
        try {
            const devList = await navigator.mediaDevices.enumerateDevices();
            const vDevs = devList.filter(d => d.kind === "videoinput");
            const integrated = vDevs.find(d =>
                /integrated|internal|front|laptop|built-in/i.test(d.label)
            );
            if (integrated) {
                state.selectedDeviceId = integrated.deviceId;
            } else if (vDevs.length > 1) {
                state.selectedDeviceId = vDevs[1].deviceId;
            } else if (vDevs.length === 1) {
                state.selectedDeviceId = vDevs[0].deviceId;
            }
        } catch (_) {}
    }

    const targetDeviceId =
        preferredDeviceId ||
        state.selectedDeviceId ||
        null;

    const videoConstraints = {
        width: VISION_CONFIG.CAMERA.width,
        height: VISION_CONFIG.CAMERA.height
    };

    if (targetDeviceId) {
        videoConstraints.deviceId = { exact: targetDeviceId };
    } else {
        videoConstraints.facingMode =
            VISION_CONFIG.CAMERA.facingMode;
    }

    const constraints = {
        video: videoConstraints,
        audio: false
    };


    try {

        const stream =
            await navigator
                .mediaDevices
                .getUserMedia(
                    constraints
                );

        // Populate camera dropdowns once permission grants device labels
        await refreshAvailableCameras();

        return stream;

    } catch (error) {

        if (
            error?.name === "OverconstrainedError" ||
            error?.name === "ConstraintNotSatisfiedError"
        ) {

            try {
                return await navigator
                    .mediaDevices
                    .getUserMedia({
                        video: targetDeviceId ? { deviceId: targetDeviceId } : true,
                        audio: false
                    });
            } catch (fallbackError) {
                return await navigator
                    .mediaDevices
                    .getUserMedia({
                        video: true,
                        audio: false
                    });
            }
        }

        throw error;
    }
}


function attachStream(video, stream) {

    if (!video) {
        return;
    }


    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;


    const promise =
        video.play();

    promise?.catch?.(
        () => {}
    );
}


function stopRecognitionCamera() {

    if (state.recognition.stream) {

        state.recognition.stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );
    }


    state.recognition.stream = null;
    state.recognition.cameraActive = false;


    if (DOM.recognitionVideo) {

        DOM.recognitionVideo.srcObject =
            null;
    }


    setButtonDisabled(
        DOM.captureButton,
        true
    );
}


function captureRecognitionImage() {

    if (
        !state.recognition.cameraActive ||
        !DOM.recognitionVideo
    ) {

        setRecognitionMessage(
            "Start the camera before capturing an image.",
            "warning"
        );

        return;
    }


    const video =
        DOM.recognitionVideo;


    if (
        video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth ||
        !video.videoHeight
    ) {

        setRecognitionMessage(
            "Camera is not ready yet.",
            "warning"
        );

        return;
    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext("2d");


    if (!context) {

        setRecognitionMessage(
            "Unable to capture the current camera frame.",
            "error"
        );

        return;
    }


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    canvas.toBlob(
        blob => {

            if (!blob) {

                setRecognitionMessage(
                    "Failed to create the captured image.",
                    "error"
                );

                return;
            }


            const file =
                new File(
                    [blob],
                    "camera-capture.jpg",
                    {
                        type:
                            VISION_CONFIG
                                .IMAGE
                                .captureType
                    }
                );


            setRecognitionImage(file);


            setRecognitionMessage(
                "Image captured. Ready for recognition.",
                "success"
            );

        },

        VISION_CONFIG.IMAGE.captureType,

        VISION_CONFIG
            .IMAGE
            .captureQuality
    );
}


function handleRecognitionFile(event) {

    const file =
        event.target.files?.[0];

    if (file) {
        processRecognitionFile(file);
    }
}


function processRecognitionFile(file) {

    const validation =
        validateImageFile(file);


    if (!validation.valid) {

        setRecognitionMessage(
            validation.message,
            "error"
        );

        resetFileInput(
            DOM.recognitionFileInput
        );

        return;
    }


    setRecognitionImage(file);


    setRecognitionMessage(
        "Image selected. Ready for recognition.",
        "success"
    );
}


function setRecognitionImage(file) {

    clearRecognitionPreview();

    state.recognition.selectedFile =
        file;


    const url =
        URL.createObjectURL(file);

    state.recognition.previewUrl =
        url;


    if (DOM.recognitionPreview) {

        DOM.recognitionPreview.src =
            url;

        DOM.recognitionPreview.hidden =
            false;

        DOM.recognitionPreview.style.display =
            "block";
    }


    if (DOM.recognitionVideo) {

        DOM.recognitionVideo.style.display =
            "none";
    }


    if (DOM.cameraPlaceholder) {

        DOM.cameraPlaceholder.style.display =
            "none";
    }


    DOM.faceGuides.forEach(
        element =>
            element.style.display =
                "none"
    );


    updateFileName(
        DOM.recognitionFileName,
        file.name
    );


    setButtonDisabled(
        DOM.recognizeButton,
        false
    );
}


function clearRecognitionPreview() {

    if (state.recognition.previewUrl) {

        URL.revokeObjectURL(
            state.recognition.previewUrl
        );
    }


    state.recognition.previewUrl =
        null;


    if (DOM.recognitionPreview) {

        DOM.recognitionPreview
            .removeAttribute("src");

        DOM.recognitionPreview.hidden =
            true;

        DOM.recognitionPreview.style.display =
            "none";
    }
}


function showLiveRecognitionCamera() {

    if (DOM.recognitionVideo) {

        DOM.recognitionVideo.style.display =
            "block";
    }


    if (DOM.recognitionPreview) {

        DOM.recognitionPreview.hidden =
            true;

        DOM.recognitionPreview.style.display =
            "none";
    }


    if (DOM.cameraPlaceholder) {

        DOM.cameraPlaceholder.style.display =
            "none";
    }


    DOM.faceGuides.forEach(
        element =>
            element.style.display =
                "block"
    );
}


function showRecognitionPlaceholder() {

    if (DOM.recognitionVideo) {

        DOM.recognitionVideo.style.display =
            "none";
    }


    if (DOM.recognitionPreview) {

        DOM.recognitionPreview.hidden =
            true;

        DOM.recognitionPreview.style.display =
            "none";
    }


    if (DOM.cameraPlaceholder) {

        DOM.cameraPlaceholder.style.display =
            "flex";
    }


    DOM.faceGuides.forEach(
        element =>
            element.style.display =
                "none"
    );
}


async function recognizeSelectedImage() {

    if (state.recognition.loading) {
        return;
    }


    const file =
        state.recognition.selectedFile;


    if (!file) {

        setRecognitionMessage(
            "Capture or upload an image first.",
            "warning"
        );

        return;
    }


    state.recognition.loading =
        true;


    setButtonLoading(
        DOM.recognizeButton,
        true,
        "Recognizing..."
    );


    renderRecognitionLoading();


    try {

        const formData =
            new FormData();


        formData.append(
            "image",
            file,
            file.name
        );


        const response =
            await apiFetch(
                VISION_CONFIG
                    .ENDPOINTS
                    .RECOGNIZE,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await parseApiResponse(
                response
            );


        state.recognition.result =
            data;


        renderRecognitionResult(
            data
        );


        setRecognitionMessage(
            "Recognition completed.",
            "success"
        );

    } catch (error) {

        console.error(
            "Recognition error:",
            error
        );


        renderRecognitionError(
            error
        );


        setRecognitionMessage(
            getErrorMessage(error),
            "error"
        );

    } finally {

        state.recognition.loading =
            false;


        setButtonLoading(
            DOM.recognizeButton,
            false
        );


        updateRecognitionUI();
    }
}


function renderRecognitionLoading() {

    if (!DOM.recognitionResult) {
        return;
    }


    DOM.recognitionResult.innerHTML = `
        <div class="result-placeholder">
            <div class="result-icon">
                <i
                    class="fas fa-spinner fa-spin"
                    aria-hidden="true"
                ></i>
            </div>

            <strong>
                Recognizing...
            </strong>

            <span>
                Analyzing the selected face.
            </span>
        </div>
    `;
}


function renderRecognitionResult(data) {

    if (!DOM.recognitionResult) {
        return;
    }


    const recognized =
        Boolean(data?.recognized);


    if (!recognized) {

        DOM.recognitionResult.innerHTML = `
            <div class="result-placeholder">

                <div class="result-icon">
                    <i
                        class="fas fa-user-slash"
                        aria-hidden="true"
                    ></i>
                </div>

                <strong>
                    No matching user
                </strong>

                <span>
                    ${escapeHTML(
                        data?.message ||
                        "The face was not recognized."
                    )}
                </span>

            </div>
        `;

        return;
    }


    const name =
        data?.name ??
        "Unknown User";


    const userId =
        data?.user_id ??
        "N/A";


    const similarity =
        formatSimilarity(
            data?.similarity
        );


    const bestSimilarity =
        formatSimilarity(
            data?.best_similarity
        );


    const pose =
        data?.pose ??
        "N/A";


    DOM.recognitionResult.innerHTML = `
        <div class="recognition-details">

            <div class="result-status">
                <span class="status-badge success">
                    Recognized
                </span>
            </div>


            <div class="recognized-user">

                <span class="result-label">
                    User
                </span>

                <strong id="recognized-name">
                    ${escapeHTML(name)}
                </strong>

                <span
                    id="recognized-user-id"
                    class="muted-text"
                >
                    User ID:
                    ${escapeHTML(userId)}
                </span>

            </div>


            <div class="confidence-grid">

                <div class="metric">

                    <span>
                        Similarity
                    </span>

                    <strong
                        id="recognition-similarity"
                    >
                        ${escapeHTML(
                            similarity
                        )}
                    </strong>

                </div>


                <div class="metric">

                    <span>
                        Best Match
                    </span>

                    <strong
                        id="recognition-best-similarity"
                    >
                        ${escapeHTML(
                            bestSimilarity
                        )}
                    </strong>

                </div>


                <div class="metric">

                    <span>
                        Pose
                    </span>

                    <strong
                        id="recognition-pose"
                    >
                        ${escapeHTML(pose)}
                    </strong>

                </div>

            </div>

        </div>
    `;

    if (DOM.recognitionVerifiedBanner) {
        DOM.recognitionVerifiedBanner.hidden = false;
        DOM.recognitionVerifiedBanner.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }

    unlockFiltersStudio(name);

    // Gently auto-navigate to Filters Studio once face identity is recognized
    setTimeout(() => {
        if (DOM.recognitionSection?.classList.contains("active")) {
            navigateToStage("filters", true);
        }
    }, 2500);
}


function renderRecognitionError(error) {

    if (!DOM.recognitionResult) {
        return;
    }


    DOM.recognitionResult.innerHTML = `
        <div class="result-placeholder">

            <div class="result-icon">
                <i
                    class="fas fa-triangle-exclamation"
                    aria-hidden="true"
                ></i>
            </div>

            <strong>
                Recognition failed
            </strong>

            <span>
                ${escapeHTML(
                    getErrorMessage(error)
                )}
            </span>

        </div>
    `;
}


function updateRecognitionUI() {

    setButtonDisabled(
        DOM.recognizeButton,
        !state.recognition.selectedFile ||
        state.recognition.loading
    );


    if (state.recognition.cameraActive) {

        setButtonDisabled(
            DOM.captureButton,
            false
        );

    } else {

        setButtonDisabled(
            DOM.captureButton,
            true
        );
    }
}


/* =========================================================
   ENROLLMENT
   ========================================================= */

function initializeEnrollment() {

    DOM.enrollmentForm?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            createEnrollmentUser();
        }
    );


    DOM.poseOptions.forEach(
        option => {

            option.addEventListener(
                "click",
                () =>
                    selectEnrollmentPose(
                        option
                    )
            );
        }
    );


    DOM.enrollmentCameraButton?.addEventListener(
        "click",
        startEnrollmentCamera
    );


    DOM.enrollmentCaptureButton?.addEventListener(
        "click",
        captureEnrollmentImage
    );


    DOM.enrollmentFileInput?.addEventListener(
        "change",
        handleEnrollmentFile
    );


    DOM.enrollPoseButton?.addEventListener(
        "click",
        enrollSelectedPose
    );


    initializeDropzone(
        DOM.enrollmentDropzone,
        DOM.enrollmentFileInput,
        processEnrollmentFile
    );


    const initial =
        DOM.poseOptions.find(
            option =>
                option.classList.contains(
                    "active"
                )
        ) ||
        DOM.poseOptions[0];


    if (initial) {

        selectEnrollmentPose(
            initial,
            false
        );
    }


    updateEnrollmentUI();
}


function selectEnrollmentPose(
    poseElement,
    showMessage = true
) {

    if (!poseElement) {
        return;
    }


    const pose =
        poseElement.dataset.pose;


    if (!pose) {
        return;
    }


    DOM.poseOptions.forEach(
        option =>
            option.classList.remove(
                "active"
            )
    );


    poseElement.classList.add(
        "active"
    );


    state.enrollment.activePose =
        pose;


    updateEnrollmentGuideBox(pose);

    resetEnrollmentImage();


    if (
        showMessage &&
        state.enrollment.userId
    ) {

        setEnrollmentMessage(
            `${getPoseDisplayName(
                poseElement
            )} selected. Capture or upload an image.`,
            "info"
        );
    }


    updateEnrollmentPoseProgress();
}


const POSE_INFO = {
    CENTER: {
        step: "Pose 1 of 6",
        icon: "fa-arrows-to-dot",
        title: "Look Straight Ahead (Center)",
        desc: "Keep your face centered in the frame with natural lighting and a neutral expression."
    },
    LEFT: {
        step: "Pose 2 of 6",
        icon: "fa-arrow-left",
        title: "Turn Head Left",
        desc: "Slowly turn your head to your left (approx 20-30 degrees) and hold steady."
    },
    RIGHT: {
        step: "Pose 3 of 6",
        icon: "fa-arrow-right",
        title: "Turn Head Right",
        desc: "Slowly turn your head to your right (approx 20-30 degrees) and hold steady."
    },
    UP: {
        step: "Pose 4 of 6",
        icon: "fa-arrow-up",
        title: "Tilt Head Up",
        desc: "Slightly tilt your chin upward while keeping your eyes visible."
    },
    DOWN: {
        step: "Pose 5 of 6",
        icon: "fa-arrow-down",
        title: "Tilt Head Down",
        desc: "Slightly lower your chin and look slightly downward."
    },
    CENTER_2: {
        step: "Pose 6 of 6",
        icon: "fa-check-double",
        title: "Finalize: Return to Center",
        desc: "Return your head to straight-center to finalize your multi-pose facial profile."
    }
};


function updateEnrollmentGuideBox(pose) {
    const info = POSE_INFO[pose] || POSE_INFO.CENTER;
    if (DOM.guideStepNumber) DOM.guideStepNumber.textContent = info.step;
    if (DOM.guideIcon) DOM.guideIcon.className = `fas ${info.icon}`;
    if (DOM.guidePoseTitle) DOM.guidePoseTitle.textContent = info.title;
    if (DOM.guidePoseDesc) DOM.guidePoseDesc.textContent = info.desc;
}


function getPoseDisplayName(
    element
) {

    return (
        element
            ?.querySelector(
                ".pose-name"
            )
            ?.textContent
            .trim() ||
        "Selected pose"
    );
}


function updateEnrollmentPoseProgress() {

    const total =
        DOM.poseOptions.length;


    const completed =
        state.enrollment
            .completedPoses
            .size;


    if (DOM.poseProgress) {

        DOM.poseProgress.textContent =
            `${completed} / ${total}`;
    }


    DOM.poseOptions.forEach(
        option => {

            option.classList.toggle(
                "completed",
                state.enrollment
                    .completedPoses
                    .has(
                        option.dataset.pose
                    )
            );
        }
    );
}


async function startEnrollmentCamera() {

    if (!state.enrollment.userId) {

        setEnrollmentMessage(
            "Create the user profile before starting enrollment.",
            "warning"
        );

        return;
    }


    if (!state.enrollment.activePose) {

        setEnrollmentMessage(
            "Select a face pose first.",
            "warning"
        );

        return;
    }


    if (
        state.enrollment.cameraStarting ||
        state.enrollment.cameraActive
    ) {
        return;
    }


    if (
        !navigator.mediaDevices?.getUserMedia
    ) {

        setEnrollmentMessage(
            "Camera access is not supported by this browser.",
            "error"
        );

        return;
    }


    state.enrollment.cameraStarting =
        true;


    setButtonLoading(
        DOM.enrollmentCameraButton,
        true,
        "Starting..."
    );


    try {

        const stream =
            await getCameraStream();


        stopEnrollmentCamera();


        state.enrollment.stream =
            stream;


        state.enrollment.cameraActive =
            true;


        attachStream(
            DOM.enrollmentVideo,
            stream
        );


        showLiveEnrollmentCamera();


        setButtonDisabled(
            DOM.enrollmentCaptureButton,
            false
        );


        setEnrollmentMessage(
            "Camera ready. Position your face inside the frame.",
            "success"
        );

    } catch (error) {

        state.enrollment.stream =
            null;

        state.enrollment.cameraActive =
            false;


        setEnrollmentMessage(
            getCameraErrorMessage(error),
            "error"
        );

    } finally {

        state.enrollment.cameraStarting =
            false;


        setButtonLoading(
            DOM.enrollmentCameraButton,
            false
        );
    }
}


function stopEnrollmentCamera() {

    if (state.enrollment.stream) {

        state.enrollment.stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );
    }


    state.enrollment.stream =
        null;


    state.enrollment.cameraActive =
        false;


    if (DOM.enrollmentVideo) {

        DOM.enrollmentVideo.srcObject =
            null;
    }


    setButtonDisabled(
        DOM.enrollmentCaptureButton,
        true
    );
}


function showLiveEnrollmentCamera() {

    if (DOM.enrollmentVideo) {

        DOM.enrollmentVideo.style.display =
            "block";
    }


    if (DOM.enrollmentPreview) {

        DOM.enrollmentPreview.hidden =
            true;

        DOM.enrollmentPreview.style.display =
            "none";
    }


    if (DOM.enrollmentPlaceholder) {

        DOM.enrollmentPlaceholder.style.display =
            "none";
    }


    if (DOM.enrollmentFaceGuide) {

        DOM.enrollmentFaceGuide.style.display =
            "block";
    }
}


function showEnrollmentPlaceholder() {

    if (DOM.enrollmentVideo) {

        DOM.enrollmentVideo.style.display =
            "none";
    }


    if (DOM.enrollmentPreview) {

        DOM.enrollmentPreview.hidden =
            true;

        DOM.enrollmentPreview.style.display =
            "none";
    }


    if (DOM.enrollmentPlaceholder) {

        DOM.enrollmentPlaceholder.style.display =
            "flex";
    }


    if (DOM.enrollmentFaceGuide) {

        DOM.enrollmentFaceGuide.style.display =
            "none";
    }
}


function captureEnrollmentImage() {

    if (
        !state.enrollment.cameraActive ||
        !DOM.enrollmentVideo
    ) {

        setEnrollmentMessage(
            "Start the enrollment camera first.",
            "warning"
        );

        return;
    }


    const video =
        DOM.enrollmentVideo;


    if (
        video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA ||
        !video.videoWidth ||
        !video.videoHeight
    ) {

        setEnrollmentMessage(
            "Camera is not ready yet.",
            "warning"
        );

        return;
    }


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;


    const context =
        canvas.getContext("2d");


    if (!context) {

        setEnrollmentMessage(
            "Unable to capture the current camera frame.",
            "error"
        );

        return;
    }


    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );


    canvas.toBlob(
        blob => {

            if (!blob) {

                setEnrollmentMessage(
                    "Failed to capture enrollment image.",
                    "error"
                );

                return;
            }


            const pose =
                state.enrollment.activePose ||
                "pose";


            const file =
                new File(
                    [blob],
                    `${pose.toLowerCase()}-capture.jpg`,
                    {
                        type:
                            VISION_CONFIG
                                .IMAGE
                                .captureType
                    }
                );


            setEnrollmentImage(file);


            setEnrollmentMessage(
                "Image captured. You can now enroll this pose.",
                "success"
            );

        },

        VISION_CONFIG
            .IMAGE
            .captureType,

        VISION_CONFIG
            .IMAGE
            .captureQuality
    );
}


function handleEnrollmentFile(event) {

    const file =
        event.target.files?.[0];


    if (file) {

        processEnrollmentFile(file);
    }
}


function processEnrollmentFile(file) {

    if (!state.enrollment.userId) {

        setEnrollmentMessage(
            "Create the user profile first.",
            "warning"
        );

        resetFileInput(
            DOM.enrollmentFileInput
        );

        return;
    }


    if (!state.enrollment.activePose) {

        setEnrollmentMessage(
            "Select a pose first.",
            "warning"
        );

        resetFileInput(
            DOM.enrollmentFileInput
        );

        return;
    }


    const validation =
        validateImageFile(file);


    if (!validation.valid) {

        setEnrollmentMessage(
            validation.message,
            "error"
        );

        resetFileInput(
            DOM.enrollmentFileInput
        );

        return;
    }


    setEnrollmentImage(file);


    setEnrollmentMessage(
        "Image selected. Ready to enroll.",
        "success"
    );
}


function setEnrollmentImage(file) {

    clearEnrollmentPreview();


    state.enrollment.selectedFile =
        file;


    const url =
        URL.createObjectURL(file);


    state.enrollment.previewUrl =
        url;


    if (DOM.enrollmentPreview) {

        DOM.enrollmentPreview.src =
            url;

        DOM.enrollmentPreview.hidden =
            false;

        DOM.enrollmentPreview.style.display =
            "block";
    }


    if (DOM.enrollmentVideo) {

        DOM.enrollmentVideo.style.display =
            "none";
    }


    if (DOM.enrollmentPlaceholder) {

        DOM.enrollmentPlaceholder.style.display =
            "none";
    }


    if (DOM.enrollmentFaceGuide) {

        DOM.enrollmentFaceGuide.style.display =
            "none";
    }


    updateFileName(
        DOM.enrollmentFileName,
        file.name
    );


    setButtonDisabled(
        DOM.enrollPoseButton,
        !state.enrollment.userId
    );
}


function clearEnrollmentPreview() {

    if (state.enrollment.previewUrl) {

        URL.revokeObjectURL(
            state.enrollment.previewUrl
        );
    }


    state.enrollment.previewUrl =
        null;


    if (DOM.enrollmentPreview) {

        DOM.enrollmentPreview
            .removeAttribute("src");

        DOM.enrollmentPreview.hidden =
            true;

        DOM.enrollmentPreview.style.display =
            "none";
    }
}


async function createEnrollmentUser() {

    if (state.enrollment.loading) {
        return;
    }


    if (!validateEnrollmentForm()) {
        return;
    }


    state.enrollment.loading =
        true;


    setButtonLoading(
        DOM.createUserButton,
        true,
        "Creating..."
    );


    const payload = {

        name:
            DOM.fullNameInput
                .value
                .trim(),

        email:
            DOM.emailInput
                .value
                .trim(),

        phone:
            DOM.phoneInput
                .value
                .trim(),

        date_of_birth:
            DOM.dobInput.value
    };


    try {

        const response =
            await apiFetch(
                VISION_CONFIG
                    .ENDPOINTS
                    .CREATE_USER,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await parseApiResponse(
                response
            );


        const userId =
            data?.id ??
            data?.user_id ??
            data?.user?.id;


        if (
            userId === undefined ||
            userId === null
        ) {

            throw new Error(
                "User was created but no user ID was returned by the server."
            );
        }


        state.enrollment.userId =
            userId;


        state.enrollment
            .completedPoses
            .clear();


        updateEnrollmentPoseProgress();


        updateEnrollmentUserStatus(
            "User created",
            "success"
        );


        enableEnrollmentControls();


        setEnrollmentMessage(
            "User created successfully. Select a pose and add a face image.",
            "success"
        );

    } catch (error) {

        console.error(
            "Create user error:",
            error
        );


        setEnrollmentMessage(
            getErrorMessage(error),
            "error"
        );

    } finally {

        state.enrollment.loading =
            false;


        setButtonLoading(
            DOM.createUserButton,
            false
        );
    }
}


async function enrollSelectedPose() {

    if (state.enrollment.loading) {
        return;
    }


    if (!state.enrollment.userId) {

        setEnrollmentMessage(
            "Create the user profile first.",
            "warning"
        );

        return;
    }


    if (!state.enrollment.activePose) {

        setEnrollmentMessage(
            "Select a pose first.",
            "warning"
        );

        return;
    }


    if (!state.enrollment.selectedFile) {

        setEnrollmentMessage(
            "Capture or upload an image for the selected pose.",
            "warning"
        );

        return;
    }


    state.enrollment.loading =
        true;


    setButtonLoading(
        DOM.enrollPoseButton,
        true,
        "Enrolling..."
    );


    try {

        const formData =
            new FormData();


        formData.append(
            "image",
            state.enrollment.selectedFile,
            state.enrollment.selectedFile.name
        );


        const endpoint =
            VISION_CONFIG
                .ENDPOINTS
                .ENROLL_EMBEDDING(
                    state.enrollment.userId,
                    state.enrollment.activePose
                );


        const response =
            await apiFetch(
                endpoint,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await parseApiResponse(
                response
            );


        const pose =
            state.enrollment.activePose;


        state.enrollment
            .completedPoses
            .add(pose);


        updateEnrollmentPoseProgress();


        setEnrollmentMessage(
            data?.message ||
            `${getCurrentPoseName()} enrolled successfully.`,
            "success"
        );


        resetEnrollmentImage();


        autoSelectNextPose();

    } catch (error) {

        console.error(
            "Enrollment error:",
            error
        );


        setEnrollmentMessage(
            getEnrollmentErrorMessage(
                error
            ),
            "error"
        );

    } finally {

        state.enrollment.loading =
            false;


        setButtonLoading(
            DOM.enrollPoseButton,
            false
        );


        updateEnrollmentUI();
    }
}


function getCurrentPoseName() {

    const active =
        DOM.poseOptions.find(
            option =>
                option.dataset.pose ===
                state.enrollment.activePose
        );


    return getPoseDisplayName(
        active
    );
}


function autoSelectNextPose() {

    const next =
        DOM.poseOptions.find(
            option =>
                !state.enrollment
                    .completedPoses
                    .has(
                        option.dataset.pose
                    )
        );


    if (next) {

        selectEnrollmentPose(
            next
        );

    } else {

        setEnrollmentMessage(
            "All six poses have been enrolled successfully. Face registered!",
            "success"
        );

        setButtonDisabled(
            DOM.enrollPoseButton,
            true
        );

        if (DOM.enrollmentSuccessCard) {
            DOM.enrollmentSuccessCard.hidden = false;
            DOM.enrollmentSuccessCard.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        }

        const registeredName =
            DOM.fullNameInput?.value?.trim() ||
            "Registered User";

        unlockFiltersStudio(registeredName);

        // Smoothly auto-navigate to Filters Studio so user lands on creative filters next
        setTimeout(() => {
            if (DOM.enrollmentSection?.classList.contains("active")) {
                navigateToStage("filters", true);
            }
        }, 1800);
    }
}


function enableEnrollmentControls() {

    DOM.poseOptions.forEach(
        option => {

            option.disabled =
                false;

            option.removeAttribute(
                "aria-disabled"
            );
        }
    );


    updateEnrollmentUI();
}


function updateEnrollmentUI() {

    const canEnroll =
        Boolean(
            state.enrollment.userId &&
            state.enrollment.activePose &&
            state.enrollment.selectedFile &&
            !state.enrollment.loading
        );


    setButtonDisabled(
        DOM.enrollPoseButton,
        !canEnroll
    );


    setButtonDisabled(
        DOM.enrollmentCaptureButton,
        !state.enrollment.cameraActive
    );


    updateEnrollmentPoseProgress();
}


function resetEnrollmentImage() {

    clearEnrollmentPreview();


    state.enrollment.selectedFile =
        null;


    resetFileInput(
        DOM.enrollmentFileInput
    );


    updateFileName(
        DOM.enrollmentFileName,
        "No file selected"
    );


    setButtonDisabled(
        DOM.enrollPoseButton,
        true
    );


    if (!state.enrollment.cameraActive) {

        showEnrollmentPlaceholder();
    }
}


/* =========================================================
   VALIDATION
   ========================================================= */

function validateEnrollmentForm() {

    clearEnrollmentMessage();


    const name =
        DOM.fullNameInput
            ?.value
            .trim() ||
        "";


    const email =
        DOM.emailInput
            ?.value
            .trim() ||
        "";


    const phone =
        DOM.phoneInput
            ?.value
            .trim() ||
        "";


    const dob =
        DOM.dobInput
            ?.value ||
        "";


    if (!name) {

        return invalidField(
            DOM.fullNameInput,
            "Please enter the user's full name."
        );
    }


    if (
        !email ||
        !isValidEmail(email)
    ) {

        return invalidField(
            DOM.emailInput,
            "Please enter a valid email address."
        );
    }


    if (
        !phone ||
        !isValidPhone(phone)
    ) {

        return invalidField(
            DOM.phoneInput,
            "Please enter a valid phone number."
        );
    }


    if (
        !dob ||
        !isValidDate(dob)
    ) {

        return invalidField(
            DOM.dobInput,
            "Please enter a valid date of birth."
        );
    }


    const date =
        new Date(
            `${dob}T00:00:00`
        );


    const today =
        new Date();


    if (date > today) {

        return invalidField(
            DOM.dobInput,
            "Date of birth cannot be in the future."
        );
    }


    return true;
}


function initializeGlobalFormValidation() {

    document
        .querySelectorAll(
            ".form-group input"
        )
        .forEach(input => {

            input.addEventListener(
                "input",
                () =>
                    input.classList.remove(
                        "is-invalid"
                    )
            );


            input.addEventListener(
                "blur",
                () => {

                    if (
                        input.value &&
                        !input.checkValidity()
                    ) {

                        input.classList.add(
                            "is-invalid"
                        );

                    } else {

                        input.classList.remove(
                            "is-invalid"
                        );
                    }
                }
            );
        });
}


function invalidField(
    input,
    message
) {

    if (input) {

        input.classList.add(
            "is-invalid"
        );

        input.focus();
    }


    setEnrollmentMessage(
        message,
        "error"
    );


    return false;
}


function isValidEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);
}


function isValidPhone(value) {

    const digits =
        value.replace(
            /\D/g,
            ""
        );


    return (
        digits.length >= 7 &&
        digits.length <= 15
    );
}


function isValidDate(value) {

    if (
        !/^\d{4}-\d{2}-\d{2}$/
            .test(value)
    ) {

        return false;
    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    return !Number.isNaN(
        date.getTime()
    );
}


/* =========================================================
   DROPZONES / FILES
   ========================================================= */

function initializeDropzone(
    dropzone,
    input,
    processor
) {

    if (
        !dropzone ||
        !input
    ) {
        return;
    }


    [
        "dragenter",
        "dragover"
    ].forEach(
        type => {

            dropzone.addEventListener(
                type,
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    dropzone.classList.add(
                        "dragover"
                    );
                }
            );
        }
    );


    [
        "dragleave",
        "dragend"
    ].forEach(
        type => {

            dropzone.addEventListener(
                type,
                event => {

                    event.preventDefault();

                    dropzone.classList.remove(
                        "dragover"
                    );
                }
            );
        }
    );


    dropzone.addEventListener(
        "drop",
        event => {

            event.preventDefault();

            event.stopPropagation();


            dropzone.classList.remove(
                "dragover"
            );


            const file =
                event.dataTransfer
                    ?.files?.[0];


            if (file) {

                processor(file);
            }
        }
    );
}


function validateImageFile(file) {

    if (!file) {

        return {
            valid: false,
            message:
                "No image selected."
        };
    }


    if (
        !VISION_CONFIG
            .IMAGE
            .acceptedTypes
            .includes(file.type)
    ) {

        return {
            valid: false,
            message:
                "Please select a JPG, PNG, or WebP image."
        };
    }


    const maxBytes =
        VISION_CONFIG
            .IMAGE
            .maxSizeMB *
        1024 *
        1024;


    if (file.size > maxBytes) {

        return {
            valid: false,
            message:
                `Image must be smaller than ${VISION_CONFIG.IMAGE.maxSizeMB} MB.`
        };
    }


    return {
        valid: true,
        message: ""
    };
}


function updateFileName(
    element,
    filename
) {

    if (element) {

        element.textContent =
            filename ||
            "No file selected";
    }
}


function resetFileInput(input) {

    if (input) {

        input.value = "";
    }
}


/* =========================================================
   MESSAGES / STATUS
   ========================================================= */

function setRecognitionMessage(
    message,
    type = "info"
) {

    setMessage(
        DOM.recognitionMessage,
        message,
        type
    );
}


function setEnrollmentMessage(
    message,
    type = "info"
) {

    setMessage(
        DOM.enrollmentMessage,
        message,
        type
    );


    setMessage(
        DOM.enrollmentFormMessage,
        message,
        type
    );
}


function clearEnrollmentMessage() {

    setMessage(
        DOM.enrollmentFormMessage,
        "",
        "info"
    );
}


function setMessage(
    element,
    message,
    type
) {

    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.classList.remove(
        "success",
        "error",
        "warning",
        "info"
    );


    if (type) {

        element.classList.add(
            type
        );
    }
}


function setCameraStatus(
    text,
    type = "info"
) {

    if (!DOM.cameraStatus) {
        return;
    }


    DOM.cameraStatus.textContent =
        text;


    DOM.cameraStatus.classList.remove(
        "success",
        "warning",
        "error",
        "info"
    );


    DOM.cameraStatus.classList.add(
        type
    );
}


function updateEnrollmentUserStatus(
    text,
    type = "info"
) {

    if (!DOM.enrollmentUserStatus) {
        return;
    }


    DOM.enrollmentUserStatus.textContent =
        text;


    DOM.enrollmentUserStatus.classList.remove(
        "success",
        "warning",
        "error",
        "info"
    );


    DOM.enrollmentUserStatus.classList.add(
        type
    );
}


/* =========================================================
   BUTTON HELPERS
   ========================================================= */

function rememberButtonText(button) {

    if (
        button &&
        !button.dataset.originalText
    ) {

        button.dataset.originalText =
            button.innerHTML;
    }
}


function setButtonLoading(
    button,
    loading,
    text = "Loading..."
) {

    if (!button) {
        return;
    }


    rememberButtonText(
        button
    );


    button.disabled =
        Boolean(loading);


    button.setAttribute(
        "aria-busy",
        String(
            Boolean(loading)
        )
    );


    if (loading) {

        button.dataset.loading =
            "true";


        button.innerHTML =
            `<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> ${escapeHTML(text)}`;

    } else {

        button.dataset.loading =
            "false";


        button.innerHTML =
            button.dataset.originalText;
    }
}


function setButtonDisabled(
    button,
    disabled
) {

    if (!button) {
        return;
    }


    button.disabled =
        Boolean(disabled);


    button.setAttribute(
        "aria-disabled",
        String(
            Boolean(disabled)
        )
    );
}


/* =========================================================
   API
   ========================================================= */

async function apiFetch(
    endpoint,
    options = {}
) {

    const url =
        buildApiUrl(endpoint);


    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(
            () =>
                controller.abort(),
            VISION_CONFIG.API_TIMEOUT
        );


    try {

        return await fetch(
            url,
            {
                ...options,
                signal:
                    controller.signal
            }
        );

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "The server took too long to respond."
            );
        }


        if (
            error instanceof TypeError
        ) {

            throw new Error(
                "Unable to connect to the Vision Studio backend."
            );
        }


        throw error;

    } finally {

        clearTimeout(
            timeoutId
        );
    }
}


function buildApiUrl(
    endpoint
) {

    if (
        /^https?:\/\//i
            .test(endpoint)
    ) {

        return endpoint;
    }


    return (
        `${VISION_CONFIG.API_BASE_URL}${endpoint}`
    );
}


async function parseApiResponse(
    response
) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";


    let data;


    if (
        contentType.includes(
            "application/json"
        )
    ) {

        data =
            await response.json();

    } else {

        const text =
            await response.text();


        data =
            text
                ? { message: text }
                : {};
    }


    if (!response.ok) {

        const error =
            new Error(
                extractApiError(data) ||
                `Request failed with status ${response.status}.`
            );


        error.status =
            response.status;


        error.data =
            data;


        throw error;
    }


    return data;
}


function extractApiError(
    data
) {

    if (!data) {
        return "";
    }


    if (
        typeof data ===
        "string"
    ) {

        return data;
    }


    if (
        typeof data.detail ===
        "string"
    ) {

        return data.detail;
    }


    if (
        typeof data.message ===
        "string"
    ) {

        return data.message;
    }


    if (
        typeof data.error ===
        "string"
    ) {

        return data.error;
    }


    if (
        Array.isArray(
            data.detail
        )
    ) {

        return data.detail
            .map(item => {

                if (
                    typeof item ===
                    "string"
                ) {

                    return item;
                }


                return (
                    item?.msg ||
                    "Invalid request."
                );
            })
            .join(", ");
    }


    return "";
}


/* =========================================================
   ERROR HANDLING / FORMATTING
   ========================================================= */

function getErrorMessage(
    error
) {

    if (!error) {

        return "Something went wrong.";
    }


    if (
        typeof error ===
        "string"
    ) {

        return error;
    }


    return (
        error.message ||
        "Something went wrong while processing the request."
    );
}


function getCameraErrorMessage(
    error
) {

    switch (
        error?.name
    ) {

        case "NotAllowedError":

            return (
                "Camera permission was denied. Allow camera access and try again."
            );


        case "NotFoundError":

            return (
                "No camera was found on this device."
            );


        case "NotReadableError":

            return (
                "The camera is currently being used by another application."
            );


        case "SecurityError":

            return (
                "Camera access requires a secure context such as HTTPS or localhost."
            );


        case "OverconstrainedError":

            return (
                "The requested camera configuration is unavailable."
            );


        default:

            return getErrorMessage(
                error
            );
    }
}


function getEnrollmentErrorMessage(
    error
) {

    if (
        error?.status ===
        404
    ) {

        return (
            "The user was not found. Create the user again before enrolling a face."
        );
    }


    const message =
        getErrorMessage(
            error
        ).toLowerCase();


    if (
        error?.status === 409 ||
        message.includes(
            "duplicate"
        )
    ) {

        return (
            "This pose has already been enrolled for this user. Select another pose."
        );
    }


    return getErrorMessage(
        error
    );
}


function formatSimilarity(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "N/A";
    }


    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return String(value);
    }


    return (
        `${
            (
                number <= 1
                    ? number * 100
                    : number
            ).toFixed(2)
        }%`
    );
}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   CAMERA DEVICE SELECTION (CAMERA 1 DEFAULT)
   ========================================================= */

async function initializeCameraDeviceSelection() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        return;
    }

    try {
        await refreshAvailableCameras();

        // Listen for device changes (e.g. USB webcam plugged/unplugged)
        navigator.mediaDevices.addEventListener(
            "devicechange",
            refreshAvailableCameras
        );

        // Bind dropdown change events
        [
            DOM.recognitionCameraSelect,
            DOM.enrollmentCameraSelect,
            DOM.filterCameraSelect
        ].forEach(select => {
            if (!select) return;
            select.addEventListener("change", handleCameraSelectChange);
        });

    } catch (error) {
        console.warn("Camera enumeration error:", error);
    }
}


async function refreshAvailableCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        return;
    }

    try {
        const devices =
            await navigator.mediaDevices.enumerateDevices();

        const videoDevices =
            devices.filter(d => d.kind === "videoinput");

        state.availableVideoDevices = videoDevices;

        // Auto-select Integrated Camera by matching device label if available
        if (videoDevices.length > 1) {
            const integrated = videoDevices.find(d =>
                /integrated|internal|front|laptop|built-in/i.test(d.label)
            );
            if (integrated) {
                state.selectedDeviceId = integrated.deviceId;
            } else if (!state.selectedDeviceId || state.selectedDeviceId === videoDevices[0].deviceId) {
                state.selectedDeviceId = videoDevices[1].deviceId;
            }
        } else if (videoDevices.length === 1) {
            state.selectedDeviceId = videoDevices[0].deviceId;
        }

        populateCameraSelects();

    } catch (error) {
        console.warn("Could not list cameras:", error);
    }
}


function populateCameraSelects() {
    const selects = [
        DOM.recognitionCameraSelect,
        DOM.enrollmentCameraSelect,
        DOM.filterCameraSelect
    ];

    selects.forEach(select => {
        if (!select) return;

        select.innerHTML = "";

        if (state.availableVideoDevices.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Camera 1: Integrated Camera";
            select.appendChild(opt);
            return;
        }

        // Ensure state.selectedDeviceId selects Integrated Camera by default
        const hasSelected = state.availableVideoDevices.some(d => d.deviceId === state.selectedDeviceId);
        if (!hasSelected) {
            const integrated = state.availableVideoDevices.find(d =>
                /integrated|internal|front|laptop|built-in/i.test(d.label)
            );
            if (integrated) {
                state.selectedDeviceId = integrated.deviceId;
            } else if (state.availableVideoDevices.length > 1) {
                state.selectedDeviceId = state.availableVideoDevices[1].deviceId;
            } else if (state.availableVideoDevices.length === 1) {
                state.selectedDeviceId = state.availableVideoDevices[0].deviceId;
            }
        }

        state.availableVideoDevices.forEach((dev, index) => {
            const opt = document.createElement("option");
            opt.value = dev.deviceId;

            const rawLabel = dev.label ? dev.label.trim() : "";
            let displayLabel = "";

            if (/integrated|internal|front|laptop|built-in/i.test(rawLabel)) {
                displayLabel = `Camera 1: ${rawLabel || "Integrated Camera"}`;
            } else if (/smart\s*connect/i.test(rawLabel)) {
                displayLabel = `Camera 0: ${rawLabel || "Smart Connect Camera"}`;
            } else if (rawLabel) {
                displayLabel = rawLabel.toLowerCase().startsWith("camera") ? rawLabel : `Camera ${index}: ${rawLabel}`;
            } else {
                if (state.availableVideoDevices.length === 1) {
                    displayLabel = "Camera 1: Integrated Camera";
                } else {
                    displayLabel = index === 1 ? "Camera 1: Integrated Camera" : index === 0 ? "Camera 0: Smart Connect Camera" : `Camera ${index}`;
                }
            }

            opt.textContent = displayLabel;

            if (dev.deviceId === state.selectedDeviceId) {
                opt.selected = true;
            }

            select.appendChild(opt);
        });

        if (state.selectedDeviceId) {
            select.value = state.selectedDeviceId;
        }
    });
}


async function handleCameraSelectChange(event) {
    const newDeviceId = event.target.value;
    if (!newDeviceId || newDeviceId === state.selectedDeviceId) {
        return;
    }

    state.selectedDeviceId = newDeviceId;

    // Synchronize all camera dropdowns
    [
        DOM.recognitionCameraSelect,
        DOM.enrollmentCameraSelect,
        DOM.filterCameraSelect
    ].forEach(select => {
        if (select && select.value !== newDeviceId) {
            select.value = newDeviceId;
        }
    });

    // If any camera stream is active, restart with newly selected camera
    if (state.recognition.cameraActive) {
        stopRecognitionCamera();
        await startRecognitionCamera();
    }

    if (state.enrollment.cameraActive) {
        stopEnrollmentCamera();
        await startEnrollmentCamera();
    }

    if (state.filters.cameraActive) {
        stopFiltersCamera();
        await startFiltersCamera();
    }
}


/* =========================================================
   GUIDED ENROLLMENT & UNLOCK HELPERS
   ========================================================= */

function initializeGuidedEnrollment() {
    if (DOM.enrollmentLaunchFiltersBtn) {
        DOM.enrollmentLaunchFiltersBtn.addEventListener("click", (e) => {
            e.preventDefault();
            navigateToStage("filters", true);
        });
    }
}


function unlockFiltersStudio(userName) {
    state.currentUser.verified = true;
    state.currentUser.name = userName;

    if (DOM.filtersNavBadge) {
        DOM.filtersNavBadge.innerHTML = '<i class="fas fa-sparkles"></i>';
        DOM.filtersNavBadge.classList.add("verified");
    }

    if (DOM.filtersAccessBanner) {
        DOM.filtersAccessBanner.classList.add("verified");
        if (DOM.filtersAccessText) {
            DOM.filtersAccessText.textContent =
                `✨ Verified as ${userName} • Filters Studio Unlocked`;
        }
    }
}


/* =========================================================
   FILTERS STUDIO CORE LOGIC (ASCII WEBCAM & CREATIVE CV)
   ========================================================= */

const ASCII_CHAR_SET = [" ", ".", ":", "-", "=", "+", "*", "%", "#", "@"];

const FILTER_CONFIGS = {
    ascii: {
        title: "ASCII Art Webcam",
        sliderLabel: "ASCII Resolution",
        min: 40,
        max: 160,
        step: 2,
        getValue: () => state.filters.asciiWidth,
        setValue: (v) => { state.filters.asciiWidth = v; },
        formatValue: (v) => `${v} chars`,
        palettes: [
            { value: "matrix", label: "Terminal Green (Classic)" },
            { value: "cyber", label: "Cyberpunk Cyan" },
            { value: "amber", label: "Amber Phosphor (CRT)" },
            { value: "mono", label: "Monochrome White" },
            { value: "rgb", label: "Full RGB Color" }
        ],
        defaultTheme: "matrix",
        showAsciiLegend: true
    },
    neon: {
        title: "Neon Edge Contour",
        sliderLabel: "Contour Sensitivity",
        min: 15,
        max: 75,
        step: 1,
        getValue: () => state.filters.neonThreshold,
        setValue: (v) => { state.filters.neonThreshold = v; },
        formatValue: (v) => `${v} threshold`,
        palettes: [
            { value: "cyber", label: "Cyberpunk Cyan Glow" },
            { value: "magenta", label: "Hot Neon Pink / Magenta" },
            { value: "matrix", label: "Acid Lime Green" },
            { value: "amber", label: "Electric Gold / Amber" },
            { value: "rgb", label: "Chromatic Rainbow Hue" },
            { value: "mono", label: "Stark White Glow" }
        ],
        defaultTheme: "cyber",
        showAsciiLegend: false
    },
    thermal: {
        title: "Thermal Infrared Vision",
        sliderLabel: "Thermal Heat Bias",
        min: -40,
        max: 40,
        step: 2,
        getValue: () => state.filters.thermalBias,
        setValue: (v) => { state.filters.thermalBias = v; },
        formatValue: (v) => `${v > 0 ? "+" : ""}${v}%`,
        palettes: [
            { value: "ironbow", label: "Classic Ironbow" },
            { value: "fire", label: "Inferno Flame" },
            { value: "arctic", label: "Arctic Cryo Blue" },
            { value: "rainbow", label: "Full Spectrum Rainbow" },
            { value: "mono", label: "FLIR Grayscale (Thermal)" }
        ],
        defaultTheme: "ironbow",
        showAsciiLegend: false
    },
    retro: {
        title: "Retro 8-Bit Arcade",
        sliderLabel: "Pixel Block Size",
        min: 3,
        max: 24,
        step: 1,
        getValue: () => state.filters.retroPixelSize,
        setValue: (v) => { state.filters.retroPixelSize = v; },
        formatValue: (v) => `${v}px blocks`,
        palettes: [
            { value: "rgb", label: "8-Bit Full Color" },
            { value: "gameboy", label: "Game Boy Classic (Green)" },
            { value: "cyber", label: "Cyber Synthwave (16-Bit)" },
            { value: "amber", label: "Amber CRT Monochrome" },
            { value: "mono", label: "1-Bit Dithered Black & White" }
        ],
        defaultTheme: "rgb",
        showAsciiLegend: false
    },
    halftone: {
        title: "Pop-Art Halftone",
        sliderLabel: "Dot Grid Spacing",
        min: 4,
        max: 24,
        step: 1,
        getValue: () => state.filters.halftoneDotSize,
        setValue: (v) => { state.filters.halftoneDotSize = v; },
        formatValue: (v) => `${v}px dots`,
        palettes: [
            { value: "cyber", label: "Electric Cyan Pop" },
            { value: "magenta", label: "Pop Art Magenta" },
            { value: "matrix", label: "Halftone Lime Green" },
            { value: "amber", label: "Golden Comic Dots" },
            { value: "rgb", label: "Full Color Dots (RGB)" },
            { value: "mono", label: "Newspaper Comic Noir" }
        ],
        defaultTheme: "cyber",
        showAsciiLegend: false
    }
};

function initializeFilters() {
    // Filter tab switching
    DOM.filterTabs?.forEach(tab => {
        tab.addEventListener("click", () => {
            const filterType = tab.dataset.filter;
            switchFilter(filterType);
        });
    });

    // Buttons
    DOM.filterStartBtn?.addEventListener("click", toggleFiltersCamera);
    DOM.filterFreezeBtn?.addEventListener("click", toggleFilterFreeze);
    DOM.filterCopyAsciiBtn?.addEventListener("click", copyAsciiToClipboard);
    DOM.filterDownloadTxtBtn?.addEventListener("click", downloadAsciiTextFile);
    DOM.filterDownloadPngBtn?.addEventListener("click", downloadFilterPngImage);
    DOM.filterFullscreenBtn?.addEventListener("click", toggleFilterFullscreen);

    // Dynamic resolution / parameter slider for all filters
    DOM.asciiResolutionSlider?.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        const cfg = FILTER_CONFIGS[state.filters.activeFilter];
        if (cfg) {
            cfg.setValue(val);
            if (DOM.asciiResolutionVal) {
                DOM.asciiResolutionVal.textContent = cfg.formatValue(val);
            }
        }
    });

    DOM.filterContrastSlider?.addEventListener("input", (e) => {
        state.filters.contrast = parseFloat(e.target.value);
        if (DOM.filterContrastVal) {
            DOM.filterContrastVal.textContent = `${state.filters.contrast.toFixed(1)}x`;
        }
    });

    DOM.filterThemeSelect?.addEventListener("change", (e) => {
        state.filters.theme = e.target.value;
        updateAsciiThemeClass();
    });

    DOM.filterInvertToggle?.addEventListener("change", (e) => {
        state.filters.invert = Boolean(e.target.checked);
    });

    DOM.filterMirrorToggle?.addEventListener("change", (e) => {
        state.filters.mirror = Boolean(e.target.checked);
        applyMirrorStyles();
    });

    // Set initial mirror state and configure active filter
    applyMirrorStyles();
    switchFilter(state.filters.activeFilter || "ascii");
}


function switchFilter(filterType) {
    if (!filterType || !FILTER_CONFIGS[filterType]) {
        filterType = "ascii";
    }
    state.filters.activeFilter = filterType;

    const cfg = FILTER_CONFIGS[filterType];

    // Update active tab chip
    DOM.filterTabs?.forEach(tab => {
        const isActive = tab.dataset.filter === filterType;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update filter title
    if (DOM.currentFilterTitle) {
        DOM.currentFilterTitle.textContent = cfg.title;
    }

    // Hardware canvas is always active for high-performance visual rendering
    if (DOM.asciiDisplay) DOM.asciiDisplay.hidden = true;
    if (DOM.filterCanvas) DOM.filterCanvas.hidden = false;

    // Always keep resolution slider visible and configure its properties for this filter
    if (DOM.ctrlAsciiWidth) {
        DOM.ctrlAsciiWidth.style.display = "flex";
    }
    if (DOM.resolutionSliderLabel) {
        DOM.resolutionSliderLabel.textContent = cfg.sliderLabel;
    }
    if (DOM.asciiResolutionSlider) {
        DOM.asciiResolutionSlider.min = cfg.min;
        DOM.asciiResolutionSlider.max = cfg.max;
        DOM.asciiResolutionSlider.step = cfg.step;
        DOM.asciiResolutionSlider.value = cfg.getValue();
    }
    if (DOM.asciiResolutionVal) {
        DOM.asciiResolutionVal.textContent = cfg.formatValue(cfg.getValue());
    }

    // Re-populate Color Palette dropdown with filter-specific themes
    if (DOM.filterThemeSelect) {
        DOM.filterThemeSelect.innerHTML = "";
        cfg.palettes.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.value;
            opt.textContent = p.label;
            DOM.filterThemeSelect.appendChild(opt);
        });

        const themeExists = cfg.palettes.some(p => p.value === state.filters.theme);
        if (themeExists) {
            DOM.filterThemeSelect.value = state.filters.theme;
        } else {
            state.filters.theme = cfg.defaultTheme;
            DOM.filterThemeSelect.value = cfg.defaultTheme;
        }
    }

    // Toggle ASCII-specific UI controls
    if (DOM.asciiLegend) DOM.asciiLegend.style.display = cfg.showAsciiLegend ? "flex" : "none";
    if (DOM.filterCopyAsciiBtn) DOM.filterCopyAsciiBtn.style.display = cfg.showAsciiLegend ? "inline-flex" : "none";
    if (DOM.filterDownloadTxtBtn) DOM.filterDownloadTxtBtn.style.display = cfg.showAsciiLegend ? "inline-flex" : "none";
}


function updateAsciiThemeClass() {
    if (!DOM.asciiDisplay) return;
    DOM.asciiDisplay.classList.remove("theme-cyber", "theme-amber", "theme-mono");
    if (state.filters.theme === "cyber") {
        DOM.asciiDisplay.classList.add("theme-cyber");
    } else if (state.filters.theme === "amber") {
        DOM.asciiDisplay.classList.add("theme-amber");
    } else if (state.filters.theme === "mono") {
        DOM.asciiDisplay.classList.add("theme-mono");
    }
}


function applyMirrorStyles() {
    const isMirrored = state.filters.mirror;
    if (DOM.filterCanvas) DOM.filterCanvas.classList.toggle("mirrored", isMirrored);
    if (DOM.asciiDisplay) DOM.asciiDisplay.classList.toggle("mirrored", isMirrored);
}


async function toggleFiltersCamera() {
    if (state.filters.cameraActive) {
        stopFiltersCamera();
    } else {
        await startFiltersCamera();
    }
}


async function startFiltersCamera() {
    if (state.filters.cameraStarting || state.filters.cameraActive) {
        return;
    }

    state.filters.cameraStarting = true;
    setButtonLoading(DOM.filterStartBtn, true, "Starting...");
    setFilterMessage("Starting camera feed...", "info");

    try {
        const stream = await getCameraStream();
        stopFiltersCamera();

        state.filters.stream = stream;
        state.filters.cameraActive = true;
        state.filters.isFrozen = false;

        if (DOM.filterVideo) {
            DOM.filterVideo.srcObject = stream;
            await DOM.filterVideo.play();
        }

        if (DOM.filterPlaceholder) {
            DOM.filterPlaceholder.style.display = "none";
        }

        // Show stage elements
        switchFilter(state.filters.activeFilter);

        // Enable action buttons
        setButtonDisabled(DOM.filterFreezeBtn, false);
        setButtonDisabled(DOM.filterCopyAsciiBtn, false);
        setButtonDisabled(DOM.filterDownloadTxtBtn, false);
        setButtonDisabled(DOM.filterDownloadPngBtn, false);

        if (DOM.filterStartBtn) {
            DOM.filterStartBtn.innerHTML = '<i class="fas fa-video-slash" aria-hidden="true"></i> Stop Camera';
            DOM.filterStartBtn.classList.add("btn-secondary");
            DOM.filterStartBtn.classList.remove("btn-primary");
        }

        setFilterMessage("Live webcam filter active.", "success");

        // Start processing animation loop
        state.filters.lastFrameTime = performance.now();
        state.filters.frameCount = 0;
        requestAnimationFrame(renderFilterLoop);

    } catch (error) {
        console.error("Filter camera error:", error);
        stopFiltersCamera();
        setFilterMessage(getCameraErrorMessage(error), "error");
    } finally {
        state.filters.cameraStarting = false;
        setButtonLoading(DOM.filterStartBtn, false);
    }
}


function stopFiltersCamera() {
    if (state.filters.animationFrameId) {
        cancelAnimationFrame(state.filters.animationFrameId);
        state.filters.animationFrameId = null;
    }

    if (state.filters.stream) {
        state.filters.stream.getTracks().forEach(track => track.stop());
    }

    state.filters.stream = null;
    state.filters.cameraActive = false;
    state.filters.isFrozen = false;

    if (DOM.filterVideo) {
        DOM.filterVideo.srcObject = null;
    }

    if (DOM.filterPlaceholder) {
        DOM.filterPlaceholder.style.display = "flex";
    }

    if (DOM.asciiDisplay) DOM.asciiDisplay.hidden = true;
    if (DOM.filterCanvas) DOM.filterCanvas.hidden = true;

    if (DOM.filterStartBtn) {
        DOM.filterStartBtn.innerHTML = '<i class="fas fa-video" aria-hidden="true"></i> Start Camera';
        DOM.filterStartBtn.classList.add("btn-primary");
        DOM.filterStartBtn.classList.remove("btn-secondary");
    }

    if (DOM.filterFreezeBtn) {
        DOM.filterFreezeBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> Freeze';
    }

    setButtonDisabled(DOM.filterFreezeBtn, true);
    setButtonDisabled(DOM.filterCopyAsciiBtn, true);
    setButtonDisabled(DOM.filterDownloadTxtBtn, true);
    setButtonDisabled(DOM.filterDownloadPngBtn, true);

    if (DOM.filterFpsBadge) {
        DOM.filterFpsBadge.innerHTML = '<i class="fas fa-gauge-high"></i> 0.0 FPS';
        DOM.filterFpsBadge.classList.remove("active");
    }
}


function toggleFilterFreeze() {
    if (!state.filters.cameraActive) return;
    state.filters.isFrozen = !state.filters.isFrozen;

    if (DOM.filterFreezeBtn) {
        if (state.filters.isFrozen) {
            DOM.filterFreezeBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> Resume';
            setFilterMessage("Frame frozen. You can copy or download now.", "info");
        } else {
            DOM.filterFreezeBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> Freeze';
            setFilterMessage("Live feed resumed.", "success");
            requestAnimationFrame(renderFilterLoop);
        }
    }
}


function renderFilterLoop(timestamp) {
    if (!state.filters.cameraActive) {
        return;
    }

    if (state.filters.isFrozen) {
        return;
    }

    const video = DOM.filterVideo;
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        state.filters.animationFrameId = requestAnimationFrame(renderFilterLoop);
        return;
    }

    // FPS calculation
    state.filters.frameCount++;
    const elapsed = timestamp - state.filters.lastFrameTime;
    if (elapsed >= 500) {
        state.filters.fps = ((state.filters.frameCount * 1000) / elapsed).toFixed(1);
        if (DOM.filterFpsBadge) {
            DOM.filterFpsBadge.innerHTML = `<i class="fas fa-gauge-high"></i> ${state.filters.fps} FPS`;
            DOM.filterFpsBadge.classList.add("active");
        }
        state.filters.lastFrameTime = timestamp;
        state.filters.frameCount = 0;
    }

    // Process current filter
    try {
        switch (state.filters.activeFilter) {
            case "ascii":
                renderAsciiFilter(video);
                break;
            case "neon":
                renderNeonFilter(video);
                break;
            case "thermal":
                renderThermalFilter(video);
                break;
            case "retro":
                renderRetroFilter(video);
                break;
            case "halftone":
                renderHalftoneFilter(video);
                break;
            default:
                renderAsciiFilter(video);
        }
    } catch (err) {
        console.error("Filter render error:", err);
    }

    state.filters.animationFrameId = requestAnimationFrame(renderFilterLoop);
}


/* -------------------------------------------------------------
   FILTER 1: ASCII ART FILTER (Canvas sampling + text rendering)
   ------------------------------------------------------------- */

let offscreenCanvas = null;
let offscreenCtx = null;

function renderAsciiFilter(video) {
    const canvas = DOM.filterCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const targetCols = Math.max(40, Math.min(160, state.filters.asciiWidth || 90));
    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const aspect = videoHeight / videoWidth;

    // Monospace aspect correction: characters are taller than wide (~1 : 1.9)
    // Using 0.52 rows per column keeps circles and faces properly proportioned
    const targetRows = Math.max(15, Math.round(targetCols * aspect * 0.52));

    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement("canvas");
        offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
    }

    if (offscreenCanvas.width !== targetCols || offscreenCanvas.height !== targetRows) {
        offscreenCanvas.width = targetCols;
        offscreenCanvas.height = targetRows;
    }

    // Draw downsampled frame to offscreen canvas
    offscreenCtx.drawImage(video, 0, 0, targetCols, targetRows);
    const imgData = offscreenCtx.getImageData(0, 0, targetCols, targetRows);
    const data = imgData.data;

    // Set display buffer resolution
    const renderWidth = 960;
    const renderHeight = Math.round(960 * aspect);
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
        canvas.width = renderWidth;
        canvas.height = renderHeight;
    }

    // Grid cell geometry
    const cellWidth = renderWidth / targetCols;
    const cellHeight = renderHeight / targetRows;

    // Dark canvas background
    ctx.fillStyle = "#090D16";
    ctx.fillRect(0, 0, renderWidth, renderHeight);

    // Monospace font sizing
    const fontSize = Math.floor(cellHeight * 1.12);
    ctx.font = `bold ${fontSize}px "Consolas", "Courier New", "Menlo", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const contrast = state.filters.contrast;
    const invert = state.filters.invert;
    const chars = invert ? ASCII_CHAR_SET.slice().reverse() : ASCII_CHAR_SET;
    const charLen = chars.length;
    const theme = state.filters.theme || "matrix";

    let asciiStr = "";

    for (let y = 0; y < targetRows; y++) {
        let rowStr = "";
        const rowOffset = y * targetCols * 4;
        const posY = y * cellHeight + cellHeight / 2;

        for (let x = 0; x < targetCols; x++) {
            const idx = rowOffset + x * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Perceptual luminance (Rec. 601)
            let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Contrast enhancement
            if (contrast !== 1.0) {
                lum = (lum - 0.5) * contrast + 0.5;
                lum = Math.max(0, Math.min(1, lum));
            }

            const charIndex = Math.min(
                Math.floor(lum * charLen),
                charLen - 1
            );

            const ch = chars[charIndex];
            rowStr += ch;

            if (ch !== " ") {
                const posX = x * cellWidth + cellWidth / 2;

                if (theme === "rgb") {
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else if (theme === "cyber") {
                    ctx.fillStyle = "#00F0FF";
                } else if (theme === "amber") {
                    ctx.fillStyle = "#FFB000";
                } else if (theme === "mono") {
                    ctx.fillStyle = "#F8FAFC";
                } else {
                    // Terminal Green default
                    ctx.fillStyle = "#00FF66";
                }

                ctx.fillText(ch, posX, posY);
            }
        }

        asciiStr += rowStr + "\n";
    }

    state.filters.lastAsciiArt = asciiStr;
}


/* -------------------------------------------------------------
   FILTER 2: NEON EDGE CONTOUR (Sobel Edge Detector + Color Shading)
   ------------------------------------------------------------- */

function renderNeonFilter(video) {
    const canvas = DOM.filterCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const w = 320;
    const h = Math.round(320 * (video.videoHeight / video.videoWidth));

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    ctx.drawImage(video, 0, 0, w, h);
    const src = ctx.getImageData(0, 0, w, h);
    const srcData = src.data;
    const out = ctx.createImageData(w, h);
    const outData = out.data;

    const contrast = state.filters.contrast;
    const invert = state.filters.invert;
    const theme = state.filters.theme || "cyber";
    // Slider controls threshold: lower = higher detail / sensitivity
    const threshold = Math.max(10, Math.min(80, state.filters.neonThreshold || 35));

    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;

            const pX1 = (srcData[idx - 4] + srcData[idx - 3] + srcData[idx - 2]) / 3;
            const pX2 = (srcData[idx + 4] + srcData[idx + 5] + srcData[idx + 6]) / 3;
            const pY1 = (srcData[idx - w * 4] + srcData[idx - w * 4 + 1] + srcData[idx - w * 4 + 2]) / 3;
            const pY2 = (srcData[idx + w * 4] + srcData[idx + w * 4 + 1] + srcData[idx + w * 4 + 2]) / 3;

            const dx = pX2 - pX1;
            const dy = pY2 - pY1;
            const mag = Math.sqrt(dx * dx + dy * dy) * contrast * 1.4;

            if (mag > threshold) {
                const norm = Math.min(255, (mag - threshold) * 3.5);

                if (invert) {
                    // Dark neon ink on light blueprint
                    if (theme === "magenta") {
                        outData[idx] = 180; outData[idx + 1] = 20; outData[idx + 2] = 100;
                    } else if (theme === "matrix") {
                        outData[idx] = 20; outData[idx + 1] = 140; outData[idx + 2] = 40;
                    } else if (theme === "amber") {
                        outData[idx] = 180; outData[idx + 1] = 90; outData[idx + 2] = 0;
                    } else if (theme === "rgb") {
                        outData[idx] = srcData[idx]; outData[idx + 1] = srcData[idx + 1]; outData[idx + 2] = srcData[idx + 2];
                    } else {
                        // Cyan / Blue ink
                        outData[idx] = 0; outData[idx + 1] = 100; outData[idx + 2] = 180;
                    }
                } else {
                    // Glowing electric neon on dark background
                    if (theme === "magenta") {
                        outData[idx] = 255;
                        outData[idx + 1] = Math.min(255, norm * 0.4);
                        outData[idx + 2] = Math.min(255, norm * 0.8 + 120);
                    } else if (theme === "matrix") {
                        outData[idx] = Math.min(255, norm * 0.2);
                        outData[idx + 1] = 255;
                        outData[idx + 2] = Math.min(255, norm * 0.4);
                    } else if (theme === "amber") {
                        outData[idx] = 255;
                        outData[idx + 1] = Math.min(255, norm * 0.7 + 100);
                        outData[idx + 2] = 20;
                    } else if (theme === "rgb") {
                        outData[idx] = srcData[idx];
                        outData[idx + 1] = srcData[idx + 1];
                        outData[idx + 2] = srcData[idx + 2];
                    } else if (theme === "mono") {
                        outData[idx] = 255; outData[idx + 1] = 255; outData[idx + 2] = 255;
                    } else {
                        // Cyberpunk Electric Cyan
                        outData[idx] = Math.min(255, norm * 0.5);
                        outData[idx + 1] = Math.min(255, norm * 1.4 + 100);
                        outData[idx + 2] = 255;
                    }
                }
                outData[idx + 3] = 255;
            } else {
                if (invert) {
                    outData[idx] = 248; outData[idx + 1] = 250; outData[idx + 2] = 252; outData[idx + 3] = 255;
                } else {
                    outData[idx] = 9; outData[idx + 1] = 13; outData[idx + 2] = 22; outData[idx + 3] = 255;
                }
            }
        }
    }

    ctx.putImageData(out, 0, 0);
}


/* -------------------------------------------------------------
   FILTER 3: THERMAL INFRARED VISION (Ironbow, Flame, Cryo, Rainbow)
   ------------------------------------------------------------- */

function renderThermalFilter(video) {
    const canvas = DOM.filterCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const w = 320;
    const h = Math.round(320 * (video.videoHeight / video.videoWidth));

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
    }

    ctx.drawImage(video, 0, 0, w, h);
    const src = ctx.getImageData(0, 0, w, h);
    const data = src.data;
    const len = data.length;

    const contrast = state.filters.contrast;
    const invert = state.filters.invert;
    const theme = state.filters.theme || "ironbow";
    const bias = (state.filters.thermalBias || 0) / 100;

    for (let i = 0; i < len; i += 4) {
        let lum = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;

        // Apply thermal sensitivity bias slider
        lum = Math.max(0, Math.min(1, lum + bias));

        if (contrast !== 1.0) {
            lum = Math.max(0, Math.min(1, (lum - 0.5) * contrast + 0.5));
        }

        if (invert) {
            lum = 1.0 - lum;
        }

        if (theme === "fire") {
            // Inferno / Flame palette
            if (lum < 0.33) {
                const t = lum * 3;
                data[i] = Math.floor(t * 180); data[i + 1] = 0; data[i + 2] = 0;
            } else if (lum < 0.66) {
                const t = (lum - 0.33) * 3;
                data[i] = 255; data[i + 1] = Math.floor(t * 160); data[i + 2] = 0;
            } else {
                const t = (lum - 0.66) * 3;
                data[i] = 255; data[i + 1] = 200 + Math.floor(t * 55); data[i + 2] = Math.floor(t * 255);
            }
        } else if (theme === "arctic" || theme === "cyber") {
            // Arctic Cryo Blue
            if (lum < 0.33) {
                const t = lum * 3;
                data[i] = 0; data[i + 1] = Math.floor(t * 40); data[i + 2] = Math.floor(t * 180);
            } else if (lum < 0.66) {
                const t = (lum - 0.33) * 3;
                data[i] = 0; data[i + 1] = 100 + Math.floor(t * 155); data[i + 2] = 255;
            } else {
                const t = (lum - 0.66) * 3;
                data[i] = Math.floor(t * 220); data[i + 1] = 255; data[i + 2] = 255;
            }
        } else if (theme === "rainbow" || theme === "rgb") {
            // Full Spectrum Rainbow
            const hue = (1.0 - lum) * 240;
            const c = 1.0;
            const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
            let r1 = 0, g1 = 0, b1 = 0;
            if (hue < 60) { r1 = c; g1 = x; b1 = 0; }
            else if (hue < 120) { r1 = x; g1 = c; b1 = 0; }
            else if (hue < 180) { r1 = 0; g1 = c; b1 = x; }
            else { r1 = 0; g1 = x; b1 = c; }
            data[i] = Math.floor(r1 * 255);
            data[i + 1] = Math.floor(g1 * 255);
            data[i + 2] = Math.floor(b1 * 255);
        } else if (theme === "mono") {
            // FLIR Monochromatic
            const v = Math.floor(lum * 255);
            data[i] = data[i + 1] = data[i + 2] = v;
        } else {
            // Classic Ironbow
            if (lum < 0.25) {
                data[i] = 10;
                data[i + 1] = Math.floor(lum * 4 * 120);
                data[i + 2] = Math.floor(lum * 4 * 255);
            } else if (lum < 0.5) {
                const t = (lum - 0.25) * 4;
                data[i] = Math.floor(t * 220);
                data[i + 1] = 20;
                data[i + 2] = Math.floor((1 - t) * 255);
            } else if (lum < 0.75) {
                const t = (lum - 0.5) * 4;
                data[i] = 255;
                data[i + 1] = Math.floor(t * 220);
                data[i + 2] = 20;
            } else {
                const t = (lum - 0.75) * 4;
                data[i] = 255;
                data[i + 1] = 255;
                data[i + 2] = Math.floor(t * 255);
            }
        }
    }

    ctx.putImageData(src, 0, 0);
}


/* -------------------------------------------------------------
   FILTER 4: RETRO 8-BIT ARCADE + DYNAMIC RESOLUTION
   ------------------------------------------------------------- */

function renderRetroFilter(video) {
    const canvas = DOM.filterCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const w = canvas.width = 320;
    const h = canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth));

    // Dynamic pixel size slider from 3px up to 24px!
    const pixelSize = Math.max(2, Math.min(24, state.filters.retroPixelSize || 8));
    const smallW = Math.max(8, Math.floor(w / pixelSize));
    const smallH = Math.max(6, Math.floor(h / pixelSize));

    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement("canvas");
        offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
    }

    offscreenCanvas.width = smallW;
    offscreenCanvas.height = smallH;
    offscreenCtx.drawImage(video, 0, 0, smallW, smallH);

    // Apply color palette and contrast to low-res pixel buffer
    const imgData = offscreenCtx.getImageData(0, 0, smallW, smallH);
    const data = imgData.data;
    const contrast = state.filters.contrast;
    const invert = state.filters.invert;
    const theme = state.filters.theme || "rgb";

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Contrast boost
        if (contrast !== 1.0) {
            r = Math.max(0, Math.min(255, (r - 128) * contrast + 128));
            g = Math.max(0, Math.min(255, (g - 128) * contrast + 128));
            b = Math.max(0, Math.min(255, (b - 128) * contrast + 128));
        }

        let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (invert) lum = 1.0 - lum;

        if (theme === "gameboy") {
            // 4-shade classic GameBoy pea-soup LCD
            if (lum < 0.25) { r = 15; g = 56; b = 15; }
            else if (lum < 0.50) { r = 48; g = 98; b = 48; }
            else if (lum < 0.75) { r = 139; g = 172; b = 15; }
            else { r = 155; g = 188; b = 15; }
        } else if (theme === "cyber") {
            // Retro cyberpunk synthwave
            if (lum < 0.25) { r = 24; g = 20; b = 58; }
            else if (lum < 0.50) { r = 112; g = 38; b = 112; }
            else if (lum < 0.75) { r = 0; g = 210; b = 255; }
            else { r = 255; g = 240; b = 255; }
        } else if (theme === "amber") {
            r = Math.floor(lum * 255);
            g = Math.floor(lum * 176);
            b = 0;
        } else if (theme === "mono") {
            const val = lum > 0.45 ? 245 : 15;
            r = g = b = val;
        } else {
            // 8-bit quantized posterized RGB
            r = Math.round(r / 32) * 32;
            g = Math.round(g / 32) * 32;
            b = Math.round(b / 32) * 32;
        }

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    offscreenCtx.putImageData(imgData, 0, 0);

    // Scale up onto display canvas with crisp nearest-neighbor interpolation
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreenCanvas, 0, 0, w, h);

    // Subtle CRT scanlines
    ctx.fillStyle = "rgba(0, 0, 0, 0.20)";
    for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
    }
}


/* -------------------------------------------------------------
   FILTER 5: POP-ART HALFTONE + DYNAMIC GRID SPACING
   ------------------------------------------------------------- */

function renderHalftoneFilter(video) {
    const canvas = DOM.filterCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const w = canvas.width = 320;
    const h = canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth));

    // Dynamic dot grid spacing slider from 4px to 24px!
    const dotSpacing = Math.max(4, Math.min(24, state.filters.halftoneDotSize || 8));
    const cols = Math.floor(w / dotSpacing);
    const rows = Math.floor(h / dotSpacing);

    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement("canvas");
        offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
    }

    offscreenCanvas.width = cols;
    offscreenCanvas.height = rows;
    offscreenCtx.drawImage(video, 0, 0, cols, rows);
    const srcData = offscreenCtx.getImageData(0, 0, cols, rows).data;

    const contrast = state.filters.contrast;
    const invert = state.filters.invert;
    const theme = state.filters.theme || "cyber";

    // Background color
    if (invert) {
        ctx.fillStyle = "#F8FAFC"; // Light comic paper
    } else {
        ctx.fillStyle = "#090D16"; // Dark comic background
    }
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4;
            const r = srcData[idx];
            const g = srcData[idx + 1];
            const b = srcData[idx + 2];

            let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (contrast !== 1.0) {
                lum = Math.max(0, Math.min(1, (lum - 0.5) * contrast + 0.5));
            }

            const dotWeight = invert ? (1.0 - lum) : lum;
            const maxRadius = (dotSpacing / 2) * 1.15;
            const radius = dotWeight * maxRadius;

            if (radius > 0.6) {
                if (theme === "magenta") {
                    ctx.fillStyle = invert ? "#C026D3" : "#EC4899";
                } else if (theme === "matrix") {
                    ctx.fillStyle = invert ? "#15803D" : "#22C55E";
                } else if (theme === "amber") {
                    ctx.fillStyle = invert ? "#B45309" : "#F59E0B";
                } else if (theme === "mono") {
                    ctx.fillStyle = invert ? "#090D16" : "#FFFFFF";
                } else if (theme === "rgb") {
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                } else {
                    ctx.fillStyle = invert ? "#0284C7" : "#0EA5E9";
                }

                ctx.beginPath();
                ctx.arc(
                    x * dotSpacing + dotSpacing / 2,
                    y * dotSpacing + dotSpacing / 2,
                    radius,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }
    }
}


/* -------------------------------------------------------------
   EXPORTS & TOOLBAR ACTIONS
   ------------------------------------------------------------- */

async function copyAsciiToClipboard() {
    if (!state.filters.lastAsciiArt) {
        setFilterMessage("No ASCII art to copy. Start camera first.", "warning");
        return;
    }

    try {
        await navigator.clipboard.writeText(state.filters.lastAsciiArt);
        setFilterMessage("ASCII art copied to clipboard!", "success");
    } catch (err) {
        // Fallback textarea copy
        const ta = document.createElement("textarea");
        ta.value = state.filters.lastAsciiArt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setFilterMessage("ASCII art copied to clipboard!", "success");
    }
}


function downloadAsciiTextFile() {
    if (!state.filters.lastAsciiArt) {
        setFilterMessage("No ASCII art captured. Start camera first.", "warning");
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([state.filters.lastAsciiArt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vision-ascii-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setFilterMessage(`Downloaded vision-ascii-${timestamp}.txt`, "success");
}


function downloadFilterPngImage() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const canvas = DOM.filterCanvas;
    if (!canvas) {
        setFilterMessage("No active canvas to save.", "warning");
        return;
    }

    canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vision-${state.filters.activeFilter}-${timestamp}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setFilterMessage(`Saved visual filter image (${state.filters.activeFilter}).`, "success");
    }, "image/png");
}


function toggleFilterFullscreen() {
    const stage = DOM.filterStage;
    if (!stage) return;

    if (!document.fullscreenElement) {
        stage.requestFullscreen().catch(err => {
            console.warn("Fullscreen request failed:", err);
        });
    } else {
        document.exitFullscreen();
    }
}


function setFilterMessage(message, type = "info") {
    if (!DOM.filterMessage) return;
    DOM.filterMessage.textContent = message;
    DOM.filterMessage.className = `form-message ${type}`;
    DOM.filterMessage.style.display = message ? "block" : "none";
}


/* =========================================================
   CAMERA CLEANUP
   ========================================================= */

function stopAllCameras() {

    stopRecognitionCamera();

    stopEnrollmentCamera();

    stopFiltersCamera();
}


/* =========================================================
   DEBUG API
   ========================================================= */

window.VisionStudio = {

    state,


    startRecognitionCamera,


    stopRecognitionCamera,


    captureRecognitionImage,


    recognizeSelectedImage,


    createEnrollmentUser,


    startEnrollmentCamera,


    stopEnrollmentCamera,


    captureEnrollmentImage,


    enrollSelectedPose,


    selectEnrollmentPose,


    resetRecognition() {

        stopRecognitionCamera();


        clearRecognitionPreview();


        state.recognition.selectedFile =
            null;


        state.recognition.result =
            null;


        resetFileInput(
            DOM.recognitionFileInput
        );


        updateFileName(
            DOM.recognitionFileName,
            "No file selected"
        );


        if (DOM.recognitionResult) {

            DOM.recognitionResult.innerHTML = `
                <div class="result-placeholder">

                    <div class="result-icon">
                        <i
                            class="fas fa-user-check"
                            aria-hidden="true"
                        ></i>
                    </div>

                    <strong>
                        No recognition yet
                    </strong>

                    <span>
                        Capture or upload an image to begin.
                    </span>

                </div>
            `;
        }


        showRecognitionPlaceholder();


        setCameraStatus(
            "Ready",
            "info"
        );


        updateRecognitionUI();
    },


    resetEnrollment() {

        stopEnrollmentCamera();


        clearEnrollmentPreview();


        state.enrollment.userId =
            null;


        state.enrollment.activePose =
            "CENTER";


        state.enrollment.selectedFile =
            null;


        state.enrollment.completedPoses
            .clear();


        resetFileInput(
            DOM.enrollmentFileInput
        );


        updateFileName(
            DOM.enrollmentFileName,
            "No file selected"
        );


        updateEnrollmentUserStatus(
            "User not created",
            "info"
        );


        showEnrollmentPlaceholder();


        updateEnrollmentPoseProgress();


        updateEnrollmentUI();
    }
};