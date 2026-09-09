import { afterEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GameWorld } from "./GameWorld";
import { EVOLUTION_RECIPES, getAttackSlotLimit, getEndlessVariantHealthFloor, SCORE_RULES } from "./rules";
import type { GameMode, GameSnapshot, UpgradeOption } from "./types";

// Tests deliberately access private simulation state to arrange exact combat scenarios.
type Internal = Record<string, any>;
const isNewAttack = (r: Internal, option: UpgradeOption) => (option.id === "scatter" && !r.hasScatter)
  || (option.id === "orbit" && !r.hasOrbit)
  || (option.id in r.moduleTiers && !["cryo", "reactive", "corrosion"].includes(option.id) && r.moduleTiers[option.id] === 0);
const fixtures: Array<{ world: GameWorld; scene: Scene; engine: NullEngine }> = [];
function fixture(mode: GameMode = "endless") {
  const target = new EventTarget();
  vi.stubGlobal("window", { addEventListener: target.addEventListener.bind(target), removeEventListener: target.removeEventListener.bind(target) });
  const engine = new NullEngine({ renderWidth: 390, renderHeight: 844, textureSize: 256 });
  const scene = new Scene(engine);
  let latest: GameSnapshot;
  const world = new GameWorld(scene, (s) => { latest = s; }, false, false, false, false, false, false, false, false, false, undefined, false, 0, 0, 0, 0, 0, 0, false, false, mode);
  fixtures.push({ world, scene, engine });
  const r = world as unknown as Internal;
  r.spawnTimer = r.encounterTimer = r.idleStrikeCooldown = Infinity;
  const snapshot = () => { r.emitSnapshot(); return latest!; };
  const enemy = (variant?: string) => {
    r.spawnEnemy("scout", variant, false);
    const e = r.enemies.at(-1);
    e.mesh.position.set(8, 0.8, 0);
    e.enteringContainment = false;
    e.variantTimer = 0;
    return e;
  };
  return { world, scene, r, snapshot, enemy };
}
afterEach(() => {
  for (const { world, scene, engine } of fixtures.splice(0)) { world.dispose(); scene.dispose(); engine.dispose(); }
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

describe("weapon acquisition through level 80", () => {
  it.each([[1, 6], [9, 6], [10, 7], [20, 8], [40, 10], [60, 12], [79, 13], [80, 14], [200, 14]])("expands Endless at level %s to %s slots, retaining Normal's six", (level, slots) => {
    expect(getAttackSlotLimit("endless", level)).toBe(slots);
    expect(getAttackSlotLimit("normal", level)).toBe(6);
  });
  it("offers a new attack whenever there is space, even after an excluding reroll", () => {
    const { r, snapshot } = fixture();
    r.level = 11; r.phase = "upgrade";
    const allNew = r.getUpgradeCandidatePool().filter((o: UpgradeOption) => isNewAttack(r, o));
    r.prepareUpgradeChoices(new Set(allNew.map((o: UpgradeOption) => o.id)));
    expect(snapshot().upgrades.some((o) => isNewAttack(r, o))).toBe(true);
    expect(new Set(snapshot().upgrades.map((o) => o.id)).size).toBe(3);
  });
  it.each([1, 9, 42, 99, 2026])("can acquire fourteen active attacks through the real selection path (seed %s)", (seed) => {
    let state = seed;
    vi.spyOn(Math, "random").mockImplementation(() => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 4294967296));
    const { world, r } = fixture();
    for (let level = 2; level <= 80; level += 1) {
      r.level = level; r.phase = "upgrade"; r.prepareUpgradeChoices();
      const options: UpgradeOption[] = r.upgradeOptions;
      expect(new Set(options.map((o) => o.id)).size).toBe(3);
      const fresh = options.find((o) => isNewAttack(r, o));
      if (r.getAttackSlotCount() < r.getWeaponLimit()) expect(fresh).toBeDefined();
      world.chooseUpgrade((fresh ?? options[0]).id);
      expect(r.getAttackSlotCount()).toBeLessThanOrEqual(r.getWeaponLimit());
    }
    expect(r.getAttackSlotCount()).toBe(14);
  });
  it("makes weapon modules available at level 3, not level 10", () => {
    const { r } = fixture(); r.level = 3;
    expect(r.getUpgradeCandidatePool().some((o: UpgradeOption) => o.category === "module")).toBe(true);
  });
});

describe("evolution statistics and bounded presentation", () => {
  it.each(EVOLUTION_RECIPES)("separates pre/post evolution records for $id without double scoring", (recipe) => {
    const { r, enemy, snapshot, world, scene } = fixture();
    const e = enemy(); e.hp = e.maxHp = 1000;
    for (const id of recipe.modules) r.moduleTiers[id] = 3;
    r.applyDamage(e, 100, recipe.modules[0]);
    const beforeSlots = r.getAttackSlotCount();
    r.activateEvolution(recipe.id);
    expect(r.getAttackSlotCount()).toBe(beforeSlots - 1);
    expect(scene.meshes.some((m) => m.name === "evolution-awakening")).toBe(true);
    expect(snapshot().soundEvents.some((s) => s.cue === "evolution")).toBe(true);
    r.applyDamage(e, 200, recipe.modules[1]);
    let row = snapshot().resultStats.find((s) => s.evolutionId === recipe.id)!;
    expect(row.damage).toBe(300); expect(row.evolvedDamage).toBe(200); expect(row.evolvedKills).toBe(0);
    e.hp = 10;
    r.applyDamage(e, 9999, recipe.modules[0]);
    expect(r.destroyEnemy(e)).toBe(true);
    row = snapshot().resultStats.find((s) => s.evolutionId === recipe.id)!;
    expect(row.evolvedDamage).toBe(210); expect(row.evolvedKills).toBe(1);
    expect(snapshot().scoreBreakdown.killPoints).toBe(SCORE_RULES.killPoints);
    const effects = r.shockwaves.length;
    r.activateEvolution(recipe.id);
    expect(r.shockwaves.length).toBe(effects);
    expect(snapshot().resultStats.find((s) => s.evolutionId === recipe.id)?.evolvedKills).toBe(1);
    world.restart();
    expect(snapshot().evolvedWeapons).toEqual([]);
    expect(Object.keys(r.evolutionCombatStats)).toHaveLength(0);
  });
  it("does not attribute another weapon's final blow to the evolved weapon", () => {
    const { r, enemy, snapshot } = fixture(); const e = enemy(); e.hp = 30;
    r.moduleTiers.vector = r.moduleTiers.laser = 3; r.activateEvolution("vector-laser");
    r.applyDamage(e, 10, "vector"); r.applyDamage(e, 50, "rail");
    expect(r.destroyEnemy(e)).toBe(true);
    expect(snapshot().resultStats.find((s) => s.evolutionId === "vector-laser")?.evolvedKills).toBe(0);
    expect(snapshot().resultStats.find((s) => s.id === "rail")?.kills).toBe(1);
  });
  it("retains existing pylon deployment count and decorates all three without extra attack bursts", () => {
    const { r, scene } = fixture(); r.moduleTiers.pylon = r.moduleTiers.mirage = 3;
    r.deployPylon(); r.deployPylon();
    const burst = vi.spyOn(r, "firePylonDeploymentBurst"); r.activateEvolution("mirage-pylon");
    expect(burst).toHaveBeenCalledTimes(1);
    expect(r.pylons.length).toBe(3);
    expect(scene.meshes.filter((m) => m.name === "evolved-pylon-barrel").length).toBe(6);
  });
});

describe("seven enemy behavior families", () => {
  it("gives heavy and fragile level-80 variants clearly different health, and health bars", () => {
    const { r, enemy } = fixture(); r.level = 80;
    const heavy = enemy("singularity-beast"), fragile = enemy("echo-swarm");
    expect(heavy.hp / fragile.hp).toBeGreaterThan(7);
    expect(fragile.hp).toBeGreaterThan(200);
    expect(Boolean(heavy.healthFill && fragile.healthFill)).toBe(true);
    expect(getEndlessVariantHealthFloor(80)).toBeGreaterThan(getEndlessVariantHealthFloor(40));
  });
  it("locks a charge direction during the warning, then dashes rather than homing", () => {
    const { r, enemy } = fixture(); const e = enemy("rift-runner");
    expect(r.updateHighVariantAction(e, true, 0)).toBe(0);
    const direction = e.variantVector.clone();
    r.player.position.set(0, 0.8, 8);
    expect(r.updateHighVariantAction(e, true, 0.3)).toBe(0);
    expect(r.updateHighVariantAction(e, true, 0.32)).toBeGreaterThan(3);
    expect(Vector3.Distance(r.getVariantMoveDirection(e, r.player.position, false), direction)).toBeLessThan(0.001);
  });
  it("circles, flanks, retreats and holds firing distance instead of all moving straight in", () => {
    const { r, enemy } = fixture();
    const drift = enemy("flare-wisp"), swarm = enemy("shardling"), siege = enemy("gravity-husk"), skirmish = enemy("vanta-stalker");
    const a = r.getVariantMoveDirection(drift, r.player.position, false);
    const b = r.getVariantMoveDirection(swarm, r.player.position, false);
    expect(Math.abs(a.z)).toBeGreaterThan(Math.abs(a.x));
    expect(Math.abs(b.z)).toBeGreaterThan(0.5);
    expect(r.getVariantMoveDirection(siege, r.player.position, false).length()).toBe(0);
    siege.mesh.position.x = 3;
    expect(r.getVariantMoveDirection(siege, r.player.position, false).x).toBeGreaterThan(0);
    skirmish.variantRetreat = 1;
    expect(r.getVariantMoveDirection(skirmish, r.player.position, false).x).toBeGreaterThan(0);
  });
  it.each([false, true])("artillery targets stay fixed and can be avoided (move away=%s)", (avoid) => {
    const { r, enemy } = fixture(); const e = enemy("gravity-husk");
    const hp = r.health; r.updateHighVariantAction(e, true, 0);
    const target = e.variantTarget.clone();
    if (avoid) r.player.position.set(0, 0.8, 7);
    expect(Vector3.Distance(e.variantTarget, target)).toBe(0);
    r.updateHighVariantAction(e, true, 1);
    expect(r.health).toBe(avoid ? hp : hp - 6);
  });
  it("braces with reduced incoming damage, then exposes normal health again", () => {
    const { r, enemy } = fixture(); const e = enemy("ion-bastion"); e.hp = e.maxHp = 1000;
    r.updateHighVariantAction(e, true, 0); r.updateHighVariantAction(e, true, 0.62);
    r.applyDamage(e, 100, "rail"); expect(e.hp).toBe(965);
    r.updateHighVariantAction(e, true, 2.1);
    r.applyDamage(e, 100, "rail"); expect(e.hp).toBe(865);
  });
  it.each(["rift-runner", "gravity-husk", "pulse-maw"])("cancels %s's old threat when a decoy takes over", (id) => {
    const { r, enemy } = fixture(); const e = enemy(id); const hp = r.health;
    r.updateHighVariantAction(e, true, 0); const marker = e.variantTelegraph;
    r.updateHighVariantAction(e, false, 1);
    expect(r.health).toBe(hp); expect(e.variantTelegraphTimer).toBe(0);
    expect(marker.isDisposed()).toBe(true); expect(e.variantBurst).toBe(0);
  });
  it("does not advance warnings during pause and cleans them on restart", () => {
    const { r, world, enemy } = fixture(); const e = enemy("gravity-husk");
    r.updateHighVariantAction(e, true, 0); const marker = e.variantTelegraph;
    world.setPaused(true); world.update(1);
    expect(e.variantTelegraphTimer).toBe(1);
    world.restart(); expect(marker.isDisposed()).toBe(true);
  });
});
