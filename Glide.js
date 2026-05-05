// ============================================================
// 🏒 S21 — APP_LIVE EXPORT & PREDICTIONS
// Safe to edit: NO
// Exports player data + predictions to App_Live for GitHub site
// Sheet names and column numbers use main CFG from S1
// ============================================================
// FUNCTIONS (run from menu or manually):
//   runFullRefresh()       — exports players + predictions to App_Live
//   setupSeriesSheet()     — creates Series sheet (run once)
//   updatePredictionPts()  — scores predictions after series end
//   updateEliminatedPlayers() — strikes out eliminated players
// ============================================================

// Pool-specific constants (not in main CFG)
var POOL = {
  SH_APP_LIVE:  "App_Live",
  SH_DRAFT:    "DRAFT",
  SH_RONDE1:   "Ronde 1",
  SH_SERIES:   "Series",

  DRAFT_PRED_START: 21,
  DRAFT_PRED_COUNT: 8,

  USERS: [
    "Francis", "Laurent", "Jonathan", "José",
    "J-P", "Éric", "Yan", "Lionel",
    "Yvon", "Joaquin", "Guillaume", "Simon",
    "David", "Mario", "Marc-André", "Dom"
  ],

  MATCHUPS: [
    ["Francis",    "Laurent",   29],
    ["Jonathan",   "José",      67],
    ["J-P",        "Éric",     105],
    ["Yan",        "Lionel",   143],
    ["Yvon",       "Joaquin",  181],
    ["Guillaume",  "Simon",    219],
    ["David",      "Mario",    257],
    ["Marc-André", "Dom",      295]
  ],

  RONDE_LEFT_NAME:  3,
  RONDE_RIGHT_NAME: 6,

  COLOR_HEADER: "#1a2535",
  COLOR_EST:    "#1e3a5f",
  COLOR_OUEST:  "#1a4a2e",
  COLOR_ELIM:   "#4a0000",
  COLOR_WHITE:  "#ffffff",
  COLOR_GREEN:  "#22c55e"
};


// ── Build LiveStats lookup map ────────────────────────────────
function buildLiveMapPool_() {
  var liveStats = getSheet_(CFG.SH_LIVE); // "LiveStats" from main CFG
  var liveData  = liveStats.getDataRange().getValues();
  var map = {};

  for (var i = CFG.LS_START - 1; i < liveData.length; i++) {
    // Skaters: col A=name, B=liveG, C=liveA, D=status
    var skater = liveData[i][CFG.LS_S_NAME - 1];
    if (skater) {
      map[skater] = {
        liveG:     Number(liveData[i][CFG.LS_S_LIVEG  - 1] || 0),
        liveA:     Number(liveData[i][CFG.LS_S_LIVEA  - 1] || 0),
        indicator: statusToEmoji_(liveData[i][CFG.LS_S_STATUS - 1])
      };
    }
    // Goalies: col H=name, L=liveG, M=liveA, N=status
    var goalie = liveData[i][CFG.LS_G_NAME - 1];
    if (goalie) {
      map[goalie] = {
        liveG:     Number(liveData[i][CFG.LS_G_LIVEG  - 1] || 0),
        liveA:     Number(liveData[i][CFG.LS_G_LIVEA  - 1] || 0),
        indicator: statusToEmoji_(liveData[i][CFG.LS_G_STATUS - 1])
      };
    }
  }
  return map;
}


// ── Build Database lookup map ─────────────────────────────────
function buildDbMapPool_() {
  var database = getSheet_(CFG.SH_DB); // "Database" from main CFG
  var dbData   = database.getDataRange().getValues();
  var map = {};

  for (var i = CFG.DB_START_ROW - 1; i < dbData.length; i++) {
    // Forwards: A=name, B=g, C=a, D=pts
    if (dbData[i][CFG.DB_F_NAME-1]) map[dbData[i][CFG.DB_F_NAME-1]] = {
      seasonG: Number(dbData[i][CFG.DB_F_G-1]||0),
      seasonA: Number(dbData[i][CFG.DB_F_G  ]||0), // col C = B+1
      seasonPoints: Number(dbData[i][CFG.DB_F_G+1]||0) // col D = B+2
    };
    // Defense: F=name, G=g, H=a
    if (dbData[i][CFG.DB_D_NAME-1]) map[dbData[i][CFG.DB_D_NAME-1]] = {
      seasonG: Number(dbData[i][CFG.DB_D_G-1]||0),
      seasonA: Number(dbData[i][CFG.DB_D_G  ]||0),
      seasonPoints: Number(dbData[i][CFG.DB_D_G+1]||0)
    };
    // Goalies: K=name, O=gf, P=a, Q=pts
    if (dbData[i][CFG.DB_G_NAME-1]) map[dbData[i][CFG.DB_G_NAME-1]] = {
      seasonG: Number(dbData[i][CFG.DB_G_GF-1]||0),
      seasonA: Number(dbData[i][CFG.DB_G_A-1] ||0),
      seasonPoints: Number(dbData[i][CFG.DB_G_A]||0)
    };
  }
  return map;
}


