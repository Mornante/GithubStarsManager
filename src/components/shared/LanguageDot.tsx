import { languageColor } from '../../config/languageColors'

export default function LanguageDot({ language }: { language: string | null }) {
  if (!language) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: languageColor(language) }} />
      {language}
    </span>
  )
}
