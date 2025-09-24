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

function getLocalTime(tz) {
    const now = new Date();
    const gmtMatch = tz.match(/^GMT([+-]\d{1,2})$/);
    if (gmtMatch) {
        const offset = parseInt(gmtMatch[1], 10);
        const utc = now.getTime() + now.getTimezoneOffset()*60000;
        return new Date(utc + offset*60*60*1000);
    } else {
        try { return new Date(now.toLocaleString("en-US", { timeZone: tz })); } 
        catch { return now; }
    }
}

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
    popup.style.borderRadius = "8px";
    popup.style.padding = "20px";
    popup.style.zIndex = "9999";
    popup.style.color = "#fff";
    popup.style.width = "220px";
    popup.style.maxHeight = "300px";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.gap = "8px";
    popup.style.overflowY = "auto";
    popup.style.paddingRight = "2px";
    popup.style.scrollbarWidth = "thin";
    popup.style.scrollbarColor = "rgba(101,102,113) transparent";
    popup.style.fontFamily = "Whitney, Helvetica, Arial, sans-serif";
    popup.style.fontSize = "14px";

    const title = document.createElement("h3");
    title.innerText = "Select Timezone";
    title.style.fontWeight = "bold";
    title.style.fontSize = "16px";
    title.style.marginBottom = "12px";
    popup.appendChild(title);

    commonTimezones.forEach(tz => {
        const btn = document.createElement("div");
        btn.className = "timezone-option";
        btn.innerText = tz;
        btn.style.padding = "6px 12px";
        btn.style.cursor = "pointer";
        btn.style.borderRadius = "6px";

        btn.addEventListener("click", () => {
            console.log("Setting timezone for ID:", id, "to", tz);
            localStorage.setItem(`timezone_${id}`, tz);
            popup.remove();
        });

        popup.appendChild(btn);
    });

    document.body.appendChild(popup);

    // Close popup on outside click
    function closeOnClickOutside(event) {
        if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener("mousedown", closeOnClickOutside);
        }
    }
    document.addEventListener("mousedown", closeOnClickOutside);
}

// Track last hovered DM channel ID
let lastHoveredDMChannelId = null;
document.addEventListener("mouseover", e => {
    const dmLink = e.target.closest("a[href^='/channels/@me/']");
    if (dmLink) {
        const match = dmLink.getAttribute("href").match(/\/channels\/@me\/(\d+)/);
        if (match) lastHoveredDMChannelId = match[1];
    }
});

function getReactUserId(element) {
    if (!element) return null;
    for (const key in element) {
        if (key.startsWith("__reactProps$")) {
            const props = element[key];
            if (props && props.user && props.user.id) return props.user.id;
        }
    }
    return null;
}

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

function injectIntoContextMenu(menu) {
    if (menu.querySelector("#add-timezone-option")) return;

    const anyMenuItem = menu.querySelector("div[role='menuitem']");
    const id = getReactUserId(anyMenuItem) || lastHoveredDMChannelId || getFallbackKey(menu);
    console.log("Opening menu for ID:", id);

    let listContainer = menu.querySelector("div[role='menuitem']")?.parentElement;
    if (!listContainer) listContainer = menu;

    // Local Time label
    const savedTz = localStorage.getItem(`timezone_${id}`);
    if (savedTz) {
        const localTime = getLocalTime(savedTz);

        const tzLabel = document.createElement("div");
        tzLabel.innerText = `Local Time: ${formatTime(localTime)} (${savedTz})`;
        tzLabel.setAttribute("role", "menuitem");
        tzLabel.style.pointerEvents = "none";
        tzLabel.style.padding = "8px 12px";
        tzLabel.style.color = "#ccc";
        tzLabel.style.fontSize = "14px";
        tzLabel.style.fontFamily = "Whitney, Helvetica, Arial, sans-serif";

        listContainer.insertBefore(tzLabel, listContainer.firstChild);
    }

    // Add Timezone button
    const item = document.createElement("div");
    item.id = "add-timezone-option";
    item.setAttribute("role", "menuitem");
    item.innerText = "Add Timezone";
    item.style.padding = "8px 12px";
    item.style.cursor = "pointer";
    item.style.userSelect = "none";
    item.style.color = "#fff";
    item.style.fontFamily = "Whitney, Helvetica, Arial, sans-serif";
    item.style.fontSize = "14px";
    item.style.borderRadius = "4px";

    // Keep hover effect only for Add Timezone button
    item.addEventListener("mouseenter", () => item.style.background = "rgba(49,49,54)");
    item.addEventListener("mouseleave", () => item.style.background = "transparent");

    item.addEventListener("click", () => showTimezonePopup(id));

    listContainer.insertBefore(item, listContainer.firstChild?.nextSibling || listContainer.firstChild);
}

const observer = new MutationObserver(() => {
    document.querySelectorAll("div[role='menu']").forEach(menu => injectIntoContextMenu(menu));
});
observer.observe(document.body, { childList: true, subtree: true });
