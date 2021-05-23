module.exports = class DisableCommand {

	constructor(Application, Locale) {
		this.os = Application.params.os;
		this.Locale = Locale;

		let Wireless = require(`../OSes/${this.os}/Wireless.js`);
		this.Wireless = new Wireless(Application, Locale);
	}

	async run(options) {
		let [ iface ] = options._;

		let status = await this.Wireless.disableInterface(iface);

		process.stdout.write(JSON.stringify(status) + '\n');
	}

};
