const test = require("node:test");
const assert = require("node:assert/strict");

const { prepareEpisodeOrdering, composePlaylistOrder } = require("../episode-order");

test("keeps positioned episodes first and shuffles the rest as individual episodes", () => {
  const episodes = [
    { name: "Positioned", positionRank: 1 },
    { name: "Episode A" },
    { name: "Episode B" },
    { name: "Episode C" },
  ];

  const result = prepareEpisodeOrdering(episodes, (items) => [...items].reverse());

  assert.deepEqual(result.positionedEpisodes.map((episode) => episode.name), ["Positioned"]);
  assert.deepEqual(result.shuffledEpisodes.map((episode) => episode.name), [
    "Episode C",
    "Episode B",
    "Episode A",
  ]);
});

test("mixes ordered podcast episodes through the pattern instead of prepending them", () => {
  const episodeOrdering = {
    overrideRankedEpisodes: [{ name: "Override" }],
    positionedEpisodes: [{ name: "Positioned" }],
    shuffledEpisodes: [{ name: "Shuffle A" }, { name: "Shuffle B" }],
  };

  const result = composePlaylistOrder(
    episodeOrdering,
    [{ name: "Track 1" }],
    "PM",
    (episodes, tracks, pattern) => {
      const mixed = [];
      let episodeIndex = 0;
      let trackIndex = 0;
      for (const slot of pattern) {
        if (slot === "P") {
          mixed.push(episodes[episodeIndex++]);
        } else {
          mixed.push(tracks[trackIndex++]);
        }
      }
      while (episodeIndex < episodes.length) mixed.push(episodes[episodeIndex++]);
      while (trackIndex < tracks.length) mixed.push(tracks[trackIndex++]);
      return mixed;
    }
  );

  assert.deepEqual(result.map((item) => item.name), [
    "Override",
    "Track 1",
    "Positioned",
    "Shuffle A",
    "Shuffle B",
  ]);
});
