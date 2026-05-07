import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../models/database.types';

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly isConfigured: boolean;
  readonly client: SupabaseClient<Database>;

  constructor() {
    const { url, anonKey } = environment.supabase;
    this.isConfigured = isValidUrl(url) && anonKey.length > 10;

    if (this.isConfigured) {
      this.client = createClient<Database>(url, anonKey);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[JobMate] Supabase not configured.\n' +
        'Open apps/job-mate/src/environments/environment.ts and replace\n' +
        'YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with your project credentials.',
      );
      this.client = null as unknown as SupabaseClient<Database>;
    }
  }

  get from() {
    return this.client.from.bind(this.client);
  }

  get storage() {
    return this.client.storage;
  }

  get auth() {
    return this.client.auth;
  }
}
