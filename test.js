var NvmApi = require("./index.js"),
	Util = require("util"),
	Moment = require("moment"),
	start = Moment();

NvmApi.load(function () {
	console.log("LOAD TIME:\n", Moment().diff(start) + " ms");

	NvmApi.current(function (err, current) {
		if (err) {
			console.log("Error getting current version:\n", err.stack);
			return;
		}

		NvmApi.install("5.1.x", function (err, version) {
			if (err) {
				console.log("Error installing:\n", err.stack);
				return;
			}

			console.log("Installed " + version + "\n");

			NvmApi.use(version, function (err) {
				if (err) {
					console.log("Error using " + version + ":\n", err.stack);
					return;
				}

				console.log("Using " + version + "\n");

				NvmApi.use(current, function (err) {
					if (err) {
						console.log(
							"Error going back to using " + current + ":\n",
							err.stack
						);

						return;
					}

					console.log("Went back to " + current + "\n");

					NvmApi.uninstall(version, function (err) {
						if (err) {
							console.log("Error uninstalling " + version + ":\n", err.stack);
							return;
						}

						console.log("Uninstalled " + version);
					});
				});
			});
		});
	});
});
