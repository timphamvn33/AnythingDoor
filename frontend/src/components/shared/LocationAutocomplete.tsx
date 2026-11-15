import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { getLocationSuggestions } from '@/services/discovery.service';

export default function LocationAutocomplete({
  id,
  value,
  onChange,
  placeholder,
  inputClassName,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputClassName?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = `${id}-suggestions`;

  useEffect(() => {
    const query = value.trim();
    if (!enabled || query.length < 3 || query.length > 200) {
      setSuggestions([]);
      setError('');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getLocationSuggestions(query, controller.signal);
        if (!controller.signal.aborted) setSuggestions(result);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setError(
            axios.isAxiosError(caught) && typeof caught.response?.data?.message === 'string'
              ? caught.response.data.message
              : 'Address suggestions are unavailable; you can still enter a location manually.',
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, enabled]);

  const selectSuggestion = (suggestion: string) => {
    setEnabled(false);
    onChange(suggestion);
    setSuggestions([]);
    setActiveIndex(-1);
    setOpen(false);
  };

  return (
    <div
      className="relative w-full"
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <label className="sr-only" htmlFor={id}>
        US location
      </label>
      <Input
        id={id}
        className={inputClassName}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && suggestions.length > 0}
        aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)}
        onChange={event => {
          setSuggestions([]);
          setError('');
          setLoading(false);
          setActiveIndex(-1);
          setEnabled(true);
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && suggestions.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(index => Math.min(index + 1, suggestions.length - 1));
          } else if (event.key === 'ArrowUp' && suggestions.length > 0) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex(index => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && open && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
          } else if (event.key === 'Enter') {
            setOpen(false);
          } else if (event.key === 'Escape') {
            setOpen(false);
            setActiveIndex(-1);
          }
        }}
        placeholder={placeholder}
      />
      {open && (loading || error || suggestions.length > 0) && (
        <div className="mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-sm text-gray-600" role="status">
              Finding locations…
            </p>
          )}
          {error && (
            <p className="px-3 py-2 text-sm text-red-700" role="status">
              {error}
            </p>
          )}
          <div id={listId} role="listbox">
            {suggestions.map((suggestion, index) => (
              <button
                id={`${listId}-${index}`}
                key={suggestion}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`block w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 ${index === activeIndex ? 'bg-gray-100' : ''}`}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
