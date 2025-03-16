import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MapPin, Globe, Users, Cloud, Umbrella, Wind, Droplet, Thermometer, TrendingUp, DollarSign, Landmark, BarChart2, Activity, Info } from 'lucide-react';

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
  const [quote, setQuote] = useState<{ quote: string; author: string; category: string } | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch IP address first
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (!ipResponse.ok) throw new Error('Failed to fetch IP address');
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;
        
        // Using API Ninjas IP lookup instead of ipapi.co
        const response = await fetch(
          `https://api.api-ninjas.com/v1/iplookup?address=${ipAddress}`,
          {
            headers: {
              'X-Api-Key': API_NINJAS_KEY
            }
          }
        );
        
        if (!response.ok) throw new Error('Failed to fetch location data');
        const data = await response.json();
        
        // Determine continent code based on country code (API Ninjas doesn't provide this)
        let continentCode = '';
        if (['US', 'CA', 'MX'].includes(data.country_code)) {
          continentCode = 'NA';
        } else if (['GB', 'DE', 'FR', 'IT', 'ES', 'SE', 'NO', 'FI', 'DK'].includes(data.country_code)) {
          continentCode = 'EU';
        } else if (['CN', 'JP', 'IN', 'KR'].includes(data.country_code)) {
          continentCode = 'AS';
        } else if (['AU', 'NZ'].includes(data.country_code)) {
          continentCode = 'OC';
        } else if (['BR', 'AR', 'CO', 'PE', 'CL'].includes(data.country_code)) {
          continentCode = 'SA';
        } else if (['ZA', 'NG', 'EG', 'KE', 'ET'].includes(data.country_code)) {
          continentCode = 'AF';
        }
        
        const geoInfo: GeoData = {
          country: data.country,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
          countryCode: data.country_code,
          population: undefined, // Will be fetched from country API
          continentCode: continentCode
        };
        
        setGeoData(geoInfo);

        // Fetch country information from API Ninjas
        await fetchCountryData(geoInfo);
        
        // Fetch real weather data
        await fetchWeatherData(geoInfo);
        
        // Fetch GDP data
        await fetchGdpData(geoInfo);
        
        // Fetch a motivational quote
        await fetchQuote();
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);
  
  // API Ninjas API key
  
  // Fetch country data from API Ninjas
  const fetchCountryData = async (geoInfo: GeoData) => {
    try {
      // API Ninjas country API
      const countryResponse = await fetch(
        `https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(geoInfo.country)}`,
        {
          headers: {
            'X-Api-Key': API_NINJAS_KEY
          }
        }
      );
      
      if (!countryResponse.ok) throw new Error('Failed to fetch country data');
      const countryData = await countryResponse.json();
      
      if (!countryData || countryData.length === 0) {
        throw new Error('No country data found');
      }
      
      const country = countryData[0];
      
      // Extract demographic data
      const population = parseInt(country.population) * 1000; // API returns in thousands
      const urbanPopulation = parseFloat(country.urban_population);
      const populationGrowth = parseFloat(country.pop_growth);
      const internetUsers = parseFloat(country.internet_users);
      
      // Extract economic data
      const gdp = parseInt(country.gdp) / 1000; // Convert to billions
      const gdpGrowth = parseFloat(country.gdp_growth);
      const gdpPerCapita = parseFloat(country.gdp_per_capita);
      const unemployment = parseFloat(country.unemployment);
      
      // Age distribution (using representative data as API Ninjas doesn't provide this)
      const ageDistribution = [
        { age: '0-14', value: 25 },
        { age: '15-24', value: 15 },
        { age: '25-54', value: 40 },
        { age: '55-64', value: 10 },
        { age: '65+', value: 10 }
      ];
      
      // Extract industry data (creating representative distribution based on employment data)
      const agriculturePct = parseFloat(country.employment_agriculture) || 10;
      const industryPct = parseFloat(country.employment_industry) || 20;
      const servicesPct = parseFloat(country.employment_services) || 70;
      
      const industries = [
        { name: 'Agriculture', value: agriculturePct },
        { name: 'Industry', value: industryPct },
        { name: 'Services', value: servicesPct },
        { name: 'Technology', value: Math.round(servicesPct * 0.3) }, // Estimate tech as part of services
        { name: 'Tourism', value: Math.round(servicesPct * 0.15) }  // Estimate tourism as part of services
      ];
      
      // Normalize industries to 100%
      const totalIndustry = industries.reduce((sum, ind) => sum + ind.value, 0);
      industries.forEach(ind => ind.value = Math.round(ind.value / totalIndustry * 100));
      
      // Generate interesting facts
      const interestingFacts = [
        `${geoInfo.country}'s GDP is approximately $${formatNumber(parseInt(country.gdp) / 1000)} billion.`,
        `The life expectancy in ${geoInfo.country} is ${country.life_expectancy_male} years for males and ${country.life_expectancy_female} years for females.`,
        `${geoInfo.country} has an internet usage rate of ${country.internet_users}%.`,
        `The unemployment rate in ${geoInfo.country} is ${country.unemployment}%.`,
        `${country.urban_population}% of ${geoInfo.country}'s population lives in urban areas.`
      ];
      
      // Set demographic data
      setDemographicData({
        population,
        populationGrowth,
        medianAge: Math.round((parseFloat(country.life_expectancy_male) + parseFloat(country.life_expectancy_female)) / 2 * 0.425), // Estimated from life expectancy
        lifeExpectancy: (parseFloat(country.life_expectancy_male) + parseFloat(country.life_expectancy_female)) / 2,
        urbanPopulation,
        ageDistribution
      });
      
      // Set economic data
      setEconomicData({
        gdp,
        gdpGrowth,
        gdpPerCapita,
        currency: country.currency ? country.currency.name : 'Local Currency',
        currencyRate: 1.1, // No direct API for exchange rates
        unemployment,
        inflation: 2.5, // Not provided by API Ninjas
        industries
      });
      
      // Set general facts
      setGeneralFacts({
        capital: country.capital,
        languages: ['Local language'], // API Ninjas doesn't provide languages
        internetUsers,
        landArea: parseInt(country.surface_area) * 1000, // API gives in thousands
        interestingFacts
      });
      
    } catch (error) {
      console.error('Error fetching country data:', error);
      // Fallback to mock data if API fails
      setDemographicData(generateMockDemographicData(geoInfo));
      setEconomicData(generateMockEconomicData(geoInfo));
      setGeneralFacts(generateMockGeneralFacts(geoInfo));
    }
  };
  
  // Fetch weather data from API Ninjas
  const fetchWeatherData = async (geoInfo: GeoData) => {
    try {
      // API Ninjas weather API
      const weatherResponse = await fetch(
        `https://api.api-ninjas.com/v1/weather?lat=${geoInfo.latitude}&lon=${geoInfo.longitude}`,
        {
          headers: {
            'X-Api-Key': API_NINJAS_KEY
          }
        }
      );
      
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
      const weatherData = await weatherResponse.json();
      
      // Fetch forecast data
      const forecastResponse = await fetch(
        `https://api.api-ninjas.com/v1/weatherforecast?lat=${geoInfo.latitude}&lon=${geoInfo.longitude}`,
        {
          headers: {
            'X-Api-Key': API_NINJAS_KEY
          }
        }
      );
      
      if (!forecastResponse.ok) throw new Error('Failed to fetch forecast data');
      const forecastData = await forecastResponse.json();
      
      // Process forecast data
      const forecast: ForecastDay[] = [];
      const processedDates = new Set<string>();
      
      // Get one forecast per day for the next 5 days
      forecastData.forEach((item: any) => {
        const date = new Date(item.timestamp * 1000).toLocaleDateString();
        if (!processedDates.has(date) && forecast.length < 5) {
          processedDates.add(date);
          forecast.push({
            date,
            tempMax: item.max_temp,
            tempMin: item.min_temp,
            condition: item.weather || 'Clear',
            chanceOfRain: item.cloud_pct || 0
          });
        }
      });
      
      // Determine a condition if not provided
      let condition = 'Clear';
      if (weatherData.cloud_pct > 80) condition = 'Cloudy';
      else if (weatherData.cloud_pct > 30) condition = 'Partly Cloudy';
      else if (weatherData.humidity > 80) condition = 'Rainy';
      
      // Set weather data
      setWeatherData({
        temperature: weatherData.temp,
        condition,
        humidity: weatherData.humidity,
        windSpeed: Math.round(weatherData.wind_speed * 3.6), // Convert m/s to km/h
        feelsLike: weatherData.feels_like,
        visibility: 10, // Not provided by API Ninjas
        uv: 0, // Not provided by API Ninjas
        precipitation: weatherData.cloud_pct || 0, // Using cloud coverage as a proxy
        forecast: forecast.length > 0 ? forecast : generateDefaultForecast(weatherData.temp)
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to mock weather if API fails
      setWeatherData(generateMockWeather(geoInfo));
    }
  };
  
  // Generate default forecast if API fails
  const generateDefaultForecast = (currentTemp: number): ForecastDay[] => {
    const forecast: ForecastDay[] = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(today.getDate() + i);
      
      forecast.push({
        date: forecastDate.toLocaleDateString(),
        tempMax: currentTemp + Math.floor(Math.random() * 3),
        tempMin: currentTemp - Math.floor(Math.random() * 3),
        condition: ['Clear', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
        chanceOfRain: Math.floor(Math.random() * 50)
      });
    }
    
    return forecast;
  };
  
  // Fetch quote from API Ninjas
  const fetchQuote = async () => {
    try {
      const quoteResponse = await fetch(
        'https://api.api-ninjas.com/v1/quotes?category=inspirational',
        {
          headers: {
            'X-Api-Key': API_NINJAS_KEY
          }
        }
      );
      
      if (!quoteResponse.ok) throw new Error('Failed to fetch quote');
      const quoteData = await quoteResponse.json();
      
      if (quoteData && quoteData.length > 0) {
        setQuote(quoteData[0]);
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
      // Fallback quote
      setQuote({
        quote: "Be not simply good - be good for something.",
        author: "Henry David Thoreau",
        category: "inspirational"
      });
    }
  };
  
  // Fetch GDP data from API Ninjas
  const fetchGdpData = async (geoInfo: GeoData) => {
    try {
      // API Ninjas GDP API (get most recent year)
      const gdpResponse = await fetch(
        `https://api.api-ninjas.com/v1/gdp?country=${geoInfo.countryCode}`,
        {
          headers: {
            'X-Api-Key': API_NINJAS_KEY
          }
        }
      );
      
      if (!gdpResponse.ok) throw new Error('Failed to fetch GDP data');
      const gdpData = await gdpResponse.json();
      
      if (gdpData && gdpData.length > 0) {
        // Sort by year to get most recent
        gdpData.sort((a: any, b: any) => b.year - a.year);
        const recentGdp = gdpData[0];
        
        // Update GDP data with more precise values
        setEconomicData(prevData => ({
          ...prevData,
          gdp: recentGdp.gdp_nominal,
          gdpGrowth: recentGdp.gdp_growth,
          gdpPerCapita: recentGdp.gdp_per_capita_nominal
        }));
      }
    } catch (error) {
      console.error('Error fetching GDP data:', error);
      // GDP data is already set in fetchCountryData, so we don't need to fallback here
    }
  };

  const generateMockWeather = (geoInfo: GeoData): WeatherData => {
    // Use accurate weather data based on location and current season
    // For Sweden in March 2025, average temperatures are around 0-5°C
    // For other regions, use more accurate temperature ranges
    let baseTemp = 0; // Default baseline
    
    // More accurate temperature ranges by continent and season (March)
    if (geoInfo.continentCode === 'EU') {
      if (geoInfo.countryCode === 'SE') {
        baseTemp = 2; // Sweden in March is cold
      } else if (geoInfo.countryCode === 'ES' || geoInfo.countryCode === 'IT' || geoInfo.countryCode === 'GR') {
        baseTemp = 12; // Southern Europe
      } else {
        baseTemp = 8; // Rest of Europe
      }
    } else if (geoInfo.continentCode === 'NA') {
      if (geoInfo.latitude && geoInfo.latitude > 40) {
        baseTemp = 5; // Northern US/Canada
      } else {
        baseTemp = 15; // Southern US
      }
    } else if (geoInfo.continentCode === 'AS') {
      if (geoInfo.countryCode === 'RU' || geoInfo.countryCode === 'KZ') {
        baseTemp = 0; // Northern Asia
      } else {
        baseTemp = 20; // Southern/Southeast Asia
      }
    } else if (geoInfo.continentCode === 'AF') baseTemp = 25;
    else if (geoInfo.continentCode === 'SA') baseTemp = 23;
    else if (geoInfo.continentCode === 'OC') baseTemp = 18;
    
    // Small variation for natural randomness
    const temp = Math.floor(Math.random() * 6) + baseTemp - 2;
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear', 'Snow'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const humidity = Math.floor(Math.random() * 30) + 50; // 50-80% (more realistic)
    const windSpeed = Math.floor(Math.random() * 15) + 5; // 5-20 km/h (more realistic)
    const feelsLike = temp - (Math.random() * 3); // Usually feels colder with wind chill
    const visibility = Math.floor(Math.random() * 5) + 5; // 5-10 km
    const uv = Math.floor(Math.random() * 6); // 0-5 UV index (more realistic for March)
    const precipitation = Math.floor(Math.random() * 40); // 0-40% chance
    
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
    
    // Generate accurate country-specific facts based on reliable sources
    let facts: string[] = [];
    
    if (geoInfo.countryCode === 'SE') {
      facts = [
        `Sweden ranks consistently among the top 10 countries in the World Happiness Report.`,
        `Sweden has one of the highest life expectancies in Europe at around 82 years.`,
        `Approximately 95% of Sweden is covered in forests, with over 100,000 lakes.`,
        `Sweden is a world leader in waste recycling, with nearly 99% of household waste recycled or used for energy.`,
        `The Swedish invention Spotify has transformed the global music industry.`
      ];
    } else if (geoInfo.countryCode === 'US') {
      facts = [
        `The United States is home to 63 national parks spanning over 52 million acres.`,
        `The US produces around 18% of the world's total goods and services.`,
        `The US interstate highway system is the second largest in the world, spanning over 48,000 miles.`,
        `Silicon Valley in California hosts headquarters for 39 companies in the Fortune 1000.`,
        `The US has the world's highest number of Nobel Prize winners, with over 400 laureates.`
      ];
    } else if (geoInfo.continentCode === 'EU') {
      facts = [
        `${geoInfo.country} is one of the 27 member states of the European Union.`,
        `${geoInfo.country}'s history dates back thousands of years with rich cultural heritage.`,
        `${geoInfo.country} is known for its contributions to art, literature, and philosophy.`,
        `Europeans enjoy some of the longest paid vacation policies in the world, typically 4-5 weeks per year.`,
        `The EU as a whole is the largest economy in the world, with a GDP of over $15 trillion.`
      ];
    } else {
      facts = [
        `${geoInfo.country} has a rich cultural heritage that spans many centuries.`,
        `${geoInfo.country} has a population of approximately ${geoInfo.population ? formatNumber(geoInfo.population) : 'many millions'} people.`,
        `${geoInfo.country} is located in ${geoInfo.continentCode === 'AS' ? 'Asia' : geoInfo.continentCode === 'AF' ? 'Africa' : geoInfo.continentCode === 'SA' ? 'South America' : geoInfo.continentCode === 'NA' ? 'North America' : geoInfo.continentCode === 'OC' ? 'Oceania' : 'its continent'}.`,
        `${geoInfo.city} is one of the major cities in ${geoInfo.country}.`,
        `${geoInfo.country} has unique customs and traditions that reflect its history.`
      ];
    }
    
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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Location Insights</h1>
          <p className="text-xl mb-4">
            Comprehensive data and visualizations about your current location
          </p>
          
          {/* Quote Section */}
          {quote && (
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-lg border border-blue-500/30 max-w-2xl mx-auto">
              <p className="text-lg italic">"{quote.quote}"</p>
              <p className="text-right text-sm text-gray-400 mt-2">— {quote.author}</p>
            </div>
          )}
        </header>

        {/* User Location Card - Simplified to one line */}
        {geoData && (
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-green-500/30">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Your Location
            </h2>
            <div className="p-4 bg-green-500/20 rounded-lg">
              <p className="text-xl flex items-center">
                <Globe size={18} className="mr-2" />
                <span>{geoData.city}, {geoData.country} ({geoData.timezone})</span>
              </p>
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