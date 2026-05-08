# Testing and CI Implementation Plan

## Objective
Implement unit testing and automated CI for the Arkham Tracker project, mirroring the setup from the `boardgamebliss-monitor` project.

## Scope
- Add `vitest` as the testing framework.
- Configure Vitest for the Next.js environment.
- Add test scripts to `package.json`.
- Implement a GitHub Actions workflow for Continuous Integration.

## Proposed Solution
1. **Dependencies:** Install `vitest` as a dev dependency.
2. **Configuration:** Create `vitest.config.ts` with the appropriate environment and path aliases.
3. **Scripts:** Add `test` and `test:watch` scripts to `package.json`.
4. **Validation Test:** Create a simple unit test in `src/__tests__/sanity.test.ts` to verify the setup.
5. **GitHub Actions:** Create `.github/workflows/ci.yml` using the user-provided template to automate:
   - Dependency installation
   - Type checking (`tsc`)
   - Unit tests (`vitest run`)
   - Production build (`next build`)

## Verification
- Run `npm test` locally to ensure the sanity test passes.
- Run `npm run build` locally to ensure project integrity.
- Verify the CI workflow triggers on push.
