// models/balance-account-model.ts
export interface BalanceAccount {
  id: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment';
  isActive: boolean;
  lastUpdated: Date;
}

export interface SignificantBalance {
  account: BalanceAccount;
  isSignificant: boolean;
  threshold: number;
}

export class BalanceAccountModel {
  constructor(
    public id: string = '',
    public accountNumber: string = '',
    public accountName: string = '',
    public balance: number = 0,
    public currency: string = 'USD',
    public accountType: 'checking' | 'savings' | 'credit' | 'investment' = 'checking',
    public isActive: boolean = true,
    public lastUpdated: Date = new Date()
  ) {}

  static fromJson(json: any): BalanceAccountModel {
    return new BalanceAccountModel(
      json.id,
      json.accountNumber,
      json.accountName,
      json.balance,
      json.currency,
      json.accountType,
      json.isActive,
      new Date(json.lastUpdated)
    );
  }

  toJson(): any {
    return {
      id: this.id,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
      balance: this.balance,
      currency: this.currency,
      accountType: this.accountType,
      isActive: this.isActive,
      lastUpdated: this.lastUpdated.toISOString()
    };
  }
}
