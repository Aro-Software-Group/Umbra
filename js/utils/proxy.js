/**
 * Umbra Browser - Proxy Manager
 * Handles CORS, URL processing, and anonymization
 */

class ProxyManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.proxyServices = new Map();
        this.activeProxy = null;
        this.bypassList = new Set();
        this.cache = new Map();
        this.requestHeaders = new Map();
        
        this.init();
    }

    init() {
        this.setupProxyServices();
        this.setupBypassList();
        this.setupRequestInterception();
        console.log('Proxy Manager initialized');
    }

    /**
     * Setup available proxy services
     */
    setupProxyServices() {
        // CORS Anywhere proxies (for demonstration)
        this.proxyServices.set('allorigins', {
            name: 'All Origins',
            url: 'https://api.allorigins.win/get?url=',
            format: 'json',
            contentKey: 'contents',
            enabled: true,
            rateLimit: 1000 // ms
        });

        this.proxyServices.set('corsproxy', {
            name: 'CORS Proxy',
            url: 'https://corsproxy.io/?',
            format: 'direct',
            enabled: true,
            rateLimit: 500
        });

        this.proxyServices.set('thingproxy', {
            name: 'Thing Proxy',
            url: 'https://thingproxy.freeboard.io/fetch/',
            format: 'direct',
            enabled: true,
            rateLimit: 2000
        });

        // Custom proxy for better privacy
        this.proxyServices.set('umbra-proxy', {
            name: 'Umbra Proxy',
            url: this.createCustomProxy(),
            format: 'custom',
            enabled: true,
            rateLimit: 100,
            privacy: true
        });
    }

    /**
     * Setup bypass list for direct access
     */
    setupBypassList() {
        // Domains that should bypass proxy
        const bypasses = [
            'localhost',
            '127.0.0.1',
            '0.0.0.0',
            'file://',
            'data:',
            'blob:',
            'about:',
            'chrome:',
            'moz-extension:',
            'chrome-extension:'
        ];
        
        bypasses.forEach(bypass => this.bypassList.add(bypass));
    }

    /**
     * Setup request interception
     */
    setupRequestInterception() {
        // Override fetch for automatic proxy usage
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            if (this.shouldProxy(url)) {
                return this.proxyFetch(url, options);
            }
            return originalFetch(url, options);
        };

        // Set up iframe monitoring
        this.setupIframeMonitoring();
    }

    /**
     * Check if URL should be proxied
     */
    shouldProxy(url) {
        try {
            const urlObj = new URL(url);
            
            // Check bypass list
            for (const bypass of this.bypassList) {
                if (url.includes(bypass)) {
                    return false;
                }
            }
            
            // Check if it's a cross-origin request
            const currentOrigin = window.location.origin;
            const targetOrigin = urlObj.origin;
            
            return currentOrigin !== targetOrigin;
        } catch (error) {
            return false;
        }
    }

    /**
     * Proxy fetch request
     */
    async proxyFetch(url, options = {}) {
        try {
            const proxyService = this.getActiveProxy();
            if (!proxyService) {
                throw new Error('No proxy service available');
            }

            // Apply rate limiting
            await this.applyRateLimit(proxyService);

            // Build proxy URL
            const proxyUrl = this.buildProxyUrl(url, proxyService);
            
            // Prepare headers
            const headers = this.prepareHeaders(options.headers);
            
            // Make request through proxy
            const response = await fetch(proxyUrl, {
                ...options,
                headers,
                mode: 'cors'
            });

            // Process response based on proxy format
            return this.processProxyResponse(response, proxyService);
            
        } catch (error) {
            console.error('Proxy fetch failed:', error);
            
            // Fallback to direct fetch
            try {
                return await fetch(url, options);
            } catch (directError) {
                throw new Error(`Both proxy and direct fetch failed: ${error.message}`);
            }
        }
    }

    /**
     * Get active proxy service
     */
    getActiveProxy() {
        if (this.activeProxy) {
            return this.proxyServices.get(this.activeProxy);
        }
        
        // Find first enabled proxy
        for (const [key, proxy] of this.proxyServices.entries()) {
            if (proxy.enabled) {
                this.activeProxy = key;
                return proxy;
            }
        }
        
        return null;
    }

    /**
     * Build proxy URL
     */
    buildProxyUrl(targetUrl, proxyService) {
        switch (proxyService.format) {
            case 'json':
                return `${proxyService.url}${encodeURIComponent(targetUrl)}`;
            
            case 'direct':
                return `${proxyService.url}${targetUrl}`;
            
            case 'custom':
                return proxyService.url(targetUrl);
            
            default:
                return `${proxyService.url}${encodeURIComponent(targetUrl)}`;
        }
    }

    /**
     * Prepare request headers
     */
    prepareHeaders(headers = {}) {
        const preparedHeaders = new Headers(headers);
        
        // Add privacy headers
        preparedHeaders.set('User-Agent', this.getRandomUserAgent());
        preparedHeaders.set('Accept-Language', 'en-US,en;q=0.9');
        preparedHeaders.set('DNT', '1');
        
        // Remove identifying headers
        preparedHeaders.delete('Referer');
        preparedHeaders.delete('Origin');
        
        return preparedHeaders;
    }

    /**
     * Process proxy response
     */
    async processProxyResponse(response, proxyService) {
        switch (proxyService.format) {
            case 'json':
                const jsonData = await response.json();
                return new Response(jsonData[proxyService.contentKey], {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
                
            case 'direct':
            case 'custom':
            default:
                return response;
        }
    }

    /**
     * Apply rate limiting
     */
    async applyRateLimit(proxyService) {
        const lastRequest = this.cache.get(`lastRequest-${proxyService.name}`);
        const now = Date.now();
        
        if (lastRequest && now - lastRequest < proxyService.rateLimit) {
            const delay = proxyService.rateLimit - (now - lastRequest);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.cache.set(`lastRequest-${proxyService.name}`, Date.now());
    }

    /**
     * Get random user agent for privacy
     */
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
        ];
        
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    /**
     * Create custom proxy service
     */
    createCustomProxy() {
        return (targetUrl) => {
            // Simple proxy implementation using data URLs for privacy
            const encodedUrl = btoa(targetUrl);
            return `data:text/html,<script>
                fetch('${targetUrl}', { mode: 'no-cors' })
                .then(response => response.text())
                .then(data => {
                    document.body.innerHTML = data;
                })
                .catch(err => {
                    document.body.innerHTML = '<h1>Error loading page</h1><p>' + err.message + '</p>';
                });
            </script>`;
        };
    }

    /**
     * Setup iframe monitoring for proxy injection
     */
    setupIframeMonitoring() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IFRAME') {
                        this.processIframe(node);
                    }
                });
            });
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Process iframe for proxy injection
     */
    processIframe(iframe) {
        const src = iframe.src;
        if (src && this.shouldProxy(src)) {
            const proxyService = this.getActiveProxy();
            if (proxyService) {
                const proxyUrl = this.buildProxyUrl(src, proxyService);
                iframe.src = proxyUrl;
                
                // Add proxy indicator
                iframe.setAttribute('data-umbra-proxied', 'true');
                iframe.style.border = '2px solid var(--accent-color)';
                iframe.title = 'プロキシ経由でロード中...';
            }
        }
    }

    /**
     * Anonymize URL for privacy
     */
    anonymizeUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Remove tracking parameters
            const trackingParams = [
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'gclid', 'fbclid', 'msclkid', 'ref', 'referrer', '_ga', 'mc_cid'
            ];
            
            trackingParams.forEach(param => {
                urlObj.searchParams.delete(param);
            });
            
            return urlObj.toString();
        } catch (error) {
            return url;
        }
    }

    /**
     * Set active proxy
     */
    setActiveProxy(proxyKey) {
        if (this.proxyServices.has(proxyKey)) {
            this.activeProxy = proxyKey;
            this.umbra.notificationManager.success(
                `プロキシを${this.proxyServices.get(proxyKey).name}に変更しました`
            );
        }
    }

    /**
     * Add custom proxy service
     */
    addProxyService(key, config) {
        this.proxyServices.set(key, {
            name: config.name,
            url: config.url,
            format: config.format || 'direct',
            enabled: config.enabled !== false,
            rateLimit: config.rateLimit || 1000,
            privacy: config.privacy || false
        });
        
        this.umbra.notificationManager.success(
            `カスタムプロキシ "${config.name}" を追加しました`
        );
    }

    /**
     * Remove proxy service
     */
    removeProxyService(key) {
        if (this.proxyServices.has(key)) {
            const service = this.proxyServices.get(key);
            this.proxyServices.delete(key);
            
            if (this.activeProxy === key) {
                this.activeProxy = null;
            }
            
            this.umbra.notificationManager.success(
                `プロキシ "${service.name}" を削除しました`
            );
        }
    }

    /**
     * Enable/disable proxy service
     */
    toggleProxyService(key, enabled) {
        if (this.proxyServices.has(key)) {
            this.proxyServices.get(key).enabled = enabled;
        }
    }

    /**
     * Add domain to bypass list
     */
    addBypass(domain) {
        this.bypassList.add(domain.toLowerCase());
        this.umbra.notificationManager.success(
            `"${domain}" をプロキシバイパスリストに追加しました`
        );
    }

    /**
     * Remove domain from bypass list
     */
    removeBypass(domain) {
        this.bypassList.delete(domain.toLowerCase());
        this.umbra.notificationManager.success(
            `"${domain}" をプロキシバイパスリストから削除しました`
        );
    }

    /**
     * Clear proxy cache
     */
    clearCache() {
        this.cache.clear();
        this.umbra.notificationManager.success('プロキシキャッシュをクリアしました');
    }

    /**
     * Test proxy service
     */
    async testProxy(proxyKey) {
        const proxyService = this.proxyServices.get(proxyKey);
        if (!proxyService) {
            throw new Error('Proxy service not found');
        }

        const testUrl = 'https://httpbin.org/json';
        const startTime = Date.now();
        
        try {
            const proxyUrl = this.buildProxyUrl(testUrl, proxyService);
            const response = await fetch(proxyUrl, { 
                method: 'GET',
                timeout: 10000 
            });
            
            const responseTime = Date.now() - startTime;
            const success = response.ok;
            
            return {
                success,
                responseTime,
                status: response.status,
                service: proxyService.name
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: Date.now() - startTime,
                service: proxyService.name
            };
        }
    }

    /**
     * Get proxy statistics
     */
    getProxyStats() {
        const stats = {
            activeProxy: this.activeProxy,
            availableProxies: this.proxyServices.size,
            enabledProxies: Array.from(this.proxyServices.values()).filter(p => p.enabled).length,
            bypassCount: this.bypassList.size,
            cacheSize: this.cache.size
        };
        
        return stats;
    }

    /**
     * Export proxy configuration
     */
    exportConfig() {
        return {
            activeProxy: this.activeProxy,
            proxyServices: Object.fromEntries(this.proxyServices.entries()),
            bypassList: Array.from(this.bypassList),
            version: '1.0',
            exported: new Date().toISOString()
        };
    }

    /**
     * Import proxy configuration
     */
    importConfig(config) {
        try {
            if (config.proxyServices) {
                Object.entries(config.proxyServices).forEach(([key, service]) => {
                    this.proxyServices.set(key, service);
                });
            }
            
            if (config.bypassList) {
                config.bypassList.forEach(domain => {
                    this.bypassList.add(domain);
                });
            }
            
            if (config.activeProxy) {
                this.activeProxy = config.activeProxy;
            }
            
            this.umbra.notificationManager.success(
                'プロキシ設定をインポートしました'
            );
        } catch (error) {
            this.umbra.notificationManager.error(
                'プロキシ設定のインポートに失敗しました'
            );
            throw error;
        }
    }

    /**
     * Enable privacy mode for all requests
     */
    enablePrivacyMode() {
        // Force all requests through privacy-focused proxy
        const privacyProxy = Array.from(this.proxyServices.entries())
            .find(([key, service]) => service.privacy);
        
        if (privacyProxy) {
            this.setActiveProxy(privacyProxy[0]);
        }
        
        // Clear any identifying headers
        this.requestHeaders.clear();
        this.requestHeaders.set('DNT', '1');
        this.requestHeaders.set('Sec-GPC', '1');
    }

    /**
     * Disable proxy for direct access
     */
    disableProxy() {
        this.activeProxy = null;
        this.umbra.notificationManager.info('プロキシを無効にしました');
    }

    /**
     * Destroy proxy manager
     */
    destroy() {
        this.proxyServices.clear();
        this.bypassList.clear();
        this.cache.clear();
        this.requestHeaders.clear();
        this.umbra = null;
    }
}

// Export for use by Umbra
window.ProxyManager = ProxyManager;