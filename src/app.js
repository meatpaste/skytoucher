import * as THREE from "three";

const canvas = document.querySelector("#viewport");
const readouts = {
  altitude: document.querySelector("#altitude"),
  speed: document.querySelector("#speed"),
  throttle: document.querySelector("#throttle"),
  battery: document.querySelector("#battery"),
  attitude: document.querySelector("#attitude"),
  model: document.querySelector("#model"),
  source: document.querySelector("#source"),
  network: document.querySelector("#network"),
  status: document.querySelector("#status")
};
const armButton = document.querySelector("#armButton");
const resetButton = document.querySelector("#resetButton");
const levelButton = document.querySelector("#levelButton");
const mapButton = document.querySelector("#mapButton");
const ratesButton = document.querySelector("#ratesButton");
const physicsButton = document.querySelector("#physicsButton");
const inputButton = document.querySelector("#inputButton");
const shareUrlInput = document.querySelector("#shareUrl");
const shareCopyButton = document.querySelector("#shareCopyButton");
const inputPanel = document.querySelector("#inputPanel");
const inputDeviceSelect = document.querySelector("#inputDeviceSelect");
const inputRows = document.querySelector("#inputRows");
const inputDefaultButton = document.querySelector("#inputDefaultButton");
const inputCloseButton = document.querySelector("#inputCloseButton");
const ratePanel = document.querySelector("#ratePanel");
const rateProfileSelect = document.querySelector("#rateProfileSelect");
const rateTypeSelect = document.querySelector("#rateTypeSelect");
const rateRows = document.querySelector("#rateRows");
const rateCurve = document.querySelector("#rateCurve");
const rateSummary = document.querySelector("#rateSummary");
const rateProfileName = document.querySelector("#rateProfileName");
const rateDefaultButton = document.querySelector("#rateDefaultButton");
const rateCloseButton = document.querySelector("#rateCloseButton");
const physicsPanel = document.querySelector("#physicsPanel");
const physicsRows = document.querySelector("#physicsRows");
const physicsCloseButton = document.querySelector("#physicsCloseButton");

const DEG = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const FORWARD = new THREE.Vector3(0, 0, -1);
const RIGHT = new THREE.Vector3(1, 0, 0);
const tmpVec = new THREE.Vector3();
const tmpVec2 = new THREE.Vector3();
const tmpVec3 = new THREE.Vector3();
const tmpVec4 = new THREE.Vector3();
const tmpVec5 = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler(0, 0, 0, "YXZ");
const GRAVITY = 9.80665;
const GROUND_HEIGHT = 0.72;
const RENDER_CONFIG = {
  maxPixelRatio: readNumberSetting("fpv-max-dpr", 1.25, 0.75, 2),
  shadows: localStorage.getItem("fpv-shadows") === "1"
};
const MULTIPLAYER_SEND_INTERVAL_MS = 83;
const MAPS = {
  airfield: { label: "FIELD", next: "fairground" },
  fairground: { label: "PARK", next: "airfield" }
};
const RATE_PROFILE_STORAGE_KEY = "fpv-rate-profile";
const RATE_PROFILES_STORAGE_KEY = "fpv-rate-profiles";
const RATE_PROFILE_COUNT = 3;
const RATE_AXES = Object.freeze([
  ["roll", "ROLL"],
  ["pitch", "PITCH"],
  ["yaw", "YAW"]
]);
const RATE_TYPES = Object.freeze([
  ["actual", "Actual"],
  ["betaflight", "Betaflight"]
]);
const RATE_TYPE_VALUES = new Set(RATE_TYPES.map(([value]) => value));
const ACTUAL_RATE_FIELDS = Object.freeze([
  ["center", "Center Sensitivity", 10, 500, 1, 0],
  ["max", "Max Rate", 100, 1998, 1, 0],
  ["expo", "Expo", 0, 1, 0.01, 2]
]);
const BETAFLIGHT_RATE_FIELDS = Object.freeze([
  ["rcRate", "RC Rate", 0.01, 3, 0.01, 2],
  ["superRate", "Super Rate", 0, 0.99, 0.01, 2],
  ["expo", "RC Expo", 0, 1, 0.01, 2]
]);
const RATE_LIMIT_DEG = 1998;
const KEYBOARD_MOUSE_DEVICE_ID = "keyboard-mouse";
const INPUT_DEVICE_STORAGE_KEY = "fpv-input-device";
const GAMEPAD_STORAGE_KEY = "fpv-gamepad-mapping";
const KEYBOARD_MOUSE_STORAGE_KEY = "fpv-keyboard-mouse-mapping";
const GAMEPAD_DEADZONE = readNumberSetting("fpv-gamepad-deadzone", 0.035, 0, 0.18);
const INPUT_ACTIONS = Object.freeze([
  ["none", "NONE"],
  ["roll", "ROLL"],
  ["pitch", "PITCH"],
  ["yaw", "YAW"],
  ["throttle", "THROTTLE"],
  ["arm", "ARM"],
  ["brake", "BRAKE"],
  ["level", "LEVEL"],
  ["reset", "RESET"]
]);
const INPUT_ACTION_VALUES = new Set(INPUT_ACTIONS.map(([value]) => value));
const UNIQUE_INPUT_ACTIONS = new Set(INPUT_ACTIONS.map(([value]) => value).filter((value) => value !== "none"));
const KEYBOARD_ACTIONS = Object.freeze([
  ["none", "NONE"],
  ["roll:-1", "ROLL -"],
  ["roll:1", "ROLL +"],
  ["pitch:-1", "PITCH -"],
  ["pitch:1", "PITCH +"],
  ["yaw:-1", "YAW -"],
  ["yaw:1", "YAW +"],
  ["throttle:-1", "THR -"],
  ["throttle:1", "THR +"],
  ["arm", "ARM"],
  ["brake", "BRAKE"],
  ["level", "LEVEL"],
  ["reset", "RESET"]
]);
const KEYBOARD_AXIS_ACTIONS = new Set(["roll", "pitch", "yaw", "throttle"]);
const KEYBOARD_SWITCH_ACTIONS = new Set(["arm", "brake", "level", "reset"]);
const MOUSE_AXIS_BINDINGS = Object.freeze([
  ["none", "NONE"],
  ["roll", "ROLL"],
  ["pitch", "PITCH"],
  ["yaw", "YAW"],
  ["throttle", "THROTTLE"]
]);
const MOUSE_AXIS_VALUES = new Set(MOUSE_AXIS_BINDINGS.map(([value]) => value));
const DEFAULT_GAMEPAD_MAPPING = Object.freeze({
  axes: Object.freeze({
    0: Object.freeze({ action: "roll", invert: false }),
    1: Object.freeze({ action: "pitch", invert: true }),
    2: Object.freeze({ action: "throttle", invert: false }),
    3: Object.freeze({ action: "yaw", invert: false })
  }),
  buttons: Object.freeze({})
});
const DEFAULT_KEYBOARD_MOUSE_MAPPING = Object.freeze({
  mouse: Object.freeze({
    x: Object.freeze({ action: "roll", invert: false }),
    y: Object.freeze({ action: "pitch", invert: true })
  }),
  keys: Object.freeze({
    ArrowLeft: Object.freeze({ action: "roll", direction: -1 }),
    ArrowRight: Object.freeze({ action: "roll", direction: 1 }),
    ArrowDown: Object.freeze({ action: "pitch", direction: -1 }),
    ArrowUp: Object.freeze({ action: "pitch", direction: 1 }),
    KeyA: Object.freeze({ action: "yaw", direction: -1 }),
    KeyD: Object.freeze({ action: "yaw", direction: 1 }),
    KeyS: Object.freeze({ action: "throttle", direction: -1 }),
    KeyW: Object.freeze({ action: "throttle", direction: 1 }),
    ShiftLeft: Object.freeze({ action: "throttle", direction: 1 }),
    ShiftRight: Object.freeze({ action: "throttle", direction: 1 }),
    ControlLeft: Object.freeze({ action: "throttle", direction: -1 }),
    ControlRight: Object.freeze({ action: "throttle", direction: -1 }),
    Space: Object.freeze({ action: "arm", direction: 1 }),
    KeyB: Object.freeze({ action: "brake", direction: 1 }),
    KeyM: Object.freeze({ action: "level", direction: 1 }),
    KeyR: Object.freeze({ action: "reset", direction: 1 })
  }),
  settings: Object.freeze({
    pointerSensitivity: 0.0036,
    dragSensitivity: 0.006,
    pointerDecay: 1.9,
    dragDecay: 3.8
  })
});
const MOUSE_SETTING_DEFS = Object.freeze([
  ["pointerSensitivity", "LOCK SENS", 0.001, 0.012, 0.0002, 4],
  ["dragSensitivity", "DRAG SENS", 0.001, 0.018, 0.0002, 4],
  ["pointerDecay", "LOCK DECAY", 0.4, 7.5, 0.1, 1],
  ["dragDecay", "DRAG DECAY", 0.4, 9.5, 0.1, 1]
]);
const AIRCRAFT = createAir65FreestyleConfig();
const DEFAULT_RATE_PROFILES = Object.freeze(createDefaultRateProfiles(AIRCRAFT));
let rateProfiles = readRateProfiles();
let activeRateProfileIndex = readRateProfileIndex();
let inputPanelOpen = false;
let inputPanelSignature = "";
let ratePanelOpen = false;
let ratePanelSignature = "";
let physicsPanelOpen = false;
let physicsPanelLastUpdate = 0;
let keyCapture = null;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(getRenderPixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = RENDER_CONFIG.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc8dd);
scene.fog = new THREE.Fog(0x9fcdda, 130, 560);

const camera = new THREE.PerspectiveCamera(92, window.innerWidth / window.innerHeight, 0.04, 900);
scene.add(camera);

const sun = new THREE.DirectionalLight(0xfff1d0, 3.4);
sun.position.set(90, 130, 55);
sun.castShadow = RENDER_CONFIG.shadows;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -180;
sun.shadow.camera.right = 180;
sun.shadow.camera.top = 180;
sun.shadow.camera.bottom = -180;
sun.shadow.camera.near = 15;
sun.shadow.camera.far = 320;
scene.add(sun);
scene.add(new THREE.HemisphereLight(0xbce9ff, 0x304633, 2.6));

const flight = createFlightState();
let world;
let controls;
let multiplayer;

let levelMode = false;
let currentMapId = localStorage.getItem("fpv-map") === "fairground" ? "fairground" : "airfield";
let previousTime = performance.now();
let accumulator = 0;
const fixedDt = 1 / 120;

armButton.addEventListener("click", () => {
  flight.armed = !flight.armed;
  if (flight.armed && canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
  updateButtons();
});

resetButton.addEventListener("click", () => {
  resetFlight();
  canvas.focus();
});

levelButton.addEventListener("click", () => {
  levelMode = !levelMode;
  updateButtons();
  canvas.focus();
});

mapButton.addEventListener("click", () => {
  setMap(MAPS[currentMapId].next);
  canvas.focus();
});

ratesButton.addEventListener("click", () => {
  setRatePanelOpen(!ratePanelOpen);
});

physicsButton.addEventListener("click", () => {
  setPhysicsPanelOpen(!physicsPanelOpen);
});

physicsCloseButton.addEventListener("click", () => {
  setPhysicsPanelOpen(false);
  canvas.focus();
});

rateCloseButton.addEventListener("click", () => {
  setRatePanelOpen(false);
  canvas.focus();
});

rateDefaultButton.addEventListener("click", () => {
  resetActiveRateProfile();
  updateRatePanel(true);
});

rateProfileSelect.addEventListener("change", () => {
  setActiveRateProfile(Number(rateProfileSelect.value));
  updateRatePanel(true);
});

rateTypeSelect.addEventListener("change", () => {
  setRateProfileType(rateTypeSelect.value);
  updateRatePanel(true);
});

rateRows.addEventListener("input", (event) => {
  const input = event.target.closest(".rate-input");
  if (!input) return;
  setRateValue(input.dataset.axis, input.dataset.field, input.value);
  ratePanelSignature = getRatePanelSignature();
  updateRateValueLabel(input);
  updateRateMaxVelocityRow();
  updateRatePreview();
});

rateRows.addEventListener("change", (event) => {
  const input = event.target.closest(".rate-input");
  if (!input) return;
  setRateValue(input.dataset.axis, input.dataset.field, input.value);
  ratePanelSignature = "";
  updateRatePanel(true);
});

inputButton.addEventListener("click", () => {
  setInputPanelOpen(!inputPanelOpen);
});

inputCloseButton.addEventListener("click", () => {
  setInputPanelOpen(false);
  canvas.focus();
});

inputDefaultButton.addEventListener("click", () => {
  if (controls.getActiveInputDevice().kind === "keyboard") {
    controls.resetKeyboardMouseMapping();
  } else {
    controls.resetGamepadMapping();
  }
  inputPanelSignature = "";
  updateInputPanel(true);
});

inputDeviceSelect.addEventListener("change", () => {
  controls.setInputDevice(inputDeviceSelect.value);
  inputPanelSignature = "";
  updateInputPanel(true);
});

inputRows.addEventListener("change", (event) => {
  const row = event.target.closest(".input-row");
  if (!row) return;
  const type = row.dataset.type;
  const actionSelect = row.querySelector(".input-action");
  const invertInput = row.querySelector(".input-invert input");
  if (type === "key") {
    controls.setKeyboardKeyBinding(row.dataset.code, actionSelect.value);
  } else if (type === "mouse-axis") {
    controls.setMouseAxisBinding(row.dataset.axis, actionSelect.value, Boolean(invertInput?.checked));
  } else if (type === "axis" || type === "button") {
    controls.setGamepadInputBinding(type, Number(row.dataset.index), actionSelect.value, Boolean(invertInput?.checked));
  }
  inputPanelSignature = "";
  updateInputPanel(true);
});

inputRows.addEventListener("input", (event) => {
  const row = event.target.closest(".input-row");
  if (!row || row.dataset.type !== "mouse-setting") return;
  controls.setKeyboardMouseSetting(row.dataset.setting, event.target.value);
  updateMouseSettingRowValue(row);
});

inputRows.addEventListener("click", (event) => {
  const button = event.target.closest(".key-capture");
  if (!button) return;
  startKeyCapture(button.dataset.code, button);
});

shareCopyButton.addEventListener("click", () => {
  multiplayer.copyShareUrl();
});

canvas.addEventListener("click", () => {
  if (canvas.requestPointerLock) {
    canvas.requestPointerLock();
  }
});

window.addEventListener("resize", resize);
window.addEventListener("keydown", handleKeyCapture, { capture: true });

window.fpvSim = {
  arm(value = true) {
    flight.armed = Boolean(value);
    updateButtons();
  },
  reset: resetFlight,
  setRadioFrame(frame) {
    controls.setRadioFrame(frame);
  },
  setMap(mapId) {
    setMap(mapId);
  },
  setGamepadMapping(mapping) {
    return controls.setGamepadMapping(mapping);
  },
  setGamepadInputBinding(type, index, action, invert = false) {
    return controls.setGamepadInputBinding(type, index, action, invert);
  },
  resetGamepadMapping() {
    return controls.resetGamepadMapping();
  },
  getGamepadMapping() {
    return controls.getGamepadMapping();
  },
  setInputDevice(deviceId) {
    return controls.setInputDevice(deviceId);
  },
  getInputDevices() {
    return controls.getInputDevices();
  },
  setKeyboardMouseMapping(mapping) {
    return controls.setKeyboardMouseMapping(mapping);
  },
  setKeyboardKeyBinding(code, action) {
    return controls.setKeyboardKeyBinding(code, action);
  },
  setMouseAxisBinding(axis, action, invert = false) {
    return controls.setMouseAxisBinding(axis, action, invert);
  },
  resetKeyboardMouseMapping() {
    return controls.resetKeyboardMouseMapping();
  },
  getKeyboardMouseMapping() {
    return controls.getKeyboardMouseMapping();
  },
  getRateProfiles() {
    return cloneRateProfiles(rateProfiles);
  },
  getActiveRateProfile() {
    return cloneRateProfile(getCurrentRateProfile());
  },
  setActiveRateProfile(index) {
    return setActiveRateProfile(index);
  },
  setRateProfile(profile) {
    return setRateProfile(activeRateProfileIndex, profile);
  },
  resetRateProfile() {
    return resetActiveRateProfile();
  },
  getRateSetpoint(axis, stick) {
    return getRateDegreesPerSecond(axis, stick);
  },
  getPhysicsAudit() {
    return getPhysicsAudit();
  },
  getMotorSweep(voltage = AIRCRAFT.battery.nominalVoltage) {
    return getMotorSweep(voltage);
  },
  getGamepads() {
    return controls.getGamepads();
  },
  getState() {
    return {
      armed: flight.armed,
      levelMode,
      map: currentMapId,
      position: flight.position.toArray(),
      velocity: flight.velocity.toArray(),
      throttle: flight.throttle,
      roll: flight.roll,
      pitch: flight.pitch,
      yaw: flight.yaw,
      angularVelocity: flight.angularVelocity.toArray(),
      thrustN: flight.thrustN,
      batteryVoltage: flight.batteryVoltage,
      batteryOpenCircuitVoltage: flight.batteryOpenCircuitVoltage,
      batterySag: flight.batterySag,
      batterySoc: flight.batterySoc,
      currentA: flight.currentA,
      motorDrives: [...flight.motorDrives],
      motorCurrents: [...flight.motorCurrents],
      motorThrusts: [...flight.motorThrusts],
      model: AIRCRAFT.name,
      battery: AIRCRAFT.battery.name,
      rateProfile: activeRateProfileIndex + 1,
      rates: cloneRateProfile(getCurrentRateProfile()),
      inputSource: controls.lastSource,
      network: multiplayer.getState()
    };
  },
  getPeers() {
    return multiplayer.getPeers();
  },
  getShareUrl() {
    return multiplayer.shareUrl;
  }
};

function loop(now) {
  const frameDt = Math.min((now - previousTime) / 1000, 0.08);
  previousTime = now;
  accumulator += frameDt;

  while (accumulator >= fixedDt) {
    updateFlight(fixedDt);
    accumulator -= fixedDt;
  }

  updateCamera();
  animateWorld(now);
  multiplayer.update(flight, now, frameDt);
  updateHud();
  updateInputPanel(false);
  updateRatePanel(false);
  updatePhysicsPanel(now);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

function resize() {
  renderer.setPixelRatio(getRenderPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function getRenderPixelRatio() {
  return Math.min(window.devicePixelRatio || 1, RENDER_CONFIG.maxPixelRatio);
}

function readNumberSetting(key, fallback, min, max) {
  const value = Number.parseFloat(localStorage.getItem(key) || "");
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function createAir65FreestyleConfig() {
  const dryMassKg = 0.0173;
  const batteryMassKg = 0.0083;
  const massKg = dryMassKg + batteryMassKg;
  const wheelbaseM = 0.065;
  const armOffsetM = wheelbaseM / (2 * Math.SQRT2);
  const motorCurve = create0702SeIi23000KvMotorCurve();
  const maxStaticThrustPerMotorN = motorCurve.maxThrustN;
  const battery = {
    name: "LAVA 1S 300mAh 75C",
    massKg: batteryMassKg,
    capacityAh: 0.3,
    fullVoltage: 4.35,
    nominalVoltage: 3.8,
    emptyVoltage: 3.3,
    cutoffVoltage: 3.15,
    baseResistanceOhm: 0.044,
    electronicsCurrentA: 0.24,
    standbyCurrentA: 0.08
  };
  const hoverThrottle = getMotorDriveForThrustAtVoltage(
    (massKg * GRAVITY) / 4,
    battery.nominalVoltage,
    motorCurve
  );

  return {
    name: "BetaFPV Air65 Freestyle",
    hudName: "AIR65 FS",
    dryMassKg,
    massKg,
    wheelbaseM,
    armOffsetM,
    propDiameterM: 0.031,
    motorKv: 23000,
    motorCurve,
    maxStaticThrustPerMotorN,
    hoverThrottle,
    defaultThrottle: Math.min(0.48, hoverThrottle + 0.018),
    motorIdle: 0.065,
    motorTimeConstant: 0.026,
    yawTorquePerNewton: 0.0034,
    maxRates: {
      pitch: 720 * DEG,
      roll: 720 * DEG,
      yaw: 560 * DEG
    },
    maxLevelAngle: 56 * DEG,
    levelRateGain: 11.5,
    rateTimeConstant: {
      x: 0.045,
      y: 0.082,
      z: 0.045
    },
    rateIntegralGain: {
      x: 3.2,
      y: 1.4,
      z: 3.2
    },
    rateIntegralLimit: {
      x: 2.4,
      y: 1.8,
      z: 2.4
    },
    torqueLimit: {
      x: 0.0072,
      y: 0.0028,
      z: 0.0072
    },
    inertia: {
      x: 6.3e-6,
      y: 1.18e-5,
      z: 6.3e-6
    },
    linearDrag: {
      x: 0.00125,
      y: 0.0034,
      z: 0.00105
    },
    angularDamping: {
      x: 2.1e-5,
      y: 1.4e-5,
      z: 2.1e-5
    },
    battery,
    motors: [
      { x: -armOffsetM, z: -armOffsetM, yawSign: 1 },
      { x: armOffsetM, z: -armOffsetM, yawSign: -1 },
      { x: -armOffsetM, z: armOffsetM, yawSign: -1 },
      { x: armOffsetM, z: armOffsetM, yawSign: 1 }
    ]
  };
}

function gramForceToNewtons(grams) {
  return grams * 0.001 * GRAVITY;
}

function newtonsToGramForce(newtons) {
  return newtons / GRAVITY * 1000;
}

function create0702SeIi23000KvMotorCurve() {
  const points = [
    [0, 0, 0],
    [0.1, 0.55, 0.15],
    [0.2, 2.7, 0.57],
    [0.3, 5.48, 1.01],
    [0.4, 8.93, 1.42],
    [0.5, 12.3, 1.83],
    [0.6, 16.08, 2.3],
    [0.7, 20.56, 2.67],
    [0.8, 24.5, 3.12],
    [0.9, 27.5, 3.49],
    [1, 32, 4.19]
  ].map(([drive, thrustG, currentA]) => ({
    drive,
    thrustN: gramForceToNewtons(thrustG),
    thrustG,
    currentA
  }));

  return {
    name: "BETAFPV 0702SE II 23000KV",
    source: "BETAFPV 0702SE II 23000KV 31mm prop 4V load table",
    referenceVoltage: 4,
    points,
    maxThrustN: points[points.length - 1].thrustN,
    maxCurrentA: points[points.length - 1].currentA
  };
}

function sampleMotorAtDrive(drive, voltage, curve = AIRCRAFT.motorCurve) {
  const base = interpolateMotorCurveByDrive(curve, drive);
  const voltageScale = getMotorVoltageScale(voltage, curve);
  const thrustN = base.thrustN * voltageScale ** 2;
  const currentA = base.currentA * voltageScale ** 2;
  return {
    drive: THREE.MathUtils.clamp(drive, 0, 1),
    thrustN,
    thrustG: newtonsToGramForce(thrustN),
    currentA
  };
}

function getMotorDriveForThrustAtVoltage(thrustN, voltage, curve = AIRCRAFT.motorCurve) {
  const voltageScale = getMotorVoltageScale(voltage, curve);
  const referenceThrustN = Math.max(0, thrustN) / Math.max(0.01, voltageScale ** 2);
  const points = curve.points;
  if (referenceThrustN <= points[0].thrustN) return points[0].drive;
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const next = points[i];
    if (referenceThrustN <= next.thrustN) {
      const t = (referenceThrustN - previous.thrustN) / Math.max(1e-6, next.thrustN - previous.thrustN);
      return THREE.MathUtils.lerp(previous.drive, next.drive, t);
    }
  }
  return points[points.length - 1].drive;
}

function interpolateMotorCurveByDrive(curve, drive) {
  const clampedDrive = THREE.MathUtils.clamp(Number(drive) || 0, 0, 1);
  const points = curve.points;
  if (clampedDrive <= points[0].drive) return points[0];
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const next = points[i];
    if (clampedDrive <= next.drive) {
      const t = (clampedDrive - previous.drive) / Math.max(1e-6, next.drive - previous.drive);
      return {
        drive: clampedDrive,
        thrustN: THREE.MathUtils.lerp(previous.thrustN, next.thrustN, t),
        thrustG: THREE.MathUtils.lerp(previous.thrustG, next.thrustG, t),
        currentA: THREE.MathUtils.lerp(previous.currentA, next.currentA, t)
      };
    }
  }
  return points[points.length - 1];
}

function getMotorVoltageScale(voltage, curve = AIRCRAFT.motorCurve) {
  return THREE.MathUtils.clamp(
    (Number(voltage) || curve.referenceVoltage) / curve.referenceVoltage,
    0.74,
    1.1
  );
}

function createDefaultRateProfiles(aircraft) {
  return [
    {
      name: "Profile 1",
      type: "actual",
      values: {
        roll: { center: 200, max: Math.round(aircraft.maxRates.roll / DEG), expo: 0.35 },
        pitch: { center: 200, max: Math.round(aircraft.maxRates.pitch / DEG), expo: 0.35 },
        yaw: { center: 170, max: Math.round(aircraft.maxRates.yaw / DEG), expo: 0.25 }
      }
    },
    {
      name: "Profile 2",
      type: "betaflight",
      values: {
        roll: { rcRate: 1.0, superRate: 0.7, expo: 0.0 },
        pitch: { rcRate: 1.0, superRate: 0.7, expo: 0.0 },
        yaw: { rcRate: 1.0, superRate: 0.65, expo: 0.0 }
      }
    },
    {
      name: "Profile 3",
      type: "actual",
      values: {
        roll: { center: 120, max: 450, expo: 0.45 },
        pitch: { center: 120, max: 450, expo: 0.45 },
        yaw: { center: 110, max: 360, expo: 0.35 }
      }
    }
  ];
}

function readRateProfileIndex() {
  const index = Number(localStorage.getItem(RATE_PROFILE_STORAGE_KEY));
  if (!Number.isInteger(index) || index < 0 || index >= RATE_PROFILE_COUNT) return 0;
  return index;
}

function readRateProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(RATE_PROFILES_STORAGE_KEY) || "null");
    return sanitizeRateProfiles(stored || DEFAULT_RATE_PROFILES);
  } catch {
    return sanitizeRateProfiles(DEFAULT_RATE_PROFILES);
  }
}

