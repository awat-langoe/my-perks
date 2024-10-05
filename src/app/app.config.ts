import { provideHttpClient } from "@angular/common/http";
import {
  ApplicationConfig,
  isDevMode,
  provideZoneChangeDetection,
} from "@angular/core";
import { getApp, initializeApp, provideFirebaseApp } from "@angular/fire/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  provideFirestore,
} from "@angular/fire/firestore";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { routes } from "./app.routes";
import { firebaseOptions } from "./firebase/firebase-options";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
    provideFirebaseApp(() => initializeApp(firebaseOptions)),
    provideFirestore(() => {
      return initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    }),
  ],
};
