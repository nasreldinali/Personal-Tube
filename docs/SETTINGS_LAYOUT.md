# Settings layout

Settings & data shares the Connections dialog shell: fixed header, section navigation and closing controls, with independently scrolling content. On narrow screens the navigation becomes a horizontal strip. English, Arabic RTL, German and Spanish use the same structure.

Four sections keep independent tasks together:

- **YouTube:** key entry, optional browser storage, removal and setup instructions.
- **API usage:** estimated daily usage, reset date and a link to actual Google Cloud limits.
- **Video refresh:** manual/automatic mode and interval, saved independently of the YouTube key.
- **Backups & data:** export/import, restore hidden videos and confirmed data clearing.

Switching sections preserves unsubmitted fields. Closing clears the visible key input; reopening reads the current saved/session key, as before. Entering from Connections opens YouTube and retains **Back to Connections**. Opening settings directly does not open Connections when closed. This change does not migrate storage or alter API usage, refresh, import or deletion rules.

`public/ui/settings-sections.js` owns section navigation only. `public/ui/settings-panel.js` retains key, usage and refresh operations; data actions retain their existing owner. Shared dialog styling stays in `public/styles/setup-connections.css`.