function saveRateProfiles() {
  localStorage.setItem(RATE_PROFILE_STORAGE_KEY, String(activeRateProfileIndex));
  localStorage.setItem(RATE_PROFILES_STORAGE_KEY, JSON.stringify(rateProfiles));
}

function getCurrentRateProfile() {
  return rateProfiles[activeRateProfileIndex] || rateProfiles[0] || cloneRateProfile(DEFAULT_RATE_PROFILES[0]);
}

function setActiveRateProfile(index) {
  const nextIndex = Number(index);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= rateProfiles.length) return false;
  activeRateProfileIndex = nextIndex;
  saveRateProfiles();
  ratePanelSignature = "";
  return cloneRateProfile(getCurrentRateProfile());
}

function setRateProfile(index, profile) {
  const cleanIndex = Number(index);
  if (!Number.isInteger(cleanIndex) || cleanIndex < 0 || cleanIndex >= RATE_PROFILE_COUNT) return false;
  rateProfiles[cleanIndex] = sanitizeRateProfile(profile, cleanIndex);
  saveRateProfiles();
  ratePanelSignature = "";
  return cloneRateProfile(rateProfiles[cleanIndex]);
}

function resetActiveRateProfile() {
  rateProfiles[activeRateProfileIndex] = cloneRateProfile(DEFAULT_RATE_PROFILES[activeRateProfileIndex]);
  saveRateProfiles();
  ratePanelSignature = "";
  return cloneRateProfile(getCurrentRateProfile());
}

function setRateProfileType(type) {
  const profile = cloneRateProfile(getCurrentRateProfile());
  profile.type = RATE_TYPE_VALUES.has(type) ? type : "actual";
  profile.values = createDefaultRateValues(profile.type, activeRateProfileIndex);
  rateProfiles[activeRateProfileIndex] = sanitizeRateProfile(profile, activeRateProfileIndex);
  saveRateProfiles();
  ratePanelSignature = "";
  return cloneRateProfile(getCurrentRateProfile());
}

function setRateValue(axis, field, value) {
  const profile = cloneRateProfile(getCurrentRateProfile());
  const axisKey = sanitizeRateAxis(axis);
  if (!axisKey || !profile.values[axisKey]) return false;

  const definition = getRateFields(profile.type).find(([fieldKey]) => fieldKey === field);
  if (!definition) return false;
  const [, , min, max] = definition;
  profile.values[axisKey][field] = sanitizeNumber(value, profile.values[axisKey][field], min, max);
  rateProfiles[activeRateProfileIndex] = sanitizeRateProfile(profile, activeRateProfileIndex);
  saveRateProfiles();
  return cloneRateProfile(getCurrentRateProfile());
}

function getRateDegreesPerSecond(axis, stick) {
  const profile = getCurrentRateProfile();
  const axisKey = sanitizeRateAxis(axis) || "roll";
  const value = THREE.MathUtils.clamp(Number(stick) || 0, -1, 1);
  const config = profile.values[axisKey];
  const result = profile.type === "betaflight"
    ? applyBetaflightRate(value, config)
    : applyActualRate(value, config);
  return THREE.MathUtils.clamp(result, -RATE_LIMIT_DEG, RATE_LIMIT_DEG);
}

function applyActualRate(stick, config) {
  const rcCommandAbs = Math.abs(stick);
  const expo = sanitizeNumber(config.expo, 0, 0, 1);
  const expoFactor = rcCommandAbs * (Math.pow(stick, 5) * expo + stick * (1 - expo));
  const centerSensitivity = sanitizeNumber(config.center, 200, 10, RATE_LIMIT_DEG);
  const maxRate = sanitizeNumber(config.max, 700, 100, RATE_LIMIT_DEG);
  const stickMovement = Math.max(0, maxRate - centerSensitivity);
  return stick * centerSensitivity + stickMovement * expoFactor;
}

function applyBetaflightRate(stick, config) {
  const rcCommandAbs = Math.abs(stick);
  const expo = sanitizeNumber(config.expo, 0, 0, 1);
  const curved = expo
    ? stick * Math.pow(rcCommandAbs, 3) * expo + stick * (1 - expo)
    : stick;
  let rcRate = sanitizeNumber(config.rcRate, 1, 0.01, 3);
  if (rcRate > 2) {
    rcRate += 14.54 * (rcRate - 2);
  }

  let angleRate = 200 * rcRate * curved;
  const superRate = sanitizeNumber(config.superRate, 0, 0, 0.99);
  if (superRate > 0) {
    const superFactor = 1 / THREE.MathUtils.clamp(1 - rcCommandAbs * superRate, 0.01, 1);
    angleRate *= superFactor;
  }
  return angleRate;
}

function getRateFields(type) {
  return type === "betaflight" ? BETAFLIGHT_RATE_FIELDS : ACTUAL_RATE_FIELDS;
}

function sanitizeRateProfiles(profiles) {
  const result = [];
  for (let index = 0; index < RATE_PROFILE_COUNT; index += 1) {
    result.push(sanitizeRateProfile(profiles?.[index], index));
  }
  return result;
}

function sanitizeRateProfile(profile, index) {
  const fallback = DEFAULT_RATE_PROFILES[index] || DEFAULT_RATE_PROFILES[0];
  const source = profile && typeof profile === "object" ? profile : fallback;
  const type = RATE_TYPE_VALUES.has(source.type) ? source.type : fallback.type;
  return {
    name: typeof source.name === "string" && source.name.trim()
      ? source.name.trim().slice(0, 24)
      : fallback.name,
    type,
    values: sanitizeRateValues(type, source.values || fallback.values, createDefaultRateValues(type, index))
  };
}

function sanitizeRateValues(type, values, fallbackValues = createDefaultRateValues(type, 0)) {
  const result = {};
  RATE_AXES.forEach(([axis]) => {
    const source = values?.[axis] || {};
    const fallback = fallbackValues?.[axis] || createDefaultRateValues(type, 0)[axis];
    result[axis] = {};
    getRateFields(type).forEach(([field, , min, max]) => {
      result[axis][field] = sanitizeNumber(source[field], fallback[field], min, max);
    });
  });
  return result;
}

function createDefaultRateValues(type, profileIndex) {
  const fallback = DEFAULT_RATE_PROFILES[profileIndex] || DEFAULT_RATE_PROFILES[0];
  if (fallback.type === type) {
    return cloneRateProfile(fallback).values;
  }

  if (type === "betaflight") {
    return cloneRateProfile(DEFAULT_RATE_PROFILES[1]).values;
  }

  return cloneRateProfile(DEFAULT_RATE_PROFILES[0]).values;
}

function sanitizeRateAxis(axis) {
  return RATE_AXES.some(([axisKey]) => axisKey === axis) ? axis : null;
}

function cloneRateProfiles(profiles) {
  return profiles.map(cloneRateProfile);
}

function cloneRateProfile(profile) {
  return {
    name: profile.name,
    type: profile.type,
    values: Object.fromEntries(
      RATE_AXES.map(([axis]) => [axis, { ...(profile.values?.[axis] || {}) }])
    )
  };
}

function formatRateValue(value, precision) {
  return Number(value).toFixed(precision);
}

function createFlightState() {
  const state = {
    armed: true,
    position: new THREE.Vector3(0, 1.1, 42),
    velocity: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    angularVelocity: new THREE.Vector3(),
    rateIntegrator: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    roll: 0,
    pitchRate: 0,
    rollRate: 0,
    throttle: AIRCRAFT.defaultThrottle,
    motorDrives: [AIRCRAFT.motorIdle, AIRCRAFT.motorIdle, AIRCRAFT.motorIdle, AIRCRAFT.motorIdle],
    motorTargets: [AIRCRAFT.motorIdle, AIRCRAFT.motorIdle, AIRCRAFT.motorIdle, AIRCRAFT.motorIdle],
    motorThrusts: [0, 0, 0, 0],
    motorCurrents: [0, 0, 0, 0],
    acceleration: new THREE.Vector3(),
    batterySoc: 1,
    batteryVoltage: AIRCRAFT.battery.fullVoltage,
    batteryOpenCircuitVoltage: AIRCRAFT.battery.fullVoltage,
    batterySag: 0,
    batteryResistanceOhm: AIRCRAFT.battery.baseResistanceOhm,
    currentA: 0,
    thrustN: 0
  };
  composeAttitude(state);
  return state;
}

function resetFlight() {
  flight.armed = true;
  flight.position.set(0, 1.1, 42);
  flight.velocity.set(0, 0, 0);
  flight.angularVelocity.set(0, 0, 0);
  flight.rateIntegrator.set(0, 0, 0);
  flight.yaw = 0;
  flight.pitch = 0;
  flight.roll = 0;
  flight.pitchRate = 0;
  flight.rollRate = 0;
  flight.throttle = AIRCRAFT.defaultThrottle;
  flight.motorDrives.fill(AIRCRAFT.motorIdle);
  flight.motorTargets.fill(AIRCRAFT.motorIdle);
  flight.motorThrusts.fill(0);
  flight.motorCurrents.fill(0);
  flight.acceleration.set(0, 0, 0);
  flight.batterySoc = 1;
  flight.batteryVoltage = AIRCRAFT.battery.fullVoltage;
  flight.batteryOpenCircuitVoltage = AIRCRAFT.battery.fullVoltage;
  flight.batterySag = 0;
  flight.batteryResistanceOhm = AIRCRAFT.battery.baseResistanceOhm;
  flight.currentA = 0;
  flight.thrustN = 0;
  composeAttitude(flight);
  controls.resetTransientAxes();
  updateButtons();
}

function setMap(mapId, options = {}) {
  const broadcast = options.broadcast !== false;
  if (!MAPS[mapId]) return false;
  if (mapId === currentMapId && world) {
    if (broadcast && multiplayer?.enabled) {
      multiplayer.requestMap(mapId);
    }
    return false;
  }
  if (world) {
    scene.remove(world.root);
    disposeObject3D(world.root);
  }
  currentMapId = mapId;
  localStorage.setItem("fpv-map", currentMapId);
  world = buildWorld(currentMapId);
  resetFlight();
  updateButtons();
  if (broadcast && multiplayer?.enabled) {
    multiplayer.requestMap(currentMapId);
  }
  return true;
}

function updateFlight(dt) {
  const input = controls.sample(dt);
  syncEulerFromQuaternion(flight);
  updateThrottle(input, dt);

  const rateTargets = tmpVec.set(0, 0, 0);
  setRateTargets(input, rateTargets);

  const requestedTorques = tmpVec2.set(0, 0, 0);
  calculateControlTorques(rateTargets, requestedTorques, dt);
  updateMotors(requestedTorques, dt);
  updateBattery(dt);

  const groundEffect = getGroundEffectMultiplier();
  const motorTorques = tmpVec3.set(0, 0, 0);
  const thrustN = calculateMotorTorques(motorTorques, groundEffect);
  flight.thrustN = thrustN;
  addAngularDamping(motorTorques);

  flight.angularVelocity.x += (motorTorques.x / AIRCRAFT.inertia.x) * dt;
  flight.angularVelocity.y += (motorTorques.y / AIRCRAFT.inertia.y) * dt;
  flight.angularVelocity.z += (motorTorques.z / AIRCRAFT.inertia.z) * dt;
  flight.angularVelocity.clampLength(0, 31);
  integrateAttitude(dt);

  const force = tmpVec4.set(0, -AIRCRAFT.massKg * GRAVITY, 0);
  force.addScaledVector(tmpVec5.copy(UP).applyQuaternion(flight.quaternion), thrustN);
  addAerodynamicDrag(force);

  const acceleration = force.multiplyScalar(1 / AIRCRAFT.massKg);
  flight.acceleration.copy(acceleration);
  flight.velocity.addScaledVector(acceleration, dt);
  flight.velocity.clampLength(0, 44);
  flight.position.addScaledVector(flight.velocity, dt);

  flight.pitchRate = flight.angularVelocity.x;
  flight.rollRate = flight.angularVelocity.z;

  resolveGround(dt);
  resolveBounds();
  syncEulerFromQuaternion(flight);
}

