import { useState, useEffect } from 'react';
import { Repository } from '../types';

export function useGitHubData() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api.github.com/users/6ogo/repos');
        if (!response.ok) throw new Error('Failed to fetch repositories');
        
        const data = await response.json();
        const repos: Repository[] = data.map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        }));
        
        setRepositories(repos);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { repositories, loading, error };
}