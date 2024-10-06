import { Source } from "../../sources/model/source.model";

export interface Perk {
  id: string;
  title: string;
  description: string | null;
  discounts: string[] | null;
  createdAt: string;
  source: Source;
}
