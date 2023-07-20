import { BalanceResponse } from '@unique-nft/sdk';

export interface BalanceData {
  name: string;
  address: string;
  balance: BalanceResponse;
}

export interface ChainBalanceData {
  name: string;
  balances: BalanceData[];
}

export const markdownTemplate = `{index}) {name} - *{balance}*
\`{address}\``;
