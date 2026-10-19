# --- R8 / ProGuard Obfuscation & Anti-Lucky Patcher Protection Rules ---

# 1. Enable Aggressive Code & Name Obfuscation
-optimizationpasses 5
-repackageclasses ''
-allowaccessmodification
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# 2. Obfuscate security & licensing classes completely
# Ensure Lucky Patcher's regex scanner cannot find methods by name
-keepclassmembers class com.flippyword.game.security.** {
    public *;
}
-keepclassmembers class com.flippyword.game.licensing.** {
    public *;
}

# 3. WebView Javascript Interface requirements
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# 4. Standard Android rules
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# 5. Suppress warnings from reflective frameworks
-dontwarn android.webkit.**
-dontwarn androidx.**
