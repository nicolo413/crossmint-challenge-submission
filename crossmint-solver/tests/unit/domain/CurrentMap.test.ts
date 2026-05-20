import { CurrentMap } from '../../../src/domain/models/CurrentMap';
import { Polyanet } from '../../../src/domain/models/Polyanet';
import { Soloon } from '../../../src/domain/models/Soloon';
import { Cometh } from '../../../src/domain/models/Cometh';
import { SoloonColor } from '../../../src/domain/value-objects/SoloonColor';
import { ComethDirection } from '../../../src/domain/value-objects/ComethDirection';

describe('CurrentMap.fromApiResponse', () => {
  it('parses null cells as null', () => {
    const map = CurrentMap.fromApiResponse([[null]]);
    expect(map.cells[0][0]).toBeNull();
  });

  it('parses type 0 as Polyanet', () => {
    const map = CurrentMap.fromApiResponse([[{ type: 0 }]]);
    expect(map.cells[0][0]).toBeInstanceOf(Polyanet);
  });

  it('parses type 1 with color as Soloon', () => {
    const map = CurrentMap.fromApiResponse([[{ type: 1, color: 'blue' }]]);
    const cell = map.cells[0][0];
    expect(cell).toBeInstanceOf(Soloon);
    expect((cell as Soloon).color).toBe(SoloonColor.Blue);
  });

  it('parses type 2 with direction as Cometh', () => {
    const map = CurrentMap.fromApiResponse([[{ type: 2, direction: 'up' }]]);
    const cell = map.cells[0][0];
    expect(cell).toBeInstanceOf(Cometh);
    expect((cell as Cometh).direction).toBe(ComethDirection.Up);
  });

  it('returns null for unknown type', () => {
    const map = CurrentMap.fromApiResponse([[{ type: 99 }]]);
    expect(map.cells[0][0]).toBeNull();
  });

  it('exposes correct row and column counts', () => {
    const map = CurrentMap.fromApiResponse([
      [null, { type: 0 }],
      [null, null],
    ]);
    expect(map.rows).toBe(2);
    expect(map.columns).toBe(2);
  });
});
