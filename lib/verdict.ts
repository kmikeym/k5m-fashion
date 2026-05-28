// The vote floor shared by THE ROOM verdict (outfit screen, #15) and the stats
// page (#12): below this many votes a crowd hot-rate is noise, not a reading.
//
// The earlier "predictive projection" below the floor was retired 2026-05-28 —
// THE INSTRUMENT (computed score, see lib/instrument.ts) now carries cold-start,
// so THE ROOM honestly greys out below the floor (Law 7) instead of guessing.
export const MIN_VOTES = 5;
