'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AppSettings } from '@/lib/types';
import { useGameContext } from '@/lib/GameContext';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { AlertCircle, Moon, Sun, Paintbrush, Speaker, ShieldCheck } from 'lucide-react';

const boardThemeLabels = {
  classic: 'Classic',
  wood: 'Wood',
  stone: 'Stone',
  purple: 'Purple',
  lichess: 'Lichess',
};

const pieceThemeLabels = {
  neo: 'Neo',
  alpha: 'Classic',
  merida: 'Neo Wood',
  lichess: 'Lichess',
};

const animationLabels = {
  slow: 'Slow',
  normal: 'Normal',
  fast: 'Fast',
};

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    collections,
    createCollection,
    renameCollection,
    deleteCollection,
  } = useGameContext();
  const { setTheme } = useTheme();
  const [pendingSettings, setPendingSettings] = useState<AppSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newCollection, setNewCollection] = useState('');
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState('');

  useEffect(() => {
    setPendingSettings(settings);
  }, [settings]);

  const handleThemeChange = (theme: typeof settings.themeMode) => {
    setPendingSettings(prev => ({ ...prev, themeMode: theme }));
    setSaved(false);
  };

  const handleBoardThemeChange = (theme: typeof settings.boardTheme) => {
    setPendingSettings(prev => ({ ...prev, boardTheme: theme }));
    setSaved(false);
  };

  const handlePieceThemeChange = (theme: typeof settings.pieceTheme) => {
    setPendingSettings(prev => ({ ...prev, pieceTheme: theme }));
    setSaved(false);
  };

  const handleSaveSettings = () => {
    updateSettings(pendingSettings);
    setTheme(pendingSettings.themeMode);
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Header />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Customize your training experience, board themes, sound, and reminders.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Moon className="w-5 h-5 text-purple-400" />
              <div>
                <h2 className="text-lg font-semibold">Theme</h2>
                <p className="text-sm text-gray-400">Choose light, dark, or system mode.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleThemeChange(mode)}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${pendingSettings.themeMode === mode ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}
                >
                  {mode === 'system' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Paintbrush className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold">Board & Pieces</h2>
                <p className="text-sm text-gray-400">Switch board style and chess piece set.</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Board theme</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(boardThemeLabels) as Array<keyof typeof boardThemeLabels>).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handleBoardThemeChange(theme)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${pendingSettings.boardTheme === theme ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}
                  >
                    {boardThemeLabels[theme]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Piece set</p>
              <p className="text-sm text-gray-400 mb-3">Chess.com and Lichess piece sets with cleaner scaling and sharper silhouettes.</p>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(pieceThemeLabels) as Array<keyof typeof pieceThemeLabels>).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => handlePieceThemeChange(theme)}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${pendingSettings.pieceTheme === theme ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}
                  >
                    {pieceThemeLabels[theme]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <Speaker className="w-5 h-5 text-green-400" />
              <div>
                <h2 className="text-lg font-semibold">Sound & Animations</h2>
                <p className="text-sm text-gray-400">Control audio and UI motion settings.</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-gray-800 p-4">
              <div>
                <p className="text-sm font-medium">Sound effects</p>
                <p className="text-xs text-gray-400">Enable or disable move sound effects.</p>
              </div>
              <button
                onClick={() => {
                  setPendingSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
                  setSaved(false);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${pendingSettings.soundEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {pendingSettings.soundEnabled ? 'On' : 'Off'}
              </button>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3">Animation speed</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(animationLabels) as Array<keyof typeof animationLabels>).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPendingSettings(prev => ({ ...prev, animationSpeed: speed }));
                      setSaved(false);
                    }}
                    className={`rounded-2xl border px-4 py-3 text-sm transition ${pendingSettings.animationSpeed === speed ? 'border-purple-500 bg-purple-600/20 text-white' : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'}`}
                  >
                    {animationLabels[speed]}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
              <div>
                <h2 className="text-lg font-semibold">Training</h2>
                <p className="text-sm text-gray-400">Enable blitz mode and reminders.</p>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-gray-700 bg-gray-800 p-4">
                <div>
                  <p className="text-sm font-medium">Blitz training</p>
                  <p className="text-xs text-gray-400">Enable fast-paced timed practice sessions.</p>
                </div>
                <button
                  onClick={() => {
                    setPendingSettings(prev => ({ ...prev, blitzModeEnabled: !prev.blitzModeEnabled }));
                    setSaved(false);
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${pendingSettings.blitzModeEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {pendingSettings.blitzModeEnabled ? 'On' : 'Off'}
                </button>
              </div>
              <div className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">Daily reminder</p>
                    <p className="text-xs text-gray-400">Receive a reminder each day for training.</p>
                  </div>
                  <button
                    onClick={() => {
                      setPendingSettings(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }));
                      setSaved(false);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${pendingSettings.remindersEnabled ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                  >
                    {pendingSettings.remindersEnabled ? 'On' : 'Off'}
                  </button>
                </div>
                    <input
                      type="time"
                      value={pendingSettings.reminderTime}
                      onChange={(e) => {
                        setPendingSettings(prev => ({ ...prev, reminderTime: e.target.value }));
                        setSaved(false);
                      }}
                  className="w-full rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </section>

          <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-white">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-lg font-semibold">Collections</h2>
                <p className="text-sm text-gray-400">Organize chapters into custom collections.</p>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="flex gap-2">
                <input
                  value={newCollection}
                  onChange={(e) => setNewCollection(e.target.value)}
                  placeholder="New collection name"
                  className="flex-1 rounded-2xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-white outline-none"
                />
                <Button
                  onClick={() => {
                    if (newCollection.trim()) {
                      createCollection(newCollection.trim());
                      setNewCollection('');
                    }
                  }}
                  className="px-4 py-3"
                >
                  Add
                </Button>
              </div>
              <div className="space-y-3">
                {collections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-700 p-4 text-sm text-gray-400">
                    No collections yet. Create one to group your openings.
                  </div>
                ) : (
                  collections.map((collection) => (
                    <div key={collection.id} className="rounded-2xl border border-gray-700 bg-gray-800 p-4">
                      <div className="flex items-center justify-between gap-2">
                        {editingCollectionId === collection.id ? (
                          <input
                            value={editingCollectionName}
                            onChange={(e) => setEditingCollectionName(e.target.value)}
                            className="flex-1 rounded-2xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none"
                          />
                        ) : (
                          <div>
                            <div className="text-sm font-medium text-white">{collection.name}</div>
                            <div className="text-xs text-gray-400">{collection.gameIds.length} games</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {editingCollectionId === collection.id ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                if (editingCollectionName.trim()) {
                                  renameCollection(collection.id, editingCollectionName.trim());
                                }
                                setEditingCollectionId(null);
                                setEditingCollectionName('');
                              }}
                              className="px-3"
                            >
                              Save
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingCollectionId(collection.id);
                                setEditingCollectionName(collection.name);
                              }}
                              className="px-3"
                            >
                              Edit
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => deleteCollection(collection.id)} className="px-3">
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
        <div className="mt-8 flex flex-col items-start gap-3">
          <Button
            onClick={handleSaveSettings}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-3xl"
          >
            Save Settings
          </Button>
          {saved && (
            <p className="text-sm text-green-400">Your settings are saved and will be applied immediately.</p>
          )}
        </div>
      </div>
    </main>
  );
}
