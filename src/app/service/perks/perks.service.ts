import { inject, Injectable } from "@angular/core";
import {
  collectionGroup,
  DocumentData,
  Firestore,
  getDocsFromCache,
  getDocsFromServer,
  QueryDocumentSnapshot,
} from "@angular/fire/firestore";
import { MetadataService } from "../metadata/metadata.service";
import { SourcesService } from "../sources/sources.service";
import { PerkDbModel } from "./model/perk-db.model";
import { Perk } from "./model/perk.model";

@Injectable({
  providedIn: "root",
})
export class PerksService {
  private readonly firestore = inject(Firestore);

  private readonly metadataService = inject(MetadataService);

  private readonly sourcesService = inject(SourcesService);

  async getPerks(): Promise<Perk[]> {
    const perksQuery = collectionGroup(this.firestore, "perks");

    const isCacheValid = await this.metadataService.isCacheValid();
    const perksQuerySnapshot = await (isCacheValid
      ? getDocsFromCache(perksQuery)
      : getDocsFromServer(perksQuery));
    const perksPromises = perksQuerySnapshot.docs.map(
      async (
        perkQueryDocSnapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
      ): Promise<Perk[]> => {
        const perkDbModel = perkQueryDocSnapshot.data() as PerkDbModel;
        const source = await this.sourcesService.getSource(
          perkDbModel.sourceId,
        );
        if (source === null) return [];

        return [
          {
            id: perkQueryDocSnapshot.id,
            title: perkDbModel.title,
            description: perkDbModel.description,
            discounts: perkDbModel.discounts,
            createdAt: perkDbModel.createdAt.toString(),
            source,
          },
        ];
      },
    );

    return await Promise.all(perksPromises).then((perks: Perk[][]) =>
      perks.flat(),
    );
  }
}
