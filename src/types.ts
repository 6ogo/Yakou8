export interface Repository {
  name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  latestCommitDate?: Date;
  latestCommitTitle?: string;
}