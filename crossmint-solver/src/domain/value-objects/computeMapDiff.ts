import { CurrentMap } from '../models/CurrentMap';
import { GoalMap } from '../models/GoalMap';
import { MapDiff, MapDiffEntry } from './MapDiff';
import { Position } from './Position';

export function computeMapDiff(current: CurrentMap, goal: GoalMap): MapDiff {
  const toCreate: MapDiffEntry[] = [];
  const toDelete: MapDiffEntry[] = [];

  const rows = Math.max(current.rows, goal.rows);
  const cols = Math.max(current.columns, goal.columns);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const position: Position = { row, column: col };
      const currentCell = current.cells[row]?.[col] ?? null;
      const goalCell = goal.cells[row]?.[col] ?? null;

      if (currentCell === null && goalCell === null) continue;

      if (currentCell !== null && goalCell === null) {
        toDelete.push({ position, entity: currentCell });
        continue;
      }

      if (currentCell === null && goalCell !== null) {
        toCreate.push({ position, entity: goalCell });
        continue;
      }

      if (currentCell !== null && goalCell !== null && !currentCell.equals(goalCell)) {
        toDelete.push({ position, entity: currentCell });
        toCreate.push({ position, entity: goalCell });
      }
    }
  }

  return { toCreate, toDelete };
}
