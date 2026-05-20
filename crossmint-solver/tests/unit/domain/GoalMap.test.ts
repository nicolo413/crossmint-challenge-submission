import { GoalMap } from '../../../src/domain/models/GoalMap';
import { Polyanet } from '../../../src/domain/models/Polyanet';
import { Soloon } from '../../../src/domain/models/Soloon';
import { Cometh } from '../../../src/domain/models/Cometh';
import { SoloonColor } from '../../../src/domain/value-objects/SoloonColor';
import { ComethDirection } from '../../../src/domain/value-objects/ComethDirection';
import { InvalidGoalMapError } from '../../../src/domain/errors/InvalidGoalMapError';

describe('GoalMap.fromApiResponse', () => {
  it('parses SPACE as null', () => {
    const map = GoalMap.fromApiResponse([['SPACE']]);
    expect(map.cells[0][0]).toBeNull();
  });

  it('parses POLYANET as Polyanet instance', () => {
    const map = GoalMap.fromApiResponse([['POLYANET']]);
    expect(map.cells[0][0]).toBeInstanceOf(Polyanet);
  });

  it('parses colored SOLOONs correctly', () => {
    const cases: [string, SoloonColor][] = [
      ['BLUE_SOLOON', SoloonColor.Blue],
      ['RED_SOLOON', SoloonColor.Red],
      ['PURPLE_SOLOON', SoloonColor.Purple],
      ['WHITE_SOLOON', SoloonColor.White],
    ];

    for (const [cell, expectedColor] of cases) {
      const map = GoalMap.fromApiResponse([[cell]]);
      const entity = map.cells[0][0];
      expect(entity).toBeInstanceOf(Soloon);
      expect((entity as Soloon).color).toBe(expectedColor);
    }
  });

  it('parses directional COMETHs correctly', () => {
    const cases: [string, ComethDirection][] = [
      ['UP_COMETH', ComethDirection.Up],
      ['DOWN_COMETH', ComethDirection.Down],
      ['LEFT_COMETH', ComethDirection.Left],
      ['RIGHT_COMETH', ComethDirection.Right],
    ];

    for (const [cell, expectedDirection] of cases) {
      const map = GoalMap.fromApiResponse([[cell]]);
      const entity = map.cells[0][0];
      expect(entity).toBeInstanceOf(Cometh);
      expect((entity as Cometh).direction).toBe(expectedDirection);
    }
  });

  it('throws InvalidGoalMapError for unknown cell values', () => {
    expect(() => GoalMap.fromApiResponse([['UNKNOWN_ENTITY']])).toThrow(InvalidGoalMapError);
  });

  it('exposes correct row and column counts', () => {
    const map = GoalMap.fromApiResponse([
      ['SPACE', 'POLYANET'],
      ['SPACE', 'SPACE'],
      ['SPACE', 'SPACE'],
    ]);
    expect(map.rows).toBe(3);
    expect(map.columns).toBe(2);
  });
});
