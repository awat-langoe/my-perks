import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterOutlet } from "@angular/router";
import { PerkCardComponent } from "./component/perk-card/perk-card.component";
import { PerksService } from "./service/perks/perks.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, PerkCardComponent, MatToolbarModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private readonly perksService = inject(PerksService);
  protected readonly perks$ = this.perksService.getPerks();
}
