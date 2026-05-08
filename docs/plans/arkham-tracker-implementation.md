# Arkham Horror TCG Tracker Implementation Plan

## Objective
Build a standalone Next.js application to manage and track an Arkham Horror: The Card Game collection. The app will allow the user to track which expansions they own, have played, or want to buy, using a local JSON file for data persistence.

## Scope & Impact
- **Location:** A new project folder will be created at `C:\Users\desla\Projects\arkham-tracker`.
- **Data Initialization:** The app will be seeded with the TSV data provided by the user, converted into a structured JSON file organized by Campaign/Cycle.
- **Tech Stack:** Next.js (App Router), React, Tailwind CSS, TypeScript.

## Proposed Solution & Architecture

### 1. Data Model
A JSON file (`data/collection.json`) will act as the database.
```typescript
interface Product {
  id: string; // e.g., AHC01
  title: string;
  cycle: string; // e.g., "Core", "The Dunwich Legacy"
  type: string; // e.g., "Campaign Expansion", "Investigator Expansion", "Mythos Pack"
  owned: 'Owned' | 'Don\\'t care' | 'Want' | '';
  played: 'Played' | 'No' | '';
}
```

### 2. Implementation Steps
**Phase 1: Project Setup**
1. Run `npx create-next-app@latest arkham-tracker` with TypeScript and Tailwind CSS.
2. Clean up default boilerplate in `app/page.tsx` and `app/globals.css`.

**Phase 2: Data Seeding & API**
1. Create a `data/collection.json` file populated with the user's TSV data, categorized into appropriate cycles (Core, Dunwich, Carcosa, Forgotten Age, Circle Undone, Dream-Eaters, Innsmouth, Edge of the Earth, Scarlet Keys, Hemlock Vale, Drowned City, Standalones).
2. Create Next.js API routes (`app/api/collection/route.ts`) to GET the collection and POST updates (saving back to `data/collection.json`).

**Phase 3: UI Development**
1. Build the Main Dashboard (`app/page.tsx`).
2. Create a `CampaignSection` component to visually group products by cycle.
3. Create a `ProductRow` component featuring:
   - The product ID and title.
   - A dropdown or toggle set for "Ownership" (Owned, Want, Don't Care).
   - A checkbox/toggle for "Played" status.
4. Implement a "Progress/Stats" header showing the total number of items owned and played.

**Phase 4: State Management**
1. Use React `useState` and `useEffect` to fetch data on load.
2. Implement an optimistic UI update when a user changes a status, immediately followed by a background API call to persist the change.

## Verification
- **Functionality:** Verify that toggling "Owned" or "Played" correctly updates the UI and persists to `data/collection.json`.
- **Data Integrity:** Ensure all products from the provided TSV are accurately represented and grouped.
- **Visuals:** Verify the app looks clean and responsive using Tailwind CSS.