# Legacy Sub-items Integration Plan

## Objective
Merge the legacy Deluxe and Mythos pack display into the modern Investigator and Campaign Expansion format in the UI. Instead of hiding "Don't care" products globally, we will group the legacy components inside the modern expansions as sub-items, allowing the user to track them individually within the same cycle view.

## Scope
- Modify `src/app/page.tsx` rendering logic.
- Remove the `hideDisregarded` state and toggle button from the header.

## Proposed Solution
1. **Remove Global Hiding:** The "Hide Disregarded" toggle will be completely removed. All cycles and products will be considered for rendering.
2. **Data Grouping per Cycle:**
   - Identify modern expansions (`Investigator Expansion`, `Campaign Expansion`).
   - Identify legacy items (`Deluxe`, `Mythos Pack`).
   - Identify other items (`Return To`, `Standalone`).
3. **Rendering Hierarchy:**
   - For a cycle, render the modern expansions first.
   - If modern expansions exist alongside legacy items, render the legacy items as a visually distinct sub-list *inside* the `Campaign Expansion` (or whichever modern expansion is listed first) rather than as standalone main rows.
   - This ensures the modern box acts as a parent folder for the older products, keeping the layout clean while preserving individual dropdown tracking.
   - Scenarios will remain attached to the parent products and continue to sync their status seamlessly across any duplicates.

## Verification
- Ensure the app builds without TypeScript errors.
- Verify that cycles like "Dunwich" display the two main expansion boxes, and clicking into them reveals the legacy Deluxe/Mythos packs for granular status tracking.
- Verify that "Don't care" products are no longer hidden but correctly excluded from summary statistics.