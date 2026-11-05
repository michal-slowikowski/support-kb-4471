<script lang="ts">
  import { problemsIn, mergedInto, type Problem } from '#lib/kb/problems';

  // A count for prose: <ProblemCount ticket={4471} problem="hint" />, or the whole ticket without `problem`.
  let { ticket, problem }: { ticket: number; problem?: Problem } = $props();

  const n = $derived(
    problem ? (problemsIn(ticket).find((g) => g.problem === problem)?.reports.length ?? 0) : mergedInto(ticket).length,
  );
</script>

<strong>{n}</strong>
