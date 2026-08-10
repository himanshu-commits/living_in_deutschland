# Leben in Deutschland — mobile app

Expo (React Native) app for iOS and Android. Offline, no account, no backend.

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

## Known gaps

- **Picture questions have no pictures yet.** 36 questions show numbered options
  whose images live only in the source PDF; the app flags them inline. Extracting
  and binding those images is the next data task.
- **78 answers are unverified** and are flagged in the UI. They come from a single
  source rather than two agreeing ones. See `../data/review-queue.md`.
- No spaced repetition, translations or audio yet — see the project plan.
