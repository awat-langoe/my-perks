import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterOutlet } from "@angular/router";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap,
} from "rxjs";
import { PerkCardComponent } from "./component/perk-card/perk-card.component";
import { SearchComponent } from "./component/search/search.component";
import { Perk } from "./service/perks/model/perk.model";
import { PerksService } from "./service/perks/perks.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PerkCardComponent,
    SearchComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  private readonly perksService = inject(PerksService);
  private readonly perks$ = new BehaviorSubject<Perk[] | undefined>(undefined);

  private readonly searchValue$ = new BehaviorSubject<string | null>(null);

  protected readonly filteredPerks$ = this.perks$.pipe(
    switchMap((perks?: Perk[]) => {
      return this.searchValue$.pipe(
        distinctUntilChanged(),
        debounceTime(300),
        map((value: string | null) => {
          const trimmedValue = value?.trim() ?? "";
          if (trimmedValue.length === 0) return perks;

          return perks?.filter((perk: Perk) => {
            const trimmedLowerCaseValue = trimmedValue.toLowerCase();

            const title = perk.title.toLowerCase();
            const description = perk.description?.toLowerCase();
            const discounts = perk.discounts?.join("").toLowerCase();
            const sourceTitle = perk.source.title.toLowerCase();

            return (
              title.includes(trimmedLowerCaseValue) ||
              description?.includes(trimmedLowerCaseValue) ||
              discounts?.includes(trimmedLowerCaseValue) ||
              sourceTitle.includes(trimmedLowerCaseValue)
            );
          });
        }),
      );
    }),
    map((perks?: Perk[]) => {
      return perks?.sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
    }),
    shareReplay(1),
  );

  protected isPerksEmpty$ = this.perks$.pipe(
    map((perks?: Perk[]) => perks?.length === 0),
  );

  ngOnInit(): void {
    this.loadPerks();
  }

  protected onSearchValueChanged(value: string | null): void {
    this.searchValue$.next(value);
  }

  protected async loadPerks(): Promise<void> {
    // Make sure loading state is shown while loading perks
    if (this.perks$.value !== undefined) this.perks$.next(undefined);

    const perks = await this.perksService.getPerks();
    this.perks$.next(perks);
  }
}
