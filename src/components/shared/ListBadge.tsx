export default function ListBadge({ name }: { name: string }) {
  return (
    <span className="text-xs rounded-full bg-done-fg/10 text-done-fg px-2 py-0.5 font-medium">{name}</span>
  )
}
