let email = require("emailjs/email");

/**
 * Mailer to aggregate error or log mails. It's a singleton, so you can get the instance like this: `logMailer.default...`
 *
 * Uses emailjs (https://www.npmjs.com/package/emailjs)
 *
 */
class Mailer {
    constructor() {
        if (!Mailer.instance) {
            this.errorHTML = {
                html: "",
                firstHeadline: "",
                errorCount: 0
            }
            this.logHTML = {
                html: ""
            }
            this.mailClient = null;
        }
        return Mailer.instance;
    }

    /**
     * Create a mail client first
     * @param {string} host
     * @param {string} user
     * @param {string} password
     * @param {boolean} ssl
     */
    configureMailClient(host, user, password, ssl) {
        let mailClient = email.server.connect({
            host: host,
            user: user,
            password: password,
            ssl: ssl
        });
        this.mailClient = mailClient;
    }

    /**
     * Add to error html
     * @param {string} headline can also be null
     * @param {string} contentHTML
     */
    addToErrorHTML(headline, contentHTML) {
        if (this.errorHTML.errorCount === 0) {
            this.errorHTML.firstHeadline = headline;
        }
        this.errorHTML.html += `${headline ? `<h4><font color="red">${headline}</font></h4>` : "<br/>"}<span>${contentHTML}</span>`;
        this.errorHTML.errorCount++;
    }

    /**
     * Add to log html
     * @param {string} headline can also be null
     * @param {string} contentHTML
     */
    addToLogHTML(headline, contentHTML) {
        this.logHTML.html += `${headline ? `<h4>${headline}</h4>` : "<br/>"}<span>${contentHTML}</span>`;
    }

    /**
     * Reset current error html
     */
    resetErrorHTML() {
        this.errorHTML.html = "";
        this.errorHTML.errorCount = 0;
        this.errorHTML.firstHeadline = "";
    }

    /**
     * Reset current log html
     */
    resetLogHTML() {
        this.logHTML.html = "";
    }

    /**
     * Send mail finally
     * @param {string} from your mail alias you want to send from (e.g. "fictive-sender[at]fictive-domain.com")
     * @param {string} to your mail recipients, separated by comma (e.g. "baerbel[at]gmail.com,gudrun[at]gmx.de")
     * @param {string} appName meaningful app name is used in mail subject (e.g. appName [Success]: YourSubject)
     * @param {function} callback returns an error if there was one, otherwise returns null
     */
    sendMail(from, to, appName, callback) {
        from = from.replace(/\[at\]/gm, "@");
        to = to.replace(/\[at\]/gm, "@");

        let subjectDetail = this.errorHTML.errorCount > 0 ? `${this.errorHTML.errorCount} errors` : "Completed without errors";
        let html = this.errorHTML.errorCount > 0 ? `${this.errorHTML.html}<h2>Logs</h2>${this.logHTML.html}` : `${this.logHTML.html}<h2>${this.errorHTML.errorCount} Errors</h2>${this.errorHTML.html}`;

        let message = {
            text: "Please use an email client, which is able to display HTML!",
            subject: `${appName} ${this.errorHTML.errorCount > 0 ? "[ERROR]" : "[SUCCESS]"} ${subjectDetail}`,
            from: from,
            to: to,
            attachment: [
                { data: `<html><h2>${appName}</h2><h4>${subjectDetail}</h4><div>${html}</div></html>`, alternative: true }
            ]
        }

        this.mailClient.send(message, (err, message) => {
            if (err) { callback(err) } else { callback(null); };
        })
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
        if (typeof (obj) === 'object') {
            let keys = Object.keys(obj);
            if (keys.length > 0) {
                // https://stackoverflow.com/questions/17684201/create-html-table-from-javascript-object
                let html = '<table style="border: 1px solid #ddd; border-collapse: collapse;">';
                for (let i = 0; i < keys.length; i++) {
                    let item = obj[keys[i]];
                    let value = (typeof (item) === 'object') ? convertObjectToHTMLTable(item) : item.toString();
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

let instance = new Mailer();

module.exports.default = instance;