import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsStore } from '../../core/stores/settings.store';
import { AuthService } from '../../core/services/auth.service';
import type { UserSettings } from '../../core/models/jobmate.models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  readonly settingsStore = inject(SettingsStore);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly displayName = signal(this.settingsStore.settings()?.displayName ?? '');

  readonly accents: { key: UserSettings['accent']; label: string; color: string }[] = [
    { key: 'indigo', label: 'Indigo', color: '#6C5CE7' },
    { key: 'coral',  label: 'Coral',  color: '#FF7B54' },
    { key: 'mint',   label: 'Mint',   color: '#00BFA5' },
  ];

  async saveDisplayName(): Promise<void> {
    await this.settingsStore.upsert({ displayName: this.displayName() ?? null });
  }

  async setAccent(key: UserSettings['accent']): Promise<void> {
    await this.settingsStore.upsert({ accent: key });
  }

  initial(): string {
    const name = this.settingsStore.settings()?.displayName ?? this.auth.user()?.email ?? '?';
    return name.charAt(0).toUpperCase();
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/auth']);
  }
}
