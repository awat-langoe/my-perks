import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable, shareReplay } from "rxjs";
import { Source } from "./model/source.model";

@Injectable({
  providedIn: "root",
})
export class SourcesService {
  private readonly sourceCacheBySourceId = new Map<
    string,
    Observable<Source | null>
  >();

  private readonly httpClient = inject(HttpClient);

  getSource(id: string): Observable<Source | null> {
    const sourceCache$ = this.sourceCacheBySourceId.get(id);
    if (sourceCache$ !== undefined) return sourceCache$;

    const source$ = this.httpClient.get<Source[]>("mock/sources.json").pipe(
      map((sources: Source[]) => {
        return sources.find((source: Source) => source.id === id) ?? null;
      }),
      shareReplay(1),
    );
    this.sourceCacheBySourceId.set(id, source$);

    return source$;
  }
}