// ============================================================
// EXPORT PLAYERS → App_Live Table 1
// ============================================================
function exportPlayers_() {
  var ronde1  = getSheet_(POOL.SH_RONDE1);
  var appLive = getSheet_(POOL.SH_APP_LIVE);
  var liveMap = buildLiveMapPool_();
  var dbMap   = buildDbMapPool_();

  var series = SpreadsheetApp.getActive().getSheetByName(POOL.SH_SERIES);
  var seriesAll = series ? series.getDataRange().getValues() : [];

  // Build eliminated map from Series A16:C31
  var elimMap = {};
  if (series) {
    var elimData = series.getRange("A16:C31").getValues();
    for (var e = 0; e < elimData.length; e++) {
      var team    = String(elimData[e][0] || "").trim().toUpperCase();
      var checked = elimData[e][1] === true;
      if (team) elimMap[team] = checked;
    }
  }

  // Build advancing map from Series results
  // R1: rows index 3-6 EST, 8-11 OUEST — Gagnant=col D(idx 3), Terminée=col F(idx 5)
  var advancingMap = {};
  [3,4,5,6,8,9,10,11].forEach(function(i) {
    var row = seriesAll[i];
    if (!row) return;
    var gagnant = String(row[3] || "").trim().toUpperCase();
    var termine = row[5] === true;
    if (gagnant && termine) advancingMap[gagnant] = true;
  });

  // Build player→team map from PlayerList
  var playerTeamMap = {};
  var pl = SpreadsheetApp.getActive().getSheetByName(CFG.SH_PLAYERS);
  if (pl) {
    var plData = pl.getDataRange().getValues();
    for (var p = 1; p < plData.length; p++) {
      var pName = String(plData[p][0] || "").trim();
      var pTeam = String(plData[p][6] || "").trim().toUpperCase();
      if (pName && pTeam) playerTeamMap[pName] = pTeam;
    }
  }

  // Clear rows 2-299
  appLive.getRange(2, 1, 297, 16).clearContent();

  // Write header row 1
  var headers = [
    "User","Matchup","Round","Position","Player",
    "LiveG","LiveA","SeasonG","SeasonA","TotalPoints",
    "Indicator","UserTotal","OpponentTotal","LeadIndicator","Opponent","Eliminated"
  ];
  appLive.getRange(1, 1, 1, 16).setValues([headers])
    .setFontWeight("bold").setBackground(POOL.COLOR_HEADER).setFontColor(POOL.COLOR_WHITE);
  appLive.setFrozenRows(1);

  var output = [];

  POOL.MATCHUPS.forEach(function(mu, idx) {
    var leftOwner  = mu[0];
    var rightOwner = mu[1];
    var blockStart = mu[2];
    var matchupNum = idx + 1;
    var isFirst    = blockStart === 29;

    var fRow = blockStart + (isFirst ? 2 : 3);
    var dRow = blockStart + (isFirst ? 11 : 12);
    var gRow = blockStart + (isFirst ? 16 : 17);

    var totalRow   = blockStart + (isFirst ? 31 : 32);
    var leftTotal  = Number(ronde1.getRange(totalRow, 2).getValue() || 0);
    var rightTotal = Number(ronde1.getRange(totalRow, 6).getValue() || 0);

    Logger.log("Matchup " + matchupNum + " left=" + leftTotal + " right=" + rightTotal);

    var leadRow   = 3 + (idx * 3);
    var leftLead  = ronde1.getRange(leadRow, 4).getValue() || "";
    var rightLead = ronde1.getRange(leadRow, 7).getValue() || "";

    function makeRow_(owner, player, pos, myTotal, oppTotal, lead, opp) {
      if (!player) return null;
      var live = liveMap[player] || {liveG:0, liveA:0, indicator:""};
      var db   = dbMap[player]   || {seasonG:0, seasonA:0, seasonPoints:0};
      var total = db.seasonPoints;
      var team  = playerTeamMap[player] || "";
      var isElim = team ? (elimMap[team] === true) : false;
      var isDone = team ? (advancingMap[team] === true) : false;
      var elimVal = isElim ? true : (isDone ? false : '');
      return [owner, matchupNum, "Ronde 1", pos, player,
              live.liveG, live.liveA, db.seasonG, db.seasonA, total,
              live.indicator, myTotal, oppTotal, lead, opp, elimVal];
    }

    for (var i = 0; i < 8; i++) {
      var lp = ronde1.getRange(fRow+i, POOL.RONDE_LEFT_NAME).getValue();
      var rp = ronde1.getRange(fRow+i, POOL.RONDE_RIGHT_NAME).getValue();
      var lr = makeRow_(leftOwner,  lp, "F", leftTotal,  rightTotal, leftLead,  rightOwner);
      var rr = makeRow_(rightOwner, rp, "F", rightTotal, leftTotal,  rightLead, leftOwner);
      if (lr) output.push(lr);
      if (rr) output.push(rr);
    }
    for (var i = 0; i < 4; i++) {
      var lp = ronde1.getRange(dRow+i, POOL.RONDE_LEFT_NAME).getValue();
      var rp = ronde1.getRange(dRow+i, POOL.RONDE_RIGHT_NAME).getValue();
      var lr = makeRow_(leftOwner,  lp, "D", leftTotal,  rightTotal, leftLead,  rightOwner);
      var rr = makeRow_(rightOwner, rp, "D", rightTotal, leftTotal,  rightLead, leftOwner);
      if (lr) output.push(lr);
      if (rr) output.push(rr);
    }
    for (var i = 0; i < 2; i++) {
      var lp = ronde1.getRange(gRow+i, POOL.RONDE_LEFT_NAME).getValue();
      var rp = ronde1.getRange(gRow+i, POOL.RONDE_RIGHT_NAME).getValue();
      var lr = makeRow_(leftOwner,  lp, "G", leftTotal,  rightTotal, leftLead,  rightOwner);
      var rr = makeRow_(rightOwner, rp, "G", rightTotal, leftTotal,  rightLead, leftOwner);
      if (lr) output.push(lr);
      if (rr) output.push(rr);
    }
  });

  if (output.length > 0) appLive.getRange(2, 1, output.length, 16).setValues(output);
  Logger.log("exportPlayers_: " + output.length + " rows");
  return output.length;
}
// ============================================================
// EXPORT GOALIE STATS → GoalieStats sheet
// Called by: runFullRefresh(), exportRonde2/3/F()
// Reads W/L/SO from LiveStats goalie section
// HTML reads this sheet by player name to show pills
// ============================================================
function exportGoalieStats() {
  var ls    = getSheet_(CFG.SH_LIVE);
  var ss    = SpreadsheetApp.getActive();
  var gSheet = ss.getSheetByName("GoalieStats");
  if (!gSheet) gSheet = ss.insertSheet("GoalieStats");

  var liveData = ls.getDataRange().getValues();
  var output   = [["Name","W","L","SO","LiveG","LiveA"]];

  for (var i = CFG.LS_START - 1; i < liveData.length; i++) {
    var name = String(liveData[i][CFG.LS_G_NAME - 1] || "").trim();
    if (!name) continue;
    output.push([
      name,
      Number(liveData[i][CFG.LS_G_W    - 1] || 0),
      Number(liveData[i][CFG.LS_G_L    - 1] || 0),
      Number(liveData[i][CFG.LS_G_SO   - 1] || 0),
      Number(liveData[i][CFG.LS_G_LIVEG- 1] || 0),
      Number(liveData[i][CFG.LS_G_LIVEA- 1] || 0)
    ]);
  }

  gSheet.clearContent();
  gSheet.getRange(1, 1, output.length, 6).setValues(output);
  Logger.log("exportGoalieStats: " + (output.length-1) + " goalies");
}

