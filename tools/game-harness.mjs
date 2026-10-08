import { readFileSync } from 'node:fs';
import { runInContext, createContext } from 'node:vm';

// Headless fixture for the unmodified inline game logic: no renderer or wall-clock timers.
export function createGame(seed = 1, initialSave = null) {
  const elements = new Map();
  function element() {
    const classes = new Set();
    const children = new Map();
    return {
      style: {}, textContent: '', innerHTML: '', disabled: false, listeners: {},
      classList: { add: c => classes.add(c), remove: c => classes.delete(c),
        toggle(c, value) { if (value ?? !classes.has(c)) classes.add(c); else classes.delete(c); },
        contains: c => classes.has(c) },
      addEventListener(name, fn) { this.listeners[name] = fn; },
      setAttribute() {}, appendChild() {}, querySelectorAll:()=>[],
      querySelector(key) { if (!children.has(key)) children.set(key, element()); return children.get(key); },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
      getContext: () => ({}), setPointerCapture() {}, hasPointerCapture: () => false, releasePointerCapture() {},
    };
  }
  const storage = new Map(initialSave ? [['holeGameV5', JSON.stringify(initialSave)]] : []);
  const math = Object.create(Math);
  math.random = () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const sandbox = {
    Math: math, console, performance: { now: () => 0 },
    document: {
      getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); },
      createElement: element, addEventListener() {}, hidden: false,
    },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) },
    matchMedia: () => ({ matches: false }),
    setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame() {}, addEventListener() {},
    innerWidth: 960, innerHeight: 540, devicePixelRatio: 1,
  };
  sandbox.window = sandbox;
  const context = createContext(sandbox);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  runInContext(script, context);
  runInContext('muted=true;', context);
  return { evaluate: code => runInContext(code, context), storage };
}
