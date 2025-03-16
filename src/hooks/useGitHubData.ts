import { useState, useEffect } from 'react';
import { Repository } from '../types';

export function useGitHubData() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch repositories
        const reposResponse = await fetch('https://api.github.com/users/6ogo/repos');
        if (!reposResponse.ok) throw new Error('Failed to fetch repositories');
        
        const reposData = await reposResponse.json();
        const reposWithoutCommits: Repository[] = reposData.map((repo: any) => ({
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          homepage: repo.homepage,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
        }));
        
        // Fetch latest commit for each repository
        const reposWithCommits = await Promise.all(
          reposWithoutCommits.map(async (repo) => {
            try {
              const commitsResponse = await fetch(`https://api.github.com/repos/6ogo/${repo.name}/commits?per_page=1`);
              
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
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { repositories, loading, error };
}