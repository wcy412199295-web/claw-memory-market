import { useStore } from '../store';

export default function TagFilter() {
  const getAllTags = useStore(s => s.getAllTags);
  const selectedTags = useStore(s => s.selectedTags);
  const toggleTag = useStore(s => s.toggleTag);
  const tags = getAllTags();

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
            selectedTags.includes(tag)
              ? 'bg-claw-primary/20 text-claw-primary border-claw-primary/30'
              : 'bg-mako-200 text-mako-600 border-mako-300 hover:border-mako-400'
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
