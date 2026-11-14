import {ZONE, PROGRAM_START, allSessionEntries, exerciseStats, localDate, recordedBefore, validSet} from './core.mjs';

// A local download, never an upload. Preserve all snapshots and raw measurements.
export function progressReport(state, now = new Date()) {
  const today = localDate(now), eligible = recordedBefore(state.sessions, today);
  const groups = new Map();
  for (const session of eligible) for (const entry of allSessionEntries(session)) {
    const key = entry.exerciseId + ':' + entry.measurement.basis;
    if (!groups.has(key)) groups.set(key, entry);
  }
  const exercises = [...groups.values()].map(entry => {
    const stats = exerciseStats(eligible, entry.exerciseId, {basis:entry.measurement.basis});
    return {exerciseId:entry.exerciseId,name:entry.instruction.name,measurement:structuredClone(entry.measurement),
      recordedSets:stats.sets,personalRecord:stats.pr,weightRecord:stats.load?.pr ?? null,
      average:stats.average,averageRepetitions:stats.averageReps,lastFiveAverage:stats.recentAverage,
      performances:stats.runs.map(run=>({sessionId:run.sessionId,date:run.date,training:run.title,recordingMode:run.recordingMode,sets:structuredClone(run.sets),recordedVolume:run.volume}))};
  });
  return {
    format:'ritme-progress-analysis',reportVersion:1,appVersion:'2.2.0',exportedAt:now.toISOString(),timeZone:ZONE,
    effectiveWeekOneAnchor:state.settings.anchorMonday || PROGRAM_START,
    explanation:'Vanaf Ritme 2.1 registreert iedere nieuwe oefening één beste set. Oudere individuele sets blijven behouden. Voorgeschreven sets zijn geen uitgevoerde sets. Werkelijk totaal trainingsvolume is onbekend; geregistreerd volume is alleen de som van geldige gelogde kg × herhalingen. Afvinken en een prestatie registreren zijn afzonderlijk. Ontbrekende waarden zijn null, geen nulmeting. Verschillende oefening-ID’s en gewichtsdefinities mogen niet worden samengevoegd. Bewaarde keuze-alternatieven blijven bij hun eigen oefening horen.',
    analysisRequest:'Beoordeel voortgang per oefening en gewichtsdefinitie, met gewicht én herhalingen of tijd/afstand. Benoem datagaten en registratiebeperkingen; verzin geen uitgevoerde sets, extra volume of medische conclusies.',
    summary:{throughDate:today,totalSessions:state.sessions.length,completedSessions:eligible.filter(s=>s.status==='completed').length,
      recordedSets:eligible.reduce((sum,s)=>sum+allSessionEntries(s).reduce((n,e)=>n+e.sets.filter(st=>validSet(st,e.measurement)).length,0),0)},
    exercises,settings:structuredClone(state.settings),sessions:structuredClone(state.sessions)
  };
}
