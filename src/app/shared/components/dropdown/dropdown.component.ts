import { Component, input, model, output, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { DropdownOption } from './dropdown.model';

@Component({
  selector: 'app-dropdown, app-filter-dropdown',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dropdown.component.scss',
})
export class DropdownComponent<T = unknown> {
  readonly label = input.required<string>();
  readonly options = input.required<readonly DropdownOption<T>[] | DropdownOption<T>[]>();
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly appearance = input<MatFormFieldAppearance>('outline');

  readonly value = model<T>();
  readonly selectionChange = output<T>();

  /** Updates the selected value and emits the change to the parent. */
  onSelectionChange(newValue: T): void {
    this.value.set(newValue);
    this.selectionChange.emit(newValue);
  }
}
