import { db, auth } from "./firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, addDoc, getDocs, query, where, orderBy, limit as fsLimit, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Menu, X, Search, ShoppingCart, Home, LayoutList, 
  FileText, ShieldCheck, ChevronRight, CheckCircle, 
  XCircle, Thermometer, Wind, Zap, Link as LinkIcon, 
  Plus, Edit, Trash2, ExternalLink, Settings, BarChart, Lock, Save,
  Calendar, Clock, User, Star, Mail, MapPin, MessageSquare, ArrowLeft, LogOut,
  Droplets, Sun, Activity, HelpCircle, ChevronDown, ChevronUp, Quote
} from 'lucide-react';
import { products as catalogueProducts, formatPriceBand, priceBandMidpoint } from './data/products';
import { uaeACDatabase } from './data/calculatorAcs';
import AffiliateLink from './components/AffiliateLink';
import AffiliateDisclosure from './components/AffiliateDisclosure';
import { submitReview, fetchApprovedReviews, EMIRATES, LIMITS, REVIEWS_COLLECTION } from './reviews';
import { pathToRoute, routeToPath } from './routes';
import { initAnalytics, setAnalyticsConsent, trackPageView } from './analytics';

/** Blank state for the admin product forms. Mirrors the data/products.js field contract. */
const EMPTY_PRODUCT_FORM = {
  title: '', brand: '', category: 'smart-acs', priceMin: '', priceMax: '',
  editorialScore: '4.5', image: '', amazonQuery: '', description: '', tons: '',
};

// --- MOCK DATABASE ---
const initialCategories = [
  { id: 'smart-acs', name: 'Smart ACs', icon: Thermometer, description: 'The best smart air conditioners in UAE for extreme T3 climate conditions.' },
  { id: 'air-purifiers', name: 'Air Purifiers', icon: Wind, description: 'Top-rated HEPA air purifiers for Dubai homes to combat dust and allergies.' },
  { id: 'smart-thermostats', name: 'Smart Thermostats', icon: Zap, description: 'Intelligent thermostats to reduce DEWA bills and energy consumption in the UAE.' }
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

const initialProducts = catalogueProducts;

// --- SEO ENGINE (Full OG + Twitter + Canonical + JSON-LD) ---
const SITE_ORIGIN = 'https://coollivinguae.com';

/**
 * @param {string} title       Page title. The brand suffix is appended unless
 *                             the title already carries it.
 * @param {string} description Meta description.
 * @param {string} path        Canonical path override. Defaults to the current
 *                             URL, which is correct for every real page.
 * @param {string} imageUrl    Open Graph image override.
 * @param {boolean} noIndex    Set for pages that must stay out of the index.
 */
const updateSEO = (title, description, path = '', imageUrl = '', noIndex = false) => {
  // Several pages already end in "| CoolLivingUAE"; appending unconditionally
  // produced titles like "Privacy Policy | CoolLivingUAE | CoolLivingUAE".
  const fullTitle = title.includes('CoolLivingUAE') ? title : `${title} | CoolLivingUAE`;

  // Derive the canonical URL from the address bar. Previously no caller passed
  // `path`, so every page declared the homepage as its canonical — telling
  // Google that all 73 URLs were duplicates of "/" and should not be indexed.
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const canonicalPath = path ? (path.startsWith('/') ? path : `/${path}`) : currentPath;
  const canonical = `${SITE_ORIGIN}${canonicalPath === '/' ? '' : canonicalPath}`;
  const ogImage = imageUrl || `${SITE_ORIGIN}/og-default.jpg`;

  document.title = fullTitle;

  const setMeta = (sel, attr, val) => {
    let el = document.querySelector(sel);
    if (!el) { el = document.createElement('meta'); document.head.appendChild(el); }
    el.setAttribute(attr === 'content' ? (el.tagName === 'META' ? 'content' : 'content') : attr, val);
    return el;
  };
  const setMetaName  = (name, content) => { let el = document.querySelector(`meta[name="${name}"]`) || document.createElement('meta'); el.name = name; el.content = content; document.head.appendChild(el); };
  const setMetaProp  = (prop, content) => { let el = document.querySelector(`meta[property="${prop}"]`) || document.createElement('meta'); el.setAttribute('property', prop); el.content = content; document.head.appendChild(el); };
  const setLink      = (rel, href)     => { let el = document.querySelector(`link[rel="${rel}"]`) || document.createElement('link'); el.rel = rel; el.href = href; document.head.appendChild(el); };

  // Basic
  setMetaName('description', description);
  setMetaName('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
  setLink('canonical', canonical);

  // Open Graph
  setMetaProp('og:type',        'website');
  setMetaProp('og:site_name',   'CoolLivingUAE');
  setMetaProp('og:title',       fullTitle);
  setMetaProp('og:description', description);
  setMetaProp('og:url',         canonical);
  setMetaProp('og:image',       ogImage);
  setMetaProp('og:locale',      'en_AE');

  // Twitter / X
  setMetaName('twitter:card',        'summary_large_image');
  setMetaName('twitter:site',        '@CoolLivingUAE');
  setMetaName('twitter:title',       fullTitle);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image',       ogImage);

  // JSON-LD structured data
  let ldScript = document.getElementById('ld-json');
  if (!ldScript) { ldScript = document.createElement('script'); ldScript.id = 'ld-json'; ldScript.type = 'application/ld+json'; document.head.appendChild(ldScript); }
  ldScript.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: fullTitle,
    description,
    url: canonical,
    publisher: {
      '@type': 'Organization',
      name: 'CoolLivingUAE',
      url: 'https://coollivinguae.com',
      logo: { '@type': 'ImageObject', url: 'https://coollivinguae.com/logo.png' },
      contactPoint: { '@type': 'ContactPoint', email: 'kennedyngufung@gmail.com', contactType: 'customer support', areaServed: 'AE' }
    },
    inLanguage: 'en-AE',
    copyrightYear: new Date().getFullYear(),
  });
};

