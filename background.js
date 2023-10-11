var browser = chrome;

// enable popup btn when on correct url
browser.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
    if (request.message === "reloaded") {
        // browser.pageAction.show(sender.tab.id);
        chrome.tabs.sendMessage( sender.tab.id, {
            message: "reloaded!",
        })
    }
});


chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      // console.log("updated");
      chrome.tabs.sendMessage( tabId, {
        message: "urlChanged!",
      })
    }
);