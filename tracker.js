// tracker.js
import { supabase } from './supabase-client.js';

// --- 1. CONFIGURATION & STATE ---
let userIP = null;
const startTime = new Date(); // Record the time when the script loads.
let hasLogged = false; // Flag to ensure we only log once per session.

// --- 2. DATA COLLECTION HELPERS ---

/**
 * Fetches the user's IP address from an external service.
 * Caches the result to avoid redundant API calls.
 * @returns {Promise<string>} The user's IP address.
 */
async function getIP() {
    if (userIP) return userIP;
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userIP = data.ip;
        return userIP;
    } catch (error) {
        console.warn('Tracker: Could not fetch IP address.', error);
        return 'unknown';
    }
}

/**
 * Gathers browser and operating system information from the user agent string.
 * @returns {object} An object containing browser, OS, screen dimensions, etc.
 */
function getMetaData() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "MacOS";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (ua.indexOf("Android") !== -1) os = "Android";
    if (ua.indexOf("like Mac") !== -1) os = "iOS";

    return {
        browser,
        os,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        userAgent: ua,
    };
}


// --- 3. CORE TRACKING LOGIC ---

/**
 * Logs the visitor's session details to the Supabase database.
 * This function is designed to be called when the page is being unloaded.
 */
const logVisit = async () => {
    // 1. Check if the visit has already been logged for this session.
    if (hasLogged) return;
    hasLogged = true; // Set the flag to prevent duplicate logs.

    const ip = await getIP();

    // Don't log if the IP couldn't be fetched.
    if (!ip || ip === 'unknown') return;

    // Calculate the total time spent on the page in seconds.
    const endTime = new Date();
    const duration_seconds = Math.round((endTime - startTime) / 1000);

    const visitData = {
        ip_address: ip,
        duration_seconds: duration_seconds,
        meta: getMetaData(),
    };

    // 'insert' the data into the 'page_visits' table.
    // We don't await this call because we're in a 'beforeunload' context,
    // so we just fire and forget.
    const { error } = await supabase.from('page_visits').insert([visitData]);

    if (error) {
        console.error('Tracker Error:', error);
    }
};

// --- 4. INITIALIZATION ---

/**
 * Initializes the tracker by setting up the necessary event listeners.
 */
export function initTracker() {
    // The 'visibilitychange' event is a more reliable way to detect when a user leaves a page
    // than 'beforeunload' or 'unload', especially on mobile.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            logVisit();
        }
    });

    // We also keep 'pagehide' as a fallback for browsers that might not
    // fire 'visibilitychange' reliably on tab close.
    window.addEventListener('pagehide', logVisit, { capture: true });

    console.log('Visitor tracker initialized.');
}