function updateThrottle(input, dt) {
  const throttleRate = 0.64;
  if (Number.isFinite(input.throttleTarget)) {
    flight.throttle = THREE.MathUtils.lerp(
      flight.throttle,
      input.throttleTarget,
      1 - Math.exp(-dt * 14)
    );
  } else {
    flight.throttle = THREE.MathUtils.clamp(
      flight.throttle + input.throttle * throttleRate * dt,
      0,
      1
    );
  }

  if (!flight.armed) {
    flight.throttle = 0;
  }

  if (input.brake) {
    flight.throttle = THREE.MathUtils.lerp(flight.throttle, getHoverThrottle() * 0.92, 1 - Math.exp(-dt * 4));
    flight.velocity.multiplyScalar(Math.exp(-dt * 1.35));
  }
}

function setRateTargets(input, output) {
  const pitchRate = getRateDegreesPerSecond("pitch", input.pitch) * DEG;
  const rollRate = getRateDegreesPerSecond("roll", input.roll) * DEG;
  const yawRate = getRateDegreesPerSecond("yaw", input.yaw) * DEG;

  if (levelMode) {
    const maxPitchRate = Math.abs(getRateDegreesPerSecond("pitch", 1)) * DEG;
    const maxRollRate = Math.abs(getRateDegreesPerSecond("roll", 1)) * DEG;
    const targetPitch = -input.pitch * AIRCRAFT.maxLevelAngle;
    const targetRoll = -input.roll * AIRCRAFT.maxLevelAngle;
    output.x = THREE.MathUtils.clamp(
      (targetPitch - flight.pitch) * AIRCRAFT.levelRateGain,
      -Math.abs(maxPitchRate || AIRCRAFT.maxRates.pitch),
      Math.abs(maxPitchRate || AIRCRAFT.maxRates.pitch)
    );
    output.z = THREE.MathUtils.clamp(
      (targetRoll - flight.roll) * AIRCRAFT.levelRateGain,
      -Math.abs(maxRollRate || AIRCRAFT.maxRates.roll),
      Math.abs(maxRollRate || AIRCRAFT.maxRates.roll)
    );
  } else {
    output.x = -pitchRate;
    output.z = -rollRate;
  }
  output.y = -yawRate;
}

function calculateControlTorques(rateTargets, output, dt) {
  if (!flight.armed) {
    flight.rateIntegrator.set(0, 0, 0);
    output.set(0, 0, 0);
    return;
  }

  const errorX = rateTargets.x - flight.angularVelocity.x;
  const errorY = rateTargets.y - flight.angularVelocity.y;
  const errorZ = rateTargets.z - flight.angularVelocity.z;

  flight.rateIntegrator.x = clampAbs(flight.rateIntegrator.x + errorX * dt, AIRCRAFT.rateIntegralLimit.x);
  flight.rateIntegrator.y = clampAbs(flight.rateIntegrator.y + errorY * dt, AIRCRAFT.rateIntegralLimit.y);
  flight.rateIntegrator.z = clampAbs(flight.rateIntegrator.z + errorZ * dt, AIRCRAFT.rateIntegralLimit.z);

  output.x = clampAbs(
    AIRCRAFT.inertia.x * (errorX / AIRCRAFT.rateTimeConstant.x + flight.rateIntegrator.x * AIRCRAFT.rateIntegralGain.x),
    AIRCRAFT.torqueLimit.x
  );
  output.y = clampAbs(
    AIRCRAFT.inertia.y * (errorY / AIRCRAFT.rateTimeConstant.y + flight.rateIntegrator.y * AIRCRAFT.rateIntegralGain.y),
    AIRCRAFT.torqueLimit.y
  );
  output.z = clampAbs(
    AIRCRAFT.inertia.z * (errorZ / AIRCRAFT.rateTimeConstant.z + flight.rateIntegrator.z * AIRCRAFT.rateIntegralGain.z),
    AIRCRAFT.torqueLimit.z
  );
}

function updateMotors(requestedTorques, dt) {
  const maxThrustPerMotor = getVoltageScaledMaxThrust();
  const baseDrive = flight.armed ? THREE.MathUtils.clamp(flight.throttle, AIRCRAFT.motorIdle, 1) : 0;
  const baseThrust = sampleMotorAtDrive(baseDrive, flight.batteryVoltage).thrustN;
  const pitchDelta = requestedTorques.x / (4 * AIRCRAFT.armOffsetM);
  const rollDelta = requestedTorques.z / (4 * AIRCRAFT.armOffsetM);
  const yawDelta = requestedTorques.y / (4 * AIRCRAFT.yawTorquePerNewton);
  const motorLerp = 1 - Math.exp(-dt / AIRCRAFT.motorTimeConstant);

  AIRCRAFT.motors.forEach((motor, index) => {
    let targetThrust = baseThrust;
    targetThrust += -Math.sign(motor.z) * pitchDelta;
    targetThrust += Math.sign(motor.x) * rollDelta;
    targetThrust += motor.yawSign * yawDelta;
    targetThrust = THREE.MathUtils.clamp(targetThrust, 0, maxThrustPerMotor);

    const idle = flight.armed ? AIRCRAFT.motorIdle : 0;
    const targetDrive = maxThrustPerMotor > 0
      ? THREE.MathUtils.clamp(getMotorDriveForThrustAtVoltage(targetThrust, flight.batteryVoltage), idle, 1)
      : 0;

    flight.motorTargets[index] = targetDrive;
    flight.motorDrives[index] = THREE.MathUtils.lerp(flight.motorDrives[index], targetDrive, motorLerp);
    const sample = sampleMotorAtDrive(flight.motorDrives[index], flight.batteryVoltage);
    flight.motorThrusts[index] = sample.thrustN;
    flight.motorCurrents[index] = sample.currentA;
  });
}

function updateBattery(dt) {
  const battery = AIRCRAFT.battery;
  let currentA = flight.armed ? battery.electronicsCurrentA : battery.standbyCurrentA;
  flight.motorCurrents.forEach((current) => {
    currentA += current;
  });

  flight.currentA = currentA;
  flight.batterySoc = Math.max(0, flight.batterySoc - (currentA * dt) / (battery.capacityAh * 3600));

  const unloadedVoltage = estimateOpenCircuitVoltage(flight.batterySoc);
  const resistance = estimateBatteryResistance(flight.batterySoc, currentA);
  const sag = currentA * resistance;
  const loadVoltage = Math.max(battery.cutoffVoltage, unloadedVoltage - sag);
  flight.batteryOpenCircuitVoltage = unloadedVoltage;
  flight.batteryResistanceOhm = resistance;
  flight.batterySag = Math.max(0, unloadedVoltage - loadVoltage);
  flight.batteryVoltage = THREE.MathUtils.lerp(flight.batteryVoltage, loadVoltage, 1 - Math.exp(-dt * 10));
}

function estimateOpenCircuitVoltage(soc) {
  const battery = AIRCRAFT.battery;
  const points = [
    [0, battery.cutoffVoltage],
    [0.08, battery.emptyVoltage],
    [0.28, 3.62],
    [0.55, battery.nominalVoltage],
    [0.82, 4.08],
    [1, battery.fullVoltage]
  ];
  const clampedSoc = clamp01(soc);
  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const next = points[i];
    if (clampedSoc <= next[0]) {
      const t = (clampedSoc - previous[0]) / (next[0] - previous[0]);
      return THREE.MathUtils.lerp(previous[1], next[1], t);
    }
  }
  return battery.fullVoltage;
}

function estimateBatteryResistance(soc, currentA) {
  const base = AIRCRAFT.battery.baseResistanceOhm;
  const lowChargeRise = (1 - clamp01(soc)) * 0.72;
  const highLoadRise = Math.max(0, currentA - 8) * 0.012;
  return base * (1 + lowChargeRise + highLoadRise);
}

function calculateMotorTorques(output, groundEffect) {
  let thrustN = 0;
  AIRCRAFT.motors.forEach((motor, index) => {
    const thrust = flight.motorThrusts[index] * groundEffect;
    thrustN += thrust;
    output.x += -motor.z * thrust;
    output.y += motor.yawSign * AIRCRAFT.yawTorquePerNewton * thrust;
    output.z += motor.x * thrust;
  });
  return thrustN;
}

function addAngularDamping(torque) {
  torque.x -= AIRCRAFT.angularDamping.x * flight.angularVelocity.x;
  torque.y -= AIRCRAFT.angularDamping.y * flight.angularVelocity.y;
  torque.z -= AIRCRAFT.angularDamping.z * flight.angularVelocity.z;
}

function addAerodynamicDrag(force) {
  const inverseAttitude = tmpQuat.copy(flight.quaternion).invert();
  const bodyVelocity = tmpVec.copy(flight.velocity).applyQuaternion(inverseAttitude);
  const dragBody = tmpVec2.set(
    -AIRCRAFT.linearDrag.x * bodyVelocity.x * Math.abs(bodyVelocity.x),
    -AIRCRAFT.linearDrag.y * bodyVelocity.y * Math.abs(bodyVelocity.y),
    -AIRCRAFT.linearDrag.z * bodyVelocity.z * Math.abs(bodyVelocity.z)
  );
  force.add(dragBody.applyQuaternion(flight.quaternion));
}

function integrateAttitude(dt) {
  tmpEuler.set(
    flight.angularVelocity.x * dt,
    flight.angularVelocity.y * dt,
    flight.angularVelocity.z * dt,
    "YXZ"
  );
  tmpQuat.setFromEuler(tmpEuler);
  flight.quaternion.multiply(tmpQuat).normalize();
}

function getVoltageScaledMaxThrust() {
  return sampleMotorAtDrive(1, flight.batteryVoltage).thrustN;
}

function getHoverThrottle() {
  const perMotorHoverThrust = (AIRCRAFT.massKg * GRAVITY) / 4;
  return getMotorDriveForThrustAtVoltage(perMotorHoverThrust, flight.batteryVoltage);
}

function getGroundEffectMultiplier() {
  const height = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const effectHeight = AIRCRAFT.propDiameterM * 2.1;
  if (height >= effectHeight) return 1;
  const t = 1 - height / effectHeight;
  return 1 + 0.16 * t * t;
}

function syncEulerFromQuaternion(state) {
  tmpEuler.setFromQuaternion(state.quaternion, "YXZ");
  state.pitch = tmpEuler.x;
  state.yaw = tmpEuler.y;
  state.roll = tmpEuler.z;
}

function clampAbs(value, limit) {
  return THREE.MathUtils.clamp(value, -limit, limit);
}

function composeAttitude(state) {
  tmpEuler.set(state.pitch, state.yaw, state.roll, "YXZ");
  state.quaternion.setFromEuler(tmpEuler);
}

function resolveGround(dt) {
  if (flight.position.y < GROUND_HEIGHT) {
    flight.position.y = GROUND_HEIGHT;
    if (flight.velocity.y < 0) {
      flight.velocity.y *= -0.08;
    }
    flight.velocity.x *= Math.exp(-dt * 5.5);
    flight.velocity.z *= Math.exp(-dt * 5.5);
    flight.angularVelocity.multiplyScalar(Math.exp(-dt * 8));
    flight.rateIntegrator.multiplyScalar(Math.exp(-dt * 12));
    if (flight.throttle < getHoverThrottle() * 0.9) {
      syncEulerFromQuaternion(flight);
      flight.pitch = THREE.MathUtils.lerp(flight.pitch, 0, 1 - Math.exp(-dt * 6));
      flight.roll = THREE.MathUtils.lerp(flight.roll, 0, 1 - Math.exp(-dt * 6));
      composeAttitude(flight);
    }
  }
}

function resolveBounds() {
  const limit = 430;
  if (Math.abs(flight.position.x) > limit) {
    flight.position.x = Math.sign(flight.position.x) * limit;
    flight.velocity.x *= -0.25;
  }
  if (Math.abs(flight.position.z) > limit) {
    flight.position.z = Math.sign(flight.position.z) * limit;
    flight.velocity.z *= -0.25;
  }
}

function updateCamera() {
  tmpVec.set(0, 0.16, -0.38).applyQuaternion(flight.quaternion);
  camera.position.copy(flight.position).add(tmpVec);
  camera.quaternion.copy(flight.quaternion);
}

function updateHud() {
  const speed = flight.velocity.length();
  const altitudeM = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const usedMah = (1 - flight.batterySoc) * AIRCRAFT.battery.capacityAh * 1000;
  readouts.altitude.textContent = `${altitudeM.toFixed(1)}M`;
  readouts.speed.textContent = `${speed.toFixed(1)}M/S`;
  readouts.throttle.textContent = `${Math.round(flight.throttle * 100)}%`;
  readouts.battery.textContent = `${flight.batteryVoltage.toFixed(2)}V ${Math.round(usedMah).toString().padStart(3, "0")}MAH`;
  readouts.attitude.textContent = `R${signedDegrees(-flight.roll)} P${signedDegrees(-flight.pitch)}`;
  readouts.model.textContent = AIRCRAFT.hudName;
  readouts.source.textContent = controls.lastSource;
  readouts.network.textContent = multiplayer.getLabel();

  readouts.status.classList.remove("warning", "danger");
  if (!flight.armed) {
    readouts.status.textContent = "SAFE";
    readouts.status.classList.add("danger");
  } else if (flight.batteryVoltage <= AIRCRAFT.battery.emptyVoltage) {
    readouts.status.textContent = "LOWV";
    readouts.status.classList.add("danger");
  } else if (flight.batteryVoltage <= 3.55) {
    readouts.status.textContent = "BATT";
    readouts.status.classList.add("warning");
  } else if (flight.position.y < 1.0 && flight.throttle < getHoverThrottle() * 0.92) {
    readouts.status.textContent = "IDLE";
    readouts.status.classList.add("warning");
  } else {
    readouts.status.textContent = "LIVE";
  }
}

function signedDegrees(radians) {
  const degrees = Math.round(radians / DEG);
  return `${degrees >= 0 ? "+" : ""}${degrees}`;
}

function getPhysicsAudit() {
  const altitudeM = Math.max(0, flight.position.y - GROUND_HEIGHT);
  const speed = flight.velocity.length();
  const usedMah = (1 - flight.batterySoc) * AIRCRAFT.battery.capacityAh * 1000;
  const maxThrustN = getVoltageScaledMaxThrust() * 4;
  const thrustToWeight = maxThrustN / Math.max(0.001, AIRCRAFT.massKg * GRAVITY);
  const avgMotorDrive = average(flight.motorDrives);
  const maxMotorDrive = Math.max(...flight.motorDrives);
  const avgMotorCurrent = average(flight.motorCurrents);
  const maxMotorCurrent = Math.max(...flight.motorCurrents);
  const hoverThrottle = getHoverThrottle();
  const currentFlightTimeMin = flight.currentA > 0.05
    ? ((AIRCRAFT.battery.capacityAh * flight.batterySoc) / flight.currentA) * 60
    : Infinity;

  return {
    model: AIRCRAFT.name,
    motor: AIRCRAFT.motorCurve.name,
    motorSource: AIRCRAFT.motorCurve.source,
    battery: AIRCRAFT.battery.name,
    dryMassG: AIRCRAFT.dryMassKg * 1000,
    batteryMassG: AIRCRAFT.battery.massKg * 1000,
    allUpMassG: AIRCRAFT.massKg * 1000,
    wheelbaseMm: AIRCRAFT.wheelbaseM * 1000,
    propMm: AIRCRAFT.propDiameterM * 1000,
    altitudeM,
    speedMS: speed,
    accelerationMS2: flight.acceleration.length(),
    verticalAccelerationMS2: flight.acceleration.y,
    throttle: flight.throttle,
    hoverThrottle,
    thrustN: flight.thrustN,
    thrustG: newtonsToGramForce(flight.thrustN),
    maxThrustG: newtonsToGramForce(maxThrustN),
    thrustToWeight,
    currentA: flight.currentA,
    avgMotorDrive,
    maxMotorDrive,
    avgMotorCurrent,
    maxMotorCurrent,
    batteryVoltage: flight.batteryVoltage,
    batteryOpenCircuitVoltage: flight.batteryOpenCircuitVoltage,
    batterySag: flight.batterySag,
    batteryResistanceOhm: flight.batteryResistanceOhm,
    batterySoc: flight.batterySoc,
    usedMah,
    estimatedRemainingMin: currentFlightTimeMin,
    ratesDps: {
      pitch: flight.angularVelocity.x / DEG,
      yaw: flight.angularVelocity.y / DEG,
      roll: flight.angularVelocity.z / DEG
    },
    inertia: { ...AIRCRAFT.inertia }
  };
}

function getMotorSweep(voltage = AIRCRAFT.battery.nominalVoltage) {
  const cleanVoltage = sanitizeNumber(voltage, AIRCRAFT.battery.nominalVoltage, AIRCRAFT.battery.cutoffVoltage, AIRCRAFT.battery.fullVoltage);
  return AIRCRAFT.motorCurve.points.map((point) => {
    const sample = sampleMotorAtDrive(point.drive, cleanVoltage);
    return {
      drive: point.drive,
      voltage: cleanVoltage,
      thrustG: sample.thrustG,
      currentA: sample.currentA
    };
  });
}

