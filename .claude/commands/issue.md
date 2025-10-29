---
allowed-tools: github
description: Create or refine a full GitHub issue using template
---

# Create/Refine GitHub Issue

Create or refine issue: $ARGUMENTS

## Template
The template has three parts: a brief description, Technical Notes that explain HOW to implement the feature, and Acceptance Criteria that define WHAT testable outcomes must be achieved. Technical Notes are implementation guidance - formulas, approaches, specific classes or methods. Acceptance Criteria are requirements that can be observed and tested. Both sections contain requirements, but Technical Notes focus on the implementation approach while Acceptance Criteria focus on verifiable outcomes.

```markdown
[1-2 sentences describing what this system/feature does]

## Technical Notes
[Bullet points or specific interfaces/classes to implement]

## Acceptance Criteria
- [ ] [Specific measurable outcome]
- [ ] [Another specific outcome]
```

## Example
  ```markdown
  Adds blacksmiths who craft metal tools, weapons, and armor in smithies.

## Acceptance Criteria
- [ ] Smithy zone type exists
- [ ] Blacksmith profession exists and links to Smithy
- [ ] Blacksmiths can craft metal tools (pickaxes, axes, swords, shovels, hoes)
- [ ] Blacksmiths can craft metal armor pieces
```

## When to Use Technical Notes
Technical Notes are optional. Only include them when:
- There's a specific formula or calculation that needs to be implemented exactly
- The feature requires integration with existing systems in a non-obvious way
- There's an architectural decision that constrains how Claire builds it

Most issues only need Acceptance Criteria. If the ACs clearly describe what needs to work, skip the Technical Notes.

```markdown
Villagers gain stats overnight based on their daily activities. Single roll determines if Physique, Intellect, or Endurance increases.

## Technical Notes
- Triggered when villager goes to sleep
- Event Aggregator maintains running totals by consuming Event Log:
  - total_items_carried (from BEHAVIOR_STOP events)
  - total_difficulty_completed (from BEHAVIOR_STOP events)
  - total_hunger_gained (from BEHAVIOR_STOP events)
- Calculate raw weights from aggregated totals:
  - Physique: total_items_carried × PHYSIQUE_GAIN_WEIGHT
  - Intellect: total_difficulty_completed × INTELLECT_GAIN_WEIGHT
  - Endurance: total_hunger_gained × ENDURANCE_GAIN_WEIGHT
- Apply current stat penalty: `adjusted_weight = raw_weight × (100 - current_stat × 5) / 100`
- Calculate gain threshold: `sum of adjusted weights / STAT_GAIN_DIFFICULTY`
- STAT_GAIN_DIFFICULTY defaults to 4
- Roll random value 0-99
- Map ranges proportionally within gain threshold
- Clear aggregator after processing

## Acceptance Criteria
- [ ] Event Aggregator consumes Event Log to maintain running totals
- [ ] Aggregator cleared after stat progression evaluation
- [ ] Higher current stats reduce improvement chance
- [ ] Stats cap at 20
- [ ] Particle shows on stat gain: Red for Physique, Blue for Intellect, Yellow for Endurance
- [ ] Subtle sound plays on stat gain
- [ ] All gain weights and difficulty configurable in CommonConfig
```

## Process
1. If refining existing issue, fetch current content
2. Create/update issue following template format above
3. Preserve core intent while improving clarity and testability
4. Avoid duplication. Things in the Description or Technical Notes should not also appear in the Acceptance Criteria.
