import { inject, Injectable } from "@angular/core";
import { doc, Firestore, getDocFromServer } from "@angular/fire/firestore";
import { SourceDbModel } from "./model/source-db.model";
import { Source } from "./model/source.model";

@Injectable({
  providedIn: "root",
})
export class SourcesService {
  private readonly firestore = inject(Firestore);

  private readonly sourceById = new Map<string, Source | null>();

  async getSource(id: string): Promise<Source | null> {
    const sourceCache = this.sourceById.get(id);
    if (sourceCache !== undefined) return sourceCache;

    const sourceDocRef = doc(this.firestore, "sources", id);
    const sourceDocSnapshot = await getDocFromServer(sourceDocRef);
    const sourceDbModel = sourceDocSnapshot.data() as SourceDbModel | undefined;
    if (sourceDbModel === undefined) return null;

    const source: Source = {
      id: sourceDocSnapshot.id,
      title: sourceDbModel.title,
      color: sourceDbModel.color,
      url: sourceDbModel.url,
      lastSuccessfulRun: sourceDbModel.lastSuccessfulRun,
    };
    this.sourceById.set(id, source);

    return source;
  }
}
