// ============================================================
// 🏒 ROUND SETUP — Ronde 2, 3, Finale
// ============================================================

var ROUND_CFG = {
  SH_APP_LIVE: "App_Live",
  SH_APP_R2:   "App_Ronde2",
  SH_APP_R3:   "App_Ronde3",
  SH_APP_RF:   "App_RondeF",
  SH_DRAFT_R2: "DRAFT R2",
  SH_DRAFT_R3: "DRAFT R3",
  SH_DRAFT_F:  "DRAFT F"
};

// ============================================================
// HELPER — Get users ranked by total points from any App sheet
// ============================================================
function getRankedUsers_(sheetName) {
  var ss    = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  var data   = sheet.getDataRange().getValues();
  var totals = {};
  for (var i = 1; i < data.length; i++) {
    var user  = String(data[i][0] || "").trim();
    var total = Number(data[i][11] || 0);
    if (!user) continue;
    if (!totals[user] || total > totals[user]) totals[user] = total;
  }
  var arr = [];
  for (var u in totals) {
    if (totals.hasOwnProperty(u)) arr.push({ user: u, total: totals[u] });
  }
  arr.sort(function(a, b) { return b.total - a.total; });
  return arr;
}

// ============================================================
// HELPER — Write seeds to DRAFT sheet
// ============================================================
function writeSeeds_(draftName, nameCol, seedCol, ranked, seeds) {
  var ss    = SpreadsheetApp.getActive();
  var draft = ss.getSheetByName(draftName);
  if (!draft) throw new Error('Sheet not found: ' + draftName);
  draft.getRange(1, nameCol).setValue("Name");
  draft.getRange(1, seedCol).setValue("Seed");
  for (var i = 0; i < ranked.length; i++) {
    draft.getRange(i + 2, nameCol).setValue(ranked[i].user || "");
    draft.getRange(i + 2, seedCol).setValue(seeds[i]      || "");
  }
}

// ============================================================
// HELPER — Get or create App sheet
// ============================================================
function getOrCreateAppSheet_(sheetName) {
  var ss    = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

// ============================================================
// HELPER — Make one player row for App sheet
// liveMap and dbMap passed in to avoid rebuilding every row
// ============================================================
function getUserTotal_(sheetName, user) {
  var ss    = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return 0;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0] || "").trim() === user) return Number(data[i][11] || 0);
  }
  return 0;
}

function makeAppRow_(owner, matchupNum, roundLabel, pos, player, myTotal, oppTotal, elimVal, liveMap, dbMap) {
  if (!player) return null;
  var live = liveMap[player] || { liveG:0, liveA:0, indicator:"" };
  var db   = dbMap[player]   || { seasonG:0, seasonA:0, seasonPoints:0 };
  return [owner, matchupNum, roundLabel, pos, player,
          live.liveG, live.liveA, db.seasonG, db.seasonA, db.seasonPoints,
          live.indicator, myTotal, oppTotal, "", "", elimVal];
}

