import { Component, input, output, model, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule
],
  templateUrl: './search-input.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search-input.component.scss',
})
export class SearchInputComponent {
  readonly placeholder = input<string>('Search...');

  /** Two-way bindable value */
  readonly value = model<string>('');

  /** Fires on every keystroke (debounce should be handled by the parent) */
  readonly inputChange = output<string>();

  /** Fires when the user presses Enter */
  readonly search = output<string>();

  /** Emits the current value when the user types. */
  onInput(): void {
    this.inputChange.emit(this.value());
  }

  /** Emits the current value when the user submits with Enter. */
  onEnter(): void {
    this.search.emit(this.value());
  }

  /** Clears the search value and emits the empty input. */
  clear(): void {
    this.value.set('');
    this.inputChange.emit('');
  }
}
