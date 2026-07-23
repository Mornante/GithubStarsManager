// Trimmed linguist color map for common languages; unlisted languages fall back to gray.
export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Lua: '#000080',
  Zig: '#ec915c',
}

export function languageColor(language: string | null | undefined): string {
  if (!language) return '#8b949e'
  return LANGUAGE_COLORS[language] ?? '#8b949e'
}
