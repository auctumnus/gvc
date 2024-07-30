interface Event {
  id: number;
  start: Date;
  length: Date;
  maximumPlayers: number;
  minimumPlayers: number;
}

interface Entry {
  id: number;
  playerId: number;
  eventId: number;
  priority: number;
  createdAt: Date;
}

interface SolvedEvent {
  event: Event;
  entries: Entry[];
}

interface UnsolvedSchedule {
  events: Event[];
  entries: Entry[];
}

type SolvedSchedule = SolvedEvent[];

/*
A schedule is a list of Events E1, E2, ..., En, where each event has a start time, length, and max/min number of players,
as well as a list of Entries N1, N2, ..., Nm, where each entry has a player ID, an event it is associated with, a priority,
and the time it was made.


*/
