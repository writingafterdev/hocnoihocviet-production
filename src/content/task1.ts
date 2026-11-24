/**
 * Task 1 prompt library (Academic charts), stored in one general form so the checks work on any chart:
 * a prompt has parts (a chart or a table); each part is items × one axis (ordered, like years, or not, like sports).
 *
 * Source: youpass.vn's Task 1 bank. The prompt text is kept exactly as written there; the numbers are read from their
 * images and the charts are redrawn in our own style. Line graphs, bar charts and pie charts so far.
 */

export interface T1Item { id: string; name: string; color: string; initial: string }
export interface T1Axis {
  /** What the axis is, in Vietnamese ("năm", "tháng", "môn"): used in feedback ("ở mọi năm"). */
  name: string;
  /** Years and months are ordered (trends make sense); sports or countries are not. */
  ordered: boolean;
  /** "in" (in 2005) or "for" (for Fishing); empty when the axis has one blank column. */
  prep: string;
  labels: string[];
  /** English labels for sentences, when they differ (Jan → January). */
  en?: string[];
  /** Which labels to print under a line chart (all when missing). */
  show?: number[];
}
export interface T1Part {
  id: string;
  title: string;
  kind: 'line' | 'bars' | 'pies' | 'table';
  /** Vietnamese unit after a number ("%", " triệu tấn"), and the English one for sentences. */
  unit: string;
  unitEn: string;
  /** How big a change still counts as "about the same". */
  tol: number;
  max?: number;
  step?: number;
  items: T1Item[];
  axis: T1Axis;
  /** item id → one value per axis label; null = no figure (the item did not exist yet). */
  data: Record<string, (number | null)[]>;
  /** The numbers are shares of a whole (pies, percentages of one group). */
  share?: boolean;
  /** Index of a column that is the total of the others. */
  total?: number;
  /** Computed from another part (a growth-rate column). */
  derived?: string;
  /** This part breaks down one item of another part (fresh water of all water). */
  parent?: { part: string; item: string };
}
export interface T1Prompt {
  id: string;
  /** "Line Graph", "Bar Chart"… as in CATEGORIES_TASK1. */
  category: string;
  title: string;
  source: string;
  text: string;
  parts: T1Part[];
}

const C = { blue: '#2F62C4', lblue: '#77A1DD', tomato: '#D2401B', sun: '#E9A21F', leaf: '#2D881A', teal: '#5FAF9F', navy: '#1F3F8A', gray: '#A3A3A3', berry: '#B0306A' };
const it = (id: string, name: string, color: string): T1Item => ({ id, name, color, initial: name.replace(/[^A-Za-z0-9]/g, '').charAt(0).toUpperCase() || '#' });
// The closing sentence as YouPass writes it: two spellings, kept as each prompt has it.
const END = ' Summarise the information by selecting and reporting the main features, and make comparisons where relevant.';
const END_Z = ' Summarize the information by selecting and reporting the main features and make comparisons where relevant.';
const YP = 'YouPass';