function updatePhysicsPanel(now = performance.now(), force = false) {
  if (!physicsPanelOpen) return;
  if (!force && now - physicsPanelLastUpdate < 120) return;
  physicsPanelLastUpdate = now;

  const audit = getPhysicsAudit();
  physicsRows.replaceChildren(
    createPhysicsRow("MODEL", audit.model),
    createPhysicsRow("MOTOR", audit.motor),
    createPhysicsRow("SOURCE", audit.motorSource),
    createPhysicsRow("MASS", `${formatFixed(audit.allUpMassG, 1)}G AUW (${formatFixed(audit.dryMassG, 1)}G + ${formatFixed(audit.batteryMassG, 1)}G)`),
    createPhysicsRow("GEOMETRY", `${formatFixed(audit.wheelbaseMm, 0)}MM WB / ${formatFixed(audit.propMm, 0)}MM PROP`),
    createPhysicsRow("THROTTLE", `${formatPercent(audit.throttle)} CMD / ${formatPercent(audit.hoverThrottle)} HOVER`, getHoverClass(audit)),
    createPhysicsRow("THRUST", `${formatFixed(audit.thrustG, 1)}G NOW / ${formatFixed(audit.maxThrustG, 0)}G MAX`, audit.thrustToWeight < 3.5 ? "is-warning" : "is-good"),
    createPhysicsRow("T/W", `${formatFixed(audit.thrustToWeight, 2)}:1`, audit.thrustToWeight < 3.5 ? "is-warning" : "is-good"),
    createPhysicsRow("MOTOR OUT", `${formatPercent(audit.avgMotorDrive)} AVG / ${formatPercent(audit.maxMotorDrive)} MAX`),
    createPhysicsRow("MOTOR A", `${formatFixed(audit.avgMotorCurrent, 2)} AVG / ${formatFixed(audit.maxMotorCurrent, 2)} MAX`),
    createPhysicsRow("PACK A", `${formatFixed(audit.currentA, 2)}A`, audit.currentA > 16 ? "is-warning" : ""),
    createPhysicsRow("PACK V", `${formatFixed(audit.batteryVoltage, 2)}V LOAD / ${formatFixed(audit.batteryOpenCircuitVoltage, 2)}V OCV`, audit.batteryVoltage <= AIRCRAFT.battery.emptyVoltage ? "is-danger" : ""),
    createPhysicsRow("SAG", `${formatFixed(audit.batterySag, 2)}V @ ${Math.round(audit.batteryResistanceOhm * 1000)}MOHM`, audit.batterySag > 0.7 ? "is-warning" : ""),
    createPhysicsRow("CAPACITY", `${Math.round(audit.usedMah)}MAH USED / ${formatPercent(audit.batterySoc)} SOC`),
    createPhysicsRow("TIME LEFT", Number.isFinite(audit.estimatedRemainingMin) ? `${formatFixed(audit.estimatedRemainingMin, 1)}MIN AT CURRENT A` : "--"),
    createPhysicsRow("SPEED", `${formatFixed(audit.speedMS, 1)}M/S @ ${formatFixed(audit.altitudeM, 1)}M`),
    createPhysicsRow("ACCEL", `${formatFixed(audit.verticalAccelerationMS2, 1)}M/S2 VERT / ${formatFixed(audit.accelerationMS2, 1)}M/S2 NET`),
    createPhysicsRow("RATES", `R${formatSignedFixed(audit.ratesDps.roll, 0)} P${formatSignedFixed(audit.ratesDps.pitch, 0)} Y${formatSignedFixed(audit.ratesDps.yaw, 0)} DPS`)
  );
}

function createPhysicsRow(labelText, valueText, valueClass = "") {
  const row = document.createElement("div");
  row.className = "physics-row";

  const label = document.createElement("div");
  label.className = "physics-cell";
  label.textContent = labelText;

  const value = document.createElement("div");
  value.className = `physics-cell ${valueClass}`.trim();
  value.textContent = valueText;

  row.append(label, value);
  return row;
}

function getHoverClass(audit) {
  if (audit.throttle < audit.hoverThrottle * 0.75) return "is-warning";
  if (audit.throttle > audit.hoverThrottle * 1.7) return "is-warning";
  return "";
}

function formatPercent(value) {
  return `${Math.round(THREE.MathUtils.clamp(value, 0, 1) * 100)}%`;
}

function formatFixed(value, precision) {
  return Number(value).toFixed(precision);
}

function formatSignedFixed(value, precision) {
  const fixed = Number(value).toFixed(precision);
  return `${value >= 0 ? "+" : ""}${fixed}`;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function updateButtons() {
  armButton.textContent = flight.armed ? "DISARM" : "ARM";
  levelButton.textContent = levelMode ? "LEVEL" : "ACRO";
  mapButton.textContent = MAPS[MAPS[currentMapId].next].label;
  ratesButton.textContent = ratePanelOpen ? "RATES*" : "RATES";
  physicsButton.textContent = physicsPanelOpen ? "PHYS*" : "PHYS";
  inputButton.textContent = inputPanelOpen ? "INPUT*" : "INPUT";
}

function setRatePanelOpen(open) {
  ratePanelOpen = Boolean(open);
  if (ratePanelOpen && inputPanelOpen) {
    inputPanelOpen = false;
    inputPanel.classList.add("is-hidden");
    inputPanel.setAttribute("aria-hidden", "true");
  }
  if (ratePanelOpen && physicsPanelOpen) {
    physicsPanelOpen = false;
    physicsPanel.classList.add("is-hidden");
    physicsPanel.setAttribute("aria-hidden", "true");
  }
  ratePanel.classList.toggle("is-hidden", !ratePanelOpen);
  ratePanel.setAttribute("aria-hidden", ratePanelOpen ? "false" : "true");
  ratePanelSignature = "";
  updateButtons();
  updateRatePanel(true);
}

function setPhysicsPanelOpen(open) {
  physicsPanelOpen = Boolean(open);
  if (physicsPanelOpen && inputPanelOpen) {
    inputPanelOpen = false;
    inputPanel.classList.add("is-hidden");
    inputPanel.setAttribute("aria-hidden", "true");
  }
  if (physicsPanelOpen && ratePanelOpen) {
    ratePanelOpen = false;
    ratePanel.classList.add("is-hidden");
    ratePanel.setAttribute("aria-hidden", "true");
  }
  physicsPanel.classList.toggle("is-hidden", !physicsPanelOpen);
  physicsPanel.setAttribute("aria-hidden", physicsPanelOpen ? "false" : "true");
  updateButtons();
  updatePhysicsPanel(performance.now(), true);
}

function updateRatePanel(force = false) {
  if (!ratePanelOpen) return;
  const profile = getCurrentRateProfile();
  const signature = getRatePanelSignature(profile);

  if (force || signature !== ratePanelSignature) {
    ratePanelSignature = signature;
    renderRatePanel(profile);
  }

  updateRatePreview();
}

function getRatePanelSignature(profile = getCurrentRateProfile()) {
  return `${activeRateProfileIndex}:${JSON.stringify(profile)}`;
}

function renderRatePanel(profile) {
  renderRateProfileSelect();
  renderRateTypeSelect(profile.type);
  rateProfileName.textContent = `PROFILE ${activeRateProfileIndex + 1}`;
  rateRows.textContent = "";

  const heading = document.createElement("div");
  heading.className = "rate-grid-head";
  heading.append(createRateCell(""));
  RATE_AXES.forEach(([, label]) => heading.append(createRateCell(label)));
  rateRows.append(heading);

  getRateFields(profile.type).forEach((field) => {
    rateRows.append(createRateRow(field, profile));
  });

  const maxRow = document.createElement("div");
  maxRow.className = "rate-grid-row rate-grid-row-readonly";
  maxRow.append(createRateCell("Max Vel"));
  RATE_AXES.forEach(([axis]) => {
    const cell = createRateCell(`${Math.round(getRateDegreesPerSecond(axis, 1))}`);
    cell.dataset.axis = axis;
    maxRow.append(cell);
  });
  rateRows.append(maxRow);
}

function renderRateProfileSelect() {
  const signature = `${activeRateProfileIndex}:${rateProfiles.map((profile) => profile.name).join("|")}`;
  if (rateProfileSelect.dataset.signature === signature) return;

  rateProfileSelect.dataset.signature = signature;
  rateProfileSelect.textContent = "";
  rateProfiles.forEach((profile, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = profile.name || `Profile ${index + 1}`;
    option.selected = index === activeRateProfileIndex;
    rateProfileSelect.append(option);
  });
}

function renderRateTypeSelect(type) {
  if (rateTypeSelect.dataset.value === type) return;

  rateTypeSelect.dataset.value = type;
  rateTypeSelect.textContent = "";
  RATE_TYPES.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === type;
    rateTypeSelect.append(option);
  });
}

function createRateRow(field, profile) {
  const [fieldKey, labelText, min, max, step, precision] = field;
  const row = document.createElement("div");
  row.className = "rate-grid-row";
  row.append(createRateCell(labelText));

  RATE_AXES.forEach(([axis, label]) => {
    const cell = document.createElement("label");
    cell.className = "rate-cell rate-control";

    const input = document.createElement("input");
    input.className = "rate-input";
    input.type = "number";
    input.id = `rate-${axis}-${fieldKey}`;
    input.name = `rate-${axis}-${fieldKey}`;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = formatRateValue(profile.values[axis][fieldKey], precision);
    input.dataset.axis = axis;
    input.dataset.field = fieldKey;
    input.dataset.precision = String(precision);
    input.setAttribute("aria-label", `${label} ${labelText}`);

    const value = document.createElement("span");
    value.className = "rate-value";
    value.textContent = input.value;

    cell.append(input, value);
    row.append(cell);
  });

  return row;
}

function createRateCell(text) {
  const cell = document.createElement("div");
  cell.className = "rate-cell";
  cell.textContent = text;
  return cell;
}

function updateRateValueLabel(input) {
  const label = input.parentElement?.querySelector(".rate-value");
  if (!label) return;
  const numericValue = Number(input.value);
  label.textContent = Number.isFinite(numericValue)
    ? formatRateValue(numericValue, Number(input.dataset.precision))
    : input.value;
}

function updateRateMaxVelocityRow() {
  RATE_AXES.forEach(([axis]) => {
    const cell = rateRows.querySelector(`.rate-grid-row-readonly .rate-cell[data-axis="${axis}"]`);
    if (cell) {
      cell.textContent = `${Math.round(getRateDegreesPerSecond(axis, 1))}`;
    }
  });
}

function updateRatePreview() {
  if (!ratePanelOpen) return;
  const width = 360;
  const height = 180;
  const padding = 18;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const maxRate = Math.max(1, ...RATE_AXES.map(([axis]) => Math.abs(getRateDegreesPerSecond(axis, 1))));

  rateCurve.textContent = "";
  const ns = "http://www.w3.org/2000/svg";
  const grid = document.createElementNS(ns, "g");
  grid.classList.add("rate-curve-grid");
  [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
    const x = padding + ratio * innerWidth;
    const y = height - padding - ratio * innerHeight;
    const vLine = document.createElementNS(ns, "line");
    vLine.setAttribute("x1", x);
    vLine.setAttribute("x2", x);
    vLine.setAttribute("y1", padding);
    vLine.setAttribute("y2", height - padding);
    grid.append(vLine);
    const hLine = document.createElementNS(ns, "line");
    hLine.setAttribute("x1", padding);
    hLine.setAttribute("x2", width - padding);
    hLine.setAttribute("y1", y);
    hLine.setAttribute("y2", y);
    grid.append(hLine);
  });
  rateCurve.append(grid);

  RATE_AXES.forEach(([axis], axisIndex) => {
    const points = [];
    for (let i = 0; i <= 80; i += 1) {
      const stick = i / 80;
      const rate = Math.abs(getRateDegreesPerSecond(axis, stick));
      const x = padding + stick * innerWidth;
      const y = height - padding - (rate / maxRate) * innerHeight;
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    const path = document.createElementNS(ns, "polyline");
    path.classList.add("rate-curve-line", `rate-curve-line-${axisIndex}`);
    path.setAttribute("points", points.join(" "));
    rateCurve.append(path);
  });

  rateSummary.textContent = RATE_AXES
    .map(([axis, label]) => `${label} ${Math.round(getRateDegreesPerSecond(axis, 1))}`)
    .join("  ");
}

function setInputPanelOpen(open) {
  inputPanelOpen = Boolean(open);
  if (inputPanelOpen && ratePanelOpen) {
    ratePanelOpen = false;
    ratePanel.classList.add("is-hidden");
    ratePanel.setAttribute("aria-hidden", "true");
  }
  if (inputPanelOpen && physicsPanelOpen) {
    physicsPanelOpen = false;
    physicsPanel.classList.add("is-hidden");
    physicsPanel.setAttribute("aria-hidden", "true");
  }
  inputPanel.classList.toggle("is-hidden", !inputPanelOpen);
  inputPanel.setAttribute("aria-hidden", inputPanelOpen ? "false" : "true");
  inputPanelSignature = "";
  updateButtons();
  updateInputPanel(true);
}

function updateInputPanel(force = false) {
  if (!inputPanelOpen || !controls) return;
  const devices = controls.getInputDevices();
  renderInputDeviceSelect(devices);

  const active = controls.getActiveInputDevice();
  const signature = active.kind === "gamepad"
    ? `${active.id}:${active.gamepad.index}:${active.gamepad.id}:${active.gamepad.axes.length}:${active.gamepad.buttons.length}:${JSON.stringify(controls.getGamepadMapping())}`
    : `${active.id}:${JSON.stringify(controls.getKeyboardMouseMapping())}`;

  if (force || signature !== inputPanelSignature) {
    inputPanelSignature = signature;
    renderInputRows(active);
  }

  if (active.kind === "gamepad") {
    updateGamepadInputRowValues(active.gamepad);
  } else {
    updateKeyboardMouseRowValues(controls.getKeyboardMouseState());
  }
}

function renderInputDeviceSelect(devices) {
  const signature = devices.map((device) => `${device.id}:${device.label}:${device.active}`).join("|");
  if (inputDeviceSelect.dataset.signature === signature) {
    return;
  }

  inputDeviceSelect.dataset.signature = signature;
  inputDeviceSelect.textContent = "";
  inputDeviceSelect.disabled = false;
  devices.forEach((device) => {
    const option = document.createElement("option");
    option.value = device.id;
    option.textContent = device.label;
    option.selected = device.active;
    inputDeviceSelect.append(option);
  });
}

function renderInputRows(active) {
  inputRows.textContent = "";
  inputRows.scrollTop = 0;
  if (active.kind === "keyboard") {
    renderKeyboardMouseRows(controls.getKeyboardMouseMapping());
    return;
  }

  renderGamepadRows(active.gamepad, controls.getGamepadMapping());
}

function renderGamepadRows(gamepad, mapping) {
  if (!gamepad) {
    const empty = document.createElement("div");
    empty.className = "input-empty";
    empty.textContent = "NO GAMEPAD INPUT";
    inputRows.append(empty);
    return;
  }

  gamepad.axes.forEach((value, index) => {
    inputRows.append(createGamepadInputRow("axis", index, value, getGamepadBinding(mapping, "axis", index)));
  });

  gamepad.buttons.forEach((value, index) => {
    inputRows.append(createGamepadInputRow("button", index, value, getGamepadBinding(mapping, "button", index)));
  });
}

function renderKeyboardMouseRows(mapping) {
  inputRows.append(createInputSection("MOUSE"));
  inputRows.append(createMouseAxisRow("x", controls.getMouseAxisValue("x"), getMouseAxisBinding(mapping, "x")));
  inputRows.append(createMouseAxisRow("y", controls.getMouseAxisValue("y"), getMouseAxisBinding(mapping, "y")));

  inputRows.append(createInputSection("MOUSE TUNE"));
  MOUSE_SETTING_DEFS.forEach((definition) => {
    inputRows.append(createMouseSettingRow(definition, mapping.settings[definition[0]]));
  });

  inputRows.append(createInputSection("KEYS"));
  Object.entries(mapping.keys)
    .sort(([a], [b]) => keySortWeight(a) - keySortWeight(b) || a.localeCompare(b))
    .forEach(([code, binding]) => {
      inputRows.append(createKeyInputRow(code, binding, controls.getKeyValue(code)));
    });
}

function createInputSection(title) {
  const section = document.createElement("div");
  section.className = "input-section";
  section.textContent = title;
  return section;
}

function createGamepadInputRow(type, index, value, binding) {
  const row = document.createElement("div");
  row.className = "input-row";
  row.dataset.type = type;
  row.dataset.index = String(index);

  const label = document.createElement("div");
  label.className = "input-row-label";
  label.textContent = `${type === "axis" ? "AXIS" : "BTN"} ${index}`;
  row.append(label);

  const meter = document.createElement("div");
  meter.className = `input-meter${type === "button" ? " is-button" : ""}`;
  const meterFill = document.createElement("span");
  meter.append(meterFill);
  row.append(meter);

  const valueNode = document.createElement("div");
  valueNode.className = "input-value";
  valueNode.textContent = formatInputValue(value);
  row.append(valueNode);

  const select = document.createElement("select");
  select.className = "input-action";
  select.id = `input-${type}-${index}-action`;
  select.name = `input-${type}-${index}-action`;
  select.setAttribute("aria-label", `${label.textContent} action`);
  INPUT_ACTIONS.forEach(([action, text]) => {
    const option = document.createElement("option");
    option.value = action;
    option.textContent = text;
    option.selected = binding.action === action;
    select.append(option);
  });
  row.append(select);

  const invertLabel = document.createElement("label");
  invertLabel.className = "input-invert";
  const invert = document.createElement("input");
  invert.type = "checkbox";
  invert.id = `input-${type}-${index}-invert`;
  invert.name = `input-${type}-${index}-invert`;
  invert.checked = Boolean(binding.invert);
  invert.disabled = type === "button";
  invertLabel.append(invert, document.createTextNode("INV"));
  row.append(invertLabel);

  setInputMeter(meter, type, value);
  return row;
}

function createMouseAxisRow(axis, value, binding) {
  const row = document.createElement("div");
  row.className = "input-row";
  row.dataset.type = "mouse-axis";
  row.dataset.axis = axis;

  const label = document.createElement("div");
  label.className = "input-row-label";
  label.textContent = `MOUSE ${axis.toUpperCase()}`;
  row.append(label);

  const meter = document.createElement("div");
  meter.className = "input-meter";
  const meterFill = document.createElement("span");
  meter.append(meterFill);
  row.append(meter);

  const valueNode = document.createElement("div");
  valueNode.className = "input-value";
  valueNode.textContent = formatInputValue(value);
  row.append(valueNode);

  const select = document.createElement("select");
  select.className = "input-action";
  select.id = `input-mouse-${axis}-action`;
  select.name = `input-mouse-${axis}-action`;
  select.setAttribute("aria-label", `Mouse ${axis.toUpperCase()} action`);
  MOUSE_AXIS_BINDINGS.forEach(([action, text]) => {
    const option = document.createElement("option");
    option.value = action;
    option.textContent = text;
    option.selected = binding.action === action;
    select.append(option);
  });
  row.append(select);

  const invertLabel = document.createElement("label");
  invertLabel.className = "input-invert";
  const invert = document.createElement("input");
  invert.type = "checkbox";
  invert.id = `input-mouse-${axis}-invert`;
  invert.name = `input-mouse-${axis}-invert`;
  invert.checked = Boolean(binding.invert);
  invertLabel.append(invert, document.createTextNode("INV"));
  row.append(invertLabel);

  setInputMeter(meter, "axis", value);
  return row;
}

