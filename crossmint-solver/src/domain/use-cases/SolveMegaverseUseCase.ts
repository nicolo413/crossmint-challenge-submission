import { MegaverseApiPort } from '../ports/MegaverseApiPort';
import { LoggerPort } from '../ports/LoggerPort';
import { AstralObject } from '../models/AstralObject';
import { Soloon } from '../models/Soloon';
import { Cometh } from '../models/Cometh';
import { AstralObjectType } from '../value-objects/AstralObjectType';
import { Position } from '../value-objects/Position';
import { ProgressCallback } from '../value-objects/Progress';
import { MapDivergedError } from '../errors/MapDivergedError';
import { computeMapDiff } from '../value-objects/computeMapDiff';

export class SolveMegaverseUseCase {
  constructor(
    private readonly api: MegaverseApiPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(candidateId: string, onProgress?: ProgressCallback): Promise<void> {
    const log = this.logger.child({ candidateId });

    log.info('Fetching current and goal maps');
    const [currentMap, goalMap] = await Promise.all([
      this.api.getCurrentMap(candidateId),
      this.api.getGoalMap(candidateId),
    ]);

    const diff = computeMapDiff(currentMap, goalMap);
    const total = diff.toDelete.length + diff.toCreate.length;

    log.info('Diff computed', { toDelete: diff.toDelete.length, toCreate: diff.toCreate.length, total });

    if (total === 0) {
      log.info('Map already matches goal, nothing to do');
      return;
    }

    let completed = 0;
    const tick = (action: string, position: Position) => {
      completed++;
      log.debug(`${action} entity`, { position, completed, total });
      onProgress?.({ completed, total });
    };

    for (const entry of diff.toDelete) {
      await this.deleteEntity(candidateId, entry.position, entry.entity);
      tick('Deleted', entry.position);
    }

    for (const entry of diff.toCreate) {
      await this.createEntity(candidateId, entry.position, entry.entity);
      tick('Created', entry.position);
    }

    const postSolveMap = await this.api.getCurrentMap(candidateId);
    const residualDiff = computeMapDiff(postSolveMap, goalMap);
    const residualCount = residualDiff.toCreate.length + residualDiff.toDelete.length;
    if (residualCount > 0) {
      log.warn('Map diverged after solve — external modification detected', { residualCells: residualCount });
      throw new MapDivergedError(residualCount);
    }

    log.info('Solve complete and verified', { completed, total });
  }

  private async createEntity(candidateId: string, position: Position, entity: AstralObject): Promise<void> {
    switch (entity.type) {
      case AstralObjectType.Polyanet:
        return this.api.createPolyanet(candidateId, position);
      case AstralObjectType.Soloon:
        return this.api.createSoloon(candidateId, position, (entity as Soloon).color);
      case AstralObjectType.Cometh:
        return this.api.createCometh(candidateId, position, (entity as Cometh).direction);
    }
  }

  private async deleteEntity(candidateId: string, position: Position, entity: AstralObject): Promise<void> {
    switch (entity.type) {
      case AstralObjectType.Polyanet:
        return this.api.deletePolyanet(candidateId, position);
      case AstralObjectType.Soloon:
        return this.api.deleteSoloon(candidateId, position);
      case AstralObjectType.Cometh:
        return this.api.deleteCometh(candidateId, position);
    }
  }
}
