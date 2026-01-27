/**
 * Shortcuts Module
 * 
 * Exports all keyboard shortcut functionality.
 */

export { KeyboardManager, getKeyboardManager } from './KeyboardManager.js';
export type { KeyBinding, KeyboardManagerOptions } from './KeyboardManager.js';

export { 
  defaultBindings, 
  getBindingsByCategory, 
  getCategories, 
  findBindingByAction,
  formatBinding,
} from './bindings.js';
