let { logmailer, Recipient, Chapter, StandardChapters } = require("./index");

let chapters = {
    summary: StandardChapters.Summary,
    ffOnly: new Chapter("Firefighter only", false, "DeepPink"),
    managerOnly: new Chapter("Manager only", false, "DarkSlateBlue"),
    errors: StandardChapters.Errors,
    logs: StandardChapters.Logs
}

logmailer.create({
    appName: "My App",
    mailAlias: "myapp@mymail.com",
    client: {
        host: "smtp.googlemail.com",
        user: "user",
        password: "password",
        ssl: true
    },
    recipients: [
        "baerbel@gmx.de", // receives everything
        new Recipient("guenther@gmail.com", [chapters.managerOnly], [chapters.managerOnly]),
        new Recipient("horst@web.de", [chapters.ffOnly], [chapters.summary, chapters.ffOnly, chapters.errors]),
    ],
    chapters: chapters
})

module.exports.logmail = chapters;
module.exports.logmailer = logmailer;