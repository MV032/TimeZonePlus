// content.js

const commonTimezones = [
    "UTC","EST","CST","MST","PST","GMT",
    "GMT+1","GMT+2","GMT+3","GMT-1","GMT-2",
    "Asia/Tokyo","Asia/Shanghai",
    "Europe/London","Europe/Paris",
    "America/New_York","America/Los_Angeles"
];

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2,"0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Show timezone picker popup
function showTimezonePopup(id) {
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

    commonTimezones.forEach(tz => {
        const btn = document.createElement("div");
        btn.innerText = tz;
        btn.style.padding = "6px";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "4px";

        btn.addEventListener("mouseenter", () => btn.style.background = "#40444b");
        btn.addEventListener("mouseleave", () => btn.style.background = "transparent");

        btn.addEventListener("click", () => {
            console.log("Setting timezone for ID:", id, "to", tz); // DEBUG
            localStorage.setItem(`timezone_${id}`, tz);
            popup.remove();
        });

        popup.appendChild(btn);
    });

    document.body.appendChild(popup);
}

// Update local time label
function updateTimezoneLabel(label, id) {
    const tz = localStorage.getItem(`timezone_${id}`);
    if (!tz) {
        label.innerText = "";
        return;
    }

    const now = new Date();
    let localTime;
    try {
        localTime = new Date(now.toLocaleString("en-US", { timeZone: tz }));
    } catch {
        localTime = now;
    }

    label.innerText = `Local Time: ${formatTime(localTime)} (${tz})`;
}

// Track the last hovered DM channel ID
let lastHoveredDMChannelId = null;

// Listen for hover over DM links
document.addEventListener("mouseover", e => {
    const dmLink = e.target.closest("a[href^='/channels/@me/']");
    if (dmLink) {
        const match = dmLink.getAttribute("href").match(/\/channels\/@me\/(\d+)/);
        if (match) {
            lastHoveredDMChannelId = match[1];
            // console.log("Hovered DM channel ID:", lastHoveredDMChannelId); // optional debug
        }
    }
});

// Track the element that was right-clicked
let lastRightClickedElement = null;
document.addEventListener("contextmenu", e => {
    lastRightClickedElement = e.target.closest("[role='menuitem']");
});

// Try to get Discord user ID from React props
function getReactUserId(element) {
    if (!element) return null;
    for (const key in element) {
        if (key.startsWith("__reactProps$")) {
            const props = element[key];
            if (props && props.user && props.user.id) {
                return props.user.id;
            }
        }
    }
    return null;
}

// Generate fallback key from username + discriminator
function getFallbackKey(menu) {
    const usernameDiv = menu.querySelector("h4, span");
    if (usernameDiv) {
        const username = usernameDiv.textContent.trim();
        const discMatch = menu.textContent.match(/#(\d{4})/);
        const discriminator = discMatch ? `#${discMatch[1]}` : "";
        return username + discriminator;
    }
    return "unknown_user";
}

// Inject Add Timezone option
function injectIntoContextMenu(menu) {
    if (menu.querySelector("#add-timezone-option")) return;

    let id = null;

    // 1. Try React user ID first (server/friends)
    const anyMenuItem = menu.querySelector("div[role='menuitem']");
    id = getReactUserId(anyMenuItem);

    // 2. Try last hovered DM channel ID
    if (!id && lastHoveredDMChannelId) id = lastHoveredDMChannelId;

    // 3. Fallback
    if (!id) id = getFallbackKey(menu);

    console.log("Opening menu for ID:", id); // DEBUG

    // Add Local Time label if saved
    const savedTz = localStorage.getItem(`timezone_${id}`);
    if (savedTz) {
        const now = new Date();
        let localTime;
        try {
            localTime = new Date(now.toLocaleString("en-US", { timeZone: savedTz }));
        } catch {
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

    // Add "Add Timezone" button
    const item = document.createElement("div");
    item.id = "add-timezone-option";
    item.innerText = "Add Timezone";
    item.style.padding = "8px 12px";
    item.style.cursor = "pointer";
    item.style.userSelect = "none";

    item.addEventListener("mouseenter", () => item.style.background = "#40444b");
    item.addEventListener("mouseleave", () => item.style.background = "transparent");
    item.addEventListener("click", () => {
        console.log("Clicked Add Timezone for ID:", id); // DEBUG
        showTimezonePopup(id);
        document.body.click(); // close menu
    });

    menu.appendChild(item);
}

// Observe menus
const observer = new MutationObserver(() => {
    document.querySelectorAll("div[role='menu']").forEach(menu => injectIntoContextMenu(menu));
});
observer.observe(document.body, { childList: true, subtree: true });