export interface EventT {
    start: Date;
    end: Date;
    startedYesterday: boolean;
    endsTomorrow: boolean;
    id: number;
    entries_count?: number;
    game?: number;
    kind: "current" | "running" | "entered" | "other";
    concurrentWith: number,
    concurrentIndex?: number,
    past: boolean,
    game_name?: string
    game_slug?: string
}