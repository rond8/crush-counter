# Building Crush Counter for Android (.aab)

You do **not** need Android Studio installed. The `.github/workflows/android-build.yml`
file in this project builds the app entirely on GitHub's servers — you just push code
and download the result.

## Option A: GitHub Actions (recommended — nothing to install)

### One-time setup

1. **Push this project to a GitHub repo** (create one on github.com if you don't have
   one yet, then `git init`, `git add .`, `git commit -m "init"`, `git remote add origin
   <your-repo-url>`, `git push -u origin main`).

2. **Add your Supabase credentials as repo secrets** (so the build has access to them —
   your `.env` file itself is gitignored and never gets pushed):
   - GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values from your
     local `.env`

That's it for testing. Every push to `main` now automatically builds a debug APK.

### Get a test build (debug APK)

1. Push a commit, or go to the **Actions** tab → **Android Build** → **Run workflow**
2. Wait for the `debug-apk` job to finish (a few minutes)
3. Click into the run → under **Artifacts**, download `crush-counter-debug-apk`
4. Unzip it, transfer `app-debug.apk` to your phone (email, Google Drive, USB — anything),
   and open it. You'll need to allow "Install unknown apps" for whatever app you used to
   transfer it — Android will prompt you the first time.

This is a real installable app — no Play Store or signing needed for this step, just for
testing on your own device.

### Get a signed release AAB (for uploading to Google Play)

This needs one thing you generate yourself: a **signing keystore**. This is the one file
that proves future updates come from you — back it up somewhere safe, forever. You need a
JDK installed to create it (much lighter than Android Studio — see below).

1. **Install just a JDK** (not the full Android Studio):
   - Windows: `winget install EclipseAdoptium.Temurin.21.JDK`
   - Mac: `brew install openjdk@21`
   - Linux: `sudo apt install openjdk-21-jdk`

2. **Generate the keystore**:
   ```bash
   keytool -genkeypair -v -keystore crush-counter-release.keystore \
     -alias crush-counter -keyalg RSA -keysize 2048 -validity 10000
   ```
   It'll ask for a password and some identity info — answer however you like, just
   remember the password.

3. **Base64-encode it** (so it can be stored as a text secret):
   ```bash
   # Mac/Linux:
   base64 -i crush-counter-release.keystore -o keystore-base64.txt
   # Windows (PowerShell):
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("crush-counter-release.keystore")) | Out-File keystore-base64.txt
   ```

4. **Add four more repo secrets** (Settings → Secrets and variables → Actions):

   | Secret name | Value |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | contents of `keystore-base64.txt` |
   | `ANDROID_KEYSTORE_PASSWORD` | the password you set in step 2 |
   | `ANDROID_KEY_ALIAS` | `crush-counter` (or whatever alias you used) |
   | `ANDROID_KEY_PASSWORD` | usually the same as the store password |

5. **Trigger the build**: Actions tab → **Android Build** → **Run workflow**. This runs
   both jobs; download `crush-counter-release-aab` from the run's Artifacts once it's done.

6. Upload the `.aab` to the [Google Play Console](https://play.google.com/console) —
   you'll need a one-time $25 developer account to publish there.

### Every time you update the app

Just push to `main` — the debug APK rebuilds automatically. Re-run the workflow manually
whenever you want a fresh signed AAB.

---

## Option B: Local build with Android Studio

If you'd rather build on your own machine:

1. Install [Android Studio](https://developer.android.com/studio) (includes the SDK and
   a bundled JDK) and open it once to finish SDK setup.
2. ```bash
   npm install
   npm run android:sync    # builds the web app + copies it into android/
   npm run android:open    # opens the android/ folder in Android Studio
   ```
3. `Build` menu → `Generate Signed Bundle / APK…` → **Android App Bundle** → point it at
   your keystore (same `keytool` command as above) → Finish.
4. Output: `android/app/release/app-release.aab`

## Before every new Play Store upload

Google Play requires each upload to have a higher `versionCode` than the last. Bump these
in `android/app/build.gradle`:

```groovy
versionCode 3        // increment every release
versionName "1.1"     // human-readable, shown to users
```

## App icon & splash screen

Capacitor ships with placeholder icons. To generate proper ones from your own artwork:

```bash
npm install @capacitor/assets --save-dev
```

Put a 1024×1024 `icon.png` and a 2732×2732 `splash.png` in a `resources/` folder at the
project root, then:

```bash
npx capacitor-assets generate
```

Commit and push — the next Actions build will pick them up.

## Notes specific to this app

- `capacitor.config.ts` sets `appId: "com.rdosio.crushcounter"` — this is the app's
  permanent package identifier on the Play Store. Change it now if you want something
  different; you **cannot** change it after your first Play Store upload without
  publishing as a brand-new app.
- Never commit `crush-counter-release.keystore`, `keystore-base64.txt`, or
  `android/keystore.properties` — they're already in `.gitignore`.
