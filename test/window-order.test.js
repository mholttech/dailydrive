const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getLocalDateKey,
  isWithinWindow,
  preparePodcastOrdering,
  prepareEpisodeOrdering,
} = require("../episode-order");

test("windows include the start time and exclude the end time", () => {
  const window = { start: "05:00", end: "10:00" };
  const timezone = "America/New_York";

  assert.equal(isWithinWindow(new Date("2026-04-03T09:00:00Z"), window, timezone), true);
  assert.equal(isWithinWindow(new Date("2026-04-03T13:59:00Z"), window, timezone), true);
  assert.equal(isWithinWindow(new Date("2026-04-03T14:00:00Z"), window, timezone), false);
});

test("local date keys follow the configured timezone", () => {
  const timezone = "America/Los_Angeles";

  assert.equal(getLocalDateKey(new Date("2026-04-03T06:30:00Z"), timezone), "2026-04-02");
  assert.equal(getLocalDateKey(new Date("2026-04-03T18:30:00Z"), timezone), "2026-04-03");
});

test("window overrides cascade ahead of normal positions during the active window", () => {
  const podcasts = [
    {
      name: "Override First",
      window: { start: "05:00", end: "10:00", override_position: "first" },
    },
    {
      name: "Override Second",
      window: { start: "05:00", end: "10:00", override_position: "second" },
    },
    {
      name: "Base First",
      position: "first",
    },
    {
      name: "Base Second",
      position: "second",
    },
    {
      name: "Window Only",
      window: { start: "05:00", end: "10:00" },
    },
  ];

  const ordered = preparePodcastOrdering(podcasts, {
    now: new Date("2026-04-03T09:30:00Z"),
    timezone: "America/New_York",
    shuffleFn: (items) => items,
  });

  assert.deepEqual(
    ordered.map((podcast) => podcast.name),
    ["Override First", "Override Second", "Base First", "Base Second", "Window Only"]
  );
});

test("window-only podcasts drop out outside their window", () => {
  const podcasts = [
    {
      name: "Override First",
      window: { start: "05:00", end: "10:00", override_position: "first" },
    },
    {
      name: "Override Second",
      window: { start: "05:00", end: "10:00", override_position: "second" },
    },
    {
      name: "Base First",
      position: "first",
    },
    {
      name: "Base Second",
      position: "second",
    },
    {
      name: "Window Only",
      window: { start: "05:00", end: "10:00" },
    },
  ];

  const ordered = preparePodcastOrdering(podcasts, {
    now: new Date("2026-04-03T15:30:00Z"),
    timezone: "America/New_York",
    shuffleFn: (items) => items,
  });

  assert.deepEqual(
    ordered.map((podcast) => podcast.name),
    ["Base First", "Base Second"]
  );
});

test("window override episodes sort before position episodes and shuffled episodes", () => {
  const episodes = [
    { name: "Base First", positionRank: 1 },
    { name: "Override First", overridePositionRank: 1 },
    { name: "Override Second", overridePositionRank: 2 },
    { name: "Base Second", positionRank: 2 },
    { name: "Other" },
  ];

  const ordered = prepareEpisodeOrdering(episodes, (items) => items);

  assert.deepEqual(ordered.map((episode) => episode.name), [
    "Override First",
    "Override Second",
    "Base First",
    "Base Second",
    "Other",
  ]);
});
