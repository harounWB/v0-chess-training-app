'use client';

import React, { useState, useMemo } from 'react';
import { CRYPTO_DATA, CryptoKey } from '@/lib/cryptoData';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { Header } from '@/components/Header';

export default function SupportPage() {
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoKey | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    <main className="min-h-screen bg-gray-950 text-gray-100 py-12 px-4">
      <Header />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-white">Support the Project</h1>
          <p className="text-gray-400 leading-relaxed">
            This platform was built for the chess community — to help players train, improve, and enjoy the game
            completely for free.
          </p>
          <p className="text-gray-400 leading-relaxed mt-4">
            If you find it useful and want to support the project, you can donate using crypto. Every contribution
            helps improve the platform and keep it running.
            My Telegram for PGN files : bluhadtogo
          </p>
        </div>

        {/* Crypto Selection */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-white">Select Cryptocurrency</h2>
          <div className="space-y-2">
            {cryptoList.map(([key, crypto]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedCrypto(key);
                  setSelectedNetwork(null);
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 ${selectedCrypto === key
                    ? 'bg-purple-600/30 border border-purple-500 shadow-lg shadow-purple-500/20'
                    : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                  }`}
              >
                <img
                  src={crypto.icon}
                  alt={crypto.name}
                  className="w-8 h-8 flex-shrink-0 object-contain"
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

        {/* Network Selection */}
        {selectedCryptoData && networkList.length > 0 && (
          <div className="mb-8 animate-in fade-in duration-300">
            <h2 className="text-lg font-semibold mb-4 text-white">Select Network</h2>
            <div className="space-y-2">
              {networkList.map(([networkKey, networkData]) => (
                <button
                  key={networkKey}
                  onClick={() => setSelectedNetwork(networkKey)}
                  className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 text-left ${selectedNetwork === networkKey
                      ? 'bg-purple-600/30 border border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800 hover:border-gray-600'
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

        {/* Address Display & QR Code */}
        {selectedNetworkData && (
          <div className="mb-8 animate-in fade-in duration-300">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              {/* Network Name */}
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Network</p>
                <p className="text-white font-medium">{selectedNetworkData.name}</p>
              </div>

              {/* Address */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">Address</p>
                <div className="flex items-center gap-2 bg-gray-900/50 p-3 rounded-lg mb-3 break-all">
                  <code className="text-sm text-gray-300 flex-1">{selectedNetworkData.address}</code>
                  <button
                    onClick={handleCopyAddress}
                    className="flex-shrink-0 p-2 hover:bg-gray-700 rounded transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">{copied ? 'Copied!' : 'Click to copy'}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-6 p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={selectedNetworkData.address}
                  size={200}
                  level="H"
                  marginSize={2}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>

              {/* Safety Warning */}
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  ⚠️ Make sure to send using the correct network. Sending funds using the wrong network may result in
                  permanent loss.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <div className="text-center">
          <a
            href="/upload"
            className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
          >
            ← Back to Upload
          </a>
        </div>
      </div>
    </main>
  );
}
