import { readFileSync, writeFileSync } from 'node:fs';
function replaceOnce(path, before, after) {
  const text = readFileSync(path, 'utf8');
  if (text.split(before).length !== 2) throw new Error(`Unexpected source: ${path}`);
  writeFileSync(path, text.replace(before, after));
}
replaceOnce('client/src/game/GameWorld.ts',
  '    flash.isPickable = false;',
  `    flash.isPickable = false;
    // The collision point can already be inside a large enemy. Draw only the
    // small, short-lived hit confirmation after world geometry so it cannot
    // be entirely depth-occluded. Ordinary bullets keep their original order.
    flash.renderingGroupId = 1;`);
replaceOnce('client/src/game/GameWorld.presentation.test.ts',
  '      expect(flash!.mesh.isPickable).toBe(false);',
  '      expect(flash!.mesh.isPickable).toBe(false);\n      expect(flash!.mesh.renderingGroupId).toBe(1);');
replaceOnce('client/src/game/GameWorld.presentation.test.ts',
  '      const displayedPosition = shot.mesh.position.clone();',
  '      expect(shot.mesh.renderingGroupId).toBe(0);\n      const displayedPosition = shot.mesh.position.clone();');
replaceOnce('docs/ATTACK_VISIBILITY_FIX.md',
  '表示に速度・ダメージ・当たり判定はありません。',
  '表示に速度・ダメージ・当たり判定はありません。小さな命中光だけを敵や地形の後に描画し、近距離で敵本体に隠れる状態を避けます。通常の弾・光線・敵の描画順は変えません。');
console.log('Applied depth-occlusion correction to hit confirmation only.');
