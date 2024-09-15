import { DatePipe } from "@angular/common";
import { Component, Input } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { CustomThemeDirective } from "../../directive/custom-theme.directive";
import { Perk } from "../../service/perks/model/perk.model";

@Component({
  selector: "app-perk-card",
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CustomThemeDirective,
    DatePipe,
  ],
  templateUrl: "./perk-card.component.html",
  styleUrl: "./perk-card.component.scss",
})
export class PerkCardComponent {
  @Input({ required: true }) perk!: Perk;
}
