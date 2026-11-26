import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './footer.component.html',
})
export class FooterComponent {}
