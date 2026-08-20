/**
 * CoolLivingUAE — AC sizing calculator recommendation set
 * ---------------------------------------------------------------------------
 * Units the BTU calculator recommends once it has worked out the required
 * capacity for a room.
 *
 * Same field contract as src/data/products.js:
 *   - amazonQuery / noonQuery hold SEARCH TERMS, never finished URLs. Tagged
 *     URLs are built at render time by src/affiliate.js.
 *   - priceBand is an indicative AED range, never a live price.
 *
 * Images are brand-consistent stills. The previous set hotlinked several
 * unrelated retail sites, and in a few cases showed a different brand or
 * capacity than the row it illustrated.
 * ---------------------------------------------------------------------------
 */

const IMAGES = {
  midea: 'https://m.media-amazon.com/images/I/61joTSyLZbL._SL1000_.jpg',
  superGeneral: 'https://m.media-amazon.com/images/I/61RM3uiBYiL._AC_SL1500_.jpg',
  gree: 'https://m.media-amazon.com/images/I/71B3h9YNUBL._AC_SL1500_.jpg',
  tcl: 'https://aws-obg-image-lb-3.tcl.com/content/dam/brandsite/global/product/ac/elite/xa73/ksp/1920-1080-TCL-Elite-Series-Inverter-Air-Conditioner.png',
  hisense: 'https://m.media-amazon.com/images/I/71hkWvANsxL._AC_SL1500_.jpg',
  samsung: 'https://m.media-amazon.com/images/I/71DozWpxpBL._AC_SL1500_.jpg',
  lg: 'https://m.media-amazon.com/images/I/61BfHFNMEQL._AC_SL1500_.jpg',
  oGeneral: 'https://m.media-amazon.com/images/I/51Z3U+0VjCL._AC_SL1000_.jpg',
  panasonic: 'https://m.media-amazon.com/images/I/71s40QoAJbL._AC_UL640_QL65_.jpg',
  daikin: 'https://m.media-amazon.com/images/I/61HuUBy7XIL._AC_.jpg',
  carrier: 'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg',
};

