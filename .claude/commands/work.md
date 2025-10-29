---
allowed-tools: all
description: Execute production-quality implementation
---

# Production Implementation

Implement: $ARGUMENTS

## Required Workflow

1. **Research** - "Let me research the codebase and create a plan before implementing"
2. **Plan** - Present approach for validation
3. **Implement** - Build with continuous validation

For complex architecture decisions: "Let me think about this architecture"

For tasks with independent parts: Spawn multiple agents in parallel

## Implementation Standards

### Code Evolution
- Replace old code entirely when refactoring
- No versioned function names (processV2, handleNew)
- No compatibility layers or migration code

### Quality Checkpoints
- Run `npm run lint` before committing to catch any issues
- Fix any build or linting violations before commit
- Note: Niv runs `npm run watch` in the background, so manual builds are unnecessary

### Claire's Coding Standards
Confirm before implementing: "Standard Claire practices: sparse comments, early returns, happy path unindented, always braces, imports not qualified names"

- **Comments are code smell** - Only JSDoc/JavaDoc for public APIs, complex algorithms, third-party workarounds, or non-obvious performance decisions
- **Structure is sacred** - Early returns and guard clauses; happy path at root level; always use braces
- **Import everything, qualify nothing** - Import fully at the top, use short names everywhere (avoid `net.minecraft.core.registries.Registries.BLOCK`, just import and use `Registries.BLOCK`)

### FoundryVTT Module Requirements
- Follow FoundryVTT v12+ patterns and D&D 5e System v4.1.2+ conventions
- Use ES Modules (no .js extensions in imports, relative paths, static imports only)
- Register hooks properly with `Hooks.on()` and `Hooks.once()`
- Follow feature-based architecture in `src/features/*/`
- Modern DOM APIs only (no jQuery)
- Use dnd5e system patterns and data models when extending 5e functionality
- Consider pack management for compendium content (YAML ↔ LevelDB)

### General Requirements
- Follow existing codebase patterns
- Write JSDoc for public APIs only
- Ensure module loads and functions in FoundryVTT
- Test in actual gameplay when relevant

## Completion Criteria
- Build passes with zero linting errors
- Feature works in actual FoundryVTT gameplay
- No TODOs or temporary code remains
