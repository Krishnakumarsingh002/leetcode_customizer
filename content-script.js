/////////////////////// PRINT TO CONSOLE ONLY WHILE DEBUGGING //////////////////////
wantToDebug = false;
function printOnConsole(param) {
    if (wantToDebug) {
        printOnConsole(param);
    }
}

// for compatibility between chrome and firefox
var browser = chrome

// svg for encircled green checkmark icon for solved problems

const solvedCheckMarkSvg = 'M21.6004 12C21.6004 17.302 17.3023 21.6 12.0004 21.6C6.69846 21.6 2.40039 17.302 2.40039 12C2.40039 6.69809 6.69846 2.40002 12.0004 2.40002C13.5066 2.40002 14.9318 2.74689 16.2004 3.3651M19.8004 6.00002L11.4004 14.4L9.00039 12'

// MESSAGE TO ACTIVATE THE POPUP ICON
chrome.runtime.sendMessage({
    "message": "reloaded"
});



// ################### MODES #####################
/*
    1 - new version of leetcode/problemset
    2 - For tags page
    6 - new coding area
*/

function isProblemSetPage() {
    url = window.location.href;
    return url.includes('/problemset/')
}

function isTagPage() {
    url = window.location.href;
    return url.includes('/tag/')
}

function isCodingArea() {
    url = window.location.href;
    return url.includes('/problems/')
}



function setMode() {
    mode = 2;
    if (isCodingArea() && document.querySelector('#app') != null)
        mode = 3;
    else if (isCodingArea())
        mode = 6;
    else if (isProblemSetPage())
        mode = 1;
    else if (isTagPage())
        mode = 2;
}

setMode();

// ################### MUTATION OBSERVER #####################
// to load extension only after the page content


const observer = new MutationObserver(function (mutations) {
    setMode();
    if (mutations.length) {
        if (mode == 2 && mutations.length == 2 && mutations[1].addedNodes.length == 1 && mutations[1].addedNodes[0].classList && mutations[1].addedNodes[0].classList.contains("grey-container__2YkQ") && mutations[1].addedNodes[0].classList.contains("container")) {
            let thisEle = mutations[1].addedNodes[0];
            let table = thisEle.querySelectorAll("tbody.reactable-data tr");
            let lastRow = table[table.length - 1]
            let lastRowTitle = table[table.length - 1].querySelector('td div.title-cell__ZGos');
            let secondLastRowTitle = table[table.length - 2].querySelector('td div.title-cell__ZGos');
            // printOnConsole(lastRowTitle);
            observer.observe(lastRowTitle, {
                subtree: true,
                childList: true,
                characterData: true,
            })
            // printOnConsole(secondLastRowTitle);
            observer.observe(secondLastRowTitle, {
                subtree: true,
                childList: true,
                characterData: true,
            })

            observer.observe(lastRow, {
                childList: true,
            })

            // printOnConsole(tableHeader.chi)

        }
        browser.storage.local.get(["options"], function (data) {
            applyChanges(data.options);
        });
    }
});

// on page refresh changes should be reflected automatically
chrome.runtime.onMessage.addListener(
    function(response, sender, sendResponse) {
        // listen for messages sent from background.js
        if(response.message==="reloaded!"){
            // console.log("applying changes 15 seconds"); 
            browser.storage.local.get(["options"], function (data) {
            setTimeout(() => {
                applyChanges(data.options);
            }, 15000);
        });
    }
       else if (response.message === 'urlChanged!') {
        if(mode==1){
            // console.log("here comes the url") // new url is now in content scripts!
            browser.storage.local.get(["options"], function (data) {
                // console.log("applying changes");
                setTimeout(() => {
                    applyChanges(data.options);
                    
                }, 3000);
            });
        }
      }
    else if(response.message==="fromBack"){
        // console.log("fromBack running");
        ops = []
        for (option of response.options) {
            ops.push(option);
        }
        setTimeout(() => {
            applyChanges(ops);
        }, 3000);
    }
});
if (mode == 2) {
    page = document.getElementById('app');
    if (page) {
        observer.observe(page, {
            childList: true,
        });
    }
}
else if (mode == 6) {
    new_code_ui = document.querySelector('#__next')
    if (new_code_ui) {
        observer.observe(new_code_ui, {
            childList: true,
            // subtree: true;
        });
    }
}


