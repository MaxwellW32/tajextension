async function updatePopup() {
    const statusDiv = document.getElementById("status");
    if (statusDiv === null) return;

    //ensure seeing logs
    const result = await chrome.storage.local.get(["mainObjStorage"])
    if (result.mainObjStorage === undefined) {
        statusDiv.innerHTML = `
            <p>not seeing logs in storage - please view the rais stream</p>
            `;

        return
    }

    const seenMainObjStorage: mainObjInStorageType = result.mainObjStorage

    //validate logs based on time
    const seenTimeWritten = new Date(seenMainObjStorage.timeWritten)
    const timeDifference = Date.now() - seenTimeWritten.getTime()
    const canUse = timeDifference <= (1000 * 60 * 10) //10 minutes

    //ensure logs up to date
    if (!canUse) {
        statusDiv.innerHTML = `
        <p>logs outdated - view the rais stream to refresh</p>
        `;

        return
    }

    const groupedItems = {
        running: [] as string[],
        stopped: [] as string[],
    };

    for (const [key, value] of Object.entries(seenMainObjStorage.seenMainObj)) {
        if (value.status === "running") {
            groupedItems.running.push(key);

        } else if (value.status === "stopped") {
            groupedItems.stopped.push(key);
        }
    }

    statusDiv.innerHTML = `
        ${groupedItems.running.length > 0 ? `
            <p class="running">${groupedItems.running.length} running</p>
            
            <ul>
                ${groupedItems.running.map(each => `<li>${each}</li>`).join("")}
            </ul>
        ` : `
            <p>Nothing running</p>        
        `}
        ${groupedItems.stopped.length > 0 ? `
            <p class="stopped">${groupedItems.stopped.length} stopped</p>
           
            <ul>
                ${groupedItems.stopped.map(each => `<li>${each}</li>`).join("")}
            </ul>
        ` : ""}
    `;
}
updatePopup();

