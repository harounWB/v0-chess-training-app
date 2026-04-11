// Cryptocurrency and network donation data
export const CRYPTO_DATA = {
  LTC: {
    name: 'Litecoin',
    symbol: 'LTC',
    icon: 'https://cryptologos.cc/logos/litecoin-ltc-logo.svg',
    networks: {
      LTC: {
        name: 'Litecoin',
        address: 'Lh2z3F6MJ83pK5iyMEswfwSVrKchagEhef',
      },
    },
  },
  USDT: {
    name: 'Tether',
    symbol: 'USDT',
    icon: 'https://cryptologos.cc/logos/tether-usdt-logo.svg',
    networks: {
      TRC20: {
        name: 'TRC20 (TRON)',
        address: 'TUdZVxBbQy4gVLeJbhk6LyNdcKbEYiuQcB',
      },
      BSC: {
        name: 'BSC (BEP20)',
        address: '0xc105f5a55ece8ef3798779951f792403f89eba3c',
      },
    },
  },
  SOL: {
    name: 'Solana',
    symbol: 'SOL',
    icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg',
    networks: {
      SOL: {
        name: 'Solana',
        address: '6XZs2nWMCvYzfZqa43T98vzskBCfgyLup5PHjcGPPPKs',
      },
      BSC: {
        name: 'BSC (BEP20)',
        address: '0xc105f5a55ece8ef3798779951f792403f89eba3c',
      },
    },
  },
  BINANCE: {
    name: 'Binance Pay',
    symbol: 'BINANCE',
    icon: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.svg',
    networks: {
      BINANCE_ID: {
        name: 'Binance ID',
        address: '821326000',
      },
    },
  },
};

export type CryptoKey = keyof typeof CRYPTO_DATA;
export type CryptoInfo = (typeof CRYPTO_DATA)[CryptoKey];
export type NetworkKey<T extends CryptoKey> = keyof (typeof CRYPTO_DATA)[T]['networks'];
