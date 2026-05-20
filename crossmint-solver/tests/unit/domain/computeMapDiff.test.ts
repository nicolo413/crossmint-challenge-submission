import { computeMapDiff } from '../../../src/domain/value-objects/computeMapDiff';
import { CurrentMap } from '../../../src/domain/models/CurrentMap';
import { GoalMap } from '../../../src/domain/models/GoalMap';
import { Polyanet } from '../../../src/domain/models/Polyanet';
import { Soloon } from '../../../src/domain/models/Soloon';
import { SoloonColor } from '../../../src/domain/value-objects/SoloonColor';
import { ComethDirection } from '../../../src/domain/value-objects/ComethDirection';
import { Cometh } from '../../../src/domain/models/Cometh';

function makeEmptyMap(rows: number, cols: number): CurrentMap {
  return new CurrentMap(Array.from({ length: rows }, () => Array(cols).fill(null)));
}

function makeGoalMap(cells: (string | null)[][]): GoalMap {
  const stringCells = cells.map((row) => row.map((c) => c ?? 'SPACE'));
  return GoalMap.fromApiResponse(stringCells);
}

describe('computeMapDiff', () => {
  it('produces no diff when maps are identical (both empty)', () => {
    const diff = computeMapDiff(
      makeEmptyMap(2, 2),
      makeGoalMap([
        ['SPACE', 'SPACE'],
        ['SPACE', 'SPACE'],
      ]),
    );
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.toDelete).toHaveLength(0);
  });

  it('creates entities present in goal but not in current', () => {
    const diff = computeMapDiff(makeEmptyMap(1, 2), makeGoalMap([['POLYANET', 'SPACE']]));
    expect(diff.toCreate).toHaveLength(1);
    expect(diff.toCreate[0].entity).toBeInstanceOf(Polyanet);
    expect(diff.toCreate[0].position).toEqual({ row: 0, column: 0 });
    expect(diff.toDelete).toHaveLength(0);
  });

  it('deletes entities in current but absent from goal', () => {
    const diff = computeMapDiff(new CurrentMap([[new Polyanet(), null]]), makeGoalMap([['SPACE', 'SPACE']]));
    expect(diff.toDelete).toHaveLength(1);
    expect(diff.toDelete[0].entity).toBeInstanceOf(Polyanet);
    expect(diff.toCreate).toHaveLength(0);
  });

  it('leaves identical cells unchanged', () => {
    const diff = computeMapDiff(new CurrentMap([[new Polyanet()]]), makeGoalMap([['POLYANET']]));
    expect(diff.toCreate).toHaveLength(0);
    expect(diff.toDelete).toHaveLength(0);
  });

  it('replaces a changed cell (delete old + create new)', () => {
    const diff = computeMapDiff(
      new CurrentMap([[new Soloon(SoloonColor.Blue)]]),
      makeGoalMap([['RED_SOLOON']]),
    );
    expect(diff.toDelete).toHaveLength(1);
    expect(diff.toCreate).toHaveLength(1);
    expect((diff.toCreate[0].entity as Soloon).color).toBe(SoloonColor.Red);
  });

  it('handles mixed operations across a multi-cell map', () => {
    const current = new CurrentMap([
      [new Polyanet(), null],
      [null, new Cometh(ComethDirection.Up)],
    ]);
    const goal = makeGoalMap([
      ['POLYANET', 'BLUE_SOLOON'],
      ['SPACE', 'SPACE'],
    ]);
    const diff = computeMapDiff(current, goal);
    expect(diff.toCreate).toHaveLength(1);
    expect(diff.toCreate[0].entity).toBeInstanceOf(Soloon);
    expect(diff.toDelete).toHaveLength(1);
    expect(diff.toDelete[0].entity).toBeInstanceOf(Cometh);
  });
});