// ============================================================
// HELPER — Export draft players + predictions to App sheet
// ============================================================
function exportDraftToApp_(cfg) {
  var ss    = SpreadsheetApp.getActive();
  var draft = ss.getSheetByName(cfg.draftName);
  var app   = getOrCreateAppSheet_(cfg.appName);

  // Read user names from row 1 of draft (actual column order)
  var users = [];
  for (var i = 0; i < cfg.userCount; i++) {
    users.push(String(draft.getRange(1, i + 1).getValue() || "").trim());
  }

  var pairs = cfg.pairs;

  // Clear and write header
  app.getRange(2, 1, 300, 16).clearContent();
  var headers = ["User","Matchup","Round","Position","Player",
                 "LiveG","LiveA","SeasonG","SeasonA","TotalPoints",
                 "Indicator","UserTotal","OpponentTotal","LeadIndicator","Opponent","Eliminated"];
  app.getRange(1, 1, 1, 16).setValues([headers])
    .setFontWeight("bold").setBackground("#1a2535").setFontColor("#ffffff");
  app.setFrozenRows(1);

  // Build eliminated map from Series A16:C31
  var elimMap = {};
  var seriesSheet = ss.getSheetByName("Series");
  if (seriesSheet) {
    seriesSheet.getRange("A16:C31").getValues().forEach(function(row) {
      var team = String(row[0] || "").trim().toUpperCase();
      if (team) elimMap[team] = row[1] === true;
    });
  }

  // Build advancing map from this round's series results
  var advancingMap = {};
  if (cfg.seriesRanges && seriesSheet) {
    cfg.seriesRanges.forEach(function(rng) {
      seriesSheet.getRange(rng).getValues().forEach(function(row) {
        if (row[2] === true && row[0]) {
          advancingMap[String(row[0]).trim().toUpperCase()] = true;
        }
      });
    });
  }

  // Build player->team map from PlayerList
  var playerTeamMap = {};
  var pl = ss.getSheetByName(CFG.SH_PLAYERS);
  if (pl) {
    pl.getDataRange().getValues().forEach(function(row, i) {
      if (i === 0) return;
      var name = String(row[0] || "").trim();
      var team = String(row[6] || "").trim().toUpperCase();
      if (name && team) playerTeamMap[name] = team;
    });
  }

  // Helper: compute elimVal for a player
  function getElimVal(player) {
    var team   = playerTeamMap[player] || "";
    var isElim = team ? elimMap[team] === true : false;
    var isDone = team ? advancingMap[team] === true : false;
    return isElim ? true : (isDone ? false : '');
  }

  // Build maps once — not per row
  var liveMap = buildLiveMapPool_();
  var dbMap   = buildDbMapPool_();

  var output = [];

  pairs.forEach(function(pair, idx) {
    var leftUser   = users[pair[0]];
    var rightUser  = users[pair[1]];
    var matchupNum = idx + 1;
    var leftTotal  = 0;
    var rightTotal = 0;

    function addRows(startRow, count, pos) {
      for (var i = 0; i < count; i++) {
        var lp = String(draft.getRange(startRow + i, pair[0] + 1).getValue() || "").trim();
        var rp = String(draft.getRange(startRow + i, pair[1] + 1).getValue() || "").trim();
        var lr = makeAppRow_(leftUser,  matchupNum, cfg.roundLabel, pos, lp, leftTotal,  rightTotal, getElimVal(lp), liveMap, dbMap);
        var rr = makeAppRow_(rightUser, matchupNum, cfg.roundLabel, pos, rp, rightTotal, leftTotal,  getElimVal(rp), liveMap, dbMap);
        if (lr) output.push(lr);
        if (rr) output.push(rr);
      }
    }

    addRows(cfg.fStart, cfg.fCount, "F");
    addRows(cfg.dStart, cfg.dCount, "D");
    if (cfg.gCount > 0) addRows(cfg.gStart, cfg.gCount, "G");
  });

  if (output.length > 0) app.getRange(2, 1, output.length, 16).setValues(output);

  // Predictions
  var COL_START  = 17;
  var predData   = draft.getRange(cfg.predStart, 1, cfg.predCount, cfg.userCount).getValues();
  var numPredRows = cfg.predCount + 3;
  app.getRange(1, COL_START, numPredRows, cfg.userCount + 1).clearContent();

  app.getRange(1, COL_START, 1, cfg.userCount + 1)
    .setValues([["Predictions"].concat(users)])
    .setFontWeight("bold").setBackground("#1a2535").setFontColor("#ffffff");

  var seriesLabels = cfg.seriesLabels || ["EST1","EST2","OUEST1","OUEST2"];
  for (var r = 0; r < cfg.predCount; r++) {
    var rowData = [seriesLabels[r] || ("Serie" + (r+1))];
    for (var u = 0; u < cfg.userCount; u++) {
      rowData.push(String(predData[r][u] || "").trim());
    }
    app.getRange(r + 2, COL_START, 1, cfg.userCount + 1).setValues([rowData]);
  }

  // Score pred pts
  var predPts = new Array(cfg.userCount).fill(0);
  var results = [];
  if (cfg.seriesRanges && seriesSheet) {
    cfg.seriesRanges.forEach(function(rng) {
      seriesSheet.getRange(rng).getValues().forEach(function(row) {
        if (row[2] === true && row[0] && row[1])
          results.push({winner: String(row[0]).trim(), games: String(row[1]).trim()});
      });
    });
    for (var u = 0; u < cfg.userCount; u++) {
      var total = 0;
      for (var p = 0; p < cfg.predCount; p++) {
        var pick = String(predData[p][u] || "").trim();
        var parts = pick.split("|");
        if (parts.length < 2) continue;
        var team = parts[0].trim(), g = parts[1].trim();
        for (var i = 0; i < results.length; i++) {
          if (results[i].winner === team) { total += results[i].games === g ? 4 : 2; break; }
        }
      }
      predPts[u] = total;
    }
  }

  app.getRange(cfg.predCount + 2, COL_START, 1, cfg.userCount + 1)
    .setValues([["PredPts"].concat(predPts)])
    .setFontWeight("bold").setBackground("#0d1f2e").setFontColor("#22c55e");

  var resultsRow = ["Results"];
  results.forEach(function(r) { resultsRow.push(r.winner + "|" + r.games); });
  while (resultsRow.length < cfg.userCount + 1) resultsRow.push("");
  app.getRange(cfg.predCount + 3, COL_START, 1, cfg.userCount + 1).setValues([resultsRow]);

  Logger.log("exportDraftToApp_: " + output.length + " rows -> " + cfg.appName);
  return output.length;
}

