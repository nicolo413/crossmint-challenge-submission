import { AstralObjectType } from '../value-objects/AstralObjectType';
import { AstralObject } from './AstralObject';

export class Polyanet extends AstralObject {
  readonly type = AstralObjectType.Polyanet as const;

  equals(other: AstralObject): boolean {
    return other.type === AstralObjectType.Polyanet;
  }
}
