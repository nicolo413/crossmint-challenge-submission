export enum ComethDirection {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

export function parseComethDirection(value: string): ComethDirection {
  const direction = value.toLowerCase();
  if (!Object.values(ComethDirection).includes(direction as ComethDirection)) {
    throw new Error(`Unknown ComethDirection: "${value}"`);
  }
  return direction as ComethDirection;
}
