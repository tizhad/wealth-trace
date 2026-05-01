import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StateService } from '../../core/services/state.service';
import { Application, AppStatus } from '../../core/models/jobmate.models';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationsComponent {
  readonly state = inject(StateService);

  readonly columns: { key: string; label: string }[] = [
    { key: 'saved', label: 'Saved' },
    { key: 'applied', label: 'Applied' },
    { key: 'phoneScreen', label: 'Phone screen' },
    { key: 'interviewing', label: 'Interviewing' },
    { key: 'offer', label: 'Offer 🎉' },
    { key: 'rejected', label: 'Rejected' },
  ];

  colApps(key: string): Application[] {
    return (
      (this.state.applicationsByStatus() as Record<string, Application[]>)[
        key
      ] ?? []
    );
  }

  colClass(key: string): string {
    const map: Record<string, string> = {
      saved: 'col-saved',
      applied: 'col-applied',
      phoneScreen: 'col-phone',
      interviewing: 'col-interview',
      offer: 'col-offer',
      rejected: 'col-rejected',
    };
    return map[key] ?? '';
  }

  initial(company: string): string {
    return company.charAt(0).toUpperCase();
  }

  statusClass(status: AppStatus): string {
    const map: Record<AppStatus, string> = {
      saved: 'pipe-saved',
      applied: 'pipe-applied',
      'phone-screen': 'pipe-phone',
      interviewing: 'pipe-interview',
      offer: 'pipe-offer',
      rejected: 'pipe-rejected',
    };
    return map[status];
  }
}
