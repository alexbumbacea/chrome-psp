const timerStep = 750;
const simulateAjaxTimer = 1000;

/**
 *
 * @returns {Promise}
 * @param time - int (milliseconds)
 * @param params - array
 */
var sleep = function (time, params) {
    return new Promise((resolve) => setTimeout(resolve, time, params));
};

/**
 * Hack for Internet Explorer 9 and below in order to support sending additional params to setTimeout
 * https://developer.mozilla.org/en-US/docs/Web/API/WindowTimers/setTimeout#Polyfill
 */
if (document.all && !window.setTimeout.isPolyfill) {
    var __nativeST__ = window.setTimeout;
    window.setTimeout = function (vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
        var aArgs = Array.prototype.slice.call(arguments, 2);
        return __nativeST__(vCallback instanceof Function ? function () {
            vCallback.apply(null, aArgs);
        } : vCallback, nDelay);
    };
    window.setTimeout.isPolyfill = true;
}

/**
 * Handle the received data
 * @param data - JSON object
 */
var handleResults = function (data) {
    $('.loadingInfo').fadeOut("slow", function () {
        $('.resultMessage').html(data.message).fadeIn('slow');
        if (!data.error) {
            // console.log(data.results);
            createResultsLines(data.results);
        }
    });
};

/**
 * Fill the results and display them in a friendly way
 * @param results - JSON object
 */
var createResultsLines = function (results) {
    var counter = 0;
    for (var key in results) {
        // console.log("key:", key, "res: ", results[key]);
        // populate each line with the received properties
        $('<p>', {
            'class': ' hidden line res_' + key
        })
            .append(
                $('<span>', {
                    'text': results[key].field,
                    'class': 'field'
                })
            )
            .append(
                $('<span>', {'class': 'value'}).html(results[key].value)
            )
            .appendTo($('.infoLines').first());

        // show each line after a predefined time for a better user experience
        var timer = counter++ * timerStep;
        sleep(timer, {"lineKey": key, "counter": counter, "limit": Object.keys(results).length}).then((params) => {
            $(".infoLines .line.res_" + params.lineKey).fadeIn('slow');
            // finally, show the actionButtons container
            if (params.counter == params.limit) {
                sleep(params.counter * timerStep).then(() => {
                    $(".actionButtons").fadeIn('slow');
                });
            }
        });
    }
};

/**
 * Simulate data received from am Ajax call to the backend server
 */
var simulateAjaxRequest = function () {
    var data = {
        "error": false,
        "message": "Story assignee match found!",
        "results": {
            "department": {
                "field": "Department",
                "value": "EOS",
                "fieldName": 'customfield_15346',
            }
        }
    };

    setTimeout(handleResults, simulateAjaxTimer, data);
};

/**
 * Make the Ajax request to the backend server!
 */
var getStoryData = function (storyId) {
    if (!storyId) {
        handleResults({
            "error": true,
            "message": "Va rugam sa accesati o pagina de genul: 'http(s)://jira/*'] !"
        });
        return;
    }

    $.ajax({
        "url": "http://192.168.211.152:8081/prediction/" + storyId,
        "method": "GET",
        dataType: "json"
    }).done(function (storyData) {
        var data = {
            "error": false,
            "message": "Story assignee match found!",
            "results": {
                "department": {
                    "field": "Department",
                    "value": storyData['customfield_15346'],
                    "fieldName": 'customfield_15346'
                }
            }
        };
        handleResults(data);
    }).fail(function () {
        handleResults({
            "error": true,
            "message": "Request failed! Please try again later!"
        });
    });
};

function signalizeJira() {
    chrome.browserAction.setBadgeText({text: "JIRA"});
    chrome.browserAction.setBadgeBackgroundColor({color: "#ff0000"});
}

/**
 * Extract a storyId from the current page URL
 * @returns {string}
 */
var getStoryId = function (callback) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var url = tabs[0].url;
        var urlParts = url.match(/.*([a-z]{3,6}-\d+).*/i);
        var storyId = (urlParts && urlParts.length === 2) ? urlParts[1] : 0;
        if (storyId) {
            signalizeJira();
        }
        callback(storyId);
    });
};

/**
 * Start fresh
 */
function cleanup() {
    $('.loadingInfo').fadeIn("slow");
    $('.resultMessage').hide().html('');
    $('.infoLines').html('');
    $('.actionButtons').hide();
}

/**
 * Really start the fun!
 */
var start = function () {
    cleanup();
    getStoryId(getStoryData); // simulateAjaxRequest();
};

/**
 * Finally, this project's existence purpose: fill in the blanks!
 */
var fillInfo = function () {
    var dept = $('.res_department .value').first().text();
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        var tab = tabs[0];
        chrome.tabs.sendMessage(tab.id, {'action': 'fill_dept', 'department': dept},
            function (response) {
                console.log("fillInfo sendMessage response: ", response);
            }
        );
    });
};

/**
 * Start the fun!
 */
$(document).ready(function () {
    $('.fillInfoBtn').click(fillInfo);
    $('.tryAgainBtn').click(start);

    start();
});

