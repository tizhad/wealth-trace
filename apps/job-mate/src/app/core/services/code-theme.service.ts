import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type CodeThemeId =
  | 'github-dark-dimmed'
  | 'github-dark'
  | 'atom-one-dark'
  | 'tokyo-night-dark'
  | 'monokai'
  | 'atom-one-light';

export interface CodeTheme {
  readonly id: CodeThemeId;
  readonly label: string;
  readonly bg: string;
  readonly textColor: string;
  readonly isDark: boolean;
  readonly colors: readonly string[];
}

const STORAGE_KEY = 'pulse-code-theme';
const DEFAULT: CodeThemeId = 'github-dark-dimmed';

export const CODE_THEMES: readonly CodeTheme[] = [
  { id: 'github-dark-dimmed', label: 'GitHub Dimmed',  isDark: true,  bg: '#22272e', textColor: '#adbac7', colors: ['#79c0ff', '#a5d6ff', '#7ee787', '#ff7b72'] },
  { id: 'github-dark',        label: 'GitHub Dark',    isDark: true,  bg: '#0d1117', textColor: '#c9d1d9', colors: ['#79c0ff', '#a5d6ff', '#7ee787', '#ff7b72'] },
  { id: 'atom-one-dark',      label: 'Atom One Dark',  isDark: true,  bg: '#282c34', textColor: '#abb2bf', colors: ['#61afef', '#e5c07b', '#98c379', '#e06c75'] },
  { id: 'tokyo-night-dark',   label: 'Tokyo Night',    isDark: true,  bg: '#1a1b26', textColor: '#a9b1d6', colors: ['#7aa2f7', '#e0af68', '#9ece6a', '#f7768e'] },
  { id: 'monokai',            label: 'Monokai',         isDark: true,  bg: '#272822', textColor: '#f8f8f2', colors: ['#66d9e8', '#e6db74', '#a6e22e', '#f92672'] },
  { id: 'atom-one-light',     label: 'Atom One Light',  isDark: false, bg: '#fafafa', textColor: '#383a42', colors: ['#4078f2', '#986801', '#50a14f', '#e45649'] },
] as const;

@Injectable({ providedIn: 'root' })
export class CodeThemeService {
  private readonly doc = inject(DOCUMENT);

  readonly activeId = signal<CodeThemeId>(
    (this.doc.defaultView?.localStorage.getItem(STORAGE_KEY) as CodeThemeId | null) ?? DEFAULT,
  );

  readonly activeTheme = computed(
    () => CODE_THEMES.find(t => t.id === this.activeId()) ?? CODE_THEMES[0],
  );

  constructor() {
    this.apply(this.activeId());
  }

  setTheme(id: CodeThemeId): void {
    this.doc.defaultView?.localStorage.setItem(STORAGE_KEY, id);
    this.activeId.set(id);
    this.apply(id);
  }

  private apply(id: CodeThemeId): void {
    const theme = CODE_THEMES.find(t => t.id === id) ?? CODE_THEMES[0];
    const link = this.doc.getElementById('hljs-theme') as HTMLLinkElement | null;
    if (link) link.href = `/hljs-themes/${id}.css`;
    this.doc.documentElement.style.setProperty('--hljs-bg', theme.bg);
    this.doc.documentElement.style.setProperty('--hljs-text-color', theme.textColor);
    this.doc.documentElement.style.setProperty(
      '--hljs-border',
      theme.isDark ? 'rgba(255,255,255,0.08)' : 'var(--border)',
    );
  }
}
