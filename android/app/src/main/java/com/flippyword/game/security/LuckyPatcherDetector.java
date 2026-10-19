package com.flippyword.game.security;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.util.Log;
import java.io.File;
import java.util.Arrays;
import java.util.List;

/**
 * Lucky Patcher & Cracking Tools Detection Guard
 * Scans installed packages, proxy billing services, and filesystem signatures.
 */
public class LuckyPatcherDetector {

    private static final String TAG = "SecurityGuard";

    // Blacklist of known Lucky Patcher & piracy tool package names
    private static final List<String> BLACKLISTED_PACKAGES = Arrays.asList(
            "com.chelpus.lackypatch",
            "com.dimonvideo.luckypatcher",
            "com.chelpus.luckypatcher",
            "ru.aaaaaace.installer",
            "com.forpda.lp",
            "com.android.vending.billing.InAppBillingService.LUCK",
            "com.android.vending.billing.InAppBillingService.CLON",
            "com.android.vending.billing.InAppBillingService.CRAC",
            "com.android.vending.billing.InAppBillingService.LOCK",
            "com.blackmartalpha",
            "org.creeplays.hack",
            "com.allinone.free",
            "com.repodroid",
            "com.appcake",
            "com.acmarket.net"
    );

    // Blacklisted file traces created by Lucky Patcher on rooted / modded systems
    private static final String[] BLACKLISTED_FILES = {
            "/data/data/com.chelpus.lackypatch",
            "/data/app/com.chelpus.lackypatch-1.apk",
            "/data/app/com.chelpus.lackypatch-2.apk",
            "/system/app/LuckyPatcher.apk",
            "/system/priv-app/LuckyPatcher.apk",
            "/data/local/tmp/chelpus"
    };

    /**
     * Checks if any known Lucky Patcher package is installed on device.
     */
    public static boolean isLuckyPatcherInstalled(Context context) {
        PackageManager pm = context.getPackageManager();

        for (String pkg : BLACKLISTED_PACKAGES) {
            try {
                PackageInfo info = pm.getPackageInfo(pkg, 0);
                if (info != null) {
                    Log.w(TAG, "Security alert: Unauthorized tool package detected: " + pkg);
                    return true;
                }
            } catch (PackageManager.NameNotFoundException ignored) {
                // Not found, continue checking
            }
        }
        return false;
    }

    /**
     * Checks for known Lucky Patcher files and system hooks.
     */
    public static boolean hasLuckyPatcherFiles() {
        for (String path : BLACKLISTED_FILES) {
            try {
                File file = new File(path);
                if (file.exists()) {
                    Log.w(TAG, "Security alert: Unauthorized system hook detected at " + path);
                    return true;
                }
            } catch (Exception ignored) {
            }
        }
        return false;
    }

    /**
     * Verifies that the installer of this app was Google Play Store.
     */
    public static boolean isInstalledFromPlayStore(Context context) {
        try {
            PackageManager pm = context.getPackageManager();
            String installer = pm.getInstallerPackageName(context.getPackageName());
            if (installer == null) {
                // Sideloaded APK (e.g. adb or Lucky Patcher rebuild)
                return false;
            }
            return "com.android.vending".equals(installer) || "com.google.android.feedback".equals(installer);
        } catch (Exception e) {
            return false;
        }
    }
}
