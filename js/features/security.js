/**
 * Umbra Browser - Security Manager
 * Handles security threats, malware detection, and site verification
 */

class SecurityManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.isEnabled = true;
        this.threatDatabase = new Map();
        this.blockedSites = new Set();
        this.securityRules = [];
        this.scanResults = new Map();
        
        this.init();
    }

    init() {
        this.loadSecurityDatabase();
        this.setupSecurityRules();
        this.setupEventListeners();
        console.log('Security Manager initialized');
    }

    setupEventListeners() {
        // Listen to navigation events
        this.umbra.on('beforeNavigate', this.handleBeforeNavigation.bind(this));
    }

    /**
     * Load security threat database
     */
    loadSecurityDatabase() {
        // Known malicious domains and patterns
        const knownThreats = [
            // Phishing domains
            { domain: 'secure-paypal-verification.com', type: 'phishing', description: 'PayPalフィッシングサイト' },
            { domain: 'amazon-security-alert.net', type: 'phishing', description: 'Amazonフィッシングサイト' },
            { domain: 'gmail-security-check.org', type: 'phishing', description: 'Gmailフィッシングサイト' },
            
            // Malware domains
            { domain: 'free-software-download.exe', type: 'malware', description: 'マルウェア配布サイト' },
            { domain: 'virus-scanner-pro.com', type: 'malware', description: '偽ウイルス対策ソフト' },
            
            // Suspicious patterns
            { pattern: /bit\.ly\/[a-zA-Z0-9]{6,}/, type: 'suspicious', description: '短縮URLによる不審なリンク' },
            { pattern: /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, type: 'suspicious', description: 'IPアドレス直接アクセス' },
            
            // Cryptocurrency scams
            { pattern: /bitcoin.*giveaway/i, type: 'scam', description: '仮想通貨詐欺サイト' },
            { pattern: /elon.*musk.*crypto/i, type: 'scam', description: '著名人なりすまし詐欺' },
        ];

        knownThreats.forEach(threat => {
            if (threat.domain) {
                this.threatDatabase.set(threat.domain, threat);
            } else if (threat.pattern) {
                this.securityRules.push(threat);
            }
        });
    }

    /**
     * Setup security rules
     */
    setupSecurityRules() {
        this.securityRules.push(
            // File extension checks
            {
                pattern: /\.(exe|scr|pif|bat|cmd|com|vbs|jar)$/i,
                type: 'malware',
                description: '実行可能ファイルのダウンロード'
            },
            
            // Suspicious query parameters
            {
                pattern: /[?&](download|exec|cmd|shell)=/i,
                type: 'malware',
                description: '危険なパラメータを含むURL'
            },
            
            // Multiple redirects pattern
            {
                pattern: /redirect.*redirect/i,
                type: 'suspicious',
                description: '複数回リダイレクトの可能性'
            }
        );
    }

    /**
     * Handle before navigation security check
     */
    handleBeforeNavigation(data) {
        const { url } = data;
        
        if (!this.isEnabled) return true;
        
        const threat = this.checkUrl(url);
        if (threat) {
            this.handleSecurityThreat(url, threat);
            return false;
        }
        
        return true;
    }

    /**
     * Check URL for security threats
     */
    checkUrl(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            const fullUrl = url.toLowerCase();
            
            // Check against known threat database
            if (this.threatDatabase.has(hostname)) {
                return this.threatDatabase.get(hostname);
            }
            
            // Check against security rules
            for (const rule of this.securityRules) {
                if (rule.pattern.test(fullUrl)) {
                    return rule;
                }
            }
            
            // Check for domain spoofing
            const spoofingThreat = this.checkDomainSpoofing(hostname);
            if (spoofingThreat) return spoofingThreat;
            
            // Check for suspicious TLD
            const tldThreat = this.checkSuspiciousTLD(hostname);
            if (tldThreat) return tldThreat;
            
            // Check URL structure
            const structureThreat = this.checkUrlStructure(urlObj);
            if (structureThreat) return structureThreat;
            
            return null;
            
        } catch (error) {
            // Invalid URL - potentially suspicious
            return {
                type: 'invalid',
                description: '無効なURL形式'
            };
        }
    }

    /**
     * Check for domain spoofing
     */
    checkDomainSpoofing(hostname) {
        const legitimateDomains = [
            'google.com', 'facebook.com', 'amazon.com', 'paypal.com',
            'microsoft.com', 'apple.com', 'github.com', 'youtube.com'
        ];
        
        for (const legit of legitimateDomains) {
            // Check for similar domains with common spoofing techniques
            const spoofingPatterns = [
                hostname.replace(/o/g, '0'),  // o -> 0
                hostname.replace(/i/g, '1'),  // i -> 1
                hostname.replace(/l/g, '1'),  // l -> 1
                hostname.replace(/e/g, '3'),  // e -> 3
                legit.replace('.', '-') + '.com',  // subdomain spoofing
                legit.replace('.com', '.net'),     // TLD spoofing
                legit.replace('.com', '.org'),
            ];
            
            if (spoofingPatterns.includes(hostname) && hostname !== legit) {
                return {
                    type: 'spoofing',
                    description: `${legit}のドメインスプーフィング`
                };
            }
        }
        
        return null;
    }

    /**
     * Check for suspicious TLD
     */
    checkSuspiciousTLD(hostname) {
        const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.click', '.download', '.work'];
        
        for (const tld of suspiciousTlds) {
            if (hostname.endsWith(tld)) {
                return {
                    type: 'suspicious',
                    description: '不審なトップレベルドメイン'
                };
            }
        }
        
        return null;
    }

    /**
     * Check URL structure for anomalies
     */
    checkUrlStructure(urlObj) {
        // Very long URLs
        if (urlObj.href.length > 2000) {
            return {
                type: 'suspicious',
                description: '異常に長いURL'
            };
        }
        
        // Too many subdomains
        const subdomains = urlObj.hostname.split('.');
        if (subdomains.length > 5) {
            return {
                type: 'suspicious',
                description: '過度のサブドメイン'
            };
        }
        
        // Suspicious URL encoding
        if (urlObj.href.includes('%') && /%[0-9a-f]{2}/gi.test(urlObj.href)) {
            const decodedUrl = decodeURIComponent(urlObj.href);
            if (decodedUrl.includes('<script>') || decodedUrl.includes('javascript:')) {
                return {
                    type: 'xss',
                    description: 'XSS攻撃の可能性'
                };
            }
        }
        
        return null;
    }

    /**
     * Handle security threat
     */
    handleSecurityThreat(url, threat) {
        console.warn('Security threat detected:', threat);
        
        // Add to blocked sites
        this.blockedSites.add(url);
        
        // Log threat
        this.logThreat(url, threat);
        
        // Emit security event
        this.umbra.emit('securityThreat', { url, threat });
        
        // Show notification
        this.umbra.notificationManager.show(
            `セキュリティ脅威を検出: ${threat.description}`,
            'error'
        );
    }

    /**
     * Log security threat
     */
    logThreat(url, threat) {
        const log = {
            timestamp: new Date().toISOString(),
            url: url,
            threat: threat,
            blocked: true
        };
        
        // Store in scan results
        this.scanResults.set(url, log);
        
        console.log('Security log:', log);
    }

    /**
     * Scan text content for threats
     */
    scanContent(content) {
        const threats = [];
        
        // Check for suspicious scripts
        const scriptPatterns = [
            /<script[^>]*>.*?(eval|unescape|fromCharCode).*?<\/script>/gi,
            /javascript:.*?(eval|unescape|fromCharCode)/gi,
            /on\w+\s*=\s*["'].*?(eval|unescape|fromCharCode).*?["']/gi
        ];
        
        scriptPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                threats.push({
                    type: 'xss',
                    description: '悪意のあるスクリプトを検出'
                });
            }
        });
        
        // Check for phishing indicators
        const phishingPatterns = [
            /urgent.*action.*required/gi,
            /verify.*account.*immediately/gi,
            /suspended.*account/gi,
            /click.*here.*immediately/gi,
            /limited.*time.*offer.*expires/gi
        ];
        
        phishingPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                threats.push({
                    type: 'phishing',
                    description: 'フィッシングの可能性'
                });
            }
        });
        
        return threats;
    }

    /**
     * Check file for malware signatures
     */
    scanFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const threats = this.scanFileContent(content, file.name);
                resolve(threats);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Scan file content for malware
     */
    scanFileContent(arrayBuffer, filename) {
        const threats = [];
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check file signature/magic numbers
        const magicNumbers = {
            exe: [0x4D, 0x5A], // PE executable
            zip: [0x50, 0x4B], // ZIP archive
            rar: [0x52, 0x61, 0x72, 0x21], // RAR archive
        };
        
        // Check for executable files
        if (this.checkMagicNumber(uint8Array, magicNumbers.exe)) {
            threats.push({
                type: 'malware',
                description: '実行可能ファイルを検出'
            });
        }
        
        // Check filename for suspicious patterns
        const suspiciousExtensions = ['.exe', '.scr', '.pif', '.bat', '.cmd'];
        const hasSpiciousExt = suspiciousExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext)
        );
        
        if (hasSpiciousExt) {
            threats.push({
                type: 'malware',
                description: '危険なファイル拡張子'
            });
        }
        
        // Check for double extensions (e.g., document.pdf.exe)
        const doubleExtPattern = /\.[a-z]{2,4}\.[a-z]{2,4}$/i;
        if (doubleExtPattern.test(filename)) {
            threats.push({
                type: 'malware',
                description: '偽装された可能性のあるファイル'
            });
        }
        
        return threats;
    }

    /**
     * Check magic number in file
     */
    checkMagicNumber(uint8Array, magicBytes) {
        if (uint8Array.length < magicBytes.length) return false;
        
        for (let i = 0; i < magicBytes.length; i++) {
            if (uint8Array[i] !== magicBytes[i]) return false;
        }
        
        return true;
    }

    /**
     * Add custom security rule
     */
    addSecurityRule(rule) {
        this.securityRules.push(rule);
    }

    /**
     * Remove security rule
     */
    removeSecurityRule(pattern) {
        this.securityRules = this.securityRules.filter(rule => 
            rule.pattern.toString() !== pattern.toString()
        );
    }

    /**
     * Whitelist a domain
     */
    whitelistDomain(domain) {
        this.threatDatabase.delete(domain);
        this.blockedSites.delete(domain);
        
        this.umbra.notificationManager.show(
            `${domain}をホワイトリストに追加しました`,
            'success'
        );
    }

    /**
     * Block a domain
     */
    blockDomain(domain) {
        this.threatDatabase.set(domain, {
            type: 'blocked',
            description: 'ユーザーによりブロック'
        });
        
        this.umbra.notificationManager.show(
            `${domain}をブロックしました`,
            'success'
        );
    }

    /**
     * Get security statistics
     */
    getSecurityStats() {
        return {
            threatsBlocked: this.blockedSites.size,
            blockedSites: Array.from(this.blockedSites),
            scanResults: Array.from(this.scanResults.values()),
            isEnabled: this.isEnabled,
            rulesCount: this.securityRules.length,
            databaseSize: this.threatDatabase.size
        };
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const stats = this.getSecurityStats();
        const threatTypes = {};
        
        stats.scanResults.forEach(result => {
            const type = result.threat.type;
            threatTypes[type] = (threatTypes[type] || 0) + 1;
        });
        
        return {
            timestamp: new Date().toISOString(),
            totalThreats: stats.threatsBlocked,
            threatsByType: threatTypes,
            protectionStatus: this.isEnabled ? '有効' : '無効',
            topThreats: this.getTopThreats()
        };
    }

    /**
     * Get top threat types
     */
    getTopThreats() {
        const threatCounts = {};
        
        this.scanResults.forEach(result => {
            const type = result.threat.type;
            threatCounts[type] = (threatCounts[type] || 0) + 1;
        });
        
        return Object.entries(threatCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * Enable security protection
     */
    enable() {
        this.isEnabled = true;
        this.umbra.notificationManager.show('セキュリティ保護を有効にしました', 'success');
    }

    /**
     * Disable security protection
     */
    disable() {
        this.isEnabled = false;
        this.umbra.notificationManager.show('セキュリティ保護を無効にしました', 'warning');
    }

    /**
     * Clear security logs
     */
    clearLogs() {
        this.scanResults.clear();
        this.umbra.notificationManager.show('セキュリティログをクリアしました', 'success');
    }

    /**
     * Update threat database
     */
    updateThreatDatabase() {
        // In a real implementation, this would fetch from a remote database
        console.log('Updating threat database...');
        
        // Simulate database update
        setTimeout(() => {
            this.umbra.notificationManager.show(
                'セキュリティデータベースを更新しました',
                'success'
            );
        }, 1000);
    }

    /**
     * Destroy security manager
     */
    destroy() {
        this.threatDatabase.clear();
        this.blockedSites.clear();
        this.securityRules = [];
        this.scanResults.clear();
        this.umbra = null;
    }
}

// Export for use by Umbra
window.SecurityManager = SecurityManager;