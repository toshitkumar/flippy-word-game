# 🎮 Flippy Words — Complete Play Store Publishing & Security Guide

Flippy Words is an addictive **Flappy + Word Spelling Hybrid Arcade Game** with infinite levels and multi-layer **Anti-Piracy & Anti-Lucky Patcher Protection**, tailored for Google Play Store as a **Paid Game (₹49 / ₹99)**.

---

## 🛡️ Anti-Lucky Patcher Protection System

Lucky Patcher commonly targets Paid games by attempting to:
1. Strip Google Play License checks (LVL).
2. Intercept purchase intents using fake billing proxy services (`InAppBillingService.LUCK`).
3. Re-sign modified APKs with a custom debug key.
4. Inject smali code or zero-out checksums.

### Humne is game me kya-kya anti-crack guards lagaye hain:
1. **APK Signature Fingerprint Check (`SignatureVerifier.java`)**:
   - App start hone par apna actual SHA-256 signing certificate verify karti hai.
   - Lucky Patcher jab bhi file ko patch karke dubara sign karega, signature change ho jayega aur game turant **"Security Violation: Tampered APK"** bolkar band ho jayegi.
2. **Lucky Patcher Package & Proxy Detection (`LuckyPatcherDetector.java`)**:
   - Phone me installed packages scan karta hai (`com.chelpus.lackypatch`, `ru.aaaaaace.installer`, `com.forpda.lp`, etc.).
   - Agar kisi ke phone me Lucky Patcher ya custom modded billing service chalu hogi, game open nahi hogi.
3. **Google Play Installer Verification**:
   - Verify karta hai ki game Google Play Store (`com.android.vending`) se download hui hai ya kisi 3rd party site se sideload ki gayi hai.
4. **Bytecode DEX Integrity Check**:
   - APK ke andar `classes.dex` ka CRC aur size inspect karta hai taaki koi bytecode modify na kar sake.
5. **R8 / ProGuard Obfuscation (`proguard-rules.pro`)**:
   - Saare classes aur methods ke names ko scramble karke `a.b.c()` jaisa bana deta hai taaki Lucky Patcher ke automated regex hooks target methods ko dhoondh hi na sakein.

---

## 🚀 Play Store Par Publish Karne Ka Step-by-Step Process

### Step 1: Google Play Console Developer Account ($25)
1. Go to [Google Play Console](https://play.google.com/console/signup).
2. Apne Google Account se login karein aur One-Time **$25 registration fee** pay karein.
3. Apna Identity Verification (PAN card / Passport) aur D-U-N-S / Phone verification complete karein.

### Step 2: Merchant Account Setup (Paisa Bank Me Aane Ke Liye)
Chunki aapka game **Paid Game** hai (jaise ₹49 ya ₹99):
1. Play Console me left menu se **Settings ➔ Payments profile** par jayein.
2. Apna Indian Bank Account link karein aur GST/Tax details fill karein.
3. Google har mahine ki 15-20 tareekh ko aapki saari sales ka paisa direct bank me transfer karta hai.

### Step 3: Release Keystore & Signed `.aab` Generate Karna
1. Android Studio me `flippy-word-game/android` folder ko open karein.
2. Top menu me jayein: **Build ➔ Generate Signed Bundle / APK**.
3. Select karein **Android App Bundle (.aab)**.
4. **Create new keystore**:
   - Key store path: `flippy-words-key.jks`
   - Password set karein (isko hamesha yaad rakhein aur safe jagah save karein).
5. Build variant me **`release`** select karein.
6. Android Studio aapke liye `app-release.aab` file generate kar dega.

### Step 4: Release Key ka SHA-256 Code me Paste Karna
1. Terminal me command run karein:
   ```bash
   keytool -list -v -keystore flippy-words-key.jks
   ```
2. Wahan se `SHA-256` fingerprint copy karein.
3. `SignatureVerifier.java` file kholein aur `EXPECTED_RELEASE_SHA256` me apna fingerprint paste kar dein:
   ```java
   public static final String EXPECTED_RELEASE_SHA256 = "XX:XX:XX:XX:...";
   ```

### Step 5: Play Console Par Game List Karna
1. Play Console me **Create app** par click karein.
2. App Name: **Flippy Words - Word Flap Game**
3. Default language: **English (United States)**
4. App or game: **Game**
5. Free or paid: **Paid**
6. Price set karein: **₹49** (ya jo bhi aap chahein).
7. Store Listing me screenshots, game icon (512x512 PNG) aur description dalein.
8. **Production / Closed Testing** track me apni generated `.aab` file upload karein.
9. Review ke liye submit kar dein!

---

## 🕹️ Game Ko Abhi Apne Computer Par Test Kaise Karein?

1. Folder kholein: `C:\Users\Toshit Kumar\.gemini\antigravity\scratch\flippy-word-game\`
2. **`play_game.bat`** file par double-click karein.
3. Browser automatically open ho jayega aur aap game ko spacebar ya mouse click se abhi khel sakte hain!
