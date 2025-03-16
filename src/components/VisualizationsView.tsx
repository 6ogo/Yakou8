import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapPin, Globe, Clock, Users, Cloud, Umbrella, Wind, Droplet, Thermometer, TrendingUp, DollarSign, Landmark, BarChart2, Activity, Info } from 'lucide-react';

interface GeoData {
  country: string;
  city: string;
  region: string;
  timezone: string;
  latitude?: number;
  longitude?: number;
  countryCode?: string;
  continentCode?: string;
  population?: number;
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
  currencyRate?: number;
  unemployment?: number;
  inflation?: number;
  industries?: {name: string; value: number}[];
}

interface DemographicData {
  population?: number;
  populationGrowth?: number;
  medianAge?: number;
  lifeExpectancy?: number;
  urbanPopulation?: number;
  ageDistribution?: {age: string; value: number}[];
}

interface GeneralFacts {
  capital?: string;
  languages?: string[];
  internetUsers?: number;
  landArea?: number;
  interestingFacts?: string[];
}

export const VisualizationsView: React.FC = () => {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [economicData, setEconomicData] = useState<EconomicData | null>(null);
  const [demographicData, setDemographicData] = useState<DemographicData | null>(null);
  const [generalFacts, setGeneralFacts] = useState<GeneralFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weather' | 'economy' | 'demographics' | 'facts'>('weather');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        // Using ipapi.co for geolocation data
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Failed to fetch location data');
        const data = await response.json();
        
        const geoInfo: GeoData = {
          country: data.country_name,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          latitude: data.latitude,
          longitude: data.longitude,
          countryCode: data.country_code,
          population: data.country_population,
          continentCode: data.continent_code
        };
        
        setGeoData(geoInfo);

        // Generate all mock data based on location
        const mockWeather = generateMockWeather(geoInfo);
        setWeatherData(mockWeather);
        
        const mockEconomicData = generateMockEconomicData(geoInfo);
        setEconomicData(mockEconomicData);
        
        const mockDemographicData = generateMockDemographicData(geoInfo);
        setDemographicData(mockDemographicData);
        
        const mockGeneralFacts = generateMockGeneralFacts(geoInfo);
        setGeneralFacts(mockGeneralFacts);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const generateMockWeather = (geoInfo: GeoData): WeatherData => {
    // Generate realistic but random weather data based on location
    const baseTemp = geoInfo.continentCode === 'EU' ? 15 : 
                    geoInfo.continentCode === 'NA' ? 20 :
                    geoInfo.continentCode === 'AS' ? 25 :
                    geoInfo.continentCode === 'AF' ? 30 :
                    geoInfo.continentCode === 'SA' ? 28 :
                    geoInfo.continentCode === 'OC' ? 22 : 20;
    
    const temp = Math.floor(Math.random() * 10) + baseTemp - 5; // Variation around base temp
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear', 'Thunderstorms'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const humidity = Math.floor(Math.random() * 60) + 30; // 30-90%
    const windSpeed = Math.floor(Math.random() * 20) + 1; // 1-20 km/h
    const feelsLike = temp + (Math.random() * 4 - 2); // Slight variation
    const visibility = Math.floor(Math.random() * 5) + 5; // 5-10 km
    const uv = Math.floor(Math.random() * 11); // 0-10 UV index
    const precipitation = Math.floor(Math.random() * 30); // 0-30% chance
    
    // Generate a 5-day forecast
    const forecast: ForecastDay[] = [];
    for (let i = 0; i < 5; i++) {
      const dayTemp = temp + (Math.random() * 10 - 5); // Variation for forecast days
      forecast.push({
        date: new Date(Date.now() + (i * 86400000)).toLocaleDateString(), // Add days
        tempMax: Math.round(dayTemp + 3),
        tempMin: Math.round(dayTemp - 3),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        chanceOfRain: Math.floor(Math.random() * 100)
      });
    }
    
    return {
      temperature: temp,
      condition,
      humidity,
      windSpeed,
      feelsLike: parseFloat(feelsLike.toFixed(1)),
      visibility,
      uv,
      precipitation,
      forecast
    };
  };
  
  const generateMockEconomicData = (geoInfo: GeoData): EconomicData => {
    // Economic data based on continent
    const baseGdpPerCapita = geoInfo.continentCode === 'EU' ? 40000 : 
                           geoInfo.continentCode === 'NA' ? 45000 :
                           geoInfo.continentCode === 'AS' ? 15000 :
                           geoInfo.continentCode === 'AF' ? 5000 :
                           geoInfo.continentCode === 'SA' ? 10000 :
                           geoInfo.continentCode === 'OC' ? 35000 : 25000;
    
    const gdpGrowth = parseFloat((Math.random() * 6 - 1).toFixed(1)); // -1% to 5%
    const gdp = geoInfo.population ? Math.round(geoInfo.population * baseGdpPerCapita / 1000000000) : 100;
    const unemployment = parseFloat((Math.random() * 10 + 2).toFixed(1)); // 2-12%
    const inflation = parseFloat((Math.random() * 8).toFixed(1)); // 0-8%
    const currencyRate = parseFloat((Math.random() * 2 + 0.5).toFixed(2)); // Exchange rate to USD
    
    // Major industries
    const industries = [
      { name: 'Technology', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Manufacturing', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Agriculture', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Services', value: Math.floor(Math.random() * 30) + 10 },
      { name: 'Tourism', value: Math.floor(Math.random() * 30) + 10 }
    ];
    
    // Normalize to 100%
    const total = industries.reduce((sum, ind) => sum + ind.value, 0);
    industries.forEach(ind => ind.value = Math.round(ind.value / total * 100));
    
    return {
      gdp,
      gdpGrowth,
      gdpPerCapita: baseGdpPerCapita,
      currency: geoInfo.countryCode === 'US' ? 'USD' : 
               geoInfo.continentCode === 'EU' ? 'EUR' : 
               'Local Currency',
      currencyRate,
      unemployment,
      inflation,
      industries
    };
  };
  
  const generateMockDemographicData = (geoInfo: GeoData): DemographicData => {
    const population = geoInfo.population || Math.floor(Math.random() * 900000000) + 100000000;
    const populationGrowth = parseFloat((Math.random() * 2).toFixed(1)); // 0-2%
    const medianAge = Math.floor(Math.random() * 15) + 25; // 25-40 years
    const lifeExpectancy = Math.floor(Math.random() * 15) + 65; // 65-80 years
    const urbanPopulation = Math.floor(Math.random() * 30) + 60; // 60-90%
    
    // Age distribution
    const ageDistribution = [
      { age: '0-14', value: Math.floor(Math.random() * 15) + 15 },
      { age: '15-24', value: Math.floor(Math.random() * 10) + 10 },
      { age: '25-54', value: Math.floor(Math.random() * 10) + 35 },
      { age: '55-64', value: Math.floor(Math.random() * 5) + 10 },
      { age: '65+', value: Math.floor(Math.random() * 10) + 10 }
    ];
    
    // Normalize to 100%
    const total = ageDistribution.reduce((sum, age) => sum + age.value, 0);
    ageDistribution.forEach(age => age.value = Math.round(age.value / total * 100));
    
    return {
      population,
      populationGrowth,
      medianAge,
      lifeExpectancy,
      urbanPopulation,
      ageDistribution
    };
  };
  
  const generateMockGeneralFacts = (geoInfo: GeoData): GeneralFacts => {
    const landArea = Math.floor(Math.random() * 9000000) + 1000000; // km²
    const internetUsers = Math.floor(Math.random() * 50) + 50; // 50-100% of population
    
    // Generate random facts based on country
    const facts = [
      `${geoInfo.country} has one of the world's most diverse ecosystems.`,
      `The average citizen in ${geoInfo.country} consumes 3 cups of coffee per day.`,
      `${geoInfo.country} has over 1000 traditional dishes in its cuisine.`,
      `The oldest university in ${geoInfo.country} was founded in the 14th century.`,
      `${geoInfo.city} is known for its unique architectural landmarks.`
    ];
    
    return {
      capital: geoInfo.city === 'London' ? 'London' : 
              geoInfo.city === 'Paris' ? 'Paris' : 
              geoInfo.city === 'Berlin' ? 'Berlin' : 
              `Capital of ${geoInfo.country}`,
      languages: ['English', geoInfo.continentCode === 'EU' ? 'French' : 'Local Language'],
      internetUsers,
      landArea,
      interestingFacts: facts
    };
  };
  
  // Helper function to format large numbers with commas and unit suffixes
  const formatNumber = (num: number, digits = 1): string => {
    const units = ['', 'K', 'M', 'B', 'T'];
    const floor = Math.floor(Math.log10(num) / 3);
    return (num / Math.pow(1000, floor)).toFixed(digits) + units[floor];
  };
  
  // Tab navigation component
  const TabNavigation = () => (
    <div className="flex justify-center mb-6 border-b border-green-500/30">
      <button 
        className={`px-4 py-2 ${activeTab === 'weather' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400'}`}
        onClick={() => setActiveTab('weather')}
      >
        <div className="flex items-center gap-2">
          <Cloud size={16} />
          <span>Weather</span>
        </div>
      </button>
      <button 
        className={`px-4 py-2 ${activeTab === 'economy' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400'}`}
        onClick={() => setActiveTab('economy')}
      >
        <div className="flex items-center gap-2">
          <DollarSign size={16} />
          <span>Economy</span>
        </div>
      </button>
      <button 
        className={`px-4 py-2 ${activeTab === 'demographics' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400'}`}
        onClick={() => setActiveTab('demographics')}
      >
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>Demographics</span>
        </div>
      </button>
      <button 
        className={`px-4 py-2 ${activeTab === 'facts' ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400'}`}
        onClick={() => setActiveTab('facts')}
      >
        <div className="flex items-center gap-2">
          <Info size={16} />
          <span>Fun Facts</span>
        </div>
      </button>
    </div>
  );

  // Colors for charts
  const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#60a5fa', '#3b82f6', '#2563eb'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>Error loading data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Location Insights</h1>
          <p className="text-xl mb-4">
            Comprehensive data and visualizations about your current location
          </p>
        </header>

        {/* User Location Card */}
        {geoData && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Your Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center">
                  <Globe size={18} className="mr-2" />
                  <span>Country</span>
                </div>
                <p className="text-xl mt-2">{geoData.country}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center">
                  <MapPin size={18} className="mr-2" />
                  <span>City</span>
                </div>
                <p className="text-xl mt-2">{geoData.city}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center">
                  <MapPin size={18} className="mr-2" />
                  <span>Region</span>
                </div>
                <p className="text-xl mt-2">{geoData.region}</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-lg">
                <div className="flex items-center">
                  <Clock size={18} className="mr-2" />
                  <span>Timezone</span>
                </div>
                <p className="text-xl mt-2">{geoData.timezone}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <TabNavigation />
        
        {/* Tab Content */}
        {activeTab === 'weather' && weatherData && (
          <div className="space-y-6">
            {/* Current Weather Card */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Cloud className="mr-2" size={20} />
                Current Weather in {geoData?.city}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Thermometer size={18} className="mr-2" />
                    <span>Temperature</span>
                  </div>
                  <p className="text-xl mt-2">{weatherData.temperature}°C</p>
                  <p className="text-sm text-gray-400">Feels like {weatherData.feelsLike}°C</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Cloud size={18} className="mr-2" />
                    <span>Condition</span>
                  </div>
                  <p className="text-xl mt-2">{weatherData.condition}</p>
                  <p className="text-sm text-gray-400">{weatherData.precipitation}% chance of rain</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Droplet size={18} className="mr-2" />
                    <span>Humidity</span>
                  </div>
                  <p className="text-xl mt-2">{weatherData.humidity}%</p>
                  <p className="text-sm text-gray-400">Visibility: {weatherData.visibility} km</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Wind size={18} className="mr-2" />
                    <span>Wind Speed</span>
                  </div>
                  <p className="text-xl mt-2">{weatherData.windSpeed} km/h</p>
                  <p className="text-sm text-gray-400">UV Index: {weatherData.uv}</p>
                </div>
              </div>
            </div>
          
            {/* Weather Forecast Chart */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Umbrella className="mr-2" size={20} />
                5-Day Forecast
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {weatherData.forecast && (
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={weatherData.forecast}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" stroke="#aaa" />
                        <YAxis stroke="#aaa" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} 
                          itemStyle={{ color: '#22c55e' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tempMax" 
                          stroke="#22c55e" 
                          fill="#22c55e" 
                          fillOpacity={0.3}
                          name="High Temp (°C)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="tempMin" 
                          stroke="#60a5fa" 
                          fill="#60a5fa" 
                          fillOpacity={0.3}
                          name="Low Temp (°C)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-4">
                  {weatherData.forecast?.map((day, index) => (
                    <div key={index} className="p-3 bg-green-500/10 rounded-lg text-center">
                      <p className="font-semibold">{day.date}</p>
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
          </div>
        )}
        
        {activeTab === 'economy' && economicData && (
          <div className="space-y-6">
            {/* GDP and Economic Indicators Card */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <DollarSign className="mr-2" size={20} />
                Economic Indicators for {geoData?.country}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign size={18} className="mr-2" />
                    <span>GDP</span>
                  </div>
                  <p className="text-xl mt-2">${formatNumber(economicData.gdp || 0)}B</p>
                  <p className="text-sm text-gray-400 flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    {economicData.gdpGrowth}% growth
                  </p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span>GDP Per Capita</span>
                  </div>
                  <p className="text-xl mt-2">${formatNumber(economicData.gdpPerCapita || 0, 0)}</p>
                  <p className="text-sm text-gray-400">{economicData.currency}</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Activity size={18} className="mr-2" />
                    <span>Inflation Rate</span>
                  </div>
                  <p className="text-xl mt-2">{economicData.inflation}%</p>
                  <p className="text-sm text-gray-400">Annual change</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span>Unemployment</span>
                  </div>
                  <p className="text-xl mt-2">{economicData.unemployment}%</p>
                  <p className="text-sm text-gray-400">of labor force</p>
                </div>
              </div>
            </div>
            
            {/* Industry Breakdown Chart */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Landmark className="mr-2" size={20} />
                Industry Breakdown
              </h2>
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {economicData.industries?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-lg font-semibold mb-2">Key Economic Sectors</h3>
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
            {/* Population Overview Card */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2" size={20} />
                Population Overview for {geoData?.country}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span>Population</span>
                  </div>
                  <p className="text-xl mt-2">{formatNumber(demographicData.population || 0, 2)}</p>
                  <p className="text-sm text-gray-400 flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    {demographicData.populationGrowth}% growth
                  </p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Users size={18} className="mr-2" />
                    <span>Median Age</span>
                  </div>
                  <p className="text-xl mt-2">{demographicData.medianAge} years</p>
                  <p className="text-sm text-gray-400">National average</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Activity size={18} className="mr-2" />
                    <span>Life Expectancy</span>
                  </div>
                  <p className="text-xl mt-2">{demographicData.lifeExpectancy} years</p>
                  <p className="text-sm text-gray-400">National average</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Globe size={18} className="mr-2" />
                    <span>Urban Population</span>
                  </div>
                  <p className="text-xl mt-2">{demographicData.urbanPopulation}%</p>
                  <p className="text-sm text-gray-400">of total population</p>
                </div>
              </div>
            </div>
            
            {/* Age Distribution Chart */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BarChart2 className="mr-2" size={20} />
                Age Distribution
              </h2>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={demographicData.ageDistribution}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="age" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} 
                      itemStyle={{ color: '#22c55e' }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Population %" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'facts' && generalFacts && (
          <div className="space-y-6">
            {/* General Facts Card */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="mr-2" size={20} />
                General Information about {geoData?.country}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Landmark size={18} className="mr-2" />
                    <span>Capital</span>
                  </div>
                  <p className="text-xl mt-2">{generalFacts.capital}</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Globe size={18} className="mr-2" />
                    <span>Languages</span>
                  </div>
                  <p className="text-xl mt-2">{generalFacts.languages?.join(', ')}</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg">
                  <div className="flex items-center">
                    <Globe size={18} className="mr-2" />
                    <span>Land Area</span>
                  </div>
                  <p className="text-xl mt-2">{formatNumber(generalFacts.landArea || 0, 0)} km²</p>
                </div>
                <div className="p-4 bg-green-500/20 rounded-lg col-span-1 md:col-span-2 lg:col-span-3">
                  <div className="flex items-center">
                    <Info size={18} className="mr-2" />
                    <span>Internet Users</span>
                  </div>
                  <p className="text-xl mt-2">{generalFacts.internetUsers}% of population</p>
                </div>
              </div>
            </div>
            
            {/* Fun Facts Section */}
            <div className="bg-gray-900 rounded-lg p-6 border border-green-500/30">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="mr-2" size={20} />
                Fun Facts about {geoData?.country}
              </h2>
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
    </div>
  );
};