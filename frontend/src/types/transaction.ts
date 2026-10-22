export interface Transaction {
  amount: number;
  hour: number;
  new_device: 0 | 1;
  foreign_country: 0 | 1;
  transactions_last_hour: number;
}