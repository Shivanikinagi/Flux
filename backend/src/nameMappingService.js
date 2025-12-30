const fs = require('fs').promises;
const path = require('path');
const logger = require('./utils/logger');

class NameMappingService {
    constructor() {
        this.mappingFile = path.join(__dirname, '../data/name_mappings.json');
        this.mappings = new Map(); // name -> { phone, address }
        this.phoneToName = new Map(); // phone -> name
        this.phoneToAddress = new Map(); // phone -> address
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.mappingFile);
            try {
                await fs.mkdir(dataDir, { recursive: true });
            } catch (err) {
                // Directory might already exist
            }

            // Load existing mappings
            try {
                const data = await fs.readFile(this.mappingFile, 'utf8');
                const mappings = JSON.parse(data);
                
                for (const [name, info] of Object.entries(mappings)) {
                    this.mappings.set(name.toLowerCase(), info);
                    this.phoneToName.set(info.phone, name);
                    this.phoneToAddress.set(info.phone, info.address);
                }
                
                logger.info(`Loaded ${this.mappings.size} name mappings from storage`);
            } catch (err) {
                // File doesn't exist yet, start with empty mappings
                logger.info('No existing name mappings found, starting fresh');
            }

            this.initialized = true;
        } catch (error) {
            logger.error('Error initializing name mapping service:', error);
            throw error;
        }
    }

    async saveMapping(name, phone, address, privateKey = null) {
        await this.initialize();

        const normalizedName = name.toLowerCase();
        
        // Store the mapping with optional private key
        const mappingData = { phone, address, name };
        if (privateKey) {
            mappingData.privateKey = privateKey;
        }
        
        this.mappings.set(normalizedName, mappingData);
        this.phoneToName.set(phone, name);
        this.phoneToAddress.set(phone, address);

        // Persist to file
        await this.saveMappings();

        logger.info(`Saved mapping: ${name} -> ${phone} -> ${address}`);
    }

    async saveMappings() {
        try {
            const mappingsObject = {};
            for (const [name, info] of this.mappings) {
                mappingsObject[name] = info;
            }
            
            await fs.writeFile(
                this.mappingFile, 
                JSON.stringify(mappingsObject, null, 2),
                'utf8'
            );
        } catch (error) {
            logger.error('Error saving mappings to file:', error);
            throw error;
        }
    }

    async getAddressByName(name) {
        await this.initialize();
        const normalizedName = name.toLowerCase();
        const mapping = this.mappings.get(normalizedName);
        return mapping ? mapping.address : null;
    }

    async getPhoneByName(name) {
        await this.initialize();
        const normalizedName = name.toLowerCase();
        const mapping = this.mappings.get(normalizedName);
        return mapping ? mapping.phone : null;
    }

    async getNameByPhone(phone) {
        await this.initialize();
        return this.phoneToName.get(phone) || null;
    }

    async getAddressByPhone(phone) {
        await this.initialize();
        return this.phoneToAddress.get(phone) || null;
    }

    async getUserInfo(identifier) {
        await this.initialize();
        
        // Try as name first
        const normalizedName = identifier.toLowerCase();
        if (this.mappings.has(normalizedName)) {
            return this.mappings.get(normalizedName);
        }

        // Try as phone
        const name = this.phoneToName.get(identifier);
        if (name) {
            return this.mappings.get(name.toLowerCase());
        }

        return null;
    }

    async getAllMappings() {
        await this.initialize();
        const result = [];
        for (const [name, info] of this.mappings) {
            result.push({ name: info.name, phone: info.phone, address: info.address });
        }
        return result;
    }

    async getPrivateKeyByPhone(phone) {
        await this.initialize();
        const name = this.phoneToName.get(phone);
        if (!name) return null;
        
        const normalizedName = name.toLowerCase();
        const mapping = this.mappings.get(normalizedName);
        return mapping && mapping.privateKey ? mapping.privateKey : null;
    }
}

// Singleton instance
const nameMappingService = new NameMappingService();

module.exports = nameMappingService;
