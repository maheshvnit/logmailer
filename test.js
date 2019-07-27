let { logmailer, logmail } = require("./test-config");

logmail.summary.add("Starting time", `Starting app run now: ${new Date().toISOString()}`);

logmail.errors.add("Error heading", "Info about error");
logmail.errors.add(null, "Further info about error");
logmail.errors.add(null, "Further info about error");

logmail.managerOnly.add("Info for the manager heading", "Info for the manager");
logmail.managerOnly.add(null, "Further info for the manager");
logmail.managerOnly.add(null, "Further info for the manager");

logmail.ffOnly.add("Info for the firefighter heading", "Instructions for the firefighter");
logmail.ffOnly.add(null, "Further instructions");
logmail.ffOnly.add(null, "Further instructions");

let object = {
    "row1, col1": "row1, col2",
    "row2, col1": "row2, col2",
    "row3, col1": {
        "row3.1, col2.1": "row3.1, col2.2",
        "row3.2, col2.1": "row3.2, col2.2"
    }
}

logmail.logs.add("My object as a html table", logmailer.convertObjectToHTMLTable(object));

let arrayOfObjects = [object, object];

logmail.logs.add("My object array as a html table", logmailer.convertObjectArrayToHTMLTable(arrayOfObjects));

logmailer.sendMail(err => {
    if (err) {
        console.log("error while sending", err);
    } else {
        console.log("mail sent successfully");
    }
})