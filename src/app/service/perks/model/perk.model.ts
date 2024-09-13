import { Source } from "../../sources/model/source.model";

export interface Perk {
  id: string;
  title: string;
  description?: string;
  discounts?: string[];
  scrapeTimestamp: string;
  source: Source;
}
