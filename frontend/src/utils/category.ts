export function categoryMatches(categories: string[], selected: string) {
  if (selected === 'All') return true;
  const aliases: Record<string, string[]> = {
    Burgers: ['burger'],
    Coffe: ['coffee'],
    Desert: ['dessert', 'ice cream'],
    Healthy: ['healthy', 'vegetarian', 'vegan'],
  };
  const terms = aliases[selected] ?? [selected.toLowerCase()];
  return categories.some(category => terms.some(term => category.toLowerCase().includes(term)));
}
