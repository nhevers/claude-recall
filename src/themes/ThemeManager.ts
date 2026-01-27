/**
 * Theme Manager
 * 
 * Manages UI themes and provides theme switching functionality.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderColor: string;
  borderLight: string;
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;
  accentInfo: string;
}

export interface Theme {
  id: string;
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
  customCss?: string;
}

export interface ThemeManagerOptions {
  defaultTheme?: string;
  persistPreference?: boolean;
  storageKey?: string;
}

type ThemeChangeCallback = (theme: Theme) => void;

export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentThemeId: string;
  private mode: ThemeMode = 'system';
  private options: ThemeManagerOptions;
  private listeners: Set<ThemeChangeCallback> = new Set();

  constructor(options: ThemeManagerOptions = {}) {
    this.options = {
      defaultTheme: 'dark',
      persistPreference: true,
      storageKey: 'claude-recall-theme',
      ...options,
    };

    // Register built-in themes
    this.registerBuiltInThemes();

    // Load saved preference
    this.currentThemeId = this.loadPreference() || this.options.defaultTheme!;
  }

  /**
   * Register a new theme
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  /**
   * Get a theme by ID
   */
  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  /**
   * Get all registered themes
   */
  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  /**
   * Get themes by mode
   */
  getThemesByMode(mode: 'light' | 'dark'): Theme[] {
    return this.getAllThemes().filter(t => t.mode === mode);
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    const theme = this.themes.get(this.currentThemeId);
    if (!theme) {
      return this.themes.get(this.options.defaultTheme!)!;
    }
    return theme;
  }

  /**
   * Set current theme
   */
  setTheme(themeId: string): void {
    if (!this.themes.has(themeId)) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    this.currentThemeId = themeId;
    this.mode = this.themes.get(themeId)!.mode;

    if (this.options.persistPreference) {
      this.savePreference(themeId);
    }

    this.notifyListeners();
  }

  /**
   * Set theme mode (light/dark/system)
   */
  setMode(mode: ThemeMode): void {
    this.mode = mode;

    if (mode === 'system') {
      const systemMode = this.getSystemMode();
      const themes = this.getThemesByMode(systemMode);
      if (themes.length > 0) {
        this.currentThemeId = themes[0].id;
      }
    } else {
      const themes = this.getThemesByMode(mode);
      if (themes.length > 0) {
        this.currentThemeId = themes[0].id;
      }
    }

    if (this.options.persistPreference) {
      this.savePreference(this.currentThemeId);
    }

    this.notifyListeners();
  }

  /**
   * Get current mode
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * Toggle between light and dark
   */
  toggle(): void {
    const current = this.getCurrentTheme();
    const newMode = current.mode === 'light' ? 'dark' : 'light';
    this.setMode(newMode);
  }

  /**
   * Get CSS variables for current theme
   */
  getCssVariables(): string {
    const theme = this.getCurrentTheme();
    const { colors } = theme;

    return `
      --bg-primary: ${colors.bgPrimary};
      --bg-secondary: ${colors.bgSecondary};
      --bg-tertiary: ${colors.bgTertiary};
      --text-primary: ${colors.textPrimary};
      --text-secondary: ${colors.textSecondary};
      --text-muted: ${colors.textMuted};
      --border-color: ${colors.borderColor};
      --border-light: ${colors.borderLight};
      --accent-primary: ${colors.accentPrimary};
      --accent-secondary: ${colors.accentSecondary};
      --accent-success: ${colors.accentSuccess};
      --accent-warning: ${colors.accentWarning};
      --accent-error: ${colors.accentError};
      --accent-info: ${colors.accentInfo};
    `.trim();
  }

  /**
   * Apply theme to document
   */
  applyToDocument(): void {
    if (typeof document === 'undefined') return;

    const theme = this.getCurrentTheme();
    document.documentElement.setAttribute('data-theme', theme.id);
    document.documentElement.style.cssText = this.getCssVariables();

    if (theme.customCss) {
      this.injectCustomCss(theme.customCss);
    }
  }

  /**
   * Subscribe to theme changes
   */
  onChange(callback: ThemeChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private registerBuiltInThemes(): void {
    // Import built-in themes
    const { darkTheme } = require('./dark.js');
    const { lightTheme } = require('./light.js');

    this.registerTheme(darkTheme);
    this.registerTheme(lightTheme);
  }

  private getSystemMode(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private loadPreference(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.options.storageKey!);
  }

  private savePreference(themeId: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.options.storageKey!, themeId);
  }

  private notifyListeners(): void {
    const theme = this.getCurrentTheme();
    for (const listener of this.listeners) {
      listener(theme);
    }
  }

  private injectCustomCss(css: string): void {
    const styleId = 'claude-recall-theme-custom';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = css;
  }
}

// Singleton instance
let instance: ThemeManager | null = null;

export function getThemeManager(options?: ThemeManagerOptions): ThemeManager {
  if (!instance) {
    instance = new ThemeManager(options);
  }
  return instance;
}
