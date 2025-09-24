// @title: content.js
// @name: MV032
// @date: 9-23-25

/** @desc: UI based chrome extension for Discord. Adds an
    option to set a timezone to keep track of other's local time.
*/

// List of common timezones that will appear in the timezone picker
const commonTimezones = [
    "UTC","EST","CST","MST","PST","GMT",
    "GMT+1","GMT+2","GMT+3","GMT-1","GMT-2",
    "Asia/Tokyo","Asia/Shanghai",
    "Europe/London","Europe/Paris",
    "America/New_York","America/Los_Angeles"
];

/**
 * Formats a date into a 12-hour clock string.
 * Example: 10:05 PM
 */
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2,"0"); // always 2 digits
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 to 12 for 12-hour format
    return `${hours}:${minutes} ${ampm}`;
}

/**
 * Returns a Date object adjusted to the given timezone.
 * Supports GMT offsets (like "GMT+3") and IANA timezones (like "Europe/Paris").
 */
function getLocalTime(tz) {
    const now = new Date();
    const gmtMatch = tz.match(/^GMT([+-]\d{1,2})$/);
    if (gmtMatch) {
        const offset = parseInt(gmtMatch[1], 10);
        const utc = now.getTime() + now.getTimezoneOffset() * 60000; // UTC time in ms
        return new Date(utc + offset * 60 * 60 * 1000); // apply offset
    } else {
        try { 
            return new Date(now.toLocaleString("en-US", { timeZone: tz })); 
        } catch { 
            return now; // fallback if timezone invalid
        }
    }
}

/**
 * Creates and displays the timezone selection popup for a user.
 * @param {string} id - unique identifier for the user (React ID, DM channel, or fallback)
 */
function showTimezonePopup(id) {
    // Remove any existing popup
    const oldPopup = document.getElementById("timezone-popup");
    if (oldPopup) oldPopup.remove();

    // Create main popup container
    const popup = document.createElement("div");
    popup.id = "timezone-popup";
    Object.assign(popup.style, {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#2f3136",
        borderRadius: "8px",
        padding: "20px",
        zIndex: "9999",
        color: "#fff",
        width: "220px",
        maxHeight: "300px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        overflowY: "auto",
        paddingRight: "2px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(101,102,113) transparent",
        fontFamily: "Whitney, Helvetica, Arial, sans-serif",
        fontSize: "14px"
    });

    // Popup title
    const title = document.createElement("h3");
    title.innerText = "Select Timezone";
    Object.assign(title.style, {
        fontWeight: "bold",
        fontSize: "16px",
        marginBottom: "12px"
    });
    popup.appendChild(title);

    // Create each timezone option button
    commonTimezones.forEach(tz => {
        const btn = document.createElement("div");
        btn.className = "timezone-option";
        btn.innerText = tz;
        Object.assign(btn.style, {
            padding: "6px 12px",
            cursor: "pointer",
            borderRadius: "6px"
        });

        // When a timezone is clicked, save it in localStorage and close popup
        btn.addEventListener("click", () => {
            console.log("Setting timezone for ID:", id, "to", tz); // debug
            localStorage.setItem(`timezone_${id}`, tz);
            popup.remove();
        });

        popup.appendChild(btn);
    });

    document.body.appendChild(popup);

    // Close the popup if user clicks outside of it
    function closeOnClickOutside(event) {
        if (!popup.contains(event.target)) {
            popup.remove();
            document.removeEventListener("mousedown", closeOnClickOutside);
        }
    }
    document.addEventListener("mousedown", closeOnClickOutside);
}

// Tracks the last hovered DM channel ID (used as a unique fallback identifier)
let lastHoveredDMChannelId = null;
document.addEventListener("mouseover", e => {
    const dmLink = e.target.closest("a[href^='/channels/@me/']");
    if (dmLink) {
        const match = dmLink.getAttribute("href").match(/\/channels\/@me\/(\d+)/);
        if (match) lastHoveredDMChannelId = match[1];
    }
});

/**
 * Tries to extract the user ID from React internal props
 */
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

/**
 * Fallback method to get a unique user identifier if React ID fails
 */
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

/**
 * Injects the "Add Timezone" option and Local Time label into Discord's context menu
 */
function injectIntoContextMenu(menu) {
    // Avoid adding multiple times
    if (menu.querySelector("#add-timezone-option")) return;

    const anyMenuItem = menu.querySelector("div[role='menuitem']");
    const id = getReactUserId(anyMenuItem) || lastHoveredDMChannelId || getFallbackKey(menu);
    console.log("Opening menu for ID:", id);

    // Discord vertical menu container
    let listContainer = menu.querySelector("div[role='menuitem']")?.parentElement;
    if (!listContainer) listContainer = menu;

    // Display Local Time if user has a saved timezone
    const savedTz = localStorage.getItem(`timezone_${id}`);
    if (savedTz) {
        const localTime = getLocalTime(savedTz);

        const tzLabel = document.createElement("div");
        tzLabel.innerText = `Local Time: ${formatTime(localTime)} (${savedTz})`;
        tzLabel.setAttribute("role", "menuitem");
        Object.assign(tzLabel.style, {
            pointerEvents: "none", // non-interactive
            padding: "8px 12px",
            color: "#ccc",
            fontSize: "14px",
            fontFamily: "Whitney, Helvetica, Arial, sans-serif"
        });

        listContainer.insertBefore(tzLabel, listContainer.firstChild);
    }

    // Add Timezone menu button
    const item = document.createElement("div");
    item.id = "add-timezone-option";
    item.setAttribute("role", "menuitem");
    item.innerText = "Add Timezone";
    Object.assign(item.style, {
        padding: "8px 12px",
        cursor: "pointer",
        userSelect: "none",
        color: "#fff",
        fontFamily: "Whitney, Helvetica, Arial, sans-serif",
        fontSize: "14px",
        borderRadius: "4px"
    });

    // Hover effect
    item.addEventListener("mouseenter", () => item.style.background = "rgba(49,49,54)");
    item.addEventListener("mouseleave", () => item.style.background = "transparent");

    // Open the popup when clicked
    item.addEventListener("click", () => showTimezonePopup(id));

    // Insert below Local Time label if it exists
    listContainer.insertBefore(item, listContainer.firstChild?.nextSibling || listContainer.firstChild);
}

// Observe the DOM for new context menus
const observer = new MutationObserver(() => {
    document.querySelectorAll("div[role='menu']").forEach(menu => injectIntoContextMenu(menu));
});
observer.observe(document.body, { childList: true, subtree: true });
