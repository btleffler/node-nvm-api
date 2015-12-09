var NvmApi = require("./index.js"),
	Util = require("util"),
	Moment = require("moment"),
	start = Moment();

NvmApi.load(function () {
	console.log("LOAD TIME:\n", Moment().diff(start) + " ms");

	var starts = {};

	console.log(Util.inspect(NvmApi, {
		"colors": true,
		"depth": 15,
		"showHidden": true
	}));

	console.log();

	starts.install = Moment();
	NvmApi.install("0.12.x", function (err, version) {
		console.log(
			"Time spent on INSTALL:\n",
			Moment().diff(starts.install) + " ms"
		);

		if (err) {
			console.log("Error Installing:\n", err.stack);
		} else {
			console.log("v" + version + " installed.\n");
		}

		starts.uninstall = Moment();
		NvmApi.uninstall(version, function (err) {
			console.log(
				"Time spent on UNINSTALL:\n",
				Moment().diff(start.uninstall) + " ms"
			);

			if (err) {
				console.log("Error Uninstalling:\n", err.stack);
			} else {
				console.log("v" + version + " uninstalled.\n");
			}
		});
	});
});
