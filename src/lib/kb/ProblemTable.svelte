<script lang="ts">
  import { PROBLEMS, problemsIn, mergedInto, exportedRows, type Problem } from '#lib/kb/problems';

  // issues: problem → its own ticket, where it was filed.
  let { ticket, repo, issues }: { ticket: number; repo: string; issues: Partial<Record<Problem, number>> } = $props();

  const groups = $derived(problemsIn(ticket));
  const total = $derived(mergedInto(ticket).length);
  const rows = $derived(exportedRows(ticket));
  const list = (n: Record<string, number>) =>
    Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ×${v}`).join(' · ');
</script>

<p class="sum">
  <strong>{total}</strong> reports merged into #{ticket} ({rows} rows in the export, {rows - total} exported twice) ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'}
</p>
<p class="small">Counted with the desk's view, as exported: each report under the cause its tenant gives it. One-day moves stay counted where they are filed and get their own row and ticket.</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>channels</th><th>intake tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code> {PROBLEMS[g.problem]}</td>
        <td><strong>{g.reports.length}</strong>{#if g.filedUnder}<span class="small"> (in {g.filedUnder})</span>{/if}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td>{g.tenants}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}<a href="{repo}/issues/{issues[g.problem]}">#{issues[g.problem]}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr><td>total</td><td><strong>{groups.filter((g) => !g.filedUnder).reduce((n, g) => n + g.reports.length, 0)}</strong></td><td colspan="5"></td></tr>
  </tfoot>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
