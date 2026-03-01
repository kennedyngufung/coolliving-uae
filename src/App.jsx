import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, X, Search, ShoppingCart, Home, LayoutList, 
  FileText, ShieldCheck, ChevronRight, CheckCircle, 
  XCircle, Thermometer, Wind, Zap, Link as LinkIcon, 
  Plus, Edit, Trash2, ExternalLink, Settings, BarChart, Lock, Save,
  Calendar, Clock, User, Star, Mail, MapPin, MessageSquare, ArrowLeft, LogOut,
  Droplets, Sun, Activity, HelpCircle, ChevronDown, ChevronUp, Quote
} from 'lucide-react';

// --- MOCK DATABASE ---
const initialCategories = [
  { id: 'smart-acs', name: 'Smart ACs', icon: Thermometer, description: 'The best smart air conditioners in UAE for extreme T3 climate conditions.' },
  { id: 'air-purifiers', name: 'Air Purifiers', icon: Wind, description: 'Top-rated HEPA air purifiers for Dubai homes to combat dust and allergies.' },
  { id: 'smart-thermostats', name: 'Smart Thermostats', icon: Zap, description: 'Intelligent thermostats to reduce DEWA bills and energy consumption in the UAE.' }
];

const userReviews = [
  { id: 1, name: "Ahmed Mansoor", location: "Dubai Marina", rating: 5, date: "Feb 12, 2026", text: "The T3 compressor advice was a lifesaver. My old unit used to trip every afternoon in August. The LG model recommended here hasn't missed a beat even at 50 degrees." },
  { id: 2, name: "Sarah Jenkins", location: "Jumeirah Village Circle", rating: 5, date: "Jan 28, 2026", text: "Finally an honest guide for Dubai dust! The Blueair purifier recommendation has significantly helped my daughter's nighttime allergies. Worth every fils." },
  { id: 3, name: "Rajesh Kumar", location: "Abu Dhabi, Reem Island", rating: 4, date: "Feb 05, 2026", text: "Switched to the Nest thermostat as suggested. My DEWA bill dropped by 180 AED in the first month. The geofencing setup instructions were very helpful." },
  { id: 4, name: "Elena Volkov", location: "Downtown Dubai", rating: 5, date: "Feb 20, 2026", text: "I didn't know about the 'Setback' temperature rule. Applying that along with the thermal blinds advice has made my apartment much more comfortable." },
  { id: 5, name: "Omar Al-Farsi", location: "Sharjah, Al Majaz", rating: 5, date: "Jan 15, 2026", text: "Excellent technical breakdown. Most sites just give generic specs, but CoolLivingUAE explains why certain tech matters for the Gulf humidity." },
  { id: 6, name: "Michelle Tan", location: "Damac Hills", rating: 5, date: "Feb 25, 2026", text: "The O-General AC review was spot on. It's incredibly quiet and the cooling is instant. Best investment for our new villa." },
  { id: 7, name: "Khalid Ibrahim", location: "Mirdif", rating: 5, date: "Feb 10, 2026", text: "Saved me from buying a cheap T1 unit that wouldn't have lasted a summer. I appreciate the focus on long-term durability for UAE weather." },
  { id: 8, name: "Fiona Gallagher", location: "The Springs", rating: 4, date: "Dec 30, 2025", text: "The air purifier comparison helped me choose the Dyson for our living room. It handles the sandstorms much better than our previous cheap brand." },
  { id: 9, name: "Zayed Al-Nahyan", location: "Khalifa City", rating: 5, date: "Feb 22, 2026", text: "High quality reviews. The focus on electricity saving is very important now with the new tariff structures. Highly recommended site." },
  { id: 10, name: "David Miller", location: "Palm Jumeirah", rating: 5, date: "Feb 18, 2026", text: "Comprehensive and professional. The smart home integration tips for thermostats saved me hours of frustration with my HomeKit setup." }
];

const faqData = [
  {
    question: "What is the difference between a T1 and T3 compressor for UAE summers?",
    answer: "This is crucial for UAE residents. A T1 compressor is rated for moderate climates (up to 43°C), while a T3 compressor is specifically engineered for 'Hot Climates' and remains efficient even when outside temperatures hit 52°C. For Dubai summers, always look for the T3 rating to avoid the unit tripping or losing cooling capacity during peak July/August heat."
  },
  {
    question: "Will a smart thermostat really lower my DEWA bill?",
    answer: "Yes, significantly. Standard UAE thermostats often over-cool because they lack precision sensors. A smart thermostat (like Nest or Ecobee) uses geofencing to turn the AC down when you leave and provides 'short-cycle' protection. On average, our tested homes in Dubai Marina and Downtown saw a 15-22% reduction in monthly cooling costs."
  },
  {
    question: "How often should I change air purifier filters in Dubai?",
    answer: "Due to fine desert dust and high construction activity in areas like Business Bay or JVC, we recommend checking your filters every 3 months. While many HEPA filters claim a 1-year lifespan, in the UAE's high-dust environment, they typically reach capacity much sooner. Replacing them timely ensures 99.97% filtration of PM2.5 sand particles."
  },
  {
    question: "Do inverter ACs actually work better in the Gulf heat?",
    answer: "Inverter technology is excellent for the UAE because it doesn't just turn 'on or off'. It slows down the compressor once the room is cool, maintaining a steady 24°C without the massive power spikes associated with traditional compressors. This results in quieter operation and lower electricity consumption over long periods."
  },
  {
    question: "Is it better to leave the AC on all day while I'm at work?",
    answer: "We recommend using a 'Setback' temperature. Instead of turning the AC off completely (which allows the walls and furniture to soak up heat), set it to 27°C while you are out. This prevents the unit from working at 100% capacity for hours to cool down a 'hot house' when you return at 6 PM."
  }
];

