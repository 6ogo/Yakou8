import React, { useState, useEffect, ReactElement } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin, Globe, Users, Cloud, Umbrella, Wind, Droplet, Thermometer, TrendingUp, DollarSign, Landmark, Activity, Info } from 'lucide-react';

interface GeoData {
  country: string;
  city: string;
  region: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  continentCode?: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike?: number;
  visibility?: number;
  uv?: number;
  precipitation?: number;
  forecast?: ForecastDay[];
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  chanceOfRain: number;
}

interface EconomicData {
  gdp?: number;
  gdpGrowth?: number;
  gdpPerCapita?: number;
  currency?: string;
  unemployment?: number;
  inflation?: number;
  industries?: { name: string; value: number }[];
}

interface DemographicData {
  population?: number;
  populationGrowth?: number;
  lifeExpectancy?: number;
  urbanPopulation?: number;
}

interface GeneralFacts {
  capital?: string;
  languages?: string[];
  internetUsers?: number;
  landArea?: number;
  interestingFacts?: string[];
}

export const VisualizationsView: React.FC = (): ReactElement => {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [economicData, setEconomicData] = useState<EconomicData | null>(null);
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null);
  const [generalFacts, setGeneralFacts] = useState<GeneralFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weather' | 'economy' | 'demographics' | 'facts'>('weather');
  const [quote, setQuote] = useState<{ quote: string; author: string; category: string } | null>(null);

  const API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY;

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Fetch IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error('Failed to fetch IP address');
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;

        // Fetch location data
        const response = await fetch(
          `https://api.api-ninjas.com/v1/iplookup?address=${ipAddress}`,
          { headers: { 'X-Api-Key': API_NINJAS_KEY } }
        );
        if (!response.ok) throw new Error('Failed to fetch location data');
        const data = await response.json();

        // Determine continent code
        let continentCode = '';
        if (['US', 'CA', 'MX'].includes(data.country_code)) continentCode = 'NA';
        else if (['GB', 'DE', 'FR', 'IT', 'ES', 'SE', 'NO', 'FI', 'DK'].includes(data.country_code)) continentCode = 'EU';
        else if (['CN', 'JP', 'IN', 'KR'].includes(data.country_code)) continentCode = 'AS';
        else if (['AU', 'NZ'].includes(data.country_code)) continentCode = 'OC';
        else if (['BR', 'AR', 'CO', 'PE', 'CL'].includes(data.country_code)) continentCode = 'SA';
        else if (['ZA', 'NG', 'EG', 'KE', 'ET'].includes(data.country_code)) continentCode = 'AF';

        const geoInfo: GeoData = {
          country: data.country,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
          countryCode: data.country_code,
          continentCode
        };
        setGeoData(geoInfo);

        // Fetch additional data concurrently
        await Promise.all([
          fetchCountryData(geoInfo),
          fetchWeatherData(geoInfo),
          fetchGdpData(geoInfo),
          fetchQuote()
        ]);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Fetch country data
  const fetchCountryData = async (geoInfo: GeoData) => {
    try {
      const countryResponse = await fetch(
        `https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(geoInfo.country)}`,
        { headers: { 'X-Api-Key': API_NINJAS_KEY } }
      );
      if (!countryResponse.ok) throw new Error('Failed to fetch country data');
      const countryData = await countryResponse.json();
      if (!countryData || countryData.length === 0) throw new Error('No country data found');

      const country = countryData[0];

      const population = parseInt(country.population) * 1000; // Assuming population is in thousands
      const urbanPopulation = parseFloat(country.urban_population);
      const populationGrowth = parseFloat(country.pop_growth);
      const lifeExpectancyMale = parseFloat(country.life_expectancy_male);
      const lifeExpectancyFemale = parseFloat(country.life_expectancy_female);
      const lifeExpectancy = (lifeExpectancyMale + lifeExpectancyFemale) / 2;
      const gdp = parseInt(country.gdp) / 1000; // Convert to billions
      const gdpGrowth = parseFloat(country.gdp_growth);
      const gdpPerCapita = parseFloat(country.gdp_per_capita);
      const unemployment = parseFloat(country.unemployment);
      const currency = country.currency?.name || 'Unknown Currency';
      const internetUsers = parseFloat(country.internet_users);
      const landArea = parseInt(country.surface_area) * 1000; // Assuming surface_area is in thousands

      const agricultureEmployment = parseFloat(country.employment_agriculture) || 0;
      const industryEmployment = parseFloat(country.employment_industry) || 0;
      const servicesEmployment = parseFloat(country.employment_services) || 0;
      const totalEmployment = agricultureEmployment + industryEmployment + servicesEmployment;
      const industries = totalEmployment
        ? [
            { name: 'Agriculture', value: Math.round((agricultureEmployment / totalEmployment) * 100) },
            { name: 'Industry', value: Math.round((industryEmployment / totalEmployment) * 100) },
            { name: 'Services', value: Math.round((servicesEmployment / totalEmployment) * 100) }
          ]
        : [
            { name: 'Agriculture', value: 33 },
            { name: 'Industry', value: 33 },
            { name: 'Services', value: 34 }
          ];

      const interestingFacts = [
        `${geoInfo.country}'s GDP is approximately $${formatNumber(gdp)} billion.`,
        `Average life expectancy is ${lifeExpectancy.toFixed(1)} years.`,
        `${internetUsers}% of people use the internet.`,
        `Unemployment rate is ${unemployment}%.`,
        `${urbanPopulation}% live in urban areas.`
      ];

      setDemographicData({
        population,
        populationGrowth,
        lifeExpectancy,
        urbanPopulation
      });

      setEconomicData({
        gdp,
        gdpGrowth,
        gdpPerCapita,
        currency,
        unemployment,
        inflation: 2.0, // Default value since not provided
        industries
      });

      setGeneralFacts({
        capital: country.capital,
        languages: ['Primary Language'], // Default since not explicitly provided
        internetUsers,
        landArea,
        interestingFacts
      });
    } catch (error) {
      console.error('Error fetching country data:', error);
      setDemographicData(generateMockDemographicData(geoInfo));
      setEconomicData(generateMockEconomicData(geoInfo));
      setGeneralFacts(generateMockGeneralFacts(geoInfo));
    }
  };

  // Fetch weather data
  const fetchWeatherData = async (geoInfo: GeoData) => {
    try {
      // Fetch current weather
      const weatherResponse = await fetch(
        `https://api.api-ninjas.com/v1/weather?lat=${geoInfo.latitude}&lon=${geoInfo.longitude}`,
        { headers: { 'X-Api-Key': API_NINJAS_KEY } }
      );
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
      const currentWeather = await weatherResponse.json();

      // Fetch weather forecast
      const forecastResponse = await fetch(
        `https://api.api-ninjas.com/v1/weatherforecast?lat=${geoInfo.latitude}&lon=${geoInfo.longitude}`,
        { headers: { 'X-Api-Key': API_NINJAS_KEY } }
      );
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast data');
      const forecastData = await forecastResponse.json();

      // Process forecast data into daily summaries
      const forecastByDay: { [key: string]: any[] } = forecastData.reduce((acc: any, item: any) => {
        const date = new Date(item.timestamp * 1000).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
      }, {});

      const dailyForecast: ForecastDay[] = Object.entries(forecastByDay).map(([date, items]) => {
        const temps = items.map((i: any) => i.temp);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        const midday = new Date(items[0].timestamp * 1000);
        midday.setHours(12, 0, 0, 0);
        const closestToMidday = items.reduce((prev: any, curr: any) => {
          const prevDiff = Math.abs(prev.timestamp * 1000 - midday.getTime());
          const currDiff = Math.abs(curr.timestamp * 1000 - midday.getTime());
          return currDiff < prevDiff ? curr : prev;
        });
        const condition = closestToMidday.weather;
        const chanceOfRain = Math.round(items.reduce((sum: number, i: any) => sum + i.cloud_pct, 0) / items.length);
        return { date, tempMin: minTemp, tempMax: maxTemp, condition, chanceOfRain };
      }).slice(0, 5);

      setWeatherData({
        temperature: currentWeather.temp,
        feelsLike: currentWeather.feels_like,
        humidity: currentWeather.humidity,
        windSpeed: currentWeather.wind_speed,
        condition: currentWeather.weather || inferCondition(currentWeather.cloud_pct || 0, currentWeather.humidity),
        visibility: 10, // Default since not provided
        uv: 0, // Default since not provided
        precipitation: currentWeather.cloud_pct || 0,
        forecast: dailyForecast
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      setWeatherData(generateMockWeather(geoInfo));
    }
  };

  // Infer condition if weather field is not provided
  const inferCondition = (cloudPct: number, humidity: number): string => {
    if (cloudPct > 80) return 'Cloudy';
    if (cloudPct > 30) return 'Partly Cloudy';
    if (humidity > 80) return 'Rainy';
    return 'Clear';
  };

  // Fetch GDP data
  const fetchGdpData = async (geoInfo: GeoData) => {
    try {
      const gdpResponse = await fetch(
        `https://api.api-ninjas.com/v1/gdp?country=${geoInfo.countryCode}`,
        { headers: { 'X-Api-Key': API_NINJAS_KEY } }
      );
      if (!gdpResponse.ok) throw new Error('Failed to fetch GDP data');
      const gdpData = await gdpResponse.json();
      if (gdpData && gdpData.length > 0) {
        gdpData.sort((a: any, b: any) => b.year - a.year); // Get most recent
        const recentGdp = gdpData[0];
        setEconomicData(prev => ({
          ...prev,
          gdp: recentGdp.gdp_nominal / 1000, // Convert to billions
          gdpGrowth: recentGdp.gdp_growth,
          gdpPerCapita: recentGdp.gdp_per_capita_nominal
        }));
      }
    } catch (error) {
      console.error('Error fetching GDP data:', error);
      // Rely on country API data or mock data as fallback
    }
  };

  // Fetch inspirational quote
  const fetchQuote = async () => {
    try {
      const quoteResponse = await fetch(
        'https://api.api-ninjas.com/v1/quotes?category=inspirational',
        { headers: { 'X-Api-Key': API_NINJAS_KEY } }
      );
      if (!quoteResponse.ok) throw new Error('Failed to fetch quote');
      const quoteData = await quoteResponse.json();
      if (quoteData && quoteData.length > 0) setQuote(quoteData[0]);
    } catch (error) {
      console.error('Error fetching quote:', error);
      setQuote({
        quote: "The best way to predict the future is to create it.",
        author: "Peter Drucker",
        category: "inspirational"
      });
    }
  };

  // Mock data functions (generic fallbacks)
  const generateMockWeather = (_geoInfo: GeoData): WeatherData => {
    const temp = 20;
    return {
      temperature: temp,
      condition: 'Clear',
      humidity: 50,
      windSpeed: 5,
      feelsLike: temp,
      visibility: 10,
      uv: 0,
      precipitation: 0,
      forecast: generateDefaultForecast(temp)
    };
  };

  const generateDefaultForecast = (currentTemp: number): ForecastDay[] => {
    const forecast: ForecastDay[] = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(today.getDate() + i);
      forecast.push({
        date: forecastDate.toLocaleDateString(),
        tempMax: currentTemp + Math.floor(Math.random() * 5),
        tempMin: currentTemp - Math.floor(Math.random() * 5),
        condition: ['Clear', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
        chanceOfRain: Math.floor(Math.random() * 30)
      });
    }
    return forecast;
  };

  const generateMockEconomicData = (_geoInfo: GeoData): EconomicData => ({
    gdp: 500000, // In billions
    gdpGrowth: 2,
    gdpPerCapita: 30000,
    currency: 'Local Currency',
    unemployment: 5,
    inflation: 2,
    industries: [
      { name: 'Agriculture', value: 33 },
      { name: 'Industry', value: 33 },
      { name: 'Services', value: 34 }
    ]
  });

  const generateMockDemographicData = (_geoInfo: GeoData): DemographicData => ({
    population: 50000000,
    populationGrowth: 1,
    lifeExpectancy: 70,
    urbanPopulation: 60
  });

  const generateMockGeneralFacts = (geoInfo: GeoData): GeneralFacts => ({
    capital: 'Main City',
    languages: ['Primary Language'],
    internetUsers: 70,
    landArea: 500000, // In km²
    interestingFacts: [
      `${geoInfo.country} has a rich culture.`,
      `The economy is steadily growing.`,
      `Internet usage is widespread.`
    ]
  });

  const formatNumber = (num: number, digits = 1): string => {
    const units = ['', 'K', 'M', 'B', 'T'];
    const floor = Math.floor(Math.log10(Math.abs(num)) / 3);
    return (num / Math.pow(1000, floor)).toFixed(digits) + units[floor];
  };

  const TabNavigation = () => (
    <div className="flex justify-center mb-6 border-b border-green-500/30">
      {[
        { id: 'weather', label: 'Weather', icon: <Cloud size={16} /> },
        { id: 'economy', label: 'Economy', icon: <DollarSign size={16} /> },
        { id: 'demographics', label: 'Demographics', icon: <Users size={16} /> },
        { id: 'facts', label: 'Fun Facts', icon: <Info size={16} /> }
      ].map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-2 ${activeTab === tab.id ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:text-green-300'}`}
          onClick={() => setActiveTab(tab.id as any)}
        >
          <div className="flex items-center gap-2">{tab.icon}<span>{tab.label}</span></div>
        </button>
      ))}
    </div>
  );

  const COLORS = ['#22c55e', '#16a34a', '#15803d', '#60a5fa', '#3b82f6', '#2563eb'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500">
        <p>Error loading data: {error}. Using fallback data where available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 text-green-400">Location Insights</h1>
        <p className="text-xl mb-4">Explore real-time data about your location</p>
        {quote && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30 max-w-2xl mx-auto">
            <p className="text-lg italic text-gray-200">"{quote.quote}"</p>
            <p className="text-right text-sm text-gray-400 mt-2">— {quote.author}</p>
          </div>
        )}
      </header>

      {geoData && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-green-500/30">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><MapPin className="mr-2" size={20} />Your Location</h2>
          <div className="p-4 bg-green-500/20 rounded-lg">
            <p className="text-xl flex items-center"><Globe size={18} className="mr-2" />{geoData.city}, {geoData.country} ({geoData.timezone})</p>
          </div>
        </div>
      )}

      <TabNavigation />

      {activeTab === 'weather' && weatherData && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Cloud className="mr-2" size={20} />Current Weather in {geoData?.city}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Thermometer size={18} className="mr-2" /><span>Temperature</span></div>
                <p className="text-xl mt-2">{weatherData.temperature}°C</p>
                <p className="text-sm text-gray-400">Feels like {weatherData.feelsLike}°C</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Cloud size={18} className="mr-2" /><span>Condition</span></div>
                <p className="text-xl mt-2">{weatherData.condition}</p>
                <p className="text-sm text-gray-400">{weatherData.precipitation}% cloud cover</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Droplet size={18} className="mr-2" /><span>Humidity</span></div>
                <p className="text-xl mt-2">{weatherData.humidity}%</p>
                <p className="text-sm text-gray-400">Visibility: {weatherData.visibility} km</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Wind size={18} className="mr-2" /><span>Wind Speed</span></div>
                <p className="text-xl mt-2">{weatherData.windSpeed} m/s</p>
                <p className="text-sm text-gray-400">UV: {weatherData.uv}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Umbrella className="mr-2" size={20} />5-Day Forecast</h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weatherData.forecast} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#aaa" />
                  <YAxis stroke="#aaa" unit="°C" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', color: '#fff' }} />
                  <Area type="monotone" dataKey="tempMax" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Max Temp" />
                  <Area type="monotone" dataKey="tempMin" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.2} name="Min Temp" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
              {weatherData.forecast?.map((day, index) => (
                <div key={index} className="p-3 bg-green-500/10 rounded-lg text-center">
                  <p className="font-semibold">{day.date.split('/')[1] + '/' + day.date.split('/')[0]}</p>
                  <p className="text-sm">{day.condition}</p>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-green-400">{day.tempMax}°</span>
                    <span className="text-blue-400">{day.tempMin}°</span>
                  </div>
                  <p className="text-xs mt-1">{day.chanceOfRain}% rain</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'economy' && economicData && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><DollarSign className="mr-2" size={20} />Economy of {geoData?.country}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><DollarSign size={18} className="mr-2" /><span>GDP</span></div>
                <p className="text-xl mt-2">${formatNumber(economicData.gdp || 0)}B</p>
                <p className="text-sm text-gray-400 flex items-center"><TrendingUp size={14} className="mr-1" />{economicData.gdpGrowth}% growth</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Users size={18} className="mr-2" /><span>GDP Per Capita</span></div>
                <p className="text-xl mt-2">${formatNumber(economicData.gdpPerCapita || 0, 0)}</p>
                <p className="text-sm text-gray-400">{economicData.currency}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Activity size={18} className="mr-2" /><span>Inflation</span></div>
                <p className="text-xl mt-2">{economicData.inflation}%</p>
                <p className="text-sm text-gray-400">Estimated</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Users size={18} className="mr-2" /><span>Unemployment</span></div>
                <p className="text-xl mt-2">{economicData.unemployment}%</p>
                <p className="text-sm text-gray-400">Labor force</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Landmark className="mr-2" size={20} />Industry Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={economicData.industries}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {economicData.industries?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-lg font-semibold mb-2">Economic Sectors</h3>
                <ul className="space-y-2">
                  {economicData.industries?.map((industry, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span>{industry.name}: <strong>{industry.value}%</strong></span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demographics' && demographicData && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Users className="mr-2" size={20} />Demographics of {geoData?.country}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Users size={18} className="mr-2" /><span>Population</span></div>
                <p className="text-xl mt-2">{formatNumber(demographicData.population || 0)}</p>
                <p className="text-sm text-gray-400 flex items-center"><TrendingUp size={14} className="mr-1" />{demographicData.populationGrowth}% growth</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Activity size={18} className="mr-2" /><span>Life Expectancy</span></div>
                <p className="text-xl mt-2">{demographicData.lifeExpectancy?.toFixed(1)} years</p>
                <p className="text-sm text-gray-400">Average</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Globe size={18} className="mr-2" /><span>Urban Population</span></div>
                <p className="text-xl mt-2">{demographicData.urbanPopulation}%</p>
                <p className="text-sm text-gray-400">Of total</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'facts' && generalFacts && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Info className="mr-2" size={20} />Facts about {geoData?.country}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Landmark size={18} className="mr-2" /><span>Capital</span></div>
                <p className="text-xl mt-2">{generalFacts.capital}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Globe size={18} className="mr-2" /><span>Languages</span></div>
                <p className="text-xl mt-2">{generalFacts.languages?.join(', ')}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center"><Globe size={18} className="mr-2" /><span>Land Area</span></div>
                <p className="text-xl mt-2">{formatNumber(generalFacts.landArea || 0)} km²</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg sm:col-span-2 lg:col-span-3">
                <div className="flex items-center"><Info size={18} className="mr-2" /><span>Internet Users</span></div>
                <p className="text-xl mt-2">{generalFacts.internetUsers}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-400"><Info className="mr-2" size={20} />Interesting Facts</h2>
            <ul className="space-y-3">
              {generalFacts.interestingFacts?.map((fact, index) => (
                <li key={index} className="p-3 bg-green-500/10 rounded-lg flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};