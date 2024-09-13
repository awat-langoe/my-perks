import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  Input,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  applyTheme,
  argbFromHex,
  Blend,
  themeFromSourceColor,
} from "@material/material-color-utilities";
import { fromEvent, map, startWith } from "rxjs";

@Directive({
  selector: "[appCustomTheme]",
  standalone: true,
})
export class CustomThemeDirective implements AfterViewInit {
  @Input({ required: true }) appCustomTheme!: string;

  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);

  private readonly darkColorSchemeQuery = "(prefers-color-scheme: dark)";
  private readonly dark$ = fromEvent<MediaQueryListEvent>(
    window.matchMedia(this.darkColorSchemeQuery),
    "change",
  ).pipe(
    map((event: MediaQueryListEvent) => event.matches),
    startWith(window.matchMedia(this.darkColorSchemeQuery).matches),
  );

  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.dark$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark: boolean) => {
        const bodyElement = window.document.body;
        const sourcePrimary = getComputedStyle(bodyElement).getPropertyValue(
          "--md-sys-color-primary",
        );

        const source = Blend.harmonize(
          argbFromHex(this.appCustomTheme),
          argbFromHex(sourcePrimary),
        );
        const theme = themeFromSourceColor(source);
        applyTheme(theme, { target: this.elementRef.nativeElement, dark });
      });
  }
}
