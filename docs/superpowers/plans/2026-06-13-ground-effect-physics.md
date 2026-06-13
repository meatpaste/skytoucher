# Ground Effect Physics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the quadratic ground effect curve in `getGroundEffectMultiplier()` with the Shi et al. (2019) exponential model derived from real quadrotor flight data.

**Architecture:** Single function replacement in `src/app.js`. The formula `1 + k₀·exp(−k₁·h/R)` replaces `1 + 0.16·t²`. All call sites are unchanged — the function still returns a scalar multiplier. A standalone Node.js test validates the formula output before touching the source file.

**Tech Stack:** Vanilla JS (ES modules), Node.js ≥20 (for test script), Three.js (no changes needed)

---

### Task 1: Write the failing formula test

**Files:**
- Create: `src/ground-effect.test.mjs`

The project has no test runner. We use a plain Node.js assertion script. It tests the formula in isolation — no browser, no module imports, just math.

- [ ] **Step 1: Create the test file**

```javascript
// src/ground-effect.test.mjs
import { strict as assert } from "node:assert";

// The formula under test (copy from design spec, NOT yet in app.js)
function groundEffectMultiplier(height, propDiameterM) {
  const R = propDiameterM / 2;
  return 1 + 0.2 * Math.exp(-0.8 * height / R);
}

const R = 0.031 / 2; // Air65 prop radius = 0.0155m

// At ground level (h=0): boost should be exactly 20%
assert.equal(groundEffectMultiplier(0, 0.031), 1.2, "h=0 should give 1.2");

// At h = R: boost should be 1 + 0.2*exp(-0.8) ≈ 1.0899
{
  const expected = 1 + 0.2 * Math.exp(-0.8);
  const actual = groundEffectMultiplier(R, 0.031);
  assert.ok(Math.abs(actual - expected) < 1e-10, `h=R expected ${expected}, got ${actual}`);
}

// At h = 4R (~62mm): boost should be under 2% (effect nearly gone)
{
  const actual = groundEffectMultiplier(4 * R, 0.031);
  assert.ok(actual < 1.02, `h=4R boost should be <2%, got ${((actual - 1) * 100).toFixed(2)}%`);
}

// At h = 10R: boost should be negligible (under 0.1%)
{
  const actual = groundEffectMultiplier(10 * R, 0.031);
  assert.ok(actual < 1.001, `h=10R boost should be <0.1%, got ${((actual - 1) * 100).toFixed(3)}%`);
}

// Monotonically decreasing: higher altitude = less boost
{
  const heights = [0, R * 0.5, R, R * 2, R * 4, R * 8];
  for (let i = 1; i < heights.length; i++) {
    const prev = groundEffectMultiplier(heights[i - 1], 0.031);
    const curr = groundEffectMultiplier(heights[i], 0.031);
    assert.ok(curr < prev, `Multiplier should decrease with height at h=${heights[i].toFixed(4)}m`);
  }
}

// Always ≥ 1 (never reduces thrust)
for (let h = 0; h <= 1.0; h += 0.01) {
  const val = groundEffectMultiplier(h, 0.031);
  assert.ok(val >= 1, `Multiplier should never drop below 1 at h=${h}m, got ${val}`);
}

console.log("All ground effect formula tests passed.");
```

- [ ] **Step 2: Run the test — expect it to pass (it's testing the formula in isolation)**

```bash
node src/ground-effect.test.mjs
```

Expected output:
```
All ground effect formula tests passed.
```

If it fails, the formula has a bug — fix it in the test file before proceeding.

- [ ] **Step 3: Commit the test**

```bash
git add src/ground-effect.test.mjs
git commit -m "test: add ground effect formula validation tests"
```

---

### Task 2: Apply the formula change to app.js

**Files:**
- Modify: `src/app.js:1650-1656`

- [ ] **Step 1: Open `src/app.js` and locate `getGroundEffectMultiplier` at line 1650**

Current code (lines 1650–1656):
```javascript
function getGroundEffectMultiplier() {
  const height = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const effectHeight = AIRCRAFT.propDiameterM * 2.1;
  if (height >= effectHeight) return 1;
  const t = 1 - height / effectHeight;
  return 1 + 0.16 * t * t;
}
```

- [ ] **Step 2: Replace the function body with the exponential formula**

New code:
```javascript
function getGroundEffectMultiplier() {
  const height = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const R = AIRCRAFT.propDiameterM / 2;
  return 1 + 0.2 * Math.exp(-0.8 * height / R);
}
```

The `effectHeight` variable and `if` guard are deleted — the exponential decays naturally.

- [ ] **Step 3: Run the syntax check**

```bash
npm run check
```

Expected output (no errors):
```
(no output)
```

Exit code must be 0. If non-zero, there's a syntax error — fix it before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/app.js
git commit -m "feat: replace quadratic ground effect with Shi et al. exponential model

Uses T_IGE = T_nominal * (1 + 0.2 * exp(-0.8 * h/R)) from Neural Lander
(Shi et al. 2019). Removes hard height cutoff; exponential decays naturally."
```

---

### Task 3: Verify in the browser

**Files:** none (observation only)

The server should already be running on port 8765. If not: `npm start` (run outside sandbox — the server needs network access).

- [ ] **Step 1: Open the simulator and navigate to ground level**

In the Chrome DevTools MCP, navigate to `http://127.0.0.1:8765/fpv/` and take a screenshot to confirm the page loaded.

- [ ] **Step 2: Verify ground effect multiplier at ground level via console**

In the browser console, run:
```javascript
window.sim.getFlightState()
```

With the drone sitting on the ground (altitude ≈ 0m), check that `thrustN` at a given throttle is higher than it would be OGE. Note the value.

- [ ] **Step 3: Check the multiplier curve via the physics audit**

Open the physics panel (click PHYS button in the sim HUD). Run a HOVER test. The drone should lift, and as it climbs through the first ~62mm the effective thrust decreases as ground effect fades. The test result VSPD should show the drone settling at hover throttle without oscillating.

- [ ] **Step 4: Confirm no regressions**

Run the PUNCH test (full throttle climb). Confirm the result is consistent with pre-change behaviour above 62mm (ground effect is negligible at altitude, so punch performance should be unchanged).