const generateProducts = () => {
  const products = [];
  const acImages = [
    'https://www.lg.com/ae/images/AC/features/I27TCP_07_Quick-and-Easy-Installation_07022019_D.jpg',
    'https://m.media-amazon.com/images/I/715rBETRD9L._SL1500_.jpg',
    'https://www.dubaitechnical.com/wp-content/uploads/2020/03/O-General-Air-Conditioners-1.jpg',
    'https://coolersonline.ae/wp-content/uploads/2022/10/oge9.png',
    'https://superelectrocity.pk/wp-content/uploads/2024/05/Midea-2.0-Ton-Air-Conditioner-MSAGB-24HRFN-DC-Inverter.jpg',
    'https://i.pinimg.com/736x/3e/b6/d4/3eb6d4b2b8e3968dd8b1c05c9376ae43.jpg',
    'https://www.basildonacr.co.uk/wp-content/uploads/2022/10/Panasonic-Etherea-W.jpg',
    'https://m.media-amazon.com/images/I/61HuUBy7XIL._AC_.jpg',
    'https://djsolar.com.au/wp-content/uploads/2025/02/Grey-and-White-Modern-Electronic-Product-Listing-Amazon-Product-Image-8.png',
    'https://images.priceoye.pk/hisense-1-5-ton-inverter-ac-hbd1860hc-pakistan-priceoye-zz2kw.jpg',
    'https://aws-obg-image-lb-3.tcl.com/content/dam/brandsite/global/product/ac/elite/xa73/ksp/1920-1080-TCL-Elite-Series-Inverter-Air-Conditioner.png',
    'https://5.imimg.com/data5/SELLER/Default/2023/9/340487228/GP/ME/SU/43847510/3-star-1-5-ton-toshiba-non-inverter-split-ac-500x500.jpg',
    'https://5.imimg.com/data5/SELLER/Default/2024/8/441470831/TJ/AI/TN/14878142/hitachi-star-split-air-conditioners-1000x1000.jpeg',
    'https://m.media-amazon.com/images/I/61joTSyLZbL._SL1000_.jpg',
    'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg'
  ];
  const purifierImages = [
    'https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/leap-petite-global/ForBusiness/ec/664e/overview/features/664E_feature_HEPA-M2.jpg?$responsive$&cropPathE=desktop&fit=stretch,1&wid=1920',
    'https://www.airpurifierblog.com/cdn/shop/files/Canva5_f53d1b3b-640b-422a-ae67-a58a7750ffbf.png?v=1697131414&width=1029',
    'https://www.buy2day.pk/wp-content/uploads/2024/01/1715-3.jpg',
    'https://gearbuzzbd.com/wp-content/uploads/2025/02/deerma-cm1900-1.jpg',
    'https://cowaymega.ca/cdn/shop/files/sec07-img-01_2x_e51604e7-079b-4806-9a9e-9b9ee6620fa9.png?v=1653491413',
    'https://mobileimages.lowes.com/productimages/adba1beb-7d09-4bae-92fb-250fe2915790/63831844.jpg?size=pdhism',
    'https://tse3.mm.bing.net/th/id/OIP.fD-Qrg_5KirKv9BySg4tuQHaEl?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://m.media-amazon.com/images/I/71N6U5dAybL._AC_SL1500_.jpg',
    'https://tse2.mm.bing.net/th/id/OIP.mCu2fDBPPwc-uttpihAjBwHaFr?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://cleansehive.com/wp-content/uploads/2023/11/image-27.png',
    'https://m.media-amazon.com/images/I/61S5nAF6zzL._AC_.jpg',
    'https://tse4.mm.bing.net/th/id/OIP.NfwJQ5zR2HIrPYzxyp7gHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://www.electrolux.com.my/globalassets/appliances/accessories/eskc9a/my-eskc9a-insit-1500x1500.jpg?width=1920',
    'https://images.thdstatic.com/productImages/62d0313c-957a-44a5-8da0-ccd6aff7f95b/svn/grays-fellowes-air-purifiers-9416201-64_300.jpg',
    'https://m.media-amazon.com/images/I/71s40QoAJbL._AC_UL640_QL65_.jpg'
  ];
  const thermoImages = [
    'https://th.bing.com/th/id/OIP.w4VeOZuaPctKV3YYrwxWmQHaHh?w=195&h=197&c=7&r=0&o=7&pid=1.7&rm=3',
    'https://powerefficiency.com/wp-content/uploads/2024/04/Honeywell-Smart-Wifi-Thermostat_-Optimizing-Energy-Efficiency-for-a-Brighter-Future.webp',
    'https://m.media-amazon.com/images/I/51Ceejf+6kL._AC_SL1429_.jpg',
    'https://manuals.plus/wp-content/uploads/2021/08/tado-smart-radiator-thermostat-kit-e1628971320714.jpeg',
    'https://mma.prnewswire.com/media/731700/GLAS_smart_thermostat.jpg?p=facebook',
    'https://primeo.gorillacdn.ch/media/30/57/39/1716384537/5d57cc1a25e8463893357391ac6ca1bc.jpg?width=1920',
    'https://reviewed-com-res.cloudinary.com/image/fetch/s--3sr51zW6--/b_white,c_limit,cs_srgb,f_auto,fl_progressive.strip_profile,g_center,q_auto,w_1200/https://reviewed-production.s3.amazonaws.com/1611605611010/wyze-thermostat.JPG',
    'https://i0.wp.com/9to5toys.com/wp-content/uploads/sites/5/2019/05/GLAS-Smart-Thermostat.jpg?resize=1200%2C628&ssl=1',
    'https://thegadgetflow.com/wp-content/uploads/2016/03/Wiser-Air-Smart-Thermostat-by-Schneider-Electric-01.jpg',
    'https://www.ahhac.com.au/wp-content/uploads/2017/10/Siemens-smart-thermostat-300x300.jpg',
    'https://tse3.mm.bing.net/th/id/OIP.4kPaqsI3z09H1I0NQJvOPAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://assets.legrand.com/pim/PHOTOS-WEB/LEGRAND/04/LG-049044-WEB-F.jpg',
    'https://tse4.mm.bing.net/th/id/OIP.TrBmlLycxSYurd2b7WvrLwHaE8?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://static.standard.co.uk/2025/02/19/20/46/drayton.jpeg?quality=75&auto=webp&width=640',
    'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg'
  ];

  const acBrands = ['LG', 'Samsung', 'O-General', 'Super General', 'Midea', 'Gree', 'Panasonic', 'Daikin', 'Mitsubishi', 'Hisense', 'TCL', 'Toshiba', 'Hitachi', 'Sharp', 'Carrier'];
  for (let i = 1; i <= 15; i++) {
    products.push({
      id: `ac-${i}`,
      title: `${acBrands[i-1]} Smart Inverter AC ${i % 2 === 0 ? '1.5' : '2.0'} Ton T3 - UAE Edition`,
      brand: acBrands[i-1],
      price: 1800 + (i * 150),
      category: 'smart-acs',
      image: acImages[i-1],
      rating: (4.2 + (i % 8) / 10).toFixed(1),
      reviewsCount: 50 + (i * 12),
      description: `Expert Review: This ${acBrands[i-1]} T3 model is specifically engineered for the Middle East. Rated for 52°C+ ambient temperatures, it features heavy-duty gold fin condensers and Wi-Fi control via smartphone. A top choice for villas in Dubai and Abu Dhabi seeking maximum energy efficiency.`,
      affiliateLink: 'https://amazon.ae'
    });
  }

  const purifierBrands = ['Dyson', 'Blueair', 'Philips', 'Xiaomi', 'Coway', 'Levoit', 'Winix', 'Honeywell', 'Molekule', 'IQAir', 'Sharp', 'Panasonic', 'Electrolux', 'Fellowes', 'Bissell'];
  for (let i = 1; i <= 15; i++) {
    products.push({
      id: `purifier-${i}`,
      title: `${purifierBrands[i-1]} HEPA Pro ${i*100} Dust Specialist`,
      brand: purifierBrands[i-1],
      price: 499 + (i * 200),
      category: 'air-purifiers',
      image: purifierImages[i-1],
      rating: (4.5 + (i % 5) / 10).toFixed(1),
      reviewsCount: 120 + (i * 5),
      description: `Professional Analysis: Essential for UAE dust seasons. The ${purifierBrands[i-1]} removes 99.97% of PM2.5 particles, including fine sand dust and allergens common in high-rise buildings. Whisper-quiet operation makes it perfect for Dubai bedrooms.`,
      affiliateLink: 'https://amazon.ae'
    });
  }

  const termBrands = ['Nest', 'Ecobee', 'Honeywell', 'Tado', 'Sensi', 'GLAS', 'Wyze', 'Johnson Controls', 'Schneider', 'Siemens', 'ABB', 'Legrand', 'Danfoss', 'Drayton', 'Honeywell Pro'];
  for (let i = 1; i <= 15; i++) {
    products.push({
      id: `thermo-${i}`,
      title: `${termBrands[i-1]} Smart Thermostat - DEWA Saver Edition`,
      brand: termBrands[i-1],
      price: 350 + (i * 80),
      category: 'smart-thermostats',
      image: thermoImages[i-1] || thermoImages[0],
      rating: (4.1 + (i % 9) / 10).toFixed(1),
      reviewsCount: 30 + (i * 20),
      description: `Savings Report: The ${termBrands[i-1]} is highly effective for central and split AC systems in the UAE. Our long-term testing shows an average reduction of 25% in cooling-related DEWA costs through geofencing and smart scheduling. Built for high-reliability in UAE smart homes.`,
      affiliateLink: 'https://amazon.ae'
    });
  }
  return products;
};

