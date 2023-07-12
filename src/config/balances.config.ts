import * as process from 'process';

export interface AddressConfig {
  name: string;
  address: string;
}
export interface BalancesChainConfig {
  name: string;
  marketUrl: string;
  restUrl: string;
  addressList: AddressConfig[];
}

export interface BalancesConfig {
  criticalValue: string;
  unique: BalancesChainConfig;
  quartz: BalancesChainConfig;
}

function parseBalances(
  name: string,
  marketUrl: string,
  restUrl: string,
  addressEnv: string,
): BalancesChainConfig {
  if ((marketUrl || addressEnv) && !restUrl) {
    console.error(`invalid ${name} rest url`);
  }
  return {
    name,
    marketUrl,
    restUrl,
    addressList: addressEnv
      ? addressEnv.split(',').map((line) => {
          const [name, address] = line.split(':');
          return {
            name,
            address,
          };
        })
      : [],
  };
}

export function createBalancesConfig(): BalancesConfig {
  return {
    criticalValue: process.env.BALANCE_CRITICAL_VALUE,
    unique: parseBalances(
      'unique',
      process.env.UNIQUE_MAPI,
      process.env.UNIQUE_REST,
      process.env.UNIQUE_ADDRESS,
    ),
    quartz: parseBalances(
      'quartz',
      process.env.QUARTZ_MAPI,
      process.env.QUARTZ_REST,
      process.env.QUARTZ_ADDRESS,
    ),
  };
}
