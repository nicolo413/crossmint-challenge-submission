import { AstralObjectType } from '../value-objects/AstralObjectType';
import { SoloonColor } from '../value-objects/SoloonColor';
import { AstralObject } from './AstralObject';

export class Soloon extends AstralObject {
  readonly type = AstralObjectType.Soloon as const;

  constructor(readonly color: SoloonColor) {
    super();
  }

  equals(other: AstralObject): boolean {
    return other.type === AstralObjectType.Soloon && (other as Soloon).color === this.color;
  }
}
