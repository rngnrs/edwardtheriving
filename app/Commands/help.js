module.exports = class HelpCommand {

	constructor(Application, Locale) {
		this.Application = Application;
		this.Locale = Locale;
	}

	async run() {
		let {type, release: osVersion, arch, cpus} = require('os');
		console.log(`
  Edward the Riving v1 (node/${this.Application.params.nodeVersion} on ${type()} ${osVersion()} (${arch()}))
  Runs great on ${cpus()[0].model}!
  Baka Solutions, 2021
  
  Usage: node app <command> [options]
  Commands:`);
		for (let command in this.Application.commands) {
			console.log(`    ${command} ${this.Application.commands[command]}`);
			console.log('      ' + (this.Locale.getDescription(command)));
		}
	}

};
