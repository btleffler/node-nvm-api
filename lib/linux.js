var Exec = require("child_process").exec,
	Path = require("path");

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

		"nodePath": function getNodePath (cb) {
			cb();
		},

		"nvmVersion": function getNVMVersion (cb) {
			cb();
		}
	};

module.exports = commands;