function applyChanges(options) {
    // console.log("apply changes running....")
    for (option of options) {
        let name = option.optionName;
        if (name === 'locked') {
            hideLockedProblems(option.checked);
        } else if (name === 'highlight') {
            highlightSolvedProbsBothModes(option.checked)
        } else if (name === 'trendingComp') {
            hideTrendingCompany(option.checked)
        } else if (name === 'solved') {
            removeSolvedProblemsBothModes(option.checked)
        } else if (name === 'disUsers') {
            setSolutionsUsers(option.checked)
        }
        else if (name === 'likes') {

            toggleLikesColumn(name, option.checked)
        }
        else {
            toggleByColName(name, option.checked);
        }
    }
}

// hide column
function findColNoByColName(colName) {

    // hard coded fix
    if (colName === 'status')
        return 0;

    colList = document.querySelectorAll('table thead tr th')
    for (i = 0; i < colList.length; i++) {
        if (colList[i].innerText.toLowerCase().includes(colName)) {
            return i;
        }
    }
    return -1;
}

//hide column2 - for new ui
function findColNoByColName2(colName) {
    colList = document.querySelectorAll('[role="table"] [role="columnheader"]')
    for (i = 0; i < colList.length; i++) {
        if (colList[i].innerText.toLowerCase().includes(colName))
            return i;
    }
    if (colName === "likes") {
        return 13;
    }
    return -1;
}



//####################### HIDE DIFFICULTY FROM NEW CODING AREA #######################
function hideSolvedDiffFromNewCodingArea(checked) {

    // hide difficulty from problem statement // IMP: if below class is changed make sure to change it in content-script.css
    diffCodingArea = document.querySelector('.ssg__qd-splitter-primary-w > div > div > div > div > div > div > div > div > div > div.text-xs');


    if (diffCodingArea) {
        if (checked) {
            diffCodingArea.classList.add('visible');
        } else {
            diffCodingArea.classList.remove('visible');
        }
    }

}


// ###################### HELPER FUNCTION #############################
function getFrontEndId(title) {
    const dotIndex = title.indexOf('.');
    if (dotIndex !== -1) {
        const numberString = title.slice(0, dotIndex);
        const number = parseInt(numberString);
        if (!isNaN(number)) {
            return number;
        }
    }
    return null;
}
// ################## TOGGLE COLUMNS ##########################
async function addLikesTagPage() {
    topBar = document.querySelectorAll("div.ant-col.ant-col-xs-22.ant-col-md-18.ant-col-lg-16.ant-col-xl-14")[1]
    const loadingCont = document.createElement("div");
    loadingCont.classList.add("like_container");
    loadingCont.classList.remove("hide");
    loadingCont.innerHTML = '<div class="like_container"><div class="like_text"><strong>Likes/Dislikes are Loading....</strong></div><div class="like_loading"><div class="like_line_box" ><div class="like_line" id="likes_loading_line"></div></div>        <strong id="likes_percent_value" style="margin-left: 10px;"></strong></div>    </div>'
    topBar.insertBefore(loadingCont, topBar.children[3])
    temp = document.querySelectorAll('thead tr, tbody.reactable-data tr')
    let j = 0;
    let promises = [];
    // const likesObj = {};
    let likesObj = await new Promise((resolve, reject) => {
        browser.storage.local.get(["idToLikesMap"], (data) => {
            if ("idToLikesMap" in data)
                resolve(data.idToLikesMap);
            else {
                printOnConsole("idlikesmap not found")
                resolve({});
            }
        });
    });
    // printOnConsole(likesObj);
    for (i = 1; i < temp.length; i = i + 50) {
        let tempSubArray = Array.from(temp).slice(i, Math.min(temp.length, i + 50));

        // printOnConsole(tempSubArray)
        Array.from(tempSubArray).forEach((temprow) => {
            let ele = temprow.querySelector('div.title-cell__ZGos a')
            let Fid = temprow.querySelector('[label="#"]').innerHTML;
            link = ele.href
            let startIndex = 'https://leetcode.com/problems/'.length;
            let endIndex = link.length;
            let titleSlug = link.substring(startIndex, endIndex);
            // printOnConsole(likesObj[Fid].dateInMs)
            if ((Fid in likesObj) == false || !(likesObj[Fid].dateInMs)  || isOld(likesObj[Fid].dateInMs)) {
                promises.push(
                    getLikesfromTitle(titleSlug).then((obj) => {
                        obj.data.question["dateInMs"] = Date.now()
                        likesObj[obj.data.question.questionFrontendId] = obj.data.question;
                    })
                )
            }
        });
        await new Promise((resolve, reject) => {
            setTimeout(() => {
                // printOnConsole("promise resolve in 2 seconds");
                resolve(1);
            }, 1000);
        })
        changeLoadingPercent((i * 100) / temp.length);
        // printOnConsole("completed till ",i);   
    }
    await Promise.all(promises).then(() => {
        // printOnConsole("setting in  local storage",likesObj);
        browser.storage.local.set({ "idToLikesMap": likesObj }).then(() => {
            printOnConsole("value is set ");
        }).catch((error) => {
            printOnConsole(error);
        })
    });
    changeLoadingPercent(100);
    loadingCont.classList.add("hide");
}
//////////////////////////////////////// CHECK IF WE HAVE ADD OR EDIT THE ELEMENT //////////////////////////////////////
function toAddorEdit(element) {
    header = document.querySelectorAll('thead tr, tbody.reactable-data tr')[0];
    if (header.children[3].innerHTML === "Tags") {
        if (element.children.length <= 7) {
            return "Add";
        }
        else {
            return "Edit";
        }
    }
    else {
        if (element.children.length <= 6) {
            return "Add";
        }
        return "Edit";
    }
}