// ============================================================
// EXPORT PREDICTIONS → App_Live cols Q+ rows 1-10
// ============================================================
function exportPredictions_() {
  var draft   = getSheet_(POOL.SH_DRAFT);
  var appLive = getSheet_(POOL.SH_APP_LIVE);

  var predData = draft.getRange(POOL.DRAFT_PRED_START, 1, POOL.DRAFT_PRED_COUNT, 16).getValues();

  var COL_START    = 17; // Column Q
  var seriesLabels = ["EST1","EST2","EST3","EST4","OUEST1","OUEST2","OUEST3","OUEST4"];

  appLive.getRange(1, COL_START, 9, 17).clearContent();

  // Row 1: header
  var headerRow = [["Predictions"].concat(POOL.USERS)];
  appLive.getRange(1, COL_START, 1, 17).setValues(headerRow)
    .setFontWeight("bold").setBackground(POOL.COLOR_HEADER).setFontColor(POOL.COLOR_WHITE);

  // Rows 2-9: picks
  for (var r = 0; r < 8; r++) {
    var rowData = [seriesLabels[r]];
    for (var u = 0; u < 16; u++) {
      rowData.push(String(predData[r][u] || "").trim());
    }
    appLive.getRange(r + 2, COL_START, 1, 17).setValues([rowData]);
  }

// Row 11: Series results for HTML scoring
var series = SpreadsheetApp.getActive().getSheetByName(POOL.SH_SERIES);
var estRes   = series.getRange(4, 4, 4, 3).getValues();
var ouestRes = series.getRange(9, 4, 4, 3).getValues();
var allRes   = estRes.concat(ouestRes);
var resultsRow = ["Results"];
for (var i = 0; i < 8; i++) {
  var finished = allRes[i][2] === true;
  var winner   = finished ? String(allRes[i][0] || "").trim() : "";
  var games    = finished ? String(allRes[i][1] || "").trim() : "";
  resultsRow.push(winner + (games ? "|" + games : ""));
}
// Pad to 17 cols
while (resultsRow.length < 17) resultsRow.push("");
appLive.getRange(11, COL_START, 1, 17).setValues([resultsRow]);
  Logger.log("exportPredictions_: 16 users");
  return 16;
}


// ============================================================
// MASTER REFRESH — run this on trigger
// ============================================================
function runFullRefresh() {
  var p = exportPlayers_();
  var pr = exportPredictions_();
  exportGoalieStats();
  SpreadsheetApp.getActiveSpreadsheet().toast(
    p + " joueurs · " + pr + " prédictions", "✅ App_Live", 4);
}


// ============================================================
// SERIES SHEET SETUP — run once
// ============================================================
/*function setupSeriesSheet() {}
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var draft  = getSheet_(POOL.SH_DRAFT);
  var series = ss.getSheetByName(POOL.SH_SERIES) || ss.insertSheet(POOL.SH_SERIES);
  series.clear();

  var predData = draft.getRange(POOL.DRAFT_PRED_START, 1, POOL.DRAFT_PRED_COUNT, 16).getValues();

  var seriesNames = [];
  for (var r = 0; r < 8; r++) {
    var left  = String(predData[r][0] || "").split("|")[0].trim();
    var right = String(predData[r][1] || "").split("|")[0].trim();
    seriesNames.push(left && right ? left + " vs " + right : "Série " + (r+1));
  }

  // Header
  series.getRange(1,1,1,6).merge().setValue("📊 RÉSULTATS DES SÉRIES")
    .setFontWeight("bold").setBackground(POOL.COLOR_HEADER).setFontColor(POOL.COLOR_WHITE).setHorizontalAlignment("center");

  // Column headers
  series.getRange(2,1,1,6).setValues([["Série","Équipe L","Équipe R","Gagnant","Matchs","Terminée ✅"]])
    .setFontWeight("bold").setBackground("#2a3a4a").setFontColor(POOL.COLOR_WHITE);

  // EST
  series.getRange(3,1,1,6).merge().setValue("EST")
    .setFontWeight("bold").setBackground(POOL.COLOR_EST).setFontColor(POOL.COLOR_WHITE).setHorizontalAlignment("center");
  for (var i = 0; i < 4; i++) {
    var row = 4 + i;
    var parts = seriesNames[i].split(" vs ");
    series.getRange(row,1).setValue(seriesNames[i]);
    series.getRange(row,2).setValue(parts[0]||"");
    series.getRange(row,3).setValue(parts[1]||"");
    series.getRange(row,4).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([parts[0]||"",parts[1]||""],true).build());
    series.getRange(row,5).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["4","5","6","7"],true).build());
    series.getRange(row,6).insertCheckboxes();
    series.getRange(row,1,1,6).setBackground("#1a2535");
  }

  // OUEST
  series.getRange(8,1,1,6).merge().setValue("OUEST")
    .setFontWeight("bold").setBackground(POOL.COLOR_OUEST).setFontColor(POOL.COLOR_WHITE).setHorizontalAlignment("center");
  for (var i = 0; i < 4; i++) {
    var row = 9 + i;
    var parts = seriesNames[4+i].split(" vs ");
    series.getRange(row,1).setValue(seriesNames[4+i]);
    series.getRange(row,2).setValue(parts[0]||"");
    series.getRange(row,3).setValue(parts[1]||"");
    series.getRange(row,4).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([parts[0]||"",parts[1]||""],true).build());
    series.getRange(row,5).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["4","5","6","7"],true).build());
    series.getRange(row,6).insertCheckboxes();
    series.getRange(row,1,1,6).setBackground("#1a2535");
  }

  // Spacer
  series.getRange(13,1,1,6).merge().setValue("").setBackground("#0f1923");

  // Eliminated teams
  var allTeams = {};
  for (var r = 0; r < 8; r++) {
    for (var c = 0; c < 16; c++) {
      var t = String(predData[r][c]||"").split("|")[0].trim();
      if (t) allTeams[t] = true;
    }
  }
  var teamList = Object.keys(allTeams).sort();

  series.getRange(14,1,1,3).merge().setValue("🚫 ÉQUIPES ÉLIMINÉES")
    .setFontWeight("bold").setBackground(POOL.COLOR_ELIM).setFontColor(POOL.COLOR_WHITE).setHorizontalAlignment("center");
  series.getRange(15,1,1,3).setValues([["Équipe","Éliminée ☑️","Ronde"]])
    .setFontWeight("bold").setBackground("#4a0000").setFontColor(POOL.COLOR_WHITE);
  for (var t = 0; t < teamList.length; t++) {
    var row = 16 + t;
    series.getRange(row,1).setValue(teamList[t]);
    series.getRange(row,2).insertCheckboxes();
    series.getRange(row,3).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["1","2","3","4"],true).build());
    series.getRange(row,1,1,3).setBackground("#1a2535");
  }

  series.setColumnWidth(1,180); series.setColumnWidth(2,100);
  series.setColumnWidth(3,100); series.setColumnWidth(4,120);
  series.setColumnWidth(5,80);  series.setColumnWidth(6,100);

    SpreadsheetApp.getActiveSpreadsheet().toast("Series sheet created!", "✅", 4)} */



