const Execute = require('../../Libs/Execute.js');

module.exports = class LinuxWireless {

	constructor(Application, Locale) {
		this.satisfies = [];
		this.prerequisites = {
			check: ['iw', 'awk'],
			enable: ['sudo', 'nmcli', 'rfkill', 'ip'],
			disable: ['sudo', 'nmcli', 'ip'],
			put: ['sudo', 'iw'],

			all: [
				'iw', 'ip', //'iwconfig', 'ifconfig',
				'awk', //'grep',
				'nmcli', 'rfkill', 'sudo'
			]
		}

		this.Application = Application;
		this.Locale = Locale;
	}

	async checkPrerequisites(cmd) {
		let reqs = this.prerequisites[cmd] || this.prerequisites.all;
		await this.#check(reqs);
	}

	async #check(reqs) {
		if (!reqs) {
			return true;
		}
		for (let req of reqs) {
			if (this.satisfies.includes(req)) {
				continue;
			}
			let check = 'no';
			switch (req) {
				case "sudo":
					if (this.Application.params.username === 'root') {
						check = 'none needed';
						this.satisfies.push(req);
						break;
					}
				default:
					check = await Execute.configureChecking(`which ${req}`);
					if (check === 'yes') {
						this.satisfies.push(req);
					}
			}
			console.log(` checking for ${req}... ${check}`);
		}
	}

	async listInterfaces() {
		await this.checkPrerequisites('check');

		if (!Execute.satisfies(['iw', 'awk'], this.satisfies)) {
			return process.exit(1);
		}
		// `iwconfig | grep -o "^[a-z0-9]*"`
		let cmd = await Execute.async(`iw dev | awk '$1=="Interface"{print $2}'`);
		if (Execute.failed(cmd)) {
			return null;
		}
		return cmd.stdout.split('\n');
	}

	async enableInterface(iface) {
		await this.checkPrerequisites('enable');

		try {
			if (Execute.satisfies(['rfkill'], this.satisfies)) {
				await Execute.async('rfkill unblock wlan');
			}
			if (Execute.satisfies(['nmcli'], this.satisfies)) {
				await Execute.async('nmcli radio wifi on');
			}
			await Execute.async(this.requireSudo(`ip link set ${iface} up`));
			return true;
		} catch (e) {
			console.log(e.message);
			return false;
		}
	}

	async disableInterface(iface) {
		await this.checkPrerequisites('disable');

		try {
			if (Execute.satisfies(['nmcli'], this.satisfies)) {
				await Execute.async('nmcli radio wifi off');
			}
			await Execute.async(this.requireSudo(`ip link set ${iface} down`));
			return true;
		} catch (e) {
			console.log(e.message);
			return false;
		}
	}

	async putInMonitorMode(iface) {
		await this.checkPrerequisites('put');

		try {
			await this.disableInterface(iface);
			if (Execute.satisfies(['iw'], this.satisfies)) {
				await Execute.async(this.requireSudo(`iw ${iface} set monitor control`));
			}
			await this.enableInterface(iface);
			return true;
		} catch (e) {
			console.log(e.message);
			return false;
		}
	}

	async putInManagedMode(iface) {
		await this.checkPrerequisites('put');

		try {
			await this.disableInterface(iface);
			if (Execute.satisfies(['iw'], this.satisfies)) {
				await Execute.async(this.requireSudo(`iw ${iface} set type managed`));
			}
			await this.enableInterface(iface);
			return true;
		} catch (e) {
			console.log(e.message);
			return false;
		}
	}

	requireSudo(cmd) {
		if (!Execute.satisfies(['sudo'], this.satisfies)) {
			if (this.Application.params.username !== 'root') {
				throw new Error(this.Locale.getMessage('NOSUDO'));
			}
			return cmd;
		}
		cmd = 'sudo ' + cmd;
		if (!this.sudo) {
			console.log(this.Locale.getMessage('SUDOCHECK', cmd));
		}
		this.sudo = true;
		return cmd;
	}

};
