module.exports = class Init {

	constructor(Process) {
		this.params = {
			locale: Init.detectLocale(),
			fallbackLocale: 'en',

			os: Init.detectOS(),
			nodeVersion: Init.detectNodeVersion(Process),
			username: Init.detectUsername()
		}
		this.commands = require('../commands.js');
	}

	static detectLocale() {
		// TODO: Detect system locale
		// TODO: Accept ENV
		return 'en';
	}

	static detectOS() {
		let {type/*, release: osVersion, arch, cpus*/} = require('os');
		return type();
	}

	static detectUsername() {
		let { userInfo } = require('os');
		return userInfo().username;
	}

	static detectNodeVersion() {
		const { versions: {node: nodeVersion} } = process;
		return nodeVersion;
	}

	checkOptions(commands, cmd, options) {
		let cmdTemplate = commands[cmd];
		if (typeof cmdTemplate === 'undefined') {
			return false;
		}
		// Check required options
		let optionsLength = (cmdTemplate.match(/<.*?>/g) || []).length;
		if (optionsLength && (options._.length < optionsLength)) {
			console.log(`Got ${options._.length } required arguments, expected ${optionsLength}.`);
			console.log(`Usage: ${cmd} ${cmdTemplate}`);
			process.exit(0); // or 1?
		}
		return true;
	}

};
