/**
 * Keyboard Manager
 * 
 * Handles keyboard shortcuts for the UI.
 */

export interface KeyBinding {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  category?: string;
}

export interface KeyboardManagerOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

type ActionHandler = (event: KeyboardEvent) => void | boolean;

export class KeyboardManager {
  private bindings: Map<string, KeyBinding> = new Map();
  private handlers: Map<string, ActionHandler> = new Map();
  private options: KeyboardManagerOptions;
  private enabled: boolean = true;
  private boundHandler: (e: KeyboardEvent) => void;

  constructor(options: KeyboardManagerOptions = {}) {
    this.options = {
      enabled: true,
      preventDefault: true,
      stopPropagation: false,
      ...options,
    };

    this.enabled = this.options.enabled!;
    this.boundHandler = this.handleKeyDown.bind(this);
  }

  /**
   * Register a key binding
   */
  register(binding: KeyBinding): void {
    const key = this.normalizeKey(binding);
    this.bindings.set(key, binding);
  }

  /**
   * Register multiple bindings
   */
  registerAll(bindings: KeyBinding[]): void {
    for (const binding of bindings) {
      this.register(binding);
    }
  }

  /**
   * Unregister a key binding
   */
  unregister(binding: Partial<KeyBinding>): void {
    const key = this.normalizeKey(binding as KeyBinding);
    this.bindings.delete(key);
  }

  /**
   * Register an action handler
   */
  on(action: string, handler: ActionHandler): void {
    this.handlers.set(action, handler);
  }

  /**
   * Unregister an action handler
   */
  off(action: string): void {
    this.handlers.delete(action);
  }

  /**
   * Enable keyboard shortcuts
   */
  enable(): void {
    this.enabled = true;
  }

  /**
   * Disable keyboard shortcuts
   */
  disable(): void {
    this.enabled = false;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Attach to document
   */
  attach(): void {
    if (typeof document === 'undefined') return;
    document.addEventListener('keydown', this.boundHandler);
  }

  /**
   * Detach from document
   */
  detach(): void {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', this.boundHandler);
  }

  /**
   * Get all bindings
   */
  getBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Get bindings by category
   */
  getBindingsByCategory(): Map<string, KeyBinding[]> {
    const categories = new Map<string, KeyBinding[]>();

    for (const binding of this.bindings.values()) {
      const category = binding.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(binding);
    }

    return categories;
  }

  /**
   * Get human-readable key combo string
   */
  formatKeyCombo(binding: KeyBinding): string {
    const parts: string[] = [];

    if (binding.ctrl) parts.push('Ctrl');
    if (binding.alt) parts.push('Alt');
    if (binding.shift) parts.push('Shift');
    if (binding.meta) parts.push('⌘');

    parts.push(this.formatKey(binding.key));

    return parts.join('+');
  }

  /**
   * Trigger an action programmatically
   */
  trigger(action: string, event?: KeyboardEvent): boolean {
    const handler = this.handlers.get(action);
    if (handler) {
      const result = handler(event || new KeyboardEvent('keydown'));
      return result !== false;
    }
    return false;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return;

    // Skip if typing in an input
    const target = event.target as HTMLElement;
    if (this.isInputElement(target)) return;

    const key = this.normalizeKeyFromEvent(event);
    const binding = this.bindings.get(key);

    if (binding) {
      const handler = this.handlers.get(binding.action);
      if (handler) {
        if (this.options.preventDefault) {
          event.preventDefault();
        }
        if (this.options.stopPropagation) {
          event.stopPropagation();
        }

        handler(event);
      }
    }
  }

  private normalizeKey(binding: KeyBinding): string {
    const parts: string[] = [];

    if (binding.ctrl) parts.push('ctrl');
    if (binding.alt) parts.push('alt');
    if (binding.shift) parts.push('shift');
    if (binding.meta) parts.push('meta');

    parts.push(binding.key.toLowerCase());

    return parts.join('+');
  }

  private normalizeKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    if (event.metaKey) parts.push('meta');

    parts.push(event.key.toLowerCase());

    return parts.join('+');
  }

  private formatKey(key: string): string {
    const specialKeys: Record<string, string> = {
      ' ': 'Space',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'enter': '↵',
      'escape': 'Esc',
      'backspace': '⌫',
      'delete': 'Del',
      'tab': 'Tab',
    };

    return specialKeys[key.toLowerCase()] || key.toUpperCase();
  }

  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.isContentEditable
    );
  }
}

// Singleton instance
let instance: KeyboardManager | null = null;

export function getKeyboardManager(options?: KeyboardManagerOptions): KeyboardManager {
  if (!instance) {
    instance = new KeyboardManager(options);
  }
  return instance;
}
