FILES = [{"path": "client/src/game/GameWorld.ts", "before": "7cf9a3d02beb6e7acf0b0e5cfa9f0bad146f3024923ce52bb3d0554862935ef5", "after": "d75f1476d9cae10ccaef4cfb9d63d92584ba24a9dbf5d8b31bd1bfdfd1cda5a9", "edits": [
(1073, 1092, r'''getAttackSlotLimit,
  getEndlessVariantHealthFloor,
'''),
(7058, 7058, r'''" | "variant-artillery'''),
(7458, 7606, r'''lastDamagedByEvolution?: EvolutionId; highVariant?: HighVariantId; milestoneBoss?: boolean; missionBossStage?: 1 | 2 | 3; milestoneCrown?: AbstractMesh; variantTimer: number; variantBurst: number; variantVector: Vector3; variantTarget: Vector3; variantSide: number; variantRetrea'''),
(11391, 11430, r'''5;
const MODULE_MILESTONE_INTERVAL = 5'''),
(12785, 12785, r'''  "variant-artillery": "高レベル敵の砲撃",
'''),
(18140, 18140, r'''  private evolutionCombatStats: Partial<Record<EvolutionId, CombatStat>> = {};
'''),
(41029, 41029, r'''    this.evolutionCombatStats = {};
'''),
(59232, 59232, r'''nova", 240, 4], ["'''),
(59501, 59504, r'''3;
    this.moduleTiers.nova = 3;
    this.evolvedWeapons.add("nova-saw");
    this.evolutionCombatStats["nova-saw"] = { damage: 420, kills: 10 };
'''),
(74248, 74254, r'''Math.max(baseHp, this.mode === "endless" ? getEndlessVariantHealthFloor(this.level) : 0)'''),
(76365, 76365, r''' || variant'''),
(76674, 76674, r'''t: 0, variantVector: Vector3.Zero(), variantTarget: Vector3.Zero(), variantSide: Math.random() < 0.5 ? -1 : 1, variantRetrea'''),
(86363, 86363, r'''    const evolution = this.getActiveEvolutionForSource(source);
    if (evolution) {
      const evolved = this.evolutionCombatStats[evolution];
      if (evolved) evolved.damage = Math.min(MAX_TRACKED_COMBAT_DAMAGE, evolved.damage + damage);
    }
  }

  private getActiveEvolutionForSource(source: AttackId) {
    return EVOLUTION_RECIPES.find((recipe) => this.evolvedWeapons.has(recipe.id)
      && recipe.modules.some((moduleId) => moduleId === source))?.id;
'''),
(88177, 88470, r'''    if (this.evolvedWeapons.has(id)) return;
    this.evolvedWeapons.add(id);
    this.evolutionCombatStats[id] = { damage: 0, kills: 0 };
    this.queueSound("evolution");
    this.createEvolutionRing("evolution-awakening", this.player.position, 4.2, 1.2);
    this.createEvolutionRing("evolution-awakening-outer", this.player.position, 6, 1.5);
    const base = this.player.position.add(new Vector3(0, 0.9, 0));
    for (let index = 0; index < 6; index += 1) {
      const angle = index * Math.PI / 3;
      this.createEnergyTrace(base, base.add(new Vector3(Math.cos(angle) * 3, 2, Math.sin(angle) * 3)), 0.08, this.magnetMaterial, 0.75);
    }
    if (id === "mirage-pylon") {
      this.mirageDrones.forEach((drone) => drone.dispose());
      this.mirageDrones.length = 0;
      this.deployPylon();
      this.pylons.forEach((pylon) => this.decorateEvolvedPylon(pylon.mesh));
    }
    if (id === "nova-saw") {
      this.sawBlades.forEach((blade) => blade.dispose());
      this.sawBlades.length = 0;
      this.ensureSawHalo();
    }
    if (id === "mine-decoy") this.deployDecoy();
  }

  private createEvolutionRing(name: string, position: Vector3, radius: number, life = 0.6) {
    const wave = MeshBuilder.CreateTorus(name, { diameter: radius * 2, thickness: 0.09, tessellation: 32 }, this.scene);
    wave.position.copyFrom(position);
    wave.position.y = 0.22;
    wave.material = this.magnetMaterial;
    wave.isPickable = false;
    wave.renderingGroupId = 1;
    wave.visibility = 0.65;
    this.shockwaves.push({ mesh: wave, life, maxLife: life, startScale: 0.22, endScale: 1 });
'''),
(97128, 97160, r'''5, this.magnetMaterial, 0.36);
      this.createEnergyTrace(start, end, 0.16, this.projectileMaterial, 0.4);
      this.createEvolutionRing("evolved-lance-muzzle", start, 1.2, 0.45);
'''),
(97971, 97971, r'''    if (this.hasEvolution("nova-saw")) {
      this.createEvolutionRing("evolved-nova-halo", this.player.position, radius, 0.65);
    }
'''),
(99231, 99248, r'''evolved ? 0.55 : 0.24, segments: 8'''),
(101013, 101013, r'''      if (this.hasEvolution("ricochet-chain")) {
        this.createEnergyTrace(hitPosition.add(new Vector3(0, 0.6, 0)), next.mesh.position.add(new Vector3(0, 0.6, 0)), 0.14, this.magnetMaterial, 0.3);
        this.createEvolutionRing("evolved-arc-impact", hitPosition, 0.9, 0.3);
      }
'''),
(101861, 101861, r'''    if (this.hasEvolution("gravity-mortar")) {
      core.scaling.setAll(1.5);
      for (let index = 0; index < 2; index += 1) {
        const ring = MeshBuilder.CreateTorus("evolved-gravity-orbit", { diameter: 1.6 + index * 0.55, thickness: 0.06, tessellation: 24 }, this.scene);
        ring.parent = core;
        ring.rotation.x = index * Math.PI / 3;
        ring.material = this.magnetMaterial;
        ring.isPickable = false;
      }
    }
'''),
(103133, 103133, r'''        this.createEvolutionRing("evolved-singularity-collapse", core.mesh.position, radius, 0.75);
        this.createEnergyTrace(core.mesh.position, core.mesh.position.add(new Vector3(0, 5, 0)), 0.5, this.magnetMaterial, 0.48);
'''),
(104553, 104553, r'''    if (this.hasEvolution("mine-decoy")) {
      const crown = MeshBuilder.CreateTorus("evolved-beacon-crown", { diameter: 1.5, thickness: 0.12, tessellation: 24 }, this.scene);
      crown.parent = beacon;
      crown.position.y = 0.72;
      crown.material = this.magnetMaterial;
      crown.isPickable = false;
      this.createEvolutionRing("evolved-beacon-deployment", beacon.position, 2, 0.6);
    }
'''),
(105604, 105604, r'''      if (this.hasEvolution("mine-decoy")) this.createEvolutionRing("evolved-beacon-detonation", decoy.mesh.position, radius, 0.8);
'''),
(128996, 128996, r'''      if (this.hasEvolution("nova-saw")) {
        const rim = MeshBuilder.CreateTorus("evolved-saw-rim", { diameter: 1.25, thickness: 0.1, tessellation: 12 }, this.scene);
        rim.parent = blade;
        rim.material = this.magnetMaterial;
        rim.isPickable = false;
      }
'''),
(143493, 143493, r'''  private decorateEvolvedPylon(pylon: AbstractMesh) {
    if (pylon.getChildMeshes().some((child) => child.name === "evolved-pylon-barrel")) return;
    for (const side of [-1, 1]) {
      const barrel = MeshBuilder.CreateBox("evolved-pylon-barrel", { width: 0.16, height: 0.18, depth: 1.05 }, this.scene);
      barrel.parent = pylon;
      barrel.position.set(side * 0.36, 0.45, 0.24);
      barrel.material = this.magnetMaterial;
      barrel.isPickable = false;
    }
  }

'''),
(144157, 144157, r'''    if (evolved) this.decorateEvolvedPylon(pylon);
'''),
(146410, 146471, r'''evolved ? 0.16 : 0.035 + this.moduleTiers.pylon * 0.008, this.magnetMaterial, evolved ? 0.25 : '''),
(155335, 155416, r'''    const armor = enemy.highVariant && HIGH_VARIANTS[enemy.highVariant].trait === "armor" && enemy.variantBurst > 0 ? 0.35 : 1;
    const amplifiedDamage = damage * this.attackAmplifier * boost * vulnerability * armor'''),
(155691, 155691, r'''    enemy.lastDamagedByEvolution = this.getActiveEvolutionForSource(source);
'''),
(165245, 165383, r'''      if (!this.isSimulationActive()) return;
      const objective = decoy ? decoy.mesh.position : this.player.position;
      const direction = this.getVariantMoveDirection(enemy, objective, Boolean(decoy)'''),
(167641, 167641, r'''  /** Movement families share collision checks, not the same homing behavior. */
  private getVariantMoveDirection(enemy: Enemy, objective: Vector3, distracted: boolean) {
    const toward = objective.subtract(enemy.mesh.position);
    toward.y = 0;
    if (!enemy.highVariant || distracted) return toward;
    const trait = HIGH_VARIANTS[enemy.highVariant].trait;
    const distance = toward.length();
    if (distance < 0.01) return toward;
    toward.scaleInPlace(1 / distance);
    const tangent = new Vector3(-toward.z * enemy.variantSide, 0, toward.x * enemy.variantSide);
    if ((trait === "surge" || trait === "skirmish") && enemy.variantBurst > 0) return enemy.variantVector.clone();
    if (trait === "drift") return toward.scale(distance > 7 ? 0.55 : 0.15).add(tangent);
    if (trait === "swarm" && distance > 3) return toward.add(tangent.scale(0.85));
    if (trait === "siege") return distance < 6 ? toward.scale(-1) : distance > 10 ? toward : Vector3.Zero();
    if (trait === "skirmish") {
      if (enemy.variantRetreat > 0 || distance < 4) return toward.scale(-1).add(tangent.scale(0.35));
      if (distance < 8) return tangent;
    }
    return toward;
  }

'''),
(167825, 168756, r'''    const trait = config.trait;
    const wasBursting = enemy.variantBurst > 0;
    enemy.variantTimer -= delta;
    enemy.variantBurst = Math.max(0, enemy.variantBurst - delta);
    enemy.variantRetreat = Math.max(0, enemy.variantRetreat - delta);
    if (trait === "skirmish" && wasBursting && enemy.variantBurst === 0) enemy.variantRetreat = 2;
    if (enemy.variantAura) {
      enemy.variantAura.rotation.y += delta * (3.4 + enemy.scale * 1.6);
      enemy.variantAura.scaling.setAll(trait === "armor" && enemy.variantBurst > 0 ? 1.6 : 0.9 + Math.sin(this.elapsed * 5) * 0.1);
    }
    if (trait === "drift") enemy.mesh.position.y = 0.8 + Math.sin(this.elapsed * 4.2 + enemy.scale * 3) * 0.18;
    // A redirected enemy cancels its old player-targeted warning and charge.
    if (!canThreatenPlayer) {
      enemy.variantTelegraph?.dispose();
      enemy.variantTelegraph = undefined;
      enemy.variantTelegraphTimer = 0;
      enemy.variantBurst = 0;
      enemy.variantTimer = Math.max(enemy.variantTimer, 0.8);
      return 1;
    }
    if (trait === "drift" || trait === "swarm") return trait === "swarm" ? 1.15 : 0.9;
    let resolvingTelegraph = false;
    if (enemy.variantTelegraphTimer > 0) {
      enemy.variantTelegraphTimer = Math.max(0, enemy.variantTelegraphTimer - delta);
      // Targets and charge directions stay locked after the warning appears.
      if (enemy.variantTelegraph) enemy.variantTelegraph.visibility = 0.7 + Math.sin(this.elapsed * 18) * 0.15;
      if (enemy.variantTelegraphTimer > 0) return 0'''),
(168935, 170003, r'''{
      if (enemy.variantBurst > 0) return trait === "armor" ? 0 : trait === "surge" ? 3.2 : 2.6;
      return 1;
    }
    if (!resolvingTelegraph) {
      enemy.variantTimer = trait === "pulse" ? 2.4 : trait === "siege" ? 4.2 : trait === "armor" ? 5.2 : 3.5;
      enemy.variantTelegraphTimer = trait === "siege" ? 1 : VARIANT_TELEGRAPH_SECONDS;
      enemy.variantTarget.copyFrom(this.player.position);
      enemy.variantTarget.y = 0.14;
      enemy.variantVector.copyFrom(this.player.position.subtract(enemy.mesh.position));
      enemy.variantVector.y = 0;
      if (enemy.variantVector.lengthSquared() < 0.001) enemy.variantVector.set(0, 0, 1);
      enemy.variantVector.normalize();
      const chargeLength = enemy.speed * (trait === "surge" ? 3.2 * 0.6 : 2.6 * 0.45);
      const diameter = trait === "pulse" ? (3.2 + enemy.scale * 1.1) * 2 : trait === "siege" ? 4.7 : trait === "armor" ? 2.7 : chargeLength;
      enemy.variantTelegraph = this.createVariantTelegraph(enemy, diameter, trait);
      if (trait === "siege") enemy.variantTelegraph.position.copyFrom(enemy.variantTarget);
      if (trait === "surge" || trait === "skirmish") {
        enemy.variantTelegraph.position.addInPlace(enemy.variantVector.scale(chargeLength / 2));
        enemy.variantTelegraph.rotation.y = Math.atan2(enemy.variantVector.x, enemy.variantVector.z);
      }
      return 0;
    }
    if (trait === "surge" || trait === "skirmish") {
      enemy.variantBurst = trait === "surge" ? 0.6 : 0.45;
      return trait === "surge" ? 3.2 : 2.6;
    }
    if (trait === "armor") {
      enemy.variantBurst = 2;
      return 0;
    }
    if (trait === "pulse") {
      const radius = 3.2 + enemy.scale * 1.1;
      this.emitVariantPulse(enemy, radius, config.contactDamage);
      if ('''),
(170179, 170365, r'''trait === "siege") {
      const impact = MeshBuilder.CreateTorus("variant-artillery-impact", { diameter: 4.7, thickness: 0.13, tessellation: 28 }, this.scene);
      impact.position.copyFrom(enemy.variantTarget);
      impact.material = this.hazardGroundMaterial;
      this.shockwaves.push({ mesh: impact, life: 0.4, maxLife: 0.4, startScale: 1, endScale: 1 });
      if (this.playerRingTouchesPoint(enemy.variantTarget, 2.35) && this.damageTimer <= 0) this.damagePlayer(Math.min(10, config.contactDamage), 0.58, "variant-artillery");
    }
    return 0'''),
(171383, 171387, r'''this.getEnemyHitRadius(enemy) * 2'''),
(188138, 188435, r''') {
      const trait = HIGH_VARIANTS[enemy.highVariant].trait;
      const imminent = enemy.variantTelegraphTimer > 0 && enemy.variantTelegraphTimer <= DODGE_PERFECT_WINDOW_SECONDS;
      if (trait === "pulse" && imminent && this.ringTouchesPointAt(origin, enemy.mesh.position, 3.2 + enemy.scale * 1.1)) return true;
      if (trait === "siege" && imminent && this.ringTouchesPointAt(origin, enemy.variantTarget, 2.35)) return true;
      if ((trait === "surge" || trait === "skirmish") && (imminent || enemy.variantBurst > 0)) {
        const duration = enemy.variantBurst > 0 ? enemy.variantBurst : trait === "surge" ? 0.6 : 0.45;
        const end = enemy.mesh.position.add(enemy.variantVector.scale(enemy.speed * (trait === "surge" ? 3.2 : 2.6) * duration));
        if (this.distanceToSegmentSquared(origin, enemy.mesh.position, end) <= contactRadius * contactRadius) return true;
      }
'''),
(193000, 193000, r'''    const evolvedStat = enemy.lastDamagedByEvolution ? this.evolutionCombatStats[enemy.lastDamagedByEvolution] : undefined;
    if (evolvedStat) evolvedStat.kills = Math.min(MAX_TRACKED_KILLS, evolvedStat.kills + 1);
'''),
(206799, 206834, r'''        const evolved = evolution ? this.evolutionCombatStats[evolution.id] : undefined;
        return {
          ...attack, ...stat,
          evolutionId: evolution?.id,
          evolvedDamage: evolution ? evolved?.damage ?? 0 : undefined,
          evolvedKills: evolution ? evolved?.kills ?? 0 : undefined,
          sourceLabels: evolution?.modules.map((id) => MODULE_UPGRADES.find((option) => option.id === id)!.title),
       '''),
(211927, 211929, r'''3'''),
(212190, 212362, r'''const candidates = freshPool.length >= 3 ? freshPool : pool;
    // A free slot must produce a real acquisition choice, not just a low random chance.
    const freshNewWeapons = candidates.filter((option) => this.isNewAttackUpgrade(option));
    const newWeapons = freshNewWeapons.length > 0 ? freshNewWeapons : pool.filter((option) => this.isNewAttackUpgrade(option));
    const selected = this.pickWeightedOptions(newWeapons, 1);
    // Also keep a path toward an owned pair's next level instead of crowding it out.
    const recipeSteps = candidates.filter((option) => !selected.includes(option)
      && this.isModuleId(option.id) && this.moduleTiers[option.id] > 0
      && EVOLUTION_RECIPES.some((recipe) => !this.evolvedWeapons.has(recipe.id)
        && recipe.modules.includes(option.id as ModuleId)
        && recipe.modules.every((id) => this.moduleTiers[id] > 0)));
    selected.push(...this.pickWeightedOptions(recipeSteps, 1));
    selected.push(...this.pickWeightedOptions(candidates.filter((option) => !selected.includes(option)), 3 - selected.length));
    this.upgradeOptions = selected;
  }

  private isNewAttackUpgrade(option: UpgradeOption) {
    return (option.id === "scatter" && !this.hasScatter)
      || (option.id === "orbit" && !this.hasOrbit)
      || (this.isModuleId(option.id) && this.isWeaponModule(option.id) && this.moduleTiers[option.id] === 0);
  }

  private getUpgradeCandidatePool() {
    const catalog = this.level >= 3'''),
(216785, 216802, r'''getAttackSlotLimit(this.mode, this.level)'''),
]} ]