async function toggleLikesColumn(name, checked) {
    if (name === "likes" && mode == 1) {
        if (checked) {
            temp = document.querySelectorAll('[role="table"] [role="row"]')

            let toCopy = temp[1].querySelector('div:nth-child(4)');
            let toCopyfirst = temp[0].querySelector('div:nth-child(6)');
            // printOnConsole("checked");
            let likesMap = await getLikesArray();
            // printOnConsole("likes map",likesMap);



            for (i = 0; i < temp.length; i++) {
                if (temp[i].children && temp[i].children.length <= 7) {
                    if (i == 0 && temp[i].children.length < 7) {
                        let newCell = toCopyfirst.cloneNode(true);
                        newCell.classList.remove('hide');
                        newCell.firstElementChild.firstElementChild.innerHTML = "Likes/Dislikes";
                        temp[i].appendChild(newCell);
                    }
                    else if (i > 0) {
                        let newCell = toCopy.cloneNode(true);
                        newCell.classList.remove("hide");
                        try {
                            var idString = temp[i].querySelector('div:nth-child(2) .truncate a').innerHTML;
                            var frontEndId = getFrontEndId(idString);
                            // printOnConsole(frontEndId);
                        } catch (error) {
                            printOnConsole(error);
                        }

                        if (temp[i].children.length <= 6) {
                            if(likesMap[frontEndId]){
                            newCell.firstElementChild.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                            }
                            else{
                                newCell.firstElementChild.innerHTML = "NA/NA";
                            }
                            // newCell.f 
                            // newCell.firstElementChild.style. = `Hello`;
                            temp[i].appendChild(newCell);
                        }
                        else {
                            if(likesMap[frontEndId]){
                                temp[i].lastElementChild.firstElementChild.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                            }
                            else{
                                temp[i].lastElementChild.firstElementChild.innerHTML = "NA/NA";
                            }
                        }
                    }
                }
            }
        }
        else {
            temp = document.querySelectorAll('[role="table"] [role="row"]')

            for (i = 0; i < temp.length; i++) {
                // let newCell = toCopy.cloneNode(true);
                // printOnConsole(temp[i].children.length)
                if (temp[i].children && temp[i].children.length > 6)
                    temp[i].removeChild(temp[i].lastElementChild);
            }
            
            // printOnConsole("temp")
        }
    }
    else if (name === "likes" && mode == 2) {
        if (checked) {
            chrome.storage.local.get('idToLikesMap', function (profileObj) {
                let likesMap = profileObj.idToLikesMap;
                if (typeof likesMap === "undefined") {
                    printOnConsole("Likes not found");
                    addLikesTagPage().then(() => {
                        browser.storage.local.get(["options"], function (data) {
                            applyChanges(data.options);
                        });
                    });;
                }
                else {
                    printOnConsole("Likes found already");
                    temp = document.querySelectorAll('thead tr, tbody.reactable-data tr')
                    let lastEle = temp[0].lastElementChild;
                    let secondLastEle = temp[0].children[temp[0].children.length - 2];
                    // printOnConsole(secondLastEle)
                    let toCopy = temp[1].children[1];
                    let toCopyfirst = temp[0].children[1];
                    if (temp[0].lastElementChild.innerHTML === "Likes/Dislikes") {
                        temp[0].lastElementChild.classList.remove('hide');
                        printOnConsole("lastelement was likes and dislikes")
                        let toCopy = temp[1].children[1];
                        for (i = 1; i < temp.length; i++) {
                            let newCell = toCopy.cloneNode(true);
                            newCell.classList.remove("hide");
                            let frontEndId = temp[i].children[1].innerHTML;
                            frontEndId = parseInt(frontEndId);
                            // printOnConsole("printing likesmap frontendid", likesMap[frontEndId])   
                            if ((frontEndId in likesMap) && likesMap[frontEndId] &&  likesMap[frontEndId].dateInMs && isOld(likesMap[frontEndId].dateInMs) === false) {
                                if (toAddorEdit(temp[i]) === 'Edit') {
                                    temp[i].lastElementChild.classList.remove('hide');
                                    temp[i].lastElementChild.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                }
                                else {
                                    newCell.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                    temp[i].appendChild(newCell);
                                }
                            }
                            else {
                                printOnConsole("All likes not found, pushing in local storage");
                                addLikesTagPage().then(() => {
                                    browser.storage.local.get(["options"], function (data) {
                                        applyChanges(data.options);
                                    });
                                });
                                return;
                            }
                        }
                    }
                    else if (secondLastEle && secondLastEle.innerHTML === "Likes/Dislikes") {
                        secondLastEle.classList.remove('hide');
                        printOnConsole("last ele", lastEle)
                        // printOnConsole("second if",secondLastEle)
                        secondLastEle.parentNode.insertBefore(lastEle, secondLastEle);
                        let toCopy = temp[1].children[1];
                        for (i = 1; i < temp.length; i++) {
                            let newCell = toCopy.cloneNode(true);
                            newCell.classList.remove("hide");
                            let frontEndId = temp[i].children[1].innerHTML;
                            frontEndId = parseInt(frontEndId);
                            // printOnConsole(likesMap[frontEndId].dateInMs);
                            if ((frontEndId in likesMap) && likesMap[frontEndId].dateInMs && isOld(likesMap[frontEndId].dateInMs)===false) {
                                if (toAddorEdit(temp[i]) === 'Edit') {
                                    temp[i].lastElementChild.classList.remove('hide');
                                    temp[i].lastElementChild.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                }
                                else {
                                    newCell.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                    temp[i].appendChild(newCell);
                                }
                            }
                            else {
                                printOnConsole("All likes not found, pushing in local");
                                addLikesTagPage().then(() => {
                                    browser.storage.local.get(["options"], function (data) {
                                        applyChanges(data.options);
                                    });
                                });
                                return;
                            }
                        }
                    }
                    else {
                        let toCopy = temp[1].children[1];
                        let toCopyfirst = temp[0].children[1];
                        Array.from(temp[0]).forEach((ele) => {
                            {
                                if (ele.innerHTML === "Acceptance") {
                                    toCopyfirst = ele;
                                    printOnConsole("getting acceptance");
                                }
                            }
                        })
                        let likeDislikeNode = toCopyfirst.cloneNode(true);
                        likeDislikeNode.classList.remove('hide')
                        likeDislikeNode.innerHTML = "Likes/Dislikes";
                        temp[0].appendChild(likeDislikeNode);
                        printOnConsole("like and Dis added at last")
                        for (i = 1; i < temp.length; i++) {
                            let newCell = toCopy.cloneNode(true);
                            newCell.classList.remove("hide");
                            let frontEndId = temp[i].children[1].innerHTML;
                            frontEndId = parseInt(frontEndId);
                            printOnConsole("appending childs")
                            // printOnConsole(likesMap[frontEndId])

                            if ((frontEndId in likesMap) && likesMap[frontEndId].dateInMs && isOld(likesMap[frontEndId].dateInMs)===false) {
                                if (toAddorEdit(temp[i]) === 'Edit')
                                    temp[i].lastElementChild.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                else {
                                    newCell.innerHTML = `${likesMap[frontEndId].likes} / ${likesMap[frontEndId].dislikes}`;
                                    temp[i].appendChild(newCell);
                                }
                            }
                            else {
                                addLikesTagPage().then(() => {
                                    browser.storage.local.get(["options"], function (data) {
                                        applyChanges(data.options);
                                    });
                                });
                                return;
                            }

                        }

                    }

                }
            });
        }
        else {
            temp = document.querySelectorAll('thead tr, tbody.reactable-data tr')
            let lastEle = temp[0].lastElementChild;
            let secondLastEle = temp[0].children[temp[0].children.length - 2];
            if (temp[0].lastElementChild.innerHTML === "Likes/Dislikes") {
                printOnConsole("this is running")
                for (i = 0; i < temp.length; i++) {
                    if (temp[i].children && temp[i].children.length > 6)
                        temp[i].lastElementChild.classList.add('hide');
                }
                printOnConsole("new Likes unchecked");
            }
            else if (secondLastEle && secondLastEle.innerHTML === "Likes/Dislikes") {
                secondLastEle.parentNode.insertBefore(lastEle, secondLastEle);
                for (i = 0; i < temp.length; i++) {
                    if (temp[i].children && temp[i].children.length > 6)
                        temp[i].lastElementChild.classList.add('hide');
                }

            }
        }
    }
}
function changeLoadingPercent(percentage) {
    let progressbar = document.getElementById("likes_loading_line");
    // progress.classList.remove("loading");
    let progValue = document.getElementById('likes_percent_value')
    progressbar.style.width = `${percentage}%`;
    progValue.innerHTML = `${parseInt(percentage)}%`;
}
function toggleByColName(colName, checked) {

    if (mode == 2) {
        colNo = findColNoByColName(colName);
        if (colNo != -1) {
            temp = document.querySelectorAll('table tr td:nth-child(' + (colNo + 1) + ')');
            if (checked) {
                document.querySelector('table tr th:nth-child(' + (colNo + 1) + ')').classList.remove('hide');

                for (i = 0; i < temp.length; i++) {
                    temp[i].classList.remove('hide');
                }
            } else {
                document.querySelector('table tr th:nth-child(' + (colNo + 1) + ')').classList.add('hide');
                for (i = 0; i < temp.length; i++) {
                    temp[i].classList.add('hide');
                }
            }
        }
    } else if (mode == 1) {

        colNo = findColNoByColName2(colName);

        if (colNo != -1) {
            temp = document.querySelectorAll('[role="table"] [role="row"]')
            // printOnConsole("how many times");
            if (checked) {
                // printOnConsole("Lets see the count");
                for (i = 0; i < temp.length; i++) {
                    temp[i].querySelector('div:nth-child(' + (colNo + 1) + ')').classList.remove('hide');
                }
            } else {

                for (i = 0; i < temp.length; i++) {
                    temp[i].querySelector('div:nth-child(' + (colNo + 1) + ')').classList.add('hide');
                }
            }
        }
    }
    else if (mode == 6) {
        if (colName === 'difficulty') {
            hideSolvedDiffFromNewCodingArea(checked);
        }
        else if (colName === 'status') {
            hideStatusFromNewCodingArea(checked);
        }
    }

}
function isOld(storedDateInMs){
 
    // printOnConsole(storedDateInMs);
    return (Date.now()-storedDateInMs)>86400000;
}

