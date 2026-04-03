const test = require("node:test");
const assert = require("node:assert/strict");

const { prepareEpisodeOrdering } = require("../episode-order");

test("keeps pinned episodes first and shuffles the rest as individual episodes", () => {
  const episodes = [
    { name: "Pinned", position: "first" },
    { name: "Episode A" },
    { name: "Episode B" },
    { name: "Episode C" },
  ];

  const result = prepareEpisodeOrdering(episodes, (items) => [...items].reverse());

  assert.deepEqual(result.pinnedEpisodes.map((episode) => episode.name), ["Pinned"]);
  assert.deepEqual(result.shuffledEpisodes.map((episode) => episode.name), [
    "Episode C",
    "Episode B",
    "Episode A",
  ]);
});
