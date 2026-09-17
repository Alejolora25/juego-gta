import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../src/domain/entities/GameState.js';
import { CombatService } from '../src/application/usecases/CombatService.js';

test('mission progression reaches boss stage and awards XP', () => {
  const state = new GameState();
  assert.equal(state.stage, 0);
  state.completeObjective();
  state.completeObjective();
  state.completeObjective();
  assert.equal(state.stage, 3);
  assert.equal(state.xp, 300);
});

test('boss cannot start before the three objectives', () => {
  const state = new GameState();
  state.startBoss();
  assert.equal(state.bossActive, false);
  state.completeObjective(); state.completeObjective(); state.completeObjective();
  state.startBoss();
  assert.equal(state.bossActive, true);
});

test('combat cooldown and damage rules remain stable', () => {
  const state = new GameState();
  state.completeObjective(); state.completeObjective(); state.completeObjective(); state.startBoss();
  const combat = new CombatService(state);
  assert.equal(combat.canPlayerShoot(), true);
  combat.registerPlayerShot();
  assert.equal(combat.canPlayerShoot(), false);
  combat.update(.23);
  assert.equal(combat.canPlayerShoot(), true);
  combat.bossHit();
  assert.equal(state.bossHP, 88);
  combat.playerHit();
  assert.equal(state.playerHP, 2);
});

test('boss defeat completes chapter and awards final XP', () => {
  const state = new GameState();
  state.completeObjective(); state.completeObjective(); state.completeObjective(); state.startBoss();
  const combat = new CombatService(state);
  while (!state.finished) combat.bossHit();
  assert.equal(state.bossHP, 0);
  assert.equal(state.finished, true);
  assert.equal(state.xp, 800);
});
