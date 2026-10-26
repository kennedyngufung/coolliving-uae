/**
 * CoolLivingUAE — Catalogue categories
 * ---------------------------------------------------------------------------
 * The one list of categories. The pages, the admin dashboard, the catalogue
 * rules (src/catalogueMerge.js), the routes and the sitemap all read it, so a
 * category added here appears everywhere at once. Plain data only — Node
 * scripts import this file — so icons live in the UI components.
 *
 * Every category belongs to a group. The group decides the parts of a product
 * page that differ between, say, an air conditioner and a dress: whether an
 * installation request makes sense, how we describe our assessment, and the
 * caption under a product photo.
 * ---------------------------------------------------------------------------
 */

export const CATEGORY_GROUPS = {
  cooling: {
    id: 'cooling',
    name: 'Cooling & Energy',
    installable: true,
    photoCaption: (brand) => `Representative ${brand} photo — the exact model and capacity may differ. Check the retailer listing before you buy.`,
    assessment: 'Our verdicts are editorial opinions formed from manufacturer specifications, published certifications and independent research, and the UAE service and warranty terms each brand offers. We weight T3 compressor certification, corrosion resistance, and after-sales coverage heavily, because those are the factors that determine whether a unit still performs after several Gulf summers. Where we have not tested a product ourselves, we do not claim to have done so.',
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Lifestyle Picks',
    installable: false,
    description: 'Gym wear, home appliances, dresses and shoes chosen for the UAE climate — breathable fabrics, sun protection and appliances rated for hot rooms, with prices to compare on Amazon.ae.',
    photoCaption: (brand) => `Representative ${brand} photo — the exact model, colour and size range may differ. Check the retailer listing before you buy.`,
    assessment: 'Our lifestyle picks are editorial opinions formed from what manufacturers publish about their materials and features, the availability of each product line in the UAE, and how well it suits the climate here — breathable fabrics, sun protection, and appliances rated for hot rooms. We have not wear-tested or used these items ourselves, and we do not claim to have done so. Sizes, colours and exact fabrics vary between listings, so check the retailer page before you buy.',
  },
};

