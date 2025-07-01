/**
 * Umbra Browser - Main Application Entry Point
 * Aro Software Group
 * 
 * Initializes and coordinates all browser components
 */

// Global Umbra instance
let umbra = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeUmbraBrowser();
});

/**
 * Initialize Umbra Browser
 */
function initializeUmbraBrowser() {
    console.log('🚀 Starting Umbra Browser...');
    
    try {
        // Create global Umbra instance
        umbra = new UmbraBrowser();
        
        // Make it globally accessible
        window.umbra = umbra;
        
        // Setup global error handling
        setupGlobalErrorHandling();
        
        // Setup keyboard shortcuts
        setupGlobalKeyboardShortcuts();
        
        // Setup page visibility handling
        setupPageVisibilityHandling();
        
        // Setup settings panel
        setupSettingsPanel();
        
        // Setup additional UI features
        setupAdditionalUIFeatures();
        
        // Show welcome message
        showWelcomeMessage();
        
        console.log('✅ Umbra Browser initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize Umbra Browser:', error);
        showFallbackError(error);
    }
}

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling() {
    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        if (umbra && umbra.notificationManager) {
            umbra.notificationManager.error(
                `エラーが発生しました: ${event.error.message}`,
                { duration: 10000 }
            );
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        if (umbra && umbra.notificationManager) {
            umbra.notificationManager.error(
                'アプリケーションエラーが発生しました',
                { duration: 8000 }
            );
        }
        
        // Prevent default browser handling
        event.preventDefault();
    });
}

/**
 * Setup global keyboard shortcuts
 */
function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Don't interfere with input fields
        if (event.target.matches('input, textarea, [contenteditable]')) {
            return;
        }
        
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        
        // Global shortcuts
        switch (event.key) {
            case 'F1':
                event.preventDefault();
                showHelpDialog();
                break;
                
            case 'F5':
                event.preventDefault();
                if (umbra) umbra.refresh();
                break;
                
            case 'F11':
                event.preventDefault();
                toggleFullscreen();
                break;
                
            case 'F12':
                event.preventDefault();
                toggleDevMode();
                break;
                
            case 'Escape':
                event.preventDefault();
                handleEscapeKey();
                break;
        }
        
        // Ctrl/Cmd combinations
        if (isCtrlOrCmd) {
            switch (event.key) {
                case 'h':
                    event.preventDefault();
                    if (umbra) umbra.goHome();
                    break;
                    
                case 'u':
                    event.preventDefault();
                    showUrlDialog();
                    break;
                    
                case 'j':
                    event.preventDefault();
                    if (umbra && umbra.themeManager) {
                        umbra.themeManager.cycleTheme();
                    }
                    break;
                    
                case 'p':
                    event.preventDefault();
                    if (umbra && umbra.privacyManager) {
                        umbra.privacyManager.togglePrivacyMode();
                    }
                    break;
                    
                case ',':
                    event.preventDefault();
                    openSettings();
                    break;
            }
        }
        
        // Alt combinations
        if (event.altKey) {
            switch (event.key) {
                case 'h':
                    event.preventDefault();
                    if (umbra) umbra.goHome();
                    break;
            }
        }
    });
}

/**
 * Setup page visibility handling
 */
function setupPageVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('Page hidden - pausing non-essential operations');
        } else {
            console.log('Page visible - resuming operations');
        }
    });
}

/**
 * Setup settings panel
 */
function setupSettingsPanel() {
    const settingsBtn = document.getElementById('settingsBtn');
    const sidePanel = document.getElementById('sidePanel');
    const panelClose = document.getElementById('panelClose');
    
    if (settingsBtn && sidePanel) {
        settingsBtn.addEventListener('click', () => {
            openSettings();
        });
    }
    
    if (panelClose && sidePanel) {
        panelClose.addEventListener('click', () => {
            sidePanel.classList.add('hidden');
        });
    }
}

/**
 * Open settings panel
 */
function openSettings() {
    const sidePanel = document.getElementById('sidePanel');
    const panelTitle = document.getElementById('panelTitle');
    const panelContent = document.getElementById('panelContent');
    
    if (sidePanel && panelTitle && panelContent) {
        panelTitle.textContent = '設定';
        panelContent.innerHTML = generateSettingsHTML();
        sidePanel.classList.remove('hidden');
        
        // Setup settings event listeners
        setupSettingsEventListeners();
    }
}

