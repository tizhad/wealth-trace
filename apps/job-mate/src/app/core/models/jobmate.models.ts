export type SubjectStatus = 'in-progress' | 'done' | 'to-do';
export type SubjectPriority = 'critical' | 'medium' | 'low';

export type CompanyStatus =
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'rejected'
  | 'no-reply';

export type AppStatus =
  | 'saved'
  | 'applied'
  | 'phone-screen'
  | 'interviewing'
  | 'offer'
  | 'rejected';

export interface Subject {
  id: string;
  name: string;
  qaCount: number;
  companies: string[];
  status: SubjectStatus;
  priority: SubjectPriority;
  potential: number;
}

export interface Company {
  id: string;
  name: string;
  category: string;
  status: CompanyStatus;
  linkedSubjects: number;
  applications: number;
}

export interface Application {
  id: string;
  title: string;
  company: string;
  date: string;
  location: string;
  status: AppStatus;
  salary?: string;
  tags?: string[];
}

export interface UserSettings {
  displayName: string;
  email: string;
  accent: 'indigo' | 'coral' | 'mint';
}
