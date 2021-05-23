module.exports = class Localizator {

	constructor(locale) {
		this.params = {
			locale,
			fallbackLocale: 'en',
		}
		this.description = this.#loadLocaleJS('descriptions', locale);
		this.messages = this.#loadLocaleJS('messages', locale);
	}

	#loadLocaleJS(fileName, locale = 'en') {
		let l10n;
		try {
			l10n = require(`../Locales/${locale}/${fileName}.js`);
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
			l10n = require(`../Locales/${this.params.fallbackLocale}/${fileName}.js`);
		}
		return l10n;
	}

	getDescription(id) {
		return this.description[id] || this.description.default;
	}

	getMessage(id, ...args) {
		if (!this.messages[id]) {
			return `%${id}%`;
		}
		return typeof this.messages[id] === 'function'
			? this.messages[id](...args)
			: this.messages[id];
	}

};
