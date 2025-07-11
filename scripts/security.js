// Umbra Browser - Security Features and Ad Blocking
class SecurityManager {
    constructor() {
        this.adBlockEnabled = true;
        this.malwareProtection = true;
        this.phishingProtection = true;
        this.safeBrowsing = true;
        this.blockedAds = 0;
        this.blockedMalware = 0;
        this.blockedPhishing = 0;
        
        this.adBlockRules = [];
        this.malwareDomains = [];
        this.phishingDomains = [];
        
        this.init();
    }

    init() {
        this.loadSecurityRules();
        this.setupSecurityFilters();
        this.initializeSecuritySettings();
        console.log('Security Manager initialized');
    }

    loadSecurityRules() {
        // Load ad blocking rules
        this.adBlockRules = [
            // Common ad patterns
            /googleads/i,
            /googlesyndication/i,
            /doubleclick/i,
            /amazon-adsystem/i,
            /adsystem/i,
            /ads\./i,
            /advertisement/i,
            /banner/i,
            /popup/i,
            /sponsor/i,
            
            // Social media tracking
            /facebook\.com\/tr/i,
            /connect\.facebook\.net/i,
            /twitter\.com\/i\/adsct/i,
            
            // Analytics and tracking
            /google-analytics/i,
            /googletagmanager/i,
            /scorecardresearch/i,
            /quantserve/i,
            
            // Other ad networks
            /adsense/i,
            /adnxs/i,
            /rubiconproject/i,
            /pubmatic/i,
            /openx/i,
            /criteo/i
        ];

        // Load malware domains (simplified list)
        this.malwareDomains = [
            'malware-example.com',
            'virus-site.net',
            'dangerous-download.org',
            'phishing-bank.com',
            'fake-security.net'
        ];

        // Load phishing domains (simplified list)
        this.phishingDomains = [
            'secure-bank-login.fake',
            'paypal-security.scam',
            'microsoft-security.phish',
            'google-security.fake',
            'amazon-security.scam'
        ];

        console.log('Security rules loaded');
    }

    setupSecurityFilters() {
        // Set up DOM monitoring for security threats
        this.setupDOMSecurity();
        
        // Set up network request monitoring
        this.setupNetworkSecurity();
        
        // Set up content security
        this.setupContentSecurity();
        
        // Set up real-time scanning
        this.setupRealTimeScanning();
    }

    setupDOMSecurity() {
        // Monitor DOM changes for malicious content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.scanElement(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'href', 'onclick']
        });
    }

    scanElement(element) {
        // Check for ad content
        if (this.adBlockEnabled && this.isAdElement(element)) {
            this.blockAd(element);
            return;
        }

        // Check for malicious scripts
        if (this.isMaliciousScript(element)) {
            this.blockMalware(element);
            return;
        }

        // Check for phishing content
        if (this.isPhishingContent(element)) {
            this.blockPhishing(element);
            return;
        }

        // Scan child elements
        element.querySelectorAll('*').forEach(child => {
            this.scanElement(child);
        });
    }

    isAdElement(element) {
        // Check element attributes and content for ad patterns
        const attributes = ['src', 'href', 'class', 'id', 'data-ad'];
        
        for (let attr of attributes) {
            const value = element.getAttribute(attr);
            if (value && this.matchesAdPattern(value)) {
                return true;
            }
        }

        // Check element text content
        const textContent = element.textContent || '';
        if (this.containsAdKeywords(textContent)) {
            return true;
        }

        // Check for ad-like dimensions (common banner sizes)
        if (this.hasAdDimensions(element)) {
            return true;
        }

        return false;
    }

    matchesAdPattern(text) {
        return this.adBlockRules.some(rule => rule.test(text));
    }

    containsAdKeywords(text) {
        const adKeywords = [
            '広告',
            'advertisement',
            'sponsored',
            'スポンサー',
            'プロモーション',
            'promotion'
        ];
        
        const lowerText = text.toLowerCase();
        return adKeywords.some(keyword => lowerText.includes(keyword));
    }

    hasAdDimensions(element) {
        const rect = element.getBoundingClientRect();
        const commonAdSizes = [
            { width: 728, height: 90 },   // Leaderboard
            { width: 300, height: 250 },  // Medium Rectangle
            { width: 336, height: 280 },  // Large Rectangle
            { width: 320, height: 50 },   // Mobile Banner
            { width: 468, height: 60 },   // Banner
            { width: 120, height: 600 },  // Skyscraper
            { width: 160, height: 600 }   // Wide Skyscraper
        ];

        return commonAdSizes.some(size => 
            Math.abs(rect.width - size.width) < 10 && 
            Math.abs(rect.height - size.height) < 10
        );
    }

    isMaliciousScript(element) {
        if (element.tagName !== 'SCRIPT') return false;

        const src = element.src;
        const content = element.textContent;

        // Check malicious domains
        if (src && this.malwareDomains.some(domain => src.includes(domain))) {
            return true;
        }

        // Check for suspicious script patterns
        const maliciousPatterns = [
            /eval\s*\(/i,
            /document\.write\s*\(/i,
            /window\.location\s*=/i,
            /setTimeout\s*\(\s*["'].*eval/i,
            /fromCharCode/i
        ];

        return maliciousPatterns.some(pattern => pattern.test(content));
    }

    isPhishingContent(element) {
        const href = element.getAttribute('href');
        const textContent = element.textContent || '';

        // Check for phishing domains
        if (href && this.phishingDomains.some(domain => href.includes(domain))) {
            return true;
        }

        // Check for suspicious phishing text
        const phishingKeywords = [
            'urgent security alert',
            'account suspended',
            'verify your account',
            'click here immediately',
            'limited time offer',
            'アカウントが停止',
            '緊急セキュリティ警告',
            'アカウント確認'
        ];

        const lowerText = textContent.toLowerCase();
        return phishingKeywords.some(keyword => lowerText.includes(keyword));
    }

    blockAd(element) {
        element.style.display = 'none';
        element.setAttribute('data-umbra-blocked', 'ad');
        this.blockedAds++;
        this.logSecurityEvent('ad', element.src || element.href || 'inline ad');
        console.log('Blocked ad element:', element);
    }

    blockMalware(element) {
        element.remove();
        this.blockedMalware++;
        this.logSecurityEvent('malware', element.src || 'inline script');
        this.showSecurityAlert('malware', 'マルウェアの可能性があるスクリプトをブロックしました。');
        console.log('Blocked malware element:', element);
    }

    blockPhishing(element) {
        element.style.backgroundColor = '#ffe6e6';
        element.style.border = '2px solid #ff4444';
        element.style.color = '#cc0000';
        element.setAttribute('data-umbra-blocked', 'phishing');
        element.onclick = (e) => {
            e.preventDefault();
            this.showPhishingWarning(element.href);
        };
        
        this.blockedPhishing++;
        this.logSecurityEvent('phishing', element.href || element.textContent);
        console.log('Blocked phishing element:', element);
    }

    setupNetworkSecurity() {
        // Monitor iframe loads for security
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
            const element = originalCreateElement.call(document, tagName);
            
            if (tagName.toLowerCase() === 'iframe') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function(name, value) {
                    if (name === 'src' && window.securityManager) {
                        if (window.securityManager.isUnsafeUrl(value)) {
                            console.log('Blocked unsafe iframe:', value);
                            return;
                        }
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            
            return element;
        };
    }

    setupContentSecurity() {
        // Add Content Security Policy meta tag
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; frame-src https:;";
        document.head.appendChild(cspMeta);

        // Monitor for inline scripts
        this.monitorInlineScripts();
    }

    monitorInlineScripts() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'SCRIPT') {
                        if (!node.src && node.textContent) {
                            this.analyzeInlineScript(node);
                        }
                    }
                });
            });
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    analyzeInlineScript(script) {
        const content = script.textContent;
        const suspiciousPatterns = [
            /document\.cookie/i,
            /localStorage/i,
            /sessionStorage/i,
            /window\.location/i,
            /eval\(/i,
            /setTimeout.*eval/i
        ];

        if (suspiciousPatterns.some(pattern => pattern.test(content))) {
            console.log('Suspicious inline script detected:', content.substring(0, 100));
            // In a real implementation, we might block or modify the script
        }
    }

    setupRealTimeScanning() {
        // Scan page periodically for new threats
        setInterval(() => {
            this.scanCurrentPage();
        }, 5000);

        // Scan on scroll (for lazy-loaded content)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.scanVisibleContent();
            }, 500);
        });
    }

    scanCurrentPage() {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            if (!element.hasAttribute('data-umbra-scanned')) {
                this.scanElement(element);
                element.setAttribute('data-umbra-scanned', 'true');
            }
        });
    }

    scanVisibleContent() {
        const visibleElements = document.querySelectorAll('*');
        visibleElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                if (!element.hasAttribute('data-umbra-scanned')) {
                    this.scanElement(element);
                    element.setAttribute('data-umbra-scanned', 'true');
                }
            }
        });
    }

    isUnsafeUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Check against malware domains
            if (this.malwareDomains.some(domain => urlObj.hostname.includes(domain))) {
                return true;
            }
            
            // Check against phishing domains
            if (this.phishingDomains.some(domain => urlObj.hostname.includes(domain))) {
                return true;
            }
            
            // Check for suspicious URL patterns
            const suspiciousPatterns = [
                /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
                /bit\.ly|tinyurl|t\.co/, // URL shorteners
                /[a-z0-9]{20,}\.com/, // Randomly generated domains
            ];
            
            return suspiciousPatterns.some(pattern => pattern.test(url));
        } catch (e) {
            return true; // Invalid URL is unsafe
        }
    }

    showSecurityAlert(type, message) {
        const alert = document.createElement('div');
        alert.className = 'security-alert';
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">⚠️</span>
                <span class="alert-message">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    showPhishingWarning(url) {
        const warning = document.createElement('div');
        warning.className = 'phishing-warning';
        warning.innerHTML = `
            <div class="warning-overlay">
                <div class="warning-content">
                    <h3>⚠️ フィッシング警告</h3>
                    <p>このリンクはフィッシングサイトの可能性があります:</p>
                    <code>${url}</code>
                    <div class="warning-actions">
                        <button onclick="this.closest('.phishing-warning').remove()">キャンセル</button>
                        <button onclick="window.open('${url}', '_blank'); this.closest('.phishing-warning').remove();" style="background: #ff4444;">リスクを承知で続行</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(warning);
    }

    logSecurityEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: Date.now(),
            url: window.location.href
        };

        const securityLog = JSON.parse(localStorage.getItem('umbraSecurityLog') || '[]');
        securityLog.push(event);
        
        // Keep only last 1000 events
        if (securityLog.length > 1000) {
            securityLog.splice(0, securityLog.length - 1000);
        }
        
        if (window.umbraBrowser && !window.umbraBrowser.isPrivateMode) {
            localStorage.setItem('umbraSecurityLog', JSON.stringify(securityLog));
        }

        // Update status display
        this.updateSecurityStats();
    }

    updateSecurityStats() {
        // Update blocked content counters in UI
        const adBlockStatus = document.querySelector('.status-item .status-text');
        if (adBlockStatus && adBlockStatus.textContent.includes('広告ブロック')) {
            adBlockStatus.textContent = `広告ブロック: 有効 (${this.blockedAds}件ブロック)`;
        }
    }

    getSecurityStats() {
        return {
            blockedAds: this.blockedAds,
            blockedMalware: this.blockedMalware,
            blockedPhishing: this.blockedPhishing,
            adBlockEnabled: this.adBlockEnabled,
            malwareProtection: this.malwareProtection,
            phishingProtection: this.phishingProtection
        };
    }

    exportSecurityLog() {
        const securityLog = JSON.parse(localStorage.getItem('umbraSecurityLog') || '[]');
        const data = {
            stats: this.getSecurityStats(),
            events: securityLog
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'umbra-security-log.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    clearSecurityLog() {
        localStorage.removeItem('umbraSecurityLog');
        this.blockedAds = 0;
        this.blockedMalware = 0;
        this.blockedPhishing = 0;
        this.updateSecurityStats();
        console.log('Security log cleared');
    }

    toggleAdBlocker() {
        this.adBlockEnabled = !this.adBlockEnabled;
        this.saveSecuritySettings();
        
        if (this.adBlockEnabled) {
            console.log('Ad blocker enabled');
            this.scanCurrentPage(); // Re-scan with ad blocking enabled
        } else {
            console.log('Ad blocker disabled');
            // Show previously blocked ads
            const blockedAds = document.querySelectorAll('[data-umbra-blocked="ad"]');
            blockedAds.forEach(ad => {
                ad.style.display = '';
                ad.removeAttribute('data-umbra-blocked');
            });
        }
    }

    initializeSecuritySettings() {
        this.loadSecuritySettings();
        this.updateSecurityStats();
    }

    saveSecuritySettings() {
        if (window.umbraBrowser && !window.umbraBrowser.isPrivateMode) {
            try {
                const settings = {
                    adBlockEnabled: this.adBlockEnabled,
                    malwareProtection: this.malwareProtection,
                    phishingProtection: this.phishingProtection,
                    safeBrowsing: this.safeBrowsing
                };
                localStorage.setItem('umbraSecuritySettings', JSON.stringify(settings));
            } catch (e) {
                console.log('Could not save security settings:', e);
            }
        }
    }

    loadSecuritySettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('umbraSecuritySettings'));
            if (settings) {
                this.adBlockEnabled = settings.adBlockEnabled !== false;
                this.malwareProtection = settings.malwareProtection !== false;
                this.phishingProtection = settings.phishingProtection !== false;
                this.safeBrowsing = settings.safeBrowsing !== false;
            }
        } catch (e) {
            console.log('Could not load security settings:', e);
        }
    }
}

// Add security alert styles
const securityStyles = `
.security-alert {
    position: fixed;
    top: 70px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
}

.alert-content {
    display: flex;
    align-items: center;
    gap: 12px;
}

.alert-content button {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
}

.phishing-warning {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 100000;
}

.warning-overlay {
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
}

.warning-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.warning-content h3 {
    color: #ff4444;
    margin-bottom: 20px;
    font-size: 24px;
}

.warning-content code {
    background: #f5f5f5;
    padding: 8px 12px;
    border-radius: 4px;
    display: block;
    margin: 15px 0;
    word-break: break-all;
}

.warning-actions {
    margin-top: 20px;
    display: flex;
    gap: 12px;
    justify-content: center;
}

.warning-actions button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
}

.warning-actions button:first-child {
    background: #f5f5f5;
    color: #333;
}
`;

// Add styles to document
const securityStyleSheet = document.createElement('style');
securityStyleSheet.textContent = securityStyles;
document.head.appendChild(securityStyleSheet);

// Initialize security manager
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
});