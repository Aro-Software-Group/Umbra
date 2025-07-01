/**
 * Umbra Browser - Theme Manager
 * Handles theme switching and customization
 */

class ThemeManager {
    constructor(umbra) {
        this.umbra = umbra;
        this.currentTheme = 'light';
        this.themes = new Map();
        this.customThemes = new Map();
        
        this.init();
    }

    init() {
        this.loadDefaultThemes();
        this.loadCustomThemes();
        this.setupEventListeners();
        this.applySystemTheme();
        console.log('Theme Manager initialized');
    }

    setupEventListeners() {
        // Theme toggle button
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (this.umbra.settings.theme === 'auto') {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /**
     * Load default themes
     */
    loadDefaultThemes() {
        // Light theme
        this.themes.set('light', {
            name: 'ライト',
            description: '明るいテーマ',
            variables: {
                '--primary-bg': 'rgba(255, 255, 255, 0.8)',
                '--secondary-bg': 'rgba(248, 249, 250, 0.9)',
                '--accent-color': '#0078d4',
                '--accent-hover': '#106ebe',
                '--text-primary': '#1f1f1f',
                '--text-secondary': '#616161',
                '--border-color': 'rgba(0, 0, 0, 0.1)',
                '--shadow-light': 'rgba(0, 0, 0, 0.05)',
                '--shadow-medium': 'rgba(0, 0, 0, 0.1)',
                '--shadow-heavy': 'rgba(0, 0, 0, 0.2)',
                '--glass-bg': 'rgba(255, 255, 255, 0.7)',
                '--glass-border': 'rgba(255, 255, 255, 0.3)',
                '--glass-shadow': 'rgba(0, 0, 0, 0.1)'
            }
        });

        // Dark theme
        this.themes.set('dark', {
            name: 'ダーク',
            description: '暗いテーマ',
            variables: {
                '--primary-bg': 'rgba(32, 32, 32, 0.8)',
                '--secondary-bg': 'rgba(24, 24, 24, 0.9)',
                '--accent-color': '#60a5fa',
                '--accent-hover': '#3b82f6',
                '--text-primary': '#ffffff',
                '--text-secondary': '#a1a1aa',
                '--border-color': 'rgba(255, 255, 255, 0.1)',
                '--shadow-light': 'rgba(0, 0, 0, 0.2)',
                '--shadow-medium': 'rgba(0, 0, 0, 0.3)',
                '--shadow-heavy': 'rgba(0, 0, 0, 0.5)',
                '--glass-bg': 'rgba(32, 32, 32, 0.7)',
                '--glass-border': 'rgba(255, 255, 255, 0.1)',
                '--glass-shadow': 'rgba(0, 0, 0, 0.3)'
            }
        });

        // Blue theme
        this.themes.set('blue', {
            name: 'ブルー',
            description: '青基調のテーマ',
            variables: {
                '--primary-bg': 'rgba(240, 248, 255, 0.8)',
                '--secondary-bg': 'rgba(230, 245, 255, 0.9)',
                '--accent-color': '#2563eb',
                '--accent-hover': '#1d4ed8',
                '--text-primary': '#1e293b',
                '--text-secondary': '#64748b',
                '--border-color': 'rgba(37, 99, 235, 0.2)',
                '--shadow-light': 'rgba(37, 99, 235, 0.1)',
                '--shadow-medium': 'rgba(37, 99, 235, 0.15)',
                '--shadow-heavy': 'rgba(37, 99, 235, 0.25)',
                '--glass-bg': 'rgba(240, 248, 255, 0.7)',
                '--glass-border': 'rgba(37, 99, 235, 0.2)',
                '--glass-shadow': 'rgba(37, 99, 235, 0.1)'
            }
        });

        // Purple theme
        this.themes.set('purple', {
            name: 'パープル',
            description: '紫基調のテーマ',
            variables: {
                '--primary-bg': 'rgba(250, 245, 255, 0.8)',
                '--secondary-bg': 'rgba(245, 240, 255, 0.9)',
                '--accent-color': '#7c3aed',
                '--accent-hover': '#6d28d9',
                '--text-primary': '#1f1f1f',
                '--text-secondary': '#6b7280',
                '--border-color': 'rgba(124, 58, 237, 0.2)',
                '--shadow-light': 'rgba(124, 58, 237, 0.1)',
                '--shadow-medium': 'rgba(124, 58, 237, 0.15)',
                '--shadow-heavy': 'rgba(124, 58, 237, 0.25)',
                '--glass-bg': 'rgba(250, 245, 255, 0.7)',
                '--glass-border': 'rgba(124, 58, 237, 0.2)',
                '--glass-shadow': 'rgba(124, 58, 237, 0.1)'
            }
        });

        // High contrast theme
        this.themes.set('high-contrast', {
            name: 'ハイコントラスト',
            description: 'アクセシビリティ重視のテーマ',
            variables: {
                '--primary-bg': 'rgba(0, 0, 0, 0.95)',
                '--secondary-bg': 'rgba(255, 255, 255, 0.95)',
                '--accent-color': '#ffff00',
                '--accent-hover': '#ffcc00',
                '--text-primary': '#ffffff',
                '--text-secondary': '#cccccc',
                '--border-color': '#ffffff',
                '--shadow-light': 'rgba(255, 255, 255, 0.3)',
                '--shadow-medium': 'rgba(255, 255, 255, 0.5)',
                '--shadow-heavy': 'rgba(255, 255, 255, 0.7)',
                '--glass-bg': 'rgba(0, 0, 0, 0.9)',
                '--glass-border': 'rgba(255, 255, 255, 0.5)',
                '--glass-shadow': 'rgba(255, 255, 255, 0.2)'
            }
        });
    }

    /**
     * Load custom themes from storage
     */
    loadCustomThemes() {
        try {
            const saved = localStorage.getItem('umbra-custom-themes');
            if (saved) {
                const customThemesData = JSON.parse(saved);
                Object.entries(customThemesData).forEach(([name, theme]) => {
                    this.customThemes.set(name, theme);
                });
            }
        } catch (error) {
            console.warn('Failed to load custom themes:', error);
        }
    }

    /**
     * Save custom themes to storage
     */
    saveCustomThemes() {
        try {
            const customThemesData = Object.fromEntries(this.customThemes.entries());
            localStorage.setItem('umbra-custom-themes', JSON.stringify(customThemesData));
        } catch (error) {
            console.warn('Failed to save custom themes:', error);
        }
    }

    /**
     * Apply system theme preference
     */
    applySystemTheme() {
        const savedTheme = this.umbra.settings.theme;
        
        if (savedTheme === 'auto') {
            const prefersDark = window.matchMedia && 
                               window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.setTheme(savedTheme);
        }
    }

    /**
     * Set theme
     */
    setTheme(themeName) {
        const theme = this.themes.get(themeName) || this.customThemes.get(themeName);
        
        if (!theme) {
            console.warn(`Theme "${themeName}" not found`);
            return;
        }

        this.currentTheme = themeName;
        this.applyThemeVariables(theme.variables);
        this.updateThemeUI(themeName);
        this.saveThemePreference(themeName);
        
        // Emit theme change event
        this.umbra.emit('themeChanged', themeName);
        
        console.log(`Theme changed to: ${themeName}`);
    }

    /**
     * Apply theme CSS variables
     */
    applyThemeVariables(variables) {
        const root = document.documentElement;
        
        Object.entries(variables).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Set data-theme attribute for CSS selectors
        document.documentElement.setAttribute('data-theme', this.currentTheme);
    }

    /**
     * Update theme UI indicators
     */
    updateThemeUI(themeName) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            // Update theme toggle icon
            const isDark = themeName === 'dark';
            themeToggle.textContent = isDark ? '☀️' : '🌙';
            themeToggle.title = isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え';
        }
    }

