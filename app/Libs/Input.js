module.exports = class Input {

	constructor(argv) {
		this.argv = argv;
	}

	parseOptions() {
		let [node, app, ...options] = this.argv;
		let cmd = options[0] && !options[0].includes('-', 0)
			? options.splice(0, 1)[0]
			: '';
		return {
			cmd,
			options: Input.matchOptions(options)
		};
	}

	static matchOptions(opts) {
		let out = {
			_: []
		};
		for (let i = 0; i < opts.length; i++) {
			let opt = opts[i];
			let key, value;

			if (!/^-{1,2}/.test(opt)) {
				out._.push(opt);
				continue;
			}

			opt = opt.replace(/^-{1,2}/, '');
			if (opt.includes('=')) {
				[key, value] = opt.split('=');
			} else {
				let nextOpt = opts[i + 1];
				if (!nextOpt || nextOpt.includes('-', 0)) {
					out[opt] = true;
					continue;
				}
				[key, value] = [opt, nextOpt];
				i++;
			}
			out[key] = value;
		}
		return out;
	}
};
