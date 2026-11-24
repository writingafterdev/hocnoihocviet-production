/**
 * Task 1 prompt library (Academic charts), stored in one general form so the checks work on any chart:
 * a prompt has parts (a chart or a table); each part is items × one axis (ordered, like years, or not, like sports).
 *
 * Source: youpass.vn's Task 1 bank. The prompt text is kept exactly as written there; the numbers are read from their
 * images and the charts are redrawn in our own style. Line graphs, bar charts, pie charts, tables and mixed charts.
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
  /** Index of the first label that is a forecast (2030): those figures are projections, said with “dự kiến”. */
  projected?: number;
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
  /** A table drawn with the axis down the side (years as rows) and the items across the top. */
  rowsAreAxis?: boolean;
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
  {
    id: 't1-waste-disposal', category: 'Bar Chart', title: 'Waste disposal in a European country, 2005–2008', source: YP + ' · Collect',
    text: 'The chart below shows different methods of waste disposal in a European country from 2005 to 2008.' + END,
    parts: [{
      id: 'a', title: 'Waste disposal (million tonnes)', kind: 'bars', unit: ' triệu tấn', unitEn: ' million tonnes', tol: 3, max: 80, step: 10,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['2005', '2006', '2007', '2008'] },
      items: [it('landfill', 'Landfill', C.teal), it('burning', 'Burning', C.sun), it('sea', 'Dumping in sea', C.tomato)],
      data: { landfill: [70, 60, 50, 40], burning: [65, 60, 40, 65], sea: [55, 50, 50, 40] },
    }],
  },
  {
    id: 't1-living-alone', category: 'Bar Chart', title: 'People living alone in the US, 1850–2000', source: YP + ' · Collect',
    text: 'The bar chart below shows the percentage of people living alone in 5 different age groups in the US from 1850 to 2000.' + END,
    parts: [{
      id: 'a', title: 'People living alone in the US (%)', kind: 'bars', unit: '%', unitEn: '%', tol: 0.5, max: 20, step: 5,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1850', '1900', '1950', '2000'] },
      items: [it('a17', '17-26', C.gray), it('a27', '27-36', C.navy), it('a37', '37-46', C.lblue), it('a47', '47-54', C.sun), it('a55', '55-64', C.tomato)],
      data: { a17: [2.5, 2.2, 2, 5], a27: [2.5, 2.5, 2.5, 8], a37: [3, 3, 2.8, 7], a47: [null, 3.5, 3.2, 13], a55: [null, null, 9, 17] },
    }],
  },
  {
    id: 't1-urban-population', category: 'Bar Chart', title: 'Urban population in parts of the world, 1950–2030', source: YP + ' · Collect',
    text: 'The chart below gives information about the growth of the urban population in certain parts of the world, including the prediction of the future. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
    parts: [{
      id: 'a', title: 'Urban population (% of people) · 2030 is a forecast', kind: 'bars', unit: '%', unitEn: '%', tol: 2, max: 90, step: 10,
      axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1950', '2000', '2030'], projected: 2 },
      items: [it('world', 'Whole World', C.navy), it('africa', 'Africa', C.sun), it('asia', 'Asia', C.tomato), it('latam', 'Latin America', C.leaf)],
      data: { world: [30, 48, 60], africa: [12, 39, 51], asia: [14, 39, 56], latam: [42, 70, 80] },
    }],
  },
  {
    id: 't1-australia-visitors', category: 'Table', title: 'Australians visiting seven destinations, 1999 and 2009', source: YP + ' · IELTS Insights Oct 26',
    text: 'The table below gives information on the number of Australian people who visited the seven most popular destinations in 1999 and 2009. Provide an overview of the information by identifying and describing the key details, and include comparisons where appropriate.',
    parts: [
      {
        id: 'a', title: 'Australian visitors', kind: 'table', unit: ' người', unitEn: ' people', tol: 15000,
        axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1999', '2009'] },
        items: [it('nz', 'New Zealand', C.blue), it('uk', 'United Kingdom', C.blue), it('us', 'United States', C.blue), it('id', 'Indonesia', C.blue), it('fj', 'Fiji', C.blue), it('jp', 'Japan', C.blue), it('cn', 'China', C.blue)],
        data: { nz: [500700, 1064000], uk: [400000, 640000], us: [300000, 400000], id: [150000, 340000], fj: [120000, 257000], jp: [100000, 250000], cn: [86000, 300000] },
      },
      {
        id: 'b', title: 'Growth rate', kind: 'table', unit: '%', unitEn: '%', tol: 5, derived: 'a',
        axis: { name: 'cột', ordered: false, prep: '', labels: ['Growth rate'] },
        items: [it('nz', 'New Zealand', C.blue), it('uk', 'United Kingdom', C.blue), it('us', 'United States', C.blue), it('id', 'Indonesia', C.blue), it('fj', 'Fiji', C.blue), it('jp', 'Japan', C.blue), it('cn', 'China', C.blue)],
        data: { nz: [113], uk: [60], us: [33], id: [127], fj: [114], jp: [150], cn: [249] },
      },
    ],
  },
  {
    id: 't1-australia-marriage', category: 'Table', title: 'Marriages and age at marriage in Australia, 1960–2000', source: YP + ' · IELTS Insights Aug 26',
    text: 'The table below gives information about the situation of marriage and age from 1960 to 2000 in Australia. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
    parts: [
      {
        id: 'a', title: 'Number of marriages', kind: 'table', rowsAreAxis: true, unit: ' đám cưới', unitEn: ' marriages', tol: 2000,
        axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1960', '1970', '1980', '1990', '2000'] },
        items: [it('rel', 'Religious marriage', C.blue), it('civ', 'Civil marriage', C.leaf)],
        data: { rel: [25000, 28000, 50000, 32000, 34000], civ: [8000, 12000, 16000, 23000, 40000] },
      },
      {
        id: 'b', title: 'Average age at marriage', kind: 'table', rowsAreAxis: true, unit: ' tuổi', unitEn: '', tol: 0.5,
        axis: { name: 'năm', ordered: true, prep: 'in', labels: ['1960', '1970', '1980', '1990', '2000'] },
        items: [it('bride', 'Bride', C.tomato), it('groom', 'Bridegroom', C.blue)],
        data: { bride: [21, 23, 25, 27, 30], groom: [24, 25, 27, 30, 32] },
      },
    ],
  },
  {
    id: 't1-health-spending', category: 'Table', title: 'Health spending in five countries, 2002', source: YP + ' · 04/4/2026',
    text: 'The table below shows information about spending on health in five different countries in 2002.' + END_Z,
    parts: [{
      id: 'a', title: 'The spending on health in five different countries in 2002 (%)', kind: 'table', unit: '%', unitEn: '%', tol: 0.3, total: 0,
      axis: { name: 'loại chi', ordered: false, prep: 'in', labels: ['Total', 'Public spending', 'Private spending'] },
      items: [it('jp', 'Japan', C.blue), it('it', 'Italy', C.blue), it('de', 'Germany', C.blue), it('fr', 'France', C.blue), it('us', 'USA', C.blue)],
      data: { jp: [7.2, 5.8, 1.4], it: [7.7, 5.3, 2.4], de: [9.3, 7, 2.3], fr: [11.4, 8.6, 2.8], us: [8.6, 6, 2.6] },
    }],
  },
  {
    id: 't1-library-survey', category: 'Mixed Charts', title: 'University library users and their satisfaction', source: YP + ' · IELTS Insights Jul 26',
    text: 'The chart and table below show the results of a survey of library users at a university.' + END,
    parts: [
      {
        id: 'a', title: 'Categories of library users (%)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true,
        axis: { name: '', ordered: false, prep: '', labels: [''] },
        items: [it('ftu', 'Full-time undergraduate', C.blue), it('ftp', 'Full-time postgraduate', C.tomato), it('ptp', 'Part-time postgraduate', C.teal), it('dl', 'Distance learning (all courses)', C.sun), it('staff', 'Academic staff', C.navy)],
        data: { ftu: [44], ftp: [25], ptp: [16], dl: [8], staff: [7] },
      },
      {
        id: 'b', title: 'Library users satisfaction (%)', kind: 'table', unit: '%', unitEn: '%', tol: 2, share: true,
        axis: { name: 'mức', ordered: false, prep: '', labels: ['Very satisfied', 'Fairly satisfied', 'Not satisfied'] },
        items: [it('hours', 'Library opening hours', C.blue), it('staffh', 'Helpfulness of staff', C.blue), it('books', 'Availability of books', C.blue), it('journals', 'Availability of journals', C.blue), it('wifi', 'Reliability of Wifi', C.blue)],
        data: { hours: [65, 35, 0], staffh: [95, 5, 0], books: [50, 40, 10], journals: [45, 35, 20], wifi: [48, 33, 19] },
      },
    ],
  },
  {
    id: 't1-city-weather', category: 'Mixed Charts', title: 'Temperature and sunshine in London, New York and Sydney', source: YP + ' · Collect',
    text: 'The line graph and table show the average monthly temperatures and annual hours of sunshine in three major cities.' + END_Z,
    parts: [
      {
        id: 'a', title: 'Average monthly temperature (°C)', kind: 'line', unit: '°C', unitEn: '°C', tol: 1, max: 35, step: 5,
        axis: { name: 'tháng', ordered: true, prep: 'in', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] },
        items: [it('lon', 'London', C.navy), it('ny', 'New York', C.sun), it('syd', 'Sydney', C.teal)],
        data: { lon: [8, 10, 13, 18, 24, 23, 25, 23, 17, 16, 11, 10], ny: [5, 6, 12, 20, 25, 28, 30, 28, 25, 16, 7, 5], syd: [23, 21, 23, 22, 18, 16, 15, 17, 18, 23, 24, 26] },
      },
      {
        id: 'b', title: 'Annual hours of sunshine', kind: 'table', unit: ' giờ', unitEn: ' hours', tol: 30,
        axis: { name: 'cột', ordered: false, prep: '', labels: ['Hours'] },
        items: [it('lon', 'London', C.navy), it('ny', 'New York', C.sun), it('syd', 'Sydney', C.teal)],
        data: { lon: [1158], ny: [2535], syd: [2473] },
      },
    ],
  },
  {
    id: 't1-world-water', category: 'Mixed Charts', title: 'The world’s water and its use in three countries', source: YP + ' · IELTS Insights Oct 26',
    text: 'The charts below show the distribution of the world’s water and the use of water in three countries.' + END,
    parts: [
      {
        id: 'a', title: 'All water (%)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true,
        axis: { name: '', ordered: false, prep: '', labels: [''] },
        items: [it('salt', 'Salt water', C.tomato), it('fresh', 'Fresh water', C.sun)], data: { salt: [97], fresh: [3] },
      },
      {
        id: 'b', title: 'Fresh water (%)', kind: 'pies', unit: '%', unitEn: '%', tol: 1, share: true, parent: { part: 'a', item: 'fresh' },
        axis: { name: '', ordered: false, prep: '', labels: [''] },
        items: [it('ice', 'Ice and glaciers', C.tomato), it('ground', 'Ground water', C.sun), it('surface', 'Surface water', C.navy)], data: { ice: [79], ground: [20], surface: [1] },
      },
      {
        id: 'c', title: 'The use of water (%)', kind: 'bars', unit: '%', unitEn: '%', tol: 2, max: 80, step: 20,
        axis: { name: 'nước', ordered: false, prep: 'in', labels: ['Egypt', 'Saudi Arabia', 'Canada'] },
        items: [it('agri', 'Agriculture', C.tomato), it('dom', 'Domestic', C.teal), it('ind', 'Industry', C.sun)],
        data: { agri: [80, 78, 10], dom: [12, 12, 11], ind: [8, 10, 79] },
      },
    ],
  },
];

export const findTask1Prompt = (id: string) => TASK1_PROMPTS.find((p) => p.id === id) || null;
