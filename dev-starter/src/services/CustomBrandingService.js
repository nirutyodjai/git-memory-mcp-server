const EventEmitter = require('events');

/**
 * @class CustomBrandingService
 * @description Manages custom branding options for enterprise clients, including logos, themes, and domains.
 * 
 * @emits branding-updated - When custom branding settings are updated.
 */
class CustomBrandingService extends EventEmitter {
    constructor() {
        super();
        this.brandingSettings = {
            logoUrl: null,
            theme: 'default',
            customDomain: null,
        };
    }

    /**
     * @description Get the current custom branding settings.
     * @returns {Promise<Object>} The current branding settings.
     */
    async getBrandingSettings() {
        return this.brandingSettings;
    }

    /**
     * @description Update the custom branding settings.
     * @param {Object} newSettings - The new branding settings.
     * @returns {Promise<Object>} The updated branding settings.
     */
    async updateBrandingSettings(newSettings) {
        this.brandingSettings = { ...this.brandingSettings, ...newSettings };
        this.emit('branding-updated', this.brandingSettings);
        console.log('Custom branding settings updated:', this.brandingSettings);
        return this.brandingSettings;
    }

    /**
     * @description Reset the custom branding settings to default.
     * @returns {Promise<Object>} The default branding settings.
     */
    async resetBrandingSettings() {
        this.brandingSettings = {
            logoUrl: null,
            theme: 'default',
            customDomain: null,
        };
        this.emit('branding-updated', this.brandingSettings);
        console.log('Custom branding settings reset to default.');
        return this.brandingSettings;
    }
}

module.exports = new CustomBrandingService();