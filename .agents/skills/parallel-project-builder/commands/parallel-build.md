<!--
  Install: copy this file into your project's .claude/commands/ folder, e.g.
    cp parallel-build.md .claude/commands/parallel-build.md
  Then run it in Claude Code as:
    /parallel-build Build a REST API with auth, billing, and notifications
-->
---
description: Decompose a large coding project into independent pieces, build them with parallel sub-agents, and integrate them error-free. Works in any language/stack.
---

You are starting the **parallel-project-builder** workflow for this project:

$ARGUMENTS

Follow the `parallel-project-builder` skill exactly:

1. **Scope and contract first.** Map every file/module involved, write down the exact shared interfaces (function signatures, API routes, schemas, types, config keys) that more than one piece will depend on, build a dependency graph marking which subtasks are independent vs sequential, and define an exact verification command (test/build/lint) for each subtask.
2. **Write one self-contained task brief per sub-agent**, each with: its file scope, the shared contract pasted in full, the task itself, the verification command it must pass, and the report format you expect back.
3. **Launch independent sub-agents in parallel** (single message, multiple `Task` calls), and run dependent ones afterward using their predecessors' *real* output rather than the planned interface.
4. **Verify each result yourself** before accepting it: confirm it stayed in scope, rerun its verification command, and check it didn't silently change a shared interface (if it did, propagate that change to every other affected brief before continuing).
5. **Integrate and run the full project test/build suite yourself**, fix any integration-level issues, and report back: what ran in parallel, what ran sequentially, any contract deviations, and the final pass/fail status.

If sub-agents aren't available in this environment, do the same five steps yourself in order rather than skipping the contract/verification discipline.

Start with step 1 now: ask the user any blocking questions needed to scope the project, then propose the file map, contracts, and dependency graph before spawning any sub-agents.
