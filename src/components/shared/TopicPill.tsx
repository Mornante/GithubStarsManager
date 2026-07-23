export default function TopicPill({ topic }: { topic: string }) {
  return (
    <span className="text-xs rounded-full bg-accent-fg/10 text-accent-fg px-2 py-0.5">{topic}</span>
  )
}
