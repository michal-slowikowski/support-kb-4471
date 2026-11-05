// The problems inside a merged ticket, counted with the desk's own view: causes.ts places every
// report by its tenant (groupByCause, as CauseTable does). desk-notes.json lists the reports whose
// bodies describe a one-day move, not a day/month swap. They are a problem of their own, but the
// desk counts them where they are filed (readAs) — so the `shift` row is a subset, not extra.
import reports from '#lib/data/reports-4471.json';
import notes from '#lib/data/desk-notes.json';
import { causeOf, uniqueById, type Report } from '#lib/kb/causes';
import { tenantOf } from '#lib/kb/locales';

export type Problem = 'parser' | 'hint' | 'shift' | 'unplaced';

export const PROBLEMS: Record<Problem, string> = {
  parser: 'shared parser reads day-first dates month first',
  hint: 'booking-v3 form hint says MM/DD/YYYY',
  shift: 'booking moves by one day (timezone)',
  unplaced: 'no tenant on file',
};

export function problemOf(r: Report): Problem {
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  // Set on the `shift` row: the cause these reports are counted under.
  filedUnder?: Problem;
  tenants: number;
  channels: Record<string, number>;
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

export function mergedInto(ticket: number): Report[] {
  return uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket);
}

function group(problem: Problem, rs: Report[], filedUnder?: Problem): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs,
    filedUnder,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: tally(rs, (r) => r.channel),
    taggedAs: tally(rs, (r) => r.meta.intakeTag),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

// Desk causes first (they add up to the ticket), then the one-day moves, footnoted under their cause.
export function problemsIn(ticket: number, shifted: readonly string[] = notes.oneDayMove): ProblemGroup[] {
  const by = new Map<Problem, Report[]>();
  for (const r of mergedInto(ticket)) by.set(problemOf(r), [...(by.get(problemOf(r)) ?? []), r]);
  const causes = [...by.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.reports.length - a.reports.length);
  const moved = mergedInto(ticket).filter((r) => shifted.includes(r.id));
  if (!moved.length) return causes;
  const under = [...new Set(moved.map(problemOf))];
  return [...causes, group('shift', moved, under.length === 1 ? under[0] : undefined)];
}

// Rows in the export, before one id = one report.
export const exportedRows = (ticket: number) => (reports as Report[]).filter((r) => r.mergedInto === ticket).length;