async function getLikesArray() {
    aTags = document.querySelectorAll('[role="table"] [role="row"] div.truncate a')

    // const likesObj = {};
    let promises = [];
    let likesObj = await new Promise((resolve, reject) => {
        browser.storage.local.get(["idToLikesMap"], (data) => {
            if ("idToLikesMap" in data)
                resolve(data.idToLikesMap);
            else {
                resolve({});
                printOnConsole("idlikesmap not found");
            }
        });
    });
    Array.from(aTags).forEach(async (ele) => {
        link = ele.href
        Fid = getFrontEndId(ele.innerHTML)
        const startIndex = 'https://leetcode.com/problems/'.length;
        let endIndex = link.length
        if (link[endIndex - 1] === '/') endIndex -= 1;
        const titleSlug = link.substring(startIndex, endIndex);
        // printOnConsole(likesObj[Fid].dateInMs)
        if ((Fid in likesObj) == false || !(likesObj[Fid].dateInMs)  || isOld(likesObj[Fid].dateInMs)) {
            promises.push(
                getLikesfromTitle(titleSlug).then((obj) => {
                    if(obj.data.question){
                        obj.data.question["dateInMs"] = Date.now();
                        // printOnConsole("obj data",obj.data.question);
                        likesObj[obj.data.question.questionFrontendId] = obj.data.question;
                    }
                })
            )
        }
    });

    return Promise.all(promises).then(() => {
        browser.storage.local.set({ "idToLikesMap": likesObj }).then(() => {
            printOnConsole("value is set");
        }).catch((error) => {
            printOnConsole(error);
        })
        return likesObj;
    });
    // getLikesfromTitle(likesArray[0]).then((data)=>{
    //     printOnConsole(typeof(data.data.question.likes))
    //     printOnConsole(data.data.question.likes)
    //     printOnConsole(Object.keys(data.data.question.likes));
    // })
}


async function getLikesfromTitle(titleSlug) {
    const query = `
query questionTitle($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      isPaidOnly
      difficulty
      likes
      dislikes
    }
}
`
    const myurl = 'https://leetcode.com/graphql/';

    if (titleSlug != null) {
        printOnConsole("fetch command running ....")


        try {
            let res = await fetch(myurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    variables: {
                        titleSlug: `${titleSlug}`,
                        operationName: "questionTitle"
                    }
                })
            })
                .then(response => response.json())
                .then((data) => { return data; })

            return res;

        } catch (error) {
            printOnConsole(error);
        }
    }

    // .then(response => response.json())
    // .then(data => printOnConsole(data))
    // .then(data => printOnConsole("data.data",data.question))
    // .catch(error => console.error(error));


}
// ################# HIDE STATUS FROM NEW CODING AREA ############
function hideStatusFromNewCodingArea(checked) {
    solvedMark = document.querySelector(".ssg__qd-splitter-primary-w > div > div > div > div > div > div > div > div > div.mt-3.flex.space-x-4 > div.text-green-s");
    if (solvedMark) {
        if (checked) {
            solvedMark.classList.remove('hide');
        }
        else {
            solvedMark.classList.add('hide');
        }
    }
}

// ################# HIDE LOCKED PROBLEMS ########################
function hideLockedProblems(checked) {
    if (mode == 1) {
        temp = document.querySelectorAll('[role="table"] [role="row"]')
        if (checked) {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector('[role="cell"]:nth-child(1) path[d="M7 8v2H6a3 3 0 00-3 3v6a3 3 0 003 3h12a3 3 0 003-3v-6a3 3 0 00-3-3h-1V8A5 5 0 007 8zm8 0v2H9V8a3 3 0 116 0zm-3 6a2 2 0 100 4 2 2 0 000-4z"]')) {
                    temp[i].classList.remove('hide');
                }
            }
        } else {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector('[role="cell"]:nth-child(1) path[d="M7 8v2H6a3 3 0 00-3 3v6a3 3 0 003 3h12a3 3 0 003-3v-6a3 3 0 00-3-3h-1V8A5 5 0 007 8zm8 0v2H9V8a3 3 0 116 0zm-3 6a2 2 0 100 4 2 2 0 000-4z"]')) {
                    temp[i].classList.add('hide');
                }
            }
        }
    } else if (mode == 2) {
        temp = document.querySelectorAll('table tr')
        for (i = 0; i < temp.length; i++) {
            if (temp[i].querySelector('td:nth-child(3) .fa-lock')) {
                if (checked)
                    temp[i].classList.remove('hide');
                else
                    temp[i].classList.add('hide');
            }
        }
    }

}

// ################## HIGHLIGHT SOLVED PROBLEMS ##################
function highlightSolvedProbsBothModes(checked) {

    if (mode == 1) {
        temp = document.querySelectorAll('[role="table"] [role="row"]')

        add_bg_class = document.querySelector('html').classList.contains('dark') ? 'add-bg-dark' : 'add-bg-old';
        if (checked) {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector('[role="cell"]:nth-child(1) path[d=\"' + solvedCheckMarkSvg + '\"]')) {
                    temp[i].classList.add(add_bg_class);
                } else {
                    temp[i].classList.remove(add_bg_class);
                }
            }
        } else {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector('[role="cell"]:nth-child(1) path[d=\"' + solvedCheckMarkSvg + '\"]')) {
                    temp[i].classList.remove(add_bg_class);
                }
            }
        }
    } else if (mode == 2) {
        temp = document.querySelectorAll('thead tr, tbody.reactable-data tr')
        for (i = 0; i < temp.length; i++) {
            if (temp[i].querySelector('.fa-check')) {
                if (checked) {
                    // temp[i].querySelector('*:nth-child(1)').classList.add('hide');
                    temp[i].classList.add('add-bg-old');
                } else {
                    // temp[i].querySelector('*:nth-child(1)').classList.remove('hide');
                    temp[i].classList.remove('add-bg-old');
                }
            }
            else {
                temp[i].classList.remove('add-bg-old');
            }
        }
    }
}

