import axios from 'axios';
import { CrossmintApiAdapter } from '../../../src/infrastructure/http/CrossmintApiAdapter';
import { SoloonColor } from '../../../src/domain/value-objects/SoloonColor';
import { ComethDirection } from '../../../src/domain/value-objects/ComethDirection';
import { MegaverseApiError } from '../../../src/domain/errors/MegaverseApiError';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CrossmintApiAdapter', () => {
  const candidateId = 'test-candidate';
  const position = { row: 1, column: 2 };

  let httpClient: jest.Mocked<ReturnType<typeof axios.create>>;
  let adapter: CrossmintApiAdapter;

  beforeEach(() => {
    httpClient = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ReturnType<typeof axios.create>>;

    mockedAxios.create.mockReturnValue(httpClient as ReturnType<typeof axios.create>);
    adapter = new CrossmintApiAdapter(httpClient as ReturnType<typeof axios.create>);
  });

  describe('getCurrentMap', () => {
    it('fetches and parses the current map', async () => {
      httpClient.get.mockResolvedValue({
        data: { map: { content: [[null, { type: 0 }]] } },
      });

      const map = await adapter.getCurrentMap(candidateId);
      expect(httpClient.get).toHaveBeenCalledWith(`/map/${candidateId}`);
      expect(map.cells[0][0]).toBeNull();
      expect(map.cells[0][1]).not.toBeNull();
    });

    it('wraps HTTP errors as MegaverseApiError', async () => {
      const axiosError = Object.assign(new Error('Network error'), {
        isAxiosError: true,
        response: { status: 503 },
      });
      httpClient.get.mockRejectedValue(axiosError);

      await expect(adapter.getCurrentMap(candidateId)).rejects.toBeInstanceOf(MegaverseApiError);
    });
  });

  describe('getGoalMap', () => {
    it('fetches and parses the goal map', async () => {
      httpClient.get.mockResolvedValue({
        data: { goal: [['POLYANET', 'SPACE']] },
      });

      const map = await adapter.getGoalMap(candidateId);
      expect(httpClient.get).toHaveBeenCalledWith(`/map/${candidateId}/goal`);
      expect(map.cells[0][0]).not.toBeNull();
      expect(map.cells[0][1]).toBeNull();
    });
  });

  describe('createPolyanet', () => {
    it('posts with correct body', async () => {
      httpClient.post.mockResolvedValue({});
      await adapter.createPolyanet(candidateId, position);
      expect(httpClient.post).toHaveBeenCalledWith('/polyanets', {
        candidateId,
        row: 1,
        column: 2,
      });
    });
  });

  describe('deletePolyanet', () => {
    it('sends delete with correct body', async () => {
      httpClient.delete.mockResolvedValue({});
      await adapter.deletePolyanet(candidateId, position);
      expect(httpClient.delete).toHaveBeenCalledWith('/polyanets', {
        data: { candidateId, row: 1, column: 2 },
      });
    });
  });

  describe('createSoloon', () => {
    it('posts with correct body including color', async () => {
      httpClient.post.mockResolvedValue({});
      await adapter.createSoloon(candidateId, position, SoloonColor.Blue);
      expect(httpClient.post).toHaveBeenCalledWith('/soloons', {
        candidateId,
        row: 1,
        column: 2,
        color: 'blue',
      });
    });
  });

  describe('createCometh', () => {
    it('posts with correct body including direction', async () => {
      httpClient.post.mockResolvedValue({});
      await adapter.createCometh(candidateId, position, ComethDirection.Up);
      expect(httpClient.post).toHaveBeenCalledWith('/comeths', {
        candidateId,
        row: 1,
        column: 2,
        direction: 'up',
      });
    });
  });
});
