// content.js

// Common timezone list
const commonTimezones = [
    "UTC",
    "EST",
    "CST",
    "MST",
    "PST",
    "GMT",
    "GMT+1",
    "GMT+2",
    "GMT+3",
    "GMT-1",
    "GMT-2",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Los_Angeles"
];

// Format time in 12h
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Show timezone picker popup
function showTimezonePopup(userId) {
    // Remove old popup if exists
    const oldPopup = document.getElementById("timezone-popup");
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement("div");
    popup.id = "timezone-popup";
    popup.style.position = "fixed";
    popup.style.top = "50%";
    popup.style.left = "50%";
    popup.style.transform = "translate(-50%, -50%)";
    popup.style.background = "#2f3136";
    popup.style.border = "1px solid #444";
    popup.style.borderRadius = "8px";
    popup.style.padding = "10px";
    popup.style.zIndex = "9999";
    popup.style.color = "#fff";
    popup.style.width = "220px";
    popup.style.maxHeight = "300px";
    popup.style.overflowY = "auto";

    const title = document.createElement("div");
    title.innerText = "Select Timezone";
    title.style.marginBottom = "8px";
    title.style.fontWeight = "bold";
    popup.appendChild(title);

    commonTimezones.forEach((tz) => {
        const btn = document.createElement("div");
        btn.innerText = tz;
        btn.style.padding = "6px";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "4px";

        btn.addEventListener("mouseenter", () => {
            btn.style.background = "#40444b";
        });

        btn.addEventListener("mouseleave", () => {
            btn.style.background = "transparent";
        });

        btn.addEventListener("click", () => {
            localStorage.setItem(`timezone_${userId}`, tz);
            popup.remove();
        });

        popup.appendChild(btn);
    });

    document.body.appendChild(popup);
}

// Update context menu with our option
function injectIntoContextMenu(menu) {
    if (menu.querySelector("#add-timezone-option")) return;

    // Find the user ID (Discord always puts it in Copy User ID menu item)
    const copyIdBtn = Array.from(menu.querySelectorAll("div"))
        .find((el) => el.textContent === "Copy User ID");

    if (!copyIdBtn) return;

    // Grab user ID from Discord's internal data (hacky fallback: use dataset on parent)
    const userId = copyIdBtn.parentElement?.dataset?.userId || "unknown";

    // Insert label if timezone exists
    const savedTz = localStorage.getItem(`timezone_${userId}`);
    if (savedTz) {
        const now = new Date();
        let localTime;
        try {
            localTime = new Date(now.toLocaleString("en-US", { timeZone: savedTz }));
        } catch (e) {
            localTime = now;
        }

        const tzLabel = document.createElement("div");
        tzLabel.innerText = `Local Time: ${formatTime(localTime)} (${savedTz})`;
        tzLabel.style.padding = "6px 12px";
        tzLabel.style.fontSize = "12px";
        tzLabel.style.color = "#ccc";
        tzLabel.style.pointerEvents = "none";
        menu.insertBefore(tzLabel, menu.firstChild);
    }

    // Add our new menu option
    const item = document.createElement("div");
    item.id = "add-timezone-option";
    item.innerText = "Add Timezone";
    item.style.padding = "8px 12px";
    item.style.cursor = "pointer";
    item.style.userSelect = "none";

    item.addEventListener("mouseenter", () => {
        item.style.background = "#40444b";
    });

    item.addEventListener("mouseleave", () => {
        item.style.background = "transparent";
    });

    item.addEventListener("click", () => {
        showTimezonePopup(userId);
        document.body.click(); // close menu
    });

    menu.appendChild(item);
}

// Watch for context menus
const observer = new MutationObserver(() => {
    document.querySelectorAll("div[role='menu']").forEach((menu) => {
        injectIntoContextMenu(menu);
    });
});

observer.observe(document.body, { childList: true, subtree: true });