export const uaeACDatabase = [
  // 1 TON (12,000 BTU) — rooms up to ~14 m²
  {
    id: 'calc-ac-1', brand: 'Midea', model: 'Midea 1 Ton T3 Inverter Split AC',
    tons: 1, btu: 12000, priceBand: { min: 950, max: 1200 }, img: IMAGES.midea,
    amazonQuery: 'Midea 1 ton inverter split AC UAE',
    noonQuery: 'Midea 1 ton split AC',
  },
  {
    id: 'calc-ac-2', brand: 'Super General', model: 'Super General 1 Ton T3 Split AC',
    tons: 1, btu: 12000, priceBand: { min: 800, max: 1020 }, img: IMAGES.superGeneral,
    amazonQuery: 'Super General 1 ton split AC UAE',
    noonQuery: 'Super General 1 ton split AC',
  },
  {
    id: 'calc-ac-3', brand: 'Gree', model: 'Gree 1 Ton T3 Inverter Split AC',
    tons: 1, btu: 12000, priceBand: { min: 880, max: 1120 }, img: IMAGES.gree,
    amazonQuery: 'Gree 1 ton inverter AC UAE',
    noonQuery: 'Gree 1 ton inverter AC',
  },

  // 1.5 TON (18,000 BTU) — 14–22 m²
  {
    id: 'calc-ac-4', brand: 'Midea', model: 'Midea 1.5 Ton T3 Inverter Split AC',
    tons: 1.5, btu: 18000, priceBand: { min: 1150, max: 1450 }, img: IMAGES.midea,
    amazonQuery: 'Midea 1.5 ton inverter split AC UAE T3',
    noonQuery: 'Midea 1.5 ton split AC',
  },
  {
    id: 'calc-ac-5', brand: 'Super General', model: 'Super General 1.5 Ton T3 Split AC',
    tons: 1.5, btu: 18000, priceBand: { min: 1020, max: 1300 }, img: IMAGES.superGeneral,
    amazonQuery: 'Super General 1.5 ton split AC UAE T3',
    noonQuery: 'Super General 1.5 ton split AC',
  },
  {
    id: 'calc-ac-6', brand: 'TCL', model: 'TCL 1.5 Ton T3 Inverter Split AC',
    tons: 1.5, btu: 18000, priceBand: { min: 1070, max: 1360 }, img: IMAGES.tcl,
    amazonQuery: 'TCL 1.5 ton inverter split AC UAE',
    noonQuery: 'TCL 1.5 ton split AC',
  },
  {
    id: 'calc-ac-7', brand: 'Hisense', model: 'Hisense 1.5 Ton T3 Inverter AC',
    tons: 1.5, btu: 18000, priceBand: { min: 1120, max: 1420 }, img: IMAGES.hisense,
    amazonQuery: 'Hisense 1.5 ton inverter AC UAE',
    noonQuery: 'Hisense 1.5 ton split AC',
  },
  {
    id: 'calc-ac-8', brand: 'Samsung', model: 'Samsung WindFree 1.5 Ton T3 Inverter',
    tons: 1.5, btu: 18000, priceBand: { min: 1600, max: 2050 }, img: IMAGES.samsung,
    amazonQuery: 'Samsung WindFree 1.5 ton AC UAE',
    noonQuery: 'Samsung 1.5 ton split AC',
  },

  // 2 TON (24,000 BTU) — 22–32 m²
  {
    id: 'calc-ac-9', brand: 'Midea', model: 'Midea 2 Ton T3 Inverter Split AC',
    tons: 2, btu: 24000, priceBand: { min: 1520, max: 1930 }, img: IMAGES.midea,
    amazonQuery: 'Midea 2 ton inverter split AC UAE T3',
    noonQuery: 'Midea 2 ton split AC',
  },
  {
    id: 'calc-ac-10', brand: 'Gree', model: 'Gree 2 Ton T3 Inverter AC',
    tons: 2, btu: 24000, priceBand: { min: 1430, max: 1820 }, img: IMAGES.gree,
    amazonQuery: 'Gree 2 ton inverter AC UAE T3',
    noonQuery: 'Gree 2 ton split AC',
  },
  {
    id: 'calc-ac-11', brand: 'LG', model: 'LG DualCool 2 Ton T3 Inverter',
    tons: 2, btu: 24000, priceBand: { min: 1960, max: 2500 }, img: IMAGES.lg,
    amazonQuery: 'LG DualCool 2 ton inverter AC UAE',
    noonQuery: 'LG 2 ton split AC',
  },
  {
    id: 'calc-ac-12', brand: 'Samsung', model: 'Samsung 2 Ton T3 WindFree Inverter',
    tons: 2, btu: 24000, priceBand: { min: 1870, max: 2380 }, img: IMAGES.samsung,
    amazonQuery: 'Samsung 2 ton WindFree AC UAE',
    noonQuery: 'Samsung 2 ton split AC',
  },
  {
    id: 'calc-ac-13', brand: 'O-General', model: 'O-General 2 Ton T3 Split AC',
    tons: 2, btu: 24000, priceBand: { min: 2230, max: 2840 }, img: IMAGES.oGeneral,
    amazonQuery: 'O General 2 ton split AC UAE',
    noonQuery: 'O General 2 ton split AC',
  },

  // 2.5 TON (30,000 BTU) — 32–40 m²
  {
    id: 'calc-ac-14', brand: 'Midea', model: 'Midea 2.5 Ton T3 Inverter Split AC',
    tons: 2.5, btu: 30000, priceBand: { min: 1960, max: 2500 }, img: IMAGES.midea,
    amazonQuery: 'Midea 2.5 ton inverter split AC UAE',
    noonQuery: 'Midea 2.5 ton split AC',
  },
  {
    id: 'calc-ac-15', brand: 'Panasonic', model: 'Panasonic 2.5 Ton T3 Inverter AC',
    tons: 2.5, btu: 30000, priceBand: { min: 2500, max: 3180 }, img: IMAGES.panasonic,
    amazonQuery: 'Panasonic 2.5 ton inverter AC UAE',
    noonQuery: 'Panasonic 2.5 ton split AC',
  },
  {
    id: 'calc-ac-16', brand: 'Daikin', model: 'Daikin 2.5 Ton T3 Inverter Split AC',
    tons: 2.5, btu: 30000, priceBand: { min: 2680, max: 3410 }, img: IMAGES.daikin,
    amazonQuery: 'Daikin 2.5 ton inverter split AC UAE',
    noonQuery: 'Daikin 2.5 ton split AC',
  },

  // 3 TON (36,000 BTU) — 40–55 m²
  {
    id: 'calc-ac-17', brand: 'O-General', model: 'O-General 3 Ton T3 Split AC',
    tons: 3, btu: 36000, priceBand: { min: 3120, max: 3980 }, img: IMAGES.oGeneral,
    amazonQuery: 'O General 3 ton split AC UAE',
    noonQuery: 'O General 3 ton split AC',
  },
  {
    id: 'calc-ac-18', brand: 'Carrier', model: 'Carrier 3 Ton T3 Inverter Split AC',
    tons: 3, btu: 36000, priceBand: { min: 2860, max: 3640 }, img: IMAGES.carrier,
    amazonQuery: 'Carrier 3 ton inverter split AC UAE',
    noonQuery: 'Carrier 3 ton split AC',
  },
  {
    id: 'calc-ac-19', brand: 'Daikin', model: 'Daikin 3 Ton T3 Inverter Split AC',
    tons: 3, btu: 36000, priceBand: { min: 3300, max: 4200 }, img: IMAGES.daikin,
    amazonQuery: 'Daikin 3 ton inverter split AC UAE',
    noonQuery: 'Daikin 3 ton split AC',
  },

  // 4 TON (48,000 BTU) — 55 m² and above
  {
    id: 'calc-ac-20', brand: 'Carrier', model: 'Carrier 4 Ton T3 Central / Cassette AC',
    tons: 4, btu: 48000, priceBand: { min: 4290, max: 5450 }, img: IMAGES.carrier,
    amazonQuery: 'Carrier 4 ton central AC UAE',
    noonQuery: 'Carrier 4 ton central AC',
  },
  {
    id: 'calc-ac-21', brand: 'O-General', model: 'O-General 4 Ton T3 Cassette AC',
    tons: 4, btu: 48000, priceBand: { min: 4730, max: 6020 }, img: IMAGES.oGeneral,
    amazonQuery: 'O General 4 ton cassette AC UAE',
    noonQuery: 'O General 4 ton cassette AC',
  },
];

export default uaeACDatabase;
