import React, { useState } from 'react';
import { Github, ExternalLink, Star, GitFork } from 'lucide-react';
import { Repository } from '../types';

interface ModernViewProps {
  repositories: Repository[];
  loading: boolean;
  error: string | null;
}

export const ModernView: React.FC<ModernViewProps> = ({ repositories, loading, error }) => {
  const [filter, setFilter] = useState('');
  
  const filteredRepos = repositories.filter(repo => 
    repo.name.toLowerCase().includes(filter.toLowerCase()) ||
    repo.language?.toLowerCase().includes(filter.toLowerCase()) ||
    repo.description?.toLowerCase().includes(filter.toLowerCase())
  );

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
        <p>Error loading repositories. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Yakoub's Projects</h1>
          <div className="flex items-center justify-center gap-2 mb-8">
            <a
              href="https://github.com/6ogo/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
            >
              <Github size={24} />
              <span className="text-xl">github.com/6ogo</span>
            </a>
          </div>
          <input
            type="text"
            placeholder="Filter by name, language, or description..."
            className="w-full max-w-md px-4 py-2 rounded-lg bg-gray-900 border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepos.map(repo => (
            <div
              key={repo.name}
              className="bg-gray-900 rounded-lg p-6 transform hover:-translate-y-2 transition-all duration-300 border border-green-500/30 hover:border-green-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{repo.name}</h2>
                <div className="flex space-x-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500 hover:text-green-400 transition-colors"
                  >
                    <Github size={20} />
                  </a>
                  {repo.homepage && (
                    <a
                      href={repo.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-400 transition-colors"
                    >
                      <ExternalLink size={20} />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-gray-400 mb-4 h-12 line-clamp-2">
                {repo.description || 'No description available'}
              </p>

              {repo.language && (
                <div className="mb-4">
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
                    {repo.language}
                  </span>
                </div>
              )}

              <div className="flex space-x-4 text-sm text-gray-400">
                <div className="flex items-center">
                  <Star size={16} className="mr-1" />
                  {repo.stars}
                </div>
                <div className="flex items-center">
                  <GitFork size={16} className="mr-1" />
                  {repo.forks}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}