export interface Store {
  id: string | undefined;
  name: string;
  description: string | undefined;
  logoUrl: string | undefined;
  category: string[];
  openHrs: string;
  closeHrs: string;
}
