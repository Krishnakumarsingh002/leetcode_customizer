// for compatibility between chrome and firefox
var browser =  chrome

// attach event listener to all checkboxes
var target = document.querySelectorAll("input[name=settings]");
for (chb of target) {
    chb.addEventListener('change', onChange);
}
Array.from(document.getElementsByClassName("slidinggroove")).forEach((ele)=>{

    // console.log("runnng ",ele)
    ele.addEventListener("click",()=>{
        console.log("clicked")
        ele.previousElementSibling.checked^=1;
        var event = new Event('change');
        ele.previousElementSibling.dispatchEvent(event);
    })
})
// handle message from content script

function handleMessage(message) {
    // Handle the message here
    // console.log("Message received in popup.js:", message);
    if(message.message === "toggleLikes"){
    clss = document.getElementsByClassName('slidinggroove')
    clss[clss.length-1].click();
    setTimeout(() => {
        clss[clss.length-1].click();
    }, 6000);
}
}

// Add a listener to handle messages from the content script
chrome.runtime.onMessage.addListener(handleMessage);


// read and update saved changes
browser.storage.local.get(["options"], updatePopup)

function updatePopup(data) {
    if (isIterable(data.options)) {
        for (option of data.options) {
            let chb = document.getElementById(option.optionName);
            if (option.checked) {
                chb.checked = true;
            } else {
                chb.checked = false;
            }
        }
    }
}

// on clicking checkbox
function onChange() {
    // console.log("on change clalled")
    browser.tabs.query({}, function(tabs) {

        options = [];

        var checkboxes = document.querySelectorAll('input[name=settings]')
        for (chb of checkboxes) {
            options.push({ optionName: chb.value, checked: chb.checked })
        }

        browser.storage.local.set({ options });

        const response = {
            options: options,
            message: "fromBack"
        }
        for (tab of tabs) {
            browser.tabs.sendMessage(tab.id, response);
        }
    });
}


function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}



document.getElementById('msg').style.display = "none";

// more details
document.getElementById('deBtn').addEventListener("click", function() {
    isClose = document.getElementById('deBtn').innerText == 'more';
    if (isClose) {
        document.getElementById('msg').style.display = "block";
        document.getElementById('deBtn').innerText = 'less';
    } else {
        document.getElementById('msg').style.display = "none";
        document.getElementById('deBtn').innerText = 'more';
    }
});