const initialProducts = generateProducts();

// --- SEO ENGINE ---
const updateSEO = (title, description) => {
  document.title = `${title} | CoolLivingUAE`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = description;
};

// --- ADSENSE ---
const AdSense = ({ slotId, type = 'horizontal' }) => (
  <div className={`my-8 mx-auto w-full bg-slate-100/50 border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-4 overflow-hidden ${type === 'sidebar' ? 'min-h-[600px]' : 'min-h-[120px]'}`}>
    <div className="text-center text-slate-400">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">Sponsored Advertisement</div>
      <div className="text-xs italic font-mono">Ads by Google (Slot: {slotId})</div>
    </div>
  </div>
);

// --- BREADCRUMBS ---
const Breadcrumbs = ({ items, navigate }) => (
  <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
    <span onClick={() => navigate('/')} className="hover:text-blue-600 cursor-pointer flex items-center gap-1"><Home size={12} /> Home</span>
    {items.map((item, idx) => (
      <React.Fragment key={idx}>
        <ChevronRight size={10} />
        {item.path ? (
          <span onClick={() => navigate(item.path, item.params)} className="hover:text-blue-600 cursor-pointer">{item.name}</span>
        ) : (
          <span className="text-slate-900">{item.name}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// --- COMPONENTS ---
const ProductCard = ({ product, navigate }) => (
  <article className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group">
    <div className="h-48 overflow-hidden relative cursor-pointer" onClick={() => navigate('product', { id: product.id })}>
      <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
        <Star size={10} fill="currentColor" /> {product.rating}
      </div>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <div className="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-widest">{product.brand}</div>
      <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-blue-600" onClick={() => navigate('product', { id: product.id })}>
        {product.title}
      </h3>
      <div className="text-lg font-black text-gray-900 mb-4">AED {Number(product.price).toLocaleString()}</div>
      
      <div className="mt-auto space-y-2">
        <div className="flex gap-2">
          <button onClick={() => navigate('product', { id: product.id })} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-lg transition-colors text-xs border border-gray-100">Full Review</button>
          <button onClick={() => window.open(product.affiliateLink, '_blank')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-1">Check Deals</button>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate('installation', { id: product.id }); }}
          className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-all text-xs shadow-sm flex items-center justify-center gap-1"
        >
          <Settings size={14} /> Request Installation
        </button>
      </div>
    </div>
  </article>
);

const FAQItem = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left hover:text-blue-600 transition-colors group"
      >
        <span className="font-bold text-slate-800 text-base pr-4">{item.question}</span>
        {isOpen ? <ChevronUp size={20} className="text-blue-500 flex-shrink-0" /> : <ChevronDown size={20} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />}
      </button>
      {isOpen && (
        <div className="pb-6 text-slate-600 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-300">
          {item.answer}
        </div>
      )}
    </div>
  );
};

const ReviewCard = ({ review }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
    <div className="flex items-center gap-1 text-orange-400 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200"} />
      ))}
    </div>
    <p className="text-slate-700 text-sm leading-relaxed mb-6 flex-grow italic">"{review.text}"</p>
    <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
        {review.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900">{review.name}</div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1">
          <MapPin size={8} /> {review.location} • {review.date}
        </div>
      </div>
    </div>
  </div>
);

// --- PAGES ---
const HomePage = ({ products, categories, navigate }) => {
  useEffect(() => updateSEO('Best Smart Cooling & Energy Saving Tech in UAE 2026', 'Independent reviews of 45+ cooling products for the UAE climate.'), []);
  return (
    <div className="animate-in fade-in duration-500">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white py-20 px-6 rounded-3xl mx-4 my-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Wind size={400} /></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">Master the UAE Climate with <span className="text-teal-400">Smart Technology</span></h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Discover expert reviews on the top 45+ ACs and purifiers specifically tested for Dubai's extreme summer heat.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button onClick={() => navigate('category', { id: 'smart-acs' })} className="bg-teal-500 hover:bg-teal-400 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:-translate-y-1">Explore Smart ACs</button>
            <button onClick={() => navigate('guides')} className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-4 px-8 rounded-full border border-white/30 transition-colors">DEWA Saving Guides</button>
          </div>
        </div>
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdSense slotId="home-top-banner" />
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Best Smart Tech for UAE Homes (2026)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div key={cat.id} onClick={() => navigate('category', { id: cat.id })} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md border border-gray-100 cursor-pointer transition-all flex items-start gap-4 group">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><cat.icon size={28} /></div>
                <div><h3 className="font-bold text-xl text-gray-900 mb-1">{cat.name}</h3><p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Testimonials */}
        <section className="mb-20">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">What Residents Say</h2>
              <button onClick={() => navigate('reviews')} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">View All <ChevronRight size={16} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {userReviews.slice(0, 3).map(review => <ReviewCard key={review.id} review={review} />)}
           </div>
        </section>

        {/* FAQs Section */}
        <section className="mb-20 bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/3">
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                <HelpCircle size={28} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Everything you need to know about optimizing your home for the UAE's unique environmental challenges.</p>
            </div>
            <div className="md:w-2/3 divide-y divide-gray-100">
              {faqData.map((item, idx) => <FAQItem key={idx} item={item} />)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const InstallationPage = ({ productId, products, navigate }) => {
  const product = products.find(p => p.id === productId);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
  name: "",
  phone: "",
  location: "",
  propertyType: "",
  acType: "",
  acCapacity: "",
  message: ""
});

  useEffect(() => updateSEO(`Request Installation - ${product?.brand}`, 'Professional HVAC installation across Dubai, Abu Dhabi and Sharjah.'), [product]);

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await addDoc(collection(db, "installationRequests"), {
      name: formData.name,
      phone: formData.phone,
      location: formData.location,
      propertyType: formData.propertyType,
      acType: formData.acType,
      acCapacity: formData.acCapacity,
      message: formData.message,
      createdAt: serverTimestamp()
    });

    alert("Request submitted successfully!");

    // Reset form after submit
    setFormData({
      name: "",
      phone: "",
      location: "",
      propertyType: "",
      acType: "",
      acCapacity: "",
      message: ""
    });

  } catch (error) {
    console.error("Error saving request:", error);
    alert("Something went wrong. Please try again.");
  }
};
       
        

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 animate-in slide-in-from-bottom-8">
      <Breadcrumbs items={[{ name: 'Installation Quote' }]} navigate={navigate} />
      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Settings size={32} /></div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Professional Installation</h1>
            <p className="text-slate-500 text-sm">Certified service for {product?.brand || 'your cooling unit'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Full Name</label>
              <input
  required
  type="text"
  value={formData.name}
  onChange={(e) =>
    setFormData({ ...formData, name: e.target.value })
  }
  placeholder="e.g. Ahmed Mansoor"
  className="w-full bg-slate-50 border rounded-xl p-4 outline-none focus:border-blue-500"
/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
  Contact Number
</label>

<input
  required
  type="tel"
  value={formData.phone}
  onChange={(e) =>
    setFormData({ ...formData, phone: e.target.value })
  }
  placeholder="e.g. 0501234567"
  className="w-full bg-slate-50 border rounded-xl p-4 outline-none focus:border-blue-500"
/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
  Emirate / Location
</label>

<select
  required
  value={formData.location}
  onChange={(e) =>
    setFormData({ ...formData, location: e.target.value })
  }
  className="w-full bg-slate-50 border rounded-xl p-4 outline-none focus:border-blue-500 appearance-none"
>
  <option value="">Select your city</option>
  <option value="Dubai - Marina / JBR / JLT">Dubai - Marina / JBR / JLT</option>
  <option value="Dubai - Downtown / Business Bay">Dubai - Downtown / Business Bay</option>
  <option value="Dubai - Other">Dubai - Other</option>
  <option value="Abu Dhabi City">Abu Dhabi City</option>
  <option value="Sharjah / Ajman">Sharjah / Ajman</option>
</select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Additional Details</label>
            <textarea
  placeholder="Tell us about your unit or specific requirements..."
  rows="4"
  value={formData.message}
  onChange={(e) =>
    setFormData({ ...formData, message: e.target.value })
  }
  className="w-full bg-slate-50 border rounded-xl p-4 outline-none focus:border-blue-500"
></textarea>
</div>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2">
            Submit Quote Request <ChevronRight size={20} />
          </button>
          <p className="text-[10px] text-center text-slate-400 italic font-medium">By submitting, you agree to be contacted by our partner installers.</p>
        </form>
      </div>
    </div>
  );
};


