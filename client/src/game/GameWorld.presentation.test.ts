import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { GameWorld } from "./GameWorld";
import { consumeSimulationDebt, splitSimulationDelta } from "./rules";
import type { AttackId, GameMode, GamePhase, GameSnapshot, ModuleId } from "./types";

type Effect = { mesh: AbstractMesh; life: number; maxLife: number };
type Enemy = { mesh: AbstractMesh; hp: number; maxHp: number; speed: number; enteringContainment: boolean };
type Runtime = {
  player: AbstractMesh;
  enemies: Enemy[];
  projectiles: Array<{ mesh: AbstractMesh; trailStart?: Vector3 }>;
  energyTraces: Effect[];
  shockwaves: Effect[];
  moduleTiers: Record<ModuleId, number>;
  combatStats: Record<AttackId, { damage: number; kills: number }>;
  spawnTimer: number;
  encounterTimer: number;
  shootTimer: number;
  idleStrikeCooldown: number;
  xpNeeded: number;
  elapsed: number;
  phase: GamePhase;
  spawnEnemy: (kind: "scout") => void;
  spawnBoltFrom: (origin: Vector3, direction: Vector3, speed: number, damage: number, diameter: number, source: AttackId) => void;
  clearTransientCombatEffects: () => void;
  enforceTransientCaps: () => void;
  updatePresentation?: (delta: number) => void;
  emitSnapshot: () => void;
};

const fixtures: Array<{ world: GameWorld; scene: Scene; engine: NullEngine }> = [];
function createFixture(mode: GameMode, distance = 2) {
  const target = new EventTarget();
  vi.stubGlobal("window", {
    addEventListener: target.addEventListener.bind(target),
    removeEventListener: target.removeEventListener.bind(target),
  });
  const engine = new NullEngine({ renderWidth: 390, renderHeight: 844, textureSize: 256 });
  const scene = new Scene(engine);
  let snapshot: GameSnapshot | undefined;
  const world = new GameWorld(scene, (value) => { snapshot = value; }, false, false, false, false, false, false, false, false, false, undefined, false, 0, 0, 0, 0, 0, 0, false, false, mode);
  fixtures.push({ world, scene, engine });
  const runtime = world as unknown as Runtime;
  runtime.spawnTimer = Number.POSITIVE_INFINITY;
  runtime.encounterTimer = Number.POSITIVE_INFINITY;
  runtime.idleStrikeCooldown = Number.POSITIVE_INFINITY;
  runtime.xpNeeded = 999999;
  runtime.spawnEnemy("scout");
  const enemy = runtime.enemies[0];
  enemy.mesh.position.set(distance, 0.8, 0);
  enemy.hp = 10000;
  enemy.maxHp = 10000;
  enemy.speed = 0;
  enemy.enteringContainment = false;
  runtime.clearTransientCombatEffects();
  return { world, scene, runtime, enemy, snapshot: () => { runtime.emitSnapshot(); return snapshot!; } };
}
function renderFrame(fixture: ReturnType<typeof createFixture>, delta: number) {
  // Optional call deliberately permits the original implementation to run:
  // the regression must fail because its effects vanish, not a missing method.
  fixture.runtime.updatePresentation?.(delta);
  const timing = consumeSimulationDebt(0, delta, fixture.world.isSimulationRunning());
  for (const step of splitSimulationDelta(timing.budget)) fixture.world.update(step);
}

