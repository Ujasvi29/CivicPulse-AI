import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';

export const CategoryDropdown = ({ value, onChange, departments = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const defaultOption = { id: 'ai-auto', name: 'Let AI determine category' };
  const allOptions = [defaultOption, ...departments];

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = allOptions.findIndex((opt) => opt.name === value);
      const nextIndex =
        e.key === 'ArrowDown'
          ? (currentIndex + 1) % allOptions.length
          : (currentIndex - 1 + allOptions.length) % allOptions.length;
      onChange(allOptions[nextIndex].name);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  const selectedName = value || defaultOption.name;
  const isAiSelected = selectedName === defaultOption.name;

  return (
    <div ref={containerRef} className="w-full">
      {/* ── Trigger Button ── */}
      <button
        type="button"
        id="category-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--foreground)] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {isAiSelected && <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />}
          <span className="truncate">
            {isAiSelected ? '✨ Let AI determine category (Recommended)' : selectedName}
          </span>
        </div>
        <span className="ml-2 shrink-0 text-[var(--muted)]">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* ── Option List — in document flow, pushes content below ── */}
      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby="category-dropdown-trigger"
          className="w-full mt-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-y-auto"
          style={{ maxHeight: '220px' }}
        >
          {allOptions.map((option) => {
            const isSelected = option.name === selectedName;
            const isOptionAi = option.name === defaultOption.name;

            return (
              <li
                key={option.id || option.name}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.name);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors border-b border-[var(--border)] last:border-b-0 ${
                  isSelected
                    ? 'bg-[var(--primary)] text-white font-bold'
                    : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  {isOptionAi && (
                    <Sparkles
                      className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-500'}`}
                    />
                  )}
                  <span className="truncate">
                    {isOptionAi ? 'Let AI determine category (Recommended)' : option.name}
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