// --- ADSENSE (clean — no fake placeholder text) ---
const AdSense = ({ slotId, type = 'horizontal' }) => (
  <div className={`my-8 mx-auto w-full overflow-hidden ${type === 'sidebar' ? 'min-h-[600px]' : 'min-h-[120px]'}`}
    data-ad-slot={slotId} aria-hidden="true" />
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
const ProductCard = ({ product, navigate }) => {
  const [imgError, setImgError] = useState(false);
  return (
    <article onClick={() => navigate('product', { id: product.id })}
      className="bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group cursor-pointer hover:-translate-y-1">
      <div className="h-48 overflow-hidden relative bg-slate-100">
        {!imgError
          ? <img src={product.image} alt={`${product.brand} ${product.title}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <img src={`https://m.media-amazon.com/images/I/715rBETRD9L._SL1500_.jpg`}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        }
        <div
          className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1"
          title="CoolLivingUAE editorial score — our own assessment, not a user rating"
        >
          <Star size={10} fill="currentColor" /> {product.editorialScore}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="text-[10px] text-blue-500 font-bold mb-1 uppercase tracking-widest">{product.brand}</div>
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">{product.title}</h3>
        <div className="mb-4">
          <div className="text-lg font-black text-gray-900">{formatPriceBand(product.priceBand)}</div>
          <div className="text-[9px] text-slate-400 uppercase tracking-widest">Indicative range</div>
        </div>
        <div className="mt-auto space-y-2">
          <div className="flex gap-2">
            <button onClick={e => { e.stopPropagation(); navigate('product', { id: product.id }); }}
              className="flex-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-700 font-bold py-2 rounded-lg transition-all text-xs border border-gray-100 flex items-center justify-center gap-1">
              Full Review <ChevronRight size={12} />
            </button>
            <AffiliateLink
              query={product.amazonQuery}
              trackingLabel={product.title}
              onNavigate={e => e.stopPropagation()}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-lg transition-colors text-xs flex items-center justify-center"
            >
              Check Price
            </AffiliateLink>
          </div>
          <button onClick={e => { e.stopPropagation(); navigate('installation', { id: product.id }); }}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition-all text-xs flex items-center justify-center gap-1">
            <Settings size={14} /> Request Installation
          </button>
        </div>
      </div>
    </article>
  );
};

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

/**
 * Formats a Firestore timestamp for display. serverTimestamp() resolves
 * asynchronously, so a freshly written document can briefly carry a null
 * createdAt — hence the guard.
 */
const formatReviewDate = (createdAt) => {
  if (!createdAt || typeof createdAt.toDate !== 'function') return null;
  return createdAt.toDate().toLocaleDateString('en-AE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const initialsOf = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(n => n[0] || '').join('').toUpperCase() || '?';

const ReviewCard = ({ review }) => {
  const date = formatReviewDate(review.createdAt);
  const place = [review.area, review.emirate].filter(Boolean).join(', ');
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center gap-1 text-orange-400 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200"} />
        ))}
      </div>
      <p className="text-slate-700 text-sm leading-relaxed mb-6 flex-grow">{review.text}</p>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xs">
          {initialsOf(review.name)}
        </div>
        <div>
          <div className="text-sm font-bold text-slate-900">{review.name}</div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin size={8} /> {place}{date ? ` • ${date}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PAGES ---
const HomePage = ({ products, categories, navigate }) => {
  useEffect(() => updateSEO('Best Smart Cooling & Energy Saving Tech in UAE 2026', 'Independent reviews of 60+ cooling products for the UAE climate.'), []);

  // Approved resident reviews only. The section stays hidden until real
  // submissions have been moderated through — an empty testimonial rail is
  // preferable to inventing one.
  const [residentReviews, setResidentReviews] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchApprovedReviews(3).then(rows => { if (!cancelled) setResidentReviews(rows); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white py-20 px-6 rounded-3xl mx-4 my-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Wind size={400} /></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">Master the UAE Climate with <span className="text-teal-400">Smart Technology</span></h1>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">Discover expert reviews on the top 60+ ACs and purifiers specifically tested for Dubai's extreme summer heat.</p>
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
              <div key={cat.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 transition-all flex flex-col gap-4 group">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 text-blue-600 p-4 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0"><cat.icon size={28} /></div>
                  <div><h3 className="font-bold text-xl text-gray-900 mb-1">{cat.name}</h3><p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p></div>
                </div>
                <button onClick={() => navigate('category', { id: cat.id })}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-sm group-hover:shadow-md">
                  Browse Reviews <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* AC Calculator CTA Banner */}
        <section className="mb-20">
          <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Thermometer size={280} /></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-4 py-2 text-teal-300 text-xs font-bold uppercase tracking-widest mb-4"><Zap size={12} /> New Feature</div>
                <h2 className="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">Not Sure Which AC Size You Need?</h2>
                <p className="text-blue-100 max-w-lg leading-relaxed">Enter your room dimensions and our UAE T3 climate calculator instantly tells you the exact BTU required — then shows you the cheapest matching ACs on Amazon.ae and Noon right now.</p>
              </div>
              <button onClick={() => navigate('calculator')} className="flex-shrink-0 bg-teal-500 hover:bg-teal-400 text-white font-black py-4 px-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-1 flex items-center gap-2 text-sm whitespace-nowrap">
                <Thermometer size={18} /> Try AC Calculator <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Resident reviews — rendered only when moderated submissions exist */}
        <section className={residentReviews.length > 0 ? 'mb-20' : 'hidden'}>
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-900">What Residents Say</h2>
              <button onClick={() => navigate('reviews')} className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">View All <ChevronRight size={16} /></button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {residentReviews.map(review => <ReviewCard key={review.id} review={review} />)}
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

 useEffect(() => {
    updateSEO(
      `Request Installation - ${product?.brand}`,
      "Professional HVAC installation across Dubai, Abu Dhabi and Sharjah."
    );
  }, [product]);

 
if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-3xl font-bold mb-4 text-green-600">
          ✅ Request Submitted Successfully!
        </h2>

        <p className="text-slate-500 mb-8">
          Our installation team will contact you shortly.
        </p>

        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition">
          Return to Home
        </button>
      </div>
      );
  }

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

    setSubmitted(true);   // 👈 THIS triggers success screen

  
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


const ReviewsPage = () => {
  useEffect(() => updateSEO('Resident Reviews | CoolLivingUAE', 'Experiences shared by UAE residents about cooling and air quality in their homes.'), []);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', emirate: '', area: '', rating: 5, text: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = () => {
    fetchApprovedReviews(24)
      .then(setReviews)
      .finally(() => setLoading(false));
  };
  useEffect(loadReviews, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await submitReview(form);
      setSubmitted(true);
      setForm({ name: '', emirate: '', area: '', rating: 5, text: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all';

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 animate-in fade-in">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Resident Reviews</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Experiences shared by residents across the Emirates. Every review here was submitted
          by a visitor and checked by us before publication — we do not write them ourselves.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold">Loading reviews…</div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
          <MessageSquare size={40} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">No reviews published yet</h2>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            We have just opened submissions. If you have bought or lived with any of the
            products we cover, yours could be the first — use the form below.
          </p>
        </div>
      )}

      <div className="mt-20 bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Share Your Experience</h2>
        <p className="text-slate-500 text-sm mb-8">
          Tell other UAE residents what worked in your home. Submissions are reviewed before
          they appear, usually within a few days. We publish your name and emirate only —
          never contact details.
        </p>

        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-green-900 mb-2">Thank you — your review has been received.</h3>
            <p className="text-green-800 text-sm mb-6">It will appear on this page once we have checked it.</p>
            <button onClick={() => setSubmitted(false)} className="text-green-700 font-bold text-sm hover:underline">
              Submit another review
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-bold" role="alert">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="review-name" className="block text-xs font-bold uppercase text-slate-400 mb-2">Your Name</label>
                <input id="review-name" className={inputCls} required
                  maxLength={LIMITS.name.max} value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="review-emirate" className="block text-xs font-bold uppercase text-slate-400 mb-2">Emirate</label>
                <select id="review-emirate" className={inputCls} required value={form.emirate}
                  onChange={e => setForm({ ...form, emirate: e.target.value })}>
                  <option value="">Select…</option>
                  {EMIRATES.map(em => <option key={em} value={em}>{em}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="review-area" className="block text-xs font-bold uppercase text-slate-400 mb-2">Area <span className="normal-case font-medium text-slate-300">(optional)</span></label>
              <input id="review-area" className={inputCls} placeholder="e.g. Dubai Marina"
                maxLength={LIMITS.area.max} value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })} />
            </div>

            <div>
              <span className="block text-xs font-bold uppercase text-slate-400 mb-2">Your Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm({ ...form, rating: n })}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    aria-pressed={form.rating === n}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${form.rating >= n ? 'bg-orange-400 border-orange-400 text-white' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                    <Star size={18} fill="currentColor" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="review-text" className="block text-xs font-bold uppercase text-slate-400 mb-2">Your Experience</label>
              <textarea id="review-text" rows={6} className={inputCls} required
                minLength={LIMITS.text.min} maxLength={LIMITS.text.max}
                placeholder="What did you buy, and how has it performed in your home?"
                value={form.text}
                onChange={e => setForm({ ...form, text: e.target.value })} />
              <div className="text-[10px] text-slate-400 mt-1 text-right">
                {form.text.length} / {LIMITS.text.max}
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {submitting ? 'Submitting…' : <>Submit Review <ChevronRight size={20} /></>}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
              We publish your name and emirate. Reviews that are promotional, abusive, or
              cannot be attributed to genuine experience are not published.
            </p>
          </form>
        )}
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
      <AffiliateDisclosure className="mb-8" />
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
                   <div className="text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-widest">Editorial Score</div>
                   <div className="text-2xl font-black text-blue-600 flex items-center gap-1">{product.editorialScore} <Star size={20} fill="currentColor" /></div>
                   <div className="text-[9px] text-slate-400 mt-1">CoolLivingUAE assessment</div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-2">{product.brand} • Editorial Review</div>
                <h1 className="text-3xl font-extrabold mb-4 text-slate-900 leading-tight">{product.title}</h1>
                <div className="mb-6">
                  <div className="text-3xl font-black text-slate-900">{formatPriceBand(product.priceBand)}</div>
                  <div className="text-xs text-slate-400 mt-1">Indicative range — check the retailer for the current price.</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText size={18} className="text-blue-500" /> Our Verdict</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{product.description}</p>
                </div>
                <AffiliateDisclosure className="mb-4" />
                <div className="space-y-3">
                  <AffiliateLink
                    query={product.amazonQuery}
                    trackingLabel={product.title}
                    className="w-full bg-orange-500 text-white py-4 rounded-xl font-black hover:bg-orange-600 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    Check Price on Amazon.ae <ExternalLink size={18} />
                  </AffiliateLink>
                  <button onClick={() => navigate('installation', { id: product.id })} className="w-full bg-green-600 text-white py-4 rounded-xl font-black hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2">Get Installation Quote <Settings size={18} /></button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-3">How we assess these products</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Our verdicts are editorial opinions formed from manufacturer specifications,
              published certifications and independent research, and the UAE service and
              warranty terms each brand offers. We weight T3 compressor certification,
              corrosion resistance, and after-sales coverage heavily, because those are the
              factors that determine whether a unit still performs after several Gulf summers.
              Where we have not tested a product ourselves, we do not claim to have done so.
            </p>
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

// --- COOKIES POLICY PAGE ---
const CookiesPolicyPage = () => {
  useEffect(() => updateSEO('Cookies Policy | CoolLivingUAE', 'How CoolLivingUAE uses cookies to enhance your browsing experience.'), []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><ShieldCheck size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Cookies Policy</h1>
            <p className="text-sm text-slate-400 font-bold mt-1">Last Updated: February 28, 2026</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-10">
          <p className="text-blue-800 text-sm leading-relaxed font-medium">This Cookies Policy explains what cookies are, how CoolLivingUAE ("we", "us", "our") uses them, and your choices regarding cookies when you visit our website at coollivinguae.com.</p>
        </div>
        <div className="space-y-10 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span> What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device by a website when you visit it. They are widely used to make websites work, or work more efficiently, as well as to provide information to the website operators. Cookies allow a website to recognise your device and remember your preferences across multiple visits.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span> How We Use Cookies</h2>
            <p className="mb-4">CoolLivingUAE uses cookies for several purposes. We categorise them as follows:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Strictly Necessary Cookies', desc: 'These are essential for the website to function. Without them, services you have asked for (like browsing our AC reviews) cannot be provided. They do not gather information for marketing.' },
                { title: 'Performance Cookies', desc: 'These cookies collect anonymous information on how visitors use our website — for example, which pages are visited most often. We use this data to improve your experience.' },
                { title: 'Functionality Cookies', desc: 'These remember choices you make (such as your preferred language or region) to provide a more personalised experience and avoid repeating preferences on return visits.' },
                { title: 'Targeting & Advertising Cookies', desc: 'Set by our advertising partners (Google AdSense, Amazon Associates), these cookies track your browsing habits to deliver relevant ads and affiliate product recommendations.' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span> Third-Party Cookies</h2>
            <p className="mb-4">In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the website and deliver advertisements:</p>
            <ul className="list-none space-y-3 ml-0">
              {[
                { name: 'Google Analytics & AdSense', detail: 'Used to analyse site traffic and serve contextual advertisements based on your interests and browsing history.' },
                { name: 'Amazon Associates', detail: 'When you click our product recommendation links to Amazon.ae, Amazon may set a cookie to track the referral for commission purposes.' },
                { name: 'Noon Affiliate Network', detail: 'Similar to Amazon, Noon may set a tracking cookie when you visit their platform via our recommendation links.' },
                { name: 'Firebase (Google)', detail: 'Used for our installation request backend. Firebase may use performance and analytics cookies to ensure the service reliability.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <CheckCircle size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                  <div><span className="font-bold text-slate-800 text-sm">{item.name}: </span><span className="text-slate-500 text-sm">{item.detail}</span></div>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">4</span> Cookie Duration</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-slate-900 text-white"><th className="p-3 text-left rounded-tl-xl text-xs font-bold uppercase tracking-widest">Cookie Type</th><th className="p-3 text-left text-xs font-bold uppercase tracking-widest">Duration</th><th className="p-3 text-left rounded-tr-xl text-xs font-bold uppercase tracking-widest">Purpose</th></tr></thead>
                <tbody>
                  {[
                    ['Session Cookies', 'Deleted on browser close', 'Temporary preferences & navigation state'],
                    ['Google Analytics', 'Up to 2 years', 'Traffic analytics and user behaviour analysis'],
                    ['Google AdSense', 'Up to 2 years', 'Ad personalisation and frequency capping'],
                    ['Amazon Affiliate', '24 hours (standard)', 'Referral tracking for commission calculation'],
                    ['Noon Affiliate', '30 days', 'Referral tracking for commission calculation'],
                  ].map(([type, duration, purpose], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}><td className="p-3 font-medium text-slate-800 text-xs">{type}</td><td className="p-3 text-slate-500 text-xs">{duration}</td><td className="p-3 text-slate-500 text-xs">{purpose}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">5</span> Managing Your Cookie Preferences</h2>
            <p className="mb-4">You have the right to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer. Note that this may prevent you from taking full advantage of the website.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Chrome', 'Firefox', 'Safari', 'Microsoft Edge'].map(browser => (
                <div key={browser} className="bg-slate-900 text-white rounded-2xl p-4 text-center text-sm font-bold">{browser}</div>
              ))}
            </div>
            <p className="mt-4 text-sm text-slate-500">Visit each browser's settings under "Privacy" or "Cookies" to manage your preferences. You may also opt out of Google's use of cookies by visiting the <strong>Google Ad Settings page</strong>.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">6</span> Contact Us</h2>
            <p>If you have any questions about our use of cookies, please contact us at <strong>kennedyngufung@gmail.com</strong>. We will respond to all UAE-based enquiries within 24 business hours.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- AFFILIATE DISCLOSURE PAGE ---
const AffiliateDisclosurePage = () => {
  useEffect(() => updateSEO('Affiliate Disclosure | CoolLivingUAE', 'Full transparency on how CoolLivingUAE earns commissions through affiliate partnerships.'), []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange-50 p-4 rounded-2xl text-orange-500"><LinkIcon size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Affiliate Disclosure</h1>
            <p className="text-sm text-slate-400 font-bold mt-1">Last Updated: February 28, 2026</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-orange-900 text-sm leading-relaxed font-medium"><strong>Plain-Language Summary:</strong> Some links on CoolLivingUAE point to products on Amazon.ae and Noon.ae. If we hold an affiliate relationship with a retailer at the time you click, and you go on to buy, we may earn a small commission — at <strong>absolutely no extra cost to you</strong>. This is how we intend to fund our independent research. Our editorial opinions are never influenced by these arrangements.</p>
          </div>
        </div>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Who We Are</h2>
            <p>CoolLivingUAE is an independent product review and information platform based in Dubai, UAE. Our mission is to help residents of the Emirates make informed purchasing decisions about cooling technology, air purification, and energy management. We test or thoroughly research all products we review.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our Affiliate Partnerships</h2>
            <p className="mb-6">We describe our commercial position accurately, including where a relationship does not yet exist:</p>
            <div className="space-y-4">
              {[
                { name: 'Amazon.ae Associates Programme', icon: '🛒', desc: 'We intend to participate in the Amazon Associates Programme. Where we are an approved participant, we earn from qualifying purchases: clicking a product link to Amazon.ae may award us a commission if you complete a purchase within Amazon\'s standard attribution window. Commission rates are set by Amazon and vary by product category. Until approval is granted, our Amazon links carry no tracking and earn us nothing.', color: 'bg-yellow-50 border-yellow-100' },
                { name: 'Noon.ae Affiliate Programme', icon: '🟡', desc: 'We intend to participate in Noon\'s affiliate programme on the same basis. Where the relationship is active, purchases made through our Noon links may earn us a referral fee under their standard terms.', color: 'bg-yellow-50 border-yellow-100' },
                { name: 'Advertising', icon: '📊', desc: 'This site does not currently display third-party advertising. If we introduce contextual advertising in future, it will be clearly distinguishable from editorial content, and this page will be updated before it goes live.', color: 'bg-blue-50 border-blue-100' },
                { name: 'Sponsored Content', icon: '🤝', desc: 'We have no sponsored content and no paid brand partnerships. Should that change, any sponsored item would be labelled as such at the top of the relevant page, and no payment would alter a ranking or verdict.', color: 'bg-green-50 border-green-100' },
              ].map((item, i) => (
                <div key={i} className={`${item.color} border rounded-2xl p-6`}>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">{item.name}</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Our Editorial Independence Pledge</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: ShieldCheck, title: 'Never Pay-to-Play', desc: 'No brand can pay to receive a positive review or higher ranking on CoolLivingUAE.' },
                { icon: Star, title: 'Honest Ratings', desc: 'Scores are our own editorial assessment, based on published specifications and certifications — not user review averages, and not paid placements.' },
                { icon: CheckCircle, title: 'Transparent Labels', desc: 'All sponsored content, paid partnerships, and gifted products are clearly disclosed.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-center">
                  <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mx-auto mb-3"><Icon size={24} /></div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{title}</h4>
                  <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Regulatory Compliance</h2>
            <p>This disclosure is provided in compliance with the <strong>US Federal Trade Commission (FTC) 16 CFR Part 255</strong> guidelines and applicable UAE Consumer Protection regulations. We are committed to full transparency with our readers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Questions?</h2>
            <p>If you have any questions about our affiliate relationships or how we earn revenue, please contact us at <strong>kennedyngufung@gmail.com</strong>. We believe in full transparency and will answer any specific questions about product links or partnerships.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- SECURITY PAGE ---
const SecurityPage = () => {
  useEffect(() => updateSEO('Security & Trust | CoolLivingUAE', 'How CoolLivingUAE protects your data and maintains platform security in the UAE.'), []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 p-10 md:p-14 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><ShieldCheck size={300} /></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-4 py-2 text-teal-300 text-xs font-bold uppercase tracking-widest mb-6"><ShieldCheck size={14} /> Security & Trust Centre</div>
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">Your Security Is Our Priority</h1>
            <p className="text-blue-200 max-w-2xl leading-relaxed">CoolLivingUAE implements industry-standard security practices to protect your data, ensure platform integrity, and maintain a trustworthy experience for all UAE residents.</p>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12 text-slate-600 leading-relaxed">
          {/* Security Measures Grid */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Platform Security Measures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Lock, title: 'HTTPS / TLS Encryption', desc: 'All data transmitted between your browser and our servers is encrypted using TLS 1.3. Look for the padlock icon in your browser address bar as confirmation.', badge: 'Active', badgeColor: 'bg-green-100 text-green-700' },
                { icon: ShieldCheck, title: 'Firebase Security Rules', desc: 'Our installation request database (Firebase Firestore) is protected by granular security rules. Only our admin account can read submitted data.', badge: 'Enforced', badgeColor: 'bg-green-100 text-green-700' },
                { icon: Activity, title: 'No Stored Payment Data', desc: 'CoolLivingUAE never processes payments directly. All transactions go through Amazon.ae, Noon.ae, or other retailer checkouts. We never see or store your card details.', badge: 'Verified', badgeColor: 'bg-blue-100 text-blue-700' },
                { icon: User, title: 'Minimal Data Collection', desc: 'We collect only what is needed: contact email for support, and installation request details for service coordination. No unnecessary personal data is retained.', badge: 'Privacy-First', badgeColor: 'bg-teal-100 text-teal-700' },
                { icon: Zap, title: 'Content Delivery Network (CDN)', desc: 'Our site is served through a global CDN with DDoS protection, ensuring high availability and protection against volumetric attacks even during UAE summer traffic peaks.', badge: 'Protected', badgeColor: 'bg-green-100 text-green-700' },
                { icon: Settings, title: 'Admin Access Control', desc: 'Our admin panel is protected by a time-limited access key system. Admin sessions are not persisted in browser storage and expire immediately on page close.', badge: 'Secured', badgeColor: 'bg-slate-100 text-slate-700' },
              ].map(({ icon: Icon, title, desc, badge, badgeColor }, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Icon size={20} /></div>
                    <span className={`${badgeColor} text-xs font-black px-3 py-1 rounded-full`}>{badge}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-2">{title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Data We Collect & How It's Protected</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-slate-900 text-white text-xs uppercase tracking-widest"><th className="p-4 text-left rounded-tl-xl">Data Type</th><th className="p-4 text-left">Purpose</th><th className="p-4 text-left">Storage</th><th className="p-4 text-left rounded-tr-xl">Retention</th></tr></thead>
                <tbody>
                  {[
                    ['Installation Request Form', 'Service quote coordination', 'Firebase Firestore (Encrypted at rest)', '90 days post-service'],
                    ['Email Address (voluntary)', 'Support correspondence', 'Email provider inbox only', 'Duration of correspondence'],
                    ['IP Address / Log Data', 'Security monitoring & analytics', 'Server logs (hashed)', '30 days rolling'],
                    ['Analytics Cookies', 'Site improvement', 'Google Analytics (Anonymised)', 'Up to 26 months'],
                    ['Affiliate Click Data', 'Commission tracking', 'Amazon / Noon servers', 'Per partner terms'],
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white border-y border-gray-100'}>
                      {row.map((cell, j) => <td key={j} className="p-4 text-xs text-slate-600">{j === 0 ? <strong className="text-slate-800">{cell}</strong> : cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Responsible Disclosure */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Responsible Vulnerability Disclosure</h2>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <p className="text-blue-900 text-sm leading-relaxed mb-4">We take security vulnerabilities seriously. If you discover a potential security issue on CoolLivingUAE, please report it responsibly:</p>
              <div className="space-y-3">
                {[
                  'Do not publicly disclose the vulnerability before contacting us.',
                  'Email your report to kennedyngufung@gmail.com with subject: "[SECURITY]".',
                  'Provide a clear description of the vulnerability and steps to reproduce it.',
                  'Allow us reasonable time (up to 14 days) to investigate and respond before any public disclosure.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5">{i+1}</span>
                    <p className="text-blue-800 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Third Party Security */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Third-Party Platform Security</h2>
            <p className="mb-4">CoolLivingUAE links to and integrates with third-party platforms. Their security practices are governed by their own policies:</p>
            <ul className="space-y-2">
              {[
                { name: 'Google Firebase', detail: 'ISO 27001 certified, SOC 2/3 compliant, data encrypted at rest and in transit.' },
                { name: 'Amazon.ae', detail: 'PCI-DSS Level 1 compliant. Transactions processed on Amazon\'s secure infrastructure.' },
                { name: 'Noon.ae', detail: 'UAE-based e-commerce platform with SSL encryption and PCI-compliant payment processing.' },
                { name: 'Google AdSense', detail: 'Industry-standard ad serving security. Does not expose user PII to advertisers.' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <ShieldCheck size={16} className="text-teal-500 flex-shrink-0 mt-0.5" />
                  <div><span className="font-bold text-slate-800 text-sm">{item.name}: </span><span className="text-slate-500 text-sm">{item.detail}</span></div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Contact Our Security Team</h2>
            <p>For any security concerns, data protection inquiries, or to request deletion of your personal data, contact us at <strong>kennedyngufung@gmail.com</strong>. Subject your email: <strong>[SECURITY]</strong> or <strong>[DATA REQUEST]</strong>. We aim to respond within 48 hours for all security matters.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- AC ROOM SIZE CALCULATOR PAGE ---

const ACCalculatorPage = ({ navigate }) => {
  useEffect(() => updateSEO('AC Size Calculator for UAE | Find the Right BTU for Your Room', 'Calculate the exact AC capacity you need for any room in Dubai or UAE and get the best-priced recommendations.'), []);

  const [dims, setDims] = useState({ length: '', width: '', height: '' });
  const [roomType, setRoomType] = useState('bedroom');
  const [sunExposure, setSunExposure] = useState('moderate');

  const calcBTU = () => {
    const l = parseFloat(dims.length);
    const w = parseFloat(dims.width);
    const h = parseFloat(dims.height);
    if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) return null;

    const area = l * w;
    // UAE T3 climate base: 600 BTU/sqm (already higher than global 500)
    let baseBTU = area * 600;
    // Height adjustment: for every 0.5m above 2.5m, add 10%
    const extraHeight = Math.max(0, h - 2.5);
    const heightFactor = 1 + (extraHeight / 0.5) * 0.1;
    baseBTU *= heightFactor;
    // Room type adjustments
    const roomFactors = { bedroom: 1.0, living: 1.15, kitchen: 1.25, office: 1.1, studio: 1.05 };
    baseBTU *= (roomFactors[roomType] || 1.0);
    // Sun exposure
    const sunFactors = { low: 0.95, moderate: 1.0, high: 1.1, veryHigh: 1.2 };
    baseBTU *= (sunFactors[sunExposure] || 1.0);

    return Math.round(baseBTU);
  };

  const getRecommendedTons = (btu) => {
    if (!btu) return null;
    if (btu <= 12000) return 1;
    if (btu <= 18000) return 1.5;
    if (btu <= 24000) return 2;
    if (btu <= 30000) return 2.5;
    if (btu <= 36000) return 3;
    return 4;
  };

  const btu = calcBTU();
  const recTons = getRecommendedTons(btu);

  // Ordered by the midpoint of each indicative price band. Exact prices are no
  // longer stored, so the midpoint is what gives a stable, meaningful order.
  const matchedACs = btu
    ? uaeACDatabase
        .filter(ac => ac.tons === recTons || (btu > 36000 && ac.tons === 4))
        .sort((a, b) => priceBandMidpoint(a.priceBand) - priceBandMidpoint(b.priceBand))
    : [];

  const cheapestAmazon = matchedACs.find(ac => ac.amazonQuery);
  const cheapestNoon = matchedACs.find(ac => ac.noonQuery);

  const hasValidDims = dims.length && dims.width && dims.height && parseFloat(dims.length) > 0 && parseFloat(dims.width) > 0 && parseFloat(dims.height) > 0;
  const area = hasValidDims ? (parseFloat(dims.length) * parseFloat(dims.width)).toFixed(1) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in">
      <Breadcrumbs items={[{ name: 'AC Size Calculator' }]} navigate={navigate} />

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-800 text-white p-8 md:p-12 rounded-3xl mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Thermometer size={300} /></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 rounded-full px-4 py-2 text-teal-300 text-xs font-bold uppercase tracking-widest mb-4"><Zap size={12} /> UAE T3 Climate Calculator</div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">Find the Right AC for <span className="text-teal-400">Your Room Size</span></h1>
          <p className="text-blue-100 leading-relaxed">Enter your room dimensions below. Our calculator uses UAE T3 climate standards — calibrated for Dubai's extreme summers — to instantly recommend the correct AC capacity and the lowest-priced options available today on Amazon.ae and Noon.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Calculator Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-28">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Settings size={20} className="text-blue-600" /> Room Details</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Room Length (metres)</label>
                <input type="number" min="0" step="0.1" placeholder="e.g. 5.5" value={dims.length}
                  onChange={e => setDims({ ...dims, length: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Room Width (metres)</label>
                <input type="number" min="0" step="0.1" placeholder="e.g. 4.0" value={dims.width}
                  onChange={e => setDims({ ...dims, width: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Ceiling Height (metres)</label>
                <input type="number" min="0" step="0.1" placeholder="e.g. 2.7" value={dims.height}
                  onChange={e => setDims({ ...dims, height: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Room Type</label>
                <select value={roomType} onChange={e => setRoomType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 outline-none focus:border-blue-500 appearance-none cursor-pointer">
                  <option value="bedroom">Bedroom</option>
                  <option value="living">Living / Majlis Room (+15%)</option>
                  <option value="kitchen">Kitchen (+25%)</option>
                  <option value="office">Home Office (+10%)</option>
                  <option value="studio">Studio Apartment (+5%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Sun Exposure</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'low', label: 'Shaded / North' },
                    { val: 'moderate', label: 'Moderate' },
                    { val: 'high', label: 'South-Facing' },
                    { val: 'veryHigh', label: 'Direct Sun' },
                  ].map(({ val, label }) => (
                    <button key={val} onClick={() => setSunExposure(val)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${sunExposure === val ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary stats */}
            {area && (
              <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Room Area</span><span className="font-black text-slate-800">{area} m²</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-400 font-bold">Volume</span><span className="font-black text-slate-800">{(parseFloat(dims.length) * parseFloat(dims.width) * parseFloat(dims.height)).toFixed(1)} m³</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {!hasValidDims ? (
            <div className="bg-white rounded-3xl shadow-sm border border-dashed border-slate-200 p-12 text-center">
              <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-400"><Thermometer size={40} /></div>
              <h3 className="font-bold text-xl text-slate-700 mb-2">Enter Your Room Dimensions</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Fill in the length, width, and ceiling height on the left to get instant AC recommendations optimised for UAE climate.</p>
            </div>
          ) : (
            <>
              {/* BTU Result Card */}
              <div className="bg-gradient-to-br from-blue-600 to-teal-600 text-white rounded-3xl p-8 shadow-xl">
                <div className="text-xs font-bold uppercase tracking-widest opacity-75 mb-2">UAE T3 Climate Calculation Result</div>
                <div className="flex items-end gap-4 mb-6">
                  <div>
                    <div className="text-5xl font-black tracking-tight">{btu?.toLocaleString()}</div>
                    <div className="text-lg font-bold opacity-80">BTU/hr Required</div>
                  </div>
                  <div className="text-right ml-auto">
                    <div className="text-4xl font-black">{recTons} Ton</div>
                    <div className="text-sm font-bold opacity-80">Recommended Capacity</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-6">
                  <div className="text-center"><div className="text-lg font-black">{area}m²</div><div className="text-[10px] opacity-70 uppercase tracking-widest">Floor Area</div></div>
                  <div className="text-center border-x border-white/20"><div className="text-lg font-black">{recTons * 12000}</div><div className="text-[10px] opacity-70 uppercase tracking-widest">BTU Capacity</div></div>
                  <div className="text-center"><div className="text-lg font-black">T3</div><div className="text-[10px] opacity-70 uppercase tracking-widest">Climate Class</div></div>
                </div>
              </div>

              {/* Best Price Picks */}
              {matchedACs.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-slate-900 text-lg">Matching {recTons} Ton Units</h3>
                    <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full">{recTons} Ton T3</span>
                  </div>

                  <AffiliateDisclosure className="mb-6" />

                  {/* Most affordable option on each retailer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {cheapestAmazon && (
                      <div className="border-2 border-orange-200 rounded-2xl p-5 bg-orange-50 relative overflow-hidden">
                        <div className="absolute top-3 right-3 bg-orange-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Lowest band</div>
                        <img src={cheapestAmazon.img} alt={cheapestAmazon.model} className="w-full h-32 object-cover rounded-xl mb-4 border border-orange-100" onError={e => { e.target.style.display='none'; }} />
                        <div className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mb-1">{cheapestAmazon.brand}</div>
                        <div className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{cheapestAmazon.model}</div>
                        <div className="text-xl font-black text-slate-900 mb-4">{formatPriceBand(cheapestAmazon.priceBand)}<span className="block text-[10px] font-medium text-slate-400">indicative range</span></div>
                        <AffiliateLink merchant="amazon" query={cheapestAmazon.amazonQuery} trackingLabel={cheapestAmazon.model}
                          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors text-sm text-center flex items-center justify-center gap-2">
                          <ExternalLink size={14} /> Check on Amazon.ae
                        </AffiliateLink>
                      </div>
                    )}
                    {cheapestNoon && (
                      <div className="border-2 border-yellow-200 rounded-2xl p-5 bg-yellow-50 relative overflow-hidden">
                        <div className="absolute top-3 right-3 bg-yellow-500 text-white text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Lowest band</div>
                        <img src={cheapestNoon.img} alt={cheapestNoon.model} className="w-full h-32 object-cover rounded-xl mb-4 border border-yellow-100" onError={e => { e.target.style.display='none'; }} />
                        <div className="text-[10px] text-yellow-700 font-bold uppercase tracking-widest mb-1">{cheapestNoon.brand}</div>
                        <div className="font-bold text-slate-900 text-sm mb-1 line-clamp-2">{cheapestNoon.model}</div>
                        <div className="text-xl font-black text-slate-900 mb-4">{formatPriceBand(cheapestNoon.priceBand)}<span className="block text-[10px] font-medium text-slate-400">indicative range</span></div>
                        <AffiliateLink merchant="noon" query={cheapestNoon.noonQuery} trackingLabel={cheapestNoon.model}
                          className="block w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-xl transition-colors text-sm text-center flex items-center justify-center gap-2">
                          <ExternalLink size={14} /> Check on Noon.ae
                        </AffiliateLink>
                      </div>
                    )}
                  </div>

                  {/* All matched ACs list */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">All {recTons} Ton Options — Lowest Band First</div>
                    {matchedACs.map((ac, i) => (
                      <div key={ac.id} className="flex items-center gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-blue-200 transition-all">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">#{i+1}</div>
                        <img src={ac.img} alt={ac.brand} className="w-14 h-14 object-cover rounded-xl border border-gray-200 flex-shrink-0" onError={e => { e.target.style.display='none'; }} />
                        <div className="flex-grow min-w-0">
                          <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{ac.brand}</div>
                          <div className="font-bold text-slate-900 text-sm truncate">{ac.model}</div>
                          <div className="font-black text-slate-800 text-sm">{formatPriceBand(ac.priceBand)}</div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <AffiliateLink merchant="amazon" query={ac.amazonQuery} trackingLabel={ac.model} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-3 rounded-xl transition-colors text-xs flex items-center gap-1">Amazon <ExternalLink size={10} /></AffiliateLink>
                          <AffiliateLink merchant="noon" query={ac.noonQuery} trackingLabel={ac.model} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-3 rounded-xl transition-colors text-xs flex items-center gap-1">Noon <ExternalLink size={10} /></AffiliateLink>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pro Tip */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap size={16} className="text-blue-600" /> UAE Expert Tip</h4>
                <p className="text-blue-800 text-sm leading-relaxed">For UAE summers, always choose a <strong>T3-rated compressor</strong> that operates at 52°C+ ambient temperatures. Pair with an <strong>inverter motor</strong> for up to 40% energy savings vs conventional units. Your {area}m² room is in the <strong>{recTons} Ton range</strong> — do not upsize beyond this as oversized ACs short-cycle and increase humidity in UAE homes.</p>
              </div>

              {/* Installation CTA */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-green-50 p-4 rounded-2xl text-green-600 flex-shrink-0"><Settings size={28} /></div>
                <div className="flex-grow text-center sm:text-left">
                  <h4 className="font-bold text-slate-900 mb-1">Need Professional Installation?</h4>
                  <p className="text-slate-500 text-sm">Our certified HVAC technicians cover Dubai, Abu Dhabi & Sharjah. Get a free installation quote.</p>
                </div>
                <button onClick={() => navigate('installation', {})} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-sm flex-shrink-0 text-sm flex items-center gap-2">Book Now <ChevronRight size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COOKIE CONSENT BANNER ---
const CookieConsentBanner = ({ onAccept, onDecline, navigate }) => (
  <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 md:p-5 pointer-events-none">
    <div className="max-w-5xl mx-auto bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 p-5 md:p-6 pointer-events-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-start gap-3 flex-grow min-w-0">
          <div className="bg-teal-500/20 p-2 rounded-xl flex-shrink-0 mt-0.5"><ShieldCheck size={18} className="text-teal-400" /></div>
          <div>
            <p className="font-bold text-white text-sm mb-1">Cookie Preferences</p>
            <p className="text-slate-300 text-xs leading-relaxed">
              We use cookies to enhance your experience, serve personalised ads via Google AdSense, and analyse traffic via Google Analytics. By clicking <strong>"Accept All"</strong>, you consent to our use of cookies as described in our{' '}
              <button onClick={() => { onDecline(); navigate('cookies'); }} className="text-teal-400 underline hover:text-teal-300">Cookies Policy</button>.
              Declining will limit personalised content and analytics.
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0 w-full md:w-auto">
          <button onClick={onDecline} className="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm">Decline</button>
          <button onClick={onAccept} className="flex-1 md:flex-none bg-teal-500 hover:bg-teal-400 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm">Accept All</button>
        </div>
      </div>
    </div>
  </div>
);

// --- TERMS OF SERVICE PAGE ---
const TermsOfServicePage = () => {
  useEffect(() => updateSEO('Terms of Service | CoolLivingUAE', 'Terms and conditions governing use of the CoolLivingUAE website and services.', 'terms'), []);
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-slate-100 p-4 rounded-2xl text-slate-700"><FileText size={32} /></div>
          <div>
            <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-400 font-bold mt-1">Last Updated: March 1, 2026 · Effective Immediately</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10">
          <p className="text-slate-700 text-sm leading-relaxed">Please read these Terms of Service carefully before using <strong>coollivinguae.com</strong> (the "Site") operated by CoolLivingUAE ("us", "we", or "our"). By accessing or using any part of the Site, you agree to be bound by these Terms. If you do not agree, you may not access the Site.</p>
        </div>
        <div className="space-y-10 text-slate-600 leading-relaxed">
          {[
            {
              num: 1, title: 'Use of the Site',
              content: `CoolLivingUAE is an informational and product review platform for cooling technology in the UAE. You may use this Site for lawful personal, non-commercial purposes only. You agree not to: (a) use automated tools, scrapers, or bots to extract content from the Site; (b) reproduce, republish, or redistribute our editorial content without prior written permission; (c) misrepresent yourself or the source of any content; (d) attempt to gain unauthorised access to any part of the Site's backend, database, or administrative functions; (e) engage in any activity that disrupts or interferes with the Site's performance or availability.`
            },
            {
              num: 2, title: 'Informational Purpose — Not Professional Advice',
              content: `All content on CoolLivingUAE — including product reviews, BTU calculators, DEWA savings estimates, installation guides, and energy efficiency ratings — is provided for general informational purposes only. It does not constitute professional HVAC engineering advice, electrical installation guidance, or energy auditing services. CoolLivingUAE expressly disclaims any liability for decisions made based on Site content. For installation of air conditioning systems, always engage a DEWA-approved or Municipality-licensed HVAC contractor. Always consult a qualified engineer for energy-critical or commercial applications.`
            },
            {
              num: 3, title: 'Affiliate Links & Commercial Relationships',
              content: `This Site contains affiliate links to Amazon.ae, Noon.ae, and other retailers. When you click these links and make a qualifying purchase, CoolLivingUAE may earn a commission at no extra cost to you. This commercial relationship does not influence our editorial assessments — products are evaluated independently of affiliate arrangements. All commercial relationships are disclosed in full in our Affiliate Disclosure page. CoolLivingUAE is not a party to any transaction between you and a third-party retailer; all purchases are governed by the retailer's own terms and conditions. Product prices, availability, and specifications on linked retailer pages may differ from those displayed on this Site due to market changes.`
            },
            {
              num: 4, title: 'Intellectual Property',
              content: `All original content on this Site — including but not limited to written reviews, product analyses, photography taken by our team, comparison tables, calculator tools, and graphical elements — is the intellectual property of CoolLivingUAE and is protected under applicable UAE copyright law (Federal Law No. 38 of 2021 on Intellectual Property). You may share links to our pages freely. You may quote up to 50 words with proper attribution and a link back to the original page. You may not reproduce entire articles, reviews, or tools without our express written consent. Product images sourced from manufacturers or retailers remain the property of their respective owners.`
            },
            {
              num: 5, title: 'User-Submitted Content (Installation Requests & Contact Forms)',
              content: `When you submit an installation request or contact form on this Site, you grant CoolLivingUAE a non-exclusive right to use the submitted information solely for the purpose of coordinating the requested service or responding to your enquiry. You warrant that any information submitted is accurate and does not infringe any third-party rights. CoolLivingUAE will not sell, publish, or commercially exploit user-submitted personal information. Data handling is governed by our Privacy Policy.`
            },
            {
              num: 6, title: 'Third-Party Links & Services',
              content: `This Site links to third-party websites including Amazon.ae, Noon.ae, Google, and various HVAC manufacturer sites. CoolLivingUAE does not control these external sites and accepts no responsibility for their content, privacy practices, security, or availability. The inclusion of a link does not constitute an endorsement beyond product review contexts explicitly stated. Your use of third-party sites is governed by those sites' own terms and policies.`
            },
            {
              num: 7, title: 'Disclaimers & Limitation of Liability',
              content: `The Site is provided on an "as is" and "as available" basis. To the fullest extent permitted by UAE law, CoolLivingUAE disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. CoolLivingUAE shall not be liable for: (a) any inaccuracy in product specifications or pricing that has changed since publication; (b) any damage to your property or person arising from following our installation guidance without professional supervision; (c) any indirect, consequential, or special damages arising from your use of this Site; (d) any loss of data or service interruption. Our total liability to you for any claim arising from use of this Site shall not exceed AED 500.`
            },
            {
              num: 8, title: 'AC Size Calculator — Important Limitation',
              content: `Our AC Room Size Calculator provides estimates based on standard UAE T3 climate formulas. These estimates are guides only. Actual AC requirements depend on factors our calculator cannot assess: insulation quality, window type and glazing, floor material, number of occupants, heat-generating appliances, building orientation, shading structures, and local duct conditions. CoolLivingUAE accepts no liability for incorrect AC sizing or energy outcomes resulting from reliance on calculator outputs alone. A qualified HVAC engineer's site assessment is the only reliable method for precise system sizing in critical applications.`
            },
            {
              num: 9, title: 'Governing Law & Dispute Resolution',
              content: `These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates and, where applicable, the laws of the Emirate of Dubai. Any dispute arising under or in connection with these Terms shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the Dubai Courts. Nothing in these Terms limits your statutory rights as a consumer under UAE Consumer Protection Law (Federal Decree-Law No. 5 of 2023).`
            },
            {
              num: 10, title: 'Changes to These Terms',
              content: `We reserve the right to update these Terms at any time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of the Site after changes constitutes acceptance of the revised Terms. We recommend bookmarking this page and checking periodically. For material changes, we will post a notice on the Site's homepage for 14 days.`
            },
            {
              num: 11, title: 'Contact',
              content: `For questions about these Terms of Service, please contact us at kennedyngufung@gmail.com. Subject your email: "[TERMS OF SERVICE]". We aim to respond to all legal queries within 5 UAE business days.`
            },
          ].map(({ num, title, content }) => (
            <section key={num}>
              <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-start gap-2">
                <span className="bg-slate-900 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">{num}</span>
                {title}
              </h2>
              <p className="leading-relaxed pl-9">{content}</p>
            </section>
          ))}
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
/**
 * Administrator sign-in.
 *
 * This replaces a shared access key that was compared in client-side code.
 * That key shipped in the production JavaScript bundle in plain text, so it
 * was readable by anyone who opened the page — and, because Firestore access
 * was never tied to it, it protected nothing but the visibility of the
 * dashboard UI.
 *
 * Authentication now runs through Firebase Authentication, and firestore.rules
 * grants lead and moderation access only to a signed-in user. Create admin
 * accounts in the Firebase console; there is deliberately no sign-up path.
 */
const AdminSecurityGate = ({ onVerify, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  /**
   * Sends a password reset email.
   *
   * Deliberately reports success even when the address has no account. Saying
   * "no such user" would turn this form into a way to discover which email
   * addresses have admin access.
   *
   * Resetting keeps the account's UID, which matters: the UID is listed in
   * firestore.rules, so deleting and recreating the account instead would
   * revoke the new account's access until the rules were redeployed.
   */
  const handleReset = async () => {
    setError('');
    setNotice('');

    const address = email.trim();
    if (!address) {
      setError('Enter your email address first, then choose Forgot password.');
      return;
    }

    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, address);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[admin] reset failed:', err.code);
      // Only a malformed address is worth reporting back.
      if (err?.code === 'auth/invalid-email') {
        setError('That does not look like a valid email address.');
        setBusy(false);
        return;
      }
    }
    setNotice(`If an account exists for ${address}, a reset link is on its way. Check your inbox and spam folder.`);
    setBusy(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onVerify();
    } catch (err) {
      // Firebase distinguishes "no such user" from "wrong password". Collapsing
      // both into one message avoids confirming which accounts exist.
      if (import.meta.env.DEV) console.error('[admin] sign-in failed:', err.code);
      setError('Sign-in failed. Check the email address and password.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  const fieldCls = 'w-full border-2 border-slate-200 rounded-xl p-4 outline-none focus:border-blue-600 transition-colors';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-6"><Lock size={32} /></div>
        <h2 className="text-2xl font-bold text-center mb-2">Administrator Sign-In</h2>
        <p className="text-center text-slate-400 text-xs mb-8">Authorised personnel only.</p>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="admin-email" className="block text-xs font-bold uppercase text-slate-400 mb-2">Email</label>
            <input id="admin-email" type="email" autoComplete="username" required autoFocus
              className={fieldCls} value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }} />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="admin-password" className="block text-xs font-bold uppercase text-slate-400">Password</label>
              <button type="button" onClick={handleReset} disabled={busy}
                className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50">
                Forgot password?
              </button>
            </div>
            <input id="admin-password" type="password" autoComplete="current-password" required
              className={fieldCls} value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} />
          </div>
          {error && <p className="text-red-500 text-center font-bold text-sm" role="alert">{error}</p>}
          {notice && (
            <p className="text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 text-center text-xs font-medium" role="status">
              {notice}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={busy}
              className="flex-1 bg-blue-600 disabled:opacity-60 text-white py-4 rounded-xl font-bold">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminDashboard = ({ products, setProducts, onLogout }) => {
  const [tab, setTab]               = useState('overview');
  const [leads, setLeads]           = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [formState, setFormState]   = useState(null);
  const [addForm, setAddForm]       = useState(EMPTY_PRODUCT_FORM);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError]     = useState('');
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [savingLead, setSavingLead] = useState('');

  // ── Review moderation ──────────────────────────────────────────────────
  // null = not loaded yet; an array = loaded (possibly empty).
  const [pendingReviews, setPendingReviews]       = useState(null);
  const [reviewsError, setReviewsError]           = useState('');
  const [savingReview, setSavingReview]           = useState('');
  const [reviewsReloadKey, setReviewsReloadKey]   = useState(0);
  const reviewsLoading = pendingReviews === null;

  // ── Fetch leads from Firebase ──────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'leads') return;
    setLeadsLoading(true);
    setLeadsError('');
    const q = query(collection(db, 'installationRequests'), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then(snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLeads(data);
      })
      .catch(() => setLeadsError('Could not load leads — check Firebase rules.'))
      .finally(() => setLeadsLoading(false));
  }, [tab]);

  const markLeadStatus = async (leadId, status) => {
    setSavingLead(leadId);
    try {
      await updateDoc(doc(db, 'installationRequests', leadId), { status, updatedAt: serverTimestamp() });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch { /* silent */ }
    setSavingLead('');
  };

  // ── Fetch reviews awaiting moderation ──────────────────────────────────
  // pendingReviews === null means "not loaded yet", which avoids a separate
  // loading flag and keeps every state update inside an async continuation
  // rather than firing synchronously as the effect runs.
  const loadPendingReviews = () => { setPendingReviews(null); setReviewsReloadKey(k => k + 1); };

  useEffect(() => {
    if (tab !== 'moderation') return undefined;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDocs(query(
          collection(db, REVIEWS_COLLECTION),
          where('approved', '==', false),
          orderBy('createdAt', 'desc'),
          fsLimit(50)
        ));
        if (cancelled) return;
        setPendingReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setReviewsError('');
      } catch {
        if (cancelled) return;
        setPendingReviews([]);
        setReviewsError('Could not load pending reviews — check Firebase rules.');
      }
    })();

    return () => { cancelled = true; };
  }, [tab, reviewsReloadKey]);

  const approveReview = async (reviewId) => {
    setSavingReview(reviewId);
    try {
      await updateDoc(doc(db, REVIEWS_COLLECTION, reviewId), { approved: true, approvedAt: serverTimestamp() });
      setPendingReviews(prev => (prev || []).filter(r => r.id !== reviewId));
    } catch {
      setReviewsError('Could not approve that review. Please try again.');
    }
    setSavingReview('');
  };

  const rejectReview = async (reviewId) => {
    if (!window.confirm('Permanently delete this review submission?')) return;
    setSavingReview(reviewId);
    try {
      await deleteDoc(doc(db, REVIEWS_COLLECTION, reviewId));
      setPendingReviews(prev => (prev || []).filter(r => r.id !== reviewId));
    } catch {
      setReviewsError('Could not delete that review. Please try again.');
    }
    setSavingReview('');
  };

  // ── Product helpers ────────────────────────────────────────────────────
  const startEdit   = (p) => {
    setEditingProduct(p.id);
    // Flatten the price band so it maps onto two numeric form inputs.
    setFormState({ ...p, priceMin: p.priceBand?.min ?? '', priceMax: p.priceBand?.max ?? '' });
    setTab('products');
  };
  const handleSave  = () => {
    const min = Number(formState.priceMin);
    const max = Number(formState.priceMax);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
      window.alert('Enter a valid price band — both values numeric, and the maximum at least the minimum.');
      return;
    }
    // priceMin/priceMax are form-only fields; strip them from the stored record.
    const rest = { ...formState };
    delete rest.priceMin;
    delete rest.priceMax;
    setProducts(products.map(p => p.id === editingProduct
      ? { ...rest, priceBand: { min, max }, editorialScore: Number(formState.editorialScore) || 0 }
      : p));
    setEditingProduct(null);
    setFormState(null);
  };
  const handleDelete = (id) => { if (window.confirm('Remove this product from the site?')) setProducts(products.filter(p => p.id !== id)); };
  const handleAdd   = () => {
    setAddError('');
    const min = Number(addForm.priceMin);
    const max = Number(addForm.priceMax);

    if (!addForm.title.trim() || !addForm.brand.trim()) {
      setAddError('Title and brand are required.');
      return;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
      setAddError('Enter a valid price band — both values numeric, and the maximum at least the minimum.');
      return;
    }
    if (!addForm.amazonQuery.trim()) {
      setAddError('Amazon search terms are required, otherwise the product cannot be linked.');
      return;
    }
    if (/^https?:/i.test(addForm.amazonQuery.trim())) {
      setAddError('Enter search TERMS, not a URL. Tagged URLs are built automatically.');
      return;
    }

    // priceMin/priceMax are form-only fields; strip them from the stored record.
    const rest = { ...addForm };
    delete rest.priceMin;
    delete rest.priceMax;
    setProducts([...products, {
      ...rest,
      id: `${addForm.category}-${Date.now()}`,
      priceBand: { min, max },
      editorialScore: Number(addForm.editorialScore) || 0,
    }]);
    setAddForm(EMPTY_PRODUCT_FORM);
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
  };

  // ── Derived data ────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p => {
    const matchCat  = catFilter === 'all' || p.category === catFilter;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const newLeads    = leads.filter(l => !l.status || l.status === 'new');
  const doneLeads   = leads.filter(l => l.status === 'done');
  const acCount     = products.filter(p => p.category === 'smart-acs').length;
  const purCount    = products.filter(p => p.category === 'air-purifiers').length;
  const thermoCount = products.filter(p => p.category === 'smart-thermostats').length;

  const tabs = [
    { id: 'overview', label: 'Overview',    icon: BarChart },
    { id: 'leads',    label: 'Leads',       icon: Mail,  badge: newLeads.length },
    { id: 'products', label: 'Products',    icon: LayoutList },
    { id: 'add',      label: 'Add Product', icon: Plus },
    { id: 'moderation', label: 'Reviews',   icon: MessageSquare, badge: pendingReviews?.length || 0 },
  ];

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 text-sm transition-all';
  const labelCls = 'block text-xs font-bold uppercase text-slate-400 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl"><ShieldCheck size={20} /></div>
            <div>
              <div className="font-black text-slate-900 text-sm">CoolLivingUAE</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Admin Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {newLeads.length > 0 && (
              <div className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                <Mail size={12} /> {newLeads.length} New Lead{newLeads.length > 1 ? 's' : ''}
              </div>
            )}
            <button onClick={onLogout} className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-red-100">
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
        {/* ── Tab Bar ── */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button key={id} onClick={() => { setTab(id); setEditingProduct(null); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all relative ${tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Icon size={15} /> {label}
              {badge > 0 && <span className="bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{badge}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ══════════════════════════════════════════
            TAB 1 — OVERVIEW
        ══════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">Good day 👋</h2>
              <p className="text-slate-400 text-sm">Here's what's happening with your site today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Products',    value: products.length,  icon: LayoutList, color: 'bg-blue-50 text-blue-600',   border: 'border-blue-100' },
                { label: 'New Leads',         value: newLeads.length,  icon: Mail,       color: 'bg-orange-50 text-orange-500', border: 'border-orange-100' },
                { label: 'Leads Closed',      value: doneLeads.length, icon: CheckCircle,color: 'bg-green-50 text-green-600',  border: 'border-green-100' },
                { label: 'Total Leads',       value: leads.length,     icon: BarChart,   color: 'bg-teal-50 text-teal-600',   border: 'border-teal-100' },
              ].map(({ label, value, icon: Icon, color, border }) => (
                <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-sm`}>
                  <div className={`${color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}><Icon size={20} /></div>
                  <div className="text-2xl font-black text-slate-900">{value}</div>
                  <div className="text-xs text-slate-400 font-bold mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Product Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-5 flex items-center gap-2"><LayoutList size={18} className="text-blue-600" /> Product Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: 'Smart ACs',         count: acCount,     total: products.length, color: 'bg-blue-500' },
                  { label: 'Air Purifiers',      count: purCount,    total: products.length, color: 'bg-teal-500' },
                  { label: 'Smart Thermostats',  count: thermoCount, total: products.length, color: 'bg-orange-400' },
                ].map(({ label, count, total, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-bold text-slate-700">{label}</span>
                      <span className="font-black text-slate-900">{count} products</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${(count/total)*100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2"><Zap size={18} className="text-blue-600" /> Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setTab('leads')} className="flex items-center gap-3 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-2xl p-4 transition-all text-left">
                  <Mail size={20} className="text-orange-500 flex-shrink-0" />
                  <div><div className="font-bold text-slate-900 text-sm">View Leads</div><div className="text-xs text-slate-400">{newLeads.length} awaiting action</div></div>
                </button>
                <button onClick={() => setTab('add')} className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-2xl p-4 transition-all text-left">
                  <Plus size={20} className="text-blue-600 flex-shrink-0" />
                  <div><div className="font-bold text-slate-900 text-sm">Add Product</div><div className="text-xs text-slate-400">Publish a new review</div></div>
                </button>
                <button onClick={() => setTab('products')} className="flex items-center gap-3 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-2xl p-4 transition-all text-left">
                  <Edit size={20} className="text-teal-600 flex-shrink-0" />
                  <div><div className="font-bold text-slate-900 text-sm">Manage Products</div><div className="text-xs text-slate-400">Edit or remove listings</div></div>
                </button>
              </div>
            </div>

            {/* Recent Leads Preview */}
            {leads.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 flex items-center gap-2"><Mail size={18} className="text-blue-600" /> Recent Leads</h3>
                  <button onClick={() => setTab('leads')} className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {leads.slice(0, 4).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{lead.name || 'Anonymous'}</div>
                        <div className="text-xs text-slate-400">{lead.location || lead.city || 'UAE'} · {lead.acType || 'Installation Request'}</div>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${!lead.status || lead.status === 'new' ? 'bg-orange-100 text-orange-700' : lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {lead.status || 'NEW'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 2 — LEADS
        ══════════════════════════════════════════ */}
        {tab === 'leads' && (
          <div className="animate-in fade-in space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Installation Leads</h2>
                <p className="text-slate-400 text-sm mt-0.5">Requests submitted via the installation form</p>
              </div>
              <div className="flex gap-3">
                <div className="bg-orange-100 text-orange-700 text-xs font-black px-4 py-2 rounded-full">{newLeads.length} New</div>
                <div className="bg-green-100 text-green-700 text-xs font-black px-4 py-2 rounded-full">{doneLeads.length} Closed</div>
              </div>
            </div>

            {leadsLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Loading leads from Firebase…</p>
              </div>
            )}

            {leadsError && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-red-700 font-bold text-sm">{leadsError}</div>
            )}

            {!leadsLoading && !leadsError && leads.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-16 text-center">
                <Mail size={40} className="text-slate-300 mx-auto mb-4" />
                <h3 className="font-bold text-slate-600 mb-1">No leads yet</h3>
                <p className="text-slate-400 text-sm">Installation requests will appear here as visitors submit the form.</p>
              </div>
            )}

            {!leadsLoading && leads.map(lead => (
              <div key={lead.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${!lead.status || lead.status === 'new' ? 'border-orange-200' : lead.status === 'contacted' ? 'border-blue-200' : 'border-green-200'}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 w-11 h-11 rounded-full flex items-center justify-center text-blue-600 font-black text-lg flex-shrink-0">
                        {(lead.name || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{lead.name || 'Anonymous'}</div>
                        <div className="text-xs text-slate-400 font-bold">{lead.createdAt?.toDate?.()?.toLocaleDateString('en-AE', { day:'numeric', month:'short', year:'numeric' }) || 'Recently'}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full flex-shrink-0 ${!lead.status || lead.status === 'new' ? 'bg-orange-100 text-orange-700' : lead.status === 'contacted' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {(lead.status || 'NEW').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { icon: MapPin,       label: 'Location',   val: lead.location || lead.city || '—' },
                      { icon: Mail,          label: 'Contact',    val: lead.phone || lead.email || '—' },
                      { icon: Thermometer,  label: 'AC Type',    val: lead.acType || lead.productTitle || '—' },
                      { icon: Calendar,     label: 'Urgency',    val: lead.urgency || lead.timeline || 'Not specified' },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">{label}</div>
                        <div className="text-sm font-bold text-slate-800 truncate">{val}</div>
                      </div>
                    ))}
                  </div>

                  {lead.message && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-4">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Message</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{lead.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => markLeadStatus(lead.id, 'new')} disabled={savingLead === lead.id}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${!lead.status || lead.status === 'new' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-500 border-orange-200 hover:bg-orange-50'}`}>
                      New
                    </button>
                    <button onClick={() => markLeadStatus(lead.id, 'contacted')} disabled={savingLead === lead.id}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${lead.status === 'contacted' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'}`}>
                      Contacted
                    </button>
                    <button onClick={() => markLeadStatus(lead.id, 'done')} disabled={savingLead === lead.id}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-all ${lead.status === 'done' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}`}>
                      Closed ✓
                    </button>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="px-4 py-2.5 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1">
                        <Mail size={13} /> Email
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="px-4 py-2.5 rounded-xl text-xs font-black border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all">
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 3 — PRODUCTS (Edit / Delete)
        ══════════════════════════════════════════ */}
        {tab === 'products' && !editingProduct && (
          <div className="animate-in fade-in space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Product Manager</h2>
                <p className="text-slate-400 text-sm mt-0.5">{filteredProducts.length} of {products.length} products shown</p>
              </div>
              <button onClick={() => setTab('add')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-all">
                <Plus size={16} /> Add New
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Search by name or brand…" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500" />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 cursor-pointer">
                <option value="all">All Categories</option>
                <option value="smart-acs">Smart ACs</option>
                <option value="air-purifiers">Air Purifiers</option>
                <option value="smart-thermostats">Smart Thermostats</option>
              </select>
            </div>

            {/* Product List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="p-5">Product</th>
                    <th className="p-5 hidden md:table-cell">Category</th>
                    <th className="p-5 hidden sm:table-cell">Price</th>
                    <th className="p-5 hidden md:table-cell">Rating</th>
                    <th className="p-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, i) => (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt={p.brand} className="w-12 h-12 object-cover rounded-xl border border-slate-100 flex-shrink-0 bg-slate-50"
                            onError={e => { e.target.src = 'https://via.placeholder.com/48x48?text=AC'; }} />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate max-w-[180px] md:max-w-xs">{p.title}</div>
                            <div className="text-xs text-blue-500 font-bold">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 hidden md:table-cell">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${p.category === 'smart-acs' ? 'bg-blue-100 text-blue-700' : p.category === 'air-purifiers' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700'}`}>
                          {p.category === 'smart-acs' ? 'Smart AC' : p.category === 'air-purifiers' ? 'Purifier' : 'Thermostat'}
                        </span>
                      </td>
                      <td className="p-5 hidden sm:table-cell font-black text-slate-900 text-sm">{formatPriceBand(p.priceBand)}</td>
                      <td className="p-5 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-500">★ {p.editorialScore}</div>
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => startEdit(p)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-lg transition-colors" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="bg-red-50 hover:bg-red-100 text-red-500 p-2 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="p-16 text-center text-slate-400 font-bold">No products match your search.</div>
              )}
            </div>
          </div>
        )}

        {/* ── Edit Product Form ── */}
        {tab === 'products' && editingProduct && formState && (
          <div className="animate-in slide-in-from-bottom-4 space-y-6">
            <button onClick={() => setEditingProduct(null)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-blue-600 transition-colors text-sm">
              <ArrowLeft size={16} /> Back to Products
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><Edit size={20} className="text-blue-600" /> Edit Product</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls}>Product Title</label>
                  <input className={inputCls} value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Brand</label>
                  <input className={inputCls} value={formState.brand || ''} onChange={e => setFormState({...formState, brand: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select className={inputCls} value={formState.category} onChange={e => setFormState({...formState, category: e.target.value})}>
                    <option value="smart-acs">Smart ACs</option>
                    <option value="air-purifiers">Air Purifiers</option>
                    <option value="smart-thermostats">Smart Thermostats</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price Band — Minimum (AED)</label>
                  <input type="number" min="1" className={inputCls} value={formState.priceMin} onChange={e => setFormState({...formState, priceMin: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Price Band — Maximum (AED)</label>
                  <input type="number" min="1" className={inputCls} value={formState.priceMax} onChange={e => setFormState({...formState, priceMax: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Editorial Score (0–5)</label>
                  <input type="number" min="0" max="5" step="0.1" className={inputCls} value={formState.editorialScore} onChange={e => setFormState({...formState, editorialScore: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Tonnage (ACs only)</label>
                  <input className={inputCls} placeholder="e.g. 1.5" value={formState.tons || ''} onChange={e => setFormState({...formState, tons: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Image URL</label>
                  <input className={inputCls} value={formState.image || ''} onChange={e => setFormState({...formState, image: e.target.value})} />
                  {formState.image && <img src={formState.image} alt="preview" className="mt-2 h-24 w-auto rounded-xl border border-slate-100 object-cover" onError={e => e.target.style.display='none'} />}
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Amazon.ae Search Terms</label>
                  <input className={inputCls} placeholder="e.g. LG DualCool 1.5 ton inverter split AC UAE" value={formState.amazonQuery || ''} onChange={e => setFormState({...formState, amazonQuery: e.target.value})} />
                  <p className="text-[10px] text-slate-400 mt-1">Search terms, not a URL. The tagged link is built automatically — avoid model numbers, which produce empty result pages.</p>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Review Description</label>
                  <textarea rows={6} className={`${inputCls} resize-none`} value={formState.description || ''} onChange={e => setFormState({...formState, description: e.target.value})} />
                  <div className="text-right text-[10px] text-slate-400 mt-1">{formState.description?.length || 0} characters</div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Save size={16} /> Save Changes
                </button>
                <button onClick={() => setEditingProduct(null)} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB 4 — ADD PRODUCT
        ══════════════════════════════════════════ */}
        {tab === 'add' && (
          <div className="animate-in fade-in space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Add New Product</h2>
              <p className="text-slate-400 text-sm mt-0.5">Publish a new review to the site instantly</p>
            </div>

            {addSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3 text-green-800 font-bold text-sm">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" /> Product added successfully! It's now live on the site.
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelCls}>Product Title <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="e.g. LG DualCool 1.5 Ton T3 Inverter Split AC" value={addForm.title} onChange={e => setAddForm({...addForm, title: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Brand <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="e.g. LG" value={addForm.brand} onChange={e => setAddForm({...addForm, brand: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Category <span className="text-red-400">*</span></label>
                  <select className={inputCls} value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})}>
                    <option value="smart-acs">Smart ACs</option>
                    <option value="air-purifiers">Air Purifiers</option>
                    <option value="smart-thermostats">Smart Thermostats</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Price Band — Minimum (AED) <span className="text-red-400">*</span></label>
                  <input type="number" min="1" className={inputCls} placeholder="e.g. 1750" value={addForm.priceMin} onChange={e => setAddForm({...addForm, priceMin: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Price Band — Maximum (AED) <span className="text-red-400">*</span></label>
                  <input type="number" min="1" className={inputCls} placeholder="e.g. 2200" value={addForm.priceMax} onChange={e => setAddForm({...addForm, priceMax: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Editorial Score (0–5)</label>
                  <input type="number" min="0" max="5" step="0.1" className={inputCls} placeholder="e.g. 4.7" value={addForm.editorialScore} onChange={e => setAddForm({...addForm, editorialScore: e.target.value})} />
                </div>
                <div>
                  <label className={labelCls}>Tonnage (ACs only)</label>
                  <input className={inputCls} placeholder="e.g. 1.5" value={addForm.tons} onChange={e => setAddForm({...addForm, tons: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Product Image URL</label>
                  <input className={inputCls} placeholder="https://..." value={addForm.image} onChange={e => setAddForm({...addForm, image: e.target.value})} />
                  {addForm.image && <img src={addForm.image} alt="preview" className="mt-2 h-24 w-auto rounded-xl border border-slate-100 object-cover" onError={e => e.target.style.display='none'} />}
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Amazon.ae Search Terms <span className="text-red-400">*</span></label>
                  <input className={inputCls} placeholder="e.g. LG DualCool 1.5 ton inverter split AC UAE" value={addForm.amazonQuery} onChange={e => setAddForm({...addForm, amazonQuery: e.target.value})} />
                  <p className="text-[10px] text-slate-400 mt-1">Search terms, not a URL. The tagged link is built automatically — avoid model numbers, which produce empty result pages.</p>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Review Description <span className="text-red-400">*</span></label>
                  <textarea rows={7} className={`${inputCls} resize-none`} placeholder="Specifications, certifications, UAE service and warranty terms, and your verdict. Do not claim testing that was not carried out." value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} />
                  <div className="text-right text-[10px] text-slate-400 mt-1">{addForm.description.length} characters</div>
                </div>
              </div>
              {addError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-bold" role="alert">{addError}</div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={handleAdd} disabled={!addForm.title || !addForm.priceMin || !addForm.priceMax}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm">
                  <Plus size={16} /> Publish Product
                </button>
                <button onClick={() => { setAddForm(EMPTY_PRODUCT_FORM); setAddError(''); }}
                  className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all">Clear</button>
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEW MODERATION ─────────────────────────────────────────── */}
        {tab === 'moderation' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="font-black text-slate-900 text-lg">Reviews Awaiting Moderation</h2>
                <p className="text-slate-500 text-xs mt-1">
                  Nothing appears on the public site until you approve it. Reject anything that is
                  promotional, abusive, or cannot be attributed to genuine experience.
                </p>
              </div>
              <button onClick={loadPendingReviews} disabled={reviewsLoading}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                {reviewsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {reviewsError && (
              <div className="m-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-bold" role="alert">
                {reviewsError}
              </div>
            )}

            {reviewsLoading ? (
              <div className="p-16 text-center text-slate-400 font-bold">Loading…</div>
            ) : pendingReviews.length === 0 ? (
              <div className="p-16 text-center">
                <CheckCircle size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-bold">Nothing waiting for review.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingReviews.map(r => (
                  <div key={r.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{r.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin size={10} /> {[r.area, r.emirate].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-orange-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={13} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? '' : 'text-slate-200'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed mb-4 bg-slate-50 rounded-xl p-4 border border-slate-100">{r.text}</p>
                    <div className="flex gap-2">
                      <button onClick={() => approveReview(r.id)} disabled={savingReview === r.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2">
                        <CheckCircle size={14} /> {savingReview === r.id ? 'Saving…' : 'Approve & Publish'}
                      </button>
                      <button onClick={() => rejectReview(r.id)} disabled={savingReview === r.id}
                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2">
                        <Trash2 size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
        <p className="text-slate-600 leading-relaxed">CoolLivingUAE exists to demystify cooling technology in the Gulf. With summer temperatures regularly exceeding 50°C, a standard appliance review isn't enough — a unit that performs well in a temperate market can lose capacity or trip entirely here. We assess every product against <strong>T3 Climate Standards</strong> (high ambient heat certification) so readers can tell the difference before they buy.</p>
        <p className="text-slate-600 leading-relaxed">Our reviews are built from manufacturer specifications, independent certifications, published research, and the UAE service and warranty terms each brand actually offers. We explain energy consumption in DEWA terms, filtration in HEPA-standard terms, and smart home compatibility in practical terms — and we are explicit about where each claim comes from.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <ShieldCheck className="text-teal-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">T3 &amp; ESMA Focused</h4>
            <p className="text-[10px] text-slate-500">We check hot-climate certification and UAE energy labelling on every unit.</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <Activity className="text-blue-500 mb-2" size={24} />
            <h4 className="font-bold text-slate-900 text-sm">Transparent Sourcing</h4>
            <p className="text-[10px] text-slate-500">We say where a claim comes from, and never claim testing we have not done.</p>
          </div>
        </div>
      </div>
      <div className="aspect-video bg-gradient-to-br from-blue-600 to-teal-500 rounded-3xl flex flex-col items-center justify-center p-8 text-white shadow-2xl overflow-hidden relative">
        <div className="text-5xl font-black mb-2 tracking-tighter">{initialProducts.length}</div>
        <div className="text-sm font-bold opacity-80 uppercase tracking-widest text-center">Products Reviewed Across 3 Categories</div>
        <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12"><Wind size={250} /></div>
      </div>
    </div>
  </section>
);

// --- MAIN APP ---
export default function App() {
  // Initial route comes from the URL, so deep links and refreshes land on the
  // right page instead of always rendering the homepage.
  const [route, setRoute] = useState(() =>
    typeof window === 'undefined' ? { path: '/', params: {} } : pathToRoute(window.location.pathname)
  );
  const [showSecurityGate, setShowSecurityGate] = useState(false);
  const [products, setProducts] = useState(initialProducts);

  // Back and forward buttons. Without this the browser changes the URL but the
  // app keeps rendering whatever it rendered last.
  useEffect(() => {
    const onPopState = () => setRoute(pathToRoute(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Firebase owns the session, so the UI follows the auth state rather than a
  // local flag. This also restores the dashboard across a page reload and
  // clears it if the token is revoked server-side.
  //
  // Three states, not two: 'checking' matters because onAuthStateChanged fires
  // asynchronously. Collapsing it into "not signed in" renders a blank admin
  // page in the window between a successful sign-in and the listener firing.
  const [authState, setAuthState] = useState('checking'); // checking | in | out
  useEffect(() => onAuthStateChanged(auth, user => setAuthState(user ? 'in' : 'out')), []);
  const isAdminAuthenticated = authState === 'in';

  // --- Cookie Consent ---
  const [cookieConsent, setCookieConsent] = useState(() => {
    try { return localStorage.getItem('clua_cookie_consent') || null; } catch { return null; }
  });
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  useEffect(() => {
    if (!cookieConsent) { const t = setTimeout(() => setShowCookieBanner(true), 1200); return () => clearTimeout(t); }
  }, [cookieConsent]);
  const handleCookieAccept = () => {
    try { localStorage.setItem('clua_cookie_consent', 'accepted'); } catch {}
    setCookieConsent('accepted'); setShowCookieBanner(false);
    setAnalyticsConsent(true);
  };
  const handleCookieDecline = () => {
    try { localStorage.setItem('clua_cookie_consent', 'declined'); } catch {}
    setCookieConsent('declined'); setShowCookieBanner(false);
    setAnalyticsConsent(false);
  };

  // Load GA4 once, honouring any previously stored choice. Reads the stored
  // value directly rather than the state variable, because this must run
  // exactly once on mount and must not re-run when consent later changes —
  // consent updates are pushed through setAnalyticsConsent instead.
  // No-ops entirely when VITE_GA4_ID is unset: nothing requested, no cookie.
  useEffect(() => {
    let stored = null;
    try { stored = localStorage.getItem('clua_cookie_consent'); } catch { /* storage unavailable */ }
    initAnalytics(stored);
  }, []);

  // GA4 only reports a page view when it loads. Without this, every in-app
  // navigation would go unrecorded and the homepage would look like the only
  // page anyone ever visits.
  useEffect(() => {
    const timer = setTimeout(() => {
      trackPageView(window.location.pathname, document.title);
    }, 0); // let the page's own updateSEO() set the title first
    return () => clearTimeout(timer);
  }, [route]);

  /**
   * Navigates and writes a real URL into the browser history.
   *
   * The { path, params } signature is unchanged, so every existing call site
   * keeps working; the difference is that the address bar now reflects the
   * page and the back button behaves as visitors expect.
   */
  const navigate = (path, params = {}) => {
    const url = routeToPath(path, params);
    if (url !== window.location.pathname) {
      window.history.pushState({}, '', url);
    }
    window.scrollTo(0, 0);
    setRoute({ path, params });
  };
  const handleLogout = async () => {
    // Clear the Firebase session, not merely the local flag — otherwise the
    // token stays valid and Firestore access continues.
    // onAuthStateChanged flips authState to 'out', so there is no local flag
    // to clear here — and nothing that could disagree with Firebase.
    try { await signOut(auth); } catch (error) { if (import.meta.env.DEV) console.error(error); }
    navigate('/');
  };

  const renderPage = () => {
    switch (route.path) {
      case '/': return <HomePage products={products} categories={initialCategories} navigate={navigate} />;
      case 'category': return <CategoryPage categoryId={route.params.id} categories={initialCategories} products={products} navigate={navigate} />;
      case 'product': return <ProductReviewPage productId={route.params.id} products={products} navigate={navigate} />;
      case 'guides': return <GuidePage />;
      case 'reviews': return <ReviewsPage />;
      case 'contact': return <ContactPage />;
      case 'privacy': return <PrivacyPolicyPage />;
      case 'cookies': return <CookiesPolicyPage />;
      case 'affiliate': return <AffiliateDisclosurePage />;
      case 'security': return <SecurityPage />;
      case 'terms': return <TermsOfServicePage />;
      case 'calculator': return <ACCalculatorPage navigate={navigate} />;
      case 'installation': return <InstallationPage productId={route.params.id} products={products} navigate={navigate} />;
      case 'admin':
        // Never index the dashboard, whatever state it is in.
        updateSEO('Administrator', 'Restricted area.', '', '', true);
        if (authState === 'checking') {
          return <div className="p-20 text-center text-slate-400 font-bold">Verifying session…</div>;
        }
        if (authState === 'out') {
          // Signed out — offer the way back in rather than rendering nothing.
          return (
            <div className="p-20 text-center">
              <Lock size={32} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-bold mb-6">You are not signed in.</p>
              <button onClick={() => setShowSecurityGate(true)} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all">
                Sign In
              </button>
            </div>
          );
        }
        return <AdminDashboard products={products} setProducts={setProducts} onLogout={handleLogout} />;
      default:
        // A SPA cannot return HTTP 404 for an unknown URL — the server already
        // sent 200 with index.html. Marking it noindex is what stops Google
        // recording these as thin, indexable "soft 404" pages.
        updateSEO('Page Not Found', 'This page does not exist.', '', '', true);
        return (
          <div className="p-20 text-center">
            <h1 className="text-3xl font-black text-slate-900 mb-3">404 — Page Not Found</h1>
            <p className="text-slate-500 mb-8">That page does not exist, or has moved.</p>
            <button onClick={() => navigate('/')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-all">
              Back to Home
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {showSecurityGate && <AdminSecurityGate onVerify={() => { setShowSecurityGate(false); navigate('admin'); }} onCancel={() => setShowSecurityGate(false)} />}
      {showCookieBanner && <CookieConsentBanner onAccept={handleCookieAccept} onDecline={handleCookieDecline} navigate={navigate} />}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-gradient-to-br from-blue-600 to-teal-500 text-white p-2 rounded-lg"><Wind size={24} /></div>
            <span className="font-extrabold text-2xl text-gray-900 tracking-tight">CoolLiving<span className="text-blue-600">UAE</span></span>
          </div>
          <nav className="hidden md:flex space-x-8 font-bold text-gray-600 text-sm">
            <span onClick={() => navigate('/')} className={`cursor-pointer hover:text-blue-600 ${route.path === '/' ? 'text-blue-600' : ''}`}>Home</span>
            <span onClick={() => navigate('category', {id: 'smart-acs'})} className={`cursor-pointer hover:text-blue-600 ${route.params?.id === 'smart-acs' ? 'text-blue-600' : ''}`}>AC Reviews</span>
            <span onClick={() => navigate('calculator')} className={`cursor-pointer hover:text-blue-600 ${route.path === 'calculator' ? 'text-blue-600' : ''}`}>AC Calculator</span>
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
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Legal</div><ul className="text-xs space-y-2"><li className="hover:text-white cursor-pointer" onClick={() => navigate('privacy')}>Privacy Policy</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('cookies')}>Cookies Policy</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('terms')}>Terms of Service</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('affiliate')}>Affiliate Disclosure</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('security')}>Security</li></ul></div>
            <div><div className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Tools</div><ul className="text-xs space-y-2"><li className="hover:text-white cursor-pointer" onClick={() => navigate('calculator')}>AC Size Calculator</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('guides')}>DEWA Saving Guide</li><li className="hover:text-white cursor-pointer" onClick={() => navigate('reviews')}>Resident Reviews</li></ul></div>
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