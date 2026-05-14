import React, { useState, useEffect } from 'react';
import { Calculator, Thermometer, Home, Info, ShoppingCart, Sun, Wind, CheckCircle, Zap, Shield, Snowflake, Layers, HelpCircle, ThermometerSnowflake } from 'lucide-react';

const BTUCalculator = () => {
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('9'); 
  const [exposure, setExposure] = useState('standard');
  const [result, setResult] = useState(null);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    document.title = "UAE AC BTU & Tonnage Calculator | CoolLiving";
    
   const meta = document.createElement("meta");
meta.name = "description";
meta.content = "...";
meta.id = "btu-meta";
document.head.appendChild(meta);

return () => {
  const existingMeta = document.getElementById("btu-meta");
  if (existingMeta) document.head.removeChild(existingMeta);
};
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "CoolLiving UAE BTU & AC Tonnage Calculator",
      "operatingSystem": "All",
      "applicationCategory": "EducationalApplication",
      "description": "Professional BTU and AC Tonnage calculator optimized for the UAE climate. Accounts for high ceiling heights and T3 compressors.",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "AED" },
      "author": { "@type": "Organization", "name": "CoolLiving UAE" }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'json-ld-schema';
    script.innerHTML = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById('json-ld-schema');
      if (existingScript) document.head.removeChild(existingScript);
    };
  }, []);

  const calculateBTU = () => {
    const w = parseFloat(width);
    const l = parseFloat(length);
    const h = parseFloat(height);

    if (!w || !l || w <= 0 || l <= 0) {
      setResult(null);
      return;
    }

    const area = w * l;
    const volume = area * h;
    
    // UAE BASELINE: Volume-based calculation (4 BTU per cubic foot base for tropical)
    let btu = volume * 4.5; // Adjusted higher for 2026 climate trends
    if (exposure === 'sunny') btu *= 1.25;
    if (exposure === 'kitchen') btu += 4000;
    
    let tonnage = "1.0 Ton";
    let color = "text-blue-500";

    if (btu <= 8000) {
      tonnage = "0.75 Ton";
      color = "text-teal-500";
    } else if (btu <= 13500) {
      tonnage = "1.0 Ton";
      color = "text-blue-500";
    } else if (btu <= 19500) {
      tonnage = "1.5 Ton";
      color = "text-cyan-600";
    } else if (btu <= 25500) {
      tonnage = "2.0 Ton";
      color = "text-blue-700";
    } else if (btu <= 32000) {
      tonnage = "2.5 Ton";
      color = "text-indigo-800";
    } else {
      tonnage = "3.0 Ton+";
      color = "text-red-600";
    }

    setResult({ 
      btu: Math.round(btu), 
      tonnage, 
      area: Math.round(area), 
      volume: Math.round(volume), 
      color 
    });
    
    setAnimate(true);
    setTimeout(() => setAnimate(false), 500);
  };

  return (
    <div className="bg-slate-50 py-16 px-4 md:px-8">
      <div className="w-full max-w-2xl mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
          <Wind className="text-blue-500" /> CoolLiving UAE
        </h1>
        <p className="text-slate-500 mt-2 tracking-tight">Real-Time Climate Optimized AC Sizing for 2026</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6 text-blue-600 font-bold">
            <Calculator size={20} />
            <h2>Room Dimensions</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Width (ft)</label>
                <input 
                  type="number" 
                  value={width} 
                  onChange={(e) => setWidth(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all" 
                  placeholder="15" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Length (ft)</label>
                <input 
                  type="number" 
                  value={length} 
                  onChange={(e) => setLength(e.target.value)} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-all" 
                  placeholder="20" 
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Layers size={12} /> Ceiling Height (ft)</label>
              <select value={height} onChange={(e) => setHeight(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg appearance-none outline-none focus:border-blue-500">
                <option value="8">8 ft (Standard Apartment)</option>
                <option value="9">9 ft (Standard Villa)</option>
                <option value="10">10 ft (High Ceiling)</option>
                <option value="12">12 ft (Luxury Loft)</option>
                <option value="15">15+ ft (Double Height Hall)</option>
              </select>
            </div>
            <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Environment Load</label>
                <div className="grid grid-cols-1 gap-2">
                  {['standard', 'sunny', 'kitchen'].map(id => (
                      <button key={id} onClick={() => setExposure(id)} className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${exposure === id ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-slate-100 hover:border-slate-300 text-slate-600'}`}>
                          {id.charAt(0).toUpperCase() + id.slice(1)} Room {exposure === id && '✓'}
                      </button>
                  ))}
                </div>
            </div>
            <button onClick={calculateBTU} disabled={!width || !length || parseFloat(width) <= 0 || parseFloat(length) <= 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl mt-4 shadow-lg active:scale-95 transition-all">
              Calculate AC Size
            </button>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center transition-all min-h-[400px] ${animate ? 'scale-105 border-blue-400' : ''}`}>
          {!result ? (
            <div className="text-center py-12 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} className="text-slate-300" />
              </div>
              <p className="font-medium text-slate-600">Waiting for Dimensions</p>
              <p className="text-xs mt-1 italic">Please enter width and length to calculate.</p>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Recommended Capacity</p>
              <h3 className={`text-6xl font-black ${result.color}`}>{result.tonnage}</h3>
              <div className="inline-block bg-slate-100 px-6 py-2 rounded-full text-slate-700 text-sm font-bold">
                {result.btu.toLocaleString()} BTU / hr
              </div>
              <div className="pt-4 border-t border-slate-100 mt-4">
                <a 
                  href={`https://www.amazon.ae/s?k=${result.tonnage}+split+ac+inverter+t3&tag=coolliving-21`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full bg-[#FF9900] hover:bg-[#E68A00] text-black font-extrabold py-4 rounded-xl shadow-md transition-colors"
                >
                  <ShoppingCart size={20} /> Shop {result.tonnage} ACs on Amazon
                </a>
                <p className="text-[10px] text-slate-400 mt-3 italic underline">Verify T3 Compressor rating before buying</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COMPREHENSIVE GUIDE SECTION (500-700 Words) */}
      <div className="w-full max-w-4xl space-y-12 text-slate-800 leading-relaxed px-4 md:px-0 border-t pt-16">
        
        <header className="text-center space-y-4">
          <h2 className="text-4xl font-black text-slate-900">The Ultimate Guide to BTU: Why It’s Your Most Important AC Metric</h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto rounded-full"></div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-blue-600">
            <HelpCircle size={28} />
            <h3 className="text-2xl font-bold">What Exactly is a BTU?</h3>
          </div>
          <p>
            BTU stands for <strong>British Thermal Unit</strong>. Despite the name, it is the global standard for measuring energy in the heating and cooling industry. Technically, one BTU is the amount of heat required to raise the temperature of one pound of water by exactly one degree Fahrenheit. 
          </p>
          <p>
            When it comes to your air conditioner, BTU refers to <strong>cooling capacity</strong>. It indicates how much thermal energy (heat) the AC unit can remove from a room in one hour. The higher the BTU rating, the more heat the unit can extract. However, higher is not always "better"—efficiency depends on matching the BTU perfectly to your room's specific volume and environment.
          </p>
        </section>

        <section className="space-y-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 text-orange-600">
            <ThermometerSnowflake size={28} />
            <h3 className="text-2xl font-bold">The "Tonnage" vs. "BTU" Relationship</h3>
          </div>
          <p>
            In the UAE market, you will often hear sales experts refer to "Tons" (e.g., a 1.5-ton AC) rather than BTUs. Here is the conversion logic used by professionals:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm text-center">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">12,000 BTU = 1.0 Ton</div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">18,000 BTU = 1.5 Ton</div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">24,000 BTU = 2.0 Ton</div>
          </div>
          <p>
            Understanding this conversion is vital for comparing prices across different brands. A unit marketed as "High Efficiency" might have a slightly lower BTU output for the same tonnage, meaning it will struggle during a Dubai heatwave.
          </p>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 text-red-600">
            <Sun size={28} />
            <h3 className="text-2xl font-bold">The UAE Variable: Why Local Data Matters</h3>
          </div>
          <p>
            Most BTU calculators found online are designed for European or North American climates. Using those formulas in the UAE is a recipe for disaster. In temperate climates, the ambient outside temperature rarely exceeds 32°C. In contrast, UAE residents face ambient temperatures of 45°C to 50°C for nearly four months of the year.
          </p>
          <p>
            Standard calculators assume a temperature differential of about 10-15 degrees. In Dubai, your AC must bridge a gap of nearly 25 degrees (from 48°C outside to 23°C inside). This is why our <strong>Real-Time UAE Calculator</strong> applies a "Tropical Load Multiplier." 
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <li className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <p className="text-sm"><strong>The Sun-Facing Load:</strong> If your room has a West-facing window, the afternoon sun adds roughly 25% more heat through glass radiation.</p>
            </li>
            <li className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <p className="text-sm"><strong>The Ceiling Height Factor:</strong> Modern UAE villas often feature 10ft+ ceilings. Since heat rises, a higher ceiling means a massive volume of warm air is trapped above your head, requiring more BTUs to circulate and cool.</p>
            </li>
          </ul>
        </section>

        <section className="space-y-6 bg-blue-900 text-white p-10 rounded-3xl shadow-xl">
          <h3 className="text-2xl font-bold flex items-center gap-3"><Shield /> The T3 Compressor Warning</h3>
          <p className="text-blue-100">
            A correct BTU calculation is only half the battle. In the UAE, you must ensure your unit has a <strong>T3 Compressor</strong>.
          </p>
          <p className="text-blue-100">
            T1 compressors are designed for temperatures up to 43°C. When the Dubai summer hits 48°C, T1 compressors overheat and "trip" (shut down), leaving you without cooling. T3 compressors are specifically engineered to operate efficiently even when ambient temperatures reach 52°C.
          </p>
        </section>

        <section className="space-y-6 border-l-4 border-emerald-500 pl-6">
          <h3 className="text-2xl font-bold text-slate-900">Summary: The "Perfect Sizing" Secret</h3>
          <p>
            Don't just buy the biggest unit possible. An oversized AC will cool the room so quickly that it shuts off before it can remove the moisture from the air, leaving the room feeling "clammy" or humid. Use this tool to get the <strong>Exact Tonnage</strong>. 
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <span className="bg-emerald-100 text-emerald-800 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest italic">2026 Climate Updated</span>
            <span className="bg-slate-200 text-slate-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest italic">ESMA Standards</span>
          </div>
        </section>
      </div>

      
    </div>
  );
};

export default BTUCalculator;