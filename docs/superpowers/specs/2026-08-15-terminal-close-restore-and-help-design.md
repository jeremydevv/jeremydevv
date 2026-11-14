# Terminal close restore and help-state design

## Scope

The terminal homepage will present an idle help state instead of showing portfolio commands as though they have already run. Its close control will briefly hide the window, then restore it at the viewport center with a fade-in.

## Terminal content

The shell begins with the prompt and the command `help`, followed by a concise command reference for `whoami`, `ls focus`, and `open links`. The prior prefilled command transcript is removed. The command reference preserves the portfolio's existing available destinations and information without implying a user has executed commands.

## Close lifecycle

When the red close control is activated, the terminal becomes non-interactive and fades out. It remains closed for 350 ms. The restore step clears inline geometry and interaction state from dragging, minimizing, and zooming so the CSS default positions the terminal at the viewport center. On the following animation frame, the closed class is removed and the terminal fades back in over 220 ms.

The restore lifecycle cancels or replaces a previously pending close-restore timer, preventing repeated clicks from producing stale restores. Under `prefers-reduced-motion: reduce`, the same lifecycle and 350 ms pause apply, but the visibility changes occur without animation.

## Accessibility and testing

The restored terminal remains keyboard-operable through its title bar and window controls. A regression test will assert the help-state markup, close delay, geometry reset, and fade-in behavior. Existing homepage and configuration tests remain green.
