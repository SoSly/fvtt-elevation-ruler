---
allowed-tools: read-file, git, github
description: Create a feature branch from a GitHub issue
---

# Create Feature Branch

Create a properly named branch for issue: $ARGUMENTS

## Process

1. Fetch and review the GitHub issue
2. Determine the appropriate branch type based on issue content:
    - `feat/` - New features
    - `fix/` - Bug fixes
    - `refactor/` - Code restructuring
    - `chore/` - Maintenance tasks
    - `docs/` - Documentation
3. Create branch using convention: `type/###-short-description`
    - Use issue number
    - Keep description brief (3-5 words max)
    - Use hyphens, lowercase

## Examples
- `feat/42-add-particle-effects`
- `fix/103-crash-on-startup`
- `refactor/67-simplify-registry`
