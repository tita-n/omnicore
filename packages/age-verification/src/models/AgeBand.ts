export enum AgeBand {
  UNKNOWN = 'UNKNOWN',
  AGE_13_15 = 'AGE_13_15',
  AGE_16_17 = 'AGE_16_17',
  AGE_18_20 = 'AGE_18_20',
  AGE_21_PLUS = 'AGE_21_PLUS',
}

export function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === 'string' && Object.values(AgeBand).includes(value as AgeBand);
}

export function ageBandFromNumber(age: number): AgeBand {
  if (age < 13) return AgeBand.UNKNOWN;
  if (age <= 15) return AgeBand.AGE_13_15;
  if (age <= 17) return AgeBand.AGE_16_17;
  if (age <= 20) return AgeBand.AGE_18_20;
  return AgeBand.AGE_21_PLUS;
}

export function ageBandToRange(band: AgeBand): { min: number; max: number | null } {
  switch (band) {
    case AgeBand.AGE_13_15:
      return { min: 13, max: 15 };
    case AgeBand.AGE_16_17:
      return { min: 16, max: 17 };
    case AgeBand.AGE_18_20:
      return { min: 18, max: 20 };
    case AgeBand.AGE_21_PLUS:
      return { min: 21, max: null };
    default:
      return { min: 0, max: null };
  }
}