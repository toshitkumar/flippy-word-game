package com.flippyword.game.security;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Validates APK Signing Certificate Fingerprint.
 * Lucky Patcher must re-sign the APK after modifying bytecode,
 * causing this check to fail immediately.
 */
public class SignatureVerifier {

    // When you build your official signed release AAB/APK,
    // paste your release certificate SHA-256 fingerprint here (uppercase, colon-separated or continuous).
    // e.g. "A1:B2:C3:D4:..." or standard debug key for development
    public static final String EXPECTED_RELEASE_SHA256 = "YOUR_OFFICIAL_RELEASE_KEY_SHA256";

    /**
     * Retrieves the SHA-256 signature hash of the running app.
     */
    public static String getAppSignatureSHA256(Context context) {
        try {
            PackageManager pm = context.getPackageManager();
            String packageName = context.getPackageName();
            Signature[] signatures;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNING_CERTIFICATES);
                if (packageInfo.signingInfo == null) return null;
                if (packageInfo.signingInfo.hasMultipleSigners()) {
                    signatures = packageInfo.signingInfo.getApkContentsSigners();
                } else {
                    signatures = packageInfo.signingInfo.getSigningCertificateHistory();
                }
            } else {
                @SuppressWarnings("deprecation")
                PackageInfo packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_SIGNATURES);
                signatures = packageInfo.signatures;
            }

            if (signatures != null && signatures.length > 0) {
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                byte[] digest = md.digest(signatures[0].toByteArray());
                return bytesToHex(digest);
            }
        } catch (PackageManager.NameNotFoundException | NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Checks if the app's signature matches the expected official key.
     */
    public static boolean verifySignature(Context context) {
        String currentSig = getAppSignatureSHA256(context);
        if (currentSig == null) return false;

        // If developing in debug mode, pass through
        if ("YOUR_OFFICIAL_RELEASE_KEY_SHA256".equals(EXPECTED_RELEASE_SHA256)) {
            return true; // Placeholder for initial build, replace with production fingerprint
        }

        return currentSig.equalsIgnoreCase(EXPECTED_RELEASE_SHA256.replace(":", ""));
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }
}
