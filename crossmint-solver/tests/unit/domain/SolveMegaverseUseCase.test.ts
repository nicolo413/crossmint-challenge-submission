import { SolveMegaverseUseCase } from '../../../src/domain/use-cases/SolveMegaverseUseCase';
import { MegaverseApiPort } from '../../../src/domain/ports/MegaverseApiPort';
import { nullLogger } from '../../helpers/nullLogger';
import { CurrentMap } from '../../../src/domain/models/CurrentMap';
import { GoalMap } from '../../../src/domain/models/GoalMap';
import { Polyanet } from '../../../src/domain/models/Polyanet';
import { Soloon } from '../../../src/domain/models/Soloon';
import { SoloonColor } from '../../../src/domain/value-objects/SoloonColor';
import { ComethDirection } from '../../../src/domain/value-objects/ComethDirection';
import { Cometh } from '../../../src/domain/models/Cometh';
import { MapDivergedError } from '../../../src/domain/errors/MapDivergedError';

function makeEmptyMap(rows: number, cols: number): CurrentMap {
  return new CurrentMap(Array.from({ length: rows }, () => Array(cols).fill(null)));
}

describe('SolveMegaverseUseCase.execute', () => {
  const candidateId = 'test-candidate';

  beforeEach(() => jest.clearAllMocks());

  const mockApi: jest.Mocked<MegaverseApiPort> = {
    getCurrentMap: jest.fn(),
    getGoalMap: jest.fn(),
    createPolyanet: jest.fn().mockResolvedValue(undefined),
    deletePolyanet: jest.fn().mockResolvedValue(undefined),
    createSoloon: jest.fn().mockResolvedValue(undefined),
    deleteSoloon: jest.fn().mockResolvedValue(undefined),
    createCometh: jest.fn().mockResolvedValue(undefined),
    deleteCometh: jest.fn().mockResolvedValue(undefined),
  };

  const useCase = new SolveMegaverseUseCase(mockApi, nullLogger);

  it('calls create APIs for each missing entity', async () => {
    mockApi.getCurrentMap
      .mockResolvedValueOnce(makeEmptyMap(1, 1))
      .mockResolvedValueOnce(new CurrentMap([[new Polyanet()]])); // verification: matches goal
    mockApi.getGoalMap.mockResolvedValue(GoalMap.fromApiResponse([['POLYANET']]));

    await useCase.execute(candidateId);

    expect(mockApi.createPolyanet).toHaveBeenCalledWith(candidateId, { row: 0, column: 0 });
  });

  it('calls progress callback for each operation', async () => {
    mockApi.getCurrentMap
      .mockResolvedValueOnce(makeEmptyMap(1, 2))
      .mockResolvedValueOnce(new CurrentMap([[new Polyanet(), new Soloon(SoloonColor.Blue)]])); // verification
    mockApi.getGoalMap.mockResolvedValue(GoalMap.fromApiResponse([['POLYANET', 'BLUE_SOLOON']]));

    const progress: number[] = [];
    await useCase.execute(candidateId, (p) => progress.push(p.completed));

    expect(progress).toEqual([1, 2]);
  });

  it('fires delete before create when a cell changes type', async () => {
    const callOrder: string[] = [];
    mockApi.getCurrentMap
      .mockResolvedValueOnce(new CurrentMap([[new Soloon(SoloonColor.Blue)]]))
      .mockResolvedValueOnce(new CurrentMap([[new Cometh(ComethDirection.Up)]])); // verification
    mockApi.getGoalMap.mockResolvedValue(GoalMap.fromApiResponse([['UP_COMETH']]));
    mockApi.deleteSoloon.mockImplementation(async () => {
      callOrder.push('delete');
    });
    mockApi.createCometh.mockImplementation(async () => {
      callOrder.push('create');
    });

    await useCase.execute(candidateId);

    expect(callOrder).toEqual(['delete', 'create']);
  });

  it('resolves normally when post-solve verification confirms map matches goal', async () => {
    mockApi.getCurrentMap
      .mockResolvedValueOnce(makeEmptyMap(1, 1))
      .mockResolvedValueOnce(new CurrentMap([[new Polyanet()]]));
    mockApi.getGoalMap.mockResolvedValue(GoalMap.fromApiResponse([['POLYANET']]));

    await expect(useCase.execute(candidateId)).resolves.toBeUndefined();
  });

  it('throws MapDivergedError when post-solve verification finds unexpected divergence', async () => {
    mockApi.getCurrentMap.mockResolvedValueOnce(makeEmptyMap(1, 1)).mockResolvedValueOnce(makeEmptyMap(1, 1)); // still empty after we created — external agent removed it
    mockApi.getGoalMap.mockResolvedValue(GoalMap.fromApiResponse([['POLYANET']]));

    await expect(useCase.execute(candidateId)).rejects.toBeInstanceOf(MapDivergedError);
  });
});
