/*
Filename: version.ts
Last Edit Date: 2026-09-25 EST
Purpose: The repo's single release version number, shown in the header after the app title.
*/

// The one version number for the whole app -- files don't carry their own.
// Bump APP_VERSION (+0.01 fix, +0.10 feature) and set APP_BUILD_DATE once per
// release (each merge to main, which deploys automatically).
export const APP_VERSION = '1.10'
export const APP_BUILD_DATE = '2026-09-25'
