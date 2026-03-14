import { useState, useEffect } from 'react';
import { ArrowDownUp, DollarSign, Ruler } from 'lucide-react';

type ConversionMode = 'currency' | 'hectares' | 'sqmeters';

interface ConversionConfig {
  title: string;
  subtitle: string;
  fromUnit: string;
  fromLabel: string;
  toUnit: string;
  toLabel: string;
  rate: number;
  rateText: string;
  decimals: number;
}

export default function App() {
  const [topValue, setTopValue]       = useState('');
  const [bottomValue, setBottomValue] = useState('');
  const [lastEdited, setLastEdited]   = useState<'top' | 'bottom'>('top');
  const [mode, setMode] = useState<ConversionMode>('currency');

  const getPhilippinesTime = () => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' });
    const day  = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Manila' }).toUpperCase();
    const date = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Manila' }).replace('/', '-');
    return `${time}   ✦   ${day} ${date}`;
  };
  const [phTime, setPhTime] = useState(getPhilippinesTime);
  useEffect(() => {
    const timer = setInterval(() => setPhTime(getPhilippinesTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const FALLBACK_RATE = 0.018;
  const [liveRate, setLiveRate]     = useState<number | null>(null);
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'fallback'>('loading');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://open.er-api.com/v6/latest/PHP', { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data: { rates: Record<string, number>; time_last_update_utc: string }) => {
        const fetched = data?.rates?.USD;
        if (typeof fetched !== 'number' || fetched <= 0) throw new Error();
        setLiveRate(fetched);
        setLastUpdated(data.time_last_update_utc);
        setRateStatus('live');
      })
      .catch(err => { if (err.name !== 'AbortError') setRateStatus('fallback'); });
    return () => controller.abort();
  }, []);

  const effectiveCurrencyRate = liveRate ?? FALLBACK_RATE;

  const configs: Record<ConversionMode, ConversionConfig> = {
    currency: {
      title: 'Currency Converter',
      subtitle: 'USD to PHP',
      fromUnit: 'USD',
      fromLabel: 'US Dollar',
      toUnit: 'PHP',
      toLabel: 'Philippine Peso',
      rate: 1 / effectiveCurrencyRate,
      rateText: `1 USD = ${(1 / effectiveCurrencyRate).toFixed(2)} PHP`,
      decimals: 2,
    },
    hectares: {
      title: 'Land Area Converter',
      subtitle: 'Hectares to Acres',
      fromUnit: 'ha',
      fromLabel: 'Hectares',
      toUnit: 'ac',
      toLabel: 'Acres',
      rate: 2.47105,
      rateText: '1 ha = 2.47105 ac',
      decimals: 4,
    },
    sqmeters: {
      title: 'Land Area Converter',
      subtitle: 'Square Meters to Square Feet',
      fromUnit: 'm²',
      fromLabel: 'Square Meters',
      toUnit: 'ft²',
      toLabel: 'Square Feet',
      rate: 10.7639,
      rateText: '1 m² = 10.7639 ft²',
      decimals: 2,
    },
  };

  const config = configs[mode];
  const { fromUnit, fromLabel, toUnit, toLabel, rate, rateText } = config;
  
  const addCommas = (value: string) => {
    if (!value) return value;
    const [int, dec] = value.split('.');
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
  };

  const handleTopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTopValue(value);
      setBottomValue(value ? (parseFloat(value) * rate).toFixed(config.decimals) : '');
      setLastEdited('top');
    }
  };

  const handleBottomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBottomValue(value);
      setTopValue(value ? (parseFloat(value) / rate).toFixed(config.decimals) : '');
      setLastEdited('bottom');
    }
  };

  const clearAmount = () => {
    setTopValue('');
    setBottomValue('');
    setLastEdited('top');
  };

  const switchMode = (newMode: ConversionMode) => {
    setMode(newMode);
    setTopValue('');
    setBottomValue('');
    setLastEdited('top');
  };

  const swapUnits = () => {
    if (lastEdited === 'top' && topValue) {
      setBottomValue(topValue);
      setTopValue((parseFloat(topValue) / rate).toFixed(config.decimals));
      setLastEdited('bottom');
    } else if (lastEdited === 'bottom' && bottomValue) {
      setTopValue(bottomValue);
      setBottomValue((parseFloat(bottomValue) * rate).toFixed(config.decimals));
      setLastEdited('top');
    }
  };

  return (
    <div className="size-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-start justify-center pt-2 px-4 pb-4">
      <div className="w-full max-w-sm">
        {/* Philippines Time */}
        <div className="text-center mb-3 text-sm text-gray-500 font-medium tracking-wide whitespace-pre">
          {phTime}
        </div>

        {/* Converter Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Input */}
          <div className="pt-6 px-6 pb-10 bg-gradient-to-r from-blue-500 to-indigo-600">
            <div className="text-white text-sm font-medium mb-2 opacity-90">From</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-2xl font-semibold">{fromUnit}</span>
              <span className="text-white text-sm opacity-75">{fromLabel}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={addCommas(topValue)}
              onChange={handleTopChange}
              placeholder="0"
              className="w-full bg-white/20 backdrop-blur-sm text-white text-4xl font-light border-none outline-none rounded-2xl px-4 py-3 placeholder-white/50"
            />
          </div>

          {/* Divider with Icon */}
          <div className="relative h-7 bg-gray-50">
            <button
              onClick={swapUnits}
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg border-4 border-gray-50 hover:bg-gray-50 active:scale-95 transition-transform cursor-pointer"
            >
              <ArrowDownUp className="w-5 h-5 text-indigo-600" />
            </button>
          </div>

          {/* Output */}
          <div className="pt-2 px-6 pb-6 bg-gray-50">
            <div className="text-gray-600 text-sm font-medium mb-2">To</div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-900 text-2xl font-semibold">{toUnit}</span>
              <span className="text-gray-500 text-sm">{toLabel}</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              value={addCommas(bottomValue)}
              onChange={handleBottomChange}
              placeholder="0"
              className="w-full bg-white text-gray-900 text-4xl font-light rounded-2xl px-4 py-3 border-2 border-gray-200 outline-none focus:border-indigo-300"
            />
          </div>

          {/* Rate Info */}
          <div className="px-6 py-4 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Conversion Rate</span>
              {mode === 'currency' && (
                <>
                  {rateStatus === 'loading' && (
                    <span className="text-xs text-gray-400 animate-pulse">Fetching rate...</span>
                  )}
                  {rateStatus === 'live' && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      Live rate
                    </span>
                  )}
                  {rateStatus === 'fallback' && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      Approximate
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="text-right">
              <span className="text-gray-900 font-medium text-sm">{rateText}</span>
              {mode === 'currency' && rateStatus === 'live' && lastUpdated && (
                <p className="text-xs text-gray-400 mt-1">
                  Updated {new Date(lastUpdated).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit',
                    timeZone: 'America/Los_Angeles',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Clear Button */}
          <div className="p-6 pt-2">
            <button
              onClick={clearAmount}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-4 rounded-2xl shadow-lg active:scale-98 transition-transform"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => switchMode('currency')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              mode === 'currency'
                ? 'bg-white text-indigo-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Currency</span>
          </button>
          <button
            onClick={() => switchMode('hectares')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              mode === 'hectares'
                ? 'bg-white text-indigo-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span className="text-sm">ha / ac</span>
          </button>
          <button
            onClick={() => switchMode('sqmeters')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              mode === 'sqmeters'
                ? 'bg-white text-indigo-600 shadow-lg'
                : 'bg-white/50 text-gray-600 hover:bg-white/80'
            }`}
          >
            <Ruler className="w-4 h-4" />
            <span className="text-sm">m² / ft²</span>
          </button>
        </div>

        {/* Footer Note */}
        {mode === 'currency' && (rateStatus === 'loading' || rateStatus === 'fallback') && (
          <div className="text-center mt-6 text-sm text-gray-600">
            <p>
              {rateStatus === 'loading'
                ? 'Fetching live exchange rate...'
                : 'Could not fetch live rate — using approximate fallback'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}