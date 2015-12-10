var exec = require("child_process").exec,
	Semver = require("semver");

var CONSTANTS = require("./constants"),
	NVM =  process.env.NVM_DIR;

function uniq (arr) {
	var seen = new Set();

	return arr.filter(function(ver) {
		return !seen.has(ver) && seen.add(ver);
	});
}

// Soure NVM every time on Linux
function Exec (command, cb) {
	exec(". " + NVM + "/nvm.sh; " + command, {
		"env": process.env,
		"shell": "/bin/bash"
	}, cb);
}

var commands = {
	"list": function getNodeVersions (cb) {
		Exec("nvm ls", function (err, out) {
			var versions;

			if (err) {
				return cb(err);
			}

			versions = out.match(CONSTANTS.SEMVER) || [];
			versions = uniq(versions);
			versions.sort(Semver.rcompare);
			cb(null, versions);
		});
	},

	"listAvailable": function getAvailableNodeVersions (cb) {
		Exec("nvm ls-remote", function (err, out) {
			var versions;

			if (err) {
				return cb(err);
			}

			versions = out.match(CONSTANTS.SEMVER) || [];
			versions = uniq(versions);
			versions.sort(Semver.rcompare);
			cb(null, versions);
		});
	},

	"current": function getCurrentNodeVersion (cb) {
		Exec("nvm current", function (err, out) {
			if (out) {
				out = out.trim().replace(/^v/, '');
			}

			cb(err, out);
		});
	},

	"nodePath": function getNodePath (version, cb) {
		if (typeof version === "function") {
			cb = version;
			version = false;
		}

		if (version) {
			return Exec("nvm which " + version, function (err, out) {
				if (err) {
					return cb(err);
				}

				if (out.indexOf("N/A") !== -1) {
					return cb(new RangeError(out));
				}

				cb(null, out);
			});
		}

		commands.current(function(err, version) {
			if (err) {
				return cb(err);
			}

			return commands.nodePath(version, cb);
		});
	},

	"nvmVersion": function getNVMVersion (cb) {
		Exec("nvm --version", function (err, out) {
			if (out) {
				out = out.trim().replace(/^v/, '');
			}

			cb(err, out);
		});
	},

	"install": function installNodeVersion (version, cb) {
		commands.current(function (err, current) {
			if (err) {
				return cb(err);
			}

			Exec("nvm install " + version, function (err, out) {
				if (err) {
					return cb(err);
				}

				if (out.indexOf("not found") !== -1) {
					return cb(new RangeError(out));
				}

				commands.use(current, cb);
			});
		});
	},

	"use": function useNodeVersion (version, cb) {
		Exec("nvm use " + version, function (err, out) {
			if (err) {
				return cb(err);
			}

			if (out.indexOf("N/A") !== -1) {
				return cb(new RangeError(out));
			}

			return cb();
		});
	},

	"uninstall": function uninstallNodeVersion (version, cb) {
		Exec("nvm uninstall " + version, function (err, out) {
			if (err) {
				cb(err);
			}

			if (out.indexOf("N/A") !== -1) {
				return cb(new RangeError(out));
			}

			cb();
		});
	}
};

module.exports = commands;
