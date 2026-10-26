/**
 * CoolLivingUAE — Lifestyle picks: gym wear, home appliances, dresses, shoes
 * ---------------------------------------------------------------------------
 * Same field contract as src/data/products.js — read it there before adding a
 * product. The rules that matter most here:
 *
 *   - Descriptions state what the brand says about its own materials and
 *     features, then our opinion of how well it suits the UAE climate. We
 *     have not wear-tested or used these items, and the copy never says so.
 *   - amazonQuery holds broad search terms (brand + line + type). Exact SKUs,
 *     colours and sizes change constantly in fashion; a search keeps working.
 *   - image stays '' until a photo of that exact product line is verified;
 *     the page then shows a neutral category tile. The owner can add photo
 *     links from the admin dashboard.
 *
 * Categories and their buying tips live in src/data/categories.js.
 * ---------------------------------------------------------------------------
 */

export const gymWear = [
  {
    id: 'gym-1', brand: 'Nike', title: 'Nike Dri-FIT Legend Men’s Training T-Shirt',
    editorialScore: 4.5, priceBand: { min: 80, max: 140 },
    image: '',
    amazonQuery: 'Nike Dri-FIT Legend training t-shirt men',
    description: `The default training tee, and for good reason. Dri-FIT is Nike's long-running sweat-wicking fabric: it draws moisture to the outside of the shirt to evaporate rather than letting it soak in, which is exactly what you want when you walk out of a cool gym into 40°C. The Legend is a plain, regular-fit tee without gimmicks, which keeps the price down and makes it easy to own several. The one reservation applies to most polyester kit: it can hold on to odour if it sits in a hot gym bag, so wash it promptly. For everyday gym sessions it is the safest buy in this list.`,
  },
  {
    id: 'gym-2', brand: 'adidas', title: 'adidas AEROREADY Men’s Training T-Shirt',
    editorialScore: 4.4, priceBand: { min: 70, max: 150 },
    image: '',
    amazonQuery: 'adidas AEROREADY training t-shirt men',
    description: `adidas's counterpart to Dri-FIT. AEROREADY is the brand's moisture-management technology, which adidas describes as absorbing moisture to keep you dry through a session, and much of its current training range is made partly from recycled polyester. In practice it does the same job as the Nike tee, so choose between the two on fit and price rather than on technology claims. If you train outdoors, pick a light colourway — pale fabric absorbs less sun than dark.`,
  },
  {
    id: 'gym-3', brand: 'Under Armour', title: 'Under Armour HeatGear Men’s Compression Short-Sleeve Shirt',
    editorialScore: 4.3, priceBand: { min: 110, max: 200 },
    image: '',
    amazonQuery: 'Under Armour HeatGear compression shirt men short sleeve',
    description: `Under Armour splits its kit by weather: HeatGear is the hot-weather line, ColdGear the cold. The compression version sits close to the skin, which helps sweat move into the fabric quickly and makes it a good base layer under a loose tee or a modest top. The trade-off is comfort — compression is not for everyone, and some people find a fitted layer warm on its own outdoors in July. Buy it as a training base layer rather than as a shirt to wear all day.`,
  },
  {
    id: 'gym-4', brand: 'PUMA', title: 'PUMA dryCELL Men’s Training Shorts',
    editorialScore: 4.2, priceBand: { min: 60, max: 140 },
    image: '',
    amazonQuery: 'PUMA dryCELL training shorts men',
    description: `Shorts are where cheap training kit fails in humidity: heavy fabric gets wet and stays wet. dryCELL is PUMA's moisture-wicking technology, and its training shorts pair it with a lightweight shell and an elastic waist. They are inexpensive, widely stocked, and dry quickly between sessions. Check the inseam length on the listing — PUMA sells several, and the longer cuts suit anyone who prefers more coverage.`,
  },
  {
    id: 'gym-5', brand: 'adidas', title: 'adidas Optime Women’s Training Leggings',
    editorialScore: 4.4, priceBand: { min: 150, max: 300 },
    image: '',
    amazonQuery: 'adidas Optime training leggings women',
    description: `Optime is adidas's training-tights line for women, made in a stretch fabric with AEROREADY moisture management. Full-length leggings are the practical choice in the UAE: they suit modest dressing in a mixed gym, protect your legs from the sun on outdoor sessions, and a wicking synthetic stays far cooler than cotton leggings. Choose 7/8 or full length depending on how much coverage you want, and check the listing for pockets — several Optime styles have one for a phone.`,
  },
  {
    id: 'gym-6', brand: 'Nike', title: 'Nike Swoosh Medium-Support Sports Bra',
    editorialScore: 4.5, priceBand: { min: 110, max: 200 },
    image: '',
    amazonQuery: 'Nike Swoosh medium support sports bra',
    description: `Nike's best-known sports bra and a sensible default for gym and studio sessions. Nike designs the Swoosh for medium-impact activity and makes it in Dri-FIT fabric; most versions have removable pads. For running and high-impact classes, choose a high-support bra instead — match the support level to what you do. In humid weather, the lighter, ventilated versions dry fastest between sessions.`,
  },
  {
    id: 'gym-7', brand: 'Reebok', title: 'Reebok Workout Ready Speedwick Women’s T-Shirt',
    editorialScore: 4.1, priceBand: { min: 50, max: 120 },
    image: '',
    amazonQuery: 'Reebok Workout Ready Speedwick t-shirt women',
    description: `The budget pick. Speedwick is Reebok's moisture-wicking fabric technology, used across its Workout Ready range of basic training kit. It does the same core job as the Nike and adidas tees for less money, which makes it a good way to build up a week's worth of gym tops. The cut is simple and the styling plain; if you want ventilation panels or premium fabric, spend more on the Nike range instead.`,
  },
  {
    id: 'gym-8', brand: 'Nike', title: 'Nike Pro Hijab',
    editorialScore: 4.6, priceBand: { min: 110, max: 200 },
    image: '',
    amazonQuery: 'Nike Pro hijab sport',
    description: `A product that matters in this region. Nike developed the Pro Hijab with feedback from Muslim athletes: a pull-on sport hijab in a lightweight, breathable stretch fabric, with no pins, and a longer back so it stays tucked in while you move. Compared with an everyday hijab it is noticeably cooler and stays put through a session. It comes in several sizes, so check Nike's size guide on the listing, and choose a light colour for outdoor training.`,
  },
];

