module.exports = class Command {

	#Strategy;

	constructor({ cmd, Application, Locale} = {}) {
		let Strategy = require(`../Commands/${cmd}.js`);
		this.#Strategy = new Strategy(Application, Locale);
	}

	run(args) {
		return this.#Strategy.run(args);
	}

};
