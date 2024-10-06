import { Timestamp } from "@angular/fire/firestore";

export interface PerkDbModel {
  title: string;
  description: string | null;
  discounts: string[] | null;
  createdAt: Timestamp;
  sourceId: string;
}
