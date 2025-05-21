export interface SidebarProps {
  sidebarOpen: boolean;
  distance: string;
  setDistance: (value: string) => void;
  checkedCategories: string[];
  handleCategoryCheck: (category: string) => void;
  price: string;
  setPrice: (value: string) => void;
  resetFilters: () => void;
  customSections?: { title: string; items: string[] }[];
}
