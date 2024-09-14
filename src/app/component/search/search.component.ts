import { Component, EventEmitter, Output } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

@Component({
  selector: "app-search",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchComponent {
  protected readonly searchFormControl = new FormControl<string | null>("");

  @Output() value = new EventEmitter<string | null>();

  protected showClearButton = false;

  constructor() {
    this.searchFormControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value: string | null) => {
        this.showClearButton = value !== null && value.length > 0;

        this.value.emit(value);
      });
  }
}
