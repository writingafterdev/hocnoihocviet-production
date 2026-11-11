/** Chart colours: the brand's, so every chart reads as part of the app. */
export const CHART = {
  ink: '#171717',
  soft: '#737373',
  grid: '#E9E9EC',
  track: '#F1F2F6',
  blue: '#2F62C4',
  blueMid: '#77A1DD',
  blueSoft: '#C7D8F3',
  tomato: '#FF5C33',
  leaf: '#2D881A',
  sun: '#FFC73C',
  blush: '#FFA0C1',
  violet: '#8B5CF6',
} as const;

export const SERIES = [CHART.blue, CHART.tomato, CHART.leaf, CHART.sun, CHART.blush, CHART.violet];
