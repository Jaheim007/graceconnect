import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { COUNTRIES, countryFlag } from '@/lib/countries';
import { useI18n } from '@/i18n/I18nContext';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  placeholder?: string;
}

export function CountrySelector({ value, onChange, className, placeholder }: CountrySelectorProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.nameFr.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const selected = COUNTRIES.find(c => c.code === value?.toUpperCase());
  const displayName = selected ? (isFr ? selected.nameFr : selected.name) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between font-normal', className)}
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              <span className="text-base leading-none">{countryFlag(selected.code)}</span>
              <span className="truncate">{displayName}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder || (isFr ? 'Sélectionner un pays' : 'Select a country')}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="h-4 w-4 mr-2 opacity-50" />
          <Input
            placeholder={isFr ? 'Rechercher un pays…' : 'Search country…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 p-0 h-8 focus-visible:ring-0 shadow-none"
          />
        </div>
        <ScrollArea className="h-[280px]">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {isFr ? 'Aucun pays trouvé' : 'No country found'}
            </p>
          ) : (
            <div className="p-1">
              {filtered.map(c => (
                <button
                  key={c.code}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer',
                    value?.toUpperCase() === c.code && 'bg-accent'
                  )}
                  onClick={() => { onChange(c.code); setOpen(false); setSearch(''); }}
                >
                  <span className="text-base leading-none w-6 text-center">{countryFlag(c.code)}</span>
                  <span className="flex-1 text-left truncate">{isFr ? c.nameFr : c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.code}</span>
                  {value?.toUpperCase() === c.code && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
