const Execute = require('../../Libs/Execute.js');

module.exports = class LinuxWireless {

	constructor(Application, Locale) {
		this.satisfies = [];
		this.prerequisites = {
			check: ['iw', 'awk'],
			enable: ['sudo', 'nmcli', 'rfkill', 'ip'],
			disable: ['sudo', 'nmcli', 'ip'],
			put: ['sudo', 'iw', 'nmcli', 'systemctl'],
			getFreqs: ['iwlist'],
			list: ['sudo', 'reaver'],

			all: [
				'iw', 'ip', 'iwlist', //'iwconfig', 'ifconfig',
				'awk', //'grep',
				'nmcli', 'rfkill', 'sudo',
				'reaver'
			]
		}

		this.Application = Application;
		this.Locale = Locale;

		this.interfaces = {};
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
				try {
					await Execute.async('nmcli radio wifi on');
				} catch {
					// console.log('NetworkManager is not running.');
				}
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
				try {
					await Execute.async('nmcli radio wifi off');
				} catch {
					console.log('NetworkManager is not running.');
				}
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
			if (Execute.satisfies(['nmcli', 'systemctl'], this.satisfies)) {
				await Execute.async(this.requireSudo(`systemctl stop NetworkManager`));
			}
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
			if (Execute.satisfies(['nmcli', 'systemctl'], this.satisfies)) {
				await Execute.async(this.requireSudo(`systemctl restart NetworkManager`));
			}
			return true;
		} catch (e) {
			console.log(e.message);
			return false;
		}
	}

	async getFrequencies(iface) {
		await this.checkPrerequisites('getFreqs');

		try {
			let output = null;
			this.interfaces[iface] = [];

			if (Execute.satisfies(['iwlist'], this.satisfies)) {
				output = await Execute.async(`iwlist ${iface} freq`);
			}
			if (!output) {
				return [];
			}
			if (output.stdout.match(/Channel [0-9]{2} : 2\.4[0-9]+ GHz/)) {
				this.interfaces[iface].push('2.4');
			}
			if (output.stdout.match(/Channel [0-9]{2,3} : 5\.[0-9]+ GHz/)) {
				this.interfaces[iface].push('5');
			}
			return this.interfaces;
		} catch (e) {
			console.log(e.message);
			return [];
		}
	}

	async supports2GHz(iface) {
		if (!this.interfaces[iface] || !this.interfaces[iface].length) {
			await this.getFrequencies(iface);
		}
		return this.interfaces[iface].includes('2.4');
	}

	async supports5GHz(iface) {
		if (!this.interfaces[iface] || !this.interfaces[iface].length) {
			await this.getFrequencies(iface);
		}
		return this.interfaces[iface].includes('5');
	}

	async listNetworks(iface, channel, timeout = 0) {
		// sudo wash -i $IFACE $fcs | tee /tmp/wash.all
		// cat /tmp/wash.all | grep -E '[A-Fa-f0-9:]{11}' | cat -b
		await this.checkPrerequisites('list');

		try {
			if (Execute.satisfies(['reaver'], this.satisfies)) {
				let opts = ['-a'];
				if (channel) {
					opts.push('c ' + channel)
				} else {
					if (await this.supports2GHz(iface)) {
						opts.push('2');
					}
					if (await this.supports5GHz(iface)) {
						opts.push('5');
					}
				}
				let cmd = this.requireSudo(`wash -i ${iface}`);
				let wash = new Execute({
					cmd,
					options: opts.join(' -'),
					onmessage: (args) => console.log(args.slice(0,-1)),
					onerror: (args) => console.error(args),
					timeout,
				});

				let networks = await wash.run();
				return this.parseWashOutput(networks);
			}
			throw new Error(this.Locale.getMessage('NOPROGRAMTOEXECUTE'));
		} catch (e) {
			console.log(e);
			return [];
		}
	}

	requireSudo(cmd) {
		if (!Execute.satisfies(['sudo'], this.satisfies)) {
			if (this.Application.params.username !== 'root') {
				throw new Error(this.Locale.getMessage('NOSUDO'));
			}
			return cmd;
		}
		if (this.Application.params.username !== 'root') {
			cmd = 'sudo ' + cmd;
		}
		if (!this.sudo) {
			console.log(this.Locale.getMessage('SUDOCHECK', cmd));
		}
		this.sudo = true;
		return cmd;
	}

	parseWashOutput(output) {
		output = output.split('\n');
		output.splice(0, 2);
		output.splice(-1, 1);

		output = output.map(string => {
			let [_, bssid, ch, dbm, wps, lock, vendor, essid] = string.match(
				/^((?:[0-9a-f]{2}:){5}[0-9a-f]{2}) {2,4}([0-9]{1,3}) {1,3}(-[0-9]{1,3}) +([12]\.0)? +(Yes|No)? +([a-z0-9]+)? +(.+)$/i
			);
			return {
				bssid, ch, dbm, wps: wps ?? false, lock: lock ?? false, vendor: vendor ?? false, essid
			};
		})
		return output;
	}

};
