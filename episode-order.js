function prepareEpisodeOrdering(episodes, shuffleFn = shuffleEpisodes) {
  const pinnedEpisodes = [];
  const shuffledCandidates = [];

  for (const episode of episodes) {
    if (episode.position === "first") {
      pinnedEpisodes.push(episode);
    } else {
      shuffledCandidates.push(episode);
    }
  }

  return {
    pinnedEpisodes,
    shuffledEpisodes: shuffleFn(shuffledCandidates),
  };
}

function shuffleEpisodes(episodes) {
  const arr = [...episodes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { prepareEpisodeOrdering };
