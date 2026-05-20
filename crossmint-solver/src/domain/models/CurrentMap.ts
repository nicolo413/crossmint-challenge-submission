import { AstralObject } from '../models/AstralObject';
import { Polyanet } from '../models/Polyanet';
import { Soloon } from '../models/Soloon';
import { Cometh } from '../models/Cometh';
import { AstralObjectType } from '../value-objects/AstralObjectType';
import { parseSoloonColor } from '../value-objects/SoloonColor';
import { parseComethDirection } from '../value-objects/ComethDirection';

export interface RawCell {
  type: number;
  color?: string;
  direction?: string;
}

export type CurrentCell = AstralObject | null;

function parseCurrentCell(raw: RawCell | null): CurrentCell {
  if (raw === null) return null;

  switch (raw.type) {
    case AstralObjectType.Polyanet:
      return new Polyanet();
    case AstralObjectType.Soloon:
      return new Soloon(parseSoloonColor(raw.color ?? ''));
    case AstralObjectType.Cometh:
      return new Cometh(parseComethDirection(raw.direction ?? ''));
    default:
      return null;
  }
}

export class CurrentMap {
  constructor(readonly cells: ReadonlyArray<ReadonlyArray<CurrentCell>>) {}

  get rows(): number {
    return this.cells.length;
  }

  get columns(): number {
    return this.cells[0]?.length ?? 0;
  }

  static fromApiResponse(content: (RawCell | null)[][]): CurrentMap {
    const cells = content.map((row) => row.map((cell) => parseCurrentCell(cell)));
    return new CurrentMap(cells);
  }
}
