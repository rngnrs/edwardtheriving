module.exports = class EnableCommand {

	constructor(Application, Locale) {
		this.os = Application.params.os;
		this.Locale = Locale;

		let Wireless = require(`../OSes/${this.os}/Wireless.js`);
		this.Wireless = new Wireless(Application, Locale);
	}

	async run(options) {
		let [ iface, mode ] = options._;
		let status;

		switch (mode) {
			case "managed":
				status = await this.Wireless.putInManagedMode(iface);
				break;
			case "monitor":
				status = await this.Wireless.putInMonitorMode(iface);
				break;
			default:
				console.log('Think you are want to put the interface to a managed mode...');
				status = await this.Wireless.putInManagedMode(iface);
				//status = await this.Wireless.enableInterface(iface);
				break;
		}

		process.stdout.write(JSON.stringify(status) + '\n');
	}

};
