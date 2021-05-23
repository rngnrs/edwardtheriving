module.exports = class CheckCommand {

	constructor(Application, Locale) {
		this.os = Application.params.os;
		this.Locale = Locale;

		let Wireless = require(`../OSes/${this.os}/Wireless.js`);
		this.Wireless = new Wireless(Application, Locale);
	}

	async run(options) {
		let interfaces = await this.Wireless.listInterfaces();
		if (!interfaces) {
			throw new Error(this.Locale.getMessage('ENOAVAILABLEINTERFACES'));
		}

		process.stdout.write(JSON.stringify(interfaces) + '\n');
	}

};