const ReviewsPage = ({ navigate }) => {
  useEffect(() => updateSEO('Resident Testimonials & Reviews | CoolLivingUAE', 'See how we have helped over 10,000 residents save money on cooling in the UAE.'), []);
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Resident Success Stories</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">Real experiences from homeowners and tenants across the Emirates who optimized their living spaces using our guides.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {userReviews.map(review => <ReviewCard key={review.id} review={review} />)}
      </div>
      <div className="mt-20 bg-blue-600 rounded-3xl p-10 text-center text-white">
         <h3 className="text-2xl font-bold mb-4">Share Your Experience</h3>
         <p className="mb-8 opacity-90">Have our reviews helped you save on DEWA or improve your indoor air? We'd love to hear from you.</p>
         <button onClick={() => navigate('contact')} className="bg-white text-blue-600 font-bold py-4 px-10 rounded-2xl hover:bg-slate-50 transition-colors">Submit a Review</button>
      </div>
    </div>
  );
};

const CategoryPage = ({ categoryId, categories, products, navigate }) => {
  const category = categories.find(c => c.id === categoryId);
  const categoryProducts = products.filter(p => p.category === categoryId);
  useEffect(() => { if(category) updateSEO(`${category.name} Reviews for Dubai & UAE (2026)`, category.description); }, [category]);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in">
      <Breadcrumbs items={[{ name: category?.name }]} navigate={navigate} />
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Best {category?.name} in UAE</h1>
           <p className="text-gray-600 max-w-2xl">{category?.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categoryProducts.map(product => <ProductCard key={product.id} product={product} navigate={navigate} />)}
          </div>
        </div>
        <aside className="hidden lg:block space-y-8"><AdSense slotId="category-sidebar" type="sidebar" /></aside>
      </div>
    </div>
  );
};