function createMouseSettingRow(definition, value) {
  const [key, labelText, min, max, step, precision] = definition;
  const row = document.createElement("div");
  row.className = "input-row input-setting-row";
  row.dataset.type = "mouse-setting";
  row.dataset.setting = key;
  row.dataset.precision = String(precision);

  const label = document.createElement("div");
  label.className = "input-row-label";
  label.textContent = labelText;
  row.append(label);

  const range = document.createElement("input");
  range.className = "input-range";
  range.type = "range";
  range.id = `input-${key}`;
  range.name = `input-${key}`;
  range.min = String(min);
  range.max = String(max);
  range.step = String(step);
  range.value = String(value);
  range.setAttribute("aria-label", labelText);
  row.append(range);

  const valueNode = document.createElement("div");
  valueNode.className = "input-value";
  valueNode.textContent = Number(value).toFixed(precision);
  row.append(valueNode);

  return row;
}

function createKeyInputRow(code, binding, value) {
  const row = document.createElement("div");
  row.className = "input-row input-key-row";
  row.dataset.type = "key";
  row.dataset.code = code;

  const label = document.createElement("div");
  label.className = "input-row-label";
  const capture = document.createElement("button");
  capture.className = "key-capture";
  capture.type = "button";
  capture.dataset.code = code;
  capture.textContent = formatKeyCode(code);
  capture.setAttribute("aria-label", `Change ${formatKeyCode(code)} key`);
  label.append(capture);
  row.append(label);

  const meter = document.createElement("div");
  meter.className = "input-meter is-button";
  const meterFill = document.createElement("span");
  meter.append(meterFill);
  row.append(meter);

  const valueNode = document.createElement("div");
  valueNode.className = "input-value";
  valueNode.textContent = formatInputValue(value);
  row.append(valueNode);

  const select = document.createElement("select");
  select.className = "input-action";
  select.id = `input-key-${code}-action`;
  select.name = `input-key-${code}-action`;
  select.setAttribute("aria-label", `${formatKeyCode(code)} action`);
  const selectedValue = keyboardBindingToSelectValue(binding);
  KEYBOARD_ACTIONS.forEach(([action, text]) => {
    const option = document.createElement("option");
    option.value = action;
    option.textContent = text;
    option.selected = selectedValue === action;
    select.append(option);
  });
  row.append(select);

  const filler = document.createElement("div");
  filler.className = "input-extra";
  row.append(filler);

  setInputMeter(meter, "button", value);
  return row;
}

function updateGamepadInputRowValues(gamepad) {
  if (!gamepad) return;
  gamepad.axes.forEach((value, index) => {
    updateInputRowValue("axis", index, value);
  });
  gamepad.buttons.forEach((value, index) => {
    updateInputRowValue("button", index, value);
  });
}

function updateInputRowValue(type, index, value) {
  const row = inputRows.querySelector(`.input-row[data-type="${type}"][data-index="${index}"]`);
  if (!row) return;
  row.querySelector(".input-value").textContent = formatInputValue(value);
  setInputMeter(row.querySelector(".input-meter"), type, value);
}

function updateKeyboardMouseRowValues(state) {
  ["x", "y"].forEach((axis) => {
    const row = findInputRow("mouse-axis", "axis", axis);
    if (!row) return;
    row.querySelector(".input-value").textContent = formatInputValue(state.mouse[axis]);
    setInputMeter(row.querySelector(".input-meter"), "axis", state.mouse[axis]);
  });

  Object.entries(state.keys).forEach(([code, value]) => {
    const row = findInputRow("key", "code", code);
    if (!row) return;
    row.querySelector(".input-value").textContent = formatInputValue(value);
    setInputMeter(row.querySelector(".input-meter"), "button", value);
  });
}

function findInputRow(type, dataName, value) {
  return [...inputRows.querySelectorAll(`.input-row[data-type="${type}"]`)]
    .find((row) => row.dataset[dataName] === value);
}

function updateMouseSettingRowValue(row) {
  const input = row.querySelector(".input-range");
  const precision = Number(row.dataset.precision);
  row.querySelector(".input-value").textContent = Number(input.value).toFixed(precision);
}

function startKeyCapture(code, button) {
  cancelKeyCapture();
  keyCapture = { code, button };
  button.classList.add("is-capturing");
  button.textContent = "PRESS";
  button.focus();
}

function handleKeyCapture(event) {
  if (!keyCapture) return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const previous = keyCapture.code;
  if (event.code !== "Escape") {
    controls.moveKeyboardKeyBinding(previous, event.code);
    inputPanelSignature = "";
  }
  cancelKeyCapture();
  updateInputPanel(true);
}

function cancelKeyCapture() {
  if (keyCapture?.button?.isConnected) {
    keyCapture.button.classList.remove("is-capturing");
    keyCapture.button.textContent = formatKeyCode(keyCapture.code);
  }
  keyCapture = null;
}

function setInputMeter(meter, type, value) {
  const fill = meter.querySelector("span");
  const clamped = type === "button"
    ? THREE.MathUtils.clamp(value, 0, 1)
    : THREE.MathUtils.clamp(value, -1, 1);

  if (type === "button") {
    fill.style.left = "0%";
    fill.style.width = `${clamped * 100}%`;
    return;
  }

  const magnitude = Math.abs(clamped) * 50;
  fill.style.left = `${clamped < 0 ? 50 - magnitude : 50}%`;
  fill.style.width = `${magnitude}%`;
}

function formatInputValue(value) {
  return Number(value).toFixed(2);
}

function formatKeyCode(code) {
  return String(code)
    .replace(/^Key/, "")
    .replace(/^Digit/, "")
    .replace(/^Arrow/, "")
    .replace("ControlLeft", "L CTRL")
    .replace("ControlRight", "R CTRL")
    .replace("ShiftLeft", "L SHIFT")
    .replace("ShiftRight", "R SHIFT")
    .replace("Space", "SPACE")
    .replace("Minus", "-")
    .replace("Equal", "=")
    .replace("BracketLeft", "[")
    .replace("BracketRight", "]")
    .replace("Semicolon", ";")
    .replace("Quote", "'")
    .replace("Comma", ",")
    .replace("Period", ".")
    .replace("Slash", "/")
    .replace("Backslash", "\\")
    .replace("Backquote", "`")
    .toUpperCase();
}

function keySortWeight(code) {
  const order = [
    "ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp",
    "KeyA", "KeyD", "KeyS", "KeyW",
    "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
    "Space", "KeyB", "KeyM", "KeyR"
  ];
  const index = order.indexOf(code);
  return index === -1 ? 1000 : index;
}

function shortenInputName(name) {
  return String(name || "Gamepad")
    .replace(/\s*\(Vendor:.*?\)\s*/i, "")
    .slice(0, 34);
}

function buildWorld(mapId = "airfield") {
  const root = new THREE.Group();
  scene.add(root);
  applyMapAtmosphere(mapId);

  const objects = {
    id: mapId,
    root,
    gateRings: [],
    flags: [],
    clouds: [],
    rides: [],
    blinkers: []
  };

  if (mapId === "fairground") {
    buildFairgroundWorld(objects);
  } else {
    buildAirfieldWorld(objects);
  }

  return objects;
}

function applyMapAtmosphere(mapId) {
  if (mapId === "fairground") {
    scene.background = new THREE.Color(0x76b7cf);
    scene.fog = new THREE.Fog(0xa8cdd5, 120, 520);
  } else {
    scene.background = new THREE.Color(0x8fc8dd);
    scene.fog = new THREE.Fog(0x9fcdda, 130, 560);
  }
}

function buildAirfieldWorld(objects) {
  const groundTexture = createGroundTexture();
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(72, 72);
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.anisotropy = 8;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900, 48, 48),
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.92,
      metalness: 0.02
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  objects.root.add(ground);

  addRunway(objects);
  addLandingPad(objects);
  addGates(objects);
  addCourseMarkers(objects);
  addBuildings(objects);
  addTrees(objects);
  addClouds(objects);
}

function buildFairgroundWorld(objects) {
  const groundTexture = createFairgroundTexture();
  groundTexture.wrapS = THREE.RepeatWrapping;
  groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(36, 36);
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.anisotropy = 8;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900, 48, 48),
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 0.86,
      metalness: 0.02
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  objects.root.add(ground);

  addMidwayPaths(objects);
  addLandingPad(objects);
  addFairgroundGates(objects);
  addFairgroundRides(objects);
  addFairgroundStalls(objects);
  addFairgroundLights(objects);
  addClouds(objects);
}

function createFairgroundTexture() {
  const size = 512;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");

  ctx.fillStyle = "#334b4f";
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y += 32) {
    for (let x = 0; x < size; x += 32) {
      ctx.fillStyle = (x / 32 + y / 32) % 2 === 0 ? "rgba(76, 91, 94, 0.5)" : "rgba(40, 61, 65, 0.55)";
      ctx.fillRect(x, y, 32, 32);
    }
  }

  let seed = 19;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(238, 223, 175, 0.12)" : "rgba(13, 22, 25, 0.15)";
    ctx.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 3);
  }

  return new THREE.CanvasTexture(textureCanvas);
}

function addMidwayPaths(objects) {
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x31373b, roughness: 0.76 });
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffcb66 });

  [
    [0, -12, 22, 216, 0],
    [0, -50, 190, 18, 0],
    [58, 20, 18, 132, 0.34],
    [-62, -74, 18, 118, -0.42]
  ].forEach(([x, z, w, d, yaw]) => {
    const path = new THREE.Mesh(new THREE.PlaneGeometry(w, d), pathMat);
    path.rotation.x = -Math.PI / 2;
    path.rotation.z = yaw;
    path.position.set(x, 0.016, z);
    path.receiveShadow = true;
    objects.root.add(path);
  });

  for (let i = 0; i < 18; i += 1) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 5), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.022, 58 - i * 12);
    objects.root.add(stripe);
  }
}

function addFairgroundGates(objects) {
  const gateData = [
    { x: 0, y: 6.6, z: -30, yaw: 0, color: 0xff5c93 },
    { x: -30, y: 9.8, z: -86, yaw: 18 * DEG, color: 0x58d7ff },
    { x: -66, y: 15.6, z: -118, yaw: 4 * DEG, color: 0xffcb66 },
    { x: 48, y: 8.4, z: -128, yaw: -34 * DEG, color: 0x7df29a },
    { x: 86, y: 11.2, z: -54, yaw: -92 * DEG, color: 0xd7a8ff },
    { x: 34, y: 7.4, z: 42, yaw: 148 * DEG, color: 0xff8f4a }
  ];

  gateData.forEach((gate, index) => {
    const group = new THREE.Group();
    group.position.set(gate.x, gate.y, gate.z);
    group.rotation.y = gate.yaw;
    objects.root.add(group);

    const material = new THREE.MeshStandardMaterial({
      color: gate.color,
      emissive: gate.color,
      emissiveIntensity: 0.68,
      roughness: 0.32,
      metalness: 0.08
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(index === 2 ? 7.4 : 5.4, 0.22, 14, 72), material);
    ring.castShadow = true;
    group.add(ring);
    objects.gateRings.push(ring);

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1b2227, roughness: 0.44 });
    [-5.2, 5.2].forEach((x) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, gate.y * 2, 12), baseMat);
      pole.position.set(x, -gate.y / 2, 0);
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);
    });

    const lamp = new THREE.PointLight(gate.color, 16, 24, 2.2);
    lamp.position.set(0, 0, -1.1);
    group.add(lamp);
    objects.blinkers.push({ light: lamp, phase: index * 0.8, base: 10, range: 13 });
  });
}

function addFairgroundRides(objects) {
  addFerrisWheel(objects);
  addCarousel(objects);
  addCoaster(objects);
  addDropTower(objects);
}

function addFerrisWheel(objects) {
  const group = new THREE.Group();
  group.position.set(-64, 25, -112);
  objects.root.add(group);

  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0xf7f1e1,
    emissive: 0x1c3850,
    emissiveIntensity: 0.08,
    roughness: 0.4,
    metalness: 0.15
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xff5c93,
    emissive: 0xff2f70,
    emissiveIntensity: 0.32,
    roughness: 0.36
  });
  const cabinMats = [0x58d7ff, 0xffcb66, 0x7df29a, 0xd7a8ff].map((color) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.18, roughness: 0.52 })
  );

  const wheel = new THREE.Group();
  group.add(wheel);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(18, 0.35, 18, 128), wheelMat);
  ring.castShadow = true;
  wheel.add(ring);

  for (let i = 0; i < 12; i += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.16, 35.5, 0.16), wheelMat);
    spoke.rotation.z = i * Math.PI / 12;
    spoke.castShadow = true;
    wheel.add(spoke);
  }

  for (let i = 0; i < 12; i += 1) {
    const angle = i * Math.PI * 2 / 12;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.7, 2.2), cabinMats[i % cabinMats.length]);
    cabin.position.set(Math.cos(angle) * 18, Math.sin(angle) * 18, 0);
    cabin.castShadow = true;
    wheel.add(cabin);
  }

  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.5, 20, 14), accentMat);
  hub.castShadow = true;
  wheel.add(hub);

  const supportMat = new THREE.MeshStandardMaterial({ color: 0x30363b, roughness: 0.5, metalness: 0.18 });
  [-1, 1].forEach((side) => {
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 51, 12), supportMat);
    support.position.set(side * 8, -18, 0);
    support.rotation.z = side * 0.36;
    support.castShadow = true;
    support.receiveShadow = true;
    group.add(support);
  });

  const platform = new THREE.Mesh(new THREE.BoxGeometry(30, 1.1, 8), supportMat);
  platform.position.set(0, -25, 0);
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  objects.rides.push({ type: "wheel", node: wheel, speed: 0.16 });
}

function addCarousel(objects) {
  const group = new THREE.Group();
  group.position.set(62, 0.12, -38);
  objects.root.add(group);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x244b5c, roughness: 0.5, metalness: 0.08 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xffcb66, emissive: 0x4b2500, emissiveIntensity: 0.1, roughness: 0.36 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xff5c93, roughness: 0.44 });
  const horseMat = new THREE.MeshStandardMaterial({ color: 0xf7f1e1, roughness: 0.58 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.75, 48), baseMat);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const spinner = new THREE.Group();
  spinner.position.y = 0.65;
  group.add(spinner);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(13.4, 5, 48), roofMat);
  roof.position.y = 8.6;
  roof.castShadow = true;
  spinner.add(roof);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(10.4, 10.4, 0.55, 48), goldMat);
  cap.position.y = 5.8;
  cap.castShadow = true;
  spinner.add(cap);

  for (let i = 0; i < 10; i += 1) {
    const angle = i * Math.PI * 2 / 10;
    const x = Math.cos(angle) * 7.8;
    const z = Math.sin(angle) * 7.8;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.6, 8), goldMat);
    pole.position.set(x, 3.2, z);
    spinner.add(pole);

    const horse = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.75, 0.55), horseMat);
    horse.position.set(x, 1.6 + Math.sin(i) * 0.24, z);
    horse.rotation.y = -angle + Math.PI / 2;
    horse.castShadow = true;
    spinner.add(horse);
  }

  const light = new THREE.PointLight(0xffcb66, 18, 28, 2.1);
  light.position.set(0, 7, 0);
  group.add(light);
  objects.blinkers.push({ light, phase: 0.25, base: 9, range: 14 });
  objects.rides.push({ type: "carousel", node: spinner, speed: 0.58 });
}

function addCoaster(objects) {
  const railMat = new THREE.MeshStandardMaterial({ color: 0x58d7ff, roughness: 0.38, metalness: 0.18 });
  const supportMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.68, metalness: 0.1 });
  const points = [
    new THREE.Vector3(-112, 4, 20),
    new THREE.Vector3(-88, 13, -24),
    new THREE.Vector3(-44, 22, -50),
    new THREE.Vector3(4, 12, -88),
    new THREE.Vector3(46, 26, -124),
    new THREE.Vector3(92, 10, -104),
    new THREE.Vector3(126, 6, -48)
  ];
  const left = points.map((point) => point.clone().add(new THREE.Vector3(-0.7, 0, 0)));
  const right = points.map((point) => point.clone().add(new THREE.Vector3(0.7, 0, 0)));

  [left, right].forEach((railPoints) => {
    const rail = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(railPoints), 120, 0.14, 8, false),
      railMat
    );
    rail.castShadow = true;
    objects.root.add(rail);
  });

  points.forEach((point, index) => {
    const support = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, point.y, 10), supportMat);
    support.position.set(point.x, point.y / 2, point.z);
    support.castShadow = true;
    support.receiveShadow = true;
    objects.root.add(support);

    if (index < points.length - 1) {
      const tie = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.22), supportMat);
      tie.position.copy(point);
      tie.castShadow = true;
      objects.root.add(tie);
    }
  });
}

function addDropTower(objects) {
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xe7eef4, roughness: 0.46, metalness: 0.18 });
  const carMat = new THREE.MeshStandardMaterial({ color: 0xff8f4a, emissive: 0xff5f16, emissiveIntensity: 0.25, roughness: 0.42 });
  const group = new THREE.Group();
  group.position.set(118, 0, 24);
  objects.root.add(group);

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 42, 16), towerMat);
  tower.position.y = 21;
  tower.castShadow = true;
  group.add(tower);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.18, 10, 36), carMat);
  ring.position.y = 17;
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  group.add(ring);

  const beacon = new THREE.PointLight(0xff8f4a, 18, 30, 2);
  beacon.position.set(0, 40, 0);
  group.add(beacon);
  objects.blinkers.push({ light: beacon, phase: 1.5, base: 7, range: 18 });
  objects.rides.push({ type: "tower", node: ring, originY: 17, speed: 1 });
}

function addFairgroundStalls(objects) {
  const stallMat = new THREE.MeshStandardMaterial({ color: 0xf0e6d2, roughness: 0.62 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x172126, roughness: 0.72 });
  const canopyColors = [0xff5c93, 0x58d7ff, 0xffcb66, 0x7df29a, 0xd7a8ff];

  [
    [-42, 42, 0],
    [-24, 45, 0],
    [23, 47, 0],
    [44, 38, 0],
    [-108, -34, 0.5],
    [108, -10, -0.55]
  ].forEach(([x, z, yaw], index) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = yaw;
    objects.root.add(group);

    const body = new THREE.Mesh(new THREE.BoxGeometry(11, 4.8, 7), stallMat);
    body.position.y = 2.4;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(7.2, 3.4, 4),
      new THREE.MeshStandardMaterial({
        color: canopyColors[index % canopyColors.length],
        roughness: 0.42,
        emissive: canopyColors[index % canopyColors.length],
        emissiveIntensity: 0.08
      })
    );
    canopy.position.y = 6.2;
    canopy.rotation.y = Math.PI / 4;
    canopy.castShadow = true;
    group.add(canopy);

    const counter = new THREE.Mesh(new THREE.BoxGeometry(9.8, 1, 1.2), darkMat);
    counter.position.set(0, 2.1, -4.1);
    counter.castShadow = true;
    group.add(counter);
  });

  addTent(objects, -116, -96, 0xff5c93, 0xf7f1e1);
  addTent(objects, 8, -168, 0x58d7ff, 0xffcb66);
  addBalloonCluster(objects, -22, 26, 0);
  addBalloonCluster(objects, 88, 46, 1.2);
}

