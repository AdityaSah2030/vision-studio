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
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    document
        .querySelectorAll("a[href^='#']")
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const selector =
                        link.getAttribute("href");

                    if (
                        !selector ||
                        selector === "#"
                    ) {
                        return;
                    }

                    const target =
                        document.querySelector(
                            selector
                        );

                    if (!target) {
                        return;
                    }

                    event.preventDefault();

                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                    closeMobileNavigation();
                }
            );
        });


    const sections =
        document.querySelectorAll(
            "main section[id]"
        );

    const links =
        document.querySelectorAll(
            ".nav-links .nav-link"
        );


    if (
        sections.length &&
        links.length &&
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (!entry.isIntersecting) {
                            return;
                        }

                        links.forEach(link => {

                            link.classList.toggle(
                                "active",
                                link.getAttribute(
                                    "href"
                                ) ===
                                `#${entry.target.id}`
                            );
                        });
                    });

                },
                {
                    threshold: 0.2,
                    rootMargin:
                        "-15% 0px -65% 0px"
                }
            );


        sections.forEach(
            section =>
                observer.observe(section)
        );
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


async function getCameraStream() {

    const constraints = {

        video: {

            facingMode:
                VISION_CONFIG.CAMERA.facingMode,

            width:
                VISION_CONFIG.CAMERA.width,

            height:
                VISION_CONFIG.CAMERA.height
        },

        audio: false
    };


    try {

        return await navigator
            .mediaDevices
            .getUserMedia(
                constraints
            );

    } catch (error) {

        if (
            error?.name ===
            "OverconstrainedError"
        ) {

            return navigator
                .mediaDevices
                .getUserMedia({
                    video: true,
                    audio: false
                });
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
            "All six poses have been enrolled successfully.",
            "success"
        );


        setButtonDisabled(
            DOM.enrollPoseButton,
            true
        );
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
   CAMERA CLEANUP
   ========================================================= */

function stopAllCameras() {

    stopRecognitionCamera();

    stopEnrollmentCamera();
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