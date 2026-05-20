import { AstralObjectType } from '../value-objects/AstralObjectType';

export abstract class AstralObject {
  abstract readonly type: AstralObjectType;
  abstract equals(other: AstralObject): boolean;
}
