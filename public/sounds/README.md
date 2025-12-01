# Audio Assets

This directory contains sound effects for the execution system.

## Required Files

1. **clang.mp3** - Metal clanging sound for ClippyJail
   - Duration: ~0.5 seconds
   - Used when clicking jail bars
   - Should sound like metal hitting metal

2. **drone.mp3** - Low frequency drone for TheVoid
   - Duration: ~5 seconds (looped)
   - Should be a low, ominous drone sound
   - Used as background audio in The Void punishment

3. **tada.mp3** - Celebration sound for clean code achievement
   - Duration: ~1-2 seconds
   - Used when Clippy plays Congratulate animation
   - Should sound celebratory and positive

## Adding Audio Files

To add these audio files:
1. Find or create appropriate sound effects
2. Convert to MP3 format
3. Place in this directory with the exact filenames above
4. The application will automatically use them

## Fallback Behavior

If audio files are not present, the application will:
- Log a warning to the console
- Continue with visual-only experience
- Not break functionality
