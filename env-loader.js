// env-loader.js - World-class environment variable loading with special character support
// Use this for any value that may contain #, quotes, or other shell-sensitive characters

require('dotenv').config();

/**
 * Get environment variable with safe handling of quotes and special characters.
 * Removes surrounding single/double quotes so .env values like FINDY_API_PASSWORD='pass#word!'
 * are read correctly (otherwise # can be treated as a comment).
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Default if missing
 * @returns {string}
 */
function getEnvVar(key, defaultValue = '') {
    let value = process.env[key];
    if (value === undefined || value === null) {
        return typeof defaultValue === 'number' ? defaultValue : String(defaultValue);
    }
    value = String(value).trim();
    // Remove surrounding quotes so "value" or 'value' don't include quote characters
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
    }
    return value;
}

module.exports = {
    getEnvVar,
    NODE_ENV: getEnvVar('NODE_ENV', 'development'),
    PORT: parseInt(getEnvVar('PORT', '8080'), 10),
    MONGODB_URI: getEnvVar('MONGODB_URI', 'mongodb://localhost:27017'),
    MONGODB_DATABASE: getEnvVar('MONGODB_DATABASE', 'waste_management'),
    FINDY_API_URL: getEnvVar('FINDY_API_URL', 'https://uac.higps.org'),
    FINDY_API_KEY: getEnvVar('FINDY_API_KEY', ''),
    FINDY_SERVER: getEnvVar('FINDY_SERVER', 'findyIoT_serverApi'),
    FINDY_API_USERNAME: getEnvVar('FINDY_API_USERNAME', ''),
    FINDY_API_PASSWORD: getEnvVar('FINDY_API_PASSWORD', ''),
    getFindyConfig() {
        return {
            baseURL: this.FINDY_API_URL,
            apiKey: this.FINDY_API_KEY,
            server: this.FINDY_SERVER,
            username: this.FINDY_API_USERNAME,
            password: this.FINDY_API_PASSWORD
        };
    }
};
