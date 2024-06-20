interface Event {
    id: number;
    start: Date;
    time: Date;
    maximumPlayers: number;
}

interface Entry {
    id: number;
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

const solve = (schedule: UnsolvedSchedule): SolvedSchedule => {
    const events = structuredClone(schedule.events).sort((a, b) => a.time.getTime() - b.time.getTime());
    const entries = structuredClone(schedule.entries).sort((a, b) => a.priority - b.priority).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());


    const solved: SolvedSchedule = [];
    for (const event of events) {
        const eventEntries = entries.filter((entry) => entry.eventId === event.id);
        solved.push({ event, entries: eventEntries });
    }

    return solved;
}

