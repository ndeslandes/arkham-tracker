# Project Mandates

## Documentation & Planning
- **Plan Persistence:** All approved implementation plans MUST be saved to the `/docs/plans/` directory before execution begins. Use descriptive filenames (e.g., `feature-xyz-plan.md`).
- **Plan History:** Never delete old plans; keep them as a record of architectural decisions and project evolution.

## Engineering Standards
- **Style:** Maintain the Lovecraftian/Arkham Horror aesthetic for all UI components. Use the established `font-typewriter` and `font-serif` typography.
- **Data Integrity:** Always use the `/api/collection` endpoint for updating `data/collection.json` to ensure persistence.
- **Scenario Synchronization:** When updating scenario completion, always synchronize across all products in the same cycle using the established logic in `page.tsx`.
