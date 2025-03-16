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
      try {
        console.log('Fetching GitHub repositories...');
        // Fetch repositories
        const reposResponse = await fetch('https://api.github.com/users/6ogo/repos', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          // Add cache control to avoid hitting rate limits
          cache: 'force-cache'
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
              // Add a small delay between requests to avoid rate limiting
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100 * index));
              }
              
              console.log(`Fetching commits for ${repo.name}...`);
              const commitsResponse = await fetch(`https://api.github.com/repos/6ogo/${repo.name}/commits?per_page=1`, {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                },
                cache: 'force-cache'
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
        
        setRepositories(reposWithCommits);
        setLoading(false);
      } catch (err) {
        console.error('GitHub data fetch error:', err);
        // Use mock data as fallback
        console.log('Using mock repository data as fallback');
        setRepositories(mockRepositories);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { repositories, loading, error };
}