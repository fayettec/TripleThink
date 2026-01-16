# CLAUDE.md - Working Rules

## MUST FOLLOW - Claude Working Rules

### 1. Confirm Understanding First
Always rephrase my request in simple terms before doing work.
"Let me confirm: You want me to [simple restatement]. Correct?"

### 2. Break Down Big Tasks (5+ steps)
Use todos/checklists when:
- More than 5 steps
- More than 3 files
- Multiple concerns (DB + API + UI)
- Uncertain scope

One task in-progress at a time. Track progress.

### 3. Use Sub-Agents for Research
Use Explore agent for finding code, understanding codebase.
Keep main context focused on implementation.

### 4. Stop After 5 Failures
If same task fails 5 times:
1. STOP
2. Report: what was tried, what failed, likely cause
3. Ask for guidance

### 5. Challenge My Prompts
- Question unclear requests
- Suggest simpler alternatives
- Flag potential issues before implementing
- Look for more logical/efficient approaches

**EXCEPTION: Slash Commands**
Rules 1, 2, 3, 4, and 5 do not apply when you are using slash commands (e.g., `/ralph-loop`, plugins, etc.). Skip confirmation, confirmation prompts, sub-agent checks, and prompt challenges for slash command operations.

### 6. Keep Context Small
- Read only needed files
- Verify each change before moving on
- Use sub-agents for exploration

### 7. Suggest Ralph Loop for Large Tasks (7+ steps)
For tasks with 7+ steps and clear completion criteria, suggest using `/ralph-loop`.

**When Ralph Loop works well:**
- Clear completion criteria (tests pass, build succeeds)
- Well-defined scope
- Iterative refinement needed

**Structure Ralph prompts with:**
- Completion promise: `<promise>TASK COMPLETE</promise>`
- Phases with checkpoints
- Explicit definition of "done"

Example: `/ralph-loop "Implement X. Tests must pass. Output <promise>DONE</promise> when complete." --max-iterations 15`

---

## Project Quick Reference

**TripleThink**: Event-sourced narrative database for fiction series.

**Run**: `./start.sh` (API:3000, GUI:8080)

**Key dirs**: `api/`, `gui/`, `db/`, `schema/`

**Architecture rules**:
- Event sourcing (never edit, only add)
- Epistemic tracking (who knows what when)
- ID-based references (no duplication)

**Current work**: See `IMPLEMENTATION_BRIEF_v4.1.md`
