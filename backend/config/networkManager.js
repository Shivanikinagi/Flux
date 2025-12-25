const fs = require('fs');
const path = require('path');
const logger = require('../src/utils/logger');

class NetworkManager {
    constructor() {
        this.configPath = path.join(__dirname, 'networks.json');
        this.config = null;
        this.loadConfig();
    }

    loadConfig() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            this.config = JSON.parse(data);
            logger.info(`Network config loaded. Active: ${this.config.activeNetwork}`);
        } catch (error) {
            logger.error('Error loading network config:', error);
            throw error;
        }
    }

    getActiveNetwork() {
        if (!this.config) {
            throw new Error('Network config not loaded');
        }
        const activeKey = this.config.activeNetwork;
        return {
            key: activeKey,
            ...this.config.networks[activeKey]
        };
    }

    getAllNetworks() {
        if (!this.config) {
            throw new Error('Network config not loaded');
        }
        return Object.entries(this.config.networks).map(([key, network]) => ({
            key,
            ...network
        }));
    }

    getNetworkByKey(key) {
        if (!this.config) {
            throw new Error('Network config not loaded');
        }
        if (!this.config.networks[key]) {
            throw new Error(`Network ${key} not found`);
        }
        return {
            key,
            ...this.config.networks[key]
        };
    }

    switchNetwork(networkKey) {
        if (!this.config.networks[networkKey]) {
            throw new Error(`Network ${networkKey} not found`);
        }

        // Update active network
        this.config.activeNetwork = networkKey;

        // Mark all as inactive
        Object.keys(this.config.networks).forEach(key => {
            this.config.networks[key].active = false;
        });

        // Mark selected as active
        this.config.networks[networkKey].active = true;

        // Save config
        this.saveConfig();

        logger.info(`Switched to network: ${networkKey}`);
        return this.getActiveNetwork();
    }

    saveConfig() {
        try {
            fs.writeFileSync(
                this.configPath, 
                JSON.stringify(this.config, null, 2),
                'utf8'
            );
            logger.info('Network config saved');
        } catch (error) {
            logger.error('Error saving network config:', error);
            throw error;
        }
    }

    getNetworkInfo() {
        const active = this.getActiveNetwork();
        return {
            name: active.name,
            rpcUrl: active.rpcUrl,
            faucetUrl: active.faucetUrl,
            chainId: active.chainId,
            explorerUrl: active.explorerUrl,
            currency: active.currency,
            type: active.type
        };
    }
}

// Singleton instance
const networkManager = new NetworkManager();

module.exports = networkManager;
