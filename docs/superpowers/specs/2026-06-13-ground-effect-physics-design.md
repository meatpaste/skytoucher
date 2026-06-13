# Ground Effect Physics — Design Spec

**Date:** 2026-06-13  
**Status:** Approved

## Problem

A ground effect model already exists (`getGroundEffectMultiplier()`, `src/app.js:1650`) but uses an arbitrary quadratic curve with a hard height cutoff. The formula shape does not match known multirotor ground effect data — in particular, it uses a linear `t` parameter and a hard ceiling, rather than the smooth exponential decay observed in real quadrotor measurements.

## Physics Background

Ground effect (IGE — In Ground Effect) occurs when rotor downwash impinges on the ground, increasing local air pressure beneath the disc and reducing the induced velocity required to generate thrust. For multirotors, rotor-rotor wake interference modifies the single-rotor helicopter model.

**Chosen model: Shi et al. (2019) "Neural Lander" empirical exponential fit**

Derived from actual quadrotor flight data. Formula:

```
T_IGE = T_nominal × (1 + k₀ · exp(−k₁ · h/R))
```

- `h` — height above ground (m)
- `R` — rotor radius = `propDiameterM / 2`
- `k₀ = 0.2` — peak fractional thrust boost at h=0 (20%). Conservative end of the 0.2–0.4 range from the paper; appropriate for tinywhoop-class drones where rotor-rotor spacing dampens the effect.
- `k₁ = 0.8` — exponential decay rate from the paper's multirotor fit.

**Why not Cheeseman-Bennett (1955)?** That model is derived for single-rotor helicopters and diverges as h → 0, requiring an arbitrary floor clamp. The Shi et al. fit is purpose-built for quadrotors and is non-singular.

## Effect Characteristics (BetaFPV Air65, R = 15.5mm)

| h (AGL) | h/R  | Boost |
|---------|------|-------|
| 0 mm    | 0    | +20%  |
| 15 mm   | 1.0R | +9%   |
| 31 mm   | 2.0R | +4%   |
| 62 mm   | 4.0R | +1%   |
| 93 mm   | 6.0R | +0.3% |

Effect is above 1% below ~62mm AGL — consistent with the current model's 65mm ceiling, but with a physically correct curve shape.

## Implementation

### Change

**File:** `src/app.js`  
**Function:** `getGroundEffectMultiplier()` (line 1650)

**Before:**
```javascript
function getGroundEffectMultiplier() {
  const height = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const effectHeight = AIRCRAFT.propDiameterM * 2.1;
  if (height >= effectHeight) return 1;
  const t = 1 - height / effectHeight;
  return 1 + 0.16 * t * t;
}
```

**After:**
```javascript
function getGroundEffectMultiplier() {
  const height = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const R = AIRCRAFT.propDiameterM / 2;
  return 1 + 0.2 * Math.exp(-0.8 * height / R);
}
```

### Scope

- No call-site changes — `calculateMotorTorques` already consumes the multiplier as a scalar.
- No new aircraft config fields.
- No new state.
- Removes the hard height cutoff; the exponential decays naturally to 1.0.

## Testing

Run the existing physics test suite. Key observable: at ground level (h=0), multiplier = 1.2. At h = 4R (~62mm), multiplier ≈ 1.01. The physics audit panel in-game shows live thrustN — hover near the ground and confirm thrust reads higher than OGE hover thrust.