function addTent(objects, x, z, colorA, colorB) {
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 14, 8, 32),
    new THREE.MeshStandardMaterial({ color: colorB, roughness: 0.62 })
  );
  body.position.set(x, 4, z);
  body.castShadow = true;
  body.receiveShadow = true;
  objects.root.add(body);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(15.5, 10, 32),
    new THREE.MeshStandardMaterial({ color: colorA, emissive: colorA, emissiveIntensity: 0.08, roughness: 0.46 })
  );
  roof.position.set(x, 13, z);
  roof.castShadow = true;
  objects.root.add(roof);
}

function addBalloonCluster(objects, x, z, phase) {
  const colors = [0xff5c93, 0x58d7ff, 0xffcb66, 0x7df29a, 0xd7a8ff];
  colors.forEach((color, index) => {
    const balloon = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 14, 10),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.12, roughness: 0.38 })
    );
    balloon.position.set(x + Math.cos(index) * 1.5, 8.2 + (index % 3) * 0.9, z + Math.sin(index) * 1.5);
    balloon.castShadow = true;
    objects.root.add(balloon);

    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 5.8, 5),
      new THREE.MeshBasicMaterial({ color: 0xd8dee4 })
    );
    string.position.set(balloon.position.x, balloon.position.y - 3.6, balloon.position.z);
    objects.root.add(string);
    objects.rides.push({ type: "balloon", node: balloon, originY: balloon.position.y, phase: phase + index * 0.4 });
  });
}

function addFairgroundLights(objects) {
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x20262a });
  const bulbColors = [0xff5c93, 0xffcb66, 0x58d7ff, 0x7df29a];
  const bulbGeometry = new THREE.SphereGeometry(0.34, 8, 6);
  for (let row = 0; row < 4; row += 1) {
    const z = 60 - row * 46;
    const cable = new THREE.Mesh(new THREE.BoxGeometry(170, 0.05, 0.05), cableMat);
    cable.position.set(0, 10 + row * 0.5, z);
    objects.root.add(cable);

    for (let i = 0; i < 17; i += 1) {
      const color = bulbColors[(i + row) % bulbColors.length];
      const bulbMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8
      });
      const bulb = new THREE.Mesh(bulbGeometry, bulbMat);
      bulb.position.set(-80 + i * 10, 9.6 + row * 0.5, z);
      objects.root.add(bulb);
      objects.blinkers.push({ material: bulbMat, phase: row * 0.7 + i * 0.18, base: 0.4, range: 0.58 });
    }
  }
}

function createGroundTexture() {
  const size = 512;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");

  ctx.fillStyle = "#365d41";
  ctx.fillRect(0, 0, size, size);

  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 3200; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const w = 1 + rand() * 5;
    const h = 1 + rand() * 5;
    const alpha = 0.05 + rand() * 0.12;
    ctx.fillStyle = rand() > 0.55 ? `rgba(126, 171, 99, ${alpha})` : `rgba(19, 55, 42, ${alpha})`;
    ctx.fillRect(x, y, w, h);
  }

  ctx.strokeStyle = "rgba(202, 216, 145, 0.13)";
  ctx.lineWidth = 2;
  for (let y = 28; y < size; y += 58) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(120, y + 18, 310, y - 20, size, y + 8);
    ctx.stroke();
  }

  return new THREE.CanvasTexture(textureCanvas);
}

function addRunway(objects) {
  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 175),
    new THREE.MeshStandardMaterial({ color: 0x2a3035, roughness: 0.74 })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0.012, -18);
  runway.receiveShadow = true;
  objects.root.add(runway);

  const stripeMat = new THREE.MeshBasicMaterial({ color: 0xe8f1f3 });
  for (let i = 0; i < 12; i += 1) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 6), stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.018, 50 - i * 14);
    objects.root.add(stripe);
  }
}

function addLandingPad(objects) {
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 0.08, 64),
    new THREE.MeshStandardMaterial({ color: 0x1b2429, roughness: 0.62, metalness: 0.04 })
  );
  pad.position.set(0, 0.04, 42);
  pad.receiveShadow = true;
  objects.root.add(pad);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(6.6, 0.08, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x58d7ff })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.12, 42);
  objects.root.add(ring);
}

function addGates(objects) {
  const gateData = [
    { x: 0, y: 6.4, z: -38, yaw: 0, color: 0xff9b44 },
    { x: 36, y: 8.4, z: -92, yaw: -22 * DEG, color: 0x58d7ff },
    { x: -42, y: 7.8, z: -146, yaw: 27 * DEG, color: 0x7df29a },
    { x: -92, y: 10.2, z: -76, yaw: 78 * DEG, color: 0xff6f61 },
    { x: 76, y: 9.2, z: 4, yaw: -78 * DEG, color: 0xd7a8ff },
    { x: 6, y: 6.8, z: 86, yaw: 178 * DEG, color: 0xffcb66 }
  ];

  gateData.forEach((gate, index) => {
    const group = new THREE.Group();
    group.position.set(gate.x, gate.y, gate.z);
    group.rotation.y = gate.yaw;
    objects.root.add(group);

    const material = new THREE.MeshStandardMaterial({
      color: gate.color,
      emissive: gate.color,
      emissiveIntensity: 0.44,
      roughness: 0.38,
      metalness: 0.08
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.35, 0.2, 14, 72), material);
    ring.castShadow = true;
    group.add(ring);
    objects.gateRings.push(ring);

    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xe7eef4, roughness: 0.48 });
    [-5.15, 5.15].forEach((x) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, gate.y * 2, 12), poleMaterial);
      pole.position.set(x, -gate.y / 2, 0);
      pole.castShadow = true;
      pole.receiveShadow = true;
      group.add(pole);
    });

    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.08, 1.1),
      new THREE.MeshBasicMaterial({ color: gate.color })
    );
    marker.position.set(0, -gate.y + 0.08, 0);
    marker.rotation.x = -Math.PI / 2;
    group.add(marker);

    if (index === 0) {
      const starter = new THREE.PointLight(gate.color, 35, 28, 2.3);
      starter.position.set(0, 0, -1.2);
      group.add(starter);
    }
  });
}

function addCourseMarkers(objects) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffefe0,
    roughness: 0.5,
    emissive: 0x24170d,
    emissiveIntensity: 0.08
  });

  for (let i = 0; i < 42; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    const z = 64 - i * 5.2;
    const x = side * (12 + (i % 5) * 3.8);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.3, 12), material);
    cone.position.set(x, 0.66, z);
    cone.castShadow = true;
    cone.receiveShadow = true;
    objects.root.add(cone);
  }
}

function addBuildings(objects) {
  const wall = new THREE.MeshStandardMaterial({ color: 0x73828a, roughness: 0.78, metalness: 0.06 });
  const roof = new THREE.MeshStandardMaterial({ color: 0xb8553c, roughness: 0.62 });

  [
    [-56, -18, 18, 8, 24],
    [-78, 36, 14, 6, 18],
    [66, -54, 22, 10, 28],
    [112, 22, 16, 18, 16]
  ].forEach(([x, z, w, h, d]) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
    base.position.set(x, h / 2, z);
    base.castShadow = true;
    base.receiveShadow = true;
    objects.root.add(base);

    const roofMesh = new THREE.Mesh(new THREE.BoxGeometry(w + 1.4, 1.2, d + 1.4), roof);
    roofMesh.position.set(x, h + 0.8, z);
    roofMesh.castShadow = true;
    objects.root.add(roofMesh);
  });

  const towerMat = new THREE.MeshStandardMaterial({ color: 0xd7e1e7, roughness: 0.5, metalness: 0.12 });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 28, 18), towerMat);
  tower.position.set(28, 14, -122);
  tower.castShadow = true;
  tower.receiveShadow = true;
  objects.root.add(tower);

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 18, 12),
    new THREE.MeshStandardMaterial({ color: 0xff6f61, emissive: 0xff2f22, emissiveIntensity: 1.1 })
  );
  beacon.position.set(28, 29.2, -122);
  objects.root.add(beacon);
}

function addTrees(objects) {
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4d37, roughness: 0.9 });
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x244f38, roughness: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0x356b42, roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ color: 0x4d7b43, roughness: 0.86 })
  ];

  let seed = 9;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < 130; i += 1) {
    const radius = 80 + rand() * 320;
    const angle = rand() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) < 120 && z < 112 && z > -180) continue;

    const height = 4.8 + rand() * 5.8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.42, height * 0.54, 8), trunkMat);
    trunk.position.set(x, height * 0.27, z);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    objects.root.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.6 + rand() * 1.7, height, 10),
      leafMats[i % leafMats.length]
    );
    leaves.position.set(x, height * 0.78, z);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    objects.root.add(leaves);
  }
}

function addClouds(objects) {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.44,
    depthWrite: false
  });

  for (let i = 0; i < 16; i += 1) {
    const cloud = new THREE.Group();
    const x = -280 + (i % 8) * 82;
    const z = -280 + Math.floor(i / 8) * 250;
    cloud.position.set(x, 84 + (i % 4) * 8, z);
    cloud.userData.speed = 0.55 + (i % 5) * 0.08;

    for (let j = 0; j < 5; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(7 + j * 0.6, 12, 8), material);
      puff.scale.set(1.6, 0.35, 0.7);
      puff.position.set((j - 2) * 7, Math.sin(j) * 2, Math.cos(j) * 3);
      cloud.add(puff);
    }
    objects.root.add(cloud);
    objects.clouds.push(cloud);
  }
}

function animateWorld(now) {
  const t = now * 0.001;
  world.gateRings.forEach((ring, index) => {
    ring.rotation.z = Math.sin(t * 1.6 + index) * 0.018;
    ring.material.emissiveIntensity = 0.34 + Math.sin(t * 2.4 + index * 0.9) * 0.1;
  });

  world.rides.forEach((ride) => {
    if (ride.type === "wheel") {
      ride.node.rotation.z += ride.speed * 0.006;
    } else if (ride.type === "carousel") {
      ride.node.rotation.y += ride.speed * 0.018;
    } else if (ride.type === "tower") {
      ride.node.position.y = ride.originY + Math.sin(t * 1.25) * 8.5;
      ride.node.rotation.z += 0.012;
    } else if (ride.type === "balloon") {
      ride.node.position.y = ride.originY + Math.sin(t * 1.8 + ride.phase) * 0.42;
    }
  });

  world.blinkers.forEach((blinker) => {
    const value = blinker.base + (Math.sin(t * 3.2 + blinker.phase) * 0.5 + 0.5) * blinker.range;
    if (blinker.light) {
      blinker.light.intensity = value;
    } else if (blinker.material) {
      blinker.material.opacity = value;
    }
  });

  world.clouds.forEach((cloud) => {
    cloud.position.x += cloud.userData.speed * 0.012;
    if (cloud.position.x > 360) {
      cloud.position.x = -360;
    }
  });
}

class ControlMixer {
  constructor(target) {
    this.target = target;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dragging: false };
    this.radio = null;
    this.inputDeviceId = readInputDevice();
    this.keyboardMouse = {
      mapping: readKeyboardMouseMapping()
    };
    this.gamepad = {
      index: null,
      name: "",
      mapping: readGamepadMapping(),
      lastSeen: 0,
      actionStates: {
        arm: null,
        level: null,
        reset: false
      }
    };
    this.lastSource = "KEYS";

