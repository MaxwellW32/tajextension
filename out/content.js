"use strict";
//Features: 
//starts up at 5pm, 8pm
//refreshed every 5 minutes to watch for errors
//immediately show any errors
//stops monitoring if nothing running - will restart at scheduled times
//focus tab if logged out
function load() {
    //wait till page loads
    window.addEventListener("load", () => {
        //give some time after that to ensure js loads
        setTimeout(main, 2000);
    });
}
load();
async function main() {
    let mainObj = {};
    //restart loop if client visits page
    chrome.runtime.sendMessage({ type: "startUp" });
    //send focus tab request if not logged in
    const loggedIn = checkIfLoggedIn();
    if (!loggedIn) {
        chrome.runtime.sendMessage({ type: "focusTab" });
        return;
    }
    //check for stored main Obj
    const storageCheckResult = await chrome.storage.local.get(["mainObjStorage"]);
    if (storageCheckResult.mainObjStorage !== undefined) {
        const seenTimeWritten = new Date(storageCheckResult.mainObjStorage.timeWritten);
        const timeDifference = Date.now() - seenTimeWritten.getTime();
        const canUse = timeDifference <= (1000 * 60 * 10); //10 minutes
        //reuse seen logs
        if (canUse) {
            mainObj = storageCheckResult.mainObjStorage.seenMainObj;
        }
    }
    const errorKeywords = ["stopped"];
    //get the column names - Scheduled Start, Status...etc
    const seenTableHead = document.querySelector("thead");
    if (seenTableHead === null)
        return;
    const titleObj = {};
    let titlesTableRow = seenTableHead.querySelector(".TableHeaderRow");
    if (titlesTableRow === null) {
        return;
    }
    const thChildThNodes = titlesTableRow.childNodes;
    if (thChildThNodes.length === 0)
        return;
    //loop over each td - get the column names
    let eachThIndex = -1;
    thChildThNodes.forEach((eachTh) => {
        //ensure only valid th
        if (eachTh.tagName !== "TH")
            return;
        eachThIndex++;
        //get font element
        const seenAElement = eachTh.querySelector("a");
        if (seenAElement === null)
            return;
        const seenText = seenAElement.innerText;
        //add onto object
        titleObj[eachThIndex] = seenText.toLowerCase();
    });
    //check if status and scheduled start seen in column titles
    const statusHeadingIndex = Object.values(titleObj).findIndex(eachTitleName => eachTitleName === "status");
    const scheduledStartHeadingIndex = Object.values(titleObj).findIndex(eachTitleName => eachTitleName === "scheduled start");
    if (statusHeadingIndex == -1 || scheduledStartHeadingIndex === -1) {
        console.log(`$not seeing required info - statusHeadingIndex/scheduledStartHeadingIndex`);
        return;
    }
    //get the data in the table
    const seenTableBody = document.querySelector("tbody");
    if (seenTableBody === null)
        return;
    const childTrNodes = seenTableBody.childNodes;
    if (childTrNodes.length === 0)
        return;
    //loop over each td - get the column values
    childTrNodes.forEach(eachTR => {
        //ensure only valid tr
        if (eachTR.tagName !== "TR")
            return;
        //loop over each td in the row
        const trChildTdNodes = eachTR.childNodes;
        if (trChildTdNodes.length === 0)
            return;
        //get the status data for each in the table 
        let seenStatusText = "";
        let seenScheduledStartText = "";
        let eachTDIndex = -1;
        trChildTdNodes.forEach((eachTD) => {
            if (eachTD.tagName !== "TD")
                return;
            eachTDIndex++;
            const seenValue = eachTD.innerText.toLowerCase();
            if (eachTDIndex === statusHeadingIndex) {
                //assign status
                seenStatusText = seenValue;
            }
            else if (eachTDIndex === scheduledStartHeadingIndex) {
                //assign scheduled start
                seenScheduledStartText = seenValue;
            }
        });
        //ensure text info seen
        if (seenStatusText === "" || seenScheduledStartText === "") {
            console.log(`not seeing text info`);
            return;
        }
        //assign object data for each row
        //start off new
        if (mainObj[seenScheduledStartText] === undefined) {
            mainObj[seenScheduledStartText] = {
                status: seenStatusText,
            };
        }
        //update records if they exist already
        mainObj[seenScheduledStartText].status = seenStatusText;
        //assign errors
        if (errorKeywords.includes(mainObj[seenScheduledStartText].status)) {
            //create new if doesnt exist
            if (mainObj[seenScheduledStartText].error === undefined) {
                mainObj[seenScheduledStartText].error = {
                    errorText: "",
                    acknowledged: false
                };
            }
            //update records if exists already
            mainObj[seenScheduledStartText].error.errorText = "rais stream stopped";
        }
    });
    // console.log(`mainObj`, mainObj)
    let runningDetected = false;
    Object.entries(mainObj).map(eachEntry => {
        const eachKey = eachEntry[0];
        const eachValue = eachEntry[1];
        if (eachValue.error !== undefined && !eachValue.error.acknowledged) {
            if (mainObj[eachKey].error === undefined)
                return;
            chrome.runtime.sendMessage({ type: "errorAlert" });
            //mark error as acknowledged
            mainObj[eachKey].error.acknowledged = true;
        }
        //check the status in mainObj
        if (eachValue.status === "running") {
            runningDetected = true;
        }
    });
    //if nothing running stop the loop
    if (!runningDetected) {
        chrome.runtime.sendMessage({ type: "stopMonitoring" });
    }
    //update object in storage
    const newMainObjInStorage = {
        seenMainObj: mainObj,
        timeWritten: `${new Date()}`
    };
    //write to chrome storage
    chrome.storage.local.set({ mainObjStorage: newMainObjInStorage });
}
function checkIfLoggedIn() {
    const seenHtml = document.querySelector("body");
    if (seenHtml === null)
        return false;
    if (seenHtml.innerHTML.toLowerCase().includes(`your session has been locked`)) {
        return false;
    }
    return true;
}
