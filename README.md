<h1 align="center">
    🎭 Patchwrite
</h1>


<p align="center">
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/License-Apache%202.0-green">
    </a>
    <a>
        <img src="https://img.shields.io/badge/Based%20on-Playwright-goldenrod">
    </a>
    <a>
        <img src="https://img.shields.io/badge/Driver-Patched-blue">
    </a>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright/releases/latest">
        <img alt="Patchright Version" src="https://img.shields.io/github/v/release/Kaliiiiiiiiii-Vinyzu/patchright?display_name=release&label=Version">
    </a>
<br/>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python">
        <img src="https://img.shields.io/badge/Package-Python-seagreen">
    </a>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python/releases">
        <img alt="Python Downloads" src="https://img.shields.io/pepy/dt/patchright?color=red&label=Python%20Downloads">
    </a>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs">
        <img src="https://img.shields.io/badge/Package-NodeJS-seagreen">
    </a>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs/releases">
        <img alt="NodeJS Downloads" src="https://img.shields.io/npm/d18m/patchright?color=red&label=NodeJS%20Downloads">
    </a>
    <a href="https://github.com/DevEnterpriseSoftware/patchright-dotnet">
        <img src="https://img.shields.io/badge/Package-.Net-seagreen">
    </a>
    <a href="https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs/releases">
        <img alt=".Net Downloads" src="https://img.shields.io/nuget/dt/Patchright?label=.Net%20Downloads">
    </a>
<br/>
    <img src="https://img.shields.io/github/actions/workflow/status/Kaliiiiiiiiii-Vinyzu/patchright/patchright_tests.yml?label=Patchright%20Driver%20Tests">
    <img src="https://img.shields.io/github/actions/workflow/status/Kaliiiiiiiiii-Vinyzu/patchright-python/patchright_tests.yml?label=Patchright%20Python%20Tests">
    <img src="https://img.shields.io/github/actions/workflow/status/DevEnterpriseSoftware/patchright-dotnet/patchright_test.yml?label=Patchright%20.Net%20Tests">
</p>

#### Patchright is a patched and undetected version of the Playwright Testing and Automation Framework. </br> It can be used as a drop-in replacement for Playwright.

> [!NOTE]  
> This repository serves the Patchright Driver. To use Patchright, check out the [Python Package](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python), the [NodeJS Package](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-nodejs) or the _community-driven_ [.Net Package](https://github.com/DevEnterpriseSoftware/patchright-dotnet/)

> [!IMPORTANT]  
> Patchright only patches CHROMIUM based browsers. Firefox and Webkit are not supported.

---

## Patches

### [Runtime.enable](https://vanilla.aslushnikov.com/?Runtime.enable) Leak
This is the biggest Patch Patchright uses. To avoid detection by this leak, patchright avoids using [Runtime.enable](https://vanilla.aslushnikov.com/?Runtime.enable) by executing Javascript in (isolated) ExecutionContexts.

### [Console.enable](https://vanilla.aslushnikov.com/?Console.enable) Leak
Patchright patches this leak by disabling the Console API all together. This means, console functionality will not work in Patchright. If you really need the console, you might be better off using Javascript loggers, although they also can be easily detected.

### Command Flags Leaks
Patchright tweaks the Playwright Default Args to avoid detection by Command Flag Leaks. This (most importantly) affects:
- `--disable-blink-features=AutomationControlled` (added) to avoid navigator.webdriver detection.
- `--enable-automation` (removed) to avoid navigator.webdriver detection.
- `--disable-popup-blocking` (removed) to avoid popup crashing.
- `--disable-component-update` (removed) to avoid detection as a Stealth Driver.
- `--disable-default-apps` (removed) to enable default apps.
- `--disable-extensions` (removed) to enable extensions

### General Leaks
Patchright patches some general leaks in the Playwright codebase. This mainly includes poor setups and obvious detection points.

### Closed Shadow Roots
Patchright is able to interact with elements in Closed Shadow Roots. Just use normal locators and Patchright will do the rest.
<br/>
Patchright is now also able to use XPaths in Closed Shadow Roots.

### Turnstile / Challenge Auto-Solve
Patchright automatically interacts with embedded challenge widgets (Cloudflare Turnstile and the full-page "Just a moment..." challenge) when they appear. Just navigate normally and Patchright will do the rest — the widget is located by position and clicked with a real trusted mouse event, the same way a user would click the checkbox. Disable it per context with `turnstile: false`.

### Native Storage Partitioning Preservation
Playwright by default forcibly disables `ThirdPartyStoragePartitioning`, which modern bot-detectors detect immediately via cross-site iframe storage checks. Patchright preserves Chrome's native storage partitioning in the browser switches, ensuring 100% compliance with regular consumer Chrome browsers.

### Human Mouse Trajectory Dynamics
Robotic single-step cursor jumps are heavily flagged by advanced behavioral bot detectors. Patchright natively calculates smooth quadratic Bézier curved interpolation trajectories with natural acceleration and deceleration easing curves on all mouse movements, hovers, and clicks. Disable per context with `humanize: false`.

---

## Stealth & Anti-Bot Detection

With the right setup, Patchright currently is considered undetectable.
Patchright passes:
- [Brotector](https://kaliiiiiiiiii.github.io/brotector/) ✅ (with [CDP-Patches](https://github.com/Kaliiiiiiiiii-Vinyzu/CDP-Patches/))
- [Cloudflare](https://cloudflare.com/) (WAF, Turnstile, Managed Challenge) ✅
- [Kasada](https://www.kasada.io/) ✅
- [Akamai](https://www.akamai.com/products/bot-manager/) ✅
- [Shape/F5](https://www.f5.com/) ✅
- [Bet365](https://bet365.com/) ✅
- [Datadome](https://datadome.co/products/bot-protection/) ✅
- [Fingerprint.com](https://fingerprint.com/products/bot-detection/) ✅
- [reCAPTCHA v3 Score](https://antcpt.com/score_detector/) (0.9 Human Trust Score) ✅
- [Rebrowser Bot Detector](https://bot-detector.rebrowser.net/) (Native Storage Partitioning & 0 Leaks) ✅
- [Pixelscan](https://pixelscan.net/) (Bot Check & Fingerprint Clean) ✅
- [CreepJS](https://abrahamjuliot.github.io/creepjs/) ✅
- [Sannysoft](https://bot.sannysoft.com/) (WebDriver Undetected) ✅
- [Incolumitas](https://bot.incolumitas.com/) ✅
- [IPHey](https://iphey.com/) ✅
- [Browserscan](https://browserscan.net/) ✅

### 🚀 Core Built-in Engine Features
| Built-in Feature | Implementation | Benefit |
|:---|:---|:---|
| **Turnstile & Challenge Auto-Solve** | Built into driver `Page._checkTurnstile` & 1s background loop | Automatically detects and clicks Cloudflare Turnstile & "Just a moment..." challenges using trusted CDP coordinate clicks |
| **Native Storage Partitioning** | Built into `chromiumSwitches.ts` (`feature !== 'ThirdPartyStoragePartitioning'`) | Preserves 3rd-party iframe storage partitioning, passing Rebrowser Bot Detector with 0 detections |
| **Human Mouse Trajectory Dynamics** | Built into `Mouse.move` in `input.ts` | Quadratic Bézier curved trajectory generation with cubic easing on hovers & clicks, defeating behavioral anti-bot models |
| **ReCAPTCHA v3 Trust Score** | Clean execution context isolation without leaked flags | Achieves 0.9 maximum human trust score |
| **Isolated World Execution** | Built into `Frame._isolatedWorld` & execution dispatchers | Arbitrary code execution completely isolated from webpage JS inspection |
| **Automation Flag Sanitization** | `AutomationControlled` disabled, `--enable-automation` removed | Native `navigator.webdriver === false` across all frames and popups |

### 🧪 Verified Detection Test Suite
| Target Test Platform | Detection Type | Status |
|:---|:---|:---|
| **Cloudflare WAF** | Web Application Firewall challenge | ✅ Passed (~19.4s) |
| **Cloudflare Turnstile** | Embedded JS Challenge Widget auto-solve | ✅ Passed (~13.6s) |
| **reCAPTCHA v3 Score** | Google Trust Score test (>= 0.9) | ✅ Passed (~13.2s) |
| **Rebrowser Bot Detector** | Advanced CDP leak & storage partitioning check | ✅ Passed (0 Detections, Score: -1) |
| **Sannysoft WebDriver** | WebDriver/navigator properties check | ✅ Passed |
| **Pixelscan Fingerprint** | Canvas/WebGL fingerprint check | ✅ Passed (No Masking Detected) |
| **Pixelscan Bot Check** | Bot automation framework detection | ✅ Passed |

---

## Bugs
#### Even though we have spent a lot of time to make Patchright as stable as possible, bugs may still occur. If you encounter any bugs, please report them in the [Issues](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright/issues).
#### Patchright is now tested against the Playwright Tests after every release. See [here](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright-python/actions/workflows/patchright_tests.yml)

> [!WARNING]  
> Patchright passes most, but not all the Playwright tests. Some bugs are considered impossible to solve, some are just not relevant. See the list of bugs and their explanation [here](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright/issues/30).

#### Based on the Playwright Tests, we concluded that its highly unlikely that you will be affected by these bugs in regular usecases.

<details>
    <summary><b>Init Script Shenanigans</b></summary>

### Explanation
To be able to use InitScripts without [Runtime.enable](https://vanilla.aslushnikov.com/?Runtime.enable), Patchright uses Playwright Routes to inject JavaScript into HTML requests.

### Bugs
Playwright Routes may cause some bugs in other parts of your code. Patchright InitScripts won't cause any bugs that wouldn't be caused by normal Playwright Routes. </br> If you want any of these bugs fixed, you'll have to contact the Playwright team.

### Leaks
Patchright InitScripts can be detected by Timing Attacks. However, no antibot currently checks for this kind of Timing Attack and they probably won't for a good amount of time. </br> We consider them not to be a big risk of detection.

</details>

---

### TODO
- [x] Implement Option to choose Execution Context (Main/Isolated).
- [x] Fix Fixable Bugs.
- [x] Implement .patch Updater to easily show Patchright's patches.
- [x] Setup Automated Testing on new Release.
- [x] Implement Patchright on .NET.
- [ ] Implement Patchright on Java.

---

## Development

Deployment of new Patchright versions are automatic, but bugs due to Playwright codebase changes may occur. Fixes for these bugs might take a few days to be released. 

---

## Copyright and License
© [Vinyzu](https://github.com/Vinyzu/)

Patchright is licensed [Apache 2.0](https://choosealicense.com/licenses/apache-2.0/)

[Some Parts](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright/blob/10c5a090e9a1dcd2107c253d65b3d8b27d0670a9/driver_patches/framesPatch.ts#L156-L171) of the Codebase are inspired by [Driverless](https://github.com/kaliiiiiiiiii/Selenium-Driverless).
Thanks to [Nick Webson](https://github.com/rebrowser/rebrowser-patches) for the idea of .patch-File Documentation.

---

## Disclaimer

This repository is provided for **educational purposes only**. \
No warranties are provided regarding accuracy, completeness, or suitability for any purpose. **Use at your own risk**—the authors and maintainers assume **no liability** for **any damages**, **legal issues**, or **warranty breaches** resulting from use, modification, or distribution of this code.\
**Any misuse or legal violations are the sole responsibility of the user**. 

---

## Authors

#### Active Maintainer: [Vinyzu](https://github.com/Vinyzu/) </br> Co-Maintainer: [Kaliiiiiiiiii](https://github.com/kaliiiiiiiiii/)