const ProductReviewPage = ({ productId, products, navigate }) => {
  const product = products.find(p => p.id === productId);
  useEffect(() => { if(product) updateSEO(`${product.title} Review & Best Price UAE`, product.description); }, [product]);
  if (!product) return <div className="p-20 text-center text-slate-500">Product not found.</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 py-10 animate-in fade-in">
      <Breadcrumbs items={[{ name: 'Products', path: 'category', params: {id: product.category} }, { name: product.brand }]} navigate={navigate} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10">
              <div className="relative">
                <img src={product.image} alt={product.title} className="w-full rounded-2xl shadow-lg border border-gray-100 object-cover aspect-square" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-gray-100">
                   <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Performance Score</div>
                   <div className="text-2xl font-black text-blue-600 flex items-center gap-1">{product.rating} <Star size={20} fill="currentColor" /></div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">{product.brand} • Professional Review</div>
                <h1 className="text-3xl font-extrabold mb-4 text-slate-900 leading-tight">{product.title}</h1>
                <div className="text-3xl font-black mb-6 text-slate-900">AED {Number(product.price).toLocaleString()}</div>
                <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Professional Verdict</h3>
                  <p className="text-slate-600 leading-relaxed italic text-sm">{product.description}</p>
                </div>
                <div className="space-y-3">
                  <button onClick={() => window.open(product.affiliateLink, '_blank')} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">Check Lowest UAE Price <ExternalLink size={18} /></button>
                  <button onClick={() => navigate('installation', { id: product.id })} className="w-full bg-green-600 text-white py-4 rounded-xl font-black hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">Get Installation Quote <Settings size={18} /></button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Resident Reviews for this category context */}
          <div className="space-y-6">
             <h3 className="text-xl font-bold text-slate-900 px-2">What Users Think</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userReviews.slice(0, 2).map(review => <ReviewCard key={review.id} review={review} />)}
             </div>
          </div>
        </div>
        <aside className="lg:col-span-4"><AdSense slotId="product-sidebar" type="sidebar" /></aside>
      </div>
    </div>
  );
};

const GuidePage = () => {
  useEffect(() => updateSEO('DEWA Energy Saving Guide 2026', 'Practical tips to reduce energy consumption and DEWA bills in UAE.'), []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in fade-in">
      <h1 className="text-4xl font-black text-slate-900 mb-8 text-center">DEWA Energy Saving Guide 2026</h1>
      <div className="prose prose-blue max-w-none bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><Zap size={24} /> 1. Strategic AC Management</h2>
            <p className="text-slate-600 leading-relaxed mb-4">Heating, Ventilation, and Air Conditioning (HVAC) accounts for nearly 70% of a typical UAE residential electricity bill during summer. To optimize:</p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600">
              <li><strong>The 24°C Rule:</strong> Set your thermostat to 24°C. Research shows that for every degree you lower your AC below this, your cooling cost spikes by approximately 9%.</li>
              <li><strong>Auto Mode:</strong> Always use 'Auto' fan mode rather than 'High'. This allows the compressor to cycle off once the target temperature is reached, saving significant energy.</li>
              <li><strong>Zoned Cooling:</strong> Avoid cooling empty rooms. Close doors to guest rooms and only activate units in high-traffic areas.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><CheckCircle size={24} /> 2. Smart Thermostat Adoption</h2>
            <p className="text-slate-600 leading-relaxed mb-4">Standard thermostats are often inaccurate in UAE's high-ceiling villas. Upgrading to a Wi-Fi enabled smart thermostat offers:</p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600">
              <li><strong>Geofencing:</strong> Your AC automatically shifts to energy-saving mode when your phone leaves the premises and cools down just before you arrive.</li>
              <li><strong>Usage Analytics:</strong> Track exactly when you use the most power and identify spikes in DEWA consumption before the bill arrives.</li>
              <li><strong>Precision Control:</strong> High-quality sensors prevent "short cycling," extending the life of your AC compressor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><Droplets size={24} /> 3. HVAC Preventive Maintenance</h2>
            <p className="text-slate-600 leading-relaxed mb-4">Dubai's fine desert dust is the enemy of efficiency. Clogged coils force units to work 30% harder:</p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600">
              <li><strong>Filter Cleaning:</strong> Wash your AC filters every 3-4 weeks. This simple 10-minute task improves airflow and indoor air quality.</li>
              <li><strong>Annual Servicing:</strong> Schedule a professional chemical coil cleaning every March to prepare for the peak summer surge.</li>
              <li><strong>Leak Detection:</strong> Ensure your windows and doors have proper weather-stripping to prevent precious cool air from escaping to the outdoors.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><Sun size={24} /> 4. Passive Cooling Techniques</h2>
            <p className="text-slate-600 leading-relaxed mb-4">Reduce the "heat load" on your home to lower the work required by your AC:</p>
            <ul className="list-disc ml-6 space-y-2 text-slate-600">
              <li><strong>Thermal Blinds:</strong> Use blackout curtains or reflective films on south-facing windows to block direct sunlight during peak hours (12 PM - 4 PM).</li>
              <li><strong>LED Lighting:</strong> Replace old halogen bulbs. Halogens emit 90% of their energy as heat, contributing to higher indoor temperatures.</li>
              <li><strong>Evening Chores:</strong> Run heat-generating appliances like dishwashers and dryers during off-peak evening hours.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

const PrivacyPolicyPage = () => {
  useEffect(() => updateSEO('Privacy Policy | CoolLivingUAE', 'Transparency on data collection, cookies, and affiliate services for our UAE users.'), []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-black text-slate-900 mb-6">Privacy Policy for CoolLivingUAE</h1>
        <p className="text-sm text-slate-400 mb-8 font-bold">Last Updated: February 28, 2026</p>
        
        <div className="space-y-8 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Information We Collect</h2>
            <p>We do not require users to register or provide personal information to browse our reviews. However, we may collect information in the following ways:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Voluntary Correspondence:</strong> If you contact us directly via the provided email (kennedyngufung@gmail.com), we receive your email address.</li>
              <li><strong>Log Files:</strong> Like most websites, we use log files which track visitors. This includes IP addresses, browser type, ISP, and date/time stamps.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Cookies and Web Beacons</h2>
            <p>CoolLivingUAE uses 'cookies' to store information including visitors' preferences and the pages on the website that the visitor accessed. This information is used to optimize the user experience.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. Google DoubleClick DART Cookie</h2>
            <p>Google is one of the third-party vendors on our site. It uses cookies, known as DART cookies, to serve ads based upon your visit to our site and other sites on the internet. You may choose to decline these via Google’s ad settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Advertising Partners & Third-Party Services</h2>
            <p>Some of our partners use cookies. Our primary third-party services include:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Google AdSense:</strong> Used to display advertisements. They automatically receive your IP address when this occurs.</li>
              <li><strong>Amazon Associates & Affiliate Programs:</strong> As an affiliate site, we provide links to third-party stores. When you click these links, a "cookie" tracks the referral so we can earn a small commission at no extra cost to you.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Collection & Analytics</h2>
            <p>We may use tools like <strong>Google Analytics</strong> to monitor traffic and user behavior to help us improve our cooling guides. This data is aggregated and anonymous.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Consent</h2>
            <p>By using our website, you hereby consent to our Privacy Policy and agree to its terms. If you have any questions, contact us at <strong>kennedyngufung@gmail.com</strong>.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

const ContactPage = () => {
  useEffect(() => updateSEO('Contact CoolLivingUAE | Energy Saving Advice', 'Get in touch for professional advice on home cooling and energy efficiency in the UAE.'), []);
  const email = "kennedyngufung@gmail.com";
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="p-12 bg-slate-900 text-white flex flex-col justify-center">
            <h1 className="text-4xl font-black mb-6">Get Expert Advice</h1>
            <p className="text-slate-400 mb-10 leading-relaxed">Struggling with high utility bills or choosing the right AC for your new villa? Our Dubai-based experts are here to help.</p>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 p-3 rounded-xl"><Mail size={24} /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Email Us Directly</p>
                  <a href={`mailto:${email}`} className="text-xl font-bold hover:text-blue-400 transition-colors break-all">{email}</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-800 p-3 rounded-xl"><MapPin size={24} /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Coverage</p>
                  <p className="text-lg font-bold">Dubai, AUH, Sharjah & Northern Emirates</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="bg-blue-50 text-blue-600 p-6 rounded-full mb-6"><MessageSquare size={48} /></div>
            <h2 className="text-2xl font-black text-slate-900 mb-4">Send us a Message</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Click below to launch your email app. We typically respond to UAE inquiries within 24 business hours.</p>
            <a href={`mailto:${email}`} className="bg-blue-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:-translate-y-1 inline-flex items-center gap-2">Contact Support <ExternalLink size={18} /></a>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SECURITY & ADMIN ---
const AdminSecurityGate = ({ onVerify, onCancel }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState(false);
  const checkKey = (e) => { e.preventDefault(); if (key === 'CLU-ADMIN-2026') onVerify(); else { setError(true); setKey(''); } };
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-bold text-center mb-8">Secure Access</h2>
        <form onSubmit={checkKey} className="space-y-4">
          <input type="password" autoFocus className="w-full border-2 rounded-xl p-4 text-center font-mono outline-none focus:border-blue-600" placeholder="Access Key" value={key} onChange={e => { setKey(e.target.value); setError(false); }} />
          {error && <p className="text-red-500 text-center font-bold">Access Denied</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold">Verify</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ products, setProducts, onLogout }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [formState, setFormState] = useState(null);
  const startEdit = (product) => { setEditingProduct(product.id); setFormState({ ...product }); };
  const handleSave = () => { setProducts(products.map(p => p.id === editingProduct ? formState : p)); setEditingProduct(null); setFormState(null); };
  const handleDelete = (id) => { if (window.confirm('Remove review from site?')) setProducts(products.filter(p => p.id !== id)); };

  if (editingProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 animate-in slide-in-from-bottom-4">
        <button onClick={() => setEditingProduct(null)} className="flex items-center gap-2 text-slate-500 font-bold mb-6 hover:text-blue-600"><ArrowLeft size={18} /> Back</button>
        <div className="bg-white rounded-3xl shadow-xl border p-8">
          <h2 className="text-2xl font-black mb-8 text-slate-900">Update Review Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Title</label>
              <input type="text" className="w-full bg-slate-50 border rounded-xl p-3 outline-none focus:border-blue-500" value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Price (AED)</label>
              <input type="number" className="w-full bg-slate-50 border rounded-xl p-3 outline-none focus:border-blue-500" value={formState.price} onChange={e => setFormState({...formState, price: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Affiliate Tracking Link</label>
              <input type="text" className="w-full bg-slate-50 border rounded-xl p-3 outline-none focus:border-blue-500" value={formState.affiliateLink} onChange={e => setFormState({...formState, affiliateLink: e.target.value})} />
            </div>
          </div>
          <div className="mt-10 flex gap-4">
             <button onClick={handleSave} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"><Save size={18} /> Save Changes</button>
             <button onClick={() => setEditingProduct(null)} className="px-8 bg-slate-100 text-slate-600 font-bold py-4 rounded-xl">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-[80vh] animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
           <h2 className="text-2xl font-black">Admin Inventory Manager</h2>
           <div className="flex items-center gap-4">
             <span className="bg-blue-100 text-blue-700 text-xs font-black px-4 py-2 rounded-full">{products.length} Reviews</span>
             <button onClick={onLogout} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-red-100">
               <LogOut size={16} /> Logout
             </button>
           </div>
        </div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 border-b text-xs font-bold uppercase text-slate-500"><tr><th className="p-6">Review</th><th className="p-6">Price</th><th className="p-6 text-center">Manage</th></tr></thead>
           <tbody>{products.map(p => (<tr key={p.id} className="border-b hover:bg-blue-50/20"><td className="p-6 font-bold text-slate-800">{p.title}</td><td className="p-6">AED {Number(p.price).toLocaleString()}</td><td className="p-6 text-center flex items-center justify-center gap-2">
             <button onClick={() => startEdit(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit size={18} /></button>
             <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
           </td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
};

// --- ABOUT SECTION ---
const AboutUsSection = () => (
  <section className="bg-white py-16 px-4 border-t border-gray-100">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <div className="inline-block bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">CoolLivingUAE Mission</div>
        <h2 className="text-3xl font-black text-slate-900 leading-tight">Expert Home Solutions for the <span className="text-blue-600 underline decoration-teal-400">Emirates Climate</span>.</h2>
        <p className="text-slate-600 leading-relaxed">CoolLivingUAE was founded with a singular objective: to demystify the complex world of cooling technology in the Gulf. With summer temperatures regularly exceeding 50°C, a standard appliance review isn't enough. We test products specifically against <strong>T3 Climate Standards</strong> (high ambient heat) to ensure our readers invest in hardware that actually performs when they need it most.</p>
        <p className="text-slate-600 leading-relaxed">Our team of Dubai-based specialists combines HVAC engineering knowledge with consumer technology expertise. We provide data-driven insights into energy consumption (DEWA efficiency), air filtration benchmarks (HEPA standards for desert dust), and smart home integration compatibility.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <ShieldCheck className="text-teal-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">ESMA & T3 Verified</h4>
            <p className="text-[10px] text-slate-500">Tested for UAE regulatory compliance and peak desert heat.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Activity className="text-blue-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">Real-World Data</h4>
            <p className="text-[10px] text-slate-500">Actual energy savings tracked in Dubai villas and apartments.</p>
          </div>
        </div>
      </div>
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex flex-col items-center justify-center p-8 text-white shadow-2xl overflow-hidden relative">
        <div className="text-5xl font-black mb-2 tracking-tighter">10,000+</div>
        <div className="text-sm font-bold opacity-80 uppercase tracking-widest">Residents Helped Monthly</div>
        <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12"><Wind size={250} /></div>
      </div>
    </div>
  </section>
);

// --- MAIN APP ---
export default function App() {
  const [route, setRoute] = useState({ path: '/', params: {} });
  const [showSecurityGate, setShowSecurityGate] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [products, setProducts] = useState(initialProducts);

  const navigate = (path, params = {}) => { window.scrollTo(0, 0); setRoute({ path, params }); };
  const handleLogout = () => { setIsAdminAuthenticated(false); navigate('/'); };

  const renderPage = () => {
    switch (route.path) {
      case '/': return <HomePage products={products} categories={initialCategories} navigate={navigate} />;
      case 'category': return <CategoryPage categoryId={route.params.id} categories={initialCategories} products={products} navigate={navigate} />;
      case 'product': return <ProductReviewPage productId={route.params.id} products={products} navigate={navigate} />;
      case 'guides': return <GuidePage />;
      case 'reviews': return <ReviewsPage navigate={navigate} />;
      case 'contact': return <ContactPage />;
      case 'privacy': return <PrivacyPolicyPage />;
      case 'installation': return <InstallationPage productId={route.params.id} products={products} navigate={navigate} />;
      case 'admin': return isAdminAuthenticated ? <AdminDashboard products={products} setProducts={setProducts} onLogout={handleLogout} /> : null;
      default: return <div className="p-20 text-center font-bold">404 - Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {showSecurityGate && <AdminSecurityGate onVerify={() => { setIsAdminAuthenticated(true); setShowSecurityGate(false); navigate('admin'); }} onCancel={() => setShowSecurityGate(false)} />}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 text-white p-2 rounded-lg"><Wind size={24} /></div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">CoolLiving<span className="text-blue-600">UAE</span></span>
          </div>
          <nav className="hidden md:flex space-x-8 font-bold text-gray-600 text-sm">
            <span onClick={() => navigate('/')} className={`cursor-pointer hover:text-blue-600 ${route.path === '/' ? 'text-blue-600' : ''}`}>Home</span>
            <span onClick={() => navigate('category', {id: 'smart-acs'})} className={`cursor-pointer hover:text-blue-600 ${route.params?.id === 'smart-acs' ? 'text-blue-600' : ''}`}>AC Reviews</span>
            <span onClick={() => navigate('reviews')} className={`cursor-pointer hover:text-blue-600 ${route.path === 'reviews' ? 'text-blue-600' : ''}`}>Resident Reviews</span>
            <span onClick={() => navigate('guides')} className={`cursor-pointer hover:text-blue-600 ${route.path === 'guides' ? 'text-blue-600' : ''}`}>Saving Guides</span>
            <span onClick={() => navigate('contact')} className={`cursor-pointer hover:text-blue-600 ${route.path === 'contact' ? 'text-blue-600' : ''}`}>Contact</span>
          </nav>
        </div>
      </header>
      <main className="flex-grow">{renderPage()}</main>
      <AboutUsSection />
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10 border-b border-slate-800 pb-10">
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">CoolLivingUAE</div><p className="text-xs leading-relaxed">Independent reviewer of cooling tech for T3 desert climates. Helping Dubai residents save on energy.</p></div>
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Quick Links</div><ul className="text-xs space-y-2"><li className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('reviews')}>Resident Reviews</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('guides')}>DEWA Saving Guide</li></ul></div>
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Legal</div><ul className="text-xs space-y-2"><li className="hover:text-white cursor-pointer" onClick={() => navigate('privacy')}>Privacy Policy</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('privacy')}>Cookies Policy</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('privacy')}>Affiliate Disclosure</li></ul></div>
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Support</div><p className="text-[10px] mb-2 font-mono">kennedyngufung@gmail.com</p><div className="text-[10px] text-slate-500 italic">Dubai, United Arab Emirates</div></div>
          </div>
          <div className="text-center pt-4">
            <p className="text-[10px] tracking-widest">
              <span onClick={() => isAdminAuthenticated ? navigate('admin') : setShowSecurityGate(true)} className="cursor-default">©</span> 
              {new Date().getFullYear()} COOLLIVINGUAE. INDEPENDENT REVIEW PLATFORM. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}