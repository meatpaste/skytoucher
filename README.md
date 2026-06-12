# FPV Simulator

Browser-based Three.js FPV simulator with local-network multiplayer.

The flight model is currently set up as a BetaFPV Air65 Freestyle with a LAVA 1S 300mAh 75C battery. The physics uses the published 17.3g dry weight, 65mm wheelbase, 0702SE II 23000KV motors, HQ 31mm props, and the 8.3g/300mAh LiHV pack as the baseline. Motor thrust and current are interpolated from the BETAFPV 0702SE II 23000KV 31mm prop 4V load table, including the 32g / 4.19A full-throttle endpoint.

Run from the repository root:

```sh
node fpv/server.mjs
```

Open the local URL:

```text
http://127.0.0.1:8765/fpv/
```

Send friends on the same Wi-Fi/LAN one of the `LAN:` URLs printed by the server, for example:

```text
http://192.168.1.50:8765/fpv/
```

The same share URL is shown in the simulator HUD and can be copied from there.

Every browser simulates its own drone locally and streams render-state snapshots to the others. Remote pilots appear as small colored quad models in the same course. If you serve the folder with a plain static server, the simulator still works in solo mode but multiplayer is disabled.

The multiplayer relay owns the active map. When one pilot switches between `PARK` and `FIELD`, every connected browser receives the same map event, and new joiners load the current room map.

Performance defaults favor FPS: render scale is capped and shadows are off. Optional browser-console overrides:

```js
localStorage.setItem("fpv-max-dpr", "1");   // fastest
localStorage.setItem("fpv-max-dpr", "2");   // sharper
localStorage.setItem("fpv-shadows", "1");   // slower, nicer shadows
location.reload();
```

Controls:

- `W` / `S`: throttle up / down
- `A` / `D`: yaw left / right
- Mouse drag or pointer-lock mouse: pitch and roll
- Arrow keys: pitch and roll
- `Space`: arm / disarm
- `R`: reset
- `M`: acro / level mode. Acro is the default and does not self-level.
- `B`: brake
- `PARK` / `FIELD` button: switch between the airfield and fairground maps

Physics audit:

- Click `PHYS` in the bottom OSD bar.
- The panel shows Air65 mass/geometry, hover throttle, thrust-to-weight, interpolated motor output/current, pack sag, estimated time remaining, acceleration, and angular rates.
- Console diagnostics are available:

```js
window.fpvSim.getPhysicsAudit();
window.fpvSim.getMotorSweep(4.0);
```

Rates panel:

- Click `RATES` in the bottom OSD bar.
- Choose Profile 1, 2, or 3 and set the rate type to `Actual` or `Betaflight`.
- `Actual` uses Betaflight-style `Center Sensitivity`, `Max Rate`, and `Expo` values in deg/s.
- `Betaflight` uses `RC Rate`, `Super Rate`, and `RC Expo`.
- The table is split into Roll, Pitch, and Yaw columns with a live curve preview and max velocity readout.
- Profiles are saved in `localStorage` as `fpv-rate-profile` and `fpv-rate-profiles`.
- Console diagnostics are available:

```js
window.fpvSim.getActiveRateProfile();
window.fpvSim.getRateProfiles();
window.fpvSim.getRateSetpoint("roll", 1);
```

Input panel:

- Click `INPUT` in the bottom OSD bar.
- Choose `KEYBOARD + MOUSE` or a connected controller from the dropdown.
- Keyboard/mouse mode shows mouse X/Y mapping, mouse sensitivity/decay sliders, and every configured key with a live value.
- Click a key name, then press another key to move that binding.
- Controller mode shows every axis and button with a live value bar.
- Use row dropdowns to map inputs to flight actions. Controller rows use `ROLL`, `PITCH`, `YAW`, `THROTTLE`, `ARM`, `BRAKE`, `LEVEL`, or `RESET`; keyboard rows use signed actions like `ROLL -`, `ROLL +`, `THR -`, and `THR +`.
- Use `INV` on axis rows if a stick, switch, or mouse axis moves backward.
- Config is saved in `localStorage` as `fpv-input-device`, `fpv-gamepad-mapping`, and `fpv-keyboard-mouse-mapping`.

RadioMaster Pocket / ExpressLRS Joystick:

- Pair the controller so the browser/OS sees `ExpressLRS Joystick`.
- Choose the `ExpressLRS Joystick` device.
- Default axis mapping is CH1 roll, CH2 pitch, CH3 throttle, CH4 yaw.
- Console diagnostics are still available:

```js
window.fpvSim.getGamepads();
window.fpvSim.getGamepadMapping();
window.fpvSim.setGamepadInputBinding("axis", 2, "throttle", false);
window.fpvSim.setGamepadInputBinding("button", 0, "arm", false);
window.fpvSim.getKeyboardMouseMapping();
```

Controller bridge:

```js
window.fpvSim.setRadioFrame({
  roll: 0,      // -1..1 or PWM 1000..2000
  pitch: 0,     // -1..1 or PWM 1000..2000
  yaw: 0,       // -1..1 or PWM 1000..2000
  throttle: 0.4 // 0..1, -1..1, or PWM 1000..2000
});
```

This is intentionally small and self-contained for now. Direct Web Bluetooth/WebHID parsing can still be added later if we need switch channels or raw CRSF data beyond what the browser exposes through the Gamepad API.
