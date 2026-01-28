import React, { createContext, useContext, useCallback, useRef, useMemo } from "react";

type StopCallback = () => void;

interface AudioManagerContextValue {
  registerPlayer: (id: string, stopCallback: StopCallback) => void;
  unregisterPlayer: (id: string) => void;
  requestPlayback: (id: string) => void;
  stopAll: () => void;
  getCurrentPlayingId: () => string | null;
}

const AudioManagerContext = createContext<AudioManagerContextValue | null>(null);

interface AudioManagerProviderProps {
  children: React.ReactNode;
}

export function AudioManagerProvider({ children }: AudioManagerProviderProps) {
  const playersRef = useRef<Map<string, StopCallback>>(new Map());
  const currentPlayingIdRef = useRef<string | null>(null);

  const registerPlayer = useCallback((id: string, stopCallback: StopCallback) => {
    playersRef.current.set(id, stopCallback);
  }, []);

  const unregisterPlayer = useCallback((id: string) => {
    playersRef.current.delete(id);
    if (currentPlayingIdRef.current === id) {
      currentPlayingIdRef.current = null;
    }
  }, []);

  const requestPlayback = useCallback((id: string) => {
    playersRef.current.forEach((stopCallback, playerId) => {
      if (playerId !== id) {
        try {
          stopCallback();
        } catch (error) {
          console.error(`Error stopping player ${playerId}:`, error);
        }
      }
    });
    currentPlayingIdRef.current = id;
  }, []);

  const stopAll = useCallback(() => {
    playersRef.current.forEach((stopCallback) => {
      try {
        stopCallback();
      } catch (error) {
        console.error("Error stopping player:", error);
      }
    });
    currentPlayingIdRef.current = null;
  }, []);

  const getCurrentPlayingId = useCallback(() => {
    return currentPlayingIdRef.current;
  }, []);

  const value = useMemo(
    () => ({
      registerPlayer,
      unregisterPlayer,
      requestPlayback,
      stopAll,
      getCurrentPlayingId,
    }),
    [registerPlayer, unregisterPlayer, requestPlayback, stopAll, getCurrentPlayingId]
  );

  return (
    <AudioManagerContext.Provider value={value}>
      {children}
    </AudioManagerContext.Provider>
  );
}

export function useAudioManager() {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error("useAudioManager must be used within an AudioManagerProvider");
  }
  return context;
}

export function useAudioManagerOptional() {
  return useContext(AudioManagerContext);
}
