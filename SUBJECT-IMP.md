# Study Subjects Feature

## Overview
Build a study tracker feature backed by Supabase (PostgreSQL). Full rich-text notes via Tiptap, spaced repetition via confidence scoring, and a relational schema with proper FK constraints.

---

## Database — Supabase

### Rules that apply to ALL tables
- Use `uuid` primary keys, auto-generated via `gen_random_uuid()`
- Add `updated_at timestamptz` to every table
- Create a Postgres trigger on every table that sets `updated_at = now()` automatically on UPDATE
- Enable Row Level Security (RLS) on every table
- RLS policy: `user_id = auth.uid()` — users can only access their own rows
- Use `snake_case` for all column names
- Generate TypeScript types via `supabase gen types typescript` — never hand-write DB row types

---

### Tables

#### `study_subjects`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key, default `gen_random_uuid()` |
| `user_id` | `uuid` | FK → `auth.users`, not null |
| `title` | `text` | not null |
| `summary` | `text` | nullable — plain text overview |
| `category` | `text` | not null — see category values below |
| `priority` | `text` | not null — see priority values below |
| `status` | `text` | not null, default `'not_started'` |
| `confidence_score` | `int2` | 1–5, default 1 |
| `estimated_read_time` | `int4` | minutes, nullable |
| `tags` | `text[]` | default `'{}'` |
| `source_url` | `text` | nullable — where you found this subject |
| `ai_summary` | `text` | nullable — reserved for future AI feature |
| `interviewed_on` | `timestamptz[]` | default `'{}'` — dates this was used in an interview |
| `last_reviewed_at` | `timestamptz` | nullable |
| `next_review_at` | `timestamptz` | nullable — calculated by spaced repetition logic |
| `is_archived` | `bool` | not null, default `false` — soft delete |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | managed by trigger |

#### `subject_relations` *(junction table — replaces `related_subject_ids uuid[]`)*
| Column | Type | Notes |
|---|---|---|
| `subject_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| `related_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| — | — | PRIMARY KEY (`subject_id`, `related_id`) |
| — | — | CHECK `subject_id != related_id` (no self-relations) |

> **Why a junction table, not `uuid[]`?** A Postgres array has no FK constraint — orphaned UUIDs accumulate silently. The junction table gives you real referential integrity and proper CASCADE behaviour.

#### `subject_companies`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `subject_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users` |
| `name` | `text` | not null — e.g. "Adyen" |
| `frequency` | `text` | not null — `once / often / always` |
| `notes` | `text` | nullable |

#### `subject_notes`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `subject_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users` |
| `content` | `jsonb` | not null — **Tiptap ProseMirror JSON document** (not markdown, not HTML) |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | managed by trigger |

> **Why jsonb, not text?** Tiptap's `editor.getJSON()` returns a structured ProseMirror document object. Storing as `jsonb` keeps it queryable (e.g. search inside `content`), avoids XSS risks of raw HTML, and is format-stable across Tiptap upgrades. On load, pass the parsed object to `editor.commands.setContent(json)`.

#### `subject_code_samples`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `subject_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users` |
| `title` | `text` | not null |
| `language` | `text` | not null — `typescript / javascript / html / css / python / sql / bash / json` |
| `code` | `text` | not null |
| `description` | `text` | nullable |
| `created_at` | `timestamptz` | default `now()` |

> **Code samples vs Tiptap code blocks:** Tiptap notes can contain inline code blocks (flow context). Code samples are standalone, titled, language-tagged snippets for quick reference. They serve different purposes — make this distinction clear in the UI.

#### `subject_resources`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `subject_id` | `uuid` | FK → `study_subjects(id)` ON DELETE CASCADE |
| `user_id` | `uuid` | FK → `auth.users` |
| `title` | `text` | not null |
| `url` | `text` | not null |
| `type` | `text` | not null — `article / video / docs / github / podcast` |
| `read` | `boolean` | not null, default `false` |

---

### Full migration tables *(companies, applications, settings)*

#### `companies`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | FK → `auth.users`, not null |
| `name` | `text` | not null |
| `category` | `text` | not null |
| `status` | `text` | not null, default `'saved'` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | managed by trigger |

> `linkedSubjects` and `applications` from the old model are **computed counts** — derived in Angular via `computed()`, not stored columns. Storing them would cause sync drift.

#### `applications`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | FK → `auth.users`, not null |
| `title` | `text` | not null |
| `company` | `text` | not null |
| `date` | `date` | not null |
| `location` | `text` | nullable |
| `status` | `text` | not null, default `'saved'` |
| `salary` | `text` | nullable |
| `tags` | `text[]` | default `'{}'` |
| `created_at` | `timestamptz` | default `now()` |
| `updated_at` | `timestamptz` | managed by trigger |

#### `user_settings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | primary key |
| `user_id` | `uuid` | FK → `auth.users`, UNIQUE, not null |
| `display_name` | `text` | nullable |
| `accent` | `text` | not null, default `'indigo'` |
| `updated_at` | `timestamptz` | managed by trigger |

> Single row per user. Upsert on `user_id`. No `created_at` needed — it's created on first login.

---

### Supabase Storage — image uploads

Tiptap notes support images. Binary files cannot live in Postgres text/jsonb.

**Setup:**
- Create a Supabase Storage bucket: `subject-images` (public)
- RLS: only the owner (`user_id = auth.uid()`) can upload/delete; public read for display

**Upload flow (in Angular):**
1. User inserts image in Tiptap editor → triggers a file upload handler
2. Upload file to `supabase.storage.from('subject-images').upload(path, file)`
3. Get public URL: `supabase.storage.from('subject-images').getPublicUrl(path)`
4. Insert a Tiptap image node with `editor.chain().setImage({ src: publicUrl }).run()`
5. The URL is now embedded in the ProseMirror JSON — no separate `images` table needed

**Path convention:** `{userId}/{subjectId}/{uuid}.{ext}` — scoped to user and subject for easy cleanup.

---

## Enum values (validated in app, not enforced by Postgres)

### `SubjectStatus`
`not_started` | `in_progress` | `needs_review` | `confident` | `mastered`

### `SubjectPriority`
`critical` | `high` | `medium` | `low`

### `SubjectCategory`
`angular` | `react` | `javascript` | `typescript` | `performance` | `testing` | `accessibility` | `system_design` | `css` | `soft_skills`

### `CompanyStatus`
`saved` | `applied` | `interviewing` | `offer` | `rejected` | `no_reply`

### `AppStatus`
`saved` | `applied` | `phone_screen` | `interviewing` | `offer` | `rejected`

---

## Angular — conventions and requirements

### Naming convention
- Supabase returns `snake_case` column names
- Map ALL properties to `camelCase` in Angular models
- Create a mapper function per entity: `Supabase row → Angular model`
- Use types generated by `supabase gen types typescript` as the source of truth for row shapes
- Example: `confidence_score` → `confidenceScore`, `created_at` → `createdAt`

### Angular models (camelCase)

```typescript
// Tiptap ProseMirror JSON — use JSONContent from @tiptap/core
import type { JSONContent } from '@tiptap/core';

interface StudySubject {
  id: string;
  userId: string;
  title: string;
  summary: string | null;
  category: SubjectCategory;
  priority: SubjectPriority;
  status: SubjectStatus;
  confidenceScore: number;        // 1–5
  estimatedReadTime: number | null;
  tags: string[];
  sourceUrl: string | null;
  aiSummary: string | null;
  interviewedOn: Date[];
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  // joined relations (loaded with subject)
  companies: CompanyTag[];
  notes: StudyNote[];
  codeSamples: CodeSample[];
  resources: Resource[];
}

interface CompanyTag {
  id: string;
  subjectId: string;
  name: string;
  frequency: 'once' | 'often' | 'always';
  notes: string | null;
}

interface StudyNote {
  id: string;
  subjectId: string;
  content: JSONContent;  // Tiptap ProseMirror JSON — NOT a string
  createdAt: Date;
  updatedAt: Date;
}

interface CodeSample {
  id: string;
  subjectId: string;
  title: string;
  language: 'typescript' | 'javascript' | 'html' | 'css' | 'python' | 'sql' | 'bash' | 'json';
  code: string;
  description: string | null;
  createdAt: Date;
}

interface Resource {
  id: string;
  subjectId: string;
  title: string;
  url: string;
  type: 'article' | 'video' | 'docs' | 'github' | 'podcast';
  read: boolean;
}

// Full migration models
interface Company {
  id: string;
  userId: string;
  name: string;
  category: string;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  // derived in Angular — NOT stored
  linkedSubjectsCount: number;
  applicationsCount: number;
}

interface Application {
  id: string;
  userId: string;
  title: string;
  company: string;
  date: Date;
  location: string | null;
  status: AppStatus;
  salary: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserSettings {
  id: string;
  userId: string;
  displayName: string | null;
  accent: 'indigo' | 'coral' | 'mint';
  updatedAt: Date;
}
```

---

## Angular store — signal-based

Use Angular 21 Signals. No NgRx. No BehaviorSubject.

### `StudyStore` must expose

#### State signals
- `subjects` — `signal<StudySubject[]>([])`
- `filters` — `signal<StudyFilters>({ category: null, status: null, priority: null, company: null, search: '' })`
- `loading` — `signal<boolean>(false)`
- `activeSubjectId` — `signal<string | null>(null)`

#### Computed signals
- `activeSubject` — `computed()` finds subject by `activeSubjectId`
- `filtered` — applies all filters + search to subjects
- `byPriority` — groups filtered subjects by priority
- `stats` — `{ total, mastered, inProgress, notStarted, critical, avgConfidence, dueForReview }`

#### Mutations
- `load()` — fetch all subjects + relations from Supabase, populate signal
- `add(subject)` — optimistic insert + Supabase write
- `update(id, patch)` — optimistic update + Supabase write, sets `updatedAt`
- `updateStatus(id, status)` — shorthand
- `updateConfidence(id, score)` — updates score, `lastReviewedAt`, `nextReviewAt`
- `archive(id)` — sets `isArchived = true` (soft delete)
- `addNote(subjectId, content: JSONContent)` — insert into `subject_notes`
- `updateNote(noteId, content: JSONContent)` — update note
- `deleteNote(noteId)` — delete note
- `addCodeSample(subjectId, sample)` — insert into `subject_code_samples`
- `addResource(subjectId, resource)` — insert into `subject_resources`
- `toggleResourceRead(resourceId)` — flip `read` boolean
- `addCompany(subjectId, company)` — insert into `subject_companies`
- `removeCompany(companyTagId)` — delete company tag
- `addRelation(subjectId, relatedId)` — insert into `subject_relations`
- `removeRelation(subjectId, relatedId)` — delete from `subject_relations`
- `setActive(id)` — sets `activeSubjectId`
- `setFilter(patch)` — partial update to filters signal
- `uploadImage(file, subjectId)` — upload to Supabase Storage, return public URL

### `StudyFilters` shape
```typescript
interface StudyFilters {
  category: SubjectCategory | null;
  status: SubjectStatus | null;
  priority: SubjectPriority | null;
  company: string | null;
  search: string;
}
```

---

## Spaced repetition logic

When `updateConfidence(id, score)` is called:
1. Update `confidence_score`
2. Set `last_reviewed_at = now()`
3. Calculate and set `next_review_at`:

| Confidence score | Days until next review |
|---|---|
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |
| 5 | 30 days |

---

## Optimistic update pattern

All mutations follow this pattern to keep the UI snappy:

```typescript
async add(subject: Omit<StudySubject, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  // 1. Optimistic: update signal immediately
  const tempId = crypto.randomUUID();
  const optimistic = { ...subject, id: tempId, createdAt: new Date(), updatedAt: new Date() };
  this.subjects.update(list => [optimistic, ...list]);

  // 2. Persist: write to Supabase
  const { data, error } = await this.supabase.from('study_subjects').insert(toRow(subject)).select().single();

  if (error) {
    // 3a. Rollback on failure
    this.subjects.update(list => list.filter(s => s.id !== tempId));
    throw error;
  }
  // 3b. Replace temp with real DB row
  this.subjects.update(list => list.map(s => s.id === tempId ? fromRow(data) : s));
}
```

---

## What to generate

1. SQL migration file — all tables, triggers, RLS policies, `subject_relations` junction table
2. Supabase Storage bucket setup (SQL or dashboard instructions)
3. Angular model interfaces with camelCase properties + `JSONContent` for note content
4. Mapper functions — Supabase row → Angular model for each entity
5. `SupabaseService` — wraps all DB + Storage calls, handles errors, uses generated types
6. `StudyStore` — Signals + Supabase JS client v2, optimistic updates
7. Full migration of existing `StateService` (companies, applications, settings) to Supabase
8. Image upload handler for Tiptap (file → Supabase Storage → public URL → Tiptap image node)

---

## Tech stack
- Angular 21, Zoneless, Standalone components, `ChangeDetectionStrategy.OnPush`
- Supabase JS client v2 (`@supabase/supabase-js`)
- Tiptap rich text editor (`@tiptap/core` + extensions) — notes stored as `JSONContent`
- No NgRx, no BehaviorSubject — Signals only
- `snake_case` in DB, `camelCase` in Angular — always mapped via generated types
- Supabase Storage for image uploads