/**
 * Generate settings HTML
 */
function generateSettingsHTML() {
    const settings = umbra ? umbra.getSettings() : {};
    
    return `
        <div class="settings-section">
            <h4>一般設定</h4>
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="privacyMode" ${settings.privacyMode ? 'checked' : ''}>
                    プライバシーモード
                </label>
                <p class="setting-description">履歴を残さない匿名ブラウジング</p>
            </div>
            
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="adBlockEnabled" ${settings.adBlockEnabled ? 'checked' : ''}>
                    広告ブロック
                </label>
                <p class="setting-description">広告を自動的にブロック</p>
            </div>
            
            <div class="setting-item">
                <label>
                    <input type="checkbox" id="securityEnabled" ${settings.securityEnabled ? 'checked' : ''}>
                    セキュリティ保護
                </label>
                <p class="setting-description">危険サイトの検出とブロック</p>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>テーマ</h4>
            <div class="setting-item">
                <label for="themeSelect">テーマ:</label>
                <select id="themeSelect">
                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>ライト</option>
                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>ダーク</option>
                    <option value="blue" ${settings.theme === 'blue' ? 'selected' : ''}>ブルー</option>
                    <option value="purple" ${settings.theme === 'purple' ? 'selected' : ''}>パープル</option>
                    <option value="high-contrast" ${settings.theme === 'high-contrast' ? 'selected' : ''}>ハイコントラスト</option>
                </select>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>検索エンジン</h4>
            <div class="setting-item">
                <label for="searchEngineSelect">デフォルト検索エンジン:</label>
                <select id="searchEngineSelect">
                    <option value="google" ${settings.defaultSearchEngine === 'google' ? 'selected' : ''}>Google</option>
                    <option value="bing" ${settings.defaultSearchEngine === 'bing' ? 'selected' : ''}>Bing</option>
                    <option value="duckduckgo" ${settings.defaultSearchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
                </select>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>データ管理</h4>
            <div class="setting-item">
                <button class="settings-btn" id="clearDataBtn">全データをクリア</button>
                <p class="setting-description">履歴、キャッシュ、設定をすべて削除</p>
            </div>
            
            <div class="setting-item">
                <button class="settings-btn" id="exportDataBtn">データをエクスポート</button>
                <button class="settings-btn" id="importDataBtn">データをインポート</button>
            </div>
        </div>
        
        <div class="settings-section">
            <h4>統計情報</h4>
            <div class="stats-grid" id="statsGrid">
                <!-- Stats will be populated here -->
            </div>
        </div>
        
        <div class="settings-section">
            <h4>情報</h4>
            <div class="setting-item">
                <p><strong>バージョン:</strong> ${umbra ? umbra.version : 'Unknown'}</p>
                <p><strong>開発:</strong> Aro Software Group</p>
                <p><strong>プライバシー重視:</strong> 履歴を残さない匿名ブラウザ</p>
            </div>
        </div>
    `;
}

/**
 * Setup settings event listeners
 */
function setupSettingsEventListeners() {
    // Privacy mode toggle
    const privacyMode = document.getElementById('privacyMode');
    if (privacyMode) {
        privacyMode.addEventListener('change', (e) => {
            if (umbra) {
                umbra.updateSettings({ privacyMode: e.target.checked });
            }
        });
    }
    
    // Ad block toggle
    const adBlockEnabled = document.getElementById('adBlockEnabled');
    if (adBlockEnabled) {
        adBlockEnabled.addEventListener('change', (e) => {
            if (umbra) {
                umbra.updateSettings({ adBlockEnabled: e.target.checked });
                if (umbra.adBlocker) {
                    if (e.target.checked) {
                        umbra.adBlocker.enable();
                    } else {
                        umbra.adBlocker.disable();
                    }
                }
            }
        });
    }
    
    // Security toggle
    const securityEnabled = document.getElementById('securityEnabled');
    if (securityEnabled) {
        securityEnabled.addEventListener('change', (e) => {
            if (umbra) {
                umbra.updateSettings({ securityEnabled: e.target.checked });
                if (umbra.securityManager) {
                    if (e.target.checked) {
                        umbra.securityManager.enable();
                    } else {
                        umbra.securityManager.disable();
                    }
                }
            }
        });
    }
    
    // Theme selection
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', (e) => {
            if (umbra && umbra.themeManager) {
                umbra.themeManager.setTheme(e.target.value);
            }
        });
    }
    
    // Search engine selection
    const searchEngineSelect = document.getElementById('searchEngineSelect');
    if (searchEngineSelect) {
        searchEngineSelect.addEventListener('change', (e) => {
            if (umbra) {
                umbra.updateSettings({ defaultSearchEngine: e.target.value });
            }
        });
    }
    
    // Clear data button
    const clearDataBtn = document.getElementById('clearDataBtn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', async () => {
            if (umbra && umbra.notificationManager) {
                const confirmed = await umbra.notificationManager.confirm(
                    'すべてのデータを削除しますか？この操作は元に戻せません。',
                    { title: 'データクリア確認' }
                );
                
                if (confirmed) {
                    clearAllData();
                }
            }
        });
    }
    
    // Export data button
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            exportData();
        });
    }
    
    // Import data button
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            importData();
        });
    }
    
    // Update stats
    updateStats();
}

/**
 * Setup additional UI features
 */
function setupAdditionalUIFeatures() {
    // Setup menu button
    const menuBtn = document.getElementById('menuBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            showContextMenu();
        });
    }
    
    // Setup bookmark button
    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            toggleBookmark();
        });
    }
    
    // Setup download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            showDownloads();
        });
    }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    if (umbra && umbra.notificationManager) {
        setTimeout(() => {
            umbra.notificationManager.success(
                'Umbraブラウザへようこそ！プライバシーとセキュリティを重視した匿名ブラウジングをお楽しみください。',
                { duration: 5000 }
            );
        }, 1000);
    }
}

/**
 * Show fallback error
 */
function showFallbackError(error) {
    const errorHtml = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: rgba(255, 255, 255, 0.9); padding: 2rem; border-radius: 12px; 
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); z-index: 10000; text-align: center;">
            <h2 style="color: #ef4444; margin-bottom: 1rem;">Umbra Browser エラー</h2>
            <p style="margin-bottom: 1rem;">ブラウザの初期化に失敗しました。</p>
            <p style="font-size: 0.9em; color: #666; margin-bottom: 1rem;">${error.message}</p>
            <button onclick="location.reload()" style="background: #0078d4; color: white; 
                    border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">
                再読み込み
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', errorHtml);
}

/**
 * Handle escape key
 */
function handleEscapeKey() {
    // Close side panel
    const sidePanel = document.getElementById('sidePanel');
    if (sidePanel && !sidePanel.classList.contains('hidden')) {
        sidePanel.classList.add('hidden');
        return;
    }
    
    // Hide notifications
    if (umbra && umbra.notificationManager) {
        umbra.notificationManager.hideAll();
    }
}

/**
 * Show help dialog
 */
function showHelpDialog() {
    if (umbra && umbra.notificationManager) {
        const helpContent = `
            <strong>Umbra Browser - ヘルプ</strong><br><br>
            <strong>キーボードショートカット:</strong><br>
            • Ctrl+T: 新しいタブ<br>
            • Ctrl+W: タブを閉じる<br>
            • Ctrl+L: アドレスバーにフォーカス<br>
            • Ctrl+R: ページを再読み込み<br>
            • Ctrl+H: ホームに戻る<br>
            • Ctrl+P: プライバシーモード切り替え<br>
            • Ctrl+J: テーマ切り替え<br>
            • F5: ページ更新<br>
            • F11: フルスクリーン<br>
            • ESC: パネルを閉じる
        `;
        
        umbra.notificationManager.info(helpContent, {
            title: 'ヘルプ',
            duration: -1,
            actions: [
                { label: '閉じる', type: 'primary' }
            ]
        });
    }
}

/**
 * Show URL dialog
 */
async function showUrlDialog() {
    if (umbra && umbra.notificationManager) {
        const url = await umbra.notificationManager.prompt(
            'URLまたは検索語句を入力してください:',
            '',
            { placeholder: 'https://example.com または 検索語句' }
        );
        
        if (url) {
            umbra.navigate(url);
        }
    }
}

/**
 * Toggle fullscreen
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.warn('Could not enter fullscreen:', err);
        });
    } else {
        document.exitFullscreen().catch(err => {
            console.warn('Could not exit fullscreen:', err);
        });
    }
}

/**
 * Toggle developer mode
 */
function toggleDevMode() {
    const isDev = document.body.classList.toggle('dev-mode');
    
    if (umbra && umbra.notificationManager) {
        umbra.notificationManager.info(
            `開発者モード: ${isDev ? '有効' : '無効'}`,
            { duration: 2000 }
        );
    }
    
    // Show additional debug info in dev mode
    if (isDev) {
        console.log('Umbra Browser - Developer Mode Enabled');
        console.log('Instance:', umbra);
        console.log('Settings:', umbra ? umbra.getSettings() : 'N/A');
    }
}

/**
 * Clear all data
 */
function clearAllData() {
    if (umbra) {
        // Clear privacy data
        if (umbra.privacyManager) {
            umbra.privacyManager.clearAllData();
        }
        
        // Clear storage
        if (umbra.storageManager) {
            umbra.storageManager.clear();
        }
        
        // Clear ad blocker data
        if (umbra.adBlocker) {
            umbra.adBlocker.clearStatistics();
        }
        
        // Clear security logs
        if (umbra.securityManager) {
            umbra.securityManager.clearLogs();
        }
        
        umbra.notificationManager.success('すべてのデータをクリアしました');
        
        // Reload page after clearing
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
}

/**
 * Export data
 */
async function exportData() {
    if (umbra && umbra.storageManager) {
        try {
            const data = await umbra.storageManager.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `umbra-browser-export-${new Date().getTime()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            umbra.notificationManager.success('データをエクスポートしました');
        } catch (error) {
            umbra.notificationManager.error('エクスポートに失敗しました');
        }
    }
}

/**
 * Import data
 */
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && umbra && umbra.storageManager) {
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                await umbra.storageManager.importData(data);
                
                umbra.notificationManager.success('データをインポートしました');
                
                // Reload to apply changes
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } catch (error) {
                umbra.notificationManager.error('インポートに失敗しました');
            }
        }
    });
    
    input.click();
}

/**
 * Update statistics
 */
function updateStats() {
    const statsGrid = document.getElementById('statsGrid');
    if (statsGrid && umbra) {
        let stats = {
            'ブロックした広告': 0,
            'セキュリティ脅威': 0,
            '開いているタブ': 1,
            'テーマ': umbra.settings.theme || 'light'
        };
        
        // Get ad blocker stats
        if (umbra.adBlocker) {
            const adStats = umbra.adBlocker.getStatistics();
            stats['ブロックした広告'] = adStats.totalBlocked;
        }
        
        // Get security stats
        if (umbra.securityManager) {
            const secStats = umbra.securityManager.getSecurityStats();
            stats['セキュリティ脅威'] = secStats.threatsBlocked;
        }
        
        // Get tab stats
        if (umbra.tabManager) {
            stats['開いているタブ'] = umbra.tabManager.getAllTabs().length;
        }
        
        statsGrid.innerHTML = Object.entries(stats)
            .map(([key, value]) => `
                <div class="stat-item">
                    <div class="stat-value">${value}</div>
                    <div class="stat-label">${key}</div>
                </div>
            `).join('');
    }
}

/**
 * Show context menu
 */
function showContextMenu() {
    // Implementation for context menu
    console.log('Context menu requested');
}

/**
 * Toggle bookmark
 */
function toggleBookmark() {
    // Implementation for bookmark toggle
    console.log('Bookmark toggle requested');
}

/**
 * Show downloads
 */
function showDownloads() {
    // Implementation for downloads panel
    console.log('Downloads panel requested');
}

// Make functions globally accessible for HTML onclick handlers
window.umbra_clearAllData = clearAllData;
window.umbra_exportData = exportData;
window.umbra_importData = importData;