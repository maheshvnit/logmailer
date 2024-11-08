// let email = require("emailjs/email");

/**
 * Mailer to aggregate error or log mails. It's a singleton. Create it once by `logmailer.create(..)`, use it then simply like `logmailer.add(..)` or `logmailer.send(..)`
 *
 * Instructions see https://www.npmjs.com/package/logmailer
 *
 */
class Mailer {
    constructor() {
        if (!Mailer.instance) {
            this.appName = `App-${process.pid}`;
            this.mailAlias = `logmailer-${process.pid}`
            this.mailClient = null;
            this.recipients = [];
            this.chapters = {};
        }
        return Mailer.instance;
    }

    /**
     * Create the logmailer instance once
     * @param {Object} options
     * @param {string} [options.appName] (optional, default is App-#pid) meaningful app name is used in mail subject (e.g. appName [Success]: YourSubject)
     * @param {string} [options.mailAlias] (optional, default is logmailer-#pid) your mail alias you want to send from (e.g. "fictive-sender[at]fictive-domain.com")
     * @param {Object} options.client mail client configuration
     * @param {string} options.client.host email host, e.g. smtp.googlemail.com
     * @param {string} options.client.user email user
     * @param {string} options.client.password email password
     * @param {boolean} options.client.ssl use ssl
     * @param {string[]|Recipient[]} options.recipients Array, define the recipients via email string or recipient object
     * @param {Object} options.chapters use the StandardChapters or define your own
     * @param {Chapter} [options.chapters.customChapter] just an example
     */
    create(options) {

        this.appName = options.appName;
        this.mailAlias = options.mailAlias;

        // removed this
        // let mailClient = email.server.connect({
        //     host: options.client.host,
        //     user: options.client.user,
        //     password: options.client.password,
        //     ssl: options.client.ssl
        // });

        //this.mailClient = mailClient;
        // added this for Sendgrid
        this.mailClient = options.client;
        this.recipients = options.recipients;
        this.chapters = options.chapters;
    }

    /**
     * Send mail finally
     * @param {function(Error): void} callback returns an error if there was one, otherwise returns null
     */
    sendMail(callback) {

        let recipientHTMLs = [];

        this.recipients.forEach(recipient => {

            let recipientHTML = {
                emailAddress: "",
                sendEmail: false,
                html: "",
                subject: `${this.appName}`
            }

            if (recipient.hasOwnProperty("emailAddress")) {
                recipientHTML.emailAddress = recipient.emailAddress; // recipient is a Recipient object
            } else {
                recipientHTML.emailAddress = recipient; // recipient is an email string only
            }

            if (recipient.getsEmailOnlyIfChaptersNotEmpty && Array.isArray(recipient.getsEmailOnlyIfChaptersNotEmpty)) {
                recipient.getsEmailOnlyIfChaptersNotEmpty.forEach(chapter => {
                    if (chapter.html) {
                        recipientHTML.sendEmail = true;
                    }
                })
            } else {
                recipientHTML.sendEmail = true;
            }

            let chs = {};

            if (recipient.canOnlySeeChapters && Array.isArray(recipient.canOnlySeeChapters)) {
                chs = recipient.canOnlySeeChapters;
            } else {
                chs = this.chapters;
            }

            Object.values(chs).forEach(chapter => {
                if (chapter.html) {
                    if (chapter.hasOwnProperty("count")) {
                        if (chapter.count > 0) {
                            recipientHTML.subject += ` | [${chapter.name}]: ${chapter.count} Time: ${new Date().toLocaleString()}`;
                            recipientHTML.html += `<h2><font color="${chapter.color}">${chapter.name}: ${chapter.count}</font></h2>`;
                        }
                    } else {
                        recipientHTML.html += `<h2><font color="${chapter.color}">${chapter.name}</font></h2>`;
                    }
                    recipientHTML.html += chapter.html;
                }
            })
            recipientHTMLs.push(recipientHTML);
        })

        this._mailSender(recipientHTMLs, null, errors => {
            callback(errors);
        })
    }