export const categories = [
  {
    id: 'smart-acs', group: 'cooling', name: 'Smart ACs', label: 'Smart AC',
    description: 'The best smart air conditioners in UAE for extreme T3 climate conditions.',
  },
  {
    id: 'air-purifiers', group: 'cooling', name: 'Air Purifiers', label: 'Purifier',
    description: 'Top-rated HEPA air purifiers for Dubai homes to combat dust and allergies.',
  },
  {
    id: 'smart-thermostats', group: 'cooling', name: 'Smart Thermostats', label: 'Thermostat',
    description: 'Intelligent thermostats to reduce DEWA bills and energy consumption in the UAE.',
  },
  {
    id: 'gym-wear', group: 'lifestyle', name: 'Gym Wear', label: 'Gym Wear',
    seoTitle: 'Best Gym Wear for UAE Heat (2026)',
    description: 'Sweat-wicking training kit that copes with UAE heat and humidity — for the gym, the track and early-morning runs.',
    intro: 'Indoor gyms here are air-conditioned; the walk there, the outdoor run and the beach workout are not. These picks favour fabrics that move sweat off the skin and dry fast, and include options for training modestly.',
    tips: [
      { title: 'Synthetics beat cotton for sweat', text: 'Polyester and nylon blends with a wicking finish move sweat to the surface, where it evaporates. Cotton soaks it up and stays heavy and wet.' },
      { title: 'Look for ventilation', text: 'Mesh panels across the back and under the arms release heat where you sweat most.' },
      { title: 'Train outdoors in light colours', text: 'Pale fabric absorbs less sunlight than black. For outdoor sessions, a top with a stated UPF rating adds sun protection.' },
      { title: 'Modest options exist', text: 'Full-length leggings, long-sleeve tops and sport hijabs in the same wicking fabrics let you cover up without overheating.' },
      { title: 'Rinse kit soon after training', text: 'Sweaty kit left in a hot car or gym bag holds on to odour. Anti-odour finishes help; washing promptly helps more.' },
    ],
  },
  {
    id: 'home-appliances', group: 'lifestyle', name: 'Home Appliances', label: 'Appliance',
    seoTitle: 'Best Home Appliances for UAE Homes (2026)',
    description: 'Appliances that suit UAE homes — rated for hot kitchens, ready for dust and humidity, and sold in GCC-spec versions.',
    intro: 'A UAE kitchen or laundry room can sit well above 30°C when the AC is off, coastal homes fight humidity for half the year, and fine dust gets everywhere. These picks are chosen with that in mind.',
    tips: [
      { title: 'Check a fridge’s climate class', text: 'Class T (tropical) refrigerators are rated for rooms up to 43°C; classes N and SN are rated only to 32°C. Look for T on the specification label.' },
      { title: 'Buy the GCC version', text: 'The UAE runs on 220–240 V with British-style three-pin plugs. Imported US models built for 110 V need a transformer and usually come without a UAE warranty.' },
      { title: 'Fans cool people, not rooms', text: 'A fan creates a breeze on your skin; it does not lower the room temperature. Run one with the AC and you can set the thermostat a degree or two higher.' },
      { title: 'Skip evaporative “air coolers” on the coast', text: 'They cool by adding moisture to the air. That works in dry heat but does little in humid coastal air, and leaves rooms feeling muggy.' },
      { title: 'Plan for dust', text: 'Fine sand reaches every room. Vacuums with washable or HEPA filters and good seals keep it from blowing straight back out.' },
    ],
  },
  {
    id: 'dresses', group: 'lifestyle', name: 'Dresses', label: 'Dress',
    seoTitle: 'Best Dresses for UAE Summer Heat (2026)',
    description: 'Breathable dresses for UAE summers — linen, cotton and viscose cuts that stay comfortable in the heat, including modest styles.',
    intro: 'In a UAE summer, fabric matters more than anything else. These picks favour natural and breathable fibres and relaxed cuts, with modest styles that cover up without trapping heat.',
    tips: [
      { title: 'Choose breathable fibres', text: 'Linen, cotton and viscose let air and moisture through; dense polyester holds heat against the skin. Every listing states the fabric composition — check it before you order.' },
      { title: 'Loose beats fitted', text: 'Relaxed and A-line cuts let air move. Fitted dresses in stretch fabric trap heat.' },
      { title: 'Light colours for outdoors', text: 'Pale fabrics reflect more sunlight than dark ones.' },
      { title: 'Dress for where you are going', text: 'Many UAE malls and public places ask visitors to dress modestly — covering shoulders and knees is the usual guide — so midi and maxi lengths get the most wear.' },
      { title: 'Measure, then check the size chart', text: 'Brands size differently, and many sellers use their own charts. Compare your measurements rather than assuming your usual size.' },
    ],
  },
  {
    id: 'shoes', group: 'lifestyle', name: 'Shoes', label: 'Shoes',
    seoTitle: 'Best Shoes for UAE Heat (2026)',
    description: 'Breathable trainers and heat-friendly sandals for UAE pavements, beaches and gyms.',
    intro: 'Summer pavements, sand and long mall walks are hard on feet. These picks favour breathable uppers, real cushioning, and sandals that cope with water and heat.',
    tips: [
      { title: 'Mesh uppers breathe', text: 'Engineered mesh and knit uppers let heat escape; synthetic leather traps it.' },
      { title: 'Feet swell in the heat', text: 'Allow a little extra room, especially in walking and running shoes you will wear outdoors.' },
      { title: 'Beach sandals should shrug off water', text: 'EVA foam and rubber rinse clean and dry quickly. Leather and cork footbeds do not like repeated soaking.' },
      { title: 'Run early or indoors', text: 'In summer, pavements and sand get very hot by midday. Dawn runs and the treadmill are kinder to your feet and to you.' },
    ],
  },
];

export const CATEGORY_IDS = categories.map((category) => category.id);

/** The category record for an id, or undefined. */
export const categoryById = (id) => categories.find((category) => category.id === id);

/** The group a category belongs to; unknown ids fall back to cooling, the site's original behaviour. */
export const groupOf = (categoryId) => CATEGORY_GROUPS[categoryById(categoryId)?.group] || CATEGORY_GROUPS.cooling;
