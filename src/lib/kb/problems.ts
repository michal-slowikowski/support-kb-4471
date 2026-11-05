// The problems inside a merged ticket. causes.ts places a report by its tenant; desk-notes.json
// lists the reports whose bodies describe a one-day move, not a day/month swap. Those are their
// own problem, so they come out of whatever cause their tenant would give them.
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

export function problemOf(r: Report, shifted: readonly string[] = notes.oneDayMove): Problem {
  if (shifted.includes(r.id)) return 'shift';
  return causeOf(r, tenantOf(r)) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
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

export function problemsIn(ticket: number): ProblemGroup[] {
  const by = new Map<Problem, Report[]>();
  for (const r of mergedInto(ticket)) by.set(problemOf(r), [...(by.get(problemOf(r)) ?? []), r]);
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: tally(rs, (r) => r.channel),
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}

// Rows in the export, before one id = one report.
export const exportedRows = (ticket: number) => (reports as Report[]).filter((r) => r.mergedInto === ticket).length;