// ============================================================
// SETUP RONDE 2
// ============================================================
function setupRonde2() {
  try {
    var ranked  = getRankedUsers_(ROUND_CFG.SH_APP_LIVE);
    var winners = getR1Winners_(ranked);
    var seeds   = ["W1","W2","W3","W4","W5","W6","W7","W8"];
    writeSeeds_(ROUND_CFG.SH_DRAFT_R2, 13, 14, winners, seeds);
    getOrCreateAppSheet_(ROUND_CFG.SH_APP_R2);

    var seedList = winners.map(function(w, i) {
      return "  W" + (i+1) + " = " + w.user + " (" + w.total + " pts)";
    }).join("\n");

    SpreadsheetApp.getUi().alert(
      "ACTION REQUISE — RONDE 2",
      "Seeds ecrits dans DRAFT R2.\n\n" +
      "AVANT DE CONTINUER:\n" +
      "1. Invites font leur draft R2\n" +
      "2. Tu remplis DRAFT R2\n" +
      "3. Clear Database et ajoute les joueurs R2\n" +
      "4. Clique Mettre a jour series\n\n" +
      "Classement Ronde 2:\n" + seedList,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    Logger.log("R2 seeds: " + JSON.stringify(winners));
  } catch(e) {
    Logger.log("setupRonde2 ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("setupRonde2 error: " + e.message, "❌", 6);
  }
}

function getR1Winners_(ranked) {
  var matchups = [
    ["Francis","Laurent"],["Jonathan","José"],["J-P","Éric"],["Yan","Lionel"],
    ["Yvon","Joaquin"],["Guillaume","Simon"],["David","Mario"],["Marc-André","Dom"]
  ];
  var totalMap = {};
  ranked.forEach(function(r) { totalMap[r.user] = r.total; });
  var winners = [];
  matchups.forEach(function(mu) {
    var t1 = totalMap[mu[0]] || 0;
    var t2 = totalMap[mu[1]] || 0;
    winners.push(t1 >= t2 ? { user: mu[0], total: t1 } : { user: mu[1], total: t2 });
  });
  winners.sort(function(a,b){ return b.total - a.total; });
  return winners;
}

// ============================================================
// SETUP RONDE 3
// ============================================================
function setupRonde3() {
  try {
    var ranked  = getRankedUsers_(ROUND_CFG.SH_APP_R2);
    var winners = getR2Winners_(ranked);
    var seeds   = ["W1","W2","W3","W4"];
    writeSeeds_(ROUND_CFG.SH_DRAFT_R3, 9, 10, winners, seeds);
    getOrCreateAppSheet_(ROUND_CFG.SH_APP_R3);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Ronde 3 setup done! W1=" + winners[0].user, "✅", 6);
  } catch(e) {
    Logger.log("setupRonde3 ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("setupRonde3 error: " + e.message, "❌", 6);
  }
}

function getR2Winners_(ranked) {
  var ss    = SpreadsheetApp.getActive();
  var draft = ss.getSheetByName(ROUND_CFG.SH_DRAFT_R2);
  // Read actual user names from row 1 cols A-H
  var names = [];
  for (var i = 0; i < 8; i++) {
    names.push(String(draft.getRange(1, i + 1).getValue() || "").trim());
  }
  // Pairs are side by side: 0v1, 2v3, 4v5, 6v7
  var pairs = [[0,1],[2,3],[4,5],[6,7]];
  var totalMap = {};
  ranked.forEach(function(r){ totalMap[r.user] = r.total; });
  var winners = [];
  pairs.forEach(function(pair) {
    var u1 = names[pair[0]], u2 = names[pair[1]];
    var t1 = totalMap[u1]||0, t2 = totalMap[u2]||0;
    winners.push(t1>=t2 ? {user:u1,total:t1} : {user:u2,total:t2});
  });
  winners.sort(function(a,b){ return b.total-a.total; });
  return winners;
}

// ============================================================
// SETUP RONDE FINALE
// ============================================================
function setupRondeF() {
  try {
    var ranked  = getRankedUsers_(ROUND_CFG.SH_APP_R3);
    var winners = getR3Winners_(ranked);
    var seeds   = ["W1","W2"];
    writeSeeds_(ROUND_CFG.SH_DRAFT_F, 6, 7, winners, seeds);
    getOrCreateAppSheet_(ROUND_CFG.SH_APP_RF);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Finale setup done! W1=" + winners[0].user + " vs W2=" + winners[1].user, "✅", 6);
  } catch(e) {
    Logger.log("setupRondeF ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("setupRondeF error: " + e.message, "❌", 6);
  }
}

function getR3Winners_(ranked) {
  var ss    = SpreadsheetApp.getActive();
  var draft = ss.getSheetByName(ROUND_CFG.SH_DRAFT_R3);
  var names = [];
  for (var i = 0; i < 4; i++) {
    names.push(String(draft.getRange(1, i + 1).getValue() || "").trim());
  }
  var pairs = [[0,1],[2,3]];
  var totalMap = {};
  ranked.forEach(function(r){ totalMap[r.user] = r.total; });
  var winners = [];
  pairs.forEach(function(pair) {
    var u1 = names[pair[0]], u2 = names[pair[1]];
    var t1 = totalMap[u1]||0, t2 = totalMap[u2]||0;
    winners.push(t1>=t2 ? {user:u1,total:t1} : {user:u2,total:t2});
  });
  winners.sort(function(a,b){ return b.total-a.total; });
  return winners;
}

function transitionToRonde2() { setupRonde2(); }
function transitionToRonde3() { setupRonde3(); }
function transitionToFinale()  { setupRondeF(); }

function createAllAppSheets() {
  var ss = SpreadsheetApp.getActive();
  ["App_Ronde2","App_Ronde3","App_RondeF"].forEach(function(name) {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  SpreadsheetApp.getActiveSpreadsheet().toast("App sheets created!", "✅", 3);
}

// ============================================================
// EXPORT RONDE 2
// ============================================================
function exportRonde2() {
  try {
    var db = SpreadsheetApp.getActive().getSheetByName("Database");
    var baselineEmpty = db.getRange("X5").getValue() === "";
    if (baselineEmpty) {
      var ok = snapshotBaseline_();
      if (!ok) return;
    }
    var n = exportDraftToApp_({
      draftName:     ROUND_CFG.SH_DRAFT_R2,
      appName:       ROUND_CFG.SH_APP_R2,
      prevAppName:   ROUND_CFG.SH_APP_R2,
      roundLabel:    "Ronde 2",
      nameCol:       13, seedCol: 14,
      fStart:2,  fCount:8,
      dStart:11, dCount:4,
      gStart:16, gCount:2,
      predStart:21,  predCount:4,
      userCount:8,
      pairs:         [[0,1],[2,3],[4,5],[6,7]],
      seriesLabels:  ["EST1","EST2","OUEST1","OUEST2"],
      seriesRanges:  ["K4:M5","K9:M10"],
      resultsRanges: ["K4:M5","K9:M10"]
    });
    SpreadsheetApp.getActiveSpreadsheet().toast(n + " joueurs -> App_Ronde2", "✅", 4);
  } catch(e) {
    Logger.log("exportRonde2 ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("exportRonde2 error: " + e.message, "❌", 6);
  }
}

// ============================================================
// EXPORT RONDE 3
// ============================================================
function exportRonde3() {
  try {
    var db = SpreadsheetApp.getActive().getSheetByName("Database");
    var baselineEmpty = db.getRange("X5").getValue() === "";
    if (baselineEmpty) {
      var ok = snapshotBaseline_();
      if (!ok) return;
    }
    var n = exportDraftToApp_({
      draftName:     ROUND_CFG.SH_DRAFT_R3,
      appName:       ROUND_CFG.SH_APP_R3,
      prevAppName:   ROUND_CFG.SH_APP_R2,
      roundLabel:    "Ronde 3",
      nameCol:       9, seedCol: 10,
      fStart:2,  fCount:8,
      dStart:11, dCount:3,
      gStart:15, gCount:1,
      predStart:17,  predCount:2,
      userCount:4,
      pairs:         [[0,1],[2,3]],
      seriesLabels:  ["EST1","OUEST1"],
      seriesRanges:  ["R4:T4","R9:T9"],
      resultsRanges: ["R4:T4","R9:T9"]
    });
    SpreadsheetApp.getActiveSpreadsheet().toast(n + " joueurs -> App_Ronde3", "✅", 4);
  } catch(e) {
    Logger.log("exportRonde3 ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("exportRonde3 error: " + e.message, "❌", 6);
  }
}

// ============================================================
// EXPORT RONDE FINALE
// ============================================================
function exportRondeF() {
  try {
    var db = SpreadsheetApp.getActive().getSheetByName("Database");
    var baselineEmpty = db.getRange("X5").getValue() === "";
    if (baselineEmpty) {
      var ok = snapshotBaseline_();
      if (!ok) return;
    }
    var n = exportDraftToApp_({
      draftName:     ROUND_CFG.SH_DRAFT_F,
      appName:       ROUND_CFG.SH_APP_RF,
      prevAppName:   ROUND_CFG.SH_APP_R3,
      roundLabel:    "Finale",
      nameCol:       6, seedCol: 7,
      fStart:2,  fCount:6,
      dStart:9,  dCount:2,
      gStart:0,  gCount:0,
      predStart:12,  predCount:1,
      userCount:2,
      pairs:         [[0,1]],
      seriesLabels:  ["Finale NHL"],
      seriesRanges:  ["Y4:AA4"],
      resultsRanges: ["Y4:AA4"]
    });
    SpreadsheetApp.getActiveSpreadsheet().toast(n + " joueurs -> App_RondeF", "✅", 4);
  } catch(e) {
    Logger.log("exportRondeF ERROR: " + e);
    SpreadsheetApp.getActiveSpreadsheet().toast("exportRondeF error: " + e.message, "❌", 6);
  }
}