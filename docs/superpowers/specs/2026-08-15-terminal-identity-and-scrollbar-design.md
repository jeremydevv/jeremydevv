# Terminal identity and scrollbar design

## Goal

Refine the single-page terminal portfolio so it displays the owner name without the middle initial, uses a flat chalk background, and gives the terminal scroll area a macOS-Terminal-inspired scrollbar while preserving native browser scrolling.

## Scope

- Change the visible display name from `Jeremy K. Mathew` to `Jeremy Mathew` in document metadata and the terminal `whoami` output.
- Replace the desktop background gradients and texture pseudo-element with the existing flat chalk token (`#171714`).
- Style only the terminal output scroller. It must have a narrow, rounded, low-contrast scrollbar inspired by the macOS overlay scrollbar used by Terminal.
- Preserve browser-native scroll input, keyboard scrolling, focus behavior, and reduced-motion behavior. No JavaScript wheel interception or custom scrolling mechanism is permitted.

## Implementation shape

All changes stay in `src/index.js`, where this Worker emits its document HTML and styles. The `.shell` element remains the scroll container. Its WebKit scrollbar pseudo-elements provide macOS-like visual treatment in Safari and Chromium; Firefox receives a thin, low-contrast native scrollbar via `scrollbar-width` and `scrollbar-color`.

## Validation

- Check the Worker response and confirm the visible name no longer contains `K.`.
- Confirm the page background is solid `#171714` with no background pseudo-element texture.
- Capture a browser render of the live development server and inspect the terminal output scrollbar visually.
- Confirm wheel/trackpad input remains native by ensuring no wheel event listener or scroll animation is added.

## Constraints

- Do not modify email addresses, GitHub handles, Worker names, domain names, or deployment configuration.
- Do not add dependencies, analytics, or persistent state.
- Do not commit or push changes unless the owner explicitly requests it.
