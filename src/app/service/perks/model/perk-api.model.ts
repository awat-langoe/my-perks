export interface PerkApiModel {
  id: string;
  title: string;
  description?: string;
  discounts?: string[];
  scrapeTimestamp: string;
  sourceId: string;
}
