import { AxiosInstance, isAxiosError } from 'axios';
import { MegaverseApiPort } from '../../domain/ports/MegaverseApiPort';
import { CurrentMap, RawCell } from '../../domain/models/CurrentMap';
import { GoalMap } from '../../domain/models/GoalMap';
import { Position } from '../../domain/value-objects/Position';
import { SoloonColor } from '../../domain/value-objects/SoloonColor';
import { ComethDirection } from '../../domain/value-objects/ComethDirection';
import { MegaverseApiError } from '../../domain/errors/MegaverseApiError';
import { classifyHttpStatus } from '../../domain/errors/ApiErrorClassification';

export class CrossmintApiAdapter implements MegaverseApiPort {
  constructor(private readonly http: AxiosInstance) {}

  async getCurrentMap(candidateId: string): Promise<CurrentMap> {
    const response = await this.request(
      () => this.http.get<{ map: { content: (RawCell | null)[][] } }>(`/map/${candidateId}`),
      'fetch current map',
    );
    return CurrentMap.fromApiResponse(response.data.map.content);
  }

  async getGoalMap(candidateId: string): Promise<GoalMap> {
    const response = await this.request(
      () => this.http.get<{ goal: string[][] }>(`/map/${candidateId}/goal`),
      'fetch goal map',
    );
    return GoalMap.fromApiResponse(response.data.goal);
  }

  async createPolyanet(candidateId: string, position: Position): Promise<void> {
    await this.request(
      () => this.http.post('/polyanets', this.body(candidateId, position)),
      'create polyanet',
      position,
    );
  }

  async deletePolyanet(candidateId: string, position: Position): Promise<void> {
    await this.request(
      () => this.http.delete('/polyanets', { data: this.body(candidateId, position) }),
      'delete polyanet',
      position,
    );
  }

  async createSoloon(candidateId: string, position: Position, color: SoloonColor): Promise<void> {
    await this.request(
      () => this.http.post('/soloons', { ...this.body(candidateId, position), color }),
      'create soloon',
      position,
    );
  }

  async deleteSoloon(candidateId: string, position: Position): Promise<void> {
    await this.request(
      () => this.http.delete('/soloons', { data: this.body(candidateId, position) }),
      'delete soloon',
      position,
    );
  }

  async createCometh(candidateId: string, position: Position, direction: ComethDirection): Promise<void> {
    await this.request(
      () => this.http.post('/comeths', { ...this.body(candidateId, position), direction }),
      'create cometh',
      position,
    );
  }

  async deleteCometh(candidateId: string, position: Position): Promise<void> {
    await this.request(
      () => this.http.delete('/comeths', { data: this.body(candidateId, position) }),
      'delete cometh',
      position,
    );
  }

  private body(candidateId: string, position: Position) {
    return { candidateId, row: position.row, column: position.column };
  }

  private async request<T>(fn: () => Promise<T>, context: string, position?: Position): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const posLabel = position ? ` at [${position.row},${position.column}]` : '';
      throw this.wrapError(`Failed to ${context}${posLabel}`, error);
    }
  }

  private wrapError(message: string, error: unknown): MegaverseApiError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      return new MegaverseApiError(`${message}: ${error.message}`, status, classifyHttpStatus(status));
    }
    return new MegaverseApiError(message, undefined, 'ambiguous');
  }
}
