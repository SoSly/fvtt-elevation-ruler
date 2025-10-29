---
allowed-tools: read-file, git, execute
description: Create a properly formatted commit
---

# Create Commit

Create a commit for the current changes.

## Pre-Commit Verification

1. Run `npm run build` to verify compilation and linting
2. If build fails, stop and fix issues before committing
3. Proceed only if build succeeds with zero errors
4. Prefer `git add -A`

## Commit Message Format

Use conventional commit format:
```
type: concise description in present tense

Additional details in the body as needed for clarity.
Technical decisions, reasoning, or context can go here.
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring without changing behavior
- `chore` - Maintenance tasks (dependencies, config, etc.)
- `docs` - Documentation changes
- `release` - Updates specific to a release of the module 

### Requirements
- Keep summary concise and in present tense
- Never include the Claude Code footer
- Body is optional but helpful for non-obvious changes
- Reference issue numbers when relevant (e.g., "Resolves #42")

## Process
1. Verify build passes
2. Review staged changes
3. Generate commit message following the format above
4. Execute the commit