afterEach(() => {
  for (const { world, scene, engine } of fixtures.splice(0)) {
    world.dispose();
    scene.dispose();
    engine.dispose();
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

for (const mode of ["normal", "endless"] as const) {
  describe(`${mode}: attack presentation`, () => {
    it.each([1 / 120, 1 / 60, 0.2])("shows an impact when a nearby rail bullet hits before rendering (%s seconds)", (delta) => {
      const fixture = createFixture(mode);
      renderFrame(fixture, delta);
      expect(fixture.enemy.hp).toBe(9986);
      expect(fixture.runtime.projectiles).toHaveLength(0);
      const flash = fixture.runtime.energyTraces.find(({ mesh }) => mesh.name === "projectile-hit-flash");
      expect(flash, "the hit must leave a visual-only flash").toBeDefined();
      expect(flash!.mesh.isDisposed()).toBe(false);
      expect(flash!.mesh.visibility).toBeGreaterThan(0);
      expect(flash!.mesh.isPickable).toBe(false);
      expect(flash!.mesh.renderingGroupId).toBe(1);
      expect(fixture.runtime.combatStats.rail.damage).toBe(14);
    });

    it("keeps a short beam alive through a 200ms simulation catch-up", () => {
      const fixture = createFixture(mode, 6);
      fixture.runtime.shootTimer = Number.POSITIVE_INFINITY;
      fixture.runtime.moduleTiers.thermal = 1;
      renderFrame(fixture, 0.2);
      expect(fixture.enemy.hp).toBe(9985);
      const beam = fixture.runtime.energyTraces.find(({ mesh }) => mesh.name === "energy-trace");
      expect(beam, "beam must survive until the catch-up frame is rendered").toBeDefined();
      expect(beam!.life).toBeCloseTo(0.13);
      expect(beam!.mesh.visibility).toBe(1);
    });

    it("keeps an expanding weapon wave alive through a one-second catch-up", () => {
      const fixture = createFixture(mode);
      fixture.runtime.shootTimer = Number.POSITIVE_INFINITY;
      fixture.runtime.moduleTiers.nova = 1;
      renderFrame(fixture, 1);
      expect(fixture.runtime.combatStats.nova.damage).toBe(31);
      expect(fixture.runtime.shockwaves.some(({ mesh, life }) => mesh.name === "nova-ring" && life > 0)).toBe(true);
    });

    it("preserves distant projectile flight, and does not apply early damage", () => {
      const fixture = createFixture(mode, 10);
      renderFrame(fixture, 1 / 60);
      expect(fixture.enemy.hp).toBe(10000);
      expect(fixture.runtime.projectiles).toHaveLength(1);
      expect(fixture.runtime.energyTraces).toHaveLength(0);
      const shot = fixture.runtime.projectiles[0];
      expect(shot.mesh.renderingGroupId).toBe(0);
      const displayedPosition = shot.mesh.position.clone();
      renderFrame(fixture, 1 / 60);
      expect(shot.trailStart?.equals(displayedPosition)).toBe(true);
    });

    it("also retains impacts from module projectiles without a second hit", () => {
      const fixture = createFixture(mode);
      fixture.runtime.shootTimer = Number.POSITIVE_INFINITY;
      fixture.runtime.spawnBoltFrom(fixture.runtime.player.position, new Vector3(1, 0, 0), 30, 17, 0.2, "vector");
      renderFrame(fixture, 1 / 60);
      expect(fixture.enemy.hp).toBe(9983);
      expect(fixture.runtime.projectiles).toHaveLength(0);
      expect(fixture.runtime.energyTraces.some(({ mesh }) => mesh.name === "projectile-hit-flash")).toBe(true);
      for (let index = 0; index < 20; index += 1) renderFrame(fixture, 1 / 60);
      expect(fixture.enemy.hp).toBe(9983);
      expect(fixture.runtime.combatStats.vector.damage).toBe(17);
      expect(fixture.runtime.energyTraces).toHaveLength(0);
    });

    it("pauses presentation during pause, preparation, upgrade and boss reward, then expires it after resuming", () => {
      const fixture = createFixture(mode);
      renderFrame(fixture, 1 / 60);
      const flash = fixture.runtime.energyTraces.find(({ mesh }) => mesh.name === "projectile-hit-flash")!;
      expect(flash).toBeDefined();
      const originalLife = flash.life;
      for (const phase of ["paused", "upgrade", "bossReward", "gameover"] as const) {
        fixture.runtime.phase = phase;
        fixture.runtime.updatePresentation?.(5);
        expect(flash.life).toBe(originalLife);
      }
      fixture.runtime.phase = "playing";
      fixture.world.setPreparing(true);
      fixture.runtime.updatePresentation?.(5);
      expect(flash.life).toBe(originalLife);
      fixture.world.setPreparing(false);
      fixture.runtime.updatePresentation?.(1);
      expect(flash.life).toBeCloseTo(originalLife - 0.05);
      for (let frame = 0; frame < 20; frame += 1) fixture.runtime.updatePresentation?.(1 / 60);
      expect(flash.mesh.isDisposed()).toBe(true);
      expect(fixture.runtime.energyTraces).toHaveLength(0);
    });

    it("clears visual remnants at boss transitions, restart, and disposal", () => {
      const fixture = createFixture(mode);
      renderFrame(fixture, 1 / 60);
      const firstEffects = fixture.runtime.energyTraces.map(({ mesh }) => mesh);
      expect(firstEffects.length).toBeGreaterThan(0);
      fixture.runtime.clearTransientCombatEffects();
      expect(firstEffects.every((mesh) => mesh.isDisposed())).toBe(true);
      fixture.runtime.shootTimer = 0;
      renderFrame(fixture, 1 / 60);
      const secondEffects = fixture.runtime.energyTraces.map(({ mesh }) => mesh);
      expect(secondEffects.length).toBeGreaterThan(0);
      fixture.world.restart();
      expect(secondEffects.every((mesh) => mesh.isDisposed())).toBe(true);
      expect(fixture.runtime.energyTraces).toHaveLength(0);
      expect(fixture.runtime.shockwaves).toHaveLength(0);
      expect(fixture.snapshot().seconds).toBe(0);
    });

    it("keeps visual meshes bounded even when catch-up creates repeated immediate hits", () => {
      const fixture = createFixture(mode);
      fixture.runtime.shootTimer = Number.POSITIVE_INFINITY;
      const baseMeshes = fixture.scene.meshes.length;
      for (let index = 0; index < 200; index += 1) {
        fixture.runtime.spawnBoltFrom(fixture.runtime.player.position, new Vector3(1, 0, 0), 30, 1, 0.2, "vector");
        fixture.world.update(1 / 60);
      }
      expect(fixture.enemy.hp).toBe(9800);
      expect(fixture.runtime.energyTraces.length).toBeGreaterThan(0);
      expect(fixture.runtime.energyTraces.length).toBeLessThanOrEqual(120);
      expect(fixture.scene.meshes.length).toBeLessThanOrEqual(baseMeshes + 120);
      fixture.runtime.clearTransientCombatEffects();
      expect(fixture.scene.meshes.length).toBe(baseMeshes);
    });

    it("changes no gameplay snapshot when presentation is advanced between simulation frames", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const presented = createFixture(mode, 6);
      const simulationOnly = createFixture(mode, 6);
      presented.runtime.moduleTiers.thermal = 1;
      simulationOnly.runtime.moduleTiers.thermal = 1;
      for (let frame = 0; frame < 30; frame += 1) {
        renderFrame(presented, 0.2);
        for (const step of splitSimulationDelta(0.2)) simulationOnly.world.update(step);
      }
      expect(presented.enemy.hp).toBe(simulationOnly.enemy.hp);
      expect(presented.runtime.combatStats).toEqual(simulationOnly.runtime.combatStats);
      expect(presented.snapshot()).toEqual(simulationOnly.snapshot());
    });
  });
}

it("runs the presentation clock before, and outside, the simulation substep loop", () => {
  const source = readFileSync("client/src/game/scene.ts", "utf8");
  const presentation = source.indexOf("world.updatePresentation(effectiveFrameDelta)");
  const simulation = source.indexOf("for (const step of splitSimulationDelta(timing.budget)) world.update(step)");
  expect(presentation).toBeGreaterThan(0);
  expect(presentation).toBeLessThan(simulation);
  expect(source.match(/world\.updatePresentation\(/g)).toHaveLength(1);
});
