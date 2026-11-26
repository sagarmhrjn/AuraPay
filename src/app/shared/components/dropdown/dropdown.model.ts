export interface DropdownOption<T = unknown> {
  value: T;
  label: string;
  disabled?: boolean;
}
