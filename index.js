var Async = require("async"),
	Exec = require("child_process").exec,
	Os = require("os"),
	Semver = require("semver");

var WIN_COMMANDS = {},
	LINUX_COMMANDS = {},
	COMMANDS = Os.type() === "Linux" ? LINUX_COMMANDS : WIN_COMMANDS;

function initialize () {
	var self = this;

	// Initialize the NvmApi wrapper
	Async.parallel([
		function getCurrentNodeVersion (cb) {
			Exec("nvm current", function (err, stdout) {
				console.log(arguments);
				cb();
			});
		},

		function getCurrentNVMVersion (cb) {
			cb();
		},

		function getCurrentNodePath (cb) {
			cb();
		},

		function getInstalledNodeVersions (cb) {
			cb();
		}
	], function (err) {
		if (err) {
			console.warn(
				"Error Calling NVM. Make sure it's properly installed and sourced."
			);
		}
	});

	Exec("nvm current", function (err, out) {
		console.log(arguments);
	});

	return this;
}

function NvmApi () {
	this.current = null;
	this.version = null;
	this.which = null;
	this.installed = [];

	return initialize.call(this);
}

module.exports = new NvmApi();
