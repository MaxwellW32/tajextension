const TARGET_URL = "https://gentax-external.ads.taj.gov.jm/Monitoring";
const KEYWORDS = ["stopped"];
const MONITOR_TIMES = [17, 20]; // 5pm and 8pm in 24-hr

chrome.runtime.onInstalled.addListener(() => {
    // Setup hourly check
    chrome.alarms.create("monitorStreams", {
        periodInMinutes: 5
    });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "monitorStreams") {
        const now = new Date();
        const hour = now.getHours();

        if (MONITOR_TIMES.includes(hour)) {
            monitorStreamPage();
        }
    }
});

let alertTabId: number | null = null;

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "alert") {
        const alertUrl = chrome.runtime.getURL("alert.html");

        if (alertTabId !== null) {
            // Try to reuse existing tab
            chrome.tabs.update(alertTabId, { active: true });

        } else {
            // Open new tab
            chrome.tabs.create({ url: alertUrl, active: true }, (tab) => {
                alertTabId = tab.id || null;
            });
        }
    }
});

// Clear saved tab ID if the tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === alertTabId) {
        alertTabId = null;
    }
});

async function monitorStreamPage() {
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: `${TARGET_URL}/*` });

    if (tabs.length === 0) {
        chrome.tabs.create({ url: TARGET_URL });

        return;
    }

    const tab = tabs[0];

    if (tab.id === undefined) {
        return
    }

    // Refresh tab to keep session alive
    chrome.tabs.reload(tab.id);

    // Inject content script to check for keyword
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["out/content.js"]
    });
}
