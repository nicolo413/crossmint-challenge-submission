import { AstralObject } from '../models/AstralObject';
import { Polyanet } from '../models/Polyanet';
import { Soloon } from '../models/Soloon';
import { Cometh } from '../models/Cometh';
import { parseSoloonColor } from '../value-objects/SoloonColor';
import { parseComethDirection } from '../value-objects/ComethDirection';
import { InvalidGoalMapError } from '../errors/InvalidGoalMapError';

export type GoalCell = AstralObject | null;

const SPACE = 'SPACE';
const POLYANET = 'POLYANET';
const SOLOON_SUFFIX = '_SOLOON';
const COMETH_SUFFIX = '_COMETH';

function parseGoalCell(raw: string, row: number, column: number): GoalCell {
  if (raw === SPACE) return null;
  if (raw === POLYANET) return new Polyanet();

  if (raw.endsWith(SOLOON_SUFFIX)) {
    const colorPart = raw.slice(0, -SOLOON_SUFFIX.length);
    return new Soloon(parseSoloonColor(colorPart));
  }

  if (raw.endsWith(COMETH_SUFFIX)) {
    const directionPart = raw.slice(0, -COMETH_SUFFIX.length);
    return new Cometh(parseComethDirection(directionPart));
  }

  throw new InvalidGoalMapError(raw, row, column);
}

export class GoalMap {
  constructor(readonly cells: ReadonlyArray<ReadonlyArray<GoalCell>>) {}

  get rows(): number {
    return this.cells.length;
  }

  get columns(): number {
    return this.cells[0]?.length ?? 0;
  }

  static fromApiResponse(goal: string[][]): GoalMap {
    const cells = goal.map((row, rowIdx) => row.map((cell, colIdx) => parseGoalCell(cell, rowIdx, colIdx)));
    return new GoalMap(cells);
  }
}