// ============================================================
// UPDATE PREDICTION PTS — run after each series ends
// ============================================================
function updatePredictionPts() {
  var series  = getSheet_(POOL.SH_SERIES);
  var appLive = getSheet_(POOL.SH_APP_LIVE);
  var estResults   = series.getRange(4, 4, 4, 3).getValues();
  var ouestResults = series.getRange(9, 4, 4, 3).getValues();
  var allResults   = estResults.concat(ouestResults);
  Logger.log(JSON.stringify(allResults));

  var COL_START = 17;
  var predTable = appLive.getRange(1, COL_START, 10, 17).getValues();
  Logger.log(JSON.stringify(predTable));
  var predPtsRow = ["PredPts"];

  for (var u = 0; u < 16; u++) {
    var pts = 0;
    for (var i = 0; i < 8; i++) {
      var result    = allResults[i];
      if (result[2] !== true) continue;
      var winner    = String(result[0]||"").trim();
      var games     = String(result[1]||"").trim();
      var pick      = String(predTable[i+1][u+1]||"").trim();
      var parts     = pick.split(" | ");
      var pickTeam  = parts[0] ? parts[0].trim() : "";
      var pickGames = parts[1] ? parts[1].trim() : "";
      if (winner && pickTeam === winner) {
       pts += (pickGames === games) ? 4 : 2;
}
    }
    predPtsRow.push(pts);
  }

  Logger.log("predTable row 0: " + JSON.stringify(predTable[0]));
Logger.log("allResults: " + JSON.stringify(allResults));

  appLive.getRange(10, COL_START, 1, 17).setValues([predPtsRow]);
  SpreadsheetApp.getActiveSpreadsheet().toast("Prediction points updated!", "✅", 4);
}

/***********************************************************************************
 * SECTION XX: UPDATE RONDE 1 PREDICTION POINTS
 * Safe to edit: YES
 *
 * Reads:
 * - Series results:
 *   D = Winner
 *   E = Games
 *   F = Finished checkbox
 *
 * Reads Ronde 1:
 * - C = left prediction
 * - F = right prediction
 *
 * Writes Ronde 1:
 * - D = left prediction pts
 * - G = right prediction pts
 *
 * Scoring:
 * - Correct winner = 2 pts
 * - Correct winner + correct games = 4 pts
 * - Wrong winner = 0 pts
 ***********************************************************************************/

function updateRonde1PredictionPts() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var series = ss.getSheetByName("Series");
  var ronde  = ss.getSheetByName("Ronde 1");

  if (!series) throw new Error('Sheet "Series" not found.');
  if (!ronde)  throw new Error('Sheet "Ronde 1" not found.');

 var estRaw   = series.getRange("D4:F7").getValues();
