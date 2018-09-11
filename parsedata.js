function process_single_hero(hero_id, ranked, gamedata, profile) {
  var heromap = gamedata.heroesMap[hero_id];
  var res = {};
  //res.pic = heromap.small;
  res.name = heromap.displayName;
  res.data = [];
  var stats;
  if (ranked) {
    stats = profile.data.careerStats.ranked.stats;
  } else {
    stats = profile.data.careerStats.unranked.stats;
  }
  if (!stats) {
    return res;
  }
  res.name = heromap.displayName;
  var datamap = stats[hero_id];
  for (var key in datamap) {
    if (!datamap.hasOwnProperty(key)) {
      continue;
    }
    var data = {};
    data.value = datamap[key];
    var prop = gamedata.stats[key];
    data.name = prop.name;
    data.format = prop.format;
    res.data.push(data);
  }
  return res;
}

function process_heroes(gamedata, profile) {
  var player_stat = {};
  var seasons = [];
  var ranked = [];
  var unranked = [];
  for (var i = 0; i < gamedata.heroes.length; ++i) {
    var hero_id = gamedata.heroes[i];
    ranked.push(process_single_hero(hero_id, true, gamedata, profile));
    unranked.push(process_single_hero(hero_id, false, gamedata, profile));
  }
  var ranked_season = -1;
  try {
    seasons[profile.data.careerStats.ranked.rankedSeason] = ranked;
    ranked_season = profile.data.careerStats.ranked.rankedSeason;
  } catch (e) { }
  seasons["0"] = unranked;
  player_stat.seasons = seasons;

  var player = {};
  player.level = profile.data.player.level;
  player.name = profile.data.player.displayName;
  player.rank = [];
  player.endorsement = profile.data.player.endorsement;
  if (ranked_season != -1) {
    var rank_data = {};
    rank_data.rank = profile.data.player.ranked.level;
    rank_data.highest_rank = profile.data.player.ranked.highestLevel;
    player.rank[ranked_season] = rank_data;
  }
  player_stat.player = player;

  player_stat.heroesMap = gamedata.heroesMap;

  return player_stat;
}

exports.parsedata = process_heroes;
