var Async = require("async"),
	Path = require("path"),
	Semver = require("semver");

/*
  'Constants'
 */
var LIB = Path.join(__dirname, "lib"),
	COMMANDS;

if (require("os").type() === "Linux") {
	COMMANDS = require(Path.join(LIB, "linux"));
} else {
	COMMANDS = require(Path.join(LIB, "windows"));
}

/**
 * Programming Interface for NVM
 *  - Supports:
 *    - creationix/nvm for Linux and OS X
 *      https://github.com/creationix/nvm
 *    - coreybutler/nvm-windows for Windows
 *      https://github.com/coreybutler/nvm-windows
 *
 * @method NvmApi
 */
function NvmApi () {
	var self = this;

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

		if (self.__data.hasOwnProperty("callbacks")) {
			self.__data.callbacks.forEach(function (func) {
				func.call(self, self);
			});
		}
	});

	return this;
}

/**
 * Ensure that NvmApi is loaded and ready
 * @method load
 * @param  {Function} cb function (NvmApi) { this === NvmApi // true }
 * @return {NvmApi}      The NvmApi that is potentially not done loading
 */
NvmApi.prototype.load = function loadNvmApi (cb) {
	if (this.initialized) {
		cb.call(this, this);
	} else {
		this.__data.callbacks = this.__data.callbacks || [];
		this.__data.callbacks.push(cb);
	}

	return this;
};

/**
 * Get the current Nodejs version
 * @method current
 * @param  {Boolean}  refresh Whether or not to query NVM again
 * @param  {Function} cb      function (err, currentNodeVersion<String>) {}
 * @return {NvmApi}           The NvmApi instance
 */
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

/**
 * Get the version of NVM
 * @method version
 * @param  {Boolean}  refresh Whether or not to to query NVM again
 * @param  {Function} cb      function (err, currentNvmVersion<String>) {}
 * @return {NvmApi}           The NvmApi instance
 */
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

/**
 * Get the path to a Nodejs version's executable
 * @method which
 * @param  {Boolean}  refresh For the current version, query NVM again?
 * @param  {String}   version Semantic version [range] to get the path for
 * @param  {Function} cb      function (err, pathToNode<String>) {}
 * @return {NvmApi}           The NvmApi instance
 */
NvmApi.prototype.which = function currentNodePath () {
	var self = this,
		refresh, version, cb;

	Array.prototype.slice.call(arguments).forEach(function (param) {
		if (typeof param === "function") {
			cb = param;
			return;
		}

		if (Semver.validRange(param) !== null) {
			version = param;
			return;
		}

		if (typeof param === "boolean") {
			refresh = param;
		}
	});

	if (!this.initialized) {
		return this.load(function (self) {
			self.which(false, version, cb);
		});
	}

	if (refresh || !version) {
		COMMANDS.nodePath(function (err, path) {
			if (path) {
				self.__data.which = path;
			}

			cb(err, path);
		});
	} else if (version) {
		this.installedVersion(version, function (err, version) {
			if (err) {
				return cb(err);
			}

			COMMANDS.nodePath(version, cb);
		});
	} else {
		cb(null, this.__data.which);
	}

	return this;
};

/**
 * Get installed versions of Nodejs
 * @method installed
 * @param  {Boolean}  refresh Whether or not to query NVM again
 * @param  {Function} cb      function (err, versions<List<String>>) {}
 * @return {NvmApi}           The NvmApi instance
 */
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

/**
 * Get available versions of Nodejs
 * @method available
 * @param  {Function} cb function (err, availableVersions<List<String>>) {}
 * @return {NvmApi}      The NvmApi instance
 */
NvmApi.prototype.available = function availableNodeVersions (cb) {
	COMMANDS.listAvailable(cb);
};

/**
 * Get the best (highest) installed version for a given range
 * @method installedVersion
 * @param  {String}   range Semantic version range
 * @param  {Function} cb    function (err, version<String>) {}
 * @return {NvmApi}         The NvmApi instance
 */
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

/**
 * Check whether or not a version of Nodejs is
 * installed that satisfies a semantic version [range]
 * @method versionInstalled
 * @param  {String}   range Semantic version [range]
 * @param  {Function} cb    function (err, installed<Boolean>) {}
 * @return {NvmApi}         The NvmApi instance
 */
NvmApi.prototype.versionInstalled = function nodeVersionInstalled (range, cb) {
	this.installedVersion(range, function (err, version) {
		cb(err, typeof version !== "undefined");
	});
};

/**
 * Get the best (highest) available Nodejs
 * version for a given semantic version [range]
 * @method availableVersion
 * @param  {String}   range Semantic version [range]
 * @param  {Function} cb    function (err, version<String>) {}
 * @return {NvmApi}         The NvmApi instance
 */
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

/**
 * Check whether there is a version available of
 * Nodejs that satisfies a given semantic version [range]
 * @method versionAvailable
 * @param  {String}   range Semantic version [range]
 * @param  {Function} cb    function (err, available<Boolean>) {}
 * @return {NvmApi}         The NvmApi instance
 */
NvmApi.prototype.versionAvailable = function nodeVersionAvailable (range, cb) {
	this.availableVersion(range, function (err, version) {
		cb(err, typeof version !== "undefined");
	});
};

/**
 * Install a version of not js that best
 * satisfies the given semantic version [range]
 * @method install
 * @param  {String}   range Semantic version [range]
 * @param  {Function} cb    function (err, installedVersion<String>) {}
 * @return {NvmApi}         The NvmApi instance
 */
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

/**
 * Setup NVM to use a specific Nodejs version
 * @method use
 * @param  {String}   version Semantic version to use
 * @param  {Function} cb      function (err) {}
 * @return {NvmApi}           The NvmApi instance
 */
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

/**
 * Uninstall a specific version of Nodejs
 * @method uninstall
 * @param  {String}   version Semantic version
 * @param  {Function} cb      function (err) {}
 * @return {NvmApi}           The NvmApi instance
 */
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

// Export an instance of NvmApi instead of the constructor
module.exports = new NvmApi();
