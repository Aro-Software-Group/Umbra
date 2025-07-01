/**
 * Umbra Browser - Storage Manager
 * Handles data persistence, caching, and storage management
 */

class StorageManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.storageKey = 'umbra-browser';
        this.compressionEnabled = true;
        this.encryptionEnabled = false;
        this.cache = new Map();
        this.quotaInfo = null;
        
        this.init();
    }

    init() {
        this.checkStorageQuota();
        this.setupStorageEventListeners();
        this.cleanupExpiredData();
        console.log('Storage Manager initialized');
    }

    /**
     * Setup storage event listeners
     */
    setupStorageEventListeners() {
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.storageKey)) {
                this.handleStorageChange(e);
            }
        });

        // Listen for quota exceeded errors
        window.addEventListener('error', (e) => {
            if (e.message && e.message.includes('QuotaExceededError')) {
                this.handleQuotaExceeded();
            }
        });
    }

    /**
     * Check storage quota
     */
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                this.quotaInfo = await navigator.storage.estimate();
                const usedMB = (this.quotaInfo.usage / 1024 / 1024).toFixed(2);
                const quotaMB = (this.quotaInfo.quota / 1024 / 1024).toFixed(2);
                
                console.log(`Storage: ${usedMB}MB used of ${quotaMB}MB quota`);
                
                // Warn if storage is getting full
                if (this.quotaInfo.usage / this.quotaInfo.quota > 0.8) {
                    this.umbra.notificationManager.warning(
                        'ストレージ容量が不足しています。古いデータを削除することを検討してください。'
                    );
                }
                
                return this.quotaInfo;
            } catch (error) {
                console.warn('Could not check storage quota:', error);
            }
        }
        return null;
    }

    /**
     * Handle storage changes from other tabs
     */
    handleStorageChange(event) {
        console.log('Storage changed:', event.key, event.newValue);
        
        // Sync settings if they changed in another tab
        if (event.key === `${this.storageKey}-settings`) {
            try {
                const newSettings = JSON.parse(event.newValue);
                this.umbra.settings = { ...this.umbra.settings, ...newSettings };
                this.umbra.emit('settingsChanged', newSettings);
            } catch (error) {
                console.warn('Failed to sync settings:', error);
            }
        }
    }

    /**
     * Handle quota exceeded error
     */
    handleQuotaExceeded() {
        console.warn('Storage quota exceeded, cleaning up old data');
        
        this.umbra.notificationManager.warning(
            'ストレージ容量が不足しました。古いデータを自動削除します。'
        );
        
        // Clean up old data
        this.cleanupOldData();
    }

    /**
     * Store data with optional compression and encryption
     */
    async store(key, data, options = {}) {
        try {
            const fullKey = `${this.storageKey}-${key}`;
            let processedData = {
                value: data,
                timestamp: Date.now(),
                version: '1.0',
                compressed: false,
                encrypted: false,
                expires: options.expires ? Date.now() + options.expires : null
            };

            // Compress data if enabled and data is large
            if (this.compressionEnabled && this.shouldCompress(data)) {
                processedData.value = await this.compressData(data);
                processedData.compressed = true;
            }

            // Encrypt data if enabled
            if (this.encryptionEnabled || options.encrypt) {
                processedData.value = await this.encryptData(processedData.value);
                processedData.encrypted = true;
            }

            const serializedData = JSON.stringify(processedData);
            
            // Try localStorage first
            try {
                localStorage.setItem(fullKey, serializedData);
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    // Try to free up space and retry
                    await this.freeUpSpace();
                    localStorage.setItem(fullKey, serializedData);
                } else {
                    throw error;
                }
            }

            // Update cache
            this.cache.set(key, processedData);
            
            return true;
        } catch (error) {
            console.error('Failed to store data:', error);
            return false;
        }
    }

    /**
     * Retrieve data with automatic decompression and decryption
     */
    async retrieve(key, defaultValue = null) {
        try {
            const fullKey = `${this.storageKey}-${key}`;
            
            // Check cache first
            if (this.cache.has(key)) {
                const cached = this.cache.get(key);
                if (!this.isExpired(cached)) {
                    return await this.processRetrievedData(cached);
                } else {
                    this.cache.delete(key);
                }
            }

            // Get from localStorage
            const stored = localStorage.getItem(fullKey);
            if (!stored) {
                return defaultValue;
            }

            const parsedData = JSON.parse(stored);
            
            // Check if expired
            if (this.isExpired(parsedData)) {
                localStorage.removeItem(fullKey);
                return defaultValue;
            }

            // Update cache
            this.cache.set(key, parsedData);
            
            return await this.processRetrievedData(parsedData);
        } catch (error) {
            console.error('Failed to retrieve data:', error);
            return defaultValue;
        }
    }

    /**
     * Process retrieved data (decompress, decrypt)
     */
    async processRetrievedData(data) {
        let value = data.value;

        // Decrypt if needed
        if (data.encrypted) {
            value = await this.decryptData(value);
        }

        // Decompress if needed
        if (data.compressed) {
            value = await this.decompressData(value);
        }

        return value;
    }

    /**
     * Check if data is expired
     */
    isExpired(data) {
        return data.expires && Date.now() > data.expires;
    }

    /**
     * Remove data
     */
    remove(key) {
        try {
            const fullKey = `${this.storageKey}-${key}`;
            localStorage.removeItem(fullKey);
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to remove data:', error);
            return false;
        }
    }

    /**
     * Clear all Umbra data
     */
    clear() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.storageKey)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            this.cache.clear();
            
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    }

    /**
     * Get all stored keys
     */
    getKeys() {
        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${this.storageKey}-`)) {
                    keys.push(key.substring(this.storageKey.length + 1));
                }
            }
        } catch (error) {
            console.error('Failed to get keys:', error);
        }
        return keys;
    }

    /**
     * Check if data should be compressed
     */
    shouldCompress(data) {
        const serialized = JSON.stringify(data);
        return serialized.length > 1024; // Compress if larger than 1KB
    }

    /**
     * Compress data using simple LZ-string-like compression
     */
    async compressData(data) {
        try {
            const serialized = JSON.stringify(data);
            
            // Simple compression using deflate if available
            if ('CompressionStream' in window) {
                const stream = new CompressionStream('deflate');
                const writer = stream.writable.getWriter();
                const reader = stream.readable.getReader();
                
                writer.write(new TextEncoder().encode(serialized));
                writer.close();
                
                const chunks = [];
                let done = false;
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    if (value) chunks.push(value);
                }
                
                return Array.from(new Uint8Array(chunks.reduce((acc, chunk) => {
                    const merged = new Uint8Array(acc.length + chunk.length);
                    merged.set(acc);
                    merged.set(chunk, acc.length);
                    return merged;
                }, new Uint8Array())));
            }
            
            // Fallback: simple string compression
            return this.simpleCompress(serialized);
        } catch (error) {
            console.warn('Compression failed, storing uncompressed:', error);
            return data;
        }
    }

    /**
     * Decompress data
     */
    async decompressData(compressedData) {
        try {
            // If it's an array, it was compressed with deflate
            if (Array.isArray(compressedData)) {
                if ('DecompressionStream' in window) {
                    const stream = new DecompressionStream('deflate');
                    const writer = stream.writable.getWriter();
                    const reader = stream.readable.getReader();
                    
                    writer.write(new Uint8Array(compressedData));
                    writer.close();
                    
                    const chunks = [];
                    let done = false;
                    while (!done) {
                        const { value, done: readerDone } = await reader.read();
                        done = readerDone;
                        if (value) chunks.push(value);
                    }
                    
                    const decompressed = new TextDecoder().decode(
                        chunks.reduce((acc, chunk) => {
                            const merged = new Uint8Array(acc.length + chunk.length);
                            merged.set(acc);
                            merged.set(chunk, acc.length);
                            return merged;
                        }, new Uint8Array())
                    );
                    
                    return JSON.parse(decompressed);
                }
            }
            
            // Fallback: simple decompression
            return JSON.parse(this.simpleDecompress(compressedData));
        } catch (error) {
            console.warn('Decompression failed:', error);
            return compressedData;
        }
    }

    /**
     * Simple compression algorithm
     */
    simpleCompress(str) {
        const dict = {};
        const data = str.split('');
        const out = [];
        let phrase = data[0];
        let code = 256;
        
        for (let i = 1; i < data.length; i++) {
            const current = data[i];
            const temp = phrase + current;
            
            if (dict[temp]) {
                phrase = temp;
            } else {
                out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                dict[temp] = code++;
                phrase = current;
            }
        }
        
        out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
        return out;
    }

    /**
     * Simple decompression algorithm
     */
    simpleDecompress(compressed) {
        const dict = {};
        const data = compressed;
        let code = 256;
        let current = String.fromCharCode(data[0]);
        let result = current;
        
        for (let i = 1; i < data.length; i++) {
            const entry = data[i];
            let phrase;
            
            if (dict[entry]) {
                phrase = dict[entry];
            } else if (entry === code) {
                phrase = current + current.charAt(0);
            } else {
                phrase = String.fromCharCode(entry);
            }
            
            result += phrase;
            dict[code++] = current + phrase.charAt(0);
            current = phrase;
        }
        
        return result;
    }

    /**
     * Encrypt data (placeholder - real implementation would use Web Crypto API)
     */
    async encryptData(data) {
        // Simple XOR encryption for demonstration
        // In production, use Web Crypto API with proper encryption
        const key = 'umbra-secret-key';
        const encrypted = [];
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        
        for (let i = 0; i < dataStr.length; i++) {
            encrypted.push(dataStr.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return encrypted;
    }

    /**
     * Decrypt data
     */
    async decryptData(encryptedData) {
        const key = 'umbra-secret-key';
        let decrypted = '';
        
        for (let i = 0; i < encryptedData.length; i++) {
            decrypted += String.fromCharCode(encryptedData[i] ^ key.charCodeAt(i % key.length));
        }
        
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }

    /**
     * Free up storage space
     */
    async freeUpSpace() {
        console.log('Freeing up storage space...');
        
        // Remove expired data first
        await this.cleanupExpiredData();
        
        // Remove oldest cached data
        const keys = this.getKeys();
        const dataWithTimestamps = [];
        
        for (const key of keys) {
            try {
                const fullKey = `${this.storageKey}-${key}`;
                const data = JSON.parse(localStorage.getItem(fullKey));
                if (data && data.timestamp) {
                    dataWithTimestamps.push({ key, timestamp: data.timestamp });
                }
            } catch (error) {
                // Remove corrupted data
                this.remove(key);
            }
        }
        
        // Sort by timestamp and remove oldest 25%
        dataWithTimestamps.sort((a, b) => a.timestamp - b.timestamp);
        const toRemove = Math.ceil(dataWithTimestamps.length * 0.25);
        
        for (let i = 0; i < toRemove; i++) {
            this.remove(dataWithTimestamps[i].key);
        }
        
        // Clear cache
        this.cache.clear();
        
        console.log(`Freed up space by removing ${toRemove} items`);
    }

    /**
     * Clean up expired data
     */
    async cleanupExpiredData() {
        const keys = this.getKeys();
        let removedCount = 0;
        
        for (const key of keys) {
            try {
                const fullKey = `${this.storageKey}-${key}`;
                const stored = localStorage.getItem(fullKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (this.isExpired(data)) {
                        localStorage.removeItem(fullKey);
                        this.cache.delete(key);
                        removedCount++;
                    }
                }
            } catch (error) {
                // Remove corrupted data
                this.remove(key);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} expired items`);
        }
    }

    /**
     * Clean up old data based on age
     */
    cleanupOldData(maxAgeMs = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const cutoff = Date.now() - maxAgeMs;
        const keys = this.getKeys();
        let removedCount = 0;
        
        for (const key of keys) {
            try {
                const fullKey = `${this.storageKey}-${key}`;
                const stored = localStorage.getItem(fullKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (data.timestamp && data.timestamp < cutoff) {
                        localStorage.removeItem(fullKey);
                        this.cache.delete(key);
                        removedCount++;
                    }
                }
            } catch (error) {
                this.remove(key);
                removedCount++;
            }
        }
        
        console.log(`Cleaned up ${removedCount} old items`);
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        const keys = this.getKeys();
        let totalSize = 0;
        let itemCount = 0;
        const breakdown = {};
        
        for (const key of keys) {
            try {
                const fullKey = `${this.storageKey}-${key}`;
                const stored = localStorage.getItem(fullKey);
                if (stored) {
                    const size = new Blob([stored]).size;
                    totalSize += size;
                    itemCount++;
                    
                    const category = key.split('-')[0] || 'other';
                    breakdown[category] = (breakdown[category] || 0) + size;
                }
            } catch (error) {
                // Ignore errors
            }
        }
        
        return {
            totalSize,
            itemCount,
            breakdown,
            quota: this.quotaInfo,
            usage: this.quotaInfo ? this.quotaInfo.usage : null,
            available: this.quotaInfo ? this.quotaInfo.quota - this.quotaInfo.usage : null
        };
    }

    /**
     * Export all data
     */
    async exportData() {
        const keys = this.getKeys();
        const exported = {};
        
        for (const key of keys) {
            const data = await this.retrieve(key);
            if (data !== null) {
                exported[key] = data;
            }
        }
        
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            data: exported
        };
    }

    /**
     * Import data
     */
    async importData(importedData) {
        try {
            if (!importedData.data) {
                throw new Error('Invalid import format');
            }
            
            let importedCount = 0;
            for (const [key, value] of Object.entries(importedData.data)) {
                const success = await this.store(key, value);
                if (success) importedCount++;
            }
            
            this.umbra.notificationManager.success(
                `${importedCount}個のアイテムをインポートしました`
            );
            
            return importedCount;
        } catch (error) {
            this.umbra.notificationManager.error(
                'データのインポートに失敗しました'
            );
            throw error;
        }
    }

    /**
     * Destroy storage manager
     */
    destroy() {
        this.cache.clear();
        this.umbra = null;
    }
}

// Export for use by Umbra
window.StorageManager = StorageManager;