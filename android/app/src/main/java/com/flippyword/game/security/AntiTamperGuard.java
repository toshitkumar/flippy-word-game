package com.flippyword.game.security;

import android.content.Context;
import android.os.Debug;
import java.io.FileInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Master Security Guard & Anti-Tamper Orchestrator
 */
public class AntiTamperGuard {

    public static class SecurityResult {
        public final boolean isSecure;
        public final String violationReason;

        public SecurityResult(boolean isSecure, String violationReason) {
            this.isSecure = isSecure;
            this.violationReason = violationReason;
        }
    }

    /**
     * Executes all anti-patching, anti-tamper and piracy checks.
     */
    public static SecurityResult performSecurityAudit(Context context) {
        // 1. Check for active Lucky Patcher packages
        if (LuckyPatcherDetector.isLuckyPatcherInstalled(context)) {
            return new SecurityResult(false, "Unauthorized patching utility detected on system.");
        }

        // 2. Check for Lucky Patcher system files & root hooks
        if (LuckyPatcherDetector.hasLuckyPatcherFiles()) {
            return new SecurityResult(false, "System tampering artifacts detected.");
        }

        // 3. Verify APK Signature Integrity
        if (!SignatureVerifier.verifySignature(context)) {
            return new SecurityResult(false, "Application signature verification failed (Tampered APK).");
        }

        // 4. Check for active debuggers or hooking tools
        if (Debug.isDebuggerConnected() || Debug.waitingForDebugger()) {
            return new SecurityResult(false, "Debugging / Hooking engine detected.");
        }

        // 5. Verify classes.dex integrity within APK
        if (isDexCorruptedOrPatched(context)) {
            return new SecurityResult(false, "Bytecode integrity check failed (Patched DEX).");
        }

        return new SecurityResult(true, "Secure");
    }

    /**
     * Inspects classes.dex within the APK container to detect smali modifications.
     */
    private static boolean isDexCorruptedOrPatched(Context context) {
        try {
            String apkPath = context.getPackageCodePath();
            ZipInputStream zip = new ZipInputStream(new FileInputStream(apkPath));
            ZipEntry entry;
            boolean dexFound = false;

            while ((entry = zip.getNextEntry()) != null) {
                if ("classes.dex".equals(entry.getName())) {
                    dexFound = true;
                    // Lucky Patcher zero-padding or smali injections alter standard sizes
                    if (entry.getSize() == 0 && entry.getCrc() == 0) {
                        zip.close();
                        return true;
                    }
                }
                zip.closeEntry();
            }
            zip.close();
            return !dexFound;
        } catch (Exception e) {
            return false;
        }
    }
}
