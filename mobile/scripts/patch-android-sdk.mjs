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

function edit(rel, fn, label) {
  const p = resolve(root, rel);
  if (!existsSync(p)) { console.error(`[patch-android-sdk] ${rel} missing — did "cap add android" run?`); process.exit(1); }
  const before = readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) { console.error(`[patch-android-sdk] ${label} not found in ${rel} — Capacitor template changed?`); process.exit(1); }
  writeFileSync(p, after);
  console.log(`[patch-android-sdk] ${label}`);
}

edit('variables.gradle', (s) => s
  .replace(/compileSdkVersion = \d+/, `compileSdkVersion = ${SDK}`)
  .replace(/targetSdkVersion = \d+/, `targetSdkVersion = ${SDK}`), `compile/target SDK -> ${SDK}`);

edit('build.gradle', (s) => s.replace(/(com\.android\.tools\.build:gradle:)[\d.]+/, `$1${AGP}`), `AGP -> ${AGP}`);

edit('gradle/wrapper/gradle-wrapper.properties',
  (s) => s.replace(/gradle-[\d.]+-(all|bin)\.zip/, `gradle-${GRADLE}-$1.zip`), `Gradle -> ${GRADLE}`);

// Targeting API 35+ makes Android draw the app edge-to-edge under the status
// and navigation bars and the old opt-out is ignored at 36. The menus and the
// touch controls would sit underneath them, so the activity pads its content
// by the system-bar insets itself (display-cutout insets stay with the page's
// own env(safe-area-inset-*) rules). The window background is already the game's
// dark colour, so the padded strips are invisible.
edit('app/src/main/java/com/cinderfall/sector9/MainActivity.java', () => `package com.cinderfall.sector9;

import android.os.Bundle;
import android.view.View;
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
  }
}
`, 'MainActivity pads content by system-bar insets');
