package com.flippyword.game;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import com.flippyword.game.licensing.PlayLicenseGuard;
import com.flippyword.game.security.AntiTamperGuard;

/**
 * Main Activity hosting the Flippy Words Game engine.
 * Armed with runtime anti-tamper security & Lucky Patcher defenses.
 */
public class MainActivity extends AppCompatActivity {

    private WebView mWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 1. Run Master Security Audit before anything else
        AntiTamperGuard.SecurityResult audit = AntiTamperGuard.performSecurityAudit(this);
        if (!audit.isSecure) {
            terminateWithSecurityAlert(audit.violationReason);
            return;
        }

        // 2. Verify Google Play Paid Game License
        PlayLicenseGuard.checkAppLicense(this, new PlayLicenseGuard.LicenseCallback() {
            @Override
            public void onLicenseValid() {
                // License is valid: proceed to launch game
                setupImmersiveGame();
            }

            @Override
            public void onLicenseInvalid(String reason) {
                terminateWithSecurityAlert("License verification failed: " + reason);
            }
        });
    }

    private void setupImmersiveGame() {
        setFullscreenImmersive();

        mWebView = new WebView(this);
        setContentView(mWebView);

        configureWebView(mWebView);
        mWebView.loadUrl("file:///android_asset/www/index.html");
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView(WebView webView) {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        // Optimize performance & hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Keep all navigation strictly inside internal asset game
                return !url.startsWith("file:///android_asset/");
            }
        });
    }

    private void setFullscreenImmersive() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            final WindowInsetsController insetsController = getWindow().getInsetsController();
            if (insetsController != null) {
                insetsController.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                insetsController.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            @SuppressWarnings("deprecation")
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }

    private void terminateWithSecurityAlert(String reason) {
        new AlertDialog.Builder(this)
                .setTitle("Security Violation")
                .setMessage("Flippy Words detected system tampering or unauthorized modifications.\n\n" + reason + "\n\nPlease download the official game from Google Play Store.")
                .setCancelable(false)
                .setPositiveButton("Exit", (dialog, which) -> {
                    finishAffinity();
                    System.exit(0);
                })
                .show();
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        setFullscreenImmersive();
        if (mWebView != null) {
            mWebView.onResume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (mWebView != null) {
            mWebView.onPause();
        }
    }

    @Override
    protected void onDestroy() {
        if (mWebView != null) {
            mWebView.destroy();
        }
        super.onDestroy();
    }
}
