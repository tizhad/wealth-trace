import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Subject,
  Company,
  Application,
  SubjectStatus,
  CompanyStatus,
  QA,
} from '../models/jobmate.models';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class StateService {
  private readonly storage = inject(StorageService);

  readonly subjects = signal<Subject[]>(
    this.storage.load<Subject[]>('subjects') ?? [],
  );

  readonly companies = signal<Company[]>(
    this.storage.load<Company[]>('companies') ?? [],
  );

  readonly applications = signal<Application[]>(
    this.storage.load<Application[]>('applications') ?? [],
  );

  readonly streak = signal<number>(this.storage.load<number>('streak') ?? 7);

  /* ── Computed stats ──────────────────────────────────────────────────────── */

  readonly doneCount = computed(
    () => this.subjects().filter((s) => s.status === 'mastered').length,
  );

  readonly inProgressCount = computed(
    () => this.subjects().filter((s) => s.status === 'in_progress').length,
  );

  readonly toDoCount = computed(
    () => this.subjects().filter((s) => s.status === 'not_started').length,
  );

  readonly totalSubjects = computed(() => this.subjects().length);

  readonly progressPercent = computed(() =>
    Math.round((this.doneCount() / (this.totalSubjects() || 1)) * 100),
  );

  readonly todaysFocus = computed(() =>
    [...this.subjects()].filter((s) => s.status !== 'mastered').slice(0, 5),
  );

  readonly recentApplications = computed(() =>
    [...this.applications()].slice(0, 5),
  );

  readonly pipelineCounts = computed(() => {
    const apps = this.applications();
    return {
      applied: apps.filter((a) => a.status === 'applied').length,
      phoneScreen: apps.filter((a) => a.status === 'phone-screen').length,
      interviewing: apps.filter((a) => a.status === 'interviewing').length,
      offer: apps.filter((a) => a.status === 'offer').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      noReply: apps.filter((a) => a.status === 'saved').length,
    };
  });

  readonly applicationsByStatus = computed(() => {
    const apps = this.applications();
    return {
      saved: apps.filter((a) => a.status === 'saved'),
      applied: apps.filter((a) => a.status === 'applied'),
      phoneScreen: apps.filter((a) => a.status === 'phone-screen'),
      interviewing: apps.filter((a) => a.status === 'interviewing'),
      offer: apps.filter((a) => a.status === 'offer'),
      rejected: apps.filter((a) => a.status === 'rejected'),
    };
  });

  constructor() {
    effect(() => this.storage.save('subjects', this.subjects()));
    effect(() => this.storage.save('companies', this.companies()));
    effect(() => this.storage.save('applications', this.applications()));
    effect(() => this.storage.save('streak', this.streak()));
  }

  /* ── Mutations ───────────────────────────────────────────────────────────── */

  addSubject(subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): void {
    const id = `subject-${Date.now()}`;
    const now = new Date();
    this.subjects.update((list) => [{ id, ...subject, createdAt: now, updatedAt: now }, ...list]);
  }

  setSubjectStatus(id: string, status: SubjectStatus): void {
    this.subjects.update((list) =>
      list.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  updateSubject(id: string, patch: Partial<Subject>): void {
    this.subjects.update((list) =>
      list.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: new Date() } : s)),
    );
  }

  addQA(subjectId: string, qa: QA): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId ? { ...s, qa: [...s.qa, qa] } : s,
      ),
    );
  }

  removeQA(subjectId: string, index: number): void {
    this.subjects.update((list) =>
      list.map((s) =>
        s.id === subjectId
          ? { ...s, qa: s.qa.filter((_, i) => i !== index) }
          : s,
      ),
    );
  }

  addApplication(app: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): void {
    const id = `app-${Date.now()}`;
    const now = new Date();
    this.applications.update((list) => [{ id, ...app, createdAt: now, updatedAt: now }, ...list]);
  }

  setCompanyStatus(id: string, status: CompanyStatus): void {
    this.companies.update((list) =>
      list.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

}
