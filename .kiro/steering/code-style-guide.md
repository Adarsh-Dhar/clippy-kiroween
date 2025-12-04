Steering: Windows 95 Visual Style Guide 💾

Objective: All UI components must strictly adhere to the "Microsoft Windows 95" aesthetic. Modern design patterns (rounded corners, soft shadows, gradients) are FORBIDDEN.

Color Palette:

Desktop Background: Teal #008080 (The classic background).

Window Background: Light Gray #C0C0C0 (The standard chrome).

Title Bar: Gradient from Dark Blue #000080 to Light Blue #1084D0.

Text (UI): Black #000000.

Text (High Contrast/Error): Pure Red #FF0000 or White on Blue.

Component Rules:

Borders (The "3D Bevel"):

Buttons and Windows must use "Inset" or "Outset" borders created via CSS border colors.

Light Source: Top-Left.

Highlight: White (#FFFFFF) on Top/Left.

Shadow: Dark Gray (#808080) or Black (#000000) on Bottom/Right.

CSS Example: border-t-white border-l-white border-b-black border-r-black border-2.

Typography:

UI Elements: MS Sans Serif, Arial, or system-ui. Must be non-antialiased if possible.

Code Editor: Courier New, Consolas, or Fixedsys.

NO: Roboto, Open Sans, or Inter.

Layout:

Windows must have a Title Bar with a Title (Left) and [X] Button (Right).

No flex-gap spacing; components should feel rigid and packed.

Use box-shadow: none globally.