var ouestRaw = series.getRange("D9:F12").getValues();
var resultsRaw = estRaw.concat(ouestRaw);
  var results = [];

  for (var i = 0; i < resultsRaw.length; i++) {
    var winner   = String(resultsRaw[i][0] || "").trim();
    var games    = String(resultsRaw[i][1] || "").trim();
    var finished = resultsRaw[i][2] === true;
    if (!finished || !winner || !games) continue;
    results.push({ winner: winner, games: games });
  }

  // Prediction row offsets per block
  // isFirst (blockStart=29): predStart = blockStart + 20
  // others:                  predStart = blockStart + 21
  // EST: predStart+0 to predStart+3
  // OUEST: predStart+5 to predStart+8

  var matchups = [
    ["Francis","Laurent",29],["Jonathan","José",67],["J-P","Éric",105],["Yan","Lionel",143],
    ["Yvon","Joaquin",181],["Guillaume","Simon",219],["David","Mario",257],["Marc-André","Dom",295]
  ];

  matchups.forEach(function(mu) {
    var blockStart = mu[2];
    var isFirst    = blockStart === 29;
    var predStart  = blockStart + (isFirst ? 20 : 21);

    // EST rows 0-3, OUEST rows 5-8
    var predRows = [0,1,2,3,5,6,7,8];

    predRows.forEach(function(offset) {
      var row = predStart + offset;
      var leftPick  = String(ronde.getRange(row, 3).getValue() || "").trim();
      var rightPick = String(ronde.getRange(row, 6).getValue() || "").trim();
      if (leftPick)  ronde.getRange(row, 4).setValue(scoreRonde1Pick_(leftPick,  results));
      if (rightPick) ronde.getRange(row, 7).setValue(scoreRonde1Pick_(rightPick, results));
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Ronde 1 prediction points updated", "POOL", 3);
}

/***********************************************************************************
 * SECTION XX-A: SCORE RONDE 1 PICK
 * Safe to edit: YES
 ***********************************************************************************/

function scoreRonde1Pick_(pick, results) {

  pick = String(pick || "").trim();

  if (!pick) return "";

  var parts = pick.split("|");

  if (parts.length < 2) return "";

  var pickTeam = String(parts[0] || "").trim();
  var pickGames = String(parts[1] || "").trim();

  if (!pickTeam || !pickGames) return "";

  for (var i = 0; i < results.length; i++) {

    if (pickTeam !== results[i].winner) continue;

    if (pickGames === results[i].games) return 4;

    return 2;

  }

  return 0;

}

// ============================================================
// UPDATE ELIMINATED PLAYERS — run after team eliminated
// ============================================================
function onEdit(e) {
 
}

function updateEliminatedPlayers() {
  var ss = SpreadsheetApp.getActive();

  // 1) READ ELIMINATED TEAMS
var elimData = ss.getSheetByName("Series").getRange("A16:C31").getValues();
var eliminated = {};
for (var i = 0; i < elimData.length; i++) {
  var team = String(elimData[i][0] || "").trim().toUpperCase();
  if (team) eliminated[team] = elimData[i][1] === true;
}

  // 2) BUILD PLAYER→TEAM MAPS
  var plData = ss.getSheetByName("PlayerList").getDataRange().getValues();
  var byName = {}, byId = {};
  for (var r = 1; r < plData.length; r++) {
    var n = String(plData[r][0] || "").trim();
    var id = String(plData[r][1] || "").trim();
    var t = String(plData[r][6] || "").trim().toUpperCase();
    if (n && t) byName[n] = t;
    if (id && t) byId[id] = t;
  }

  var ON  = SpreadsheetApp.newTextStyle().setStrikethrough(true).build();
  var OFF = SpreadsheetApp.newTextStyle().setStrikethrough(false).build();

  // 3) HELPER — batch by name
  function applyByName_(sheet, startRow, cols) {
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < startRow) return;
    var n = lastRow - startRow + 1;
    cols.forEach(function(col) {
      var vals = sheet.getRange(startRow, col, n, 1).getValues();
      var range = sheet.getRange(startRow, col, n, 1);
      var styles = vals.map(function(row) {
        var name = String(row[0] || "").trim();
        var isElim = name ? eliminated[byName[name]] === true : false;
        return [isElim ? ON : OFF];
      });
      range.setTextStyles(styles);
    });
  }

  // 4) HELPER — batch by id
  function applyByNameId_(sheet, startRow, visCol, idCol) {
    if (!sheet) return;
    var lastRow = sheet.getLastRow();
    if (lastRow < startRow) return;
    var n = lastRow - startRow + 1;
    var visVals = sheet.getRange(startRow, visCol, n, 1).getValues();
    var idVals  = sheet.getRange(startRow, idCol,  n, 1).getValues();
    var styles = visVals.map(function(row, i) {
      var name = String(row[0] || "").trim();
      if (!name) return [OFF];
      var idMatch = String(idVals[i][0] || "").match(/\d+/);
      var pid = idMatch ? idMatch[0] : "";
      var team = (pid && byId[pid]) || byName[name] || "";
      return [eliminated[team] === true ? ON : OFF];
    });
    sheet.getRange(startRow, visCol, n, 1).setTextStyles(styles);
  }

  // 5) APPLY
  applyByName_(ss.getSheetByName("App_Live"),   2, [5]);
  applyByName_(ss.getSheetByName("App_Ronde2"), 2, [5]);
  applyByName_(ss.getSheetByName("App_Ronde3"), 2, [5]);
  applyByName_(ss.getSheetByName("Ronde 1"),    1, [3, 6]);
  applyByName_(ss.getSheetByName("LiveStats"),  3, [1, 8]);
  applyByName_(ss.getSheetByName("GoalieStats"),2, [1]);

  var db = ss.getSheetByName("Database");
  applyByNameId_(db, 5, 1,  22);
  applyByNameId_(db, 5, 6,  25);
  applyByNameId_(db, 5, 11, 28);

  ss.toast("Eliminated players updated", "✅", 3);
}



function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}


function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function statusToEmoji_(status) {
  if (!status) return "";
  var s = String(status).toUpperCase().trim();
  if (s === "LIVE")   return "🟢";
  if (s === "PRE")    return "🟡";
  if (s === "FINAL")  return "✅";
  if (s === "OFF")    return "🔴";
  if (s === "INJURY") return "⛔";
  if (s === "OUT")    return "⛔";
  return "";
}


/***********************************************************************************
 * APPLY SERIES STATUS (ELIMINATED + ROUND)
 * Safe to edit: YES
 ***********************************************************************************/

function applySeriesStatus() {

  try {

    var ss = SpreadsheetApp.getActive();
    var series = ss.getSheetByName("Series");
    if (!series) throw new Error('Sheet "Series" not found');

    var data = series.getDataRange().getValues();

    var eliminatedTeams = {};
    var advancedTeams = {};

    /***** 1) READ TEAM STATUS FROM SERIES SHEET *****/
    // Assumes:
    // A = Team
    // B = Eliminated checkbox
    // C = Round

    for (var i = 15; i < data.length; i++) {

      var team = String(data[i][0] || "").trim();
      if (!team) continue;

      var isElim = data[i][1] === true;
      var round = Number(data[i][2] || 0);

      if (isElim) {
        eliminatedTeams[team] = true;
      } else if (round > 1) {
        advancedTeams[team] = round;
      }

    }


    /***** 2) APPLY ELIMINATED (EXISTING SYSTEM) *****/
    updateEliminatedPlayers();


    /***** 3) APPLY ADVANCED STATE (ROUND > 1) *****/
    // NOTE:
    // We do NOT modify formulas
    // We only store or format via helper / future UI use

    var db = ss.getSheetByName("Database");
    if (!db) return;

    var dbData = db.getDataRange().getValues();

    // Assumes:
    // Column B = Team
    // Column ??? = where you want to store round (adjust if needed)

    var TEAM_COL = 30;   // AE
    var ADV_COL  = 31;  // AF

    for (var r = 1; r < dbData.length; r++) {

      var teamName = String(dbData[r][TEAM_COL] || "").trim();

      if (!teamName) continue;

      if (eliminatedTeams[teamName]) {

        dbData[r][ADV_COL] = ""; // eliminated overrides

      } else if (advancedTeams[teamName]) {

        dbData[r][ADV_COL] = advancedTeams[teamName]; // store 2 / 3 / 4

      } else {

        dbData[r][ADV_COL] = ""; // clean reset

      }

    }

    db.getRange(1, 1, dbData.length, dbData[0].length).setValues(dbData);


    /***** DONE *****/
    SpreadsheetApp.getActiveSpreadsheet().toast("Series status applied", "POOL", 3);

  } catch (err) {

    Logger.log("applySeriesStatus ERROR: " + err);
    SpreadsheetApp.getActiveSpreadsheet().toast("Series status error", "❌", 5);

  }

}


/***********************************************************************************
 * SECTION XX: WRITE TEAM ROUNDS TO DATABASE
 * Safe to edit: YES
 *
 * Purpose:
 * - Reads Series sheet
 * - Takes Team from column A
 * - Takes Ronde from column C
 * - Writes Team / Round into Database AE:AF
 *
 * Database output:
 * AE = Team
 * AF = Round
 ***********************************************************************************/

function writeTeamRoundsToDatabase() {

  var ss = SpreadsheetApp.getActive();

  var series = ss.getSheetByName("Series");
  var db = ss.getSheetByName("Database");

  if (!series) throw new Error('Sheet "Series" not found.');
  if (!db) throw new Error('Sheet "Database" not found.');

  var seriesData = series.getDataRange().getValues();
  var output = [];

  /***** 1) READ SERIES TABLE *****/
  // Series columns:
  // A = Team
  // B = Eliminated checkbox
  // C = Ronde

  for (var i = 1; i < seriesData.length; i++) {

    var team = String(seriesData[i][0] || "").trim();
    if (!team) continue;

    var eliminated = seriesData[i][1] === true;
    var round = Number(seriesData[i][2] || 0);

    /***** 2) ELIMINATED OVERRIDE *****/
    if (eliminated) {
      round = 0;
    }

    output.push([team, round]);

  }

  /***** 3) WRITE TO DATABASE AE:AF *****/
  // AE = column 31 in Apps Script getRange()
  // AF = column 32

  db.getRange("AE:AF").clearContent();

  db.getRange(1, 31, 1, 2).setValues([["Team", "Round"]]);

  if (output.length > 0) {
    db.getRange(2, 31, output.length, 2).setValues(output);
  }

}

/***********************************************************************************
 * SECTION XX: WRITE TEAM ROUNDS TO DATABASE
 * Safe to edit: YES
 *
 * Reads ONLY the eliminated/team table on Series:
 * A16:C31
 *
 * Writes clean output to Database:
 * AE1:AF17
 ***********************************************************************************/

function writeTeamRoundsToDatabase() {

  var ss = SpreadsheetApp.getActive();

  var series = ss.getSheetByName("Series");
  var db = ss.getSheetByName("Database");

  if (!series) throw new Error('Sheet "Series" not found.');
  if (!db) throw new Error('Sheet "Database" not found.');

  /***** 1) READ ONLY TEAM TABLE *****/
  // Series table:
  // A16:A31 = Team
  // B16:B31 = Eliminated checkbox
  // C16:C31 = Ronde

  var seriesData = series.getRange("A16:C31").getValues();
  var output = [["Team", "Round"]];

  for (var i = 0; i < seriesData.length; i++) {

    var team = String(seriesData[i][0] || "").trim();
    if (!team) continue;

    var eliminated = seriesData[i][1] === true;
    var round = Number(seriesData[i][2] || 0);

    if (eliminated) {
      round = 0;
    }

    output.push([team, round]);

  }

  /***** 2) CLEAR ONLY OUTPUT AREA *****/
  db.getRange("AE1:AF17").clearContent();

  /***** 3) WRITE CLEAN TEAM ROUND TABLE *****/
  db.getRange(1, 31, output.length, 2).setValues(output);

  SpreadsheetApp.getActiveSpreadsheet().toast("Team rounds written to Database AE:AF", "POOL", 3);

}

/***********************************************************************************
 * SECTION XX: WRITE TEAM ROUNDS TO DATABASE
 * Safe to edit: YES
 *
 * Reads Series A16:C31
 * Writes to Database AF5:AG (Team / Round)
 ***********************************************************************************/

function writeTeamRoundsToDatabase() {

  var ss = SpreadsheetApp.getActive();

  var series = ss.getSheetByName("Series");
  var db = ss.getSheetByName("Database");

  if (!series) throw new Error('Sheet "Series" not found.');
  if (!db) throw new Error('Sheet "Database" not found.');

  /***** 1) READ SERIES TEAM TABLE *****/
  var seriesData = series.getRange("A16:C31").getValues();

  var output = [];

  for (var i = 0; i < seriesData.length; i++) {

    var team = String(seriesData[i][0] || "").trim();
    if (!team) continue;

    var eliminated = seriesData[i][1] === true;
    var round = Number(seriesData[i][2] || 0);

    if (eliminated) {
      round = 0;
    }

    output.push([team, round]);

  }

  /***** 2) CLEAR ONLY YOUR OUTPUT ZONE *****/
  db.getRange("AE5:AF25").clearContent();

  /***** 3) WRITE CLEAN DATA *****/
   
    db.getRange(5, 31, output.length, 2).setValues(output);
  

  SpreadsheetApp.getActiveSpreadsheet().toast("Team rounds updated (AF5)", "POOL", 3);

}


/***********************************************************************************
 * APPLY SERIES UPDATE (MANUAL BUTTON)
 * Safe to edit: YES
 ***********************************************************************************/

function applySeriesUpdate() {
  try {
    var config = JSON.parse(SpreadsheetApp.getActive().getSheetByName("Config").getRange("B1").getValue());
    var activeRound = config.round || 1;

    if (activeRound === 1) {
      writeTeamRoundsToDatabase();
      runFullRefresh();
      updatePredictionPts();
      exportFinalModeFlags();
      updateRonde1PredictionPts();
      updateEliminatedPlayers();
    } else if (activeRound === 2) {
      exportRonde2();
      exportGoalieStats();
      updateEliminatedPlayers();
    } else if (activeRound === 3) {
      exportRonde3();
      exportGoalieStats();
      updateEliminatedPlayers();
    } else if (activeRound === 4) {
      exportRondeF();
      exportGoalieStats();
      updateEliminatedPlayers();
    }

    SpreadsheetApp.getActiveSpreadsheet().toast("Series update applied ✅ (Ronde "+activeRound+")", "POOL", 3);
  } catch (err) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Error: " + err.message, "❌", 6);
  }
}

