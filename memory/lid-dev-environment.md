# Development environment

*How to run the Einbürgerungstest app — Node lives in a gitignored .tools/, not on PATH*

The Mac's system Node is **18.15.0**, too old for Expo SDK 54, and there is no
Homebrew or nvm installed. Rather than change the system toolchain, Node 22 was
unpacked into `.tools/node/` inside the repo — which is **gitignored**, so a fresh
clone will not have it and `node -v` will still report 18.

Put it first on PATH for anything Node-related:

```sh
# from the repo root
export PATH="$PWD/.tools/node/bin:$PATH"
cd mobile && npx expo start --port 8081
```

Himanshu tests on a **physical iPhone via Expo Go**, not a simulator: there is no
Xcode (Command Line Tools only), though an Android emulator AVD
`Pixel_3a_API_33_arm64-v8a` does exist under `~/Library/Android/sdk`.

Connect by scanning a QR with the **iOS Camera app**, not from inside Expo Go —
Expo Go for iOS has no built-in scanner. The URL is `exp://<LAN-IP>:8081`; get the
IP with `ipconfig getifaddr en0`. Both devices must share a Wi-Fi network.

**Verify changes without a device** — this catches most breakage:
`npx tsc --noEmit`, then fetch the manifest with header `expo-platform: ios` from
`http://localhost:8081/` and GET its `launchAsset.url` to force a real bundle.

Python work uses `.venv/` (pypdf, pillow, qrcode). See [Project, exam format and data provenance](lid-app-project.md).
