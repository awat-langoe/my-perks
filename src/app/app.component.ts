import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterOutlet } from "@angular/router";
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  map,
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
    MatToolbarModule,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private readonly perksService = inject(PerksService);
  private readonly perks$ = this.perksService.getPerks();

  private readonly searchValue$ = new BehaviorSubject<string | null>(null);

  protected readonly filteredPerks$ = this.searchValue$.pipe(
    distinctUntilChanged(),
    debounceTime(300),
    switchMap((value: string | null) => {
      return this.perks$.pipe(
        map((perks: Perk[]) => {
          const trimmedValue = value?.trim() ?? "";
          if (trimmedValue.length === 0) return perks;

          return perks.filter((perk: Perk) => {
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
    map((perks: Perk[]) => {
      return perks.sort((a, b) => {
        return a.title.localeCompare(b.title);
      });
    }),
  );

  onSearchValueChanged(value: string | null): void {
    this.searchValue$.next(value);
  }
}
