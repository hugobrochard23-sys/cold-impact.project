package com.coldimpact.game;

import android.app.Activity;
import android.os.Build;
import android.view.DisplayCutout;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/** Pont entre le jeu (JavaScript) et Android : publicites AdMob (recompensee, interstitielle), consentement europeen (UMP), achats Google Play Billing.
 *  Le jeu appelle AndroidBridge.xxx ; les reponses reviennent par window.__nat / __natPrices / __natPurchase. */
public class NativeBridge {
    // IDs de TEST de Google par defaut (voir app/build.gradle : remplaces par ads.properties pour la production)
    private static final String[] PRODUCTS = { "noads", "starter", "gems5", "gems10", "gems30", "gems100", "gems250", "coins12k", "coins40k", "coins100k" };
    private final Activity act;
    private final WebView web;
    private final String rewardedUnit, interstitialUnit;
    private RewardedAd rewarded;
    private InterstitialAd interstitial;
    private boolean loadingR, loadingI, adsReady, jsReady;
    private volatile boolean inFlight, pendingR, pendingI;   // v338 : pas de chargement de pub pendant le vol (le SDK de pub saccadait le jeu)
    private final AtomicBoolean adsInit = new AtomicBoolean(false);
    private BillingClient billing;
    private final List<ProductDetails> details = new ArrayList<>();
    private ConsentInformation consent;

    public NativeBridge(Activity a, WebView w, String rewardedUnit, String interstitialUnit) {
        act = a; web = w; this.rewardedUnit = rewardedUnit; this.interstitialUnit = interstitialUnit;
    }

    // ---------------------------------------------------------------- demarrage
    public void start() {
        consent = UserMessagingPlatform.getConsentInformation(act);
        ConsentRequestParameters p = new ConsentRequestParameters.Builder().build();
        consent.requestConsentInfoUpdate(act, p,
            () -> UserMessagingPlatform.loadAndShowConsentFormIfRequired(act, err -> { if (consent.canRequestAds()) initAds(); }),
            err -> { if (consent.canRequestAds()) initAds(); });
        if (consent.canRequestAds()) initAds();
        connectBilling();
    }

    /** appele par le jeu : vrai pendant un vol. En vol on ne charge aucune pub ; elles se chargent des le retour au menu. */
    @JavascriptInterface public void flying(final boolean f) {
        inFlight = f;
        if (!f) act.runOnUiThread(() -> { if (pendingR) { pendingR = false; loadRewarded(); } if (pendingI) { pendingI = false; loadInterstitial(); } });
    }
    /** hauteur (en px CSS = dp) a laisser libre en haut : encoche / camera ou barre d'etat */
    @JavascriptInterface public float topInset() {
        float d = act.getResources().getDisplayMetrics().density; int px = 0;
        try {
            int id = act.getResources().getIdentifier("status_bar_height", "dimen", "android"); if (id > 0) px = act.getResources().getDimensionPixelSize(id);
            if (Build.VERSION.SDK_INT >= 28) { WindowInsets wi = act.getWindow().getDecorView().getRootWindowInsets(); if (wi != null) { DisplayCutout dc = wi.getDisplayCutout(); if (dc != null) px = Math.max(px, dc.getSafeInsetTop()); } }
        } catch (Throwable t) { /* ignore */ }
        return px / d;
    }
    public void resume() { if (billing != null && billing.isReady()) restore(); }
    private void js(final String code) { act.runOnUiThread(() -> web.evaluateJavascript(code, null)); }

    // ---------------------------------------------------------------- publicites
    private void initAds() {
        if (!adsInit.compareAndSet(false, true)) return;
        act.runOnUiThread(() -> MobileAds.initialize(act, st -> { adsReady = true; loadRewarded(); loadInterstitial(); }));
    }
    private void loadRewarded() {
        if (!adsReady || loadingR || rewarded != null) return; if (inFlight) { pendingR = true; return; } loadingR = true;
        RewardedAd.load(act, rewardedUnit, new AdRequest.Builder().build(), new RewardedAdLoadCallback() {
            @Override public void onAdLoaded(RewardedAd ad) { rewarded = ad; loadingR = false; }
            @Override public void onAdFailedToLoad(LoadAdError e) { rewarded = null; loadingR = false; }
        });
    }
    private void loadInterstitial() {
        if (!adsReady || loadingI || interstitial != null) return; if (inFlight) { pendingI = true; return; } loadingI = true;
        InterstitialAd.load(act, interstitialUnit, new AdRequest.Builder().build(), new InterstitialAdLoadCallback() {
            @Override public void onAdLoaded(InterstitialAd ad) { interstitial = ad; loadingI = false; }
            @Override public void onAdFailedToLoad(LoadAdError e) { interstitial = null; loadingI = false; }
        });
    }
    private void result(String id, String st) { js("window.__nat&&window.__nat('" + id + "','" + st + "')"); }

    @JavascriptInterface public void showRewarded(final String id) {
        act.runOnUiThread(() -> {
            final RewardedAd ad = rewarded;
            if (ad == null) { loadRewarded(); result(id, "failed"); return; }
            rewarded = null;
            final boolean[] earned = { false };
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { result(id, earned[0] ? "rewarded" : "closed"); loadRewarded(); }
                @Override public void onAdFailedToShowFullScreenContent(AdError e) { result(id, "failed"); loadRewarded(); }
            });
            ad.show(act, item -> earned[0] = true);
        });
    }
    @JavascriptInterface public void showInterstitial(final String id) {
        act.runOnUiThread(() -> {
            final InterstitialAd ad = interstitial;
            if (ad == null) { loadInterstitial(); result(id, "failed"); return; }
            interstitial = null;
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() { result(id, "closed"); loadInterstitial(); }
                @Override public void onAdFailedToShowFullScreenContent(AdError e) { result(id, "failed"); loadInterstitial(); }
            });
            ad.show(act);
        });
    }
    /** vrai quand le message de confidentialite europeen peut etre rouvert (reglages) */
    @JavascriptInterface public boolean privacyRequired() {
        return consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }
    @JavascriptInterface public void showPrivacy() { act.runOnUiThread(() -> UserMessagingPlatform.showPrivacyOptionsForm(act, err -> { if (consent.canRequestAds()) initAds(); })); }

    // ---------------------------------------------------------------- achats
    /** le jeu est charge : on peut lui livrer les achats en attente */
    @JavascriptInterface public void ready() { jsReady = true; if (billing != null && billing.isReady()) { sendPrices(); restore(); } }

    private void connectBilling() {
        billing = BillingClient.newBuilder(act)
            .setListener((r, list) -> { if (r.getResponseCode() == BillingClient.BillingResponseCode.OK && list != null) deliver(list); })
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()).build();
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult r) { if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) loadProducts(); }
            @Override public void onBillingServiceDisconnected() { }
        });
    }
    private void loadProducts() {
        List<QueryProductDetailsParams.Product> ps = new ArrayList<>();
        for (String p : PRODUCTS) ps.add(QueryProductDetailsParams.Product.newBuilder().setProductId(p).setProductType(BillingClient.ProductType.INAPP).build());
        billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(ps).build(), (r, res) -> {   // billing 8 : le resultat est un QueryProductDetailsResult
            List<ProductDetails> list = res != null ? res.getProductDetailsList() : null;
            synchronized (details) { details.clear(); if (list != null) details.addAll(list); }
            if (jsReady) sendPrices(); restore();
        });
    }
    private void sendPrices() {
        StringBuilder sb = new StringBuilder("{");
        synchronized (details) { for (ProductDetails d : details) { ProductDetails.OneTimePurchaseOfferDetails o = d.getOneTimePurchaseOfferDetails(); if (o != null) sb.append('"').append(d.getProductId()).append("\":\"").append(o.getFormattedPrice().replace("\"", "")).append("\","); } }
        if (sb.length() > 1) sb.setLength(sb.length() - 1);
        sb.append('}');
        js("window.__natPrices&&window.__natPrices('" + sb.toString().replace("'", "") + "')");
    }
    /** achats deja effectues mais pas encore livres / confirmes (et restauration apres reinstallation) */
    private void restore() {
        if (!jsReady) return;
        billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build(), (r, list) -> { if (r.getResponseCode() == BillingClient.BillingResponseCode.OK) deliver(list); });
    }
    private void deliver(List<Purchase> list) {
        if (!jsReady) return;   // sera relivre par restore() des que le jeu est pret
        for (Purchase p : list) {
            if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED) continue;
            for (String pid : p.getProducts()) js("window.__natPurchase&&window.__natPurchase('" + pid + "','" + p.getPurchaseToken().replace("'", "") + "')");
        }
    }
    @JavascriptInterface public void buy(final String productId) {
        act.runOnUiThread(() -> {
            ProductDetails pd = null;
            synchronized (details) { for (ProductDetails d : details) if (d.getProductId().equals(productId)) pd = d; }
            if (pd == null || billing == null || !billing.isReady()) { js("window.__natPurchaseFail&&window.__natPurchaseFail('" + productId + "','unavailable')"); if (billing != null && !billing.isReady()) connectBilling(); return; }
            BillingFlowParams.ProductDetailsParams pp = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(pd).build();
            billing.launchBillingFlow(act, BillingFlowParams.newBuilder().setProductDetailsParamsList(Collections.singletonList(pp)).build());
        });
    }
    /** le jeu a donne l'achat au joueur : on le consomme (gemmes, rachetables) ou on l'acquitte (sans pub, pack de depart) */
    @JavascriptInterface public void confirm(final String token, final boolean consumable) {
        if (billing == null || !billing.isReady()) return;
        if (consumable) billing.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(token).build(), (r, t) -> { });
        else billing.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(token).build(), r -> { });
    }
}
