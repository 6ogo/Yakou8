import { useState, useEffect } from 'react';
import { Repository } from '../types';

// Mock data to use as fallback when API calls fail
const mockRepositories: Repository[] = [
  {
    name: 'Yakou8',
    description: 'A modern portfolio and visualization application',
    url: 'https://github.com/6ogo/Yakou8',
    homepage: null,
    language: 'TypeScript',
    stars: 5,
    forks: 1,
    latestCommitDate: new Date('2025-03-15T18:30:00Z'),
    latestCommitTitle: 'Add visualization components and runner game',
  },
  {
    name: 'Car-Racer',
    description: '3D-Game with Three.js',
    url: 'https://github.com/6ogo/Car-Racer',
    homepage: 'https://localhost',
    language: 'JavaScript',
    stars: 12,
    forks: 3,
    latestCommitDate: new Date('2025-03-10T14:20:00Z'),
    latestCommitTitle: 'Update dependencies and fix mobile layout',
  },
  {
    name: 'Weather-App',
    description: 'Real-time weather application with forecasts',
    url: 'https://github.com/6ogo/Weather-App',
    homepage: null,
    language: 'JavaScript',
    stars: 8,
    forks: 2,
    latestCommitDate: new Date('2025-02-28T09:45:00Z'),
    latestCommitTitle: 'Implement dark mode and location detection',
  },
];

export function useGitHubData() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Check for cached data first - with expiration time of 1 hour
      const cachedData = localStorage.getItem('githubRepos');
      const cacheTimestamp = localStorage.getItem('githubReposTimestamp');
      
      const cacheIsValid = 
        cachedData && 
        cacheTimestamp && 
        (Date.now() - parseInt(cacheTimestamp) < 3600000); // 1 hour in milliseconds
      
      if (cacheIsValid) {
        try {
          const parsedData = JSON.parse(cachedData);
          // Convert string dates back to Date objects
          const reposWithDates = parsedData.map((repo: any) => ({
            ...repo,
            latestCommitDate: repo.latestCommitDate ? new Date(repo.latestCommitDate) : undefined
          }));
          setRepositories(reposWithDates);
          setLoading(false);
          console.log('Using cached GitHub data');
          return;
        } catch (err) {
          console.error('Error parsing cached GitHub data:', err);
          // Continue with API fetch if cache parse failed
        }
      }

      try {
        console.log('Fetching GitHub repositories...');
        
        // Get GitHub token from environment
        const token = import.meta.env.VITE_GITHUB_TOKEN;
        
        // Debug: Check if token is available
        if (!token) {
          console.warn('GitHub token is not available in environment variables');
        } else {
          console.log('GitHub token is available:', token.substring(0, 4) + '...');
        }
        
        // Prepare headers with token if available
        const headers: HeadersInit = {
          'Accept': 'application/vnd.github.v3+json',
        };
        
        if (token) {
          // GitHub API expects "Bearer" format for newer tokens
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Fetch repositories
        const reposResponse = await fetch('https://api.github.com/users/6ogo/repos', {
          headers,
          // Use no-store to ensure fresh data
          cache: 'no-store'
        });
        
        // Check for rate limiting or other errors
        if (!reposResponse.ok) {
          const rateLimitRemaining = reposResponse.headers.get('X-RateLimit-Remaining');
          console.error(`GitHub API error: ${reposResponse.status} ${reposResponse.statusText}`);
          console.error(`Rate limit remaining: ${rateLimitRemaining}`);
          
          if (reposResponse.status === 403 && rateLimitRemaining === '0') {
            throw new Error('GitHub API rate limit exceeded. Try again later.');
          } else {
            throw new Error(`Failed to fetch repositories: ${reposResponse.status}`);
          }
        }
        
        const reposData = await reposResponse.json();
        console.log(`Fetched ${reposData.length} repositories`);
        
        const reposWithoutCommits: Repository[] = reposData.map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        }));
        
        // Fetch latest commit for each repository with a delay to avoid rate limiting
        const reposWithCommits = await Promise.all(
          reposWithoutCommits.map(async (repo, index) => {
            try {
              // Add a longer delay between requests to avoid rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 300 * index));
              }
              
              console.log(`Fetching commits for ${repo.name}...`);
              const commitsResponse = await fetch(`https://api.github.com/repos/6ogo/${repo.name}/commits?per_page=1`, {
                headers, // Use the same headers with auth token
                cache: 'no-store'
              });
              
              if (commitsResponse.ok) {
                const commitsData = await commitsResponse.json();
                
                if (commitsData && commitsData.length > 0) {
                  const latestCommit = commitsData[0];
                  return {
                    ...repo,
                    latestCommitDate: new Date(latestCommit.commit.author.date),
                    latestCommitTitle: latestCommit.commit.message.split('\n')[0], // Get first line of commit message
                  };
                }
              } else {
                console.warn(`Failed to fetch commits for ${repo.name}: ${commitsResponse.status}`);
              }
              return repo; // Return original repo if no commits found
            } catch (commitErr) {
              console.error(`Error fetching commits for ${repo.name}:`, commitErr);
              return repo; // Return original repo if error occurs
            }
          })
        );
        
        // Store the data in the state
        setRepositories(reposWithCommits);
        
        // Cache the data and timestamp
        try {
          localStorage.setItem('githubRepos', JSON.stringify(reposWithCommits));
          localStorage.setItem('githubReposTimestamp', Date.now().toString());
          console.log('GitHub data cached successfully');
        } catch (cacheErr) {
          console.warn('Failed to cache GitHub data:', cacheErr);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('GitHub data fetch error:', err);
        
        // Check if we have cached data even if it's expired
        const cachedData = localStorage.getItem('githubRepos');
        if (cachedData) {
          try {
            const parsedData = JSON.parse(cachedData);
            const reposWithDates = parsedData.map((repo: any) => ({
              ...repo,
              latestCommitDate: repo.latestCommitDate ? new Date(repo.latestCommitDate) : undefined
            }));
            console.log('Using expired cached GitHub data as fallback');
            setRepositories(reposWithDates);
          } catch (cacheErr) {
            // If cache parsing fails, fall back to mock data
            console.log('Using mock repository data as fallback');
            setRepositories(mockRepositories);
          }
        } else {
          // Use mock data as fallback if no cache exists
          console.log('Using mock repository data as fallback');
          setRepositories(mockRepositories);
        }
        
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { repositories, loading, error };
}