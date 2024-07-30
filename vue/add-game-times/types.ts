export interface GameTime {
  start: number;
  end: number;
  id: number;
  entries_count?: number;
  game_name?: string;
}

export interface GameTimeData {
  current: GameTime[];
  running: GameTime[];
  entered: GameTime[];
  other: GameTime[];
  startOfCon: number;
  endOfCon: number;
  minPlayers: number;
  maxPlayers: number;
}
