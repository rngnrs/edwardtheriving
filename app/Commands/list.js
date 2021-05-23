module.exports = class PixieCommand {

	constructor(Application, Locale) {
		this.os = Application.params.os;
		this.Locale = Locale;

		let Wireless = require(`../OSes/${this.os}/Wireless.js`);
		this.Wireless = new Wireless(Application, Locale);
	}

	async run(options) {
		let [ iface, channel, time ] = options._;

		let networks = await this.Wireless.listNetworks(iface, channel, time);
		if (!networks) {
			throw new Error(this.Locale.getMessage('ENOAVAILABLENETWORKS'));
		}

		process.stdout.write(JSON.stringify(networks) + '\n');
	}

};
