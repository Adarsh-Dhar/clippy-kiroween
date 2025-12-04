Steering: Error Handling & Punishment Strategy ⚠️

Philosophy:
Unlike standard IDEs that try to fix errors, this application seeks to punish them.

The Anger State Machine:
The app tracks a global angerLevel (0-5). Logic must adhere to this progression:

Level

State

Clippy Behavior

UI Effect

0

Calm

Idle animations. Helpful sarcasm.

Standard Win95 Teal.

1

Annoyed

Tapping glass. "Really?" comments.

Occasional 2px shake.

2

Angry

Eyes turn red. Insults variable names.

Background turns dark gray.

3

Furious

Screaming text. "DELETE THIS."

Input lag introduced (100ms).

4

Haunted

Demonic voice. Glitch animations.

Colors invert or bleed red.

5

FATAL

BSOD Triggered. Game Over.

Blue Screen of Death. Reset required.

The "Anti-Help" Rule:
When the Linter finds an error (e.g., "Missing semicolon"), the AI MUST NOT provide the fix.

Wrong: "Add a semicolon to line 5."

Correct: "You forgot a semicolon. I deleted a random file from your desktop as punishment."