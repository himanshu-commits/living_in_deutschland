# Leben in Deutschland — mobile app

Expo (React Native) app for iOS and Android. The catalogue works offline; an
optional Supabase account syncs progress across devices.

## Requirements

**Node 20 or newer.** Current Expo will not run on Node 18.

```sh
nvm install 20 && nvm use 20   # or: brew install node
```

## Setup

```sh
cd mobile
npm install
npx expo install --fix   # aligns native dependency versions with the installed SDK
npm start                # then press i (iOS) or a (Android), or scan with Expo Go
```

## Login and progress sync

Create a Supabase project, copy `.env.example` to `.env`, and replace both
placeholder values with the project's URL and publishable/anon key. Then run
`supabase/migrations/0001_progress_sync.sql` in the project's SQL editor and
restart Expo (environment changes are only read when the dev server starts).

Email/password authentication must be enabled in Supabase. If **Confirm email**
is enabled, a new user confirms the message and then returns to the app to log
in. Never put the service-role key in this file or in a mobile build.

The pinned versions in `package.json` are a starting point; `expo install --fix` is
the authority and will correct them for whichever SDK resolves.

## Structure

```
app/                 expo-router routes (file = screen)
  _layout.tsx        stack + store provider + theming
  index.tsx          home: readiness score, entry points
  bundesland.tsx     pick your state — decides which 310 questions you see
  learn.tsx          practice with instant feedback
  exam.tsx           33 questions, 60 minutes, pass at 17
src/
  questions.ts       data access, exam paper construction
  storage.ts         AsyncStorage-backed progress
  theme.ts           colour tokens, light + dark
  components.tsx     Card, Button, Option, ProgressBar, Notice
assets/
  questions.json     generated — do not edit by hand
```

## Regenerating the data

`assets/questions.json` is produced from the repo's dataset:

```sh
npm run data     # ../.venv/bin/python tools/export_app_data.py
```

## Current content status

- All 36 picture questions include their bundled images.
- All 460 answers are verified.
- Translations and text-to-speech audio are implemented.
- German and English explanations are available as Premium learning support.