// ################# HIDE TRENDING COMPANY BLOCK FROM PROBLEMSET PAGE ######################
function hideTrendingCompany(checked) {
    if (mode == 1) {
        el = document.querySelectorAll('.bg-layer-1.rounded-lg.px-4.pt-2.pb-1');
        if (checked) {
            if (el.length) {
                el[0].classList.remove('hide');
            }
        } else {
            if (el.length) {
                el[0].classList.add('hide');
            }
        }
    }
}

// ################## HIDE SOLVED PROBLEMS #######################
function removeSolvedProblemsBothModes(checked) {
    if (mode == 1) {
        temp = document.querySelectorAll('[role="table"] [role="row"]')
        if (checked) {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector(' [role="cell"]:nth-child(1) path[d=\"' + solvedCheckMarkSvg + '\"]') || temp[i].querySelector('[role="cell"]:nth-child(1) path[d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z"]')) {
                    temp[i].classList.remove('hide');
                }
            }
        } else {
            for (i = 0; i < temp.length; i++) {
                if (temp[i].querySelector('[role="cell"]:nth-child(1) path[d=\"' + solvedCheckMarkSvg + '\"]') || temp[i].querySelector('[role="cell"]:nth-child(1) path[d="M20 12.005v-.828a1 1 0 112 0v.829a10 10 0 11-5.93-9.14 1 1 0 01-.814 1.826A8 8 0 1020 12.005zM8.593 10.852a1 1 0 011.414 0L12 12.844l8.293-8.3a1 1 0 011.415 1.413l-9 9.009a1 1 0 01-1.415 0l-2.7-2.7a1 1 0 010-1.414z"]')) {
                    temp[i].classList.add('hide');
                }
            }
        }
    } else if (mode == 2) {
        temp = document.querySelectorAll('table tr')
        for (i = 0; i < temp.length; i++) {
            if (temp[i].querySelector('.fa-check')) {
                if (checked)
                    temp[i].classList.remove('hide');
                else
                    temp[i].classList.add('hide')
            }
        }
    }

}
