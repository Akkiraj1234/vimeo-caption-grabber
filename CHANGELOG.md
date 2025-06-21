# Changelog

## v1.0.2

- 🧹 Moved all source files into the `extension/` folder for cleaner structure
- 📝 Updated GitHub Actions to zip only the `extension/` folder
- 🧠 Improved changelog parser to handle last-entry releases
- ✅ Now publishes zipped extension automatically with each release tag

## v1.0.1

- ✅ Fixed: GitHub release action failing due to missing permissions
- 🛠️ Added `contents: write` permission in release workflow
- 📦 Now successfully auto-creates releases from tags and changelog

## v1.0 - Initial Release

- 🐾 Subtitles (.vtt) download support
- 🧾 Transcript (.txt) without timestamps
- ✨ Cleaned text format for better readability
- 🎀 Cute UI with dark/light theme toggle
- 🐱 Kitty mascot + saves download preferences
