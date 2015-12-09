var Exec = require("child_process").exec,
	Path = require("path"),
	Semver = require("semver");

var CONSTANTS = require("./constants");

var commands = {
	"list": function getNodeVersions (cb) {
		cb();
	},

	"listAvailable": function getAvailableNodeVersions (cb) {
		cb();
	},

	"current": function getCurrentNodeVersion (cb) {
		cb();
	},

	"nodePath": function getNodePath (version, cb) {
		cb();
	},

	"nvmVersion": function getNVMVersion (cb) {
		cb();
	},

	"install": function installNodeVersion (version, cb) {
		cb();
	},

	"use": function useNodeVersion (version, cb) {
		cb();
	},

	"uninstall": function uninstallNodeVersion (version, cb) {
		cb();
	}
};

module.exports = commands;