    /**
     * Save theme preference
     */
    saveThemePreference(themeName) {
        this.umbra.updateSettings({ theme: themeName });
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Cycle through available themes
     */
    cycleTheme() {
        const availableThemes = Array.from(this.themes.keys());
        const currentIndex = availableThemes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % availableThemes.length;
        const nextTheme = availableThemes[nextIndex];
        
        this.setTheme(nextTheme);
    }

    /**
     * Create custom theme
     */
    createCustomTheme(name, variables, description = '') {
        const customTheme = {
            name: name,
            description: description,
            variables: variables,
            custom: true,
            created: new Date().toISOString()
        };

        this.customThemes.set(name, customTheme);
        this.saveCustomThemes();

        this.umbra.notificationManager.show(
            `カスタムテーム "${name}" を作成しました`,
            'success'
        );

        return customTheme;
    }

    /**
     * Edit custom theme
     */
    editCustomTheme(name, updates) {
        const theme = this.customThemes.get(name);
        if (!theme) {
            throw new Error(`Custom theme "${name}" not found`);
        }

        const updatedTheme = {
            ...theme,
            ...updates,
            modified: new Date().toISOString()
        };

        this.customThemes.set(name, updatedTheme);
        this.saveCustomThemes();

        // If this is the current theme, reapply it
        if (this.currentTheme === name) {
            this.setTheme(name);
        }

        this.umbra.notificationManager.show(
            `カスタムテーム "${name}" を更新しました`,
            'success'
        );
    }

    /**
     * Delete custom theme
     */
    deleteCustomTheme(name) {
        if (!this.customThemes.has(name)) {
            throw new Error(`Custom theme "${name}" not found`);
        }

        this.customThemes.delete(name);
        this.saveCustomThemes();

        // If this was the current theme, switch to light theme
        if (this.currentTheme === name) {
            this.setTheme('light');
        }

        this.umbra.notificationManager.show(
            `カスタムテーム "${name}" を削除しました`,
            'success'
        );
    }

    /**
     * Get all available themes
     */
    getAllThemes() {
        const allThemes = new Map();
        
        // Add default themes
        this.themes.forEach((theme, name) => {
            allThemes.set(name, { ...theme, custom: false });
        });
        
        // Add custom themes
        this.customThemes.forEach((theme, name) => {
            allThemes.set(name, theme);
        });
        
        return allThemes;
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return {
            name: this.currentTheme,
            theme: this.themes.get(this.currentTheme) || this.customThemes.get(this.currentTheme)
        };
    }

    /**
     * Import theme from JSON
     */
    importTheme(themeData) {
        try {
            const theme = typeof themeData === 'string' ? JSON.parse(themeData) : themeData;
            
            if (!theme.name || !theme.variables) {
                throw new Error('Invalid theme format');
            }

            this.createCustomTheme(theme.name, theme.variables, theme.description);
            
            this.umbra.notificationManager.show(
                `テーマ "${theme.name}" をインポートしました`,
                'success'
            );
            
            return theme;
        } catch (error) {
            this.umbra.notificationManager.show(
                'テーマのインポートに失敗しました',
                'error'
            );
            throw error;
        }
    }

    /**
     * Export theme to JSON
     */
    exportTheme(themeName) {
        const theme = this.customThemes.get(themeName);
        if (!theme) {
            throw new Error(`Theme "${themeName}" not found`);
        }

        const exportData = {
            name: theme.name,
            description: theme.description,
            variables: theme.variables,
            exported: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Get theme CSS for a specific theme
     */
    getThemeCSS(themeName) {
        const theme = this.themes.get(themeName) || this.customThemes.get(themeName);
        if (!theme) return '';

        let css = `:root {\n`;
        Object.entries(theme.variables).forEach(([property, value]) => {
            css += `  ${property}: ${value};\n`;
        });
        css += `}\n`;

        return css;
    }

    /**
     * Apply temporary theme for preview
     */
    previewTheme(variables) {
        this.applyThemeVariables(variables);
    }

    /**
     * Revert to current theme (after preview)
     */
    revertTheme() {
        this.setTheme(this.currentTheme);
    }

    /**
     * Auto-adjust theme based on time
     */
    enableAutoTheme() {
        setInterval(() => {
            const hour = new Date().getHours();
            const shouldBeDark = hour < 7 || hour > 19; // Dark theme 7 PM - 7 AM
            const targetTheme = shouldBeDark ? 'dark' : 'light';
            
            if (this.currentTheme !== targetTheme) {
                this.setTheme(targetTheme);
                this.umbra.notificationManager.show(
                    `時間に基づいて${targetTheme === 'dark' ? 'ダーク' : 'ライト'}テーマに切り替えました`,
                    'info'
                );
            }
        }, 60000); // Check every minute
    }

    /**
     * Generate theme based on color
     */
    generateThemeFromColor(baseColor, themeName) {
        // Simple theme generation logic
        const hsl = this.hexToHsl(baseColor);
        const variations = this.generateColorVariations(hsl);
        
        const variables = {
            '--primary-bg': `hsla(${variations.light.h}, ${variations.light.s}%, ${variations.light.l}%, 0.8)`,
            '--secondary-bg': `hsla(${variations.lighter.h}, ${variations.lighter.s}%, ${variations.lighter.l}%, 0.9)`,
            '--accent-color': baseColor,
            '--accent-hover': `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 10, 0)}%)`,
            '--text-primary': hsl.l > 50 ? '#1f1f1f' : '#ffffff',
            '--text-secondary': hsl.l > 50 ? '#616161' : '#a1a1aa',
            '--border-color': `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.2)`,
            '--glass-bg': `hsla(${variations.light.h}, ${variations.light.s}%, ${variations.light.l}%, 0.7)`,
            '--glass-border': `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.3)`,
            '--glass-shadow': `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.1)`
        };

        return this.createCustomTheme(themeName, variables, `${baseColor}基調のテーマ`);
    }

    /**
     * Convert hex color to HSL
     */
    hexToHsl(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    /**
     * Generate color variations
     */
    generateColorVariations(hsl) {
        return {
            light: { h: hsl.h, s: Math.max(hsl.s - 20, 0), l: Math.min(hsl.l + 30, 95) },
            lighter: { h: hsl.h, s: Math.max(hsl.s - 30, 0), l: Math.min(hsl.l + 40, 97) },
            dark: { h: hsl.h, s: Math.min(hsl.s + 10, 100), l: Math.max(hsl.l - 20, 5) },
            darker: { h: hsl.h, s: Math.min(hsl.s + 20, 100), l: Math.max(hsl.l - 30, 3) }
        };
    }

    /**
     * Destroy theme manager
     */
    destroy() {
        this.themes.clear();
        this.customThemes.clear();
        this.umbra = null;
    }
}

// Export for use by Umbra
window.ThemeManager = ThemeManager;