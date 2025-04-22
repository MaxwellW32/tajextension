const TARGET_URL = "https://gentax-external.ads.taj.gov.jm/Monitoring";
const MONITOR_TIMES = [17, 20]; // 5pm and 8pm in 24-hr

chrome.runtime.onInstalled.addListener(async () => {
    chrome.alarms.create("starter", {
        periodInMinutes: 20
    });
});




chrome.alarms.onAlarm.addListener(async (alarm) => {
    //run starter only if program isn't monitoring
    if (alarm.name === "starter") {
        const monitoring = await getMonitoringStatus()
        if (monitoring) return

        const now = new Date();
        const hour = now.getHours();

        if (MONITOR_TIMES.includes(hour)) {
            startUpMonitorLoop()

            //run initially
            monitorStreamPage()
        }

    } else if (alarm.name === "monitorStreams") {
        monitorStreamPage();
    }
});




chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === "errorAlert") {
        const alertUrl = chrome.runtime.getURL("alert.html");

        // Open new tab
        chrome.tabs.create({ url: alertUrl, active: true });

    } else if (msg.type === "stopMonitoring") {
        //stop monitoring
        await setMonitoringStatus(false)
        chrome.alarms.clear("monitorStreams")

    } else if (msg.type === "focusTab") {
        //focus tab
        const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: `${TARGET_URL}/*` });
        if (tabs.length === 0) return

        const tab = tabs[0];
        if (tab.id === undefined) return

        await chrome.tabs.update(tab.id, { "active": true });

    } else if (msg.type === "startUp") {
        startUpMonitorLoop()
    }
});




//start monitor loop
async function startUpMonitorLoop() {
    //from client start loop if not started already
    const monitoring = await getMonitoringStatus()
    if (monitoring) return

    //update monitoring
    await setMonitoringStatus(true)

    //clear previous alarm
    await chrome.alarms.clear("monitorStreams")

    //start 5 minute checker
    chrome.alarms.create("monitorStreams", {
        periodInMinutes: 5
    });
}

async function monitorStreamPage() {
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({ url: `${TARGET_URL}/*` });

    // If the tab doesn't exist, create it
    if (tabs.length === 0) {
        chrome.tabs.create({ url: TARGET_URL });
        return;
    }

    const tab = tabs[0];
    if (!tab.id) return;

    // If the tab is active and focused, don't refresh it
    const isUserOnTab = tab.active && tab.highlighted;

    if (!isUserOnTab) {
        // Reload the tab only if the user isn't currently on it
        await chrome.tabs.reload(tab.id);
    }

    // Run script
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["out/content.js"]
    });
}

async function getMonitoringStatus(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.local.get(["programMonitoring"], (res) => {
            resolve(res.programMonitoring === true);
        });
    });
}

async function setMonitoringStatus(value: boolean): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ programMonitoring: value }, resolve);
    });
}