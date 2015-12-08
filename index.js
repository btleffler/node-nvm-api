var Async = require("async"),
	EventEmitter = require("events"),
	Path = require("path"),
	Semver = require("semver"),
	Util = require("util");

var LIB = Path.join(__dirname, "lib"),
	COMMANDS;

if (require("os").type() === "Linux") {
	COMMANDS = require(Path.join(LIB, "linux"));
} else {
	COMMANDS = require(Path.join(LIB, "windows"));
}

function initialize () {
	var self = this;

	// Initialize the NvmApi wrapper
	Async.parallel([
		function (cb) {
			COMMANDS.current(function (err, version) {
				if (err) {
					return cb(err);
				}

				self.current = version;
				cb();
			});
		},

		function (cb) {
			COMMANDS.nvmVersion(function (err, version) {
				if (err) {
					return cb(err);
				}

				self.version = version;
				cb();
			});
		},

		function (cb) {
			COMMANDS.nodePath(function (err, path) {
				if (err) {
					return cb(err);
				}

				self.which = path;
				cb();
			});
		},

		function (cb) {
			COMMANDS.list(function (err, versions) {
				if (err) {
					return cb(err);
				}

				if (versions.hasOwnProperty("current")) {
					delete versions.current;
				}

				self.installed = versions;
				cb();
			});
		}
	], function (err) {
		if (err) {
			console.warn(
				"Error Calling NVM. Make sure it's properly installed and sourced."
			);

			console.error(err.stack || err.message || err);
			return;
		}

		this.initialized = true;
		self.emit("ready", self);
	});

	return this;
}

function NvmApi () {
	EventEmitter.call(this);

	this.initialized = false;
	this.current = null;
	this.version = null;
	this.which = null;
	this.installed = [];

	return initialize.call(this);
}

Util.inherits(NvmApi, EventEmitter);

NvmApi.prototype.load = function loadNvmApi (cb) {
	if (this.initialized) {
		cb(this);
	} else {
		this.on("ready", cb);
	}

	return this;
};

module.exports = new NvmApi();
