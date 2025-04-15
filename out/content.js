"use strict";
//Features: 
//to do
function handleSearch() {
    //wait till page loads
    window.addEventListener("load", () => {
        //give some time after that to ensure js loads
        setTimeout(() => {
            var _a;
            const keywords = ["stopped"];
            const seenTableHead = document.querySelector("thead");
            if (seenTableHead === null)
                return;
            const titleObj = {};
            //get the element holding the column titles
            let titlesTableRow = (_a = seenTableHead.querySelector(".TableHeaderRow")) !== null && _a !== void 0 ? _a : seenTableHead.children[1];
            if (titlesTableRow === null || titlesTableRow === undefined) {
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
            //check if status seen in titles
            const seeingStatusHeadingIndex = Object.values(titleObj).findIndex(eachTitleName => eachTitleName === "status");
            if (seeingStatusHeadingIndex == -1) {
                console.log(`$not seeing status heading`);
                return;
            }
            //look at data in the table
            const seenTableBody = document.querySelector("tbody");
            if (seenTableBody === null)
                return;
            const childTrNodes = seenTableBody.childNodes;
            if (childTrNodes.length === 0)
                return;
            let seeingError = false;
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
                let eachTDIndex = -1;
                trChildTdNodes.forEach((eachTD) => {
                    if (eachTD.tagName !== "TD")
                        return;
                    eachTDIndex++;
                    if (eachTDIndex === seeingStatusHeadingIndex) {
                        //check the data in each TD
                        const seenValue = eachTD.innerText.toLowerCase();
                        if (keywords.includes(seenValue)) {
                            seeingError = true;
                        }
                    }
                });
            });
            if (seeingError) {
                chrome.runtime.sendMessage({ type: "alert" });
            }
        }, 2000);
    });
}
handleSearch();
