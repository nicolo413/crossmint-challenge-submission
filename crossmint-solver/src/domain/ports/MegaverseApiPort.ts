import { CurrentMap } from '../models/CurrentMap';
import { GoalMap } from '../models/GoalMap';
import { Position } from '../value-objects/Position';
import { SoloonColor } from '../value-objects/SoloonColor';
import { ComethDirection } from '../value-objects/ComethDirection';

export interface MegaverseApiPort {
  getCurrentMap(candidateId: string): Promise<CurrentMap>;
  getGoalMap(candidateId: string): Promise<GoalMap>;

  createPolyanet(candidateId: string, position: Position): Promise<void>;
  deletePolyanet(candidateId: string, position: Position): Promise<void>;

  createSoloon(candidateId: string, position: Position, color: SoloonColor): Promise<void>;
  deleteSoloon(candidateId: string, position: Position): Promise<void>;

  createCometh(candidateId: string, position: Position, direction: ComethDirection): Promise<void>;
  deleteCometh(candidateId: string, position: Position): Promise<void>;
}
