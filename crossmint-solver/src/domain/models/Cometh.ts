import { AstralObjectType } from '../value-objects/AstralObjectType';
import { ComethDirection } from '../value-objects/ComethDirection';
import { AstralObject } from './AstralObject';

export class Cometh extends AstralObject {
  readonly type = AstralObjectType.Cometh as const;

  constructor(readonly direction: ComethDirection) {
    super();
  }

  equals(other: AstralObject): boolean {
    return other.type === AstralObjectType.Cometh && (other as Cometh).direction === this.direction;
  }
}
