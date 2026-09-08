import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(text, before, after, label) {
  if (text.split(before).length !== 2) throw new Error(`Expected exactly one match: ${label}`);
  return text.replace(before, after);
}
const worldPath = 'client/src/game/GameWorld.ts';
let world = readFileSync(worldPath, 'utf8');
world = replaceOnce(world,
  'type Projectile = { mesh: AbstractMesh; velocity: Vector3; damage: number; life: number; hitRadius: number; source: AttackId };',
  'type Projectile = { mesh: AbstractMesh; velocity: Vector3; damage: number; life: number; hitRadius: number; source: AttackId; trailStart?: Vector3 };',
  'projectile presentation origin');
world = replaceOnce(world,
  'const PROJECTILE_HEIGHT = 0.86;',
  `const PROJECTILE_HEIGHT = 0.86;
// Presentation time is independent of collision-safe simulation catch-up.
// A slow display must still have several opportunities to show short effects.
const MAX_PRESENTATION_STEP_SECONDS = 0.05;
const PROJECTILE_IMPACT_LIFE_SECONDS = 0.14;`,
  'presentation constants');
world = replaceOnce(world,
  '  setTouchDirection(x: number, z: number) {',
  `  /**
   * Advance existing visual-only effects once BEFORE this render's simulation
   * steps. Effects born during catch-up therefore survive until scene.render().
   * Never advance gameplay timers, damage, movement, or attack cooldowns here.
   */
  updatePresentation(delta: number) {
    if (!this.isSimulationRunning()) return;
    const safeDelta = Number.isFinite(delta) ? Math.min(Math.max(0, delta), MAX_PRESENTATION_STEP_SECONDS) : 0;
    this.updateShockwaves(safeDelta);
    this.updateEnergyTraces(safeDelta);
    // Remember the last displayed point, not every simulation substep.
    for (const projectile of this.projectiles) {
      if (projectile.trailStart) projectile.trailStart.copyFrom(projectile.mesh.position);
      else projectile.trailStart = projectile.mesh.position.clone();
    }
  }

  setTouchDirection(x: number, z: number) {`,
  'presentation clock');
world = replaceOnce(world,
  '  private updateModules(delta: number) {\n    this.updateShockwaves(delta);\n    if (!this.isSimulationActive()) return;',
  '  private updateModules(delta: number) {\n    if (!this.isSimulationActive()) return;',
  'remove shockwave simulation aging');
world = replaceOnce(world,
  '    this.updateEnergyTraces(delta);\n    if (!this.isSimulationActive()) return;\n    this.updateMines(delta);',
  '    this.updateMines(delta);',
  'remove trace simulation aging');
world = replaceOnce(world,
  '        this.applyDamage(enemy, projectile.damage, projectile.source);',
  '        this.showProjectileImpact(projectile, previousPosition);\n        this.applyDamage(enemy, projectile.damage, projectile.source);',
  'visible impact without delaying collision');
world = replaceOnce(world,
  '  private createCombatStats(): Record<AttackId, CombatStat> {',
  `  private showProjectileImpact(projectile: Projectile, previousPosition: Vector3) {
    if (!this.isSimulationActive()) return;
    const start = projectile.trailStart ?? previousPosition;
    const end = projectile.mesh.position;
    this.createEnergyTrace(start, end, 0.1, this.projectileMaterial, PROJECTILE_IMPACT_LIFE_SECONDS);
    const flash = MeshBuilder.CreateSphere("projectile-hit-flash", { diameter: 0.46, segments: 6 }, this.scene);
    flash.position.copyFrom(end);
    flash.material = this.projectileMaterial;
    flash.isPickable = false;
    // This mesh has no velocity, damage, or collision entry. The actual bullet
    // is still disposed immediately by updateCombat, exactly once per hit.
    this.energyTraces.push({ mesh: flash, life: PROJECTILE_IMPACT_LIFE_SECONDS, maxLife: PROJECTILE_IMPACT_LIFE_SECONDS });
  }

  private createCombatStats(): Record<AttackId, CombatStat> {`,
  'impact presentation helper');
for (const life of ['2.2', '1.35']) {
  world = replaceOnce(world,
    `this.projectiles.push({ mesh: bolt, velocity: direction.scale(speed), damage, life: ${life}, hitRadius: 0.76 + diameter, source });`,
    `this.projectiles.push({ mesh: bolt, velocity: direction.scale(speed), damage, life: ${life}, hitRadius: 0.76 + diameter, source, trailStart: bolt.position.clone() });`,
    `projectile origin ${life}`);
}
writeFileSync(worldPath, world);
const scenePath = 'client/src/game/scene.ts';
let scene = readFileSync(scenePath, 'utf8');
scene = replaceOnce(scene,
  '    const timing = consumeSimulationDebt(simulationDebt, effectiveFrameDelta, world.isSimulationRunning());',
  `    // Age only effects from earlier rendered frames. New attacks created by
    // the simulation catch-up below must reach this frame's actual rendering.
    world.updatePresentation(effectiveFrameDelta);
    const timing = consumeSimulationDebt(simulationDebt, effectiveFrameDelta, world.isSimulationRunning());`,
  'presentation before simulation');
writeFileSync(scenePath, scene);
const packagePath = 'package.json';
writeFileSync(packagePath, replaceOnce(readFileSync(packagePath, 'utf8'),
  'client/src/game/GameWorld.runtime.test.ts ',
  'client/src/game/GameWorld.runtime.test.ts client/src/game/GameWorld.presentation.test.ts ',
  'include presentation tests in existing CI'));
console.log('Applied presentation-only changes. Gameplay rules and simulation budgets are unchanged.');
