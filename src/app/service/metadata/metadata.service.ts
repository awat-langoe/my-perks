import { inject, Injectable } from "@angular/core";
import {
  doc,
  Firestore,
  getDocFromCache,
  getDocFromServer,
} from "@angular/fire/firestore";
import { ScrapeMetadata } from "./model/scrape-metadata.model";

@Injectable({
  providedIn: "root",
})
export class MetadataService {
  private readonly firestore = inject(Firestore);

  async isCacheValid(): Promise<boolean> {
    const scrapeMetadataDocRef = doc(this.firestore, "metadata", "scrape");

    const scrapeMetadataDocFromCache = await getDocFromCache(
      scrapeMetadataDocRef,
    ).catch(() => undefined);
    const scrapeMetadataFromCache = scrapeMetadataDocFromCache?.data() as
      | ScrapeMetadata
      | undefined;
    const lastRunFromCache = scrapeMetadataFromCache?.lastRun;

    const scrapeMetadataDocFromServer =
      await getDocFromServer(scrapeMetadataDocRef);
    const scrapeMetadataFromServer = scrapeMetadataDocFromServer.data() as
      | ScrapeMetadata
      | undefined;
    const lastRunFromServer = scrapeMetadataFromServer?.lastRun;
    if (lastRunFromCache === undefined || lastRunFromServer === undefined) {
      return false;
    }

    return lastRunFromCache.nanoseconds >= lastRunFromServer.nanoseconds;
  }
}