export const homeAppliances = [
  {
    id: 'appliance-1', brand: 'LG', title: 'LG Top-Freezer Refrigerator with Smart Inverter Compressor',
    editorialScore: 4.5, priceBand: { min: 1600, max: 3200 },
    image: '',
    amazonQuery: 'LG top freezer refrigerator smart inverter compressor',
    description: `Our pick for hot kitchens. LG's Smart Inverter Compressor varies its speed instead of switching hard on and off, which LG says reduces energy use and noise, and LG typically gives the compressor a longer warranty than the rest of the fridge — check the UAE terms on the listing. The UAE-specific point is the climate class: kitchens here can pass 32°C when the AC is off, beyond what N-class refrigerators are rated for. Choose a model whose specification lists climate class T (tropical, rated for rooms up to 43°C). Top-freezer layouts generally use less energy for their capacity than side-by-side designs, and cost less too.`,
  },
  {
    id: 'appliance-2', brand: 'De’Longhi', title: 'De’Longhi Tasciugo AriaDry Dehumidifier',
    editorialScore: 4.3, priceBand: { min: 700, max: 1500 },
    image: '',
    amazonQuery: 'DeLonghi Tasciugo AriaDry dehumidifier',
    description: `For coastal homes, from Dubai Marina to Abu Dhabi's islands, humidity is the summer problem the AC does not fully solve. A compressor dehumidifier such as De'Longhi's Tasciugo AriaDry pulls water out of the air, which makes a room feel more comfortable at the same temperature and discourages the mould that grows behind wardrobes and in bathrooms. Compressor models work best in warm rooms — exactly the UAE case. Look for a humidistat, so it switches off at your target level, and a continuous-drain outlet if you do not want to empty the tank every day.`,
  },
  {
    id: 'appliance-3', brand: 'Dyson', title: 'Dyson Cool AM07 Tower Fan',
    editorialScore: 4.2, priceBand: { min: 1300, max: 2000 },
    image: '',
    amazonQuery: 'Dyson Cool AM07 tower fan',
    description: `The premium fan. Dyson's Air Multiplier design produces a smooth stream of air without exposed blades, which makes it easy to wipe free of dust and safer around children, and it comes with a remote and a sleep timer. Remember what any fan does: it cools you, not the room. Its value in a UAE home is letting you set the AC a degree or two higher while staying comfortable, which is where the savings come from. If you mainly want airflow at a lower price, a conventional tower fan does the same job; here you are paying for the design, quieter running and easy cleaning.`,
  },
  {
    id: 'appliance-4', brand: 'Super General', title: 'Super General Hot & Cold Water Dispenser',
    editorialScore: 4.2, priceBand: { min: 300, max: 800 },
    image: '',
    amazonQuery: 'Super General water dispenser hot and cold',
    description: `Bottled-water dispensers are a fixture of UAE homes, and Super General is a local brand with wide availability and spare parts across the Emirates. Top-loading models take the standard 5-gallon bottles that UAE water companies deliver; bottom-loading versions cost more but spare you lifting the bottle. Check for a child-safety lock on the hot tap, and choose compressor cooling rather than thermoelectric if you want properly cold water in summer — compressor cooling copes far better when the kitchen is warm.`,
  },
  {
    id: 'appliance-5', brand: 'Roborock', title: 'Roborock Q-Series Robot Vacuum',
    editorialScore: 4.3, priceBand: { min: 900, max: 2200 },
    image: '',
    amazonQuery: 'Roborock Q series robot vacuum',
    description: `Fine dust settles in UAE homes daily, even with the windows shut, which makes a robot vacuum one of the more useful appliances here. Roborock's Q-series models use LiDAR navigation to map the home and clean in efficient rows, and can be scheduled from the app to run while you are out. Check exactly which model you are buying: versions with a self-emptying dock or mopping cost considerably more. For apartments with mostly hard floors — the norm here — a mid-range model without the dock is the best value.`,
  },
  {
    id: 'appliance-6', brand: 'Philips', title: 'Philips Essential Airfryer XL',
    editorialScore: 4.4, priceBand: { min: 300, max: 650 },
    image: '',
    amazonQuery: 'Philips Essential Airfryer XL',
    description: `An appliance with a climate angle: cooking in an air fryer instead of the oven puts far less heat into the kitchen, so the AC has less to fight at dinner time. Philips' Rapid Air technology circulates hot air around the food, and the XL basket is sized for a family meal. It needs little or no oil, and Philips makes the basket dishwasher-safe on most models. Check the capacity on the listing — Philips sells several sizes under the Essential name.`,
  },
  {
    id: 'appliance-7', brand: 'BLACK+DECKER', title: 'BLACK+DECKER Dustbuster Cordless Handheld Vacuum',
    editorialScore: 4.1, priceBand: { min: 150, max: 400 },
    image: '',
    amazonQuery: 'Black and Decker Dustbuster cordless handheld vacuum',
    description: `For the sand that comes in on shoes and the dust on window sills between full cleans. The Dustbuster is BLACK+DECKER's long-running cordless handheld range: light, quick to grab, and with a washable filter on current models. It does not replace a full-size or robot vacuum, but it handles the small daily jobs that make a UAE home feel clean. Battery life varies between models, so compare run times on the listing.`,
  },
  {
    id: 'appliance-8', brand: 'Samsung', title: 'Samsung EcoBubble Front-Load Washing Machine',
    editorialScore: 4.3, priceBand: { min: 1400, max: 2800 },
    image: '',
    amazonQuery: 'Samsung EcoBubble front load washing machine',
    description: `Gym kit and summer clothes go through the wash far more often here, so the machine works hard. Samsung's EcoBubble technology mixes detergent with air and water into a foam that Samsung says cleans effectively at low temperatures — useful for synthetic sportswear, which should not be washed hot. Front-loaders generally use less water than top-loaders and are gentler on fabric. Whatever machine you buy, run a drum-clean cycle regularly to keep detergent residue and limescale from building up.`,
  },
];

export const dresses = [
  {
    id: 'dress-1', brand: 'Columbia', title: 'Columbia Women’s Freezer Dress',
    editorialScore: 4.6, priceBand: { min: 220, max: 420 },
    image: '',
    amazonQuery: 'Columbia Freezer dress women',
    description: `The most climate-minded dress in this list. Columbia makes its Freezer dresses with Omni-Freeze ZERO, a fabric the brand says reacts to sweat to cool its surface, and Omni-Shade sun protection rated UPF 50 — features designed for hot, sunny days outdoors. The cut is a casual, easy-wearing stretch knit. It is a practical, sporty piece rather than an evening dress, best for outdoor days: the beach, a desert drive or an afternoon at Global Village. Check the length on the listing, as knee-length versions suit some settings better than others.`,
  },
  {
    id: 'dress-2', brand: 'Amazon Essentials', title: 'Amazon Essentials Women’s Short-Sleeve Midi Dress',
    editorialScore: 4.0, priceBand: { min: 60, max: 150 },
    image: '',
    amazonQuery: 'Amazon Essentials women midi dress',
    description: `The budget everyday pick. Amazon Essentials is Amazon's own label for simple, well-priced basics, and its dresses cover the staples — T-shirt dresses, wrap styles and midi cuts. Expect consistent quality for the price rather than anything special. The important step is the fabric: Essentials dresses come in several materials, and for UAE heat the cotton, linen-blend and viscose versions are far more comfortable than polyester jersey. Check the composition line before you order.`,
  },
  {
    id: 'dress-3', brand: 'Trendyol', title: 'Trendyol Modest Long-Sleeve Maxi Dress',
    editorialScore: 4.3, priceBand: { min: 120, max: 300 },
    image: '',
    amazonQuery: 'Trendyol modest maxi dress long sleeve',
    description: `Trendyol's Modest collection is a widely available modest-fashion line in the region, and its maxi dresses cover arms and legs without the weight of layering. For summer, choose the woven viscose and cotton-blend styles, which breathe far better than the heavier crepe and polyester pieces in the same range. Cuts are relaxed and flowing, which lets air move. Sizing follows European charts, so compare measurements rather than relying on your usual size.`,
  },
  {
    id: 'dress-4', brand: 'Tommy Hilfiger', title: 'Tommy Hilfiger Women’s Cotton Shirt Dress',
    editorialScore: 4.2, priceBand: { min: 350, max: 700 },
    image: '',
    amazonQuery: 'Tommy Hilfiger women shirt dress cotton',
    description: `A smart option for the office and beyond. Tommy Hilfiger's shirt dresses are often cut in cotton poplin — a crisp, breathable fabric that suits a UAE summer far better than structured synthetics. The shirt-dress shape moves easily, and the buttons let you adjust coverage; many styles come with a belt. It is the most expensive dress here, and you are paying for the brand and finishing as much as the fabric, so wait for a sale if the price sits at the top of the band.`,
  },
  {
    id: 'dress-5', brand: 'ONLY', title: 'ONLY Women’s Linen-Blend Maxi Dress',
    editorialScore: 4.2, priceBand: { min: 120, max: 260 },
    image: '',
    amazonQuery: 'ONLY women linen blend maxi dress',
    description: `Linen is the classic hot-weather fabric — it breathes, dries quickly and does not cling — and ONLY's linen-blend dresses bring it in at a mid-market price. Blends with viscose or cotton crease less than pure linen and drape better, which suits a dress you want to wear all day. The maxi length works with the modest dress expected in UAE malls and public places. Linen softens with washing; expect some creasing, which is part of the look.`,
  },
  {
    id: 'dress-6', brand: 'DeFacto', title: 'DeFacto Women’s Woven Maxi Dress',
    editorialScore: 3.9, priceBand: { min: 80, max: 200 },
    image: '',
    amazonQuery: 'DeFacto women maxi dress',
    description: `The low-cost modest option. DeFacto is a Turkish high-street brand with a large following across the Gulf, and its maxi dresses offer full coverage at prices well below most competitors. Fabric varies from style to style: favour the woven cotton and viscose pieces for summer and keep the polyester ones for air-conditioned evenings. Quality is basic, so treat these as everyday dresses rather than investment pieces.`,
  },
  {
    id: 'dress-7', brand: 'adidas', title: 'adidas Women’s 3-Stripes T-Shirt Dress',
    editorialScore: 4.0, priceBand: { min: 120, max: 230 },
    image: '',
    amazonQuery: 'adidas women t-shirt dress 3 stripes',
    description: `For off-duty days: a jersey T-shirt dress with adidas's familiar three-stripe styling, usually in cotton or a cotton blend. It is the most casual dress here, easy to throw on after the gym or for a beach-club day, and comfortable in dry heat. In humid weather cotton holds sweat, so it is a better choice for air-conditioned malls and evenings than for a midday walk outdoors. Lengths vary between styles; check the listing for knee-length or longer versions.`,
  },
  {
    id: 'dress-8', brand: 'Vero Moda', title: 'Vero Moda Women’s Viscose Midi Dress',
    editorialScore: 4.1, priceBand: { min: 120, max: 260 },
    image: '',
    amazonQuery: 'Vero Moda women midi dress viscose',
    description: `Viscose is the underrated summer fabric: made from wood pulp, it breathes much like cotton, drapes better, and feels cool against the skin. Vero Moda uses it widely in printed, easy-fitting midi dresses that work for brunch, office days and evenings alike, and the midi length is a practical choice for UAE malls and public places. Viscose can shrink if washed hot, so follow the care label — usually a cool wash and drying on the line.`,
  },
];

export const shoes = [
  {
    id: 'shoe-1', brand: 'Nike', title: 'Nike Pegasus Road Running Shoes',
    editorialScore: 4.6, priceBand: { min: 400, max: 650 },
    image: '',
    amazonQuery: 'Nike Pegasus running shoes',
    description: `Nike's everyday running shoe, in production since the 1980s and one of the best-selling trainers there is. The Pegasus pairs a breathable engineered-mesh upper with Nike's responsive foam cushioning and a durable rubber outsole, which makes it a do-everything choice for treadmill sessions, early-morning runs along the Corniche and long days on your feet. New versions cost the most; the previous generation often sells at a discount and remains excellent. Feet swell in the heat, so go up half a size if you are between sizes.`,
  },
  {
    id: 'shoe-2', brand: 'adidas', title: 'adidas Ultraboost Running Shoes',
    editorialScore: 4.4, priceBand: { min: 450, max: 850 },
    image: '',
    amazonQuery: 'adidas Ultraboost running shoes',
    description: `The comfort pick for long walks and easy runs. adidas's Boost midsole is made from thousands of fused foam capsules that adidas says return energy and stay springy for a long time, and the knit upper flexes with the foot and lets heat escape. The Ultraboost is heavier than dedicated racing shoes, so serious runners may want something lighter, but for daily wear, mall walking and travel it is one of the most comfortable trainers available. Light colourways stay noticeably cooler in the summer sun.`,
  },
  {
    id: 'shoe-3', brand: 'ASICS', title: 'ASICS GEL-Nimbus Running Shoes',
    editorialScore: 4.5, priceBand: { min: 550, max: 850 },
    image: '',
    amazonQuery: 'ASICS Gel Nimbus running shoes',
    description: `ASICS's most cushioned neutral running shoe, built for long distances and runners who want maximum comfort underfoot. GEL cushioning in the heel and forefoot softens each landing, and recent versions use a breathable knit or mesh upper. The price is premium, but the shoe is built for high mileage. For long runs, and for anyone who wants plenty of cushioning, it is the pick here; lighter, faster runners may find it more shoe than they need.`,
  },
  {
    id: 'shoe-4', brand: 'Skechers', title: 'Skechers GOwalk Slip-On Walking Shoes',
    editorialScore: 4.3, priceBand: { min: 180, max: 350 },
    image: '',
    amazonQuery: 'Skechers GOwalk slip on walking shoes',
    description: `The comfort walking shoe for long mall days and travel. Skechers' GOwalk line is lightweight, slips on without laces and uses breathable knit or mesh uppers; many versions have the brand's Air-Cooled Goga Mat insole, which Skechers designs for breathability and cushioning. They are not running shoes — the soft sole lacks the support — but for walking and everyday wear in the heat they are hard to beat at the price. Machine-washable versions are worth seeking out.`,
  },
  {
    id: 'shoe-5', brand: 'Crocs', title: 'Crocs Classic Clog',
    editorialScore: 4.2, priceBand: { min: 150, max: 260 },
    image: '',
    amazonQuery: 'Crocs Classic Clog unisex',
    description: `Love them or not, Crocs make sense in a hot, wet climate. The Classic Clog is moulded from the brand's Croslite foam — light, cushioned and waterproof — and the ventilation ports in the upper let air and water through. They rinse clean after the beach, the pool or a sandy desert camp, and the heel strap pivots up out of the way or back for a secure fit. One UAE-specific warning: do not leave them in a hot car or in direct midday sun, because high heat can warp the foam.`,
  },
  {
    id: 'shoe-6', brand: 'Birkenstock', title: 'Birkenstock Arizona EVA Sandals',
    editorialScore: 4.4, priceBand: { min: 140, max: 240 },
    image: '',
    amazonQuery: 'Birkenstock Arizona EVA sandals',
    description: `The beach-proof version of Birkenstock's classic two-strap sandal, moulded in one piece from lightweight, waterproof EVA foam. It shrugs off the sea, the pool and summer showers in a way the cork-footbed original cannot, while keeping the contoured footbed the brand is known for — far more support than a flat flip-flop. If you also want the leather and cork Arizona for everyday wear, keep that pair away from water, which the cork footbed does not like.`,
  },
  {
    id: 'shoe-7', brand: 'Havaianas', title: 'Havaianas Top Flip-Flops',
    editorialScore: 4.0, priceBand: { min: 60, max: 120 },
    image: '',
    amazonQuery: 'Havaianas Top flip flops',
    description: `The simplest beach footwear there is, and a hard-wearing one. Havaianas come from Brazil and are made from the brand's soft rubber compound; the Top is the plain, single-colour classic. Flip-flops give no support, so keep them for the beach, the pool and quick errands rather than long walks. Rubber soles get hot in direct sun, so do not leave them lying on the sand at midday.`,
  },
  {
    id: 'shoe-8', brand: 'PUMA', title: 'PUMA Softride Running Shoes',
    editorialScore: 4.1, priceBand: { min: 180, max: 320 },
    image: '',
    amazonQuery: 'PUMA Softride running shoes',
    description: `The budget running and gym shoe. PUMA pairs its Softride midsole foam with a SoftFoam+ sockliner for a soft feel at the price, and the lightweight mesh upper breathes well in the heat. It suits gym sessions, treadmill running and everyday wear; for long outdoor runs the Nike Pegasus or ASICS GEL-Nimbus offer more support and durability. A good first pair, or a second pair to keep in the gym bag.`,
  },
];
