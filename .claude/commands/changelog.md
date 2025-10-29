---
allowed-tools: read-file, write-file
description: Update CHANGELOG.md with all changes
---

# Update Changelog

Update CHANGELOG.md: $ARGUMENTS

## Purpose

CHANGELOG.md stores a comprehensive list of all changes to the module. This includes user-visible features, bug fixes, refactoring, technical improvements, and developer-facing changes.

## Process

1. Read current CHANGELOG.md (create if it doesn't exist)
2. Identify all changes from recent work
3. Add entries in appropriate sections (Added, Changed, Fixed, Removed, etc.)
4. Maintain chronological order (newest first) within sections
5. Follow Keep a Changelog format

## What to Include

- New features and functionality
- Bug fixes
- Breaking changes
- Deprecations
- Refactoring and code improvements
- Performance improvements
- Configuration changes
- Documentation updates
- Dependency updates
- Build and tooling changes

## What Not To Include

- Implementation details
- "Changes" to code that has never been released

## Format

Follow Keep a Changelog conventions:
- `## [Unreleased]` for upcoming changes
- `### Added` for new features
- `### Changed` for changes in existing functionality
- `### Deprecated` for soon-to-be removed features
- `### Removed` for removed features
- `### Fixed` for bug fixes
- `### Security` for security fixes

## Guidelines for Quality Changelog Entries

Before writing entries, review them against these criteria:

**User-Focused Language**
- Write from the user's perspective, not the developer's
- Good: "Add dark mode toggle to settings"
- Bad: "Refactor theme system to support multiple color schemes via CSS variables"

**Avoid Implementation Details**
- Focus on WHAT changed, not HOW it was implemented
- Technical refactoring goes in "Changed" only if it affects users
- Good: "Improve psionic power filtering performance"
- Bad: "Replace Array.filter with Set.has for O(1) lookups"

**Consolidate Related Changes**
- Multiple bullets about the same feature indicate over-documentation
- If bullets need "and" to connect them, they're probably one bullet
- Good: "Add Talents to Manifest Power HUD"
- Bad: Three separate bullets about UI element, data processing, and display logic for the same feature

**Test for Redundancy**
- Read each bullet aloud - do any two say basically the same thing?
- If you can't explain the difference in one sentence, merge them
- Ask: "Would a user see these as two separate changes?"

**Technical Changes Belong in "Changed"**
- Code reorganization, refactoring, new utility modules → Changed
- Only add to "Added" if it's user-visible or developer-facing API
- "Consolidate utilities" is Changed, not Added

**When in Doubt, Combine**
- Err on the side of fewer, clearer bullets
- Better to have one clear statement than three overlapping ones
