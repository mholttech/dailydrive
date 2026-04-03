function shuffleEpisodes(episodes) {
  const arr = [...episodes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseClock(clock) {
  if (!clock || typeof clock !== "string") return null;
  const match = clock.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function getLocalMinutes(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  return hour * 60 + minute;
}

function getLocalDateKey(date, timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

function isWithinWindow(now, window, timezone) {
  if (!window || !window.start || !window.end) return false;
  const start = parseClock(window.start);
  const end = parseClock(window.end);
  if (start == null || end == null) return false;

  const current = getLocalMinutes(now, timezone);
  if (start < end) {
    return current >= start && current < end;
  }

  if (start > end) {
    return current >= start || current < end;
  }

  return false;
}

function parsePositionRank(position) {
  if (!position) return null;
  const normalized = String(position).trim().toLowerCase();
  const order = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    ninth: 9,
    tenth: 10,
  };
  return order[normalized] || null;
}

function preparePodcastOrdering(podcasts, options = {}) {
  const {
    now = new Date(),
    timezone = "America/Los_Angeles",
    shuffleFn = shuffleEpisodes,
  } = options;

  const included = [];

  podcasts.forEach((podcast, originalIndex) => {
    const window = podcast.window;
    const hasWindow = Boolean(window && window.start && window.end);
    const activeWindow = hasWindow ? isWithinWindow(now, window, timezone) : false;
    const basePositionRank = parsePositionRank(podcast.position);
    const overridePositionRank = activeWindow ? parsePositionRank(window.override_position) : null;
    const include = !hasWindow || activeWindow || basePositionRank != null;

    if (!include) return;

    included.push({
      ...podcast,
      positionRank: basePositionRank,
      overridePositionRank,
      windowActive: activeWindow,
      _originalIndex: originalIndex,
    });
  });

  const overrideRanked = included
    .filter((podcast) => podcast.overridePositionRank != null)
    .sort(
      (a, b) =>
        a.overridePositionRank - b.overridePositionRank || a._originalIndex - b._originalIndex
    );

  const positioned = included.filter(
    (podcast) => podcast.overridePositionRank == null && podcast.positionRank != null
  );

  positioned.sort(
    (a, b) => a.positionRank - b.positionRank || a._originalIndex - b._originalIndex
  );

  const normal = included.filter(
    (podcast) => podcast.overridePositionRank == null && podcast.positionRank == null
  );

  const shuffledNormal = shuffleFn(normal);
  const ordered = [...overrideRanked, ...positioned, ...shuffledNormal];

  ordered.includedPodcasts = included;
  ordered.overrideRankedPodcasts = overrideRanked;
  ordered.positionedPodcasts = positioned;
  ordered.shuffledPodcasts = shuffledNormal;

  return ordered;
}

function prepareEpisodeOrdering(episodes, shuffleFn = shuffleEpisodes) {
  const overrideRanked = [];
  const positionedEpisodes = [];
  const shuffledCandidates = [];

  episodes.forEach((episode, originalIndex) => {
    if (episode.overridePositionRank != null) {
      overrideRanked.push({ episode, originalIndex });
      return;
    }

    if (episode.positionRank != null) {
      positionedEpisodes.push({ episode, originalIndex });
      return;
    }

    shuffledCandidates.push(episode);
  });

  overrideRanked.sort(
    (a, b) =>
      a.episode.overridePositionRank - b.episode.overridePositionRank || a.originalIndex - b.originalIndex
  );
  positionedEpisodes.sort(
    (a, b) => a.episode.positionRank - b.episode.positionRank || a.originalIndex - b.originalIndex
  );

  const shuffledEpisodes = shuffleFn(shuffledCandidates);
  const ordered = [
    ...overrideRanked.map(({ episode }) => episode),
    ...positionedEpisodes.map(({ episode }) => episode),
    ...shuffledEpisodes,
  ];

  ordered.overrideRankedEpisodes = overrideRanked.map(({ episode }) => episode);
  ordered.positionedEpisodes = positionedEpisodes.map(({ episode }) => episode);
  ordered.shuffledEpisodes = shuffledEpisodes;

  return ordered;
}

function composePlaylistOrder(episodeOrdering, tracks, pattern, mixFn) {
  const podcastEpisodes = [
    ...(episodeOrdering.overrideRankedEpisodes || []),
    ...(episodeOrdering.positionedEpisodes || []),
    ...(episodeOrdering.shuffledEpisodes || []),
  ];
  const ordered = mixFn(podcastEpisodes, tracks, pattern);
  ordered.podcastEpisodes = podcastEpisodes;
  return ordered;
}

module.exports = {
  getLocalDateKey,
  isWithinWindow,
  preparePodcastOrdering,
  prepareEpisodeOrdering,
  composePlaylistOrder,
};
