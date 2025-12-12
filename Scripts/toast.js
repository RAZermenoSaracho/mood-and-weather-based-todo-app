// =========================================================
// REUSABLE SUCCESS TOAST FOR TASK OPERATIONS
// =========================================================

export function showTaskSuccess(message) {
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.textContent = message;

    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}
