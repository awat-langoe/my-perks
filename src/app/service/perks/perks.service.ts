import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { defaultIfEmpty, forkJoin, map, Observable, switchMap } from "rxjs";
import { Source } from "../sources/model/source.model";
import { SourcesService } from "../sources/sources.service";
import { PerkApiModel } from "./model/perk-api.model";
import { Perk } from "./model/perk.model";

@Injectable({
  providedIn: "root",
})
export class PerksService {
  private readonly sourcesService = inject(SourcesService);

  private readonly httpClient = inject(HttpClient);

  getPerks(): Observable<Perk[]> {
    return this.httpClient.get<PerkApiModel[]>("mock/perks.json").pipe(
      switchMap((perkApiModels: PerkApiModel[]) => {
        const perkObservables = forkJoin(
          perkApiModels.map((perkApiModel: PerkApiModel) => {
            return this.sourcesService.getSource(perkApiModel.sourceId).pipe(
              map((source: Source | null): Perk[] => {
                if (source === null) return [];

                return [
                  {
                    id: perkApiModel.id,
                    title: perkApiModel.title,
                    description: perkApiModel.description,
                    discounts: perkApiModel.discounts,
                    scrapeTimestamp: perkApiModel.scrapeTimestamp,
                    source,
                  },
                ];
              }),
            );
          }),
        ).pipe(defaultIfEmpty([]));

        return perkObservables;
      }),
      map((perks: Perk[][]) => perks.flat()),
    );
  }
}
