
export enum GamePhase {
  PRE_GAME = 'PRE_GAME',
  START_DELAY = 'START_DELAY',
  Q1 = 'Q1',
  Q1_BREAK = 'Q1_BREAK',
  Q2 = 'Q2',
  HALFTIME = 'HALFTIME',
  Q3 = 'Q3',
  Q3_BREAK = 'Q3_BREAK',
  Q4 = 'Q4',
  END_GAME = 'END_GAME',
}

export interface TeamConfig {
  name: string;
  logoUrl: string | null;
  logoCrop: {
    x: number;
    y: number;
    scale: number;
  };
  score: number;
  color: string;     
  textColor: string; 
}

export type SoundType = 'buzzer' | 'whistle-short' | 'whistle-long' | 'whistle-double' | 'whistle-netball' | 'whistle-hockey';

export interface GameSettings {
  quarterLength: number;
  breakLength: number;
  halftimeLength: number;
  soundType: SoundType;
  scoreScale: number;
  logoSizeScale: number;
  timerScale: number;
  timerX: number;
  timerY: number;
  homeScoreX: number;
  homeScoreY: number;
  guestScoreX: number;
  guestScoreY: number;
  middleFrameX: number;
  middleFrameY: number;
  homeLogoX: number;
  homeLogoY: number;
  guestLogoX: number;
  guestLogoY: number;
  settingsIconX: number;
  settingsIconY: number;
  speakerIconX: number;
  speakerIconY: number;
  favoriteGroups: string[];
}

export interface SettingsProfile {
  id: string;
  profileName: string;
  createdAt: number;
  settings: GameSettings;
  homeTeam: TeamConfig;
  guestTeam: TeamConfig;
}

export interface GameStat {
  id: string;
  timestamp: number;
  homeConfig: TeamConfig;
  guestConfig: TeamConfig;
  finalPhase: GamePhase;
}
