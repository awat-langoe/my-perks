export interface Perk {
  id: string;
  title: string;
  description?: string | null;
  discounts?: string[] | null;
  createdAt: string;
  sourceId: string;
}
