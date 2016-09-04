function handleMessage(request, sender, callback) {
    if (request.action == 'fill_dept') {

        $('#edit-issue').click();
        // callback(document);
        var e = $.Event("keypress");
        e.which = 44;
        e.keycode = 44;
        $("#jira").trigger(e);

        var actionBox = $('#shifter-dialog-field');
        actionBox.val('PS.Project');
        setTimeout(function () {
            actionBox.trigger('input');
        }, 500);
        setTimeout(function () {
            e = $.Event('keydown');
            e.which = 13;
            e.keycode = 13;
            $("#jira").trigger(e)
        }, 1000);
        // @TODO - fill the assignee/department fields...: request.action.department

    }
}
// Wire up the listener.
chrome.runtime.onMessage.addListener(handleMessage);