    window.addEventListener("keydown", (event) => this.onKey(event, true));
    window.addEventListener("keyup", (event) => this.onKey(event, false));
    window.addEventListener("gamepadconnected", (event) => this.onGamepadConnected(event.gamepad));
    window.addEventListener("gamepaddisconnected", (event) => this.onGamepadDisconnected(event.gamepad));
    document.addEventListener("pointerlockchange", () => {
      this.mouse.x = 0;
      this.mouse.y = 0;
    });
    target.addEventListener("mousedown", () => {
      this.mouse.dragging = true;
    });
    window.addEventListener("mouseup", () => {
      this.mouse.dragging = false;
    });
    window.addEventListener("mousemove", (event) => this.onMouseMove(event));
    target.addEventListener("touchstart", (event) => event.preventDefault(), { passive: false });
    target.addEventListener("touchmove", (event) => this.onTouchMove(event), { passive: false });
  }

  onKey(event, down) {
    const binding = this.keyboardMouse.mapping.keys[event.code];
    if (binding || DEFAULT_KEYBOARD_MOUSE_MAPPING.keys[event.code]) {
      event.preventDefault();
    }

    if (down) {
      this.keys.add(event.code);
      if (!event.repeat) {
        this.applyKeyboardPressAction(binding);
      }
    } else {
      this.keys.delete(event.code);
    }
  }

  applyKeyboardPressAction(binding) {
    if (!binding) return;
    if (binding.action === "arm") {
      flight.armed = !flight.armed;
      updateButtons();
    } else if (binding.action === "reset") {
      resetFlight();
    } else if (binding.action === "level") {
      levelMode = !levelMode;
      updateButtons();
    }
  }

  onMouseMove(event) {
    const active = document.pointerLockElement === this.target || this.mouse.dragging;
    if (!active) return;
    const settings = this.keyboardMouse.mapping.settings;
    const sensitivity = document.pointerLockElement === this.target
      ? settings.pointerSensitivity
      : settings.dragSensitivity;
    this.mouse.x = THREE.MathUtils.clamp(this.mouse.x + event.movementX * sensitivity, -1, 1);
    this.mouse.y = THREE.MathUtils.clamp(this.mouse.y + event.movementY * sensitivity, -1, 1);
  }

  onTouchMove(event) {
    if (!event.touches.length) return;
    event.preventDefault();
    const touch = event.touches[0];
    const rect = this.target.getBoundingClientRect();
    const nx = (touch.clientX - rect.left) / rect.width;
    const ny = (touch.clientY - rect.top) / rect.height;
    this.mouse.x = THREE.MathUtils.clamp((nx - 0.5) * 2, -1, 1);
    this.mouse.y = THREE.MathUtils.clamp((ny - 0.5) * 2, -1, 1);
  }

  sample(dt) {
    const radioFresh = this.radio && performance.now() - this.radio.time < 350;

    if (radioFresh) {
      this.lastSource = "RADIO";
      return {
        roll: this.radio.roll,
        pitch: this.radio.pitch,
        yaw: this.radio.yaw,
        throttle: 0,
        throttleTarget: this.radio.throttleTarget,
        brake: Boolean(this.radio.brake)
      };
    }

    if (!this.isKeyboardMouseInputSelected()) {
      const gamepadInput = this.sampleGamepad();
      if (gamepadInput) {
        this.lastSource = gamepadInput.source;
        return {
          roll: gamepadInput.roll,
          pitch: gamepadInput.pitch,
          yaw: gamepadInput.yaw,
          throttle: 0,
          throttleTarget: gamepadInput.throttleTarget,
          brake: gamepadInput.brake
        };
      }
    }

    return this.sampleKeyboardMouse(dt);
  }

  sampleKeyboardMouse(dt) {
    const settings = this.keyboardMouse.mapping.settings;
    const decay = Math.exp(-dt * (document.pointerLockElement === this.target ? settings.pointerDecay : settings.dragDecay));
    this.mouse.x *= decay;
    this.mouse.y *= decay;

    const keyboardInput = readMappedKeyboardInput(this.keys, this.keyboardMouse.mapping);
    const mouseInput = readMappedMouseInput(this.mouse, this.keyboardMouse.mapping);
    const mouseActive = Math.abs(this.mouse.x) + Math.abs(this.mouse.y) > 0.03;
    this.lastSource = mouseActive ? "MOUSE" : "KEYS";

    return {
      roll: THREE.MathUtils.clamp(keyboardInput.roll + mouseInput.roll, -1, 1),
      pitch: THREE.MathUtils.clamp(keyboardInput.pitch + mouseInput.pitch, -1, 1),
      yaw: THREE.MathUtils.clamp(keyboardInput.yaw + mouseInput.yaw, -1, 1),
      throttle: THREE.MathUtils.clamp(keyboardInput.throttle, -1, 1),
      throttleTarget: mouseInput.hasThrottle ? mouseInput.throttle : undefined,
      brake: keyboardInput.brake && flight.armed
    };
  }

  setRadioFrame(frame) {
    if (!frame || typeof frame !== "object") return;
    this.radio = {
      roll: normalizeCenteredChannel(frame.roll),
      pitch: normalizeCenteredChannel(frame.pitch),
      yaw: normalizeCenteredChannel(frame.yaw),
      throttleTarget: normalizeThrottleChannel(frame.throttle),
      brake: Boolean(frame.brake),
      time: performance.now()
    };
  }

  onGamepadConnected(gamepad) {
    if (!isUsableRadioGamepad(gamepad)) return;
    if (!this.isKeyboardMouseInputSelected()) {
      this.gamepad.index = gamepad.index;
      this.gamepad.name = gamepad.id || "Gamepad";
      this.gamepad.lastSeen = performance.now();
    }
  }

  onGamepadDisconnected(gamepad) {
    if (this.gamepad.index === gamepad.index) {
      this.gamepad.index = null;
      this.gamepad.name = "";
    }
  }

  sampleGamepad() {
    const gamepad = this.findGamepad();
    if (!gamepad) return null;

    this.gamepad.index = gamepad.index;
    this.gamepad.name = gamepad.id || "Gamepad";
    this.gamepad.lastSeen = performance.now();
    const actions = readMappedGamepadInput(gamepad, this.gamepad.mapping);
    if (!actions.hasMapping) return null;
    this.applyGamepadSwitchActions(actions);

    return {
      roll: actions.roll,
      pitch: actions.pitch,
      yaw: actions.yaw,
      throttleTarget: actions.hasThrottle ? actions.throttle : undefined,
      brake: actions.brake,
      source: getGamepadSourceLabel(gamepad)
    };
  }

  applyGamepadSwitchActions(actions) {
    if (actions.arm !== null && actions.arm !== this.gamepad.actionStates.arm) {
      flight.armed = actions.arm;
      this.gamepad.actionStates.arm = actions.arm;
      updateButtons();
    }

    if (actions.level !== null && actions.level !== this.gamepad.actionStates.level) {
      levelMode = actions.level;
      this.gamepad.actionStates.level = actions.level;
      updateButtons();
    }

    if (actions.reset && !this.gamepad.actionStates.reset) {
      resetFlight();
      this.gamepad.actionStates.reset = true;
    } else if (!actions.reset) {
      this.gamepad.actionStates.reset = false;
    }
  }

  findGamepad() {
    if (this.isKeyboardMouseInputSelected()) return null;
    const gamepads = getConnectedGamepads();
    if (!gamepads.length) return null;

    const selectedIndex = parseGamepadDeviceId(this.inputDeviceId);
    if (selectedIndex !== null) {
      return gamepads.find((gamepad) => gamepad.index === selectedIndex && isMappableGamepad(gamepad)) || null;
    }

    if (Number.isInteger(this.gamepad.index)) {
      const previous = gamepads.find((gamepad) => gamepad.index === this.gamepad.index);
      if (previous && isMappableGamepad(previous)) return previous;
    }

    return gamepads.find(isPreferredRadioGamepad) || gamepads.find(isUsableRadioGamepad) || gamepads.find(isMappableGamepad) || null;
  }

  setInputDevice(deviceId) {
    if (deviceId === KEYBOARD_MOUSE_DEVICE_ID) {
      this.inputDeviceId = KEYBOARD_MOUSE_DEVICE_ID;
      localStorage.setItem(INPUT_DEVICE_STORAGE_KEY, this.inputDeviceId);
      return true;
    }

    const gamepadIndex = parseGamepadDeviceId(deviceId);
    if (gamepadIndex === null) return false;
    return this.setGamepadIndex(gamepadIndex);
  }

  isKeyboardMouseInputSelected() {
    return this.inputDeviceId === KEYBOARD_MOUSE_DEVICE_ID;
  }

  getInputDevices() {
    const gamepads = this.getGamepads();
    const activeGamepad = gamepads.find((gamepad) => gamepad.active) || null;
    const keyboardActive = this.isKeyboardMouseInputSelected() || !activeGamepad;
    return [
      {
        id: KEYBOARD_MOUSE_DEVICE_ID,
        kind: "keyboard",
        label: "KEYBOARD + MOUSE",
        active: keyboardActive
      },
      ...gamepads.map((gamepad) => ({
        id: getGamepadDeviceId(gamepad.index),
        kind: "gamepad",
        label: `${gamepad.source} ${gamepad.index} ${shortenInputName(gamepad.id)}`,
        active: !keyboardActive && gamepad.index === activeGamepad.index
      }))
    ];
  }

  getActiveInputDevice() {
    if (this.isKeyboardMouseInputSelected()) {
      return { id: KEYBOARD_MOUSE_DEVICE_ID, kind: "keyboard" };
    }

    const gamepads = this.getGamepads();
    const active = gamepads.find((gamepad) => gamepad.active) || gamepads[0] || null;
    if (!active) {
      return { id: KEYBOARD_MOUSE_DEVICE_ID, kind: "keyboard" };
    }

    return { id: getGamepadDeviceId(active.index), kind: "gamepad", gamepad: active };
  }

  setGamepadMapping(mapping) {
    this.gamepad.mapping = sanitizeGamepadMapping(mapping);
    localStorage.setItem(GAMEPAD_STORAGE_KEY, JSON.stringify(this.gamepad.mapping));
    return this.getGamepadMapping();
  }

  getGamepadMapping() {
    return cloneGamepadMapping(this.gamepad.mapping);
  }

  resetGamepadMapping() {
    this.gamepad.mapping = cloneGamepadMapping(DEFAULT_GAMEPAD_MAPPING);
    localStorage.setItem(GAMEPAD_STORAGE_KEY, JSON.stringify(this.gamepad.mapping));
    return this.getGamepadMapping();
  }

  setGamepadIndex(index) {
    const selected = getConnectedGamepads().find((gamepad) => gamepad.index === index);
    if (!selected) return false;
    this.inputDeviceId = getGamepadDeviceId(selected.index);
    localStorage.setItem(INPUT_DEVICE_STORAGE_KEY, this.inputDeviceId);
    this.gamepad.index = selected.index;
    this.gamepad.name = selected.id || "Gamepad";
    this.gamepad.lastSeen = performance.now();
    return true;
  }

  setGamepadInputBinding(type, index, action, invert = false) {
    this.gamepad.mapping = setGamepadBinding(this.gamepad.mapping, type, index, action, invert);
    localStorage.setItem(GAMEPAD_STORAGE_KEY, JSON.stringify(this.gamepad.mapping));
    return this.getGamepadMapping();
  }

  setKeyboardMouseMapping(mapping) {
    this.keyboardMouse.mapping = sanitizeKeyboardMouseMapping(mapping);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  getKeyboardMouseMapping() {
    return cloneKeyboardMouseMapping(this.keyboardMouse.mapping);
  }

  resetKeyboardMouseMapping() {
    this.keyboardMouse.mapping = cloneKeyboardMouseMapping(DEFAULT_KEYBOARD_MOUSE_MAPPING);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  setKeyboardKeyBinding(code, actionValue) {
    this.keyboardMouse.mapping = setKeyboardKeyBinding(this.keyboardMouse.mapping, code, actionValue);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  moveKeyboardKeyBinding(previousCode, nextCode) {
    this.keyboardMouse.mapping = moveKeyboardKeyBinding(this.keyboardMouse.mapping, previousCode, nextCode);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  setMouseAxisBinding(axis, action, invert = false) {
    this.keyboardMouse.mapping = setMouseAxisBinding(this.keyboardMouse.mapping, axis, action, invert);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  setKeyboardMouseSetting(key, value) {
    this.keyboardMouse.mapping = setKeyboardMouseSetting(this.keyboardMouse.mapping, key, value);
    localStorage.setItem(KEYBOARD_MOUSE_STORAGE_KEY, JSON.stringify(this.keyboardMouse.mapping));
    return this.getKeyboardMouseMapping();
  }

  getMouseAxisValue(axis) {
    return Number((axis === "y" ? this.mouse.y : this.mouse.x).toFixed(3));
  }

  getKeyValue(code) {
    return this.keys.has(code) ? 1 : 0;
  }

  getKeyboardMouseState() {
    return {
      mouse: {
        x: this.getMouseAxisValue("x"),
        y: this.getMouseAxisValue("y")
      },
      keys: Object.fromEntries(
        Object.keys(this.keyboardMouse.mapping.keys).map((code) => [code, this.getKeyValue(code)])
      )
    };
  }

  getGamepads() {
    const connected = getConnectedGamepads();
    const activeIndex = this.getActiveGamepadIndex(connected);
    return connected.map((gamepad) => ({
      index: gamepad.index,
      id: gamepad.id,
      browserMapping: gamepad.mapping || "",
      source: getGamepadSourceLabel(gamepad),
      active: gamepad.index === activeIndex,
      axes: gamepad.axes.map((value) => Number(value.toFixed(3))),
      buttons: gamepad.buttons.map((button) => Number(button.value.toFixed(3))),
      mapping: this.getGamepadMapping(),
      mapped: previewGamepadMapping(gamepad, this.gamepad.mapping)
    }));
  }

  getActiveGamepadIndex(gamepads = getConnectedGamepads()) {
    if (this.isKeyboardMouseInputSelected()) return null;
    const selectedIndex = parseGamepadDeviceId(this.inputDeviceId);
    if (selectedIndex !== null) return selectedIndex;

    if (Number.isInteger(this.gamepad.index)) {
      const selected = gamepads.find((gamepad) => gamepad.index === this.gamepad.index);
      if (selected) return selected.index;
    }

    const preferred = gamepads.find(isPreferredRadioGamepad) || gamepads.find(isUsableRadioGamepad) || gamepads.find(isMappableGamepad);
    return preferred?.index ?? null;
  }

  resetTransientAxes() {
    this.keys.clear();
    this.mouse.x = 0;
    this.mouse.y = 0;
    this.radio = null;
    this.lastSource = "KEYS";
  }
}

class MultiplayerClient {
  constructor(targetScene) {
    this.scene = targetScene;
    this.id = getClientId();
    this.name = getPilotName(this.id);
    this.color = colorForId(this.id);
    this.enabled = false;
    this.connected = false;
    this.lastSend = 0;
    this.pendingSend = false;
    this.remoteCount = 0;
    this.peers = new Map();
    this.events = null;
    this.shareUrl = "";
    this.serverMap = currentMapId;
    this.copyTimer = null;

    this.setShareUrl("");
    this.discover();
    window.addEventListener("beforeunload", () => this.leave());
  }

  async discover() {
    try {
      const response = await fetch("/fpv-meta", { cache: "no-store" });
      if (!response.ok) return;
      const meta = await response.json();
      this.setShareUrl(selectShareUrl(meta));
      if (MAPS[meta.map]) {
        this.serverMap = meta.map;
        setMap(meta.map, { broadcast: false });
      }
      if (!meta.multiplayer) return;
      this.enabled = true;
      this.connect();
    } catch {
      this.enabled = false;
      this.connected = false;
      this.setShareUrl("");
    }
  }

  connect() {
    if (!window.EventSource) return;
    const params = new URLSearchParams({
      id: this.id,
      name: this.name,
      color: this.color
    });
    this.events = new EventSource(`/fpv-events?${params.toString()}`);
    this.events.onopen = () => {
      this.connected = true;
    };
    this.events.onerror = () => {
      this.connected = false;
    };
    this.events.addEventListener("state", (event) => {
      try {
        this.receiveState(JSON.parse(event.data));
      } catch {
        // Ignore malformed peer frames from old or interrupted clients.
      }
    });
    this.events.addEventListener("peers", (event) => {
      try {
        this.receivePeerList(JSON.parse(event.data));
      } catch {
        // Ignore malformed peer lists and keep existing avatars until stale.
      }
    });
    this.events.addEventListener("map", (event) => {
      try {
        this.receiveMap(JSON.parse(event.data));
      } catch {
        // Ignore malformed map events and keep the current local scene.
      }
    });
  }

  update(localFlight, now, dt) {
    if (this.enabled && this.connected && now - this.lastSend > MULTIPLAYER_SEND_INTERVAL_MS) {
      this.sendState(localFlight, now);
    }
    this.updateAvatars(now, dt);
  }

  sendState(localFlight, now) {
    if (this.pendingSend) return;
    this.lastSend = now;
    this.pendingSend = true;
    const payload = {
      id: this.id,
      name: this.name,
      color: this.color,
      armed: localFlight.armed,
      throttle: localFlight.throttle,
      position: localFlight.position.toArray(),
      velocity: localFlight.velocity.toArray(),
      quaternion: localFlight.quaternion.toArray()
    };

    fetch("/fpv-state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: false
    }).catch(() => {
      this.connected = false;
    }).finally(() => {
      this.pendingSend = false;
    });
  }

  receiveState(frame) {
    if (!isPeerFrame(frame) || frame.id === this.id) return;

    let peer = this.peers.get(frame.id);
    if (!peer) {
      const mesh = createRemoteDrone(frame.color);
      this.scene.add(mesh);
      peer = {
        id: frame.id,
        name: frame.name,
        color: frame.color,
        mesh,
        targetPosition: new THREE.Vector3(),
        targetQuaternion: new THREE.Quaternion(),
        velocity: new THREE.Vector3(),
        throttle: 0,
        armed: true,
        lastSeen: performance.now()
      };
      this.peers.set(frame.id, peer);
    }

    peer.name = frame.name;
    peer.color = frame.color;
    peer.armed = Boolean(frame.armed);
    peer.throttle = clamp01(frame.throttle);
    peer.targetPosition.fromArray(frame.position);
    peer.targetQuaternion.fromArray(frame.quaternion).normalize();
    peer.velocity.fromArray(frame.velocity);
    peer.lastSeen = performance.now();

    if (!peer.mesh.visible) {
      peer.mesh.visible = true;
      peer.mesh.position.copy(peer.targetPosition);
      peer.mesh.quaternion.copy(peer.targetQuaternion);
    }
    this.remoteCount = this.countFreshPeers(performance.now());
  }

  receivePeerList(list) {
    if (!Array.isArray(list)) return;
    const activeIds = new Set();
    list.forEach((peer) => {
      if (peer && peer.id !== this.id) {
        activeIds.add(String(peer.id));
      }
    });
    for (const id of this.peers.keys()) {
      if (!activeIds.has(id)) {
        this.removePeer(id);
      }
    }
    this.remoteCount = activeIds.size;
  }

  updateAvatars(now, dt) {
    const smoothing = 1 - Math.exp(-dt * 14);
    for (const [id, peer] of this.peers) {
      if (now - peer.lastSeen > 5200) {
        this.removePeer(id);
        continue;
      }

      peer.mesh.position.lerp(peer.targetPosition, smoothing);
      peer.mesh.quaternion.slerp(peer.targetQuaternion, smoothing);
      peer.mesh.scale.setScalar(peer.armed ? 1 : 0.82);
      peer.mesh.userData.light.intensity = peer.armed ? 1.4 + peer.throttle * 5.2 : 0.3;
      peer.mesh.userData.props.forEach((prop, index) => {
        prop.rotation.y += (peer.armed ? 0.55 + peer.throttle * 2.8 : 0.05) * (index % 2 ? -1 : 1);
      });
    }
    this.remoteCount = this.countFreshPeers(now);
  }

  countFreshPeers(now) {
    let count = 0;
    for (const peer of this.peers.values()) {
      if (now - peer.lastSeen <= 5200) count += 1;
    }
    return count;
  }

  removePeer(id) {
    const peer = this.peers.get(id);
    if (!peer) return;
    this.scene.remove(peer.mesh);
    disposeObject3D(peer.mesh);
    this.peers.delete(id);
  }

  requestMap(mapId) {
    if (!this.enabled || !MAPS[mapId]) return;
    fetch("/fpv-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: this.id, map: mapId })
    })
      .then((response) => response.ok ? response.json() : null)
      .then((state) => {
        if (state) this.receiveMap(state);
      })
      .catch(() => {
        this.connected = false;
      });
  }

  receiveMap(state) {
    if (!state || !MAPS[state.map]) return;
    this.serverMap = state.map;
    setMap(state.map, { broadcast: false });
  }

  leave() {
    if (!this.enabled) return;
    const body = JSON.stringify({ id: this.id });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/fpv-leave", new Blob([body], { type: "application/json" }));
    }
  }

  setShareUrl(url) {
    this.shareUrl = url;
    shareUrlInput.value = url || "LAN link unavailable";
    shareCopyButton.disabled = !url;
  }

  async copyShareUrl() {
    if (!this.shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.shareUrl);
      } else {
        shareUrlInput.select();
        document.execCommand("copy");
      }
      this.setCopyButtonLabel("COPIED");
    } catch {
      shareUrlInput.select();
      this.setCopyButtonLabel("SELECT");
    }
  }

  setCopyButtonLabel(label) {
    shareCopyButton.textContent = label;
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => {
      shareCopyButton.textContent = "COPY";
    }, 1200);
  }

  getLabel() {
    if (!this.enabled) return "SOLO";
    if (!this.connected) return "SYNC";
    return `LAN ${this.remoteCount + 1}`;
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      enabled: this.enabled,
      connected: this.connected,
      peers: this.remoteCount,
      serverMap: this.serverMap,
      label: this.getLabel(),
      shareUrl: this.shareUrl
    };
  }

  getPeers() {
    return [...this.peers.values()].map((peer) => ({
      id: peer.id,
      name: peer.name,
      color: peer.color,
      position: peer.mesh.position.toArray(),
      ageMs: Math.round(performance.now() - peer.lastSeen)
    }));
  }
}

function createRemoteDrone(color) {
  const parsedColor = Number.parseInt(color, 16);
  const accent = Number.isFinite(parsedColor) ? parsedColor : 0x58d7ff;
  const group = new THREE.Group();
  group.visible = false;

  const bodyMat = new THREE.MeshStandardMaterial({
    color: accent,
    emissive: accent,
    emissiveIntensity: 0.2,
    roughness: 0.42,
    metalness: 0.18
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x171d20,
    roughness: 0.54,
    metalness: 0.28
  });
  const propMat = new THREE.MeshStandardMaterial({
    color: 0xf3fbff,
    transparent: true,
    opacity: 0.72,
    roughness: 0.25,
    metalness: 0.08
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.82), bodyMat);
  body.castShadow = true;
  group.add(body);

  const cameraBump = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.18), darkMat);
  cameraBump.position.set(0, 0.02, -0.48);
  cameraBump.castShadow = true;
  group.add(cameraBump);

  const armX = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.75, 8), darkMat);
  armX.rotation.z = Math.PI / 2;
  armX.castShadow = true;
  group.add(armX);

  const armZ = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.75, 8), darkMat);
  armZ.rotation.x = Math.PI / 2;
  armZ.castShadow = true;
  group.add(armZ);

  const propGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.025, 24);
  const propPositions = [
    [-0.72, 0.08, -0.72],
    [0.72, 0.08, -0.72],
    [-0.72, 0.08, 0.72],
    [0.72, 0.08, 0.72]
  ];
  const props = propPositions.map(([x, y, z]) => {
    const prop = new THREE.Mesh(propGeometry, propMat);
    prop.position.set(x, y, z);
    prop.castShadow = true;
    group.add(prop);
    return prop;
  });

  const light = new THREE.PointLight(accent, 1.8, 10, 2);
  light.position.set(0, 0.12, -0.54);
  group.add(light);
  group.userData.light = light;
  group.userData.props = props;

  return group;
}

function disposeObject3D(root) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry?.dispose();
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => material.dispose());
    } else {
      child.material?.dispose();
    }
  });
}

function isPeerFrame(frame) {
  return frame &&
    typeof frame.id === "string" &&
    frame.id.length > 0 &&
    frame.id.length < 80 &&
    typeof frame.name === "string" &&
    typeof frame.color === "string" &&
    /^[0-9a-f]{6}$/i.test(frame.color) &&
    Array.isArray(frame.position) &&
    frame.position.length === 3 &&
    frame.position.every(Number.isFinite) &&
    Array.isArray(frame.velocity) &&
    frame.velocity.length === 3 &&
    frame.velocity.every(Number.isFinite) &&
    Array.isArray(frame.quaternion) &&
    frame.quaternion.length === 4 &&
    frame.quaternion.every(Number.isFinite) &&
    Number.isFinite(frame.throttle);
}

function selectShareUrl(meta) {
  const currentUrl = normalizeShareUrl(window.location.href);
  if (!isLocalHostname(window.location.hostname)) {
    return currentUrl;
  }

  const lanUrls = Array.isArray(meta?.lanUrls) ? meta.lanUrls : [];
  for (const url of lanUrls) {
    const normalized = normalizeShareUrl(url);
    if (normalized) return normalized;
  }

  return "";
}

function normalizeShareUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value, window.location.href);
    url.pathname = "/fpv/";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function isLocalHostname(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function getClientId() {
  const key = "fpv-client-id";
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID ? crypto.randomUUID() : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, id);
  return id;
}

function getPilotName(id) {
  const key = "fpv-pilot-name";
  const existing = localStorage.getItem(key);
  if (existing) return existing.slice(0, 32);
  const name = `Pilot ${id.slice(0, 4).toUpperCase()}`;
  localStorage.setItem(key, name);
  return name;
}

function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  const color = new THREE.Color().setHSL(hue / 360, 0.74, 0.58);
  return color.getHexString();
}

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return THREE.MathUtils.clamp(value, 0, 1);
}

