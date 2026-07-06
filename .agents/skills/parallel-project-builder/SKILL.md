---
name: parallel-project-builder
description: Use this skill whenever the user wants to build, implement, refactor, or ship a large or multi-part coding project — anything spanning multiple files, modules, services, or features — and wants it done quickly with multiple sub-agents working at once, without merge conflicts or integration bugs. Trigger this for requests like "build me a full app", "implement these features", "refactor this whole codebase", "split this into parallel tasks", "use sub-agents for this", or any mention of multi-agent, parallel agents, or divide-and-conquer coding work. Also trigger when the user wants a slash command that delegates a coding task to several sub-agents in parallel. Works for any programming language or stack — the decomposition method is language-agnostic.
---

# Parallel Project Builder

Split one big coding project into independent pieces, hand each piece to its own sub-agent, run them in parallel where safe, and merge the results without breaking anything.

Use Claude Code's `Task` tool to spawn sub-agents (`subagent_type: general-purpose` unless a more specific type fits).

## The five-phase workflow

### Phase 1 — Scope and contract first (do this yourself, don't delegate it)

Before spawning anyone, nail down the things that cause integration errors if left ambiguous:

1. **File/module map** — list every file or module that will be touched or created.
2. **Interfaces** — for anything two pieces share (function signatures, API routes, data schemas, types/interfaces, env vars, config keys), write the exact signature down *now*. This is the contract every sub-agent will be given verbatim. Most integration bugs come from two agents independently guessing the same interface differently — fix that by not letting them guess.
3. **Dependency graph** — mark which subtasks are independent (safe to parallelize) and which depend on another subtask's output (must run sequentially, or the dependency must be stubbed first).
4. **Definition of done** per subtask — the exact command that proves it works (e.g. `npm test -- auth.spec.ts`, `pytest tests/test_billing.py`, `go build ./...`).

If the project is small enough that this whole phase takes longer than just doing the work, skip the skill and do it directly — don't force decomposition on a one-file task.

### Phase 2 — Write one task brief per sub-agent

Each sub-agent gets a self-contained brief, since it won't see the rest of the conversation. Always include:

- **Scope**: exactly which files it may create/edit (and a note that it must not touch files outside this list).
- **Contract**: the shared interfaces from Phase 1, pasted in full.
- **Task**: what to build/change.
- **Verification command**: the exact test/build/lint command it must run and pass before reporting done.
- **Report format**: ask it to return a short summary of files changed, the verification command's output, and any deviation it had to make from the brief (e.g. if it had to change a shared interface — flag this loudly, since it affects other agents).

Keep each brief tight enough that the sub-agent can succeed without asking follow-up questions.

### Phase 3 — Run sub-agents

- Independent subtasks (per the dependency graph): launch their `Task` calls together in a single message so they run in parallel.
- Dependent subtasks: run after their prerequisite finishes, and pass that agent's actual output (real function signatures, real file paths) into the next brief instead of the planned ones — reality wins over the plan.
- Cap parallel agents at roughly 4-6 at a time for a project of meaningful size; more than that gets hard to review and merge.

### Phase 4 — Verification gate (per agent, before merging anything)

For each sub-agent's result, before accepting it:

1. Confirm it only touched files in its assigned scope.
2. Run its stated verification command yourself if you can — don't just trust the self-report.
3. Check it didn't quietly change a shared interface. If it did, this is the highest-priority thing to handle: either fix the deviation, or propagate the change to every other sub-agent brief that depends on that interface before continuing.

Reject and re-brief any sub-agent whose work fails verification or breaks contract — don't carry a known-broken piece into integration hoping it'll work out.

### Phase 5 — Integration pass (do this yourself)

1. Merge all pieces.
2. Run the full project build/test suite, not just per-piece tests — this catches the errors that only show up when pieces meet.
3. Fix integration-level issues (wiring, imports, config) yourself; these are usually small once each piece is individually correct.
4. Run a final end-to-end check (build, full test suite, and a smoke run if applicable) and report results to the user, including which subtasks ran in parallel vs sequentially and any contract deviations that came up.

## Operating in environments without sub-agents

If `Task` (or an equivalent sub-agent tool) isn't available, don't fake parallelism. Instead, work through the same Phase 1 decomposition, then complete each subtask yourself in the planned order, running each one's verification command before moving to the next. The contract-first discipline is what prevents errors either way — sub-agents just make pieces faster, not safer by themselves.

## Slash command

A ready-to-use Claude Code slash command for this workflow is bundled at `commands/parallel-build.md`. Installing it (see that file's header comment for the one-line copy command) gives the user `/parallel-build <project description>` to kick off this exact workflow directly.