// ============================================================
// EXPORT GOALIE STATS → GoalieStats sheet
// Called by: runFullRefresh(), exportRonde2/3/F()
// Reads W/L/SO/LiveG/LiveA from LiveStats goalie section
// HTML reads this sheet by player name to show stat pills
// ============================================================
function exportGoalieStats() {
  var ls     = getSheet_(CFG.SH_LIVE);
  var ss     = SpreadsheetApp.getActive();
  var gSheet = ss.getSheetByName("GoalieStats");
  if (!gSheet) gSheet = ss.insertSheet("GoalieStats");
  gSheet = ss.getSheetByName("GoalieStats");

  var liveData = ls.getDataRange().getValues();
  var output   = [["Name","W","L","SO","LiveG","LiveA"]];

  for (var i = CFG.LS_START - 1; i < liveData.length; i++) {
    var name = String(liveData[i][CFG.LS_G_NAME - 1] || "").trim();
    Logger.log("Row " + i + " goalie name: '" + name + "'");
if (!name) continue;
    output.push([
      name,
      Number(liveData[i][CFG.LS_G_W    - 1] || 0),
      Number(liveData[i][CFG.LS_G_L    - 1] || 0),
      Number(liveData[i][CFG.LS_G_SO   - 1] || 0),
      Number(liveData[i][CFG.LS_G_LIVEG - 1] || 0),
      Number(liveData[i][CFG.LS_G_LIVEA - 1] || 0)
    ]);
  }

  gSheet.clearContents();
  gSheet.getRange(1, 1, output.length, 6).setValues(output);
  Logger.log("exportGoalieStats: " + (output.length - 1) + " goalies");
}




// ============================================================
// EXPORT FINAL MODE FLAGS → Config sheet
// G2 = End R1 | N2 = End R2 | U2 = End R3 | AB2 = End RF
// G4 = Start R2 | N4 = Start R3 | U4 = Start Finale
// ============================================================
function exportFinalModeFlags() {
  var ss     = SpreadsheetApp.getActive();
  var series = ss.getSheetByName("Series");
  var ronde1 = ss.getSheetByName(POOL.SH_RONDE1);

  // ── Read End checkboxes ──
  var r1Final = series.getRange("G2").getValue() === true;
  var r2Final = series.getRange("N2").getValue() === true;
  var r3Final = series.getRange("U2").getValue() === true;
  var rfFinal = series.getRange("AB2").getValue() === true;

  // ── Read Start checkboxes ──
  var r2Start = series.getRange("G4").getValue() === true;
  var r3Start = series.getRange("N4").getValue() === true;
  var rfStart = series.getRange("U4").getValue() === true;

  // ── Determine current round ──
  var currentRound = 1;
  if      (rfStart) currentRound = 4;
  else if (r3Start) currentRound = 3;
  else if (r2Start) currentRound = 2;
  else              currentRound = 1;

  // ── Determine final mode for current round ──
  var finalMode = false;
  if (currentRound === 1 && r1Final) finalMode = true;
  if (currentRound === 2 && r2Final) finalMode = true;
  if (currentRound === 3 && r3Final) finalMode = true;
  if (currentRound === 4 && rfFinal) finalMode = true;

  // ── Helper: get winners from an App sheet by UserTotal ──
  function getWinnersFromAppSheet(sheetName, matchupCount) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var totalMap = {};
    var matchupUsers = {};
    for (var i = 1; i < data.length; i++) {
      var user  = String(data[i][0] || '').trim();
      var mu    = Number(data[i][1] || 0);
      var total = Number(data[i][11] || 0);
      if (!user || !mu) continue;
      if (!totalMap[user] || total > totalMap[user]) totalMap[user] = total;
      if (!matchupUsers[mu]) matchupUsers[mu] = [];
      if (matchupUsers[mu].indexOf(user) === -1) matchupUsers[mu].push(user);
    }
    var winners = [];
    for (var m = 1; m <= matchupCount; m++) {
      var users = matchupUsers[m] || [];
      if (users.length < 2) continue;
      var u0 = users[0], u1 = users[1];
      var t0 = totalMap[u0] || 0, t1 = totalMap[u1] || 0;
      winners.push({ name: t0 >= t1 ? u0 : u1, pts: Math.max(t0, t1) });
    }
    winners.sort(function(a, b) { return b.pts - a.pts; });
    return winners.map(function(w) { return w.name; });
  }

  // ── Build R1 winners from Ronde 1 sheet totals ──
  var totalMap = {};
  POOL.MATCHUPS.forEach(function(mu) {
    var isFirst  = mu[2] === 29;
    var totalRow = mu[2] + (isFirst ? 31 : 32);
    totalMap[mu[0]] = Number(ronde1.getRange(totalRow, 2).getValue() || 0);
    totalMap[mu[1]] = Number(ronde1.getRange(totalRow, 6).getValue() || 0);
  });
  var r1Winners = POOL.MATCHUPS.map(function(mu) {
    var lt = totalMap[mu[0]] || 0;
    var rt = totalMap[mu[1]] || 0;
    return { name: lt >= rt ? mu[0] : mu[1], pts: Math.max(lt, rt) };
  });
  r1Winners.sort(function(a, b) { return b.pts - a.pts; });
  r1Winners = r1Winners.map(function(w) { return w.name; });

  // ── Build R2 and R3 winners from App sheets ──
  var r2Winners = r2Final ? getWinnersFromAppSheet(ROUND_CFG.SH_APP_R2, 4) : [];
  var r3Winners = r3Final ? getWinnersFromAppSheet(ROUND_CFG.SH_APP_R3, 2) : [];

  // ── Determine which winners to include ──
  var winners = [];
  if (currentRound === 1) winners = r1Final ? r1Winners : [];
  if (currentRound === 2) winners = r2Final ? r2Winners : [];
  if (currentRound === 3) winners = r3Final ? r3Winners : [];

  // ── Write to Config sheet ──
  var cfg = ss.getSheetByName("Config");
  if (!cfg) cfg = ss.insertSheet("Config");
  cfg.clearContents();
  cfg.clearFormats();

  var configData = JSON.stringify({
    round: currentRound,
    finalMode: finalMode,
    winners: winners
  });

  cfg.getRange("A1").setValue("CONFIG");
  cfg.getRange("B1").setValue(configData);

  Logger.log("exportFinalModeFlags: Round=" + currentRound + " FinalMode=" + finalMode + " R1Winners=" + JSON.stringify(r1Winners) + " R2Winners=" + JSON.stringify(r2Winners));
}

function debugWinners() {
  var app = SpreadsheetApp.getActive().getSheetByName(POOL.SH_APP_LIVE);
  var data = app.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < data.length; i++) {
    var user = String(data[i][0] || "").trim();
    var total = Number(data[i][11] || 0);
    if (user && (!map[user] || total > map[user])) map[user] = total;
  }
  Logger.log(JSON.stringify(map));
}


function debugRonde1Totals() {
  var ronde1 = SpreadsheetApp.getActive().getSheetByName("Ronde 1");
  POOL.MATCHUPS.forEach(function(mu) {
    var isFirst = mu[2] === 29;
var totalRow = mu[2] + (isFirst ? 31 : 32);
    var left = ronde1.getRange(totalRow, 2).getValue();
    var right = ronde1.getRange(totalRow, 6).getValue();
    Logger.log(mu[0] + "=" + left + " vs " + mu[1] + "=" + right);
  });
}


function testWinners() {
  var ss = SpreadsheetApp.getActive();
  var app = ss.getSheetByName(POOL.SH_APP_LIVE);
  var row = app.getRange("R13:Y13").getValues()[0];
  Logger.log(JSON.stringify(row));
}

// ============================================================
// Add these functions to glide.gs
// Called by applySeriesUpdate() for rounds 2, 3, F
// ============================================================

// ── Score a single pick against results ──────────────────────
// pick format: "TBL | 6"
// returns 4 if team+games match, 2 if team only, 0 if no match
function scoreRondePick_(pick, results) {
  if (!pick) return 0;
  var parts = pick.split("|");
  if (parts.length < 2) return 0;
  var team  = parts[0].trim();
  var games = parts[1].trim();
  for (var i = 0; i < results.length; i++) {
    if (results[i].winner === team) {
      return results[i].games === games ? 4 : 2;
    }
  }
  return 0;
}

// ── Read series results from a sheet range ───────────────────
// range cols: 0=Gagnant, 1=Matchs, 2=Terminée
function readSeriesResults_(series, rangeStr) {
  var raw = series.getRange(rangeStr).getValues();
  var results = [];
  for (var i = 0; i < raw.length; i++) {
    var winner   = String(raw[i][0] || "").trim();
    var games    = String(raw[i][1] || "").trim();
    var finished = raw[i][2] === true;
    if (!finished || !winner || !games) continue;
    results.push({ winner: winner, games: games });
  }
  return results;
}

// ── Score all pred rows in a sheet dynamically ───────────────
// Finds MATCHUP blocks, then PRÉDICTIONS section within each,
// scores EST rows (before blank) and OUEST rows (after blank)
function scoreRondeSheet_(ronde, results) {
  if (results.length === 0) return;

  var data = ronde.getDataRange().getValues();
  var numRows = data.length;

  // Find all MATCHUP header rows
  var blockStarts = [];
  for (var i = 0; i < numRows; i++) {
    if (String(data[i][1] || "").indexOf("MATCHUP") === 0) {
      blockStarts.push(i + 1); // 1-based row
    }
  }

  blockStarts.forEach(function(blockStartRow) {
    // Find PRÉDICTIONS row within this block
    var predHeaderRow = -1;
    for (var i = blockStartRow; i < Math.min(blockStartRow + 40, numRows); i++) {
      if (String(data[i-1][1] || "").indexOf("PRÉD") !== -1) {
        predHeaderRow = i;
        break;
      }
    }
    if (predHeaderRow === -1) return;

    // Collect pred rows: start after PRÉDICTIONS header
    // EST rows = consecutive non-blank rows after header
    // blank row separates EST from OUEST
    // OUEST rows = consecutive non-blank rows after blank
    // Stop at Points row or next MATCHUP
    var estRows = [], ouestRows = [];
    var inEst = true;
    var r = predHeaderRow + 1;
    while (r <= numRows && r < blockStartRow + 40) {
      var rowData = data[r-1];
      var pick = String(rowData[2] || "").trim();
      var col2 = String(rowData[1] || "").trim();

      // Stop at Points row or MATCHUP
      var col3 = String(rowData[2] || "").trim();
if (col3.indexOf("Points") !== -1 || col2.indexOf("MATCHUP") !== -1) break;
      if (pick === "") {
        // blank row = switch from EST to OUEST
        if (inEst && estRows.length > 0) inEst = false;
      } else {
        if (inEst) estRows.push(r);
        else ouestRows.push(r);
      }
      r++;
    }

    // Score all pred rows
    var allPredRows = estRows.concat(ouestRows);
    allPredRows.forEach(function(row) {
      var leftPick  = String(ronde.getRange(row, 3).getValue() || "").trim();
      var rightPick = String(ronde.getRange(row, 6).getValue() || "").trim();
      if (leftPick)  ronde.getRange(row, 4).setValue(scoreRondePick_(leftPick,  results));
      if (rightPick) ronde.getRange(row, 7).setValue(scoreRondePick_(rightPick, results));
    });
  });
}

// ============================================================
// RONDE 2 — EST: K4:M5, OUEST: K9:M10
// ============================================================
function updateRonde2PredictionPts() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var series = ss.getSheetByName("Series");
  var ronde  = ss.getSheetByName("Ronde 2");
  if (!series || !ronde) return;

  var results = readSeriesResults_(series, "K4:M5")
    .concat(readSeriesResults_(series, "K9:M10"));

  scoreRondeSheet_(ronde, results);
  ss.toast("Ronde 2 prediction points updated", "POOL", 3);
}

// ============================================================
// RONDE 3 — EST: R4:T4, OUEST: R9:T9
// ============================================================
function updateRonde3PredictionPts() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var series = ss.getSheetByName("Series");
  var ronde  = ss.getSheetByName("Ronde 3");
  if (!series || !ronde) return;

  var results = readSeriesResults_(series, "R4:T4")
    .concat(readSeriesResults_(series, "R9:T9"));

  scoreRondeSheet_(ronde, results);
  ss.toast("Ronde 3 prediction points updated", "POOL", 3);
}

// ============================================================
// FINALE — Y4:AA4
// ============================================================
function updateRondeFPredictionPts() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var series = ss.getSheetByName("Series");
  var ronde  = ss.getSheetByName("Ronde F");
  if (!series || !ronde) return;

  var results = readSeriesResults_(series, "Y4:AA4");

  scoreRondeSheet_(ronde, results);
  ss.toast("Finale prediction points updated", "POOL", 3);
}
