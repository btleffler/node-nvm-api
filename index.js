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

function NvmApi () {
	var self = this;

	EventEmitter.call(this);

	Object.defineProperty(this, "initialized", {
		"value": false,
		"enumerable": false,
		"writable": true
	});

	Object.defineProperty(this, "__data", {
		"value": {},
		"enumerable": false,
		"writable": true
	});

	// Get data for NVM wrapper
	Async.parallel([
		function (cb) {
			COMMANDS.current(function (err, version) {
				if (err) {
					return cb(err);
				}

				self.__data.current = version;
				cb();
			});
		},

		function (cb) {
			COMMANDS.nvmVersion(function (err, version) {
				if (err) {
					return cb(err);
				}

				self.__data.version = version;
				cb();
			});
		},

		function (cb) {
			COMMANDS.nodePath(function (err, path) {
				if (err) {
					return cb(err);
				}

				self.__data.which = path;
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

				self.__data.installed = versions;
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

		self.initialized = true;
		self.emit("ready", self);
	});

	return this;
}

Util.inherits(NvmApi, EventEmitter);

NvmApi.prototype.load = function loadNvmApi (cb) {
	if (this.initialized) {
		cb.call(this, this);
	} else {
		this.on("ready", cb);
	}

	return this;
};

NvmApi.prototype.current = function currentNodeVersion (refresh, cb) {
	var self = this;

	if (typeof refresh === "function") {
		cb = refresh;
		refresh = false;
	}

	if (!this.initialized) {
		return this.load(function (self) {
			self.current(false, cb);
		});
	}

	if (refresh) {
		COMMANDS.current(function (err, currentVersion) {
			if (err) {
				return cb(err);
			}

			if (currentVersion) {
				self.__data.current = currentVersion;
			}

			cb(err, currentVersion);
		});
	} else {
		cb(null, this.__data.current);
	}
};

NvmApi.prototype.version = function currentNvmVersion (refresh, cb) {
	var self = this;

	if (typeof refresh === "function") {
		cb = refresh;
		refresh = false;
	}

	if (!this.initialized) {
		return this.load(function (self) {
			self.version(false, cb);
		});
	}

	if (refresh) {
		COMMANDS.nvmVersion(function (err, version) {
			if (version) {
				self.__data.version = version;
			}

			cb(err, version);
		});
	} else {
		cb(null, this.__data.version);
	}

	return this;
};

NvmApi.prototype.which = function currentNodePath (refresh, cb) {
	var self = this;

	if (typeof refresh === "function") {
		cb = refresh;
		refresh = false;
	}

	if (!this.initialized) {
		return this.load(function (self) {
			self.which(false, cb);
		});
	}

	if (refresh) {
		COMMANDS.nodePath(function (err, path) {
			if (path) {
				self.__data.which = path;
			}

			cb(err, path);
		});
	} else {
		cb(null, this.__data.which);
	}

	return this;
};

NvmApi.prototype.installed = function currentInstalledVersions (refresh, cb) {
	var self = this;

	if (typeof refresh === "function") {
		cb = refresh;
		refresh = false;
	}

	if (!this.initialized) {
		return this.load(function (self) {
			self.installed(false, cb);
		});
	}

	if (refresh) {
		COMMANDS.list(function (err, installed) {
			if (installed) {
				if (installed.hasOwnProperty("current")) {
					delete installed.current;
				}

				self.__data.installed = installed;
			}

			cb(err, installed);
		});
	} else {
		cb(null, this.__data.installed);
	}

	return this;
};

NvmApi.prototype.available = function availableNodeVersions (cb) {
	COMMANDS.listAvailable(cb);
};

NvmApi.prototype.installedVersion = function nodeInstalledVersion (range, cb) {
	var validRange = Semver.validRange(range);

	if (!validRange) {
		return cb(new TypeError("Invalid Version or Version Range: " + range));
	}

	range = validRange;

	this.installed(function (err, installed) {
		var max;

		if (err) {
			return cb(err);
		}

		max = Semver.maxSatisfying(installed || [], range);

		if (!max) {
			return cb(new RangeError(
				"A version satisfying \"" + range + "\" is not installed."
			));
		}

		cb(null, max);
	});
};

NvmApi.prototype.versionInstalled = function nodeVersionInstalled (range, cb) {
	this.installedVersion(range, function (err, version) {
		cb(err, typeof version !== "undefined");
	});
};

NvmApi.prototype.availableVersion = function nodeAvailableVersion (range, cb) {
	var validRange = Semver.validRange(range);

	if (!validRange) {
		return cb(new TypeError("Invalid Version or Version Range: " + range));
	}

	range = validRange;

	this.available(function (err, available) {
		var max;

		if (err) {
			return cb(err);
		}

		max = Semver.maxSatisfying(available || [], range);

		if (!max) {
			return cb(new RangeError(
				"A version satisfying \"" + range + "\" is not available."
			));
		}

		cb(null, max);
	});
};

NvmApi.prototype.versionAvailable = function nodeVersionAvailable (range, cb) {
	this.availableVersion(range, function (err, version) {
		cb(err, typeof version !== "undefined");
	});
};

NvmApi.prototype.install = function installNodeVersion (range, cb) {
	var self = this;

	this.versionInstalled(range, function (err, isInstalled) {
		if (isInstalled) {
			return cb();
		}

		self.availableVersion(range, function (err, version) {
			if (err) {
				return cb(err);
			}

			if (!version) {
				return cb(new RangeError(
					"No version satisfying \"" + range + "\" available"
				));
			}

			COMMANDS.install(version, function (err) {
				if (err) {
					return cb(err);
				}

				self.__data.installed.push(version);
				self.__data.installed.sort(Semver.rcompare);

				cb(null, version);
			});
		});
	});
};

NvmApi.prototype.use = function useNodeVersion (version, cb) {
	var validVersion = Semver.valid(version);

	if (!validVersion) {
		return cb(new Error(version + " is invalid"));
	}

	version = validVersion;

	this.versionInstalled(version, function (err, isInstalled) {
		if (err) {
			return cb(err);
		}

		if (!isInstalled) {
			return cb(new RangeError("v" + version + " is not installed"));
		}

		COMMANDS.use(version, cb);
	});
};

NvmApi.prototype.uninstall = function uninstallNodeVersion (version, cb) {
	var validVersion = Semver.valid(version),
		self = this;

	if (!validVersion) {
		return cb(new Error(version + " is invalid"));
	}

	version = validVersion;

	this.current(function (err, current) {
		if (err) {
			return cb(err);
		}

		if (current === version) {
			return cb(new Error("Cannot uninstall current version"));
		}

		self.versionInstalled(version, function (err, isInstalled) {
			if (err) {
				return cb(err);
			}

			if (!isInstalled) {
				return cb();
			}

			COMMANDS.uninstall(version, function (err) {
				if (err) {
					return cb(err);
				}

				self.installed(true, function () {
					cb(null, version);
				});
			});
		});
	});
};

module.exports = new NvmApi();
