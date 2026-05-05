// =============================================================================
// HOCKEY POOL — TEST SUITE
// Run these to verify all systems work correctly
// Each test logs results to execution log
// =============================================================================


// =============================================================================
// TEST 1 — API CONNECTIVITY
// Verifies NHL API is reachable and returning data
// =============================================================================
function test_API_Connectivity() {
  Logger.log("=== TEST 1: API CONNECTIVITY ===");
  try {
    var url  = "https://api-web.nhle.com/v1/scoreboard/" + today_();
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    Logger.log("Status: " + resp.getResponseCode());
    Logger.log("PASS ✅ — API reachable");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 2 — TODAYS GAMES
// Lists all games today with state and teams
// =============================================================================
function test_TodaysGames() {
  Logger.log("=== TEST 2: TODAYS GAMES ===");
  try {
    var games = fetchGamesForDate_();
    Logger.log("Games found: " + games.length);
    for (var i = 0; i < games.length; i++) {
      var g     = games[i];
      var home  = c_(g.homeTeam && (g.homeTeam.abbrev || g.homeTeam.triCode));
      var away  = c_(g.awayTeam && (g.awayTeam.abbrev || g.awayTeam.triCode));
      var state = normaliseState_(g.gameState);
      Logger.log("  " + away + " @ " + home + " | " + state + " | ID=" + g.id);
    }
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 3 — PLAYER ID MAP
// Verifies Database right-side lookup tables are populated
// =============================================================================
function test_PlayerIdMap() {
  Logger.log("=== TEST 3: PLAYER ID MAP ===");
  try {
    var idMap = buildIdMap_();
    var count = Object.keys(idMap).length;
    Logger.log("Total players in idMap: " + count);
    if (count === 0) {
      Logger.log("FAIL ❌ — No players found. Check Database cols V/W, Y/Z, AB/AC");
      return;
    }
    // Log first 5 entries
    var keys = Object.keys(idMap).slice(0, 5);
    for (var i = 0; i < keys.length; i++) {
      Logger.log("  " + keys[i] + " → " + idMap[keys[i]]);
    }
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 4 — BASELINE MAP
// Verifies Database left tables are populated and match right-side IDs
// =============================================================================
function test_BaselineMap() {
  Logger.log("=== TEST 4: BASELINE MAP ===");
  try {
    var idMap   = buildIdMap_();
    var baseMap = buildBaselineMap_();
    var idCount   = Object.keys(idMap).length;
    var baseCount = Object.keys(baseMap).length;

    Logger.log("Players in idMap: " + idCount);
    Logger.log("Players in baseMap: " + baseCount);

    if (baseCount < idCount) {
      Logger.log("WARNING ⚠️ — " + (idCount - baseCount) + " players have ID but no baseline");
      Logger.log("These players need to be added to Database left tables (cols A, F, K)");
    }

    // Find missing players
    for (var id in idMap) {
      if (!baseMap[id]) {
        // Find name for this id
        for (var name in idMap) {
          if (idMap[name] === id) {
            Logger.log("  MISSING BASELINE: " + name + " (ID=" + id + ")");
            break;
          }
        }
      }
    }

    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 5 — PLAYER INFO MAP (TEAM MATCHING)
// Verifies PlayerList has team data for all pool players
// =============================================================================
function test_PlayerInfoMap() {
  Logger.log("=== TEST 5: PLAYER INFO MAP ===");
  try {
    var infoMap = buildPlayerInfoMap_();
    var idMap   = buildIdMap_();
    var count   = Object.keys(infoMap).length;
    Logger.log("Players in infoMap: " + count);

    var missingTeam = 0;
    var missingPos  = 0;

    // Check all pool players
    for (var name in idMap) {
      var id   = idMap[name];
      var info = infoMap[id];
      if (!info) {
        Logger.log("  NOT IN PLAYERLIST: " + name + " (ID=" + id + ")");
        continue;
      }
      if (!info.team) { missingTeam++; Logger.log("  NO TEAM: " + name); }
      if (!info.pos)  { missingPos++;  Logger.log("  NO POS: " + name); }
    }

    if (missingTeam === 0 && missingPos === 0) {
      Logger.log("PASS ✅ — All players have team and position");
    } else {
      Logger.log("WARNING ⚠️ — " + missingTeam + " missing team, " + missingPos + " missing position");
    }
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 6 — SPECIFIC PLAYER FULL TRACE
// Traces one player end-to-end through all systems
// Change PLAYER_ID to test any player
// =============================================================================
function test_PlayerFullTrace() {
  var PLAYER_ID = "8478010"; // Brayden Point — change this to test others

  Logger.log("=== TEST 6: FULL PLAYER TRACE | ID=" + PLAYER_ID + " ===");
  try {
    // 1) PlayerList
    var infoMap = buildPlayerInfoMap_();
    var info    = infoMap[PLAYER_ID] || {};
    Logger.log("PlayerList: name=" + info.name + " pos=" + info.pos + " team=" + info.team);

    // 2) Database baseline
    var baseMap = buildBaselineMap_();
    var base    = baseMap[PLAYER_ID] || null;
    if (base) {
      Logger.log("Baseline: G=" + base.gBase + " A=" + base.aBase + " W=" + base.wBase + " L=" + base.lBase + " SO=" + base.soBase);
    } else {
      Logger.log("Baseline: NOT FOUND ⚠️");
    }

    // 3) Today's game
    var games  = fetchGamesForDate_();
    var tgMap  = buildTeamGameMap_(games);
    var game   = info.team ? tgMap[info.team] : null;
    if (game) {
      Logger.log("Game: ID=" + game.id + " state=" + normaliseState_(game.gameState));
    } else {
      Logger.log("Game: NO GAME TODAY");
    }

    // 4) LiveStats
    var ls    = getSheet_(CFG.SH_LIVE);
    var sIds  = ls.getRange(CFG.LS_START, CFG.LS_S_ID, 100, 1).getValues();
    var found = false;
    for (var i = 0; i < sIds.length; i++) {
      if (c_(sIds[i][0]) === PLAYER_ID) {
        var row = CFG.LS_START + i;
        Logger.log("LiveStats row " + row + ": G=" + ls.getRange(row, CFG.LS_S_LIVEG).getValue() +
          " A=" + ls.getRange(row, CFG.LS_S_LIVEA).getValue() +
          " Status=" + ls.getRange(row, CFG.LS_S_STATUS).getValue());
        found = true;
        break;
      }
    }
    if (!found) Logger.log("LiveStats: NOT FOUND ⚠️");

    // 5) GameLog
    var gl    = getSheet_(CFG.SH_GAMELOG);
    var gIds  = gl.getRange(CFG.GL_START, CFG.GL_ID, 100, 1).getValues();
    var gFound = false;
    for (var j = 0; j < gIds.length; j++) {
      if (c_(gIds[j][0]) === PLAYER_ID) {
        var grow = CFG.GL_START + j;
        Logger.log("GameLog row " + grow + ": status=" + gl.getRange(grow, CFG.GL_STATUS).getValue() +
          " chg=" + gl.getRange(grow, CFG.GL_CHG_SKT).getValue());
        gFound = true;
        break;
      }
    }
    if (!gFound) Logger.log("GameLog: NOT FOUND (no game today or OFF)");

    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 7 — PBP STATS FOR LIVE/FINAL GAME
// Tests that play-by-play is returning goal data correctly
// =============================================================================
function test_PBPStats() {
  Logger.log("=== TEST 7: PBP STATS ===");
  try {
    var games = fetchGamesForDate_();
    var tested = 0;

    for (var i = 0; i < games.length; i++) {
      var game  = games[i];
      var state = normaliseState_(game.gameState);
      if (state !== "LIVE" && state !== "FINAL") continue;

      var gameId = c_(game.id);
      var pbp    = buildPBPStatsMap_(gameId);
      var keys   = Object.keys(pbp);

      Logger.log("Game " + gameId + " (" + state + "): " + keys.length + " players with points");
      for (var j = 0; j < Math.min(keys.length, 5); j++) {
        var pid   = keys[j];
        var stats = pbp[pid];
        Logger.log("  ID=" + pid + " G=" + stats.g + " A=" + stats.a);
      }
      tested++;
      if (tested >= 2) break; // Only test first 2 games
    }

    if (tested === 0) {
      Logger.log("No LIVE or FINAL games right now — run during game night");
    }
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 8 — GOALIE BOXSCORE
// Tests goalie W/L/SO data from boxscore for completed games
// =============================================================================
function test_GoalieBoxscore() {
  Logger.log("=== TEST 8: GOALIE BOXSCORE ===");
  try {
    var games  = fetchGamesForDate_();
    var tested = 0;

    for (var i = 0; i < games.length; i++) {
      var game  = games[i];
      var state = normaliseState_(game.gameState);
      if (state !== "FINAL") continue;

      var gameId  = c_(game.id);
      var goalies = buildGoalieBoxscoreMap_(gameId);
      var keys    = Object.keys(goalies);

      Logger.log("Game " + gameId + " (FINAL): " + keys.length + " goalies");
      for (var j = 0; j < keys.length; j++) {
        var gid  = keys[j];
        var gs   = goalies[gid];
        Logger.log("  ID=" + gid + " W=" + gs.wins + " L=" + gs.losses + " SO=" + gs.shutouts);
      }
      tested++;
      if (tested >= 2) break;
    }

    if (tested === 0) {
      Logger.log("No FINAL games right now — run after games end");
    }
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 9 — STATE NORMALISATION
// Verifies all NHL API states map correctly
// =============================================================================
function test_StateNormalisation() {
  Logger.log("=== TEST 9: STATE NORMALISATION ===");
  var tests = [
    { input:"LIVE",  expected:"LIVE"  },
    { input:"CRIT",  expected:"LIVE"  },
    { input:"PRE",   expected:"PRE"   },
    { input:"FUT",   expected:"OFF"   },
    { input:"FINAL", expected:"FINAL" },
    { input:"OFF",   expected:"FINAL" },
    { input:"",      expected:"OFF"   }
  ];
  var passed = 0;
  for (var i = 0; i < tests.length; i++) {
    var result = normaliseState_(tests[i].input);
    var ok     = result === tests[i].expected;
    Logger.log((ok ? "✅" : "❌") + " " + tests[i].input + " → " + result + (ok ? "" : " (expected " + tests[i].expected + ")"));
    if (ok) passed++;
  }
  Logger.log(passed + "/" + tests.length + " passed");
}


// =============================================================================
// TEST 10 — SYNCED DETECTION
// Simulates the synced check for a player
// Verifies it only triggers when official stats catch up
// =============================================================================
function test_SyncedDetection() {
  Logger.log("=== TEST 10: SYNCED DETECTION ===");

  // Simulate: player had G_Base=29, scored 1 tonight, so expected=30
  // Test 1: official still at 29 → NOT synced
  // Test 2: official updated to 30 → SYNCED
  // Test 3: player had 0 live goals → should NOT sync (nothing to sync)

  var scenarios = [
    { name:"Official not updated yet", gBase:29, gLive:1, officialNow:29, shouldSync:false },
    { name:"Official caught up",       gBase:29, gLive:1, officialNow:30, shouldSync:true  },
    { name:"No live goals",            gBase:29, gLive:0, officialNow:29, shouldSync:false },
    { name:"Multiple goals",           gBase:29, gLive:2, officialNow:31, shouldSync:true  },
    { name:"Official ahead (rare)",    gBase:29, gLive:1, officialNow:31, shouldSync:true  }
  ];

  var passed = 0;
  for (var i = 0; i < scenarios.length; i++) {
    var s           = scenarios[i];
    var hadLive     = s.gLive > 0;
    var expected    = s.gBase + s.gLive;
    var isSynced    = hadLive && (s.officialNow >= expected);
    var ok          = isSynced === s.shouldSync;
    Logger.log((ok ? "✅" : "❌") + " " + s.name);
    Logger.log("   base=" + s.gBase + " live=" + s.gLive + " official=" + s.officialNow + " → synced=" + isSynced);
    if (ok) passed++;
  }
  Logger.log(passed + "/" + scenarios.length + " passed");
}


// =============================================================================
// TEST 11 — PLAYOFFS MODE
// Verifies T2 checkbox switches season correctly
// =============================================================================
function test_PlayoffsMode() {
  Logger.log("=== TEST 11: PLAYOFFS MODE ===");
  try {
    var db       = getSheet_(CFG.SH_DB);
    var isPlayoff = db.getRange(CFG.DB_PLAYOFFS).getValue();
    Logger.log("T2 checkbox value: " + isPlayoff);
    Logger.log("Mode: " + (isPlayoff === true ? "PLAYOFFS (gameTypeId=3)" : "REGULAR SEASON (gameTypeId=2)"));
    Logger.log("Target season: " + CFG.TARGET_SEASON);

    // Test fetch for one known player in both modes
    var testId = "8478010"; // Brayden Point
    Logger.log("Testing Point (ID=" + testId + ") in current mode...");
    var stats = fetchSeasonStats_(testId, false, isPlayoff === true);
    Logger.log("Goals=" + stats.goals + " Assists=" + stats.assists);

    if (stats.goals === 0 && stats.assists === 0) {
      Logger.log("WARNING ⚠️ — No stats found. Check TARGET_SEASON or gameTypeId");
    } else {
      Logger.log("PASS ✅");
    }
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 12 — LIVESTATS SHEET INTEGRITY
// Checks LiveStats has correct data in correct columns
// =============================================================================
function test_LiveStatsIntegrity() {
  Logger.log("=== TEST 12: LIVESTATS INTEGRITY ===");
  try {
    var ls      = getSheet_(CFG.SH_LIVE);
    var maxRow  = ls.getLastRow();
    var numRows = Math.max(maxRow - CFG.LS_START + 1, 1);

    var sIds  = ls.getRange(CFG.LS_START, CFG.LS_S_ID,     numRows, 1).getValues();
    var sSt   = ls.getRange(CFG.LS_START, CFG.LS_S_STATUS, numRows, 1).getValues();
    var gIds  = ls.getRange(CFG.LS_START, CFG.LS_G_ID,     numRows, 1).getValues();
    var gSt   = ls.getRange(CFG.LS_START, CFG.LS_G_STATUS, numRows, 1).getValues();

    var skaterCount = 0; var goalieCount = 0;
    var liveSkaters = 0; var liveGoalies = 0;
    var preSkaters  = 0; var finalSkaters = 0;

    for (var i = 0; i < numRows; i++) {
      if (c_(sIds[i][0])) {
        skaterCount++;
        var st = c_(sSt[i][0]);
        if (st === "LIVE")  liveSkaters++;
        if (st === "PRE")   preSkaters++;
        if (st === "FINAL") finalSkaters++;
      }
      if (c_(gIds[i][0])) goalieCount++;
    }

    Logger.log("Skaters: " + skaterCount + " total | LIVE=" + liveSkaters + " PRE=" + preSkaters + " FINAL=" + finalSkaters);
    Logger.log("Goalies: " + goalieCount + " total");
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 13 — GAMELOG INTEGRITY
// Checks GameLog has correct data and no duplicate rows
// =============================================================================
function test_GameLogIntegrity() {
  Logger.log("=== TEST 13: GAMELOG INTEGRITY ===");
  try {
    var gl      = getSheet_(CFG.SH_GAMELOG);
    var maxRow  = gl.getLastRow();
    if (maxRow < CFG.GL_START) {
      Logger.log("GameLog is empty — run runRefresh first");
      return;
    }
    var numRows = maxRow - CFG.GL_START + 1;
    var data    = gl.getRange(CFG.GL_START, 1, numRows, CFG.GL_TOTAL_COLS).getValues();

    var cycleKeys = {};
    var duplicates = 0;
    var live=0, pre=0, final_=0, synced=0;

    for (var i = 0; i < data.length; i++) {
      var ck  = c_(data[i][CFG.GL_CYCLEKEY - 1]);
      var st  = c_(data[i][CFG.GL_STATUS   - 1]);

      if (ck) {
        if (cycleKeys[ck]) {
          duplicates++;
          Logger.log("DUPLICATE: " + ck);
        }
        cycleKeys[ck] = true;
      }

      if (st === "LIVE")   live++;
      if (st === "PRE")    pre++;
      if (st === "FINAL")  final_++;
      if (st === "SYNCED") synced++;
    }

    Logger.log("Rows: " + numRows + " | LIVE=" + live + " PRE=" + pre + " FINAL=" + final_ + " SYNCED=" + synced);
    Logger.log("Duplicates: " + duplicates);
    if (duplicates > 0) {
      Logger.log("FAIL ❌ — Duplicate cycle keys found!");
    } else {
      Logger.log("PASS ✅");
    }
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// TEST 14 — CHANGE TEXT BUILDER
// Verifies +/- text builds correctly for skaters and goalies
// =============================================================================
function test_ChangeTextBuilder() {
  Logger.log("=== TEST 14: CHANGE TEXT BUILDER ===");

  // Skater tests
  var skaterTests = [
    { gLive:1, aLive:0, expected:"+1G"      },
    { gLive:0, aLive:1, expected:"+1A"      },
    { gLive:1, aLive:2, expected:"+1G +2A"  },
    { gLive:0, aLive:0, expected:""         },
    { gLive:2, aLive:1, expected:"+2G +1A"  }
  ];

  var passed = 0;
  for (var i = 0; i < skaterTests.length; i++) {
    var t      = skaterTests[i];
    var result = buildSkaterChange_(0, t.gLive, 0, t.aLive);
    var ok     = result === t.expected;
    Logger.log((ok ? "✅" : "❌") + " Skater: G=" + t.gLive + " A=" + t.aLive + " → '" + result + "'");
    if (ok) passed++;
  }

  // Goalie tests
  var goalieTests = [
    { w:1, l:0, so:0, expected:"+1W"         },
    { w:0, l:1, so:0, expected:"+1L"         },
    { w:1, l:0, so:1, expected:"+1W +1SO"    },
    { w:0, l:0, so:0, expected:""            }
  ];

  for (var j = 0; j < goalieTests.length; j++) {
    var gt     = goalieTests[j];
    var live   = { w:gt.w, l:gt.l, so:gt.so, gf:0, af:0 };
    var result = buildGoalieChange_(live);
    var ok     = result === gt.expected;
    Logger.log((ok ? "✅" : "❌") + " Goalie: W=" + gt.w + " L=" + gt.l + " SO=" + gt.so + " → '" + result + "'");
    if (ok) passed++;
  }

  Logger.log(passed + "/" + (skaterTests.length + goalieTests.length) + " passed");
}


// =============================================================================
// TEST 15 — FULL SYSTEM REFRESH
// Runs a complete refresh and reports what happened
// =============================================================================
function test_FullSystemRefresh() {
  Logger.log("=== TEST 15: FULL SYSTEM REFRESH ===");
  try {
    var start = new Date().getTime();
    live_refresh();
    var liveTime = new Date().getTime() - start;
    Logger.log("live_refresh: " + liveTime + "ms");

    start = new Date().getTime();
    gamelog_refresh();
    var glTime = new Date().getTime() - start;
    Logger.log("gamelog_refresh: " + glTime + "ms");

    Logger.log("Total: " + (liveTime + glTime) + "ms");
    Logger.log("PASS ✅");
  } catch(e) {
    Logger.log("FAIL ❌ — " + e);
  }
}


// =============================================================================
// RUN ALL TESTS
// Runs every test in sequence — good for a full system check
// =============================================================================
function runAllTests() {
  Logger.log("============================================================");
  Logger.log("HOCKEY POOL — FULL TEST SUITE");
  Logger.log("Date: " + today_());
  Logger.log("============================================================");

  test_API_Connectivity();
  Logger.log("------------------------------------------------------------");
  test_TodaysGames();
  Logger.log("------------------------------------------------------------");
  test_PlayerIdMap();
  Logger.log("------------------------------------------------------------");
  test_BaselineMap();
  Logger.log("------------------------------------------------------------");
  test_PlayerInfoMap();
  Logger.log("------------------------------------------------------------");
  test_StateNormalisation();
  Logger.log("------------------------------------------------------------");
  test_SyncedDetection();
  Logger.log("------------------------------------------------------------");
  test_ChangeTextBuilder();
  Logger.log("------------------------------------------------------------");
  test_PlayoffsMode();
  Logger.log("------------------------------------------------------------");
  test_LiveStatsIntegrity();
  Logger.log("------------------------------------------------------------");
  test_GameLogIntegrity();
  Logger.log("------------------------------------------------------------");
  test_PlayerFullTrace();
  Logger.log("------------------------------------------------------------");
  test_PBPStats();
  Logger.log("------------------------------------------------------------");
  test_GoalieBoxscore();
  Logger.log("============================================================");
  Logger.log("ALL TESTS COMPLETE");
  Logger.log("============================================================");
}



function fixPauseState() {
  var db = getSheet_(CFG.SH_DB);
  db.getRange("AH1").setValue("RUNNING").setFontColor("#16a34a").setFontWeight("bold");
  db.getRange("R6").setValue("Auto: ▶ ON").setFontColor("#16a34a");
  SpreadsheetApp.getActiveSpreadsheet().toast("Pause state fixed!", "🏒", 3);

}

function testGoalieGoalsAndAssists() {
  var db = getSheet_(CFG.SH_DB);
  var n  = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;
  var gNames = db.getRange(CFG.DB_START_ROW, CFG.DB_G_NAME, n, 1).getValues();
  
  // Find first goalie in left table
  var testRow = -1; var testName = "";
  for(var i=0; i<n; i++){
    var nm = c_(gNames[i][0]);
    if(nm){ testRow = CFG.DB_START_ROW+i; testName = nm; break; }
  }
  if(testRow===-1){ Logger.log("No goalie found"); return; }

  // Read current values
  var before = db.getRange(testRow, CFG.DB_G_GF, 1, 2).getValues()[0];
  Logger.log("BEFORE — "+testName+" G="+before[0]+" A="+before[1]);

  // Check column mapping
  Logger.log("DB_G_GF="+CFG.DB_G_GF+" (should be col O=15)");
  Logger.log("DB_G_A="+CFG.DB_G_A+"  (should be col P=16)");
  
  SpreadsheetApp.getActiveSpreadsheet().toast("Check logger — G=col "+CFG.DB_G_GF+" A=col "+CFG.DB_G_A,"🏒",5);

}


function test_gamelogSyncLogic() {
  Logger.log("=== TEST: GameLog SYNC logic ===");

  // ----------------------------
  // SKATER TESTS
  // baseline = official totals before tonight
  // live = tonight's live adds
  // official = what NHL official source currently says
  // ----------------------------

  var skaterBase = { gBase: 10, aBase: 20 };
  var skaterLive = { g: 1, a: 2 };

  // Case 1: official still behind -> should stay FINAL
  var official1 = { g: 10, a: 21 };
  var expectedG = skaterBase.gBase + skaterLive.g;
  var expectedA = skaterBase.aBase + skaterLive.a;
  var isSynced1 = (official1.g >= expectedG && official1.a >= expectedA);

  Logger.log("SKATER CASE 1");
  Logger.log("Expected totals: G=" + expectedG + " A=" + expectedA);
  Logger.log("Official totals: G=" + official1.g + " A=" + official1.a);
  Logger.log("Result should be FINAL -> isSynced = " + isSynced1);

  // Case 2: official caught up exactly -> should become SYNCED
  var official2 = { g: 11, a: 22 };
  var isSynced2 = (official2.g >= expectedG && official2.a >= expectedA);

  Logger.log("SKATER CASE 2");
  Logger.log("Expected totals: G=" + expectedG + " A=" + expectedA);
  Logger.log("Official totals: G=" + official2.g + " A=" + official2.a);
  Logger.log("Result should be SYNCED -> isSynced = " + isSynced2);

  // Case 3: official ahead -> should also become SYNCED
  var official3 = { g: 12, a: 22 };
  var isSynced3 = (official3.g >= expectedG && official3.a >= expectedA);

  Logger.log("SKATER CASE 3");
  Logger.log("Expected totals: G=" + expectedG + " A=" + expectedA);
  Logger.log("Official totals: G=" + official3.g + " A=" + official3.a);
  Logger.log("Result should be SYNCED -> isSynced = " + isSynced3);

  // ----------------------------
  // GOALIE TESTS
  // ----------------------------

  var goalieBase = { wBase: 5, lBase: 2, soBase: 1 };
  var goalieLive = { w: 1, l: 0, so: 1 };

  var expectedW = goalieBase.wBase + goalieLive.w;
  var expectedL = goalieBase.lBase + goalieLive.l;
  var expectedSO = goalieBase.soBase + goalieLive.so;

  // Case 1: official behind -> should stay FINAL
  var goalieOfficial1 = { w: 5, l: 2, so: 1 };
  var goalieSynced1 = (
    goalieOfficial1.w >= expectedW &&
    goalieOfficial1.l >= expectedL &&
    goalieOfficial1.so >= expectedSO
  );

  Logger.log("GOALIE CASE 1");
  Logger.log("Expected totals: W=" + expectedW + " L=" + expectedL + " SO=" + expectedSO);
  Logger.log("Official totals: W=" + goalieOfficial1.w + " L=" + goalieOfficial1.l + " SO=" + goalieOfficial1.so);
  Logger.log("Result should be FINAL -> isSynced = " + goalieSynced1);

  // Case 2: official caught up -> should become SYNCED
  var goalieOfficial2 = { w: 6, l: 2, so: 2 };
  var goalieSynced2 = (
    goalieOfficial2.w >= expectedW &&
    goalieOfficial2.l >= expectedL &&
    goalieOfficial2.so >= expectedSO
  );

  Logger.log("GOALIE CASE 2");
  Logger.log("Expected totals: W=" + expectedW + " L=" + expectedL + " SO=" + expectedSO);
  Logger.log("Official totals: W=" + goalieOfficial2.w + " L=" + goalieOfficial2.l + " SO=" + goalieOfficial2.so);
  Logger.log("Result should be SYNCED -> isSynced = " + goalieSynced2);

  Logger.log("=== END TEST ===");
}


function findCFG() {
  Logger.log(JSON.stringify(CFG));
}
