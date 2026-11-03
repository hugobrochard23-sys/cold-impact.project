# COLD IMPACT : publisher pitch (EN)

> Fill the `[...]` placeholders before sending. Every claim below comes from the current build (v338). No retention/CPI figure is claimed because none has been measured yet.

## Email (short version, ~120 words)

**Subject:** COLD IMPACT : one-touch missile action with a strong upgrade loop (playable link + 30 s video)

Hi team,

I'm an independent developer (studio name: PC Code). COLD IMPACT is a mobile action game where you charge a launch, release, then steer a missile in 3D through a destructible level, upgrade it, and fight a boss at the end.

- **Hook:** the launch, then a big, readable, satisfying run (explosions, a waterfall drop, a river dam, an underwater base, a boss).
- **Loop:** destroy enemies, earn coins, upgrade Engine / Warhead / Income, watch the missile visibly evolve.
- **Content now:** 2 full levels (31 zones in total), 2 bosses, 2 missile lines, launcher upgrades, gems, reward chest, 28 skins.

Playable (mobile browser): https://hugobrochard23-sys.github.io/cold-impact.project/?evo=1
Android (Google Play closed test, send me your Google account and I will add you): https://play.google.com/apps/testing/com.king6code.coldimpactmissions
30 s gameplay video: https://youtu.be/nDlzOlXTis4
Happy to adapt the build (SDKs, format) to your pipeline.

Thanks,
PC Code
alistpassecoutrin@gmail.com

## One-pager

| | |
|---|---|
| **Title** | COLD IMPACT |
| **Genre** | Hybrid-casual action / idle upgrade loop |
| **Platform** | Mobile, portrait, one-finger controls (HTML5/WebGL; Android wrapper project available) |
| **Session** | A run lasts about 1 to 2 minutes; the upgrade screen sits between runs |
| **Core loop** | Hold to charge, release to launch, drag to steer, destroy targets, earn coins, upgrade, evolve |
| **Content** | 2 levels (12 and 19 distinct zones), 2 bosses (2 hits and 3 hits), 2 missile families with 4 visual stages each, launcher tiers, daily chest and gems, 28 cosmetic skins |
| **Visuals** | Stylised low-poly 3D, a different mood per zone (jungle, dam, delta, port at night, trench, underwater base) |
| **Languages** | English (default) and French |
| **Size** | About 9 MB first load (roughly 3.3 MB of code, 4.5 MB of images) |

## What makes it work as a video ad (for the creatives team)

1. **Second 0 to 2:** a missile locked on the pad, a finger holds, a huge launch.
2. **Near misses:** torpedoes graze the missile, rocks and bridges pass inches away.
3. **Big events:** a 64 m waterfall drop, a dive from the river into an underwater cave and base, boss reveal with a giant explosion.
4. **Payoff:** the missile visibly evolves (floats, then tracks, then a final navy and cyan livery).

## Monetisation hooks already in the build

- **Rewarded:** revive after a crash, double coins on the end screen, bonus on the chest, free gems (3 per day).
- **Interstitial:** between the end screen and the next run only, never during play; frequency is configurable (currently: not before run 5, then every 2nd run, minimum 90 s apart).
- **IAP:** ad-free pack, starter pack and gems are wired to Google Play Billing in the Android build. The ad SDK is Google AdMob with **test ad units** (no real ad revenue); the publisher's own SDK can replace it.

## Honest status (so you do not discover it later)

- No measured retention or CPI yet. We are looking for a publisher to run the first test.
- The web build shows sample ads with invented brands. The Android build uses AdMob test ads.
- Built as a web game; an Android wrapper (WebView) is published to a closed test on Google Play. A Unity port is **not** done; we can discuss it if your pipeline requires it.
