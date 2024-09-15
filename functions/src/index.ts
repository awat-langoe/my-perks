import * as puppeteerBrowsers from "@puppeteer/browsers";
import { initializeApp } from "firebase-admin/app";
import {
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { onSchedule, ScheduledEvent } from "firebase-functions/scheduler";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as puppeteer from "puppeteer-core";
import { Perk } from "./model/perk";
import { Source, sourceConverter } from "./model/source";

initializeApp();
const firestore = getFirestore();

let browser: puppeteer.Browser | null = null;

// Schedule at 12:05 on Monday and Thursday
export const scrape = onSchedule(
  {
    schedule: "05 12 * * 1,4",
    timeZone: "Europe/Oslo",
    region: "europe-west1",
    memory: "1GiB",
    timeoutSeconds: 300, // 5 minutes
  },
  async (event: ScheduledEvent) => {
    const puppeteerTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "puppeteer"));

    try {
      const sources = await getSources();

      const isBrowserNeeded = sources.some(
        (source) => source.htmlElements !== undefined,
      );
      if (isBrowserNeeded) {
        const installedBrowser = await puppeteerBrowsers.install({
          browser: puppeteerBrowsers.Browser.CHROMIUM,
          cacheDir: os.tmpdir(),
          buildId: "1355643",
        });
        browser = await puppeteer.launch({
          executablePath: installedBrowser.executablePath,
        });
      }

      const scheduleTime = event.scheduleTime;

      for (const source of sources) {
        try {
          const isHtmlScrape = source.htmlElements !== undefined;
          const perks = isHtmlScrape
            ? await htmlScrape(source, scheduleTime)
            : await jsonScrape(source, scheduleTime);

          await clearPerks(source);
          await addPerks(source, perks);
          await updateSource(source, scheduleTime);
        } catch (err: unknown) {
          logger.error(`Failed to scrape perks for ${source.id}:`, err);
        }
      }

      const lastRun = Timestamp.fromDate(new Date(scheduleTime));
      await updateScrapeMetadata(lastRun);
    } catch (err: unknown) {
      logger.error(`Failed to start scraping:`, err);
    } finally {
      browser?.close();
      browser = null;

      fs.rmSync(puppeteerTmpDir, { recursive: true });
    }
  },
);

async function htmlScrape(
  source: Source,
  scheduleTime: string,
): Promise<Perk[]> {
  logger.log(`HTML scraping ${source.id}...`);

  const htmlElements = source.htmlElements;
  if (htmlElements === undefined)
    throw Error("Source.htmlElements is required for HTML scraping.");

  if (browser === null)
    throw Error(
      "Browser is required for HTML scraping, but was not initialized.",
    );

  const page = await browser.newPage();
  try {
    const url = source.url;
    await page.goto(url);

    const selectorToWaitFor =
      htmlElements.waitForSelector ?? htmlElements.perkSelector;
    await page.waitForSelector(selectorToWaitFor, { timeout: 30_000 });

    const perks = await page.evaluate(
      (htmlElements, sourceId: string, createdAt: string): Perk[] => {
        const perkSelector = htmlElements.perkSelector;
        const perkElementsNodeList = document.querySelectorAll(perkSelector);
        const perkElements = Array.from(perkElementsNodeList);

        return perkElements.flatMap((perkElement, index: number): Perk[] => {
          const titleSelector = htmlElements.titleSelector;
          const titleElement = perkElement.querySelector(titleSelector);
          const titleElementAttribute = htmlElements.titleElementAttribute;
          const title =
            titleElementAttribute === undefined
              ? (titleElement?.textContent?.trim() ?? null)
              : (titleElement?.getAttribute(titleElementAttribute) ?? null);
          if (title === null) return [];

          const descriptionSelector = htmlElements.descriptionSelector;
          const descriptionElement =
            descriptionSelector === undefined
              ? null
              : perkElement.querySelector(descriptionSelector);
          const description = descriptionElement?.textContent?.trim();

          const discountSelectors = htmlElements.discountSelectors ?? null;
          const discounts =
            discountSelectors?.flatMap((discountSelector) => {
              const discountElement =
                perkElement.querySelector(discountSelector);
              const discount = discountElement?.textContent?.trim();

              return discount === undefined || discount.length === 0
                ? []
                : discount;
            }) ?? [];

          const id = `${sourceId}-${index}`;

          return [
            {
              id,
              title,
              description,
              discounts,
              createdAt,
              sourceId,
            },
          ];
        });
      },
      htmlElements,
      source.id,
      scheduleTime,
    );

    return perks;
  } finally {
    await page.close();
  }
}

async function jsonScrape(
  source: Source,
  scheduleTime: string,
): Promise<Perk[]> {
  logger.log(`JSON scraping ${source.id}...`);

  const fetch = require("node-fetch");
  const response = await fetch(source.url);
  const body = await response.text();

  const jsonProperties = source.jsonProperties;
  if (jsonProperties === undefined)
    throw Error("Source.jsonProperties is required for JSON scraping.");

  const perksJson = JSON.parse(body);
  const perks = perksJson[jsonProperties.perksProperty].map(
    (perk: any, index: number): Perk => {
      const title = perk[jsonProperties.titleProperty].trim();

      const descriptionProperty = jsonProperties.descriptionProperty;
      const description =
        descriptionProperty === undefined
          ? null
          : (perk[descriptionProperty] as string);

      const discountProperties = jsonProperties.discountProperties;
      const discounts =
        discountProperties?.map((discountProperty) => {
          return perk[discountProperty].trim() as string;
        }) ?? null;

      const id = `${source.id}-${index}`;

      return {
        id,
        title,
        description,
        discounts,
        createdAt: scheduleTime,
        sourceId: source.id,
      };
    },
  );

  return perks;
}

async function getSources(): Promise<Source[]> {
  const sourcesQuerySnapshot = await firestore
    .collection("sources")
    .withConverter(sourceConverter)
    .get();

  return sourcesQuerySnapshot.docs.map(
    (sourceQueryDocSnapshot: QueryDocumentSnapshot<Source>) =>
      sourceQueryDocSnapshot.data(),
  );
}

async function updateSource(
  source: Source,
  lastSuccessfulRun: string,
): Promise<void> {
  await firestore
    .collection("sources")
    .doc(source.id)
    .update({ lastSuccessfulRun });
}

async function addPerks(source: Source, perks: Perk[]): Promise<void> {
  const sourceDocRef = firestore.collection("sources").doc(source.id);

  const batch = firestore.batch();
  perks.forEach((perk: Perk) => {
    const perkRef = sourceDocRef.collection("perks").doc();
    batch.create(perkRef, perk);
  });

  await batch.commit();
}

async function clearPerks(source: Source): Promise<void> {
  const firebaseTools = require("firebase-tools");

  const path = `sources/${source.id}/perks`;
  const options = {
    project: process.env.GCLOUD_PROJECT,
    recursive: true,
    force: true,
    token: process.env.FB_TOKEN,
  };

  await firebaseTools.firestore.delete(path, options);
}

async function updateScrapeMetadata(lastRun: Timestamp) {
  firestore.collection("metadata").doc("scrape").set({ lastRun });
}
