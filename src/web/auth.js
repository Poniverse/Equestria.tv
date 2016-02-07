/**
 * web/auth.js - Webserver functions for user authentication and registration
 *
 * @author Calvin Montgomery <cyzon@cyzon.us>
 */

var jade = require("jade");
var path = require("path");
var webserver = require("./webserver");
var cookieall = webserver.cookieall;
var sendJade = require("./jade").sendJade;
var Logger = require("../logger");
var $util = require("../utilities");
var db = require("../database");
var Config = require("../config");
var url = require("url");
var OAuth2 = require("oauth").OAuth2;
var crypto = require("crypto");
var session = require("../session");
var csrf = require("./csrf");

var Client = new OAuth2(
    Config.get('poniverse.client_id'),
    Config.get('poniverse.client_secret'),
    'https://poniverse.net/',
    'oauth/authorize',
    'oauth/access_token'
);

var baseUrl = "";
var urlConfigVar = 'full-address';

if (Config.get('poniverse.proxy')) {
    urlConfigVar = 'domain';
}

if (Config.get('https.enabled')) {
    baseUrl = Config.get('https.' + urlConfigVar);
} else {
    baseUrl = Config.get('http.' + urlConfigVar);
}

var redirectUri = baseUrl + "/login/oauth";

function handleLoginOauth(req, res) {
    Client.getOAuthAccessToken(req.query.code, {
        grant_type: "authorization_code",
        redirect_uri: redirectUri
    }, getPoniverseUser);

    var redirect = '/';

    if (typeof req.query.state !== 'undefined') {
        redirect = req.query.state;
    }

    function getPoniverseUser(e, access_token, refresh_token, results) {
        Client.get("https://api.poniverse.net/v1/users/me", access_token, loginPoniverseUser);
    }

    function loginPoniverseUser(e, request, response) {
        if (e) {
            sendJade(res, "login", {
                loggedIn: false,
                loginError: 'Something went wrong with the oauth login'
            });
            return;
        }

        request = JSON.parse(request);

        db.users.searchPoniverse(request.id, function(e, data) {
            if (!data.length) {
                registerPoniverseUser(request);
                return;
            }
            var user = data[0];

            authenticateUser(user);

            res.redirect(redirect);
        });
    }

    function registerPoniverseUser(user) {
        var ip = webserver.ipForRequest(req);
        // User is never going to need this password, we just need something unguessable
        // @link http://stackoverflow.com/questions/8855687/secure-random-token-in-node-js
        var password = crypto.randomBytes(100).toString('hex');

        db.users.register(user.display_name, password, user.email, ip, user.id, function (err, data) {
            if (err) {
                sendJade(res, "register", {
                    registerError: err
                });
            } else {
                Logger.eventlog.log("[register] " + ip + " registered account: " + user.display_name +
                (user.email.length > 0 ? " <" + user.email + ">" : ""));

                authenticateUser({
                    name: user.display_name,
                    password: password
                });

                res.redirect(redirect);
            }
        });
    }

    function authenticateUser(user) {
        // Force Remember Me
        var expiration = new Date("Fri, 31 Dec 9999 23:59:59 GMT");

        session.genSession(user, expiration, function (err, auth) {
            if (err) {
                sendJade(res, "login", {
                    loggedIn: false,
                    loginError: err
                });
                return;
            }

            if (req.hostname.indexOf(Config.get("http.root-domain")) >= 0) {
                // Prevent non-root cookie from screwing things up
                res.clearCookie("auth");
                res.cookie("auth", auth, {
                    domain: Config.get("http.root-domain-dotted"),
                    expires: expiration,
                    httpOnly: true,
                    signed: true
                });
            } else {
                res.cookie("auth", auth, {
                    expires: expiration,
                    httpOnly: true,
                    signed: true
                });
            }
        });
    }
}

/**
 * Processes a login request.  Sets a cookie upon successful authentication
 */
