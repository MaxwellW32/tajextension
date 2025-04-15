"use strict";
function main() {
    const stopButton = document.querySelector("#stopButton");
    if (stopButton === null)
        return;
    stopButton.addEventListener("click", handleclick);
    let buttonClicked = false;
    function handleclick() {
        if (stopButton === null)
            return;
        buttonClicked = !buttonClicked;
        if (buttonClicked) {
            //stop monitoring
            chrome.runtime.sendMessage({ type: "stopMonitoring" });
            stopButton.classList.add("buttonClicked");
            stopButton.innerText = "start monitoring";
        }
        else {
            //start monitoring
            stopButton.classList.remove("buttonClicked");
            stopButton.innerText = "Stop monitoring";
        }
    }
}
main();
