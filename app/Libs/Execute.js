//const { spawn } = require('child_process');
const util = require('util');
const asyncExec = util.promisify(require('child_process').exec);

//let nullFunc = () => {};

module.exports = class Execute {

/*	#onmessage;
	#onerror;
	#onclose;
	#preHook;
	#postHook;*/

	constructor(args) {
		if (typeof args === 'string') {
			return Execute.async(args);
		}

/*		let { cmd, options, preHook, onmessage, onerror, onclose, postHook } = args;
		this.cmd = cmd;
		this.options = options;

		this.#onmessage = onmessage || nullFunc;
		this.#onerror = onerror || nullFunc;
		this.#onclose = onclose || nullFunc;
		this.#preHook = preHook || nullFunc;
		this.#postHook = postHook || nullFunc;*/
	}

/*
	preHook() {
		return this.#preHook();
	}

	hook() {
		const cmd = spawn(this.cmd, this.options);

		cmd.stdout.on('data', this.#onmessage);
		cmd.stderr.on('data', this.#onerror);
		cmd.on('close', this.#onclose);
	}

	postHook() {
		return this.#postHook();
	}
*/

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
