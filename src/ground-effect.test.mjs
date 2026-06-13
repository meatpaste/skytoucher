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
