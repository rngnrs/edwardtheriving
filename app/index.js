const Init = require('./Libs/Init.js');
const Input = require('./Libs/Input.js');
const Localizator = require('./Libs/Localizator.js');
const Strategy = require('./Libs/Commander.js');

const Application = new Init(process);
const input = new Input(process.argv);

const Locale = new Localizator(Application.params.locale);

(async () => {
	try {
		let {cmd, options} = input.parseOptions();
		let commandNotFound = Application.checkOptions(Application.commands, cmd, options);
		//console.log(Application.params, cmd, options, commandNotFound);
		if (!commandNotFound) {
			cmd = 'help';
		}

		let strategy = new Strategy({
			cmd, Application, Locale
		});
		await strategy.run(options);
	} catch (e) {
		console.log(e.message);
	}
})();
