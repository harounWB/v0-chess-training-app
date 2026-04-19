'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CRYPTO_DATA, CryptoKey } from '@/lib/cryptoData';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { Header } from '@/components/Header';

export default function SupportPage() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoKey | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Support OpeningMaster | About the Project';
  }, []);

  const cryptoList = useMemo(() => Object.entries(CRYPTO_DATA) as [CryptoKey, typeof CRYPTO_DATA[CryptoKey]][], []);

  const selectedCryptoData = selectedCrypto ? CRYPTO_DATA[selectedCrypto] : null;
  const networkList = selectedCryptoData ? Object.entries(selectedCryptoData.networks) : [];
  const selectedNetworkData =
    selectedCrypto && selectedNetwork
      ? CRYPTO_DATA[selectedCrypto].networks[selectedNetwork as keyof typeof CRYPTO_DATA[typeof selectedCrypto]['networks']]
      : null;

  const handleCopyAddress = () => {
    if (selectedNetworkData?.address) {
      navigator.clipboard.writeText(selectedNetworkData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-12 text-gray-100">
      <Header />
      <div className="mx-auto max-w-2xl">
        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Support / About</p>
          <h1 className="mb-4 text-4xl font-bold text-white">Support the Project</h1>
          <p className="leading-relaxed text-gray-400">
            This platform was built for the chess community to help players train, improve, and enjoy the game completely for free.
          </p>
          <p className="mt-4 leading-relaxed text-gray-400">
            If you find it useful and want to support the project, you can donate using crypto. Every contribution helps improve the platform and keep it running.
            My Telegram for PGN files : bluhadtogo
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/about-us"
              className="rounded-full bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              Learn About OpeningMaster
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">Select Cryptocurrency</h2>
          <div className="space-y-2">
            {cryptoList.map(([key, crypto]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCrypto(key);
                  setSelectedNetwork(null);
                }}
                className={`flex w-full items-center gap-3 rounded-lg border p-4 transition-all duration-200 ${
                  selectedCrypto === key
                    ? 'border-purple-500 bg-purple-600/30 shadow-lg shadow-purple-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                }`}
              >
                <img
                  src={crypto.icon}
                  alt={crypto.name}
                  className="h-8 w-8 flex-shrink-0 object-contain"
                  loading="lazy"
                />
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{crypto.name}</div>
                  <div className="text-sm text-gray-400">{crypto.symbol}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedCryptoData && networkList.length > 0 && (
          <div className="mb-8 animate-in fade-in duration-300">
            <h2 className="mb-4 text-lg font-semibold text-white">Select Network</h2>
            <div className="space-y-2">
              {networkList.map(([networkKey, networkData]) => (
                <button
                  key={networkKey}
                  onClick={() => setSelectedNetwork(networkKey)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all duration-200 ${
                    selectedNetwork === networkKey
                      ? 'border-purple-500 bg-purple-600/30 shadow-lg shadow-purple-500/20'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{networkData.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedNetworkData && (
          <div className="mb-8 animate-in fade-in duration-300">
            <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-6">
              <div className="mb-4">
                <p className="mb-1 text-sm text-gray-400">Network</p>
                <p className="font-medium text-white">{selectedNetworkData.name}</p>
              </div>

              <div className="mb-6">
                <p className="mb-2 text-sm text-gray-400">Address</p>
                <div className="mb-3 flex items-center gap-2 break-all rounded-lg bg-gray-900/50 p-3">
                  <code className="flex-1 text-sm text-gray-300">{selectedNetworkData.address}</code>
                  <button
                    onClick={handleCopyAddress}
                    className="flex-shrink-0 rounded p-2 transition-colors hover:bg-gray-700"
                    title="Copy address"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-gray-400 hover:text-gray-300" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{copied ? 'Copied!' : 'Click to copy'}</p>
              </div>

              <div className="mb-6 flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG
                  value={selectedNetworkData.address}
                  size={200}
                  level="H"
                  marginSize={2}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>

              <div className="rounded-lg border border-yellow-700/50 bg-yellow-900/20 p-4">
                <p className="text-sm text-yellow-400">
                  Make sure to send using the correct network. Sending funds using the wrong network may result in permanent loss.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center">
          <a href="/upload" className="text-sm text-purple-400 transition-colors hover:text-purple-300">
            Back to Upload
          </a>
        </div>
      </div>
    </main>
  );
}

