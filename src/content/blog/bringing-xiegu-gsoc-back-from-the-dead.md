---
title: 'Bringing the Xiegu GSOC back from the dead'
description: "One HAM's bench notes on why it broke and what works on a v1.81 body instead."
pubDate: 'Jul 28 2026'
heroImage: '../../assets/posts/xiegu-bench-wiring.webp'
tags:
  - ham-radio
  - reverse-engineering
  - xiegu
---

_One HAM's bench notes on why it broke and what works on a v1.81 body instead._

**Code & docs:** [github.com/cjlawson02/xiegu-g90-research](https://github.com/cjlawson02/xiegu-g90-research)

A couple of years ago I bought a Xiegu **[GSOC](https://www.radioddity.com/products/xiegu-gsoc)**, which in retrospect was either optimism or a mild personality disorder. I already loved the little **[G90](https://www.radioddity.com/products/xiegu-g90)**. The companion head felt like the obvious next step: bigger picture of the band, less squinting at the stock display unit, and more “this is actually a HF station.”

![Stock Xiegu GSOC controller](/blog/xiegu-gsoc/gsoc-stock.jpg)

_Stock GSOC product photo ([Radioddity](https://www.radioddity.com/products/xiegu-gsoc))._

Then the punch-in-the-face arrived early: even when I bought it, G90 firmware had already lapped the GSOC. Flash any modern firmware onto the radio and the controller becomes a very big paperweight. The [forums](https://xiegug90.groups.io/g/XieguG90) had the workaround strategy nailed: **stay on firmware [≤v1.78](https://github.com/d3cker/gsoc-puhumod/blob/master/README.md)**, which is a polite way of saying the vendor moved on and you’re now the curator of a firmware museum. ([YO3HJV](https://yo3hjv.blogspot.com/2021/05/xiegu-g90-comm-lost-error.html) had the “COMM LOST” story years before anyone had a clean byte map.)

Nearly four years after the v1.79 firmware break, Xiegu still isn’t coming to save this thing. So I started reverse engineering the protocol myself.

Normally that means weeks of static analysis, wrong guesses, and forum posts. I used [Ghidra](https://www.ghidra-sre.org/) and [Cursor](https://cursor.com/) together, not to skip the hard parts, but to iterate faster on encode/decode rules and tests once the firmware diff pointed at the real change. The surprising part was how _small_ the remaining problem became: one vocabulary jump at **display 1.78b01 → 1.79b02**, not a new wire format.

But what am I even trying to do here? Three goals, none finished... yet:

1. GSOC working on current G90 firmware again
2. Drive the body from a computer (or anything you choose) with more than [CAT](https://xiegu.eu/sdm_downloads/g90-civ-reference-v1-0/) alone
3. Open-source the library that supports both

What follows is the paved path so far: break map, codec, tests, live bench, not a shipped product. Goal #2 has a working lab path on a v1.81 MainUnit I had on the desk. I have not run this on your radio, and I have not touched GSOC hardware in this pass. Goal #3 is [xiegu-g90-research](https://github.com/cjlawson02/xiegu-g90-research). Goal #1 is still later.

_Before we get started, here’s the obligatory: I’m not with Xiegu or Radioddity. This is my own radio, my own mistakes. I’m publishing protocol notes and original codec/control code, not any keys, nor decrypted firmware dumps._

## Same wire, different dialect

The G90’s display↔body link on the front-panel [DE-9 connector](https://en.wikipedia.org/wiki/DE-9) is a proprietary binary conversation. This is not the [CI-V](https://www.cryptomuseum.com/ref/protocol/civ/) protocol on the CAT port. Community work (especially [zeroping’s headprotocol notes](https://github.com/zeroping/xiegu-g90-headprotocol)) already had the wire format mostly right: small fixed-size messages both ways, each ending in a [CRC-32 checksum](https://en.wikipedia.org/wiki/Cyclic_redundancy_check#CRC-32/MPEG-2) (the MPEG-2 variant, a polynomial name, not video compression), at a boring 115200 serial bitrate.

![DE-9 connector on the radio body](/blog/xiegu-gsoc/de9.webp)

_DE-9 connector on the radio body: bottom left hole is pin 1, bottom right is pin 5._

When users upgraded the **G90** past the last GSOC-compatible pair (**display firmware [1.78b01 → 1.79b02](https://www.radioddity.com/pages/xiegu-download)**, with a matched body), the _meaning of the bytes_ changed: mode numbering, filter encoding, spectrum zoom. Stock GSOC firmware kept speaking v1.78 into a body that had moved on. Of course it faceplanted.

The DE-9 fields that actually brick the GSOC are mode, filter packing, and spectrum zoom. On v1.81 hardware I did not see those move again from 1.79 through 1.81; AM/NFM defaults and CI-V still churn per release, but the head-link vocabulary that matters here looked stable. (I've checked this with firmware RE on my side; the public repo defends the `1.81` alias with tests and fixtures, not a per-version capture matrix.)

And on **my** bench (one live **MainUnit v1.81**, stock head unplugged, cheap [FT232](https://www.amazon.com/dp/B07BBPX8B8) at **3.3 V** pretending to be a display) I was able to:

- talk both directions without the radio hanging up on me
- change mode and tune, and watch the body actually do it (automated body-effect checks, not “the S-meter twitched”)
- draw the spectrum/waterfall the body was already sending back for free, relative bins, **not** calibrated dBm

Although this is not yet a "product", not independent replication, and not “GSOC fixed", it does introduce a light at the end of the tunnel. This is the first step towards a working GSOC on current G90 firmware, maybe even with an open-source UI/controls.

## How a nice radio accessory became a brick

The GSOC is basically a tiny Linux PC ([Allwinner A20](https://en.wikipedia.org/wiki/Allwinner_A20)) acting as a G90 head. [gsoc-contrib](https://github.com/mdubinko/gsoc-contrib) already did the teardown justice (also props to [Radioddity for blogging](https://www.radioddity.com/blogs/all/xiegu-gsoc-teardown-open-source-project) this!). The GSOC software that talks proprietary serial froze at FW **v1.3**. Good news: the hardware didn’t rot. Bad news: the software did. (See [gsoc-contrib](https://github.com/mdubinko/gsoc-contrib) for teardown photos: hardware fine, software frozen.)

So, I opened the boxes myself and started reverse engineering the protocol. Importantly: **none of the work happened with a soldering iron**. It happened with firmware images, Ghidra, and an AI that could keep iterating while I steered.

First I pulled the official GSOC **v1.3** Linux SD-card image ([Radioddity firmware portal](https://www.radioddity.com/pages/xiegu-download)) and threw [AI](https://cursor.com/) and [Ghidra](https://www.ghidra-sre.org/) at it. Not to “rewrite the whole UI from scratch on day one,” just to find how this thing actually talks on the DE-9. Which serial port? What messages does it send? What does it expect back? A few years ago that archaeology would have burned weekends: chasing strings, renaming mystery functions, sketching “who calls whom,” getting lost in a stripped Linux app, coming back tomorrow. With AI in the loop it became boring in the best way: I would ask a question, get a map, check it against the binary, correct the bad guess, and ask the next one. The answer that mattered, for me, was boring: the GSOC is not doing magic. It’s speaking the same head↔body dialect the stock display unit speaks, frozen at the dialect it knew in 2021, on top of wire-format work [zeroping](https://github.com/zeroping/xiegu-g90-headprotocol) and others had already sketched.

Then I pulled the official G90 **v1.78** and **v1.79** firmware packages for both the display unit and the radio body, decrypted them locally with the [community-known method](https://github.com/OpenHamradioFirmware/G90Tools) (keys already public elsewhere; not republished here), and compared them again with AI + Ghidra. Firmware decryption stayed on my machine for diffing only. It is not in [the public repo](https://github.com/cjlawson02/xiegu-g90-research) and isn’t required to use the codec. If you decrypt vendor images, that’s your local legal calculus; [xiegu-g90-research](https://github.com/cjlawson02/xiegu-g90-research) publishes behavior and clean-room code only.

That static reverse engineering is where the brick became a concrete, testable byte-level claim. With the frozen GSOC app on one hand, and G90 head/body firmware across the break on the other, the change became something you could point at in decomp instead of hand-wave on a forum. AI helped me walk the “how do we pack mode/filter/spectrum into a message?” paths on _both_ ends, draft the encode/decode rules, generate test vectors, and revise them when a claim didn’t hold up. The cut that matters for GSOC owners is **display firmware 1.78b01 → 1.79b02**. Plain-English version:

| What changed     | Old world (≤1.78 / stock GSOC)                          | New world (1.79+ … 1.81)                                                  |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Mode numbers     | Six modes, numbered the old way (USB was basically “1”) | Two digital modes shoved into the middle; every number after that shifted |
| Filter bandwidth | Edges packed in ~25 Hz steps (different hi/lo offsets)  | Same idea, different math (~50 Hz steps, shared −50 Hz baseline)          |
| Spectrum “zoom”  | Manual gain _or_ AUTO                                   | AUTO only; the manual knob went away                                      |

![Mode wire values: one vocabulary jump](/blog/xiegu-gsoc/mode-break.webp)

_Same frame sizes and CRC; different packing for mode, filter, and spectrum zoom._

![Classic GSOC mishap: encode USB as 1.78, decode as 1.79 → L-D](/blog/xiegu-gsoc/mishap-decode.webp)

_Clean-room codec demo: CRC still OK; the body would read L-D, not USB._

That is the interoperability brick for mode, filter, and spectrum zoom, spelled out instead of “protocol changed, good luck.” Vendor still wants matched head+body versions; this is the payload drift that makes frozen GSOC v1.3 toxic on a ≥1.79 body.

Before I trusted any of that on a cable, I encoded it as something a machine can fail: a dual-profile codec (`1.78` for the old world, `1.79` for post-break), golden vectors, and [`pytest tests/`](https://github.com/cjlawson02/xiegu-g90-research#quick-start) that must pass. AI helped with the boring loop (draft encoder, write test, run it, fix the claim), but the pass/fail gate was always the tests and then a live radio, not my confidence.

![pytest tests/: 54 passed](/blog/xiegu-gsoc/pytest-pass.webp)

## What I actually did with a cable

I didn’t start by tearing the GSOC board apart. I started by pretending to be a head.

Power off with the stock display unit fully unplugged, then connect a 3.3V FT232 on the front-panel DE-9 only, **115200 8N1, no flow control**:

- pin 5 → ground
- pin 2 → adapter TX (laptop talking to the radio)
- pin 3 → adapter RX (radio talking back)

To power on the body without the stock head attached, I shorted pin 4 to pin 5 (ground) momentarily; treat that as “press the power button,” not a permanent strap. Your mileage may vary; see [bench-setup](https://github.com/cjlawson02/xiegu-g90-research/blob/main/docs/bench-setup.md) for the conservative wiring notes.

![Bench wiring: FT232 to DE-9, stock head unplugged](/blog/xiegu-gsoc/bench-wiring.webp)

_Fake-head setup: GND→pin 5, adapter TX→pin 2, RX→pin 3; FT232 at 3.3 V logic. Stock display head unplugged from the DE-9._

Note: pin 1 is +8 V. If you wire that into your adapter because “power is power,” congratulations on adding your laptop to your existing paperweight collection. (The GSOC is already in there, right?). And again, make sure to set the FT232 jumper to **3.3 V** before you drive TX. 5 V logic on pin 2 is how you also add the G90 to this exponentially growing paperweight collection.

From there the loop was deliberately unromantic:

1. Listen until the radio’s replies looked like real, intact messages, not garbage ([`g90-live-head`](https://github.com/cjlawson02/xiegu-g90-research/blob/main/src/g90_control/cli/live_head.py)).
2. Start sending “I’m a display unit” messages with profile **`1.81`** (same wire map as `1.79`). Encode with the old `1.78` map on a ≥1.79 body and CRC still passes. That’s the classic brick: USB becomes L-D, and the radio politely misreads you forever.
3. Change mode and frequency on purpose, then demand proof the body actually moved: run [`g90-effect-diff`](https://github.com/cjlawson02/xiegu-g90-research/blob/main/src/g90_control/cli/effect_diff.py) until mode step, frequency step, header delta, and FFT fingerprint all move, with Po=0.

![g90-effect-diff PASS on live MainUnit v1.81](/blog/xiegu-gsoc/effect-diff-live.webp)

_RX-only ladder: mode and frequency steps moved body header + FFT; `Po=0` throughout._

Then the fun part: those reply messages already carry a chunk of spectrum data the stock head uses for its little scope ([372-byte body→head layout](https://github.com/zeroping/xiegu-g90-headprotocol/blob/main/log_body.py)). I pointed a small plotter at them ([`g90-live-fft`](https://github.com/cjlawson02/xiegu-g90-research/blob/main/src/g90_control/cli/live_fft.py)). It made a pretty picture on the desk, but only in relative bins (not dBm), which was enough to confirm the parse and not enough to call calibrated.

![Stock display unit remote scope at 1.400 MHz AM](/blog/xiegu-gsoc/fft-dispunit.webp)

_Vendor UI on the stock Xiegu display head, same 1.400 MHz AM carrier, for comparison._

![Fake-head g90-live-fft at 1.400 MHz AM](/blog/xiegu-gsoc/fft-live-1m4-am.webp)

_Stock head unplugged; laptop on the DE-9. Animated waterfall from live body bins, pretty but not calibrated (relative units, not dBm)._

AI helped write much of the codec, test, and plotter code, and that seems worth saying up front. The byte map, the fixtures, and a live MainUnit v1.81 passing `g90-effect-diff` were the parts I kept doubting until I saw them on the bench. A frame can pass CRC and still have the body on L-D when I meant USB, which is exactly the trap this work was trying to avoid.

## So what’s actually new?

[Zeroping’s headprotocol notes](https://github.com/zeroping/xiegu-g90-headprotocol), [gsoc-contrib](https://github.com/mdubinko/gsoc-contrib)’s teardown, years of [forum posts](https://xiegug90.groups.io/g/TechnicalAnalysis) saying “don’t flash past 1.78”: people already knew the GSOC broke when the G90 moved on. What was still missing was the byte-level _why_, and any proof you could talk to a current body again.

The break lands on **display firmware 1.78b01 → 1.79b02**: same 96-byte head frames, same 372-byte replies, same CRC, same 115200 serial, but mode numbers renumbered when L-D and U-D showed up, filter math changed, and spectrum zoom went AUTO-only. Stock GSOC still sends the old packing; a v1.79+ body misreads it. There is no magic version handshake on the wire; send the wrong mode byte and you lose every time.

I got as far as a live **MainUnit v1.81** on my bench: stock head unplugged, FT232 on the DE-9, [`g90-effect-diff`](https://github.com/cjlawson02/xiegu-g90-research/blob/main/src/g90_control/cli/effect_diff.py) passing when I changed mode and frequency on purpose. Someone else repeating that on their hardware is the next step that actually matters. The body already ships spectrum bins in those 372-byte replies; [`g90-live-fft`](https://github.com/cjlawson02/xiegu-g90-research/blob/main/src/g90_control/cli/live_fft.py) just draws them (relative bins, not dBm). All of that is in [xiegu-g90-research](https://github.com/cjlawson02/xiegu-g90-research) with tests and an [evidence matrix](https://github.com/cjlawson02/xiegu-g90-research/blob/main/docs/verification.md) so you can see what CI vs bench actually proves.

I am not claiming stock-head Y-tap sniff, calibrated dBm, filter echo in every body byte, independent replication on other firmware builds, or a fixed GSOC. What is in the repo today is bench fake-head control on current firmware from one lab session. Putting the same dialect back on GSOC hardware comes later.

## Where I want this to go

In the short term I want to keep the wire boring and write docs that match what the bench actually shows. The v1 control behavior is frozen in the [control spec](https://github.com/cjlawson02/xiegu-g90-research/blob/main/docs/protocol/control-spec.md). What’s left on the bench are gaps I have not closed yet: some status/header bytes still need more time, and absolute spectrum units are uncalibrated, without pretending those block tuning and control.

In the medium term I would like a laptop (or any random board you like) to work as a credible GSOC-shaped frontend. It would have meters, tuning, remote scope, the daily-driver stuff, without begging for vendor support. All open-source, of course, and BYO device first; that path is closer. For now that means the bench Python in [the repo](https://github.com/cjlawson02/xiegu-g90-research), not a polished installable.

Longer term I would like to put that capability back onto GSOC hardware, with open-sourced UI/controls, extendibility, and scripting out of the box. And while we're at it, I would also like a modern OS on the little A20 board; [d3cker](https://github.com/d3cker/gsoc-puhumod) and others already proved that's possible.

That's a lot to sketch out, so I won't call it a promise. I got into this because I didn't want a museum piece on the desk. The G90 was never the bottleneck; the frozen conversation was. Static RE named the dialect, tests and a live body proved the tools worked, and "put it back on the GSOC" is starting to look like software instead of archaeology.

_73 de KM6FTS_

**Thanks:**

- [zeroping](https://github.com/zeroping/xiegu-g90-headprotocol) for the headprotocol notes that made the DE-9 stop looking like noise
- [Mike Dubinko](https://github.com/mdubinko/gsoc-contrib) / gsoc-contrib for the teardown and SD-card archaeology
- [YO3HJV](https://yo3hjv.blogspot.com/2021/05/xiegu-g90-comm-lost-error.html) for documenting the version lock years before anyone had a clean byte map
- [OpenHamradioFirmware / G90Tools](https://github.com/OpenHamradioFirmware/G90Tools) for the firmware tools
- [d3cker](https://github.com/d3cker/gsoc-puhumod) for proving you can put a real OS on a GSOC
- the [XieguG90 TechnicalAnalysis](https://xiegug90.groups.io/g/TechnicalAnalysis) crowd for arguing about scope streams while the rest of us were still stuck on CI-V
- and [Radioddity](https://www.radioddity.com/blogs/all/xiegu-gsoc-teardown-open-source-project) for backing up the teardown instead of pretending the hardware was a black box
