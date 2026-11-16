/**
 * Domain types. These mirror the planned Supabase tables in
 * `supabase/schema.sql` (snake_case there, camelCase here).
 */

/** Where a task lives. "three" is today's priorities — never more than MAX_THREE. */
export type Bucket = "inbox" | "three" | "next" | "later" | "dropped" | "archived";

export type Project = {
  id: string;
  name: string;
  color: string;
};

export type Step = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  projectId: string | null;
  /** One line on why it matters — shown on the priority cards. */
  why?: string;
  estimateMins: number;
  bucket: Bucket;
  done: boolean;
  /** Sort order inside its bucket (lower first). */
  position: number;
  steps: Step[];
  /** Where it was captured from, e.g. "Quick capture" or "Parking lot". */
  source?: string;
  createdAt: string;
  completedAt: string | null;
};

export type FocalState = {
  tasks: Task[];
  projects: Project[];
};
