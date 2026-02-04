# Team↔Jury Interaction Matrix - Implementation Summary

## Overview
This document describes the newly implemented Team↔Jury Interaction Matrix feature added to the Analytics Dashboard.

## What Was Built

### Main Component: TeamJuryMatrix
A comprehensive interactive heatmap/table matrix that visualizes how teams and juries interact during room sessions.

#### Visual Layout
```
              Jury A    Jury B    Jury C    Total
Team Alpha      3         5         2        10
Team Beta       4         1         3         8
Team Gamma      2         4         1         7
─────────────────────────────────────────────────
Total          9        10         6        25
```

#### Color Scheme
- **Empty cells (0)**: Light gray (#f8fafc)
- **Low counts**: Light blue
- **Medium counts**: Purple
- **High counts**: Red
- **Totals**: Blue background
- **Highlighted cells**: Yellow pulsing border (when imbalance mode active)

## Key Features

### 1. Sorting Controls
Located at the top of the component, users can:

**Sort Teams:**
- By Name ↕ - Alphabetically (A-Z or Z-A)
- By Count ↕ - By total interaction count (ascending/descending)

**Sort Juries:**
- By Name ↕ - Alphabetically (A-Z or Z-A)
- By Count ↕ - By total interaction count (ascending/descending)

Each sort button shows:
- ↕ when not active
- ↑ when sorting ascending
- ↓ when sorting descending

### 2. Imbalance Highlighting
Two modes to detect and highlight distribution problems:

**Team Imbalance (Yellow Button)**
- Identifies teams that have concentrated exposure to specific juries
- Highlights cells where count is ≥50% above average for that team
- Use case: "Is Team A always paired with Jury X?"

**Jury Imbalance (Yellow Button)**
- Identifies juries over-exposed to certain teams
- Highlights cells where count is ≥50% above average for that jury
- Use case: "Is Jury Y evaluating the same teams repeatedly?"

Active buttons turn red (primary color) to show they're enabled.

### 3. Interactive Features

**Hover Effects:**
- Cells get red outline when hovered
- Tooltip shows: "Team Name ↔ Jury Name: X session(s)"
- Makes it easy to identify specific interactions

**Totals Display:**
- Right column: Total sessions per team
- Bottom row: Total sessions per jury
- Bottom-right: Grand total of all sessions
- Tooltips show: "X session(s) for [Team/Jury Name]"

### 4. Responsive Design

**Desktop (>768px):**
- Full controls visible horizontally
- Optimal cell sizing
- Readable labels

**Mobile (≤768px):**
- Controls stack vertically
- Smaller cell padding
- Horizontal scrolling enabled
- Labels remain readable

## Integration with Dashboard

### Position
The Team↔Jury Matrix appears **first** in the Analytics Dashboard, before:
1. Team Interactions Matrix (team-vs-team)
2. Team Waiting Times
3. Room Distribution by Team

### Filters
Uses the existing filter system:
- **Session dropdown**: Filter by specific session
- **Start Date**: Filter from this date/time
- **End Date**: Filter until this date/time
- **Clear Filters**: Reset all filters

Changes to filters automatically refresh all analytics including the Team↔Jury matrix.

## Data Structure

### Input Data Type: TeamJuryMatrix
```typescript
{
  teams: Array<{id: number, label: string}>,      // All teams
  juries: Array<{id: number, label: string}>,     // All juries
  counts: Array<{                                  // Interaction records
    team_id: number,
    team_label: string,
    jury_id: number,
    jury_label: string,
    meet_count: number                             // Number of sessions together
  }>,
  per_team_totals: Record<string, number>,        // Total per team (key: team_id)
  per_jury_totals: Record<string, number>         // Total per jury (key: jury_id)
}
```

## Use Cases

### 1. Fairness Analysis
**Goal**: Ensure balanced jury exposure across teams
**How**: 
- Use "Jury Imbalance" highlighting
- Look for yellow cells indicating over-exposure
- Sort juries by count to find outliers

### 2. Team Distribution Check
**Goal**: Verify teams get varied jury perspectives
**How**:
- Use "Team Imbalance" highlighting
- Find teams repeatedly paired with same juries
- Sort teams by count to identify patterns

### 3. Workload Verification
**Goal**: Check if jury workload is balanced
**How**:
- Look at jury total column (bottom)
- Sort by jury count to see distribution
- Compare against team totals for balance

### 4. Session Analysis
**Goal**: Understand specific session patterns
**How**:
- Filter by session in dropdown
- Observe which team-jury pairs are active
- Use sorting to identify focus areas

## Technical Notes

### Performance
- Uses React.useMemo for efficient matrix computation
- Only recalculates when data or sort config changes
- Handles large matrices (dozens of teams/juries)

### Accessibility
- All interactive elements have title attributes
- Clear visual indicators for active states
- High contrast colors for readability
- Keyboard-friendly controls

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Uses standard CSS grid and flexbox
- No external dependencies beyond React

## Example Scenarios

### Scenario 1: Finding Jury Bias
1. Open Analytics Dashboard
2. Select a specific session
3. Click "Jury Imbalance" button
4. Yellow-highlighted cells show juries repeatedly evaluating same teams
5. Take action to rebalance future assignments

### Scenario 2: Team Fairness Check
1. View full dataset (no session filter)
2. Click "Team Imbalance" button
3. Identify teams with concentrated jury exposure
4. Use sorting to prioritize which teams need rebalancing
5. Plan future sessions with better distribution

### Scenario 3: Historical Analysis
1. Set date range (e.g., last month)
2. Sort teams by count (descending)
3. Identify most active teams
4. Cross-reference with jury totals
5. Generate insights for reporting

## Color Legend

The component includes a gradient legend showing:
```
Session Count: [0] ━━━━━━━━━━━━━━ [MAX]
                 Light → Blue → Purple → Red
```

Where MAX is the highest interaction count in the current dataset.

## Help Text

The component includes explanatory text:
- **Team Imbalance**: Highlights cells where a team has disproportionately high exposure to a specific jury (≥50% above average).
- **Jury Imbalance**: Highlights cells where a jury is over-exposed to a specific team (≥50% above average).

## Future Enhancements (Potential)

While not implemented in this PR, potential future additions could include:
- Export matrix data to CSV/Excel
- Click on cells to drill down to specific sessions
- Configurable imbalance threshold (currently 50%)
- Heat map color scheme alternatives
- Compare two time periods side-by-side
- Statistical analysis tools (standard deviation, etc.)

## Related Files

### Component Files
- `/src/pages/analytics/TeamJuryMatrix.tsx` - Main React component (299 lines)
- `/src/pages/analytics/TeamJuryMatrix.css` - Styling (279 lines)
- `/src/pages/analytics/Analytics.tsx` - Dashboard integration (updated)

### Type Definitions
- `/src/api/models/TeamJuryMatrix.ts` - Matrix data structure
- `/src/api/models/TeamJuryInteraction.ts` - Individual interaction record
- `/src/api/models/TeamLabel.ts` - Team reference
- `/src/api/models/JuryLabel.ts` - Jury reference

### API
- `/src/api/services/AnalyticsService.ts` - getAnalyticsSummary() method
- `/openapi.yaml` - API specification (team_jury_matrix schema)

## Questions & Support

For questions about this implementation, refer to:
1. This documentation file
2. Inline code comments in TeamJuryMatrix.tsx
3. The original problem statement for requirements context
4. OpenAPI specification for data structure details