function handleLogin(req, res) {
    csrf.verify(req);

    var name = req.body.name;
    var password = req.body.password;
    var rememberMe = req.body.remember;
    var dest = req.body.dest || req.header("referer") || null;
    dest = dest && dest.match(/login|logout/) ? null : dest;

    if (typeof name !== "string" || typeof password !== "string") {
        res.sendStatus(400);
        return;
    }

    var host = req.hostname;
    if (host.indexOf(Config.get("http.root-domain")) === -1 &&
            Config.get("http.alt-domains").indexOf(host) === -1) {
        Logger.syslog.log("WARNING: Attempted login from non-approved domain " + host);
        return res.sendStatus(403);
    }

    var expiration;
    if (rememberMe) {
        expiration = new Date("Fri, 31 Dec 9999 23:59:59 GMT");
    } else {
        expiration = new Date(Date.now() + 7*24*60*60*1000);
    }

    password = password.substring(0, 100);

    db.users.verifyLogin(name, password, function (err, user) {
        if (err) {
            if (err === "Invalid username/password combination") {
                Logger.eventlog.log("[loginfail] Login failed (bad password): " + name
                                  + "@" + req.realIP);
            }
            sendJade(res, "login", {
                loggedIn: false,
                loginError: err
            });
            return;
        }

        session.genSession(user, expiration, function (err, auth) {
            if (err) {
                sendJade(res, "login", {
                    loggedIn: false,
                    loginError: err
                });
                return;
            }

            if (req.hostname.indexOf(Config.get("http.root-domain")) >= 0) {
                // Prevent non-root cookie from screwing things up
                res.clearCookie("auth");
                res.cookie("auth", auth, {
                    domain: Config.get("http.root-domain-dotted"),
                    expires: expiration,
                    httpOnly: true,
                    signed: true
                });
            } else {
                res.cookie("auth", auth, {
                    expires: expiration,
                    httpOnly: true,
                    signed: true
                });
            }

            if (dest) {
                res.redirect(dest);
            } else {
                res.user = user;
                sendJade(res, "login", {});
            }
        });
    });
}

/**
 * Handles a GET request for /login
 */
function handleLoginPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    var url = Client.getAuthorizeUrl({
        response_type: "code",
        redirect_uri: redirectUri,
        state: req.header("Referrer")
    });

    res.redirect(url);

    return;

    if (req.user) {
        return sendJade(res, "login", {
            wasAlreadyLoggedIn: true
        });
    }

    sendJade(res, "login", {
        redirect: req.query.dest || req.header("referer")
    });
}

/**
 * Handles a request for /logout.  Clears auth cookie
 */
function handleLogout(req, res) {
    csrf.verify(req);

    res.clearCookie("auth");
    req.user = res.user = null;
    // Try to find an appropriate redirect
    var dest = req.body.dest || req.header("referer");
    dest = dest && dest.match(/login|logout|account/) ? null : dest;

    var host = req.hostname;
    if (host.indexOf(Config.get("http.root-domain")) !== -1) {
        res.clearCookie("auth", { domain: Config.get("http.root-domain-dotted") });
    }

    if (dest) {
        res.redirect(dest);
    } else {
        res.redirect('/');
    }
}

/**
 * Handles a GET request for /register
 */
function handleRegisterPage(req, res) {
    if (webserver.redirectHttps(req, res)) {
        return;
    }

    if (req.user) {
        sendJade(res, "register", {});
        return;
    }

    var baseUrl = "";

    if (Config.get('https.enabled')) {
        baseUrl = Config.get('https.full-address');
    } else {
        baseUrl = Config.get('http.full-address');
    }

    res.redirect(Client.getAuthorizeUrl({
        response_type: "code",
        redirect_uri: baseUrl + "/login/oauth"
    }));
    return;

    sendJade(res, "register", {
        registered: false,
        registerError: false
    });
}

/**
 * Processes a registration request.
 */
function handleRegister(req, res) {
    csrf.verify(req);

    var baseUrl = "";

    res.redirect(Client.getAuthorizeUrl({
        response_type: "code",
        redirect_uri: redirectUri
    }));
    return;

    var name = req.body.name;
    var password = req.body.password;
    var email = req.body.email;
    if (typeof email !== "string") {
        email = "";
    }
    var ip = req.realIP;

    if (typeof name !== "string" || typeof password !== "string") {
        res.sendStatus(400);
        return;
    }

    if (name.length === 0) {
        sendJade(res, "register", {
            registerError: "Username must not be empty"
        });
        return;
    }

    if (name.match(Config.get("reserved-names.usernames"))) {
        sendJade(res, "register", {
            registerError: "That username is reserved"
        });
        return;
    }

    if (password.length === 0) {
        sendJade(res, "register", {
            registerError: "Password must not be empty"
        });
        return;
    }

    password = password.substring(0, 100);

    if (email.length > 0 && !$util.isValidEmail(email)) {
        sendJade(res, "register", {
            registerError: "Invalid email address"
        });
        return;
    }

    db.users.register(name, password, email, ip, null, function (err) {
        if (err) {
            sendJade(res, "register", {
                registerError: err
            });
        } else {
            Logger.eventlog.log("[register] " + ip + " registered account: " + name +
                             (email.length > 0 ? " <" + email + ">" : ""));
            sendJade(res, "register", {
                registered: true,
                registerName: name,
                redirect: req.body.redirect
            });
        }
    });
}

module.exports = {
    /**
     * Initializes auth callbacks
     */
    init: function (app) {
        app.get("/login", handleLoginPage);
        app.post("/login", handleLogin);
        app.get("/login/oauth", handleLoginOauth);
        app.get("/logout", handleLogout);
        app.get("/register", handleRegisterPage);
        app.post("/register", handleRegister);
    }
};