    /**
     * @private
     */
    _mailSender(recipientHTMLs, errors, callback) {
        if (!errors) {
            errors = {};
        }
        if (recipientHTMLs.length > 0) {
            let recipientHTML = recipientHTMLs[0];
            console.log(recipientHTML);
            if (recipientHTML.sendEmail) {
                // let message = {
                //     text: "Please use an email client, which is able to display HTML!",
                //     subject: recipientHTML.subject,
                //     from: this.mailAlias,
                //     to: recipientHTML.emailAddress,
                //     attachment: [
                //         { data: `<html><h2>${recipientHTML.subject}</h2><div>${recipientHTML.html}</div></html>`, alternative: true }
                //     ]
                // }

                let message = {
                    to: recipientHTML.emailAddress, // Change to your recipient
                    from: this.mailAlias, // Change to your verified sender
                    subject: recipientHTML.subject,
                    //text: "Please use an email client, which is able to display HTML!",
                    html: `<html><h2>${recipientHTML.subject}</h2><div>${recipientHTML.html}</div></html>`,
                };

                // this.mailClient.send(message, (err, message) => {
                //     if (err) {
                //         errors[recipientHTML.emailAddress] = err;
                //     }
                //     recipientHTMLs.shift();
                //     this._mailSender(recipientHTMLs, errors, callback);
                // })
                this.mailClient
                    .send(message)
                    .then(() => {
                        console.log('Email sent')
                        recipientHTMLs.shift();
                        this._mailSender(recipientHTMLs, errors, callback);                        
                    })
                    .catch((error) => {
                        console.log("Email not sent");
                        console.error("Email not sent", error.message);

                        errors[recipientHTML.emailAddress] = error;

                        recipientHTMLs.shift();
                        this._mailSender(recipientHTMLs, errors, callback);

                    });                
            } else {
                recipientHTMLs.shift();
                this._mailSender(recipientHTMLs, errors, callback);
            }
        } else {
            if (Object.keys(errors).length > 0) {
                callback(errors);
            } else {
                callback();
            }
        }
    }

    /**
     * Convert array of JS Objects to HTML Table
     * @param {*} array Array of Objects
     */
    convertObjectArrayToHTMLTable(array) {
        if (Array.isArray(array)) {
            let html = "";
            for (let i = 0; i < array.length; i++) {
                html += this.convertObjectToHTMLTable(array[i]);
            }
            return html;
        }
    }

    /**
     * Convert JS Object to HTML Table
     * @param {Object} obj Object
     */
    convertObjectToHTMLTable(obj) {
        console.log("obj",obj);
        if (obj && typeof (obj) === 'object') {
            let keys = Object.keys(obj);
            if (keys.length > 0) {
                // https://stackoverflow.com/questions/17684201/create-html-table-from-javascript-object
                let html = '<table style="border: 1px solid #ddd; border-collapse: collapse;">';
                for (let i = 0; i < keys.length; i++) {
                    let item = obj[keys[i]];
                    let value = (typeof (item) === 'object') ? this.convertObjectToHTMLTable(item) : item.toString();
                    html += '<tr style="border: 1px solid grey;">';
                    html += '<td style="border: 1px solid grey; padding: 5px;">' + keys[i] + '</td>';
                    html += '<td style="border: 1px solid grey; padding: 5px;">' + value + '</td>';
                    html += '</tr>';
                }
                html += '</table>';
                return html;
            } else {
                return "";
            }
        } else {
            return String(obj);
        }
    }
}

class Recipient {
    /**
     * A single recipient object
     * @constructor
     * @param {string} emailAddress
     * @param {Chapter[]} [getsEmailOnlyIfChaptersNotEmpty] (optional) array of chapters e.g. [Error], the recipient will get the email only if there is at least 1 logged error
     * @param {Chapter[]} [canOnlySeeChapters] (optional) array of chapters e.g. [Summary,Error], the recipient can only see the summary and the logged errors
     */
    constructor(emailAddress, getsEmailOnlyIfChaptersNotEmpty, canOnlySeeChapters) {
        this.emailAddress = emailAddress;
        this.getsEmailOnlyIfChaptersNotEmpty = getsEmailOnlyIfChaptersNotEmpty;
        this.canOnlySeeChapters = canOnlySeeChapters;
    }
}

class Chapter {
    /**
     * A single chapter object
     * @param {string} name chapters name e.g. "Summary"
     * @param {boolean} [hasCount=false] (optional, default is false) set to true if you want to count how often you added content to the chapter (good for errors or warnings)
     * @param {string} [color] (optional, default is "black") use colors to colorize headlines (you can use hex, rgb, rgba, color codes etc. but it is **important** that the email client can display the color correctly)
     */
    constructor(name, hasCount, color) {
        this.name = name;
        this.html = "";
        this.color = color;
        if (hasCount) {
            this.count = 0;
        }
        if (color) {
            this.color = color;
        } else {
            this.color = "black";
        }

        /**
         * Add content to chapter
         * @param {String} headline can also be null
         * @param {String} contentHTML
         */
        this.add = function(headline, contentHTML){
            this.html += `${headline ? `<h4><font color="${this.color}">${headline}</font></h4>` : "<br/>"}<span>${contentHTML}</span>`;
            if (this.hasOwnProperty("count") && headline) {
                this.count++;
            }
        }

        /**
         * Reset specific chapter
         */
        this.reset = function(){
            this.html = "";
            if (this.hasOwnProperty("count")) {
                this.count = 0;
            }
        }
    }
}

let StandardChapters = {
    Summary: new Chapter("Summary", false),
    Errors: new Chapter("Errors", true, "red"),
    Warnings: new Chapter("Warnings", true, "orange"),
    Logs: new Chapter("Logs", false, "limegreen")
};

let instance = new Mailer();

module.exports.logmailer = instance;
module.exports.Recipient = Recipient;
module.exports.Chapter = Chapter;
module.exports.StandardChapters = StandardChapters;