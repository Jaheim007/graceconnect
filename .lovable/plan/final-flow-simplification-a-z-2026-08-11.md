# Final flow simplification (A → Z)

The unified flow is in place. What remains are three duplicated surfaces that still give users two ways to do the same thing. This plan closes them so there is exactly one path per intention.

## 1. One intention screen instead of two

Today there are two onboarding-intention screens: `/welcome-intent` (IntentChooserPage) and `/looking-for`. IntentChooserPage's only job is to set the intent and then send the user to `/looking-for`, so it is a pass-through step.

Change:
- Keep `/looking-for` as the single intention screen (it is the one linked from the dashboard sidebar and the Explore "For you" block).
- `/welcome-intent` becomes a redirect to `/looking-for`, preserving the intent it used to set.
- Remove the extra tap from the sign-up path.

## 2. Giving folded into the library

`/my-donations` is a standalone page, while the library (`/my-purchases`) already loads the user's donations for its receipts view. Two places show the same money.

Change:
- Add a "Giving" tab to the library alongside Books, Courses, Receipts.
- `/my-donations` redirects to `/my-purchases?tab=giving`.
- Update the command palette, church header menu, and activity page links to the tab URL.

## 3. Retire the orphan quick pages

`/quick-start` and `/quick-publish` are not linked from any navigation, sidebar, or hub — they are leftovers that overlap with `/create-org` and the Action Hub.

Change:
- Redirect `/quick-start` to the unified dashboard and `/quick-publish` to the Action Hub creation entry.
- Delete the two page files.

## After this

Every intention has one surface: discover in Explore, own in the library, create in the Action Hub, earn in Gagner, manage in the workspace admin. No duplicate routes remain.

## Technical notes

- Files touched: `src/App.tsx` (routes), `src/pages/IntentChooserPage.tsx` (removed), `src/pages/ResourcesPage.tsx` (giving tab), `src/pages/MyDonationsPage.tsx` (removed), `src/pages/QuickStartPage.tsx` and `src/pages/QuickPublishPage.tsx` (removed), `src/components/command/CommandPalette.tsx`, `src/components/church/ChurchHeader.tsx`, `src/pages/dashboard/PersonalActivityPage.tsx`.
- Old URLs stay working through redirects, so bookmarks and links in already-sent emails do not break.
- No database, payment, or auth changes.
