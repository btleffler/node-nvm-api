var Exec = require("child_process").exec,
	Path = require("path"),
	Semver = require("semver");

var CONSTANTS = require("./constants");

var commands = {
	"list": function getNodeVersions (cb) {
		Exec("nvm ls", function (err, out) {
			var versions = [];

			if (out) {
				versions = out.match(CONSTANTS.SEMVER) || [];
				versions.sort(Semver.rcompare);
				versions.current = CONSTANTS.CURRENT_SEMVER.exec(out);
				CONSTANTS.CURRENT_SEMVER.lastIndex = 0;

				if (versions.current) {
					versions.current = versions.current[1];
				} else {
					delete versions.current;
				}
			}

			cb(err, versions);
		});
	},

	"listAvailable": function getAvailableNodeVersions (cb) {
		Exec("nvm ls available", function (err, out) {
			var versions = [];

			if (out) {
				versions = out.match(CONSTANTS.SEMVER) || [];
				versions.sort(Semver.rcompare);
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

	"nodePath": function getNodePath (version, cb) {
		Exec("nvm root", function (err, out) {
			if (typeof version === "function") {
				cb = version;
				version = false;
			}

			if (err) {
				return cb(err);
			}

			if (version) {
				return commands.list(function (err, versions) {
					if (err) {
						return cb(err);
					}

					if (versions.indexOf(version) === -1) {
						return cb(new RangeError("v" + version + " not installed"));
					}

					cb(null, Path.join(
						out.replace("Current Root: ", '').trim(),
						"v" + version,
						"node.exe"
					));
				});
			}

			commands.current(function (err, version) {
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
	},

	"install": function installNodeVersion (version, cb) {
		Exec("nvm install " + version, function (err, out) {
			if (err) {
				return cb(err);
			}

			if (!out) {
				return cb(new Error("Couldn't install v" + version));
			}

			if (out.indexOf("Installation complete") === -1) {
				out = out.trim().split("\n")[0] || "Couldn't install v" + version;
				return cb(new Error(out));
			}

			cb();
		});
	},

	"use": function useNodeVersion (version, cb) {
		Exec("nvm use " + version, function (err, out) {
			if (err) {
				return cb(err);
			}

			if (!out) {
				return cb(new Error("Couldn't use v" + version));
			}

			if (out.indexOf("not installed") !== -1) {
				return cb(new Error(out));
			}

			cb();
		});
	},

	"uninstall": function uninstallNodeVersion (version, cb) {
		Exec("nvm uninstall " + version, function (err, out) {
			if (err) {
				return cb(err);
			}

			if (!out) {
				return cb(new Error("Couldn't uninistall v" + version));
			}

			if (out.indexOf("... done") === -1) {
				out = out.trim().split(". ")[0] || "Couldn't uninstall v" + version;
				return cb(new Error(out));
			}

			cb();
		});
	}
};

module.exports = commands;
