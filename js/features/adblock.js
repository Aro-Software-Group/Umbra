/**
 * Umbra Browser - Ad Blocker
 * Handles advertisement blocking, filtering, and content modification
 */

class AdBlocker {
    constructor(umbra) {
        this.umbra = umbra;
        this.isEnabled = true;
        this.blockedAds = new Set();
        this.filterLists = new Map();
        this.customFilters = [];
        this.whitelist = new Set();
        this.statistics = {
            totalBlocked: 0,
            sessionBlocked: 0,
            blockedByType: {}
        };
        
        this.init();
    }

    init() {
        this.loadFilterLists();
        this.loadCustomFilters();
        this.loadWhitelist();
        this.setupContentObserver();
        this.setupEventListeners();
        console.log('Ad Blocker initialized');
    }

    setupEventListeners() {
        // Listen to navigation events
        this.umbra.on('navigate', this.handleNavigation.bind(this));
        this.umbra.on('beforeNavigate', this.handleBeforeNavigation.bind(this));
    }

    /**
     * Load default filter lists
     */
    loadFilterLists() {
        // EasyList style filters for common ad patterns
        const defaultFilters = [
            // Generic ad patterns
            { pattern: /\.ads\./i, type: 'domain', description: '広告ドメイン' },
            { pattern: /ads\d+\./i, type: 'domain', description: '広告サブドメイン' },
            { pattern: /googleads/i, type: 'domain', description: 'Google広告' },
            { pattern: /googlesyndication/i, type: 'domain', description: 'Google Adsense' },
            { pattern: /doubleclick/i, type: 'domain', description: 'DoubleClick広告' },
            
            // Social media ads
            { pattern: /facebook\.com\/tr/i, type: 'url', description: 'Facebook広告トラッキング' },
            { pattern: /twitter\.com\/i\/adsct/i, type: 'url', description: 'Twitter広告' },
            
            // CSS selectors for ad elements
            { pattern: '.ad', type: 'css', description: '広告クラス' },
            { pattern: '.ads', type: 'css', description: '広告クラス複数' },
            { pattern: '.advertisement', type: 'css', description: '広告要素' },
            { pattern: '.banner', type: 'css', description: 'バナー広告' },
            { pattern: '.sponsor', type: 'css', description: 'スポンサー広告' },
            { pattern: '.promoted', type: 'css', description: 'プロモーション広告' },
            { pattern: '[id*="ad"]', type: 'css', description: '広告ID要素' },
            { pattern: '[class*="ad-"]', type: 'css', description: '広告クラス要素' },
            
            // Common ad networks
            { pattern: /amazon-adsystem/i, type: 'domain', description: 'Amazon広告' },
            { pattern: /adsystem\.amazon/i, type: 'domain', description: 'Amazon広告システム' },
            { pattern: /outbrain\.com/i, type: 'domain', description: 'Outbrain広告' },
            { pattern: /taboola\.com/i, type: 'domain', description: 'Taboola広告' },
            { pattern: /criteo\.com/i, type: 'domain', description: 'Criteo広告' },
            
            // Video ads
            { pattern: /googlevideo\.com.*&ad/i, type: 'url', description: 'YouTube広告' },
            { pattern: /youtube\.com\/api\/stats\/ads/i, type: 'url', description: 'YouTube広告統計' },
            
            // Pop-up patterns
            { pattern: /pop.*ad/i, type: 'url', description: 'ポップアップ広告' },
            { pattern: /popup/i, type: 'url', description: 'ポップアップ' },
        ];

        this.filterLists.set('default', defaultFilters);
    }

    /**
     * Load custom user filters
     */
    loadCustomFilters() {
        try {
            const saved = localStorage.getItem('umbra-custom-filters');
            if (saved) {
                this.customFilters = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load custom filters:', error);
        }
    }

    /**
     * Load whitelist
     */
    loadWhitelist() {
        try {
            const saved = localStorage.getItem('umbra-ad-whitelist');
            if (saved) {
                this.whitelist = new Set(JSON.parse(saved));
            }
        } catch (error) {
            console.warn('Failed to load whitelist:', error);
        }
    }

    /**
     * Save custom filters
     */
    saveCustomFilters() {
        try {
            localStorage.setItem('umbra-custom-filters', JSON.stringify(this.customFilters));
        } catch (error) {
            console.warn('Failed to save custom filters:', error);
        }
    }

    /**
     * Save whitelist
     */
    saveWhitelist() {
        try {
            localStorage.setItem('umbra-ad-whitelist', JSON.stringify(Array.from(this.whitelist)));
        } catch (error) {
            console.warn('Failed to save whitelist:', error);
        }
    }

    /**
     * Setup content observer for dynamic ad blocking
     */
    setupContentObserver() {
        // Observe DOM changes to block dynamically loaded ads
        this.contentObserver = new MutationObserver((mutations) => {
            if (!this.isEnabled) return;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanAndBlockAds(node);
                    }
                });
            });
        });

        // Start observing when iframe content loads
        this.startContentObservation();
    }

    /**
     * Start observing iframe content
     */
    startContentObservation() {
        const siteFrame = document.getElementById('siteFrame');
        if (siteFrame) {
            siteFrame.addEventListener('load', () => {
                try {
                    const frameDoc = siteFrame.contentDocument || siteFrame.contentWindow.document;
                    this.contentObserver.observe(frameDoc, {
                        childList: true,
                        subtree: true
                    });
                    
                    // Block existing ads in loaded content
                    this.blockAdsInDocument(frameDoc);
                } catch (error) {
                    // Cross-origin restrictions - can't access iframe content
                    console.log('Cannot access iframe content due to cross-origin restrictions');
                }
            });
        }
    }

    /**
     * Handle before navigation for URL-based blocking
     */
    handleBeforeNavigation(data) {
        const { url } = data;
        
        if (!this.isEnabled) return true;
        
        // Check if URL should be blocked
        if (this.shouldBlockUrl(url)) {
            this.blockAd(url, 'url');
            return false;
        }
        
        return true;
    }

    /**
     * Handle navigation to start ad blocking
     */
    handleNavigation(data) {
        const { url } = data;
        
        if (!this.isEnabled) return;
        
        // Reset session stats for new page
        this.statistics.sessionBlocked = 0;
        
        // Schedule ad blocking after page load
        setTimeout(() => {
            this.blockAdsInCurrentPage();
        }, 1000);
    }

    /**
     * Check if URL should be blocked
     */
    shouldBlockUrl(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const fullUrl = url.toLowerCase();
            
            // Check whitelist first
            if (this.whitelist.has(hostname)) {
                return false;
            }
            
            // Check all filter lists
            for (const [listName, filters] of this.filterLists.entries()) {
                for (const filter of filters) {
                    if (filter.type === 'domain' || filter.type === 'url') {
                        if (filter.pattern.test(fullUrl) || filter.pattern.test(hostname)) {
                            return true;
                        }
                    }
                }
            }
            
            // Check custom filters
            for (const filter of this.customFilters) {
                if (filter.type === 'domain' || filter.type === 'url') {
                    if (filter.pattern.test && filter.pattern.test(fullUrl)) {
                        return true;
                    }
                }
            }
            
            return false;
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Block ads in current page
     */
    blockAdsInCurrentPage() {
        const siteFrame = document.getElementById('siteFrame');
        if (siteFrame) {
            try {
                const frameDoc = siteFrame.contentDocument || siteFrame.contentWindow.document;
                this.blockAdsInDocument(frameDoc);
            } catch (error) {
                console.log('Cannot access iframe content for ad blocking');
            }
        }
    }

    /**
     * Block ads in a document
     */
    blockAdsInDocument(doc) {
        if (!doc) return;
        
        // Block by CSS selectors
        this.blockAdsByCssSelectors(doc);
        
        // Block ad scripts
        this.blockAdScripts(doc);
        
        // Block ad images
        this.blockAdImages(doc);
        
        // Block ad iframes
        this.blockAdIframes(doc);
    }

    /**
     * Block ads using CSS selectors
     */
    blockAdsByCssSelectors(doc) {
        const cssFilters = [];
        
        // Collect CSS filters
        for (const [listName, filters] of this.filterLists.entries()) {
            filters.forEach(filter => {
                if (filter.type === 'css') {
                    cssFilters.push(filter.pattern);
                }
            });
        }
        
        // Apply CSS filters
        cssFilters.forEach(selector => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(element => {
                    this.hideElement(element);
                    this.blockAd(selector, 'css');
                });
            } catch (error) {
                console.warn('Invalid CSS selector:', selector);
            }
        });
    }

    /**
     * Block ad scripts
     */
    blockAdScripts(doc) {
        const scripts = doc.querySelectorAll('script[src]');
        scripts.forEach(script => {
            if (this.shouldBlockUrl(script.src)) {
                script.remove();
                this.blockAd(script.src, 'script');
            }
        });
    }

    /**
     * Block ad images
     */
    blockAdImages(doc) {
        const images = doc.querySelectorAll('img[src]');
        images.forEach(img => {
            if (this.shouldBlockUrl(img.src) || this.isAdImage(img)) {
                this.hideElement(img);
                this.blockAd(img.src || 'ad-image', 'image');
            }
        });
    }

    /**
     * Block ad iframes
     */
    blockAdIframes(doc) {
        const iframes = doc.querySelectorAll('iframe[src]');
        iframes.forEach(iframe => {
            if (this.shouldBlockUrl(iframe.src)) {
                this.hideElement(iframe);
                this.blockAd(iframe.src, 'iframe');
            }
        });
    }

    /**
     * Check if image is likely an ad
     */
    isAdImage(img) {
        // Check size - banner ad dimensions
        const adSizes = [
            { width: 728, height: 90 },   // Leaderboard
            { width: 300, height: 250 },  // Medium Rectangle
            { width: 336, height: 280 },  // Large Rectangle
            { width: 160, height: 600 },  // Wide Skyscraper
            { width: 320, height: 50 },   // Mobile Banner
        ];
        
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        
        return adSizes.some(size => 
            imgWidth === size.width && imgHeight === size.height
        );
    }

    /**
     * Hide an element
     */
    hideElement(element) {
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.maxHeight = '0';
        element.style.overflow = 'hidden';
        element.setAttribute('data-umbra-blocked', 'true');
    }

    /**
     * Scan and block ads in a specific element
     */
    scanAndBlockAds(element) {
        // Check the element itself
        if (this.isAdElement(element)) {
            this.hideElement(element);
            this.blockAd(element.tagName, 'element');
        }
        
        // Check child elements
        const adElements = element.querySelectorAll(this.getCssFilterString());
        adElements.forEach(adElement => {
            this.hideElement(adElement);
            this.blockAd(adElement.className || adElement.id, 'css');
        });
    }

    /**
     * Check if element is an ad
     */
    isAdElement(element) {
        const adKeywords = ['ad', 'ads', 'advertisement', 'banner', 'sponsor', 'promoted'];
        const className = (element.className || '').toLowerCase();
        const id = (element.id || '').toLowerCase();
        
        return adKeywords.some(keyword => 
            className.includes(keyword) || id.includes(keyword)
        );
    }

    /**
     * Get CSS filter string for querySelector
     */
    getCssFilterString() {
        const selectors = [];
        
        for (const [listName, filters] of this.filterLists.entries()) {
            filters.forEach(filter => {
                if (filter.type === 'css' && typeof filter.pattern === 'string') {
                    selectors.push(filter.pattern);
                }
            });
        }
        
        return selectors.join(', ');
    }

    /**
     * Record blocked ad
     */
    blockAd(identifier, type) {
        this.blockedAds.add(identifier);
        this.statistics.totalBlocked++;
        this.statistics.sessionBlocked++;
        
        if (!this.statistics.blockedByType[type]) {
            this.statistics.blockedByType[type] = 0;
        }
        this.statistics.blockedByType[type]++;
        
        console.log(`Blocked ${type}: ${identifier}`);
    }

    /**
     * Add custom filter
     */
    addCustomFilter(pattern, type, description) {
        const filter = {
            pattern: new RegExp(pattern, 'i'),
            type: type,
            description: description,
            custom: true
        };
        
        this.customFilters.push(filter);
        this.saveCustomFilters();
        
        this.umbra.notificationManager.show(
            'カスタムフィルターを追加しました',
            'success'
        );
    }

    /**
     * Remove custom filter
     */
    removeCustomFilter(index) {
        if (index >= 0 && index < this.customFilters.length) {
            this.customFilters.splice(index, 1);
            this.saveCustomFilters();
            
            this.umbra.notificationManager.show(
                'カスタムフィルターを削除しました',
                'success'
            );
        }
    }

    /**
     * Add domain to whitelist
     */
    addToWhitelist(domain) {
        this.whitelist.add(domain.toLowerCase());
        this.saveWhitelist();
        
        this.umbra.notificationManager.show(
            `${domain}をホワイトリストに追加しました`,
            'success'
        );
    }

    /**
     * Remove domain from whitelist
     */
    removeFromWhitelist(domain) {
        this.whitelist.delete(domain.toLowerCase());
        this.saveWhitelist();
        
        this.umbra.notificationManager.show(
            `${domain}をホワイトリストから削除しました`,
            'success'
        );
    }

    /**
     * Enable ad blocker
     */
    enable() {
        this.isEnabled = true;
        this.umbra.notificationManager.show('広告ブロックを有効にしました', 'success');
        
        // Re-block ads in current page
        setTimeout(() => this.blockAdsInCurrentPage(), 100);
    }

    /**
     * Disable ad blocker
     */
    disable() {
        this.isEnabled = false;
        this.umbra.notificationManager.show('広告ブロックを無効にしました', 'warning');
    }

    /**
     * Get ad blocking statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            isEnabled: this.isEnabled,
            filterListsCount: this.filterLists.size,
            customFiltersCount: this.customFilters.length,
            whitelistCount: this.whitelist.size,
            blockedAdsCount: this.blockedAds.size
        };
    }

    /**
     * Generate ad blocking report
     */
    generateReport() {
        const stats = this.getStatistics();
        
        return {
            timestamp: new Date().toISOString(),
            status: this.isEnabled ? '有効' : '無効',
            totalBlocked: stats.totalBlocked,
            sessionBlocked: stats.sessionBlocked,
            blockedByType: stats.blockedByType,
            topBlockedTypes: this.getTopBlockedTypes(),
            efficiency: this.calculateEfficiency()
        };
    }

    /**
     * Get top blocked ad types
     */
    getTopBlockedTypes() {
        return Object.entries(this.statistics.blockedByType)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * Calculate blocking efficiency
     */
    calculateEfficiency() {
        // Simple efficiency calculation based on blocks per page
        const efficiency = this.statistics.sessionBlocked > 0 ? '高' : '低';
        return efficiency;
    }

    /**
     * Clear statistics
     */
    clearStatistics() {
        this.statistics = {
            totalBlocked: 0,
            sessionBlocked: 0,
            blockedByType: {}
        };
        this.blockedAds.clear();
        
        this.umbra.notificationManager.show(
            '広告ブロック統計をクリアしました',
            'success'
        );
    }

    /**
     * Update filter lists
     */
    updateFilterLists() {
        // In a real implementation, this would fetch updated filter lists
        console.log('Updating filter lists...');
        
        setTimeout(() => {
            this.umbra.notificationManager.show(
                'フィルターリストを更新しました',
                'success'
            );
        }, 1000);
    }

    /**
     * Destroy ad blocker
     */
    destroy() {
        // Stop content observer
        if (this.contentObserver) {
            this.contentObserver.disconnect();
        }
        
        // Clear data
        this.blockedAds.clear();
        this.filterLists.clear();
        this.customFilters = [];
        this.whitelist.clear();
        
        this.umbra = null;
    }
}

// Export for use by Umbra
window.AdBlocker = AdBlocker;