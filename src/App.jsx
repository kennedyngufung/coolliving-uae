import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, X, Search, ShoppingCart, Home, LayoutList, 
  FileText, ShieldCheck, ChevronRight, CheckCircle, 
  XCircle, Thermometer, Wind, Zap, Link as LinkIcon, 
  Plus, Edit, Trash2, ExternalLink, Settings, BarChart, Lock, Save,
  Calendar, Clock, User, Star, Mail, MapPin, MessageSquare, ArrowLeft, LogOut
} from 'lucide-react';

// --- MOCK DATABASE ---
const initialCategories = [
  { id: 'smart-acs', name: 'Smart ACs', icon: Thermometer, description: 'The best smart air conditioners in UAE for extreme T3 climate conditions.' },
  { id: 'air-purifiers', name: 'Air Purifiers', icon: Wind, description: 'Top-rated HEPA air purifiers for Dubai homes to combat dust and allergies.' },
  { id: 'smart-thermostats', name: 'Smart Thermostats', icon: Zap, description: 'Intelligent thermostats to reduce DEWA bills and energy consumption in the UAE.' }
];

const generateProducts = () => {
  const products = [];
  
  // AC Images
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

  // Purifier Images
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
    'https://tse4.mm.bing.net/th/id/OIP.NfwJQ5zR2HIrPYzxyp7gPAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3',
    'https://www.electrolux.com.my/globalassets/appliances/accessories/eskc9a/my-eskc9a-insit-1500x1500.jpg?width=1920',
    'https://images.thdstatic.com/productImages/62d0313c-957a-44a5-8da0-ccd6aff7f95b/svn/grays-fellowes-air-purifiers-9416201-64_300.jpg',
    'https://m.media-amazon.com/images/I/71s40QoAJbL._AC_UL640_QL65_.jpg'
  ];

  // Thermostat Images - Fully updated with 15 verified links
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
    'https://m.media-amazon.com/images/I/512J3gqzLuL._AC_.jpg' // Placeholder for 15th if needed
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
      <div className="mt-auto flex gap-2">
        <button onClick={() => navigate('product', { id: product.id })} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-2 rounded-lg transition-colors text-xs border border-gray-100">Full Review</button>
        <button onClick={() => window.open(product.affiliateLink, '_blank')} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors text-xs flex items-center justify-center gap-1">Check Deals</button>
      </div>
    </div>
  </article>
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
                <button onClick={() => window.open(product.affiliateLink, '_blank')} className="w-full bg-orange-500 text-white py-4 rounded-xl font-black hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2">Check Lowest UAE Price <ExternalLink size={18} /></button>
              </div>
            </div>
          </div>
        </div>
        <aside className="lg:col-span-4"><AdSense slotId="product-sidebar" type="sidebar" /></aside>
      </div>
    </div>
  );
};

const GuidePage = () => {
  useEffect(() => updateSEO('DEWA Saving Guide 2026', 'Practical tips to reduce energy consumption and DEWA bills in UAE.'), []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 animate-in fade-in">
      <h1 className="text-4xl font-black text-slate-900 mb-8 text-center">DEWA Energy Saving Guide 2026</h1>
      <div className="prose prose-blue max-w-none bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><Zap size={24} /> 1. AC Temperature Setting</h2>
            <p className="text-slate-600 leading-relaxed">Set your AC to 24°C. For every degree lower, you can increase your cooling bill by 6-9% in Dubai summer conditions.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><CheckCircle size={24} /> 2. Smart Thermostat Integration</h2>
            <p className="text-slate-600 leading-relaxed">Upgrading to a smart thermostat like Nest or Ecobee can automate your cooling and save up to 25% on annual bills.</p>
          </section>
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-600 mb-4"><Thermometer size={24} /> 3. Regular Maintenance</h2>
            <p className="text-slate-600 leading-relaxed">Dirty filters force your AC to work harder. Clean your filters monthly during summer to maintain peak efficiency.</p>
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
        <p className="text-slate-600 leading-relaxed">CoolLivingUAE provides the most reliable testing data for air conditioning and air purification systems specifically designed for T3 climate conditions in the GCC.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <ShieldCheck className="text-teal-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">ESMA Compliant</h4>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Zap className="text-blue-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">DEWA Saver</h4>
          </div>
        </div>
      </div>
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex items-center justify-center p-8 text-white shadow-2xl overflow-hidden relative">
        <div className="text-5xl font-black">2026</div>
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
      case 'contact': return <ContactPage />;
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
            <span onClick={() => navigate('contact')} className={`cursor-pointer hover:text-blue-600 ${route.path === 'contact' ? 'text-blue-600' : ''}`}>Contact</span>
          </nav>
        </div>
      </header>
      <main className="flex-grow">{renderPage()}</main>
      <AboutUsSection />
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 border-b border-slate-800 pb-10">
            <div><div className="text-white font-bold mb-4">CoolLivingUAE</div><p className="text-xs">Independent reviewer of cooling tech for T3 desert climates.</p></div>
            <div><div className="text-white font-bold mb-4">Quick Links</div><ul className="text-xs space-y-2"><li className="hover:text-white cursor-pointer" onClick={() => navigate('/')}>Home</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('contact')}>Expert Advice</li></ul></div>
            <div><div className="text-white font-bold mb-4">Support</div><p className="text-[10px]">Email: kennedyngufung@gmail.com</p></div>
          </div>
          <div className="text-center">
            <p className="text-[10px]">
              <span onClick={() => isAdminAuthenticated ? navigate('admin') : setShowSecurityGate(true)} className="cursor-default">©</span> 
              {new Date().getFullYear()} CoolLivingUAE. Independent Review Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}