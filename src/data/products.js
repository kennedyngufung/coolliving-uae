/**
 * CoolLivingUAE — Product catalogue
 * ---------------------------------------------------------------------------
 * Extracted from App.jsx so that build tooling (the sitemap generator) can
 * import it, and so catalogue edits are reviewable independently of UI code.
 *
 * FIELD CONTRACT — read before adding a product:
 *
 *   amazonQuery    Search TERMS ONLY. Never a finished URL. URLs are built at
 *                  render time by src/affiliate.js, which applies the tracking
 *                  tag. Storing finished URLs here is what previously allowed
 *                  sixty untagged links to ship.
 *                  Keep terms broad — brand, capacity, type, "UAE". Model
 *                  numbers date quickly and produce zero-result pages, which
 *                  read as a broken site to a programme reviewer.
 *
 *   priceBand      { min, max } in AED. Indicative range, never a live price.
 *                  Amazon's Operating Agreement permits displaying Amazon
 *                  prices only when sourced from the Product Advertising API
 *                  and shown with a timestamp; a hardcoded exact figure goes
 *                  stale and becomes a misrepresentation.
 *
 *   editorialScore CoolLivingUAE's own 0-5 assessment. Presented as clearly
 *                  attributed editorial opinion, which is legitimate. It is
 *                  NOT an aggregate of user reviews and must never be
 *                  displayed as one.
 *
 *   description    Research-based. State what manufacturers specify, what
 *                  standards certify, and what we conclude as opinion. Do not
 *                  assert first-hand testing that has not been carried out and
 *                  documented.
 * ---------------------------------------------------------------------------
 */

const smartAcs = [
  {
    id: 'ac-1', brand: 'LG', title: 'LG DualCool 1.5 Ton T3 Inverter Split AC',
    editorialScore: 4.8, priceBand: { min: 1750, max: 2200 },
    image: 'https://m.media-amazon.com/images/I/61BfHFNMEQL._AC_SL1500_.jpg',
    amazonQuery: 'LG DualCool 1.5 ton inverter split AC UAE',
    description: `Our pick for Dubai apartments. LG specifies the DualCool range with a T3 tropical rating, meaning the Dual Inverter compressor is certified to hold rated cooling output at ambient temperatures where units built to the T1 standard begin to throttle or trip. That distinction is the single most important one for a UAE buyer. LG's gold-fin condenser coating resists the salt-air corrosion that shortens condenser life in coastal developments such as JBR, Palm Jumeirah, and Dubai Creek Harbour. ThinQ app control adds geofencing and scheduling, the two features with the clearest documented effect on cooling-related electricity use. Carries an ESMA energy label, and LG UAE's service network covers all seven emirates with a 5-year compressor and 2-year parts warranty. We rank it first on the balance of T3 certification, corrosion protection, smart control, and after-sales reach.`,
  },
  {
    id: 'ac-2', brand: 'Samsung', title: 'Samsung WindFree 2.0 Ton T3 Inverter Split AC',
    editorialScore: 4.7, priceBand: { min: 2100, max: 2650 },
    image: 'https://m.media-amazon.com/images/I/71DozWpxpBL._AC_SL1500_.jpg',
    amazonQuery: 'Samsung WindFree 2 ton inverter split AC UAE',
    description: `Best suited to large UAE living rooms and majlis spaces. Samsung's WindFree technology disperses cool air through thousands of micro-perforations in the panel face rather than as a directed stream, addressing the specific discomfort of guests seated directly beneath a unit — a real consideration in UAE social settings. AI Energy mode builds a usage profile over time and pre-cools ahead of the late-afternoon heat peak. The Auto Clean cycle dries the evaporator after operation, which matters more in the Gulf than in temperate climates: the sharp indoor-outdoor humidity contrast is what drives mould growth inside indoor units here. Samsung rates the compressor to T3 tropical specification and backs it with a 5-year compressor warranty through a UAE service network with same-emirate coverage.`,
  },
  {
    id: 'ac-3', brand: 'O-General', title: 'O-General 1.5 Ton T3 High-Wall Split AC',
    editorialScore: 4.9, priceBand: { min: 1950, max: 2450 },
    image: 'https://m.media-amazon.com/images/I/51Z3U+0VjCL._AC_SL1000_.jpg',
    amazonQuery: 'O General 1.5 ton split AC UAE',
    description: `The brand with the strongest word-of-mouth reputation among UAE HVAC installers, and the one most often specified for villas where reliability outranks features. O-General builds this range with a heavy-gauge copper evaporator coil and a hydrophilic aluminium fin coating — a specification aimed squarely at dusty, high-ambient environments rather than temperate ones. The compressor carries T3 certification for sustained output at Gulf peak temperatures. Two honest weaknesses: the outdoor unit is audibly louder at full capacity than the LG and Samsung equivalents, and the app experience is dated next to LG ThinQ. If your priority is a split AC that still cools efficiently a decade from now rather than one with the best phone integration, this is our recommendation.`,
  },
  {
    id: 'ac-4', brand: 'Super General', title: 'Super General 2.0 Ton T3 Inverter Split AC',
    editorialScore: 4.3, priceBand: { min: 1250, max: 1550 },
    image: 'https://m.media-amazon.com/images/I/61RM3uiBYiL._AC_SL1500_.jpg',
    amazonQuery: 'Super General 2 ton inverter split AC UAE',
    description: `Best-value UAE-rooted brand for Sharjah and the Northern Emirates. Super General is distributed locally rather than through a regional multinational office, which in practice means shorter after-sales turnaround than most global brands operating here. The inverter compressor carries T3 certification, so rated output is specified to hold through UAE spring, autumn, and night-time summer conditions; at sustained inland peaks it will work harder than a premium unit. There is no Wi-Fi and no app — this is a cooling appliance, not a smart device. For JVC, JVT, and Sharjah apartments where the monthly DEWA bill drives the decision, it delivers most of the practical performance of a premium brand at a substantially lower price, with Arabic and English warranty service across all seven emirates.`,
  },
  {
    id: 'ac-5', brand: 'Midea', title: 'Midea 1.5 Ton T3 DC Inverter Split AC',
    editorialScore: 4.4, priceBand: { min: 1150, max: 1450 },
    image: 'https://m.media-amazon.com/images/I/61joTSyLZbL._SL1000_.jpg',
    amazonQuery: 'Midea 1.5 ton inverter split AC UAE',
    description: `A strong first-apartment choice. Midea is one of the largest air treatment manufacturers in the world and supplies compressor components into the wider industry, which is why its own-brand units offer comparable core hardware at a lower price than the brands they supply. The DC inverter reaches setpoint faster than a fixed-speed unit of the same capacity and modulates rather than cycling on and off, which is where the running-cost saving comes from. The NetHome Plus app works on UAE-region iOS and Android. One practical buying note: condensate management is more demanding in UAE coastal humidity than in most markets, so check drain routing carefully at installation and confirm you are receiving current-year stock rather than long-held inventory. Two-year comprehensive warranty via Midea UAE.`,
  },
  {
    id: 'ac-6', brand: 'Gree', title: 'Gree 1.5 Ton T3 Wi-Fi Inverter Split AC',
    editorialScore: 4.2, priceBand: { min: 1050, max: 1350 },
    image: 'https://m.media-amazon.com/images/I/71B3h9YNUBL._AC_SL1500_.jpg',
    amazonQuery: 'Gree 1.5 ton inverter split AC UAE wifi',
    description: `Among the lowest prices for a genuine T3-rated Wi-Fi inverter in the UAE. Gree is the world's largest air conditioner manufacturer by production volume — a fact most UAE buyers are unaware of — and produces OEM units for several recognised European appliance brands alongside its own label. The rotary compressor carries T3 certification. The GREE+ app is functional but less polished than LG ThinQ, and at its rated indoor noise level this is one of the louder units in our roundup, which is our main reservation. UAE distribution and workshop service are handled locally with quick turnaround. We would put it in a second bedroom, study, or store room where running-cost savings matter more than refinement, rather than in a master bedroom.`,
  },
  {
    id: 'ac-7', brand: 'Panasonic', title: 'Panasonic 1.5 Ton T3 nanoe-X Inverter Split AC',
    editorialScore: 4.7, priceBand: { min: 2250, max: 2800 },
    image: 'https://m.media-amazon.com/images/I/71s40QoAJbL._AC_UL640_QL65_.jpg',
    amazonQuery: 'Panasonic nanoe 1.5 ton inverter split AC UAE',
    description: `The split AC we would choose for allergy sufferers and families with young children. Panasonic's nanoe-X generator releases hydroxyl radicals contained in water molecules, a technology the company has published extensively on and deployed across its commercial air treatment range as well as residential units. In the UAE this matters well beyond marketing: Shamal dust season from March to May, and proximity to active construction corridors such as Al Furjan, Dubailand, and Dubai South, keep indoor particulate levels elevated for much of the year. The Econavi occupancy sensor reduces airflow in unoccupied areas rather than cooling empty rooms. The clear trade-off is price — you pay a meaningful premium over the LG DualCool for comparable cooling capacity. For households managing asthma or seasonal allergies, we think that premium is justified.`,
  },
  {
    id: 'ac-8', brand: 'Daikin', title: 'Daikin 2.0 Ton T3 Stylish Series Inverter Split AC',
    editorialScore: 4.8, priceBand: { min: 2600, max: 3250 },
    image: 'https://m.media-amazon.com/images/I/61HuUBy7XIL._AC_.jpg',
    amazonQuery: 'Daikin 2 ton inverter split AC UAE',
    description: `Premium Japanese engineering, and the quietest indoor unit in our roundup after the Mitsubishi Kirigamine. Daikin's Stylish series uses a slim indoor casing that sits far less obtrusively against a wall than a conventional high-wall unit — a genuine consideration in premium Downtown Dubai, DIFC, and Abu Dhabi Corniche apartments where the unit is visible in the main living space. Flash Streamer applies a high-voltage electrical discharge to break down formaldehyde and volatile organic compounds, which off-gas from new MDF furniture and fitted wardrobes for many months in newly furnished UAE homes. The variable-speed outdoor fan holds heat exchange steady across changing ambient temperature, producing Daikin's characteristically flat power draw rather than the spikes of a fixed-speed system. Daikin specifies the compressor to T3 tropical conditions. Our recommendation for master bedrooms and home offices.`,
  },
  {
    id: 'ac-9', brand: 'Mitsubishi', title: 'Mitsubishi Electric 2.0 Ton T3 Kirigamine Zen Inverter',
    editorialScore: 4.9, priceBand: { min: 2950, max: 3700 },
    image: 'https://m.media-amazon.com/images/I/61E7Y+SGTYL._AC_SL1500_.jpg',
    amazonQuery: 'Mitsubishi Electric Kirigamine inverter split AC UAE',
    description: `The quietest residential split AC we are aware of on the UAE market, and the one we would specify for a master bedroom without hesitation. Mitsubishi Electric rates the Kirigamine Zen's indoor unit below the level of a whispered conversation at minimum fan speed, achieved through dual-barrier fan housing insulation and a slow-start compressor ramp refined across several hardware generations. The 3D i-see sensor maps occupancy across the room in three dimensions and directs airflow away from where people actually are, addressing the direct-draft discomfort that causes many UAE residents to switch their bedroom unit off overnight. The outdoor unit carries T3 tropical certification. At this price it is a long-term purchase rather than a value one, justified by build quality, a service life measured in well over a decade, and a materially better sleep environment.`,
  },
  {
    id: 'ac-10', brand: 'Hisense', title: 'Hisense 1.0 Ton T3 Inverter Split AC',
    editorialScore: 4.1, priceBand: { min: 900, max: 1150 },
    image: 'https://m.media-amazon.com/images/I/71hkWvANsxL._AC_SL1500_.jpg',
    amazonQuery: 'Hisense 1 ton inverter split AC UAE',
    description: `The most capable T3 inverter we can recommend at the very bottom of the UAE market. Hisense substantially improved its production validation following its European manufacturing partnership, and current units are a clear step on from the brand's earlier reputation. This 1-ton capacity suits rooms up to roughly 14 m², which in practice means small bedrooms in Sharjah and Ajman or studio apartments in JVC — undersizing an AC in the UAE is a common and expensive mistake, so check your room area against the capacity before buying. Wi-Fi control is included via the Hi-Smart app. UAE after-sales runs through a large established electronics distributor with service centres across the country. If your requirement is simply the cheapest genuinely T3-rated inverter available for delivery today, this is the honest answer.`,
  },
  {
    id: 'ac-11', brand: 'TCL', title: 'TCL 1.5 Ton T3 Elite Inverter Split AC',
    editorialScore: 4.3, priceBand: { min: 1200, max: 1500 },
    image: 'https://aws-obg-image-lb-3.tcl.com/content/dam/brandsite/global/product/ac/elite/xa73/ksp/1920-1080-TCL-Elite-Series-Inverter-Air-Conditioner.png',
    amazonQuery: 'TCL Elite 1.5 ton inverter split AC UAE',
    description: `A sensible mid-range choice for UAE bedrooms in the 14 to 20 m² range. The Elite series is a real hardware step above TCL's entry line rather than a trim change: a T3-certified rotary compressor, a hydrophilic aluminium fin coating better suited to UAE coastal humidity than a standard finish, and a four-way motorised louver system that pushes air into room corners instead of straight down the middle. Indoor noise is acceptable for a bedroom without being class-leading. One practical note worth knowing before you buy: the TCL Home app has had connectivity issues on some Android handsets in this region, and applying current firmware after installation resolves most of them. TCL maintains a strong presence on Noon.ae as well as Amazon.ae, and promotional pricing is frequent enough that patience is usually rewarded.`,
  },
  {
    id: 'ac-12', brand: 'Toshiba', title: 'Toshiba 1.5 Ton T3 Daiseikai Inverter Split AC',
    editorialScore: 4.5, priceBand: { min: 1600, max: 2000 },
    image: 'https://m.media-amazon.com/images/I/61y5C9L5bxL._AC_SL1500_.jpg',
    amazonQuery: 'Toshiba Daiseikai 1.5 ton inverter split AC UAE',
    description: `Our choice where certified air quality matters as much as cooling. The Daiseikai line carries British Allergy Foundation certification — an independent validation rather than a manufacturer claim, which is rare in this category and worth weighting accordingly. Its plasma ioniser generates negative ions that cause fine airborne particles to cluster and settle out of the breathing zone, addressing the specific UAE problem of very fine dust that passes through conventional filter media during Shamal wind events. Cooling itself is solid: Toshiba specifies the inverter to T3 tropical conditions for sustained output at Gulf summer temperatures. For families with children experiencing respiratory symptoms, or residents of older Deira and Bur Dubai buildings with shared ducting, the certification justifies the premium over a pure-cooling unit at similar capacity.`,
  },
  {
    id: 'ac-13', brand: 'Hitachi', title: 'Hitachi 1.5 Ton T3 Frost Wash Inverter Split AC',
    editorialScore: 4.6, priceBand: { min: 1900, max: 2350 },
    image: 'https://m.media-amazon.com/images/I/61n4V-xFJGL._AC_SL1500_.jpg',
    amazonQuery: 'Hitachi Frost Wash inverter split AC UAE 1.5 ton',
    description: `The most substantive self-cleaning system on the UAE market. Hitachi's Frost Wash deliberately freezes the evaporator coil and then defrosts it rapidly; the thermal expansion physically breaks up the biofilm and dust cake that ordinary "auto clean" drying cycles merely redistribute. In a climate where indoor coils foul quickly and professional coil cleaning is a recurring annual cost, that is a genuine running-cost argument rather than a convenience feature. The stainless titanium fin coating is among the most corrosion-resistant specifications available in a residential unit, which matters directly for sea-facing properties on JBR, Dubai Creek Harbour, and the Abu Dhabi Corniche where salt spray accelerates fin degradation. T3-rated compressor. Our pick where the unit will be installed and then largely left alone.`,
  },
  {
    id: 'ac-14', brand: 'Sharp', title: 'Sharp 1.5 Ton T3 Plasmacluster Inverter Split AC',
    editorialScore: 4.5, priceBand: { min: 1650, max: 2050 },
    image: 'https://m.media-amazon.com/images/I/71m3lV0QUPL._AC_SL1500_.jpg',
    amazonQuery: 'Sharp Plasmacluster inverter split AC UAE 1.5 ton',
    description: `Strong air ionisation without premium-tier pricing. Sharp's Plasmacluster releases balanced positive and negative ions, and has a longer record of published third-party research behind it than any competing ionisation technology fitted to air conditioners in this roundup. That research base is the reason we weight it above comparable marketing claims elsewhere. In UAE buildings with shared HVAC ducting — common in older Sharjah, Deira, and Bur Dubai stock — reducing airborne biological load between apartments is a real benefit rather than a theoretical one. Cooling performance from the T3-rated J-Tech inverter is competent rather than exceptional. For west-facing or poorly insulated rooms facing the full July and August peak we would still put the O-General first, and use this as the secondary-room choice.`,
  },
  {
    id: 'ac-15', brand: 'Carrier', title: 'Carrier 1.5 Ton T3 Optimax Inverter Split AC',
    editorialScore: 4.6, priceBand: { min: 1950, max: 2400 },
    image: 'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg',
    amazonQuery: 'Carrier Optimax inverter split AC UAE 1.5 ton',
    description: `Commercial engineering heritage in a residential unit. Carrier invented modern mechanical air conditioning in 1902, and its commercial systems run continuously in DIFC office towers, Abu Dhabi government buildings, and airport terminals across the region. The residential Optimax range inherits that lineage in one specification that matters: a scroll compressor rather than the rotary type used by most competitors at this price. Scroll compressors have fewer moving parts in contact, run with lower vibration, and are generally specified for longer service life — the reason they dominate commercial applications. Carrier rates the unit to T3 tropical conditions. If you own your UAE property and expect to stay in it beyond a typical rental cycle, total cost of ownership is where this unit makes its case rather than headline features or purchase price.`,
  },
  {
    id: 'ac-16', brand: 'Haier', title: 'Haier 1.5 Ton T3 Inverter Split AC',
    editorialScore: 4.3, priceBand: { min: 1100, max: 1400 },
    image: 'https://m.media-amazon.com/images/I/71kHXVzFBWL._AC_SL1500_.jpg',
    amazonQuery: 'Haier 1.5 ton inverter split AC UAE T3',
    description: `Entry-level pricing backed by the scale of the world's largest white-goods manufacturer. Haier's UAE residential range is priced directly against Super General and Midea, and the specification is competitive at that level: a T3-certified DC inverter compressor that reaches setpoint faster than a fixed-speed equivalent, an anti-corrosion coating on the outdoor coil appropriate to coastal humidity, and a self-cleaning function that dries the evaporator after each cooling cycle to limit mould growth. Setpoint holding is good rather than class-leading — LG and Daikin are tighter. Wi-Fi through the Haier Smart app occasionally needs reconnection on local networks, which is a minor irritation rather than a fault. Two-year comprehensive warranty through a large UAE service network. A sound budget-conscious choice.`,
  },
  {
    id: 'ac-17', brand: 'York', title: 'York 1.5 Ton T3 Inverter Split AC',
    editorialScore: 4.5, priceBand: { min: 1700, max: 2100 },
    image: 'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg',
    amazonQuery: 'York inverter split AC UAE 1.5 ton T3',
    description: `The commercial-heritage brand behind a large share of UAE hotel and institutional HVAC. York, part of Johnson Controls, supplies systems to hotels, government buildings, and industrial facilities across the Emirates, and its residential range carries the same design philosophy: a scroll compressor of the type used in its light-commercial equipment, giving smoother running and lower vibration than the rotary compressors typical at this price. The outdoor coil coating is specified for high-ambient tropical service. One characteristic worth understanding before buying: York's inverter control strategy prioritises compressor longevity over aggressive initial cool-down, so the unit takes marginally longer to pull a hot room down than a Midea or Gree, in exchange for less mechanical stress over its life. For property owners who want hotel-grade durability rather than peak responsiveness, that is the right trade.`,
  },
  {
    id: 'ac-18', brand: 'Fujitsu', title: 'Fujitsu 1.5 Ton T3 High-Performance Inverter Split AC',
    editorialScore: 4.7, priceBand: { min: 2050, max: 2550 },
    image: 'https://m.media-amazon.com/images/I/61E7Y+SGTYL._AC_SL1500_.jpg',
    amazonQuery: 'Fujitsu inverter split AC UAE 1.5 ton T3',
    description: `Our preferred Japanese-brand choice where running cost outweighs purchase price. Fujitsu General has supplied precision climate control to hospitals, server rooms, and data centres for decades, and its DC Inverter control system makes continuous micro-adjustments to compressor speed rather than correcting in coarse steps — which is where the efficiency advantage over cruder inverters comes from, since every overshoot past setpoint is energy spent and then thrown away. Fujitsu rates the outdoor unit to T3 tropical conditions. The weekly programme timer offers twelve independent daily slots, enough to schedule properly around a UAE household where weekday, weekend, and Jumu'ah occupancy patterns differ substantially. Indoor noise is among the lowest in this roundup, matched only by the Mitsubishi Kirigamine. Five-year compressor warranty through Fujitsu General UAE.`,
  },
  {
    id: 'ac-19', brand: 'Bosch', title: 'Bosch Climate 5000i 1.5 Ton T3 Inverter Split AC',
    editorialScore: 4.4, priceBand: { min: 1550, max: 1950 },
    image: 'https://m.media-amazon.com/images/I/61n4V-xFJGL._AC_SL1500_.jpg',
    amazonQuery: 'Bosch Climate 5000i inverter split AC UAE 1.5 ton',
    description: `German build quality applied to a residential split system. The Climate 5000i comes out of the same engineering culture as Bosch's commercial building-systems division, and the difference shows in the outdoor unit: heavier-gauge galvanised steel casing than budget competitors use, which damps vibration and stands up better to rooftop and balcony installation where sandstorm debris is a fact of life. The T3-rated inverter holds setpoint tightly, and the EasyAir app includes a monthly kWh report that is genuinely useful for understanding the cooling component of a DEWA bill rather than guessing at it. A HEPA-grade pre-filter captures a useful share of construction dust before it reaches the coil, extending practical filter intervals in most Dubai locations. Five-year comprehensive warranty through Bosch UAE. A strong pick for European build quality at mid-range money.`,
  },
  {
    id: 'ac-20', brand: 'AUX', title: 'AUX 1.5 Ton T3 Budget Inverter Split AC',
    editorialScore: 4.0, priceBand: { min: 850, max: 1050 },
    image: 'https://m.media-amazon.com/images/I/71B3h9YNUBL._AC_SL1500_.jpg',
    amazonQuery: 'AUX inverter split AC 1.5 ton UAE T3',
    description: `The bottom of the T3 inverter market, recommended with clear caveats. AUX manufactures compressor assemblies on an OEM basis for brands better known than itself, which is why the core hardware is more credible than the price suggests. The rotary inverter compressor carries T3 certification, so it is a genuine hot-climate unit rather than a T1 unit sold optimistically — that alone puts it ahead of much of what is sold at this price in the UAE. What you give up is everything else: no Wi-Fi, no app, a basic remote, and the loudest indoor unit in this roundup, which rules it out of any bedroom. After-sales exists through UAE distributors but workshop turnaround is measurably slower than major-brand service centres. For a workshop, store room, utility space, or budget studio where cost is the only real constraint, this is the most honest bottom-of-market recommendation we can make.`,
  },
];

const airPurifiers = [
  {
    id: 'purifier-1', brand: 'Dyson', title: 'Dyson Purifier Cool Formaldehyde TP09',
    editorialScore: 4.8, priceBand: { min: 1950, max: 2450 },
    image: 'https://m.media-amazon.com/images/I/31i39FHhNTL._AC_.jpg',
    amazonQuery: 'Dyson Purifier Cool Formaldehyde air purifier UAE',
    description: `The best all-in-one purifier and fan for UAE homes. The TP09's distinguishing feature is a solid-state catalytic filter that breaks formaldehyde down continuously rather than trapping it — and because the catalyst regenerates, that element never needs replacing. Formaldehyde is a specific and under-appreciated UAE problem: MDF furniture, fitted wardrobes, curtains, and vinyl flooring off-gas it for many months in newly furnished apartments. The Dyson Link app reports live PM2.5, PM10, NO₂, and VOC readings, which is genuinely useful during Shamal dust events when outdoor air quality deteriorates sharply. The bladeless fan function doubles as air movement in the shoulder seasons. Expensive, and the sealed HEPA and carbon filters are a recurring cost — but this is the most capable single appliance in the category.`,
  },
  {
    id: 'purifier-2', brand: 'Blueair', title: 'Blueair Blue Pure 211+ Max HEPA Air Purifier',
    editorialScore: 4.7, priceBand: { min: 800, max: 1000 },
    image: 'https://m.media-amazon.com/images/I/71ZEyjB4xAL._AC_SL1500_.jpg',
    amazonQuery: 'Blueair Blue Pure 211 Max HEPA air purifier UAE',
    description: `The large-room value pick for UAE villas. Blueair rates the 211+ Max at a clean air delivery rate high enough to turn over the air in a typical villa majlis of 40 to 60 m² about once an hour — coverage no other purifier near this price matches. Its washable fabric pre-filter is the detail that matters most in this market: it catches coarse desert dust before it reaches the HEPA media, and in a country with year-round construction activity that is what determines whether your main filter lasts its rated life or half of it. Replacement filters are also materially cheaper than Dyson's. The trade-off is deliberate simplicity — no app, no air quality display, no automatic mode. For families who want clean air without managing another connected device, this is our honest value recommendation.`,
  },
  {
    id: 'purifier-3', brand: 'Philips', title: 'Philips Series 3000i HEPA Air Purifier',
    editorialScore: 4.5, priceBand: { min: 650, max: 850 },
    image: 'https://m.media-amazon.com/images/I/71bvJFHPL-L._AC_SL1500_.jpg',
    amazonQuery: 'Philips Series 3000i HEPA air purifier UAE',
    description: `The mid-range choice for UAE apartments where you want to see what the air is doing. Philips' AeraSense sensor tracks PM2.5, PM10, and VOCs together and drives both the on-unit pollution index and the Clean Home+ app, so automatic mode responds to a dust event without you noticing it first. Filtration is HEPA H13, rated to capture 99.95% of particles down to 0.1 micron. One practical caveat specific to this region: Philips rates the filter for roughly twelve months, but UAE dust loading is well above the conditions that rating assumes, so budget for replacement closer to nine or ten months and watch the indicator rather than the calendar. Widely stocked on both Amazon.ae and Noon.ae, which usually keeps pricing competitive.`,
  },
  {
    id: 'purifier-4', brand: 'Xiaomi', title: 'Xiaomi Smart Air Purifier 4 Pro HEPA',
    editorialScore: 4.4, priceBand: { min: 530, max: 680 },
    image: 'https://m.media-amazon.com/images/I/61eMrD-HKGL._AC_SL1000_.jpg',
    amazonQuery: 'Xiaomi Smart Air Purifier 4 Pro HEPA UAE',
    description: `The best budget smart purifier for UAE studios and single rooms. Xiaomi pairs a genuine HEPA H13 filter with a high rated clean air delivery rate at a price no competitor matches, and the Mi Home app is the most broadly compatible in this roundup — it works with Google Home, Amazon Alexa, and Apple HomeKit without a bridge, which matters if you have already committed to one of those ecosystems. The OLED panel shows live PM2.5 in µg/m³. Replacement filters are the cheapest of any unit here. The reservation is after-sales: Xiaomi's UAE service network is thinner than Philips or Honeywell, so an out-of-warranty fault likely means a third-party repair or replacement. Buy it understanding that trade-off, and it is excellent value.`,
  },
  {
    id: 'purifier-5', brand: 'Coway', title: 'Coway Airmega 400 Smart HEPA Air Purifier',
    editorialScore: 4.6, priceBand: { min: 1150, max: 1450 },
    image: 'https://m.media-amazon.com/images/I/71tRTvTQWnL._AC_SL1500_.jpg',
    amazonQuery: 'Coway Airmega 400 HEPA air purifier UAE',
    description: `Our pick for open-plan UAE villas. The Airmega 400 draws air in through both sides simultaneously rather than from one face, which solves the practical limitation of front-intake purifiers placed centrally in a large room — a directional unit leaves dead zones behind it. The Max2 filter combines activated carbon for traffic-borne NOx and cooking odours with HEPA media, behind a washable pre-filter that takes the coarse dust load. Automatic mode is driven by a real-time particle sensor and reacts to cooking events quickly enough to be useful rather than decorative. Coway's filter-life indicator is based on actual measured loading rather than a simple timer, which is the correct approach in a market where filter life varies enormously by location. Well stocked on Amazon.ae and Noon.ae.`,
  },
  {
    id: 'purifier-6', brand: 'Levoit', title: 'Levoit Core 600S Smart True HEPA Air Purifier',
    editorialScore: 4.5, priceBand: { min: 620, max: 790 },
    image: 'https://m.media-amazon.com/images/I/61E9vwcbUML._AC_SL1500_.jpg',
    amazonQuery: 'Levoit Core 600S HEPA air purifier UAE',
    description: `The strongest large-room value proposition under AED 700. Levoit rates the Core 600S for spaces up to around 56 m², which covers most UAE villa living rooms, through a three-stage system of pre-filter, HEPA H13, and activated carbon. The VeSync app is stable and the Alexa and Google Assistant integrations work reliably on local networks. Sleep mode is genuinely quiet and dims the display fully, which matters if the unit lives in a bedroom. Replacement filters are reasonably priced and consistently stocked on Amazon.ae, which is not true of every brand in this list. What you give up against the Philips and Dyson units is the on-device air quality readout — you get automatic operation but less insight into what it is responding to.`,
  },
  {
    id: 'purifier-7', brand: 'Winix', title: 'Winix 5500-2 HEPA + PlasmaWave Air Purifier',
    editorialScore: 4.4, priceBand: { min: 750, max: 950 },
    image: 'https://m.media-amazon.com/images/I/71pZaTtFmHL._AC_SL1500_.jpg',
    amazonQuery: 'Winix 5500-2 HEPA PlasmaWave air purifier UAE',
    description: `Our recommendation for UAE homes with pets or persistent odour problems. The 5500-2 pairs True HEPA filtration with a substantial activated carbon layer — the component that actually addresses odour, as opposed to the ionisation that manufacturers tend to market harder. Winix's PlasmaWave adds ion-based neutralisation of VOCs and can be switched off entirely if you would rather not run it, which we appreciate: it is one of the few units in this category that treats ionisation as optional. The washable pre-filter takes pet hair before it reaches the HEPA media, which meaningfully extends main filter life in a dusty climate. Automatic mode responds to odour and particle spikes — cooking, smoke drifting in from a shared corridor, paint fumes from a neighbouring renovation — without manual intervention.`,
  },
  {
    id: 'purifier-8', brand: 'Honeywell', title: 'Honeywell HPA300 HEPA Air Purifier',
    editorialScore: 4.3, priceBand: { min: 700, max: 900 },
    image: 'https://m.media-amazon.com/images/I/71e0TM4EwNL._AC_SL1500_.jpg',
    amazonQuery: 'Honeywell HPA300 HEPA air purifier UAE',
    description: `The established choice for buyers who want an appliance rather than a gadget. The HPA300 has been a fixture of the large-room purifier category for years, and that track record is worth something no newer budget competitor can offer. True HEPA filtration captures 99.97% of particles at 0.3 micron, with an activated carbon pre-filter handling odours and the VOCs that accumulate in shared building air systems. Four fan levels including a turbo setting. There is deliberately no Wi-Fi, no app, and no air quality display — fewer electronics means fewer failure points across a service life measured in years rather than warranty periods. For UAE residents who want to switch a purifier on and stop thinking about it, this is the most dependable recommendation at its price.`,
  },
  {
    id: 'purifier-9', brand: 'IQAir', title: 'IQAir HealthPro Plus Medical-Grade HEPA Air Purifier',
    editorialScore: 4.9, priceBand: { min: 3100, max: 3900 },
    image: 'https://m.media-amazon.com/images/I/71N6U5dAybL._AC_SL1500_.jpg',
    amazonQuery: 'IQAir HealthPro Plus HEPA air purifier UAE',
    description: `Clinical-grade filtration, and the only unit here we would describe that way without qualification. IQAir's HyperHEPA media is certified to capture particles down to 0.003 micron — an order of magnitude finer than the 0.3 micron figure standard HEPA ratings are quoted at — and each unit ships with an individually signed performance certificate from its own factory test. That is why these appear in hospital isolation areas and pharmaceutical clean rooms rather than only in homes. For UAE residents managing chronic respiratory disease, recovering from surgery, or immunocompromised during treatment, this is a clinical decision rather than a consumer one, and the price reflects a different category of product. For everyone else, the Medify or Coway units deliver most of the practical benefit for a fraction of the outlay.`,
  },
  {
    id: 'purifier-10', brand: 'Sharp', title: 'Sharp Plasmacluster HEPA Air Purifier',
    editorialScore: 4.5, priceBand: { min: 980, max: 1250 },
    image: 'https://m.media-amazon.com/images/I/61S5nAF6zzL._AC_.jpg',
    amazonQuery: 'Sharp Plasmacluster HEPA air purifier UAE',
    description: `Our pick where mould and airborne biological load are the concern rather than dust alone. Sharp's Plasmacluster ion technology has a deeper base of published independent research behind it than any competing ionisation system in this roundup, which is the reason we treat it differently from broadly similar marketing claims. The UAE relevance is specific: buildings with central AC that is rarely properly serviced — common in older JBR towers, Marina buildings, and Abu Dhabi Corniche apartments — accumulate mould spores and bacterial growth in ductwork, and summer humidity above 90% keeps conditions favourable for it. Pairing HEPA particulate filtration with ion-based biological treatment addresses both problems in one unit. Quiet in silent mode, and replacement filters are competitively priced on Amazon.ae.`,
  },
  {
    id: 'purifier-11', brand: 'Panasonic', title: 'Panasonic nanoe-X HEPA Air Purifier',
    editorialScore: 4.6, priceBand: { min: 850, max: 1080 },
    image: 'https://m.media-amazon.com/images/I/71s40QoAJbL._AC_UL640_QL65_.jpg',
    amazonQuery: 'Panasonic nanoe HEPA air purifier UAE',
    description: `The purifier we would put in or adjacent to a UAE kitchen. Panasonic's nanoe-X generates hydroxyl radicals held within water molecules, which react with and break down odour compounds rather than masking them with fragrance — a meaningful distinction if you cook with spices regularly, since aromatic compounds from Gulf and South Asian cooking persist in soft furnishings long after the meal. The HEPA H13 layer handles cooking particulates, which reach genuinely high concentrations in enclosed kitchens without effective extraction. The Econavi sensor raises fan speed when it detects the heat and humidity signature of cooking. This is a purpose-designed kitchen unit rather than a bedroom purifier pressed into service — a distinction that matters in UAE villa layouts where kitchen and living space are often continuous.`,
  },
  {
    id: 'purifier-12', brand: 'Electrolux', title: 'Electrolux Pure A9 HEPA Air Purifier',
    editorialScore: 4.4, priceBand: { min: 1020, max: 1300 },
    image: 'https://m.media-amazon.com/images/I/71bvJFHPL-L._AC_SL1500_.jpg',
    amazonQuery: 'Electrolux Pure A9 HEPA air purifier UAE',
    description: `The best-looking purifier on the UAE market, and better engineered than that description suggests. The cylindrical 360° intake is not merely a styling decision — it eliminates the airflow dead zone that directional units create behind themselves, which matters whenever the purifier sits in the middle of a room rather than against a wall. The CleanSense IQ sensor array monitors PM2.5, PM10, TVOC, and CO₂ together, giving a fuller picture of indoor air than particle-only sensors, and the companion app produces weekly air quality summaries. Scandinavian design language means it reads as furniture rather than as a medical appliance, which is the practical reason people leave purifiers running in living rooms instead of hiding them. Filters are widely available on Amazon.ae.`,
  },
  {
    id: 'purifier-13', brand: 'Molekule', title: 'Molekule Air Pro PECO Air Purifier',
    editorialScore: 4.3, priceBand: { min: 1700, max: 2150 },
    image: 'https://m.media-amazon.com/images/I/71pZaTtFmHL._AC_SL1500_.jpg',
    amazonQuery: 'Molekule Air Pro PECO air purifier UAE',
    description: `The most unusual technology in this roundup, and genuinely relevant to one specific UAE problem. Molekule's PECO process uses a UV-activated catalyst to oxidise pollutants rather than trap them. That distinction matters for VOCs in particular: activated carbon adsorbs VOC molecules but can release them again as it saturates and as temperatures rise, whereas oxidation destroys them. In UAE homes with high VOC loads — recently completed developments, newly fitted wardrobes, frequent refurbishment, cleaning products in poorly ventilated bathrooms — that is the difference between relocating a pollutant and eliminating it. A HEPA layer handles ordinary particulates alongside. The technology has attracted legitimate scientific debate about real-world throughput, so we would position this as a specialist choice for VOC-heavy environments rather than a general recommendation.`,
  },
  {
    id: 'purifier-14', brand: 'Levoit', title: 'Levoit Core 300S Compact Smart HEPA Purifier',
    editorialScore: 4.5, priceBand: { min: 310, max: 400 },
    image: 'https://m.media-amazon.com/images/I/51nEWBbFhJL._AC_SL1000_.jpg',
    amazonQuery: 'Levoit Core 300S Smart HEPA air purifier UAE',
    description: `The best first purifier for a UAE resident who has never owned one. The Core 300S delivers HEPA H13 filtration, VeSync app control, and near-silent sleep-mode operation for well under AED 400, with coverage suited to single bedrooms and home offices of around 20 m². Its 360° intake avoids the dead-zone problem of directional units in small rooms. The detail we like most is the choice of three interchangeable filter types — standard HEPA, a toxin absorber with additional activated carbon for new-furniture off-gassing, and a pet-oriented variant — so the same unit can be matched to whichever UAE air quality problem you actually have. Consistently available for fast delivery across Dubai, Abu Dhabi, and Sharjah, and replacement filters are cheap and always in stock.`,
  },
  {
    id: 'purifier-15', brand: 'Winix', title: 'Winix Zero Pro 4-Stage HEPA Air Purifier',
    editorialScore: 4.6, priceBand: { min: 980, max: 1250 },
    image: 'https://m.media-amazon.com/images/I/61E9vwcbUML._AC_SL1500_.jpg',
    amazonQuery: 'Winix Zero Pro HEPA air purifier UAE',
    description: `The most complete filtration stack under AED 1,200, and the one we would choose for a household facing several air quality problems at once. The Zero Pro addresses all four of the common UAE residential issues in a single unit: a washable fabric pre-filter for coarse desert dust, True HEPA for the fine particulates that construction and traffic generate, activated carbon for NOx near major roads and for cooking odours, and switchable PlasmaWave ionisation for biological contamination. No other unit at this price covers all four. The HEPA media itself is noticeably thicker and more densely packed than competitors at this level, which is what allows the longer service intervals Winix quotes. Automatic mode is reliable and requires very little ongoing attention beyond an occasional pre-filter wash.`,
  },
  {
    id: 'purifier-16', brand: 'Samsung', title: 'Samsung Bespoke Cube Air Purifier',
    editorialScore: 4.6, priceBand: { min: 1330, max: 1700 },
    image: 'https://m.media-amazon.com/images/I/71DozWpxpBL._AC_SL1500_.jpg',
    amazonQuery: 'Samsung Bespoke Cube air purifier UAE',
    description: `The obvious choice for a household already invested in Samsung appliances. The Bespoke Cube is designed as a furniture object — stackable, with interchangeable colour panels — so it integrates into a UAE villa interior without the clinical look most purifiers carry. Behind the styling is a conventional and effective three-stage system: pre-filter, HEPA H13, and an activated carbon deodorising layer, rated for rooms up to around 50 m². The real argument for it is SmartThings: if your washer, fridge, TV, and air conditioner already live in that app, the purifier joins the same automations and the same hub rather than adding a fifth account and a fifth notification stream. Automatic mode responds promptly to cooking and to dust entering through opened balcony doors. Genuine replacement filters are stocked by Samsung UAE.`,
  },
  {
    id: 'purifier-17', brand: 'Alen', title: 'Alen BreatheSmart 75i HEPA Air Purifier',
    editorialScore: 4.7, priceBand: { min: 1200, max: 1520 },
    image: 'https://m.media-amazon.com/images/I/71tRTvTQWnL._AC_SL1500_.jpg',
    amazonQuery: 'Alen BreatheSmart 75i HEPA air purifier UAE',
    description: `The largest room coverage in this roundup, backed by the strongest warranty. Alen rates the BreatheSmart 75i for spaces up to around 75 m², which makes it the correct answer for UAE open-plan villa great rooms, double-height majlis spaces, and combined living-dining areas that defeat smaller units. Its HEPA-Pure filter is rated to 0.1 micron, and the automatic mode's particle sensor responds quickly to sudden spikes. The distinguishing commercial term is a lifetime warranty on the unit itself — a published policy rather than a promotional claim, which materially changes the risk calculation on a purchase at this price. Alen also offers a filter subscription that ships replacements automatically, which removes the main reason large purifiers end up running on exhausted media through a UAE summer.`,
  },
  {
    id: 'purifier-18', brand: 'Austin Air', title: 'Austin Air HealthMate True HEPA Air Purifier',
    editorialScore: 4.8, priceBand: { min: 1780, max: 2250 },
    image: 'https://m.media-amazon.com/images/I/71N6U5dAybL._AC_SL1500_.jpg',
    amazonQuery: 'Austin Air HealthMate HEPA air purifier UAE',
    description: `The lowest total cost of ownership of any purifier here, despite the highest-but-one purchase price. Austin Air builds the HealthMate around a single four-stage filter containing several kilograms of activated carbon and zeolite alongside True HEPA media, and rates it for a five-year service life. Even discounting heavily for UAE dust loading, that is several times the interval of any competitor in this list — and it converts a recurring annual filter cost into an occasional one. The steel casing rather than plastic is a further durability advantage in a country where units often sit in strong sunlight near windows, which embrittles plastic over time. There is no app, no display, and no automatic mode: three manual fan speeds. For a buyer who wants to install a purifier and genuinely forget about it, this is the most practical long-term choice available.`,
  },
  {
    id: 'purifier-19', brand: 'Rabbit Air', title: 'Rabbit Air MinusA2 Ultra-Quiet HEPA Purifier',
    editorialScore: 4.6, priceBand: { min: 1520, max: 1920 },
    image: 'https://m.media-amazon.com/images/I/61S5nAF6zzL._AC_.jpg',
    amazonQuery: 'Rabbit Air MinusA2 HEPA air purifier UAE',
    description: `The answer for compact UAE apartments where floor space is the binding constraint. The MinusA2 mounts flush to a wall with the kit included in the box, occupying no floor area at all — a genuine advantage in Dubai studios, JVC one-bedrooms, and children's rooms. Wall mounting also distributes purified air more evenly across a room than a floor-standing unit, since the intake sits above furniture rather than behind it. Filtration runs to six stages, and the third stage is customisable: a toxin absorber for new-furniture off-gassing, an odour remover for kitchen-adjacent rooms, or a germ defence layer for shared accommodation. The BioGS HEPA media is designed to resist bacterial growth within the filter itself, which is more relevant in UAE summer humidity than in the markets it was designed for. Among the quietest units in this roundup.`,
  },
  {
    id: 'purifier-20', brand: 'Medify', title: 'Medify MA-40 Medical-Grade H13 HEPA Air Purifier',
    editorialScore: 4.5, priceBand: { min: 750, max: 950 },
    image: 'https://m.media-amazon.com/images/I/51nEWBbFhJL._AC_SL1000_.jpg',
    amazonQuery: 'Medify MA-40 H13 HEPA air purifier UAE',
    description: `The most affordable route to genuine H13 filtration, and our value pick for children's bedrooms. H13 is the grade used in hospital isolation rooms, rated to 99.97% at 0.1 micron — finer than the H12 media several more expensive units in this list rely on. Medify uses a dual-layer H13 filter so air is treated on both the intake and secondary passes, and rates the unit for rooms up to roughly 42 m². Three fan speeds plus a quiet sleep mode, with a touchscreen panel that doubles as a live PM2.5 readout — unusual at this price. Replacement filters are reasonably priced and reliably stocked on Amazon.ae. For UAE parents who want the highest available filtration standard without IQAir or Dyson money, this is the correct choice.`,
  },
];

const smartThermostats = [
  {
    id: 'thermo-1', brand: 'Nest', title: 'Google Nest Learning Thermostat — UAE Compatible',
    editorialScore: 4.8, priceBand: { min: 750, max: 950 },
    image: 'https://m.media-amazon.com/images/I/71B3yZmP9CL._AC_SL1500_.jpg',
    amazonQuery: 'Google Nest Learning Thermostat UAE',
    description: `The most extensively studied smart thermostat on the market, and our default recommendation for UAE homes with compatible wiring. The learning algorithm builds a schedule from your actual behaviour within the first week, then applies setback automatically — raising the setpoint when the home empties rather than waiting for you to remember. Independent evaluations in other hot-climate markets have consistently found double-digit cooling savings from setback and geofencing together, and the underlying mechanism applies directly to UAE conditions, where the gap between occupied and unoccupied cooling demand is very large. Geofencing through the Google Home app begins cooling ahead of your arrival. One critical check before buying: most UAE installations require a C-wire, so confirm with your HVAC technician that your control board provides one.`,
  },
  {
    id: 'thermo-2', brand: 'Ecobee', title: 'Ecobee SmartThermostat Premium with SmartSensor',
    editorialScore: 4.7, priceBand: { min: 980, max: 1250 },
    image: 'https://m.media-amazon.com/images/I/81FBqKBrdRL._AC_SL1500_.jpg',
    amazonQuery: 'Ecobee SmartThermostat Premium UAE',
    description: `The right choice for UAE villas, for one structural reason: remote sensors. A wall-mounted thermostat measures temperature at exactly one point, which in a two-storey villa is almost always the wrong point — heat rises, so the ground floor reaches setpoint and shuts off cooling while upstairs bedrooms stay warm. Ecobee's wireless SmartSensors let the system average across occupied rooms instead, which is the direct fix for the most common comfort complaint in UAE villas. The system supports a large number of sensors, so a whole house can be covered. Amazon Alexa is built in, removing the need for a separate speaker. Compatible with 24V UAE systems, and Ecobee publishes wiring guidance covering the configurations common in Gulf split installations.`,
  },
  {
    id: 'thermo-3', brand: 'Honeywell', title: 'Honeywell Home T9 Smart Wi-Fi Thermostat',
    editorialScore: 4.5, priceBand: { min: 580, max: 730 },
    image: 'https://m.media-amazon.com/images/I/71XhkAKEiDL._AC_SL1500_.jpg',
    amazonQuery: 'Honeywell Home T9 smart wifi thermostat UAE',
    description: `The easiest smart thermostat to get working in a UAE apartment. The Resideo app walks through installation step by step and covers the control board configurations most commonly encountered here, which removes the single biggest source of frustration in this category — discovering mid-installation that your wiring does not match the diagram in the box. Smart room sensors detect occupancy and prevent the system cooling rooms nobody is in. Geofencing works reliably on both major UAE mobile networks. Compatible with most 24V UAE central and split systems. Frequently competitively priced on Noon.ae as well as Amazon.ae, with UAE warranty support. A sensible middle option if the Nest's learning behaviour appeals less than a schedule you set yourself.`,
  },
  {
    id: 'thermo-4', brand: 'Tado', title: 'Tado Smart AC Control (UAE Split AC Compatible)',
    editorialScore: 4.4, priceBand: { min: 400, max: 510 },
    image: 'https://m.media-amazon.com/images/I/51s3qJGmxLL._AC_SL1000_.jpg',
    amazonQuery: 'Tado Smart AC Control UAE split AC',
    description: `The only practical smart-cooling upgrade for most UAE tenants, and the one we recommend most often for rented apartments. Unlike wired thermostats, this is an infrared controller that replaces your existing remote — no electrical work, no control board access, and nothing that a landlord could object to. It supports a very large library of remote codes covering effectively every split AC brand sold in the UAE, so compatibility is rarely an issue. Installation takes minutes: mount it in line of sight of the indoor unit, pair the remote, connect to Wi-Fi. From there you get scheduling, geofencing, and usage reporting that work much like a wired system. For anyone who cannot modify their apartment's HVAC wiring, this is the single highest-value purchase in this category.`,
  },
  {
    id: 'thermo-5', brand: 'Sensibo', title: 'Sensibo Sky Smart AC Controller',
    editorialScore: 4.3, priceBand: { min: 350, max: 450 },
    image: 'https://m.media-amazon.com/images/I/71IhurleEQL._AC_SL1500_.jpg',
    amazonQuery: 'Sensibo Sky smart AC controller UAE',
    description: `The budget infrared controller, and in one respect better suited to the UAE than its more expensive rival. Sensibo's Climate React monitors humidity alongside temperature and can switch the air conditioner into dry mode automatically when indoor humidity climbs past a threshold you set. That is directly useful here: UAE coastal humidity in August makes a room at 24°C feel considerably worse than the same temperature in dry inland conditions, and dry mode addresses the cause rather than over-cooling to compensate. Scheduling, geofencing, and remote control work as expected, and the app estimates energy use from runtime and mode, which is a reasonable proxy for the cooling share of a DEWA bill. Works with Alexa, Google Home, Apple HomeKit, and SmartThings.`,
  },
  {
    id: 'thermo-6', brand: 'Schneider', title: 'Schneider Electric Wiser Smart Thermostat',
    editorialScore: 4.4, priceBand: { min: 800, max: 1010 },
    image: 'https://m.media-amazon.com/images/I/51Ceejf+6kL._AC_SL1429_.jpg',
    amazonQuery: 'Schneider Electric Wiser smart thermostat UAE',
    description: `The natural choice for UAE properties already fitted with Schneider electrical infrastructure, which covers a significant amount of Abu Dhabi institutional and staff housing as well as many premium residential conversions. The Wiser platform brings thermostats, smart plugs, and lighting onto one system, and in a villa automation project that unification is worth more than any individual device feature — it is the difference between one app and five. As a standalone thermostat it does the fundamentals properly: scheduling, remote control, and geofencing through the Wiser Home app. Its occupancy learning is less sophisticated than Google Nest's, which is the main functional trade-off. Schneider's UAE support network is among the largest of any manufacturer here, which matters for multi-zone properties needing professional commissioning.`,
  },
  {
    id: 'thermo-7', brand: 'Siemens', title: 'Siemens Smart Wi-Fi Room Thermostat',
    editorialScore: 4.3, priceBand: { min: 670, max: 850 },
    image: 'https://m.media-amazon.com/images/I/71XhkAKEiDL._AC_SL1500_.jpg',
    amazonQuery: 'Siemens smart wifi room thermostat UAE',
    description: `Commercial-grade reliability in a residential format. Siemens builds building automation for major UAE infrastructure, and this thermostat reflects that lineage in the specifications that matter for longevity rather than marketing: tighter temperature sensing accuracy than typical consumer units, and a switching relay rated for a service life that assumes heavy cycling. That second point is more relevant in the UAE than almost anywhere — a cooling system here may cycle hundreds of times a day through summer, and relay wear is a real failure mode. The app is functional rather than feature-rich, and there is no learning algorithm. For property managers, facilities staff, or technically minded owners who value precision and durability over smart-home integration, this is a professional choice at a residential price.`,
  },
  {
    id: 'thermo-8', brand: 'Wyze', title: 'Wyze Thermostat Smart Wi-Fi',
    editorialScore: 4.2, priceBand: { min: 310, max: 400 },
    image: 'https://m.media-amazon.com/images/I/61nt3YX2i7L._AC_SL1500_.jpg',
    amazonQuery: 'Wyze Thermostat smart wifi UAE',
    description: `The cheapest wired smart thermostat worth buying, with a feature set that punches well above its price: scheduling, geofencing, home and away automation, and usage history. What it lacks are the things that separate good smart thermostats from great ones — no remote room sensors, no adaptive learning, and occupancy detection limited to phone geofencing. In practice that means you will capture the savings available from a good schedule but not the additional margin a Nest finds by learning your actual patterns. It requires a C-wire, which many UAE central systems provide and many split AC control boards do not, so check before ordering. As a first smart thermostat on a strict budget, it delivers the fundamentals honestly.`,
  },
  {
    id: 'thermo-9', brand: 'ABB', title: 'ABB free@home Smart Thermostat System',
    editorialScore: 4.5, priceBand: { min: 1150, max: 1470 },
    image: 'https://m.media-amazon.com/images/I/81FBqKBrdRL._AC_SL1500_.jpg',
    amazonQuery: 'ABB free at home smart thermostat UAE',
    description: `A whole-building system rather than a thermostat, and specified by UAE developers in a number of premium villa communities — which makes it the default choice if your property is already pre-wired for it. The argument for free@home is coordination that standalone thermostats structurally cannot achieve: when external blinds close against direct sun, the climate control adjusts in the same automation, because both are on one backbone alongside lighting, access control, and security. In a UAE villa where solar gain through glazing is the dominant cooling load, that coordination is where the real savings sit. It requires ABB-certified installation, available through licensed partners across the country, and carries the highest total cost here. Justified for whole-home automation projects, hard to justify for a single room.`,
  },
  {
    id: 'thermo-10', brand: 'Legrand', title: 'Legrand Céliane Connected Thermostat',
    editorialScore: 4.3, priceBand: { min: 890, max: 1130 },
    image: 'https://m.media-amazon.com/images/I/71B3yZmP9CL._AC_SL1500_.jpg',
    amazonQuery: 'Legrand Celiane connected thermostat UAE',
    description: `Specified by interior designers on high-end UAE projects, and chosen for a reason that is entirely legitimate even if it is not technical: the Céliane range shares a flush-mounting system with Legrand's complete switch, socket, and data plate ecosystem, so a wall carries one consistent design language instead of a thermostat that visibly does not belong. On projects where every visible fitting has been specified deliberately, that matters. Functionally it delivers Wi-Fi scheduling, remote app control, and multi-zone HVAC management sufficient for a large villa. It will not out-think a Nest on occupancy learning. If you are already specifying Legrand throughout a UAE property, this completes the scheme without a functional compromise; if you are not, the case is weaker.`,
  },
  {
    id: 'thermo-11', brand: 'Danfoss', title: 'Danfoss ECtemp Smart Wi-Fi Floor Thermostat',
    editorialScore: 4.4, priceBand: { min: 750, max: 950 },
    image: 'https://m.media-amazon.com/images/I/51s3qJGmxLL._AC_SL1000_.jpg',
    amazonQuery: 'Danfoss ECtemp smart wifi thermostat UAE',
    description: `A specialist unit, and we want to be direct about that: if your UAE property has conventional split AC, which the overwhelming majority do, this offers you nothing a Nest or Ecobee does not. Its purpose is hydronic underfloor systems, which are being specified in some premium Saadiyat and Yas Island villa projects for chilled-water cooling in summer and mild heating in winter. Those systems need modulating rather than on-off control, because a floor slab's thermal mass turns binary switching into uncomfortable temperature swings that arrive hours late. Danfoss has specialised in exactly this problem for decades, and the adaptive algorithm learns your specific floor construction's response time. Full Wi-Fi scheduling and app control included. Buy it only if you have the system it was designed for.`,
  },
  {
    id: 'thermo-12', brand: 'Honeywell Pro', title: 'Honeywell Pro Series Smart Thermostat',
    editorialScore: 4.3, priceBand: { min: 670, max: 850 },
    image: 'https://m.media-amazon.com/images/I/71XhkAKEiDL._AC_SL1500_.jpg',
    amazonQuery: 'Honeywell Pro Series smart thermostat UAE',
    description: `Built for fleet deployment rather than single homes, and the right answer for UAE holiday-home operators, serviced apartment companies, and building managers. The value is not in the thermostat but in the Total Connect Comfort Pro platform behind it: settings across a large number of units can be monitored and changed from one web dashboard, without physical access to any apartment. For an operator paying DEWA on vacant units that guests left at 18°C, that capability pays for itself quickly, and vacancy detection and fleet-wide setback programming address the problem systematically rather than unit by unit. The hardware itself is straightforward Honeywell — reliable, unremarkable, easy to install. Volume pricing and commercial support are available through UAE distribution.`,
  },
  {
    id: 'thermo-13', brand: 'Nest', title: 'Google Nest Thermostat E — UAE Budget Option',
    editorialScore: 4.4, priceBand: { min: 490, max: 620 },
    image: 'https://m.media-amazon.com/images/I/71B3yZmP9CL._AC_SL1500_.jpg',
    amazonQuery: 'Google Nest Thermostat E UAE',
    description: `The Nest ecosystem at a materially lower price, with one deliberate omission. You keep geofencing, remote control, scheduling, and home/away automation; you give up the auto-learning algorithm, the mirror-finish display, and the metal casing. For some buyers that omission is actually an improvement: the Learning Thermostat spends its first weeks adjusting to you, which some people find unsettling rather than clever, whereas here you set a schedule on day one and it does exactly that. The savings gap between the two comes down to what learning adds over a well-configured manual schedule — real, but smaller than the price difference for most households. Compatible with most UAE 24V systems, C-wire required. Our value pick within the Nest range.`,
  },
  {
    id: 'thermo-14', brand: 'Ecobee', title: 'Ecobee SmartThermostat Enhanced',
    editorialScore: 4.6, priceBand: { min: 750, max: 950 },
    image: 'https://m.media-amazon.com/images/I/81FBqKBrdRL._AC_SL1500_.jpg',
    amazonQuery: 'Ecobee SmartThermostat Enhanced UAE',
    description: `The right Ecobee for a UAE apartment rather than a villa. It includes one SmartSensor, built-in Alexa, and the full scheduling and geofencing feature set, at a meaningful saving over the Premium model. The reasoning is straightforward: the Premium's advantage is multi-sensor averaging across many rooms, and that advantage scales with room count. In an apartment, one sensor placed in the bedroom captures nearly all of the available benefit, because the temperature gradient between a hallway thermostat and a bedroom is the problem you are solving — and the system expands later if you move. Ecobee's support team responds to UAE wiring queries by email, which is genuinely useful when an installer meets an unfamiliar control board. 24V systems, C-wire required.`,
  },
  {
    id: 'thermo-15', brand: 'Tado', title: 'Tado Smart Thermostat Starter Kit — Central HVAC',
    editorialScore: 4.4, priceBand: { min: 620, max: 790 },
    image: 'https://m.media-amazon.com/images/I/51s3qJGmxLL._AC_SL1000_.jpg',
    amazonQuery: 'Tado Smart Thermostat Starter Kit UAE',
    description: `Our pick for UAE residents who travel frequently, chiefly for one feature that sounds minor and is not. Open Window Detection senses the temperature signature of an opened balcony door and pauses cooling until it closes. In the UAE shoulder seasons, from roughly October to December and again in February and March, leaving a balcony door open while the AC runs is an extremely common and entirely invisible source of wasted DEWA expenditure — the system simply works harder and nothing tells you why. Tado's geofencing combines GPS with network positioning, which reduces the false "home" detections that undermine geofencing on some networks. The kit includes the thermostat and internet bridge. Professional installation is advisable for fan coil units.`,
  },
  {
    id: 'thermo-16', brand: 'Emerson', title: 'Emerson Sensi Touch Smart Thermostat',
    editorialScore: 4.4, priceBand: { min: 440, max: 560 },
    image: 'https://m.media-amazon.com/images/I/61nt3YX2i7L._AC_SL1500_.jpg',
    amazonQuery: 'Emerson Sensi Touch smart thermostat UAE',
    description: `The best value in this category for UAE households, and the only unit here with scheduling flexibility that genuinely fits the local week. Emerson is a major supplier of commercial HVAC controls to district cooling operators across the region, and the Sensi Touch applies that background at a residential price. The colour touchscreen is the sharpest in its tier. What sets it apart practically is flexible scheduling: separate patterns for the local weekend, for working days, and for Ramadan hours, when household routines shift substantially and a conventional weekday-weekend schedule becomes actively wrong. Geofencing is reliable on UAE networks. Works with Alexa, Google Assistant, and Apple HomeKit without a bridge. C-wire required for most installations; an adapter is available separately.`,
  },
  {
    id: 'thermo-17', brand: 'Amazon', title: 'Amazon Smart Thermostat — Wi-Fi HVAC',
    editorialScore: 4.2, priceBand: { min: 250, max: 320 },
    image: 'https://m.media-amazon.com/images/I/71XhkAKEiDL._AC_SL1500_.jpg',
    amazonQuery: 'Amazon Smart Thermostat wifi UAE',
    description: `The cheapest way into smart climate control, and a sensible one if your home already runs on Alexa. Amazon developed this in partnership with Resideo — Honeywell Home's spun-out business — so the underlying hardware shares its lineage with thermostats costing considerably more, with a simplified interface layered on top. Voice control through any Echo device is the primary interface and works well. Geofencing operates through the Alexa app's location permissions. The limitation to understand is that energy saving here is schedule-based rather than adaptive: you program the setback times and the unit follows them, with no learning. It suits single-zone systems, and is not appropriate for cassette or VRF installations without additional control interfaces. For an Alexa household on a budget, it delivers genuine smart control at the lowest price available.`,
  },
  {
    id: 'thermo-18', brand: 'Johnson Controls', title: 'Johnson Controls GLAS Smart Thermostat',
    editorialScore: 4.3, priceBand: { min: 1070, max: 1350 },
    image: 'https://m.media-amazon.com/images/I/81FBqKBrdRL._AC_SL1500_.jpg',
    amazonQuery: 'Johnson Controls GLAS smart thermostat UAE',
    description: `The most technically ambitious device in this category, and the only one that replaces a second appliance. Its translucent OLED display is the visible novelty, but the substantive feature is the built-in sensor array monitoring PM2.5, PM10, TVOC, and CO₂ — meaning it does the job of a standalone indoor air quality monitor alongside climate control. In UAE apartments with shared HVAC ducting, where contaminants can migrate between units, having air quality sensing tied directly to the system that moves the air is a real advantage rather than a novelty. Johnson Controls is the HVAC integrator behind a large share of Dubai's towers and government buildings, and this is that building-intelligence platform scaled down. Professional installation on 24V systems is recommended.`,
  },
  {
    id: 'thermo-19', brand: 'Bosch', title: 'Bosch BCC100 Wi-Fi Smart Thermostat',
    editorialScore: 4.3, priceBand: { min: 490, max: 620 },
    image: 'https://m.media-amazon.com/images/I/51Ceejf+6kL._AC_SL1429_.jpg',
    amazonQuery: 'Bosch BCC100 smart thermostat wifi UAE',
    description: `German engineering at a mid-range price, with one feature aimed squarely at UAE expatriate households. Holiday Mode lets you set a return date: the thermostat holds the property at maximum economy for the whole period away, then begins cooling shortly before you land. For residents who spend several weeks a year on home leave in South Asia, Europe, or the Philippines, that single feature addresses the awkward choice between paying to cool an empty apartment and returning to one at 40°C. Beyond that it is a well-built conventional unit: precise temperature sensing comparable to the Siemens, a seven-day programmable schedule, and a Home Connect app that has proved dependable. C-wire required and no adapter in the box. Alexa and Google Assistant compatible.`,
  },
  {
    id: 'thermo-20', brand: 'Mysa', title: 'Mysa Smart Thermostat for High-Voltage Systems',
    editorialScore: 4.2, priceBand: { min: 350, max: 450 },
    image: 'https://m.media-amazon.com/images/I/51s3qJGmxLL._AC_SL1000_.jpg',
    amazonQuery: 'Mysa smart thermostat 240V high voltage UAE',
    description: `Read the compatibility note before anything else: this thermostat is for 220–240V mains-voltage electric fan-coil units and panel heaters, not for the 24V low-voltage control circuits that the overwhelming majority of UAE split and central systems use. If your system is 24V — and it very probably is — choose any other unit in this roundup instead. Where it applies, however, Mysa is essentially the only option: properties in parts of Abu Dhabi, Khalifa City, and some compound housing use direct mains-wired units that every other smart thermostat here is incompatible with, and the alternative is rewiring. Installation requires isolating the circuit at the breaker but no low-voltage experience. The app provides scheduling, geofencing, and energy monitoring, with Alexa and Google Assistant support.`,
  },
];

/** Flattened catalogue with the category stamped onto each record. */
export const products = [
  ...smartAcs.map((p) => ({ ...p, category: 'smart-acs' })),
  ...airPurifiers.map((p) => ({ ...p, category: 'air-purifiers' })),
  ...smartThermostats.map((p) => ({ ...p, category: 'smart-thermostats' })),
];

/** Formats a price band for display, e.g. "AED 1,750 – 2,200". */
export function formatPriceBand(band) {
  if (!band || typeof band.min !== 'number' || typeof band.max !== 'number') {
    return 'Price varies';
  }
  return `AED ${band.min.toLocaleString()} – ${band.max.toLocaleString()}`;
}

/** Midpoint of a band, used wherever products need ordering by price. */
export function priceBandMidpoint(band) {
  if (!band || typeof band.min !== 'number' || typeof band.max !== 'number') {
    return Number.POSITIVE_INFINITY;
  }
  return (band.min + band.max) / 2;
}

export default products;
