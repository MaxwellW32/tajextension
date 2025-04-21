"use strict";
const TARGET_URL = "https://gentax-external.ads.taj.gov.jm/Monitoring";
const MONITOR_TIMES = [17, 20]; // 5pm and 8pm in 24-hr
let programMonitoring = false;
//edit to do
//turn on stop running
chrome.runtime.onInstalled.addListener(() => {
    // start at appropriate time - every 10 minutes check if we can start
    if (!programMonitoring) {
        chrome.alarms.create("starter", {
            periodInMinutes: 5
        });
    }
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
    //run starter only if havent started
    if (alarm.name === "starter" && !programMonitoring) {
        console.log(`running starter`);
        const now = new Date();
        const hour = now.getHours();
        if (MONITOR_TIMES.includes(hour)) {
            programMonitoring = true;
            //clear previous alarm
            await chrome.alarms.clear("monitorStreams");
            //start 5 minute checker
            chrome.alarms.create("monitorStreams", {
                periodInMinutes: 1
            });
            //start once initially
            monitorStreamPage();
        }
    }
    if (alarm.name === "monitorStreams") {
        console.log(`running monitorStreams`);
        monitorStreamPage();
    }
});
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "errorAlert") {
        const alertUrl = chrome.runtime.getURL("alert.html");
        // Open new tab
        chrome.tabs.create({ url: alertUrl, active: true }, (tab) => {
        });
    }
    //stop monitoring
    if (msg.type === "stopMonitoring") {
        console.log(`monitoring stopped`);
        chrome.alarms.clear("monitorStreams");
        programMonitoring = false;
    }
});
async function monitorStreamPage() {
    const tabs = await chrome.tabs.query({ url: `${TARGET_URL}/*` });
    //ensure taj tab exists
    if (tabs.length === 0) {
        chrome.tabs.create({ url: TARGET_URL });
        //run again
        monitorStreamPage();
        return;
    }
    const tab = tabs[0];
    if (tab.id === undefined) {
        console.log(`tab id undefined`, tab);
        return;
    }
    // reload tab
    chrome.tabs.reload(tab.id);
    // execute script
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["out/content.js"]
    });
}
