# Cool terminal palette design

## Scope

Replace the terminal homepage's warm chalk, olive, and cream color tokens with a neutral slate and cool gray palette. Do not change layout, commands, behavior, or the classic-homepage fallback.

## Palette

The desktop background becomes deep slate (`#111827`), the terminal surface becomes blue-charcoal (`#18212f`), and its titlebar becomes a slightly lighter blue-charcoal. Primary text becomes cool gray, muted text becomes blue-gray, and command text becomes desaturated light blue. Borders and shadows remain subtle and dark for the existing terminal contrast.

## Validation

The homepage test will assert the cool palette tokens and ensure the prior warm base colors are absent. Existing interaction and configuration tests will continue to run unchanged.
