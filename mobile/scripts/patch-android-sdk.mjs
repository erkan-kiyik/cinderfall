// Raises the generated Android project to API 36.
//
// Google Play requires new releases to target the current API level (36 as of
// late 2025). Capacitor 6's template is pinned to 34, and compileSdk 36 needs a
// newer Android Gradle Plugin and Gradle than that template ships, so all three
// move together here. Run from `mobile/` after `npx cap add android`; the
// android/ folder is regenerated on every CI run so this runs every time.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SDK = 36;
const AGP = '8.9.1';
const GRADLE = '8.11.1';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'android');
// The activity lives under the app id's package path. Read it from the config
// rather than hard-coding it, so a build with a different app id (the LAB
// build) patches its own MainActivity.
const APP_ID = JSON.parse(readFileSync(resolve(root, '..', 'capacitor.config.json'), 'utf8')).appId;

function edit(rel, fn, label) {
  const p = resolve(root, rel);
  if (!existsSync(p)) { console.error(`[patch-android-sdk] ${rel} missing — did "cap add android" run?`); process.exit(1); }
  const before = readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) { console.error(`[patch-android-sdk] ${label} not found in ${rel} — Capacitor template changed?`); process.exit(1); }
  writeFileSync(p, after);
  console.log(`[patch-android-sdk] ${label}`);
}

// Play's automatic protection requires a minimum SDK of 24 or higher (the
// Capacitor 6 template ships 22). API 24 is Android 7.0.
const MIN_SDK = 24;

edit('variables.gradle', (s) => s
  .replace(/minSdkVersion = \d+/, `minSdkVersion = ${MIN_SDK}`)
  .replace(/compileSdkVersion = \d+/, `compileSdkVersion = ${SDK}`)
  .replace(/targetSdkVersion = \d+/, `targetSdkVersion = ${SDK}`), `min/compile/target SDK -> ${MIN_SDK}/${SDK}/${SDK}`);

edit('build.gradle', (s) => s.replace(/(com\.android\.tools\.build:gradle:)[\d.]+/, `$1${AGP}`), `AGP -> ${AGP}`);

edit('gradle/wrapper/gradle-wrapper.properties',
  (s) => s.replace(/gradle-[\d.]+-(all|bin)\.zip/, `gradle-${GRADLE}-$1.zip`), `Gradle -> ${GRADLE}`);

// Targeting API 35+ makes Android draw the app edge-to-edge under the status
// and navigation bars and the old opt-out is ignored at 36. The menus and the
// touch controls would sit underneath them, so the activity pads its content
// by the system-bar insets itself (display-cutout insets stay with the page's
// own env(safe-area-inset-*) rules). The window background is already the game's
// dark colour, so the padded strips are invisible.
//
// High refresh rate: many phones (Samsung, Xiaomi, OnePlus in "adaptive" or
// "standard" mode) hold an app at 60Hz unless the window asks for more, and a
// WebView's requestAnimationFrame can never run faster than the display. The
// activity therefore asks for the fastest mode at the current resolution —
// 90/120/144Hz where the panel has one — and asks again on resume, because
// some vendors reset the preference when the app comes back to the front.
edit(`app/src/main/java/${APP_ID.replace(/\./g, '/')}/MainActivity.java`, () => `package ${APP_ID};

import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.View;
import android.view.WindowManager;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    View content = findViewById(android.R.id.content);
    ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
      Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
      v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
      return WindowInsetsCompat.CONSUMED;
    });
    requestHighRefreshRate();
  }

  @Override
  public void onResume() {
    super.onResume();
    requestHighRefreshRate();
  }

  @SuppressWarnings("deprecation")
  private void requestHighRefreshRate() {
    try {
      Display display = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
        ? getDisplay() : getWindowManager().getDefaultDisplay();
      if (display == null) return;
      Display.Mode cur = display.getMode();
      Display.Mode best = cur;
      for (Display.Mode m : display.getSupportedModes()) {
        if (m.getPhysicalWidth() == cur.getPhysicalWidth()
            && m.getPhysicalHeight() == cur.getPhysicalHeight()
            && m.getRefreshRate() > best.getRefreshRate() + 0.5f) best = m;
      }
      WindowManager.LayoutParams lp = getWindow().getAttributes();
      if (lp.preferredDisplayModeId == best.getModeId()) return;
      lp.preferredDisplayModeId = best.getModeId();
      lp.preferredRefreshRate = best.getRefreshRate();
      getWindow().setAttributes(lp);
    } catch (Exception ignored) {
      // A vendor display stack that refuses the request just stays at its default.
    }
  }
}
`, 'MainActivity pads content by system-bar insets + requests the highest refresh rate');