export const TASK1_PROMPTS: T1Prompt[] = [
  {
    id: 't1-cinema', category: 'Line Graph', title: 'Going to the cinema', source: YP + ' · 24/02/2024',
    text: 'The graph shows the percentage of people visiting the cinema once a month or more between 1984 to 2003 (4 age groups).' + END,
    parts: [{
      id: 'a', title: 'Visiting the cinema once a month or more (%)', kind: 'line', unit: '%', unitEn: '%', tol: 2, max: 60, step: 10,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1984', '1986', '1988', '1990', '1992', '1994', '1996', '1998', '2000', '2001', '2002', '2003'], show: [0, 2, 4, 6, 8, 9, 10, 11] },
      items: [it('y1524', '15-24', C.tomato), it('y714', '7-14', C.leaf), it('y2535', '25-35', C.lblue), it('y35', '35 and over', C.sun)],
      data: { y1524: [16, 25, 25.5, 28, 33.5, 44.5, 35, 50, 37, 51.5, 57, 52.5], y714: [11, 15, 12, 12, 17, 14, 20, 30, 24.5, 33, 38, 31], y2535: [4.5, 7.5, 7, 9.5, 11, 14.5, 19, 25, 18, 32.5, 24, 30], y35: [1.5, 2.5, 1.5, 2.5, 3.5, 4, 5, 7.5, 6, 10, 11, 13.5] },
    }],
  },
  {
    id: 't1-china-food', category: 'Line Graph', title: 'Food consumption in China, 1985–2010', source: YP + ' · Collect',
    text: 'The graph shows the changes in food consumption by Chinese people between 1985 and 2010.' + END_Z,
    parts: [{
      id: 'a', title: 'Food consumption by Chinese people (grams per person per week)', kind: 'line', unit: ' gram', unitEn: ' grams', tol: 15, max: 900, step: 100,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1985', '1990', '1995', '2000', '2005', '2010'] },
      items: [it('fish', 'Fish', C.blue), it('salt', 'Salt', C.tomato), it('meat', 'Meat', C.sun)],
      data: { fish: [600, 700, 600, 700, 750, 850], salt: [490, 440, 360, 300, 250, 200], meat: [100, 130, 155, 185, 195, 200] },
    }],
  },
  {
    id: 't1-uk-forest', category: 'Line Graph', title: 'UK forest industry production, 1980–2000', source: YP + ' · Collect',
    text: 'The line graph below shows the production of paper, wood pulp and sawn-wood in the UK from 1980 to 2000.' + END_Z,
    parts: [{
      id: 'a', title: 'Production of the forest industry in the UK (million tonnes)', kind: 'line', unit: ' triệu tấn', unitEn: ' million tonnes', tol: 6, max: 400, step: 50,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1980', '1990', '2000'] },
      items: [it('paper', 'Paper & Packaging', C.blue), it('sawn', 'Sawn-wood', C.tomato), it('pulp', 'Wood pulp', C.leaf)],
      data: { paper: [230, 250, 350], sawn: [195, 150, 125], pulp: [170, 150, 160] },
    }],
  },
  {
    id: 't1-women-work', category: 'Line Graph', title: 'Women aged 15-64 in employment, 2003–2009', source: YP + ' · Collect',
    text: 'The line graph below gives information about the percentage of women aged 15-64 in employment between 2003 and 2009.' + END,
    parts: [{
      id: 'a', title: 'Women aged 15-64 in employment (%)', kind: 'line', unit: '%', unitEn: '%', tol: 1.5, max: 90, step: 10,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['2003', '2005', '2007', '2009'] },
      items: [it('iceland', 'Iceland', C.navy), it('canada', 'Canada', C.tomato), it('germany', 'Germany', C.leaf), it('chile', 'Chile', C.berry), it('turkey', 'Turkey', C.sun)],
      data: { iceland: [81, 81, 81, 78], canada: [69, 69, 70, 70], germany: [59, 60, 62, 65], chile: [35, 39, 40, 41], turkey: [25, 22, 23, 25] },
    }],
  },
  {
    id: 't1-household-devices', category: 'Line Graph', title: 'Households owning electronic devices, 1995–2015', source: YP + ' · Actual Test',
    text: 'The graph below shows the percentage of households owning four types of electronic devices between 1995 and 2015.' + END_Z,
    parts: [{
      id: 'a', title: 'Households owning four types of electronic devices (%)', kind: 'line', unit: '%', unitEn: '%', tol: 3, max: 100, step: 20,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1995', '2000', '2005', '2010', '2015'] },
      items: [it('mp3', 'MP3 player', C.tomato), it('mobile', 'Mobile', C.leaf), it('computer', 'Computer', C.navy), it('tablet', 'Tablet', C.sun)],
      data: { mp3: [15, 23, 25, 28, 30], mobile: [8, 60, 70, 85, 95], computer: [8, 18, 44, 72, 92], tablet: [null, 2, 10, 62, 80] },
    }],
  },
  {
    id: 't1-fruit-veg', category: 'Bar Chart', title: 'Five portions of fruit and vegetables a day, UK, 2001–2008', source: YP + ' · Collect',
    text: 'The bar chart shows the percentage of people who ate five portions of fruits and vegetables per day in the UK from 2001 to 2008.' + END_Z,
    parts: [{
      id: 'a', title: 'People eating five portions a day, UK (%)', kind: 'bars', unit: '%', unitEn: '%', tol: 1.5, max: 40, step: 10,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008'] },
      items: [it('children', 'Children', C.sun), it('men', 'Men', C.blue), it('women', 'Women', C.tomato)],
      data: { children: [12, 12, 12, 17, 18, 22, 27, 24], men: [17, 17, 17, 20, 23, 27, 27, 26], women: [22, 24, 27, 28, 30, 35, 31, 30] },
    }],
  },
  {
    id: 't1-sports-males', category: 'Bar Chart', title: 'Young men watching or playing six sports', source: YP + ' · IELTS Insights Aug 26',
    text: 'The graph shows the percentage of males aged 16-25 in a particular country who prefer watching sports to males who prefer participating in sports. Summarise the information by selecting and reporting the main features and make comparisons where relevant.',
    parts: [{
      id: 'a', title: 'Males aged 16-25 who prefer watching or participating (%)', kind: 'bars', unit: '%', unitEn: '%', tol: 2, max: 60, step: 10,
      axis: { name: 'môn', ordered: false, prep: 'for', labels: ['Football', 'Rugby', 'Basketball', 'Badminton', 'Fishing', 'Horse riding'] },
      items: [it('watch', 'Watching', C.blue), it('play', 'Participating', C.sun)],
      data: { watch: [45, 30, 37.5, 29, 15, 45], play: [10, 20, 25, 25, 50, 18] },
    }],
  },
  {
    id: 't1-music-sales', category: 'Pie Chart', title: 'US music album sales by genre, 2008–2010', source: YP + ' · Collect',
    text: 'The pie charts below show the percentage of US music album sales by genre in 2008, 2009, and 2010.' + END_Z,
    parts: [{
      id: 'a', title: 'US music album sales by genre (%)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['2008', '2009', '2010'] },
      items: [it('country', 'Country', C.lblue), it('rnb', 'R&B', C.teal), it('rock', 'Rock', C.tomato), it('alt', 'Alternative', C.sun), it('jazz', 'Jazz', C.navy)],
      data: { country: [13, 16, 18], rnb: [22, 22, 19], rock: [39, 39, 40], alt: [23, 20, 20], jazz: [3, 3, 3] },
    }],
  },
  {
    id: 't1-car-sales', category: 'Pie Chart', title: 'New car sales in Australia, 1994–2013', source: YP + ' · Collect',
    text: 'The pie charts show the sales of new cars in Australia in 1994, 2004, and 2013. Summarize the information by selecting and reporting the main points and make comparisons where relevant.',
    parts: [{
      id: 'a', title: 'New car sales in Australia in April (%) · total 42,900 (1994), 71,000 (2004), 85,000 (2013)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1994', '2004', '2013'] },
      items: [it('suv', 'SUVs', C.navy), it('sedan', 'Sedans', C.tomato), it('other', 'Others', C.sun)],
      data: { suv: [7, 17, 17], sedan: [74, 62, 51], other: [19, 21, 32] },
    }],
  },
  {
    id: 't1-europe-spending', category: 'Pie Chart', title: 'Spending in a European country, 1958 and 2008', source: YP + ' · Collect',
    text: 'The charts below show the proportion of people’s total spending in a particular European country was spent on different commodities and services in 1958 and in 2008.' + END,
    parts: [{
      id: 'a', title: 'Share of total spending (%)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1958', '2008'] },
      items: [it('housing', 'Housing', C.tomato), it('food', 'Food', C.leaf), it('clothing', 'Clothing', C.sun), it('travel', 'Travel/transport', C.lblue), it('fun', 'Entertainment', C.berry), it('luxury', 'Luxury goods', C.navy)],
      data: { housing: [22, 32], food: [32, 12], clothing: [18, 16], travel: [8, 17], fun: [13, 6], luxury: [7, 17] },
    }],
  },
  {
    id: 't1-charity-money', category: 'Pie Chart', title: 'A US children’s charity: money in and money out', source: YP + ' · Collect',
    text: 'The pie chart shows the amount of money that a children’s charity located in the USA spent and received in one year.' + END,
    parts: [
      {
        id: 'a', title: 'Revenue sources (%) · total $53,561,580', kind: 'pies', unit: '%', unitEn: '%', tol: 0.5, share: true,
        axis: { name: '', ordered: false, prep: '', labels: [''] },
        items: [it('food', 'Donated food', C.leaf), it('community', 'Community contributions', C.tomato), it('program', 'Program revenue', C.sun), it('other', 'Other income', C.lblue), it('grants', 'Government grants', C.navy), it('invest', 'Investment income', C.berry)],
        data: { food: [86.6], community: [10.4], program: [2.2], other: [0.4], grants: [0.2], invest: [0.2] },
      },
      {
        id: 'b', title: 'Expenditures (%) · total $53,224,896', kind: 'pies', unit: '%', unitEn: '%', tol: 0.5, share: true,
        axis: { name: '', ordered: false, prep: '', labels: [''] },
        items: [it('services', 'Program services', C.leaf), it('fundraising', 'Fundraising', C.tomato), it('management', 'Management and general', C.navy)],
        data: { services: [95.8], fundraising: [2.6], management: [1.6] },
      },
    ],
  },
];

export const findTask1Prompt = (id: string) => TASK1_PROMPTS.find((p) => p.id === id) || null;