function getConnectedGamepads() {
  if (!navigator.getGamepads) return [];
  return Array.from(navigator.getGamepads()).filter(Boolean);
}

function isPreferredRadioGamepad(gamepad) {
  const id = String(gamepad?.id || "").toLowerCase();
  return /expresslrs|elrs|radiomaster|edgetx|opentx|tx16|zorro|pocket|hdzero/.test(id);
}

function isMappableGamepad(gamepad) {
  return Boolean(gamepad?.connected && Array.isArray(gamepad.axes) && gamepad.axes.length > 0);
}

function isUsableRadioGamepad(gamepad) {
  if (!isMappableGamepad(gamepad)) return false;
  if (isPreferredRadioGamepad(gamepad)) return true;

  const id = String(gamepad.id || "").toLowerCase();
  const looksLikeRadio = /joystick|hid|crsf|transmitter|controller/.test(id);
  const looksLikeConsolePad = /xbox|dualshock|dualsense|playstation|nintendo|switch|joy-con|8bitdo/.test(id);
  return looksLikeRadio && !looksLikeConsolePad;
}

function getGamepadSourceLabel(gamepad) {
  return isPreferredRadioGamepad(gamepad) ? "ELRS" : "PAD";
}

function normalizeGamepadCenteredAxis(value, invert = false) {
  const signed = (invert ? -value : value);
  const clamped = THREE.MathUtils.clamp(signed, -1, 1);
  const magnitude = Math.abs(clamped);
  if (magnitude <= GAMEPAD_DEADZONE) return 0;
  return Math.sign(clamped) * ((magnitude - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
}

function normalizeGamepadThrottleAxis(value, invert = false) {
  const signed = THREE.MathUtils.clamp(invert ? -value : value, -1, 1);
  return THREE.MathUtils.clamp((signed + 1) / 2, 0, 1);
}

function normalizeGamepadSwitchAxis(value, invert = false) {
  return normalizeGamepadCenteredAxis(value, invert) > 0.5;
}

function isMappedButtonPressed(gamepad, buttonIndex) {
  if (!Number.isInteger(buttonIndex) || buttonIndex < 0) return false;
  const button = gamepad.buttons[buttonIndex];
  return Boolean(button?.pressed || button?.value > 0.55);
}

function readInputDevice() {
  const stored = localStorage.getItem(INPUT_DEVICE_STORAGE_KEY);
  if (stored === KEYBOARD_MOUSE_DEVICE_ID || parseGamepadDeviceId(stored) !== null) {
    return stored;
  }
  return "";
}

function getGamepadDeviceId(index) {
  return `gamepad:${index}`;
}

function parseGamepadDeviceId(value) {
  const match = /^gamepad:(\d+)$/.exec(String(value || ""));
  if (!match) return null;
  const index = Number(match[1]);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function previewGamepadMapping(gamepad, mapping) {
  const actions = readMappedGamepadInput(gamepad, mapping);
  return {
    roll: Number(actions.roll.toFixed(3)),
    pitch: Number(actions.pitch.toFixed(3)),
    yaw: Number(actions.yaw.toFixed(3)),
    throttle: actions.hasThrottle ? Number(actions.throttle.toFixed(3)) : null,
    arm: actions.arm,
    brake: actions.brake,
    level: actions.level,
    reset: actions.reset
  };
}

function readMappedKeyboardInput(keys, mapping) {
  const actions = {
    roll: 0,
    pitch: 0,
    yaw: 0,
    throttle: 0,
    brake: false
  };

  keys.forEach((code) => {
    const binding = mapping.keys?.[code];
    if (!binding || binding.action === "none") return;
    if (KEYBOARD_AXIS_ACTIONS.has(binding.action)) {
      actions[binding.action] += binding.direction < 0 ? -1 : 1;
    } else if (binding.action === "brake") {
      actions.brake = true;
    }
  });

  actions.roll = THREE.MathUtils.clamp(actions.roll, -1, 1);
  actions.pitch = THREE.MathUtils.clamp(actions.pitch, -1, 1);
  actions.yaw = THREE.MathUtils.clamp(actions.yaw, -1, 1);
  actions.throttle = THREE.MathUtils.clamp(actions.throttle, -1, 1);
  return actions;
}

function readMappedMouseInput(mouse, mapping) {
  const actions = {
    roll: 0,
    pitch: 0,
    yaw: 0,
    throttle: 0,
    hasThrottle: false,
    arm: null,
    brake: false,
    level: null,
    reset: false,
    hasMapping: false
  };

  Object.entries(mapping.mouse || {}).forEach(([axis, binding]) => {
    const raw = axis === "y" ? mouse.y : mouse.x;
    if (!Number.isFinite(raw)) return;
    const centered = THREE.MathUtils.clamp(binding.invert ? -raw : raw, -1, 1);
    applyInputAction(actions, binding.action, {
      centered,
      throttle: THREE.MathUtils.clamp((centered + 1) / 2, 0, 1),
      active: centered > 0.5
    });
  });

  return actions;
}

function readMappedGamepadInput(gamepad, mapping) {
  const actions = {
    roll: 0,
    pitch: 0,
    yaw: 0,
    throttle: 0,
    hasThrottle: false,
    arm: null,
    brake: false,
    level: null,
    reset: false,
    hasMapping: false
  };

  Object.entries(mapping.axes || {}).forEach(([indexText, binding]) => {
    const index = Number(indexText);
    const raw = gamepad.axes?.[index];
    if (!Number.isFinite(raw)) return;
    applyInputAction(actions, binding.action, {
      centered: normalizeGamepadCenteredAxis(raw, binding.invert),
      throttle: normalizeGamepadThrottleAxis(raw, binding.invert),
      active: normalizeGamepadSwitchAxis(raw, binding.invert)
    });
  });

  Object.entries(mapping.buttons || {}).forEach(([indexText, binding]) => {
    const index = Number(indexText);
    const button = gamepad.buttons?.[index];
    if (!button) return;
    const value = button.pressed || button.value > 0.55 ? 1 : 0;
    const active = Boolean(value);
    applyInputAction(actions, binding.action, {
      centered: binding.invert ? -value : value,
      throttle: binding.invert ? 1 - value : value,
      active: binding.invert ? !active : active
    });
  });

  return actions;
}

function applyInputAction(actions, action, values) {
  if (!INPUT_ACTION_VALUES.has(action) || action === "none") return;
  actions.hasMapping = true;

  if (action === "roll") {
    actions.roll = values.centered;
  } else if (action === "pitch") {
    actions.pitch = values.centered;
  } else if (action === "yaw") {
    actions.yaw = values.centered;
  } else if (action === "throttle") {
    actions.throttle = values.throttle;
    actions.hasThrottle = true;
  } else if (action === "arm") {
    actions.arm = values.active;
  } else if (action === "brake") {
    actions.brake = values.active;
  } else if (action === "level") {
    actions.level = values.active;
  } else if (action === "reset") {
    actions.reset = values.active;
  }
}

function readGamepadMapping() {
  try {
    const stored = JSON.parse(localStorage.getItem(GAMEPAD_STORAGE_KEY) || "null");
    return sanitizeGamepadMapping(stored || DEFAULT_GAMEPAD_MAPPING);
  } catch {
    return sanitizeGamepadMapping(DEFAULT_GAMEPAD_MAPPING);
  }
}

function sanitizeGamepadMapping(mapping) {
  if (mapping && typeof mapping === "object" && (
    "rollAxis" in mapping ||
    "pitchAxis" in mapping ||
    "throttleAxis" in mapping ||
    "yawAxis" in mapping ||
    "brakeButton" in mapping
  )) {
    return sanitizeGamepadMapping(migrateLegacyGamepadMapping(mapping));
  }

  const fallback = cloneGamepadMapping(DEFAULT_GAMEPAD_MAPPING);
  const result = { axes: {}, buttons: {} };
  const source = mapping && typeof mapping === "object" ? mapping : fallback;
  const sourceAxes = source.axes && typeof source.axes === "object" ? source.axes : fallback.axes;
  const sourceButtons = source.buttons && typeof source.buttons === "object" ? source.buttons : fallback.buttons;

  Object.entries(sourceAxes).forEach(([indexText, binding]) => {
    const index = sanitizeAxisIndex(indexText, null);
    const clean = sanitizeBinding(binding);
    if (index !== null && clean.action !== "none") {
      result.axes[index] = clean;
    }
  });

  Object.entries(sourceButtons).forEach(([indexText, binding]) => {
    const index = sanitizeOptionalButtonIndex(indexText);
    const clean = sanitizeBinding(binding);
    if (index !== null && clean.action !== "none") {
      result.buttons[index] = clean;
    }
  });

  return result;
}

function migrateLegacyGamepadMapping(mapping) {
  const migrated = { axes: {}, buttons: {} };
  migrated.axes[sanitizeAxisIndex(mapping.rollAxis, 0)] = { action: "roll", invert: Boolean(mapping.invertRoll) };
  migrated.axes[sanitizeAxisIndex(mapping.pitchAxis, 1)] = { action: "pitch", invert: Boolean(mapping.invertPitch) };
  migrated.axes[sanitizeAxisIndex(mapping.throttleAxis, 2)] = { action: "throttle", invert: Boolean(mapping.invertThrottle) };
  migrated.axes[sanitizeAxisIndex(mapping.yawAxis, 3)] = { action: "yaw", invert: Boolean(mapping.invertYaw) };
  const brakeButton = sanitizeOptionalButtonIndex(mapping.brakeButton);
  if (brakeButton !== null) {
    migrated.buttons[brakeButton] = { action: "brake", invert: false };
  }
  return migrated;
}

function sanitizeBinding(binding) {
  const source = binding && typeof binding === "object" ? binding : {};
  const action = INPUT_ACTION_VALUES.has(source.action) ? source.action : "none";
  return {
    action,
    invert: Boolean(source.invert)
  };
}

function cloneGamepadMapping(mapping) {
  return {
    axes: Object.fromEntries(
      Object.entries(mapping.axes || {}).map(([index, binding]) => [index, { ...binding }])
    ),
    buttons: Object.fromEntries(
      Object.entries(mapping.buttons || {}).map(([index, binding]) => [index, { ...binding }])
    )
  };
}

function getGamepadBinding(mapping, type, index) {
  const table = type === "button" ? mapping.buttons : mapping.axes;
  return table?.[index] || { action: "none", invert: false };
}

function setGamepadBinding(mapping, type, index, action, invert = false) {
  const next = sanitizeGamepadMapping(mapping);
  const tableName = type === "button" ? "buttons" : "axes";
  const cleanIndex = type === "button"
    ? sanitizeOptionalButtonIndex(index)
    : sanitizeAxisIndex(index, null);
  const cleanAction = INPUT_ACTION_VALUES.has(action) ? action : "none";
  if (cleanIndex === null) return next;

  if (UNIQUE_INPUT_ACTIONS.has(cleanAction)) {
    clearActionFromGamepadMapping(next, cleanAction);
  }

  if (cleanAction === "none") {
    delete next[tableName][cleanIndex];
  } else {
    next[tableName][cleanIndex] = {
      action: cleanAction,
      invert: Boolean(invert)
    };
  }
  return sanitizeGamepadMapping(next);
}

function clearActionFromGamepadMapping(mapping, action) {
  ["axes", "buttons"].forEach((tableName) => {
    Object.entries(mapping[tableName] || {}).forEach(([index, binding]) => {
      if (binding.action === action) {
        delete mapping[tableName][index];
      }
    });
  });
}

function readKeyboardMouseMapping() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEYBOARD_MOUSE_STORAGE_KEY) || "null");
    return sanitizeKeyboardMouseMapping(stored || DEFAULT_KEYBOARD_MOUSE_MAPPING);
  } catch {
    return sanitizeKeyboardMouseMapping(DEFAULT_KEYBOARD_MOUSE_MAPPING);
  }
}

function sanitizeKeyboardMouseMapping(mapping) {
  const fallback = cloneKeyboardMouseMapping(DEFAULT_KEYBOARD_MOUSE_MAPPING);
  const source = mapping && typeof mapping === "object" ? mapping : fallback;
  const sourceMouse = source.mouse && typeof source.mouse === "object" ? source.mouse : fallback.mouse;
  const sourceKeys = source.keys && typeof source.keys === "object" ? source.keys : fallback.keys;
  const sourceSettings = source.settings && typeof source.settings === "object" ? source.settings : fallback.settings;
  const result = {
    mouse: {
      x: sanitizeMouseBinding(sourceMouse.x || fallback.mouse.x),
      y: sanitizeMouseBinding(sourceMouse.y || fallback.mouse.y)
    },
    keys: {},
    settings: {}
  };

  Object.entries(sourceKeys).forEach(([code, binding]) => {
    const cleanCode = sanitizeKeyCode(code, null);
    if (cleanCode) {
      result.keys[cleanCode] = sanitizeKeyboardBinding(binding);
    }
  });

  if (!Object.keys(result.keys).length) {
    result.keys = cloneKeyboardMouseMapping(DEFAULT_KEYBOARD_MOUSE_MAPPING).keys;
  }

  MOUSE_SETTING_DEFS.forEach(([key, , min, max]) => {
    result.settings[key] = sanitizeNumber(sourceSettings[key], fallback.settings[key], min, max);
  });

  return result;
}

function sanitizeMouseBinding(binding) {
  const source = binding && typeof binding === "object" ? binding : {};
  const action = MOUSE_AXIS_VALUES.has(source.action) ? source.action : "none";
  return {
    action,
    invert: Boolean(source.invert)
  };
}

function sanitizeKeyboardBinding(binding) {
  const source = binding && typeof binding === "object" ? binding : {};
  const action = KEYBOARD_AXIS_ACTIONS.has(source.action) || KEYBOARD_SWITCH_ACTIONS.has(source.action)
    ? source.action
    : "none";
  return {
    action,
    direction: source.direction < 0 ? -1 : 1
  };
}

function cloneKeyboardMouseMapping(mapping) {
  return {
    mouse: {
      x: { ...(mapping.mouse?.x || DEFAULT_KEYBOARD_MOUSE_MAPPING.mouse.x) },
      y: { ...(mapping.mouse?.y || DEFAULT_KEYBOARD_MOUSE_MAPPING.mouse.y) }
    },
    keys: Object.fromEntries(
      Object.entries(mapping.keys || {}).map(([code, binding]) => [code, { ...binding }])
    ),
    settings: { ...(mapping.settings || DEFAULT_KEYBOARD_MOUSE_MAPPING.settings) }
  };
}

function getMouseAxisBinding(mapping, axis) {
  return mapping.mouse?.[axis] || { action: "none", invert: false };
}

function keyboardBindingToSelectValue(binding) {
  const clean = sanitizeKeyboardBinding(binding);
  if (KEYBOARD_AXIS_ACTIONS.has(clean.action)) {
    return `${clean.action}:${clean.direction < 0 ? "-1" : "1"}`;
  }
  return clean.action;
}

function parseKeyboardBindingValue(value) {
  const text = String(value || "none");
  const [action, directionText] = text.split(":");
  if (KEYBOARD_AXIS_ACTIONS.has(action)) {
    return {
      action,
      direction: directionText === "-1" ? -1 : 1
    };
  }
  if (KEYBOARD_SWITCH_ACTIONS.has(action)) {
    return { action, direction: 1 };
  }
  return { action: "none", direction: 1 };
}

function setKeyboardKeyBinding(mapping, code, actionValue) {
  const next = sanitizeKeyboardMouseMapping(mapping);
  const cleanCode = sanitizeKeyCode(code, null);
  if (!cleanCode) return next;
  next.keys[cleanCode] = parseKeyboardBindingValue(actionValue);
  return sanitizeKeyboardMouseMapping(next);
}

function moveKeyboardKeyBinding(mapping, previousCode, nextCode) {
  const next = sanitizeKeyboardMouseMapping(mapping);
  const cleanPrevious = sanitizeKeyCode(previousCode, null);
  const cleanNext = sanitizeKeyCode(nextCode, null);
  if (!cleanNext) return next;

  const binding = cleanPrevious && next.keys[cleanPrevious]
    ? { ...next.keys[cleanPrevious] }
    : { action: "none", direction: 1 };
  if (cleanPrevious) delete next.keys[cleanPrevious];
  next.keys[cleanNext] = binding;
  return sanitizeKeyboardMouseMapping(next);
}

function setMouseAxisBinding(mapping, axis, action, invert = false) {
  const next = sanitizeKeyboardMouseMapping(mapping);
  const cleanAxis = axis === "y" ? "y" : "x";
  const cleanAction = MOUSE_AXIS_VALUES.has(action) ? action : "none";
  next.mouse[cleanAxis] = {
    action: cleanAction,
    invert: Boolean(invert)
  };
  return sanitizeKeyboardMouseMapping(next);
}

function setKeyboardMouseSetting(mapping, key, value) {
  const next = sanitizeKeyboardMouseMapping(mapping);
  const definition = MOUSE_SETTING_DEFS.find(([settingKey]) => settingKey === key);
  if (!definition) return next;
  next.settings[key] = sanitizeNumber(value, next.settings[key], definition[2], definition[3]);
  return sanitizeKeyboardMouseMapping(next);
}

function sanitizeKeyCode(code, fallback) {
  if (typeof code !== "string" || !/^[A-Za-z0-9]+$/.test(code) || code.length > 32) {
    return fallback;
  }
  return code;
}

function sanitizeNumber(value, fallback, min, max) {
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number)) {
    const fallbackNumber = Number.parseFloat(fallback);
    return Number.isFinite(fallbackNumber) ? THREE.MathUtils.clamp(fallbackNumber, min, max) : min;
  }
  return THREE.MathUtils.clamp(number, min, max);
}

function sanitizeAxisIndex(value, fallback) {
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index > 15) return fallback;
  return index;
}

function sanitizeOptionalButtonIndex(value) {
  if (value === null || value === undefined || value === "") return null;
  const index = Number(value);
  if (!Number.isInteger(index) || index < 0 || index > 31) return null;
  return index;
}

function normalizeCenteredChannel(value) {
  if (!Number.isFinite(value)) return 0;
  if (value >= 1000 && value <= 2000) {
    return THREE.MathUtils.clamp((value - 1500) / 500, -1, 1);
  }
  return THREE.MathUtils.clamp(value, -1, 1);
}

function normalizeThrottleChannel(value) {
  if (!Number.isFinite(value)) return 0;
  if (value >= 1000 && value <= 2000) {
    return THREE.MathUtils.clamp((value - 1000) / 1000, 0, 1);
  }
  if (value >= 0 && value <= 1) {
    return value;
  }
  return THREE.MathUtils.clamp((value + 1) / 2, 0, 1);
}

world = buildWorld(currentMapId);
controls = new ControlMixer(canvas);
multiplayer = new MultiplayerClient(scene);
updateButtons();
requestAnimationFrame(loop);
