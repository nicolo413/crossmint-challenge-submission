export enum SoloonColor {
  Blue = 'blue',
  Red = 'red',
  Purple = 'purple',
  White = 'white',
}

export function parseSoloonColor(value: string): SoloonColor {
  const color = value.toLowerCase();
  if (!Object.values(SoloonColor).includes(color as SoloonColor)) {
    throw new Error(`Unknown SoloonColor: "${value}"`);
  }
  return color as SoloonColor;
}
