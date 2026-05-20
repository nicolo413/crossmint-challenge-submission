import { AstralObject } from '../models/AstralObject';
import { Position } from './Position';

export interface MapDiffEntry {
  position: Position;
  entity: AstralObject;
}

export interface MapDiff {
  readonly toCreate: readonly MapDiffEntry[];
  readonly toDelete: readonly MapDiffEntry[];
}
