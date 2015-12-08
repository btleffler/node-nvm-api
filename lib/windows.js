var Exec = require("child_process").exec,
	Path = require("path");

var CONSTANTS = require("./constants");

var commands = {
	"list": function getNodeVersions (cb) {
		Exec("nvm ls", function (err, out) {
			var versions = [];

			if (out) {
				out = out.replace(/[\r\n\t\s]/g, '').trim();

				try {
					versions = Array.prototype.splice.call(CONSTANTS.SEMVER.exec(out) || []);
					versions.current = CONSTANTS.CURRENT_SEMVER.exec(out)[1];
				} catch (e) {
					console.log(out);
					console.log();
					console.log(CONSTANTS.SEMVER);
					console.log(CONSTANTS.SEMVER.exec(out));
					console.log();
					console.log(CONSTANTS.CURRENT_SEMVER);
					console.log(CONSTANTS.CURRENT_SEMVER.exec(out));
					console.log();
					console.log(e.stack);
					process.exit(0);
				}
			}

			cb(err, versions);
		});
	},

	"listAvailable": function getAvailableNodeVersions (cb) {
		Exec("nvm ls available", function (err, out) {
			var versions = [];

			if (out) {
				versions = SEMVER.exec(out).sort();
			}

			cb(err, versions);
		});
	},

	"current": function getCurrentNodeVersion (cb) {
		commands.list(function (err, versions) {
			if (err) {
				return cb(err);
			}

			return cb(null, versions.current);
		});
	},

	"nodePath": function getNodePath (cb) {
		commands.current(function (err, version) {
			if (err) {
				return cb(err);
			}

			Exec("nvm root", function (err, out) {
				if (err) {
					return cb(err);
				}

				cb(null, Path.join(
					out.replace("Current Root: ", '').trim(),
					"v" + version,
					"node.exe"
				));
			});
		});
	},

	"nvmVersion": function getNVMVersion (cb) {
		Exec("nvm v", function (err, out) {
			if (out) {
				out = out.trim();
			}

			cb(err, out);
		});
	}
};

module.exports = commands;
