import type { Bucket, FocalState, Project, Step, Task } from "./types";

export const SEED_PROJECTS: Project[] = [
  { id: "p-portfolio", name: "Portfolio site", color: "#D9431E" },
  { id: "p-job", name: "Job search", color: "#2F5BD3" },
  { id: "p-learning", name: "Learning", color: "#1F7A55" },
  { id: "p-home", name: "Home", color: "#9A7B1C" },
];

type SeedInput = {
  id: string;
  title: string;
  projectId: string;
  bucket: Bucket;
  position: number;
  estimateMins: number;
  why?: string;
  source?: string;
  steps?: [string, boolean][];
  hoursAgo?: number;
};

function makeTask(input: SeedInput, now: number): Task {
  const steps: Step[] = (input.steps ?? []).map(([text, done], i) => ({
    id: `${input.id}-s${i + 1}`,
    text,
    done,
  }));
  return {
    id: input.id,
    title: input.title,
    projectId: input.projectId,
    why: input.why,
    estimateMins: input.estimateMins,
    bucket: input.bucket,
    done: false,
    position: input.position,
    steps,
    source: input.source,
    createdAt: new Date(now - (input.hoursAgo ?? 24) * 3_600_000).toISOString(),
    completedAt: null,
  };
}

const SEED_TASKS: SeedInput[] = [
  // Today's three
  {
    id: "t-case-study",
    title: "Ship the case study page for the redesign project",
    projectId: "p-portfolio",
    bucket: "three",
    position: 0,
    estimateMins: 90,
    why: "Recruiters keep asking to see the process, not just final screens.",
    steps: [
      ["Outline: problem → process → outcome", true],
      ["Export the four before/after screens", true],
      ["Write “what I’d do differently”", false],
      ["Add alt text, then publish", false],
    ],
  },
  {
    id: "t-application",
    title: "Send the tailored application to Halden Studio",
    projectId: "p-job",
    bucket: "three",
    position: 1,
    estimateMins: 45,
    why: "Closes Friday, and the referral is waiting on it.",
    steps: [
      ["Adjust resume summary for the role", false],
      ["Write the cover note", false],
      ["Submit and tell the referrer", false],
    ],
  },
  {
    id: "t-generics",
    title: "Finish the TypeScript generics module",
    projectId: "p-learning",
    bucket: "three",
    position: 2,
    estimateMins: 60,
    why: "Unblocks the typed API in the tracker demo.",
  },

  // Next up
  { id: "t-recruiter", title: "Reply to the recruiter from Corvid Health", projectId: "p-job", bucket: "next", position: 0, estimateMins: 15, why: "Keeps the conversation warm while the role is open." },
  { id: "t-walkthrough", title: "Record a 60-second walkthrough of the tracker demo", projectId: "p-portfolio", bucket: "next", position: 1, estimateMins: 30, why: "A short video gets watched more often than a long write-up." },
  { id: "t-linkedin", title: "Update LinkedIn headline and featured section", projectId: "p-job", bucket: "next", position: 2, estimateMins: 20, why: "First thing a hiring manager checks." },
  { id: "t-sysdesign", title: "Practice two system-design prompts out loud", projectId: "p-learning", bucket: "next", position: 3, estimateMins: 45, why: "Interviews start next week." },
  { id: "t-dentist", title: "Book a dentist appointment", projectId: "p-home", bucket: "next", position: 4, estimateMins: 5, why: "Five minutes, then it stops nagging." },

  // Later
  { id: "t-about", title: "Retake the photo for the About page", projectId: "p-portfolio", bucket: "later", position: 0, estimateMins: 30 },
  { id: "t-supabase-auth", title: "Learn the Supabase auth flow", projectId: "p-learning", bucket: "later", position: 1, estimateMins: 60 },
  { id: "t-repos", title: "Archive old GitHub repos", projectId: "p-portfolio", bucket: "later", position: 2, estimateMins: 20 },
  { id: "t-blog", title: "Write a blog post about building Focal", projectId: "p-portfolio", bucket: "later", position: 3, estimateMins: 120 },
  { id: "t-desk", title: "Sort out the desk cables", projectId: "p-home", bucket: "later", position: 4, estimateMins: 30 },
  { id: "t-playwright", title: "Try Playwright for end-to-end tests", projectId: "p-learning", bucket: "later", position: 5, estimateMins: 60 },

  // Inbox (to triage)
  { id: "t-mobile-nav", title: "Fix the mobile nav overflow on the portfolio site", projectId: "p-portfolio", bucket: "inbox", position: 0, estimateMins: 30, source: "Quick capture", hoursAgo: 10 },
  { id: "t-reference", title: "Ask Dana for a reference letter", projectId: "p-job", bucket: "inbox", position: 1, estimateMins: 10, source: "From email", hoursAgo: 8 },
  { id: "t-readme", title: "Write the README for the task tracker repo", projectId: "p-portfolio", bucket: "inbox", position: 2, estimateMins: 40, source: "Quick capture", hoursAgo: 6 },
  { id: "t-library", title: "Renew library card", projectId: "p-home", bucket: "inbox", position: 3, estimateMins: 10, source: "Phone", hoursAgo: 4 },
  { id: "t-talk", title: "Watch the conference talk on design tokens", projectId: "p-learning", bucket: "inbox", position: 4, estimateMins: 45, source: "Link saved", hoursAgo: 3 },
  { id: "t-conflict", title: "Prep a story for “tell me about a conflict”", projectId: "p-job", bucket: "inbox", position: 5, estimateMins: 30, source: "Quick capture", hoursAgo: 1 },
];

export function createSeed(): FocalState {
  const now = Date.now();
  return {
    projects: SEED_PROJECTS,
    tasks: SEED_TASKS.map((t) => makeTask(t, now)),
  };
}
