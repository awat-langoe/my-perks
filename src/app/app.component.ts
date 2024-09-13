import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterOutlet } from "@angular/router";
import { CustomThemeDirective } from "./directive/custom-theme.directive";
import { PerksService } from "./service/perks/perks.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CustomThemeDirective,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  private readonly perksService = inject(PerksService);
  protected readonly perks$ = this.perksService.getPerks();
}
