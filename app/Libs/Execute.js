const { exec, spawn } = require('child_process');
const util = require('util');
const asyncExec = util.promisify(exec);

let nullFunc = () => {};

module.exports = class Execute {

	#onmessage;
	#onerror;
	#timeout;

	constructor({ cmd, options, onmessage, onerror, timeout } = {}) {
		if (typeof arguments[0] === 'string') {
			return Execute.async(arguments[0]);
		}

		let opts = [];
		if (typeof cmd !== 'string') {
			throw new TypeError('cmd must be type of String');
		}
		cmd = cmd.split(' ');
		[cmd, ...opts] = cmd;
		if (typeof options === 'string') {
			options = options.split(' ');
		}
		this.cmd = cmd;
		this.options = [...opts, ...options];

		this.#onmessage = onmessage || nullFunc;
		this.#onerror = onerror || nullFunc;
		this.#timeout = timeout || null;
	}

	#preHook(cmd) {
		console.log('\x1BcEtR:', this.cmd, this.options.join(' '))
		console.log('Press Ctrl-C to stop',
			(this.#timeout
				? `or we will do it after ${this.#timeout} ms`
				: '') + '...');

		let timeout;
		if (this.#timeout) {
			timeout = setTimeout(() => {
				stopProcess();
			}, this.#timeout);
		}

		function stopProcess() {
			clearTimeout(timeout);
			cmd.kill();
			console.log('Stopping the process...');
			process.off('SIGINT', stopProcess);
			return false;
		}

		process.on('SIGINT', stopProcess);
	}

	async run() {
		return new Promise((resolve, reject) => {
			let out = '';
			const cmd = spawn(this.cmd, this.options);
			this.#preHook(cmd);

			cmd.stdout.on('data', data => {
				out += data.toString();
				this.#onmessage(data.toString());
			});
			cmd.stderr.on('data', data => {
				this.#onerror(data.toString());
				return reject(cmd.stderr);
			});
			cmd.on('close', () => {
				return resolve(out);
			});
		});
	}
	/**
	 * @param cmd
	 * @returns {Promise<{stdout, stderr}>}
	 */
	static async async(cmd) {
		let {stdout, stderr} = await asyncExec(cmd);
		stdout = stdout.slice(0, -1); // remove extra \n
		return {stdout, stderr};
	}

	static async configureChecking(cmd) {
		try {
			let checkingFor = await Execute.async(cmd);
			return Execute.failed(checkingFor)
				? 'no'
				: 'yes';
		} catch {
			return 'no';
		}
	}

	static failed({stderr} = {}) {
		return !!stderr.length;
	}

	static satisfies(requirements, prerequisites) {
		return requirements.every(r => prerequisites.includes(r));
	}

};
