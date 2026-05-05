

/**************************************************
 * CORE LOGGING
 **************************************************/


 var TEST_CFG = {
  DEBUG_SHEET_NAME: "DebugLog",
  TIMEZONE: "America/Toronto",
  RUN_REAL_PROBES: true
};

function testNow_() {
  return Utilities.formatDate(new Date(), TEST_CFG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function getOrCreateDebugLog_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TEST_CFG.DEBUG_SHEET_NAME);
  if (!sh) sh = ss.insertSheet(TEST_CFG.DEBUG_SHEET_NAME);
  return sh;
}

function setupDebugLogSheet_() {
  var sh = getOrCreateDebugLog_();
  sh.clearContents();
  sh.clearFormats();

  var headers = [[
    "Timestamp",
    "Group",
    "Test Name",
    "Status",
    "Expected",
    "Actual",
    "Details",
    "Player ID",
    "Player Name",
    "State",
    "Base G",
    "Base A",
    "Base W",
    "Base L",
    "Base SO",
    "Live G",
    "Live A",
    "Live W",
    "Live L",
    "Live SO",
    "DB G",
    "DB A",
    "DB W",
    "DB L",
    "DB SO"
  ]];

  sh.getRange(1,1,1,headers[0].length).setValues(headers);
  sh.getRange(1,1,1,headers[0].length)
    .setFontWeight("bold")
    .setBackground("#0f172a")
    .setFontColor("#e2e8f0");

  sh.setFrozenRows(1);

  for (var c = 1; c <= headers[0].length; c++) {
    sh.setColumnWidth(c, 120);
  }
  sh.setColumnWidth(5, 220);
  sh.setColumnWidth(6, 220);
  sh.setColumnWidth(7, 400);
}

function logTestRow_(obj) {
  var sh = getOrCreateDebugLog_();
  sh.appendRow([
    testNow_(),
    obj.group || "",
    obj.test || "",
    obj.status || "",
    obj.expected || "",
    obj.actual || "",
    obj.details || "",
    obj.id || "",
    obj.name || "",
    obj.state || "",
    obj.gBase != null ? obj.gBase : "",
    obj.aBase != null ? obj.aBase : "",
    obj.wBase != null ? obj.wBase : "",
    obj.lBase != null ? obj.lBase : "",
    obj.soBase != null ? obj.soBase : "",
    obj.gLive != null ? obj.gLive : "",
    obj.aLive != null ? obj.aLive : "",
    obj.wLive != null ? obj.wLive : "",
    obj.lLive != null ? obj.lLive : "",
    obj.soLive != null ? obj.soLive : "",
    obj.dbG != null ? obj.dbG : "",
    obj.dbA != null ? obj.dbA : "",
    obj.dbW != null ? obj.dbW : "",
    obj.dbL != null ? obj.dbL : "",
    obj.dbSO != null ? obj.dbSO : ""
  ]);
}

function assertEqual_(group, test, expected, actual, details, extra) {
  var ok = String(expected) === String(actual);
  logTestRow_(mergeObjects_({
    group: group,
    test: test,
    status: ok ? "PASS" : "FAIL",
    expected: expected,
    actual: actual,
    details: details || ""
  }, extra || {}));
  return ok;
}

function assertTrue_(group, test, condition, details, extra) {
  var ok = !!condition;
  logTestRow_(mergeObjects_({
    group: group,
    test: test,
    status: ok ? "PASS" : "FAIL",
    expected: "true",
    actual: String(!!condition),
    details: details || ""
  }, extra || {}));
  return ok;
}

function logInfo_(group, test, details, extra) {
  logTestRow_(mergeObjects_({
    group: group,
    test: test,
    status: "INFO",
    expected: "",
    actual: "",
    details: details || ""
  }, extra || {}));
}

function mergeObjects_(a, b) {
  var out = {};
  var k;
  for (k in a) if (a.hasOwnProperty(k)) out[k] = a[k];
  for (k in b) if (b.hasOwnProperty(k)) out[k] = b[k];
  return out;
}

/**************************************************
 * FAKE ENGINE
 **************************************************/

function makeFakeEngine_() {
  return {
    dayKey: "2026-04-16",
    cache: null,
    cacheCreatedAt: null,
    deleteAllPropertiesCalled: false,
    overlayRuns: 0,
    baselineCreateRuns: 0,
    nightlyResetRuns: 0,
    onEditDeleteAllPropertiesRuns: 0
  };
}

function fakeOfficialStats_(player, mode) {
  mode = mode || "pregame";

  if (player.pos === "G") {
    if (mode === "pregame") {
      return { w: player.wOfficial, l: player.lOfficial, so: player.soOfficial, g: player.gOfficial, a: player.aOfficial };
    }
    if (mode === "live1") {
      return { w: player.wOfficial, l: player.lOfficial, so: player.soOfficial, g: player.gOfficial, a: player.aOfficial };
    }
    if (mode === "final_sync") {
      return {
        w: player.wOfficial + (player.wLive || 0),
        l: player.lOfficial + (player.lLive || 0),
        so: player.soOfficial + (player.soLive || 0),
        g: player.gOfficial + (player.gLive || 0),
        a: player.aOfficial + (player.aLive || 0)
      };
    }
  }

  if (mode === "pregame") {
    return { g: player.gOfficial, a: player.aOfficial };
  }
  if (mode === "live1") {
    return { g: player.gOfficial, a: player.aOfficial };
  }
  if (mode === "final_sync") {
    return { g: player.gOfficial + (player.gLive || 0), a: player.aOfficial + (player.aLive || 0) };
  }

  return { g: player.gOfficial, a: player.aOfficial };
}

function fakeCreateBaselineAtPre_(engine, players, gameStateByPlayerId, officialMode) {
  var anyPre = false;
  var i, p, st;

  if (engine.cache) {
    return engine.cache;
  }

  for (i = 0; i < players.length; i++) {
    p = players[i];
    st = gameStateByPlayerId[p.id] || "OFF";
    if (st === "PRE") {
      anyPre = true;
      break;
    }
  }

  if (!anyPre) return null;

  var map = {};
  for (i = 0; i < players.length; i++) {
    p = players[i];
    st = gameStateByPlayerId[p.id] || "OFF";
    if (st !== "PRE" && st !== "LIVE" && st !== "FINAL") continue;

    var s = fakeOfficialStats_(p, officialMode || "pregame");
    if (p.pos === "G") {
      map[p.id] = {
        wBase: Number(s.w || 0),
        lBase: Number(s.l || 0),
        soBase: Number(s.so || 0),
        gfBase: Number(s.g || 0),
        afBase: Number(s.a || 0)
      };
    } else {
      map[p.id] = {
        gBase: Number(s.g || 0),
        aBase: Number(s.a || 0)
      };
    }
  }

  engine.cache = map;
  engine.cacheCreatedAt = testNow_();
  engine.baselineCreateRuns++;
  return map;
}

function fakeApplyOverlay_(engine, players, baselineMap, gameStateByPlayerId) {
  engine.overlayRuns++;

  var out = {};
  for (var i = 0; i < players.length; i++) {
    var p = players[i];
    var st = gameStateByPlayerId[p.id] || "OFF";
    var base = baselineMap ? baselineMap[p.id] : null;

    if (p.pos === "G") {
      if (!base) {
        out[p.id] = { skipped: true, pos: "G", state: st };
        continue;
      }
      if (st !== "LIVE") {
        out[p.id] = {
          skipped: true,
          pos: "G",
          state: st,
          wBase: base.wBase, lBase: base.lBase, soBase: base.soBase,
          gBase: base.gfBase, aBase: base.afBase
        };
        continue;
      }
      out[p.id] = {
        skipped: false,
        pos: "G",
        state: st,
        wBase: base.wBase,
        lBase: base.lBase,
        soBase: base.soBase,
        gBase: base.gfBase,
        aBase: base.afBase,
        wLive: Number(p.wLive || 0),
        lLive: Number(p.lLive || 0),
        soLive: Number(p.soLive || 0),
        gLive: Number(p.gLive || 0),
        aLive: Number(p.aLive || 0),
        dbW: Number(base.wBase || 0) + Number(p.wLive || 0),
        dbL: Number(base.lBase || 0) + Number(p.lLive || 0),
        dbSO: Number(base.soBase || 0) + Number(p.soLive || 0),
        dbG: Number(base.gfBase || 0) + Number(p.gLive || 0),
        dbA: Number(base.afBase || 0) + Number(p.aLive || 0)
      };
      continue;
    }

    if (!base) {
      out[p.id] = { skipped: true, pos: p.pos, state: st };
      continue;
    }
    if (st !== "LIVE") {
      out[p.id] = {
        skipped: true,
        pos: p.pos,
        state: st,
        gBase: base.gBase,
        aBase: base.aBase
      };
      continue;
    }

    out[p.id] = {
      skipped: false,
      pos: p.pos,
      state: st,
      gBase: base.gBase,
      aBase: base.aBase,
      gLive: Number(p.gLive || 0),
      aLive: Number(p.aLive || 0),
      dbG: Number(base.gBase || 0) + Number(p.gLive || 0),
      dbA: Number(base.aBase || 0) + Number(p.aLive || 0)
    };
  }

  return out;
}

function fakeNightlyReset_(engine) {
  engine.cache = null;
  engine.cacheCreatedAt = null;
  engine.nightlyResetRuns++;
}

function fakeDeleteAllPropertiesMidDay_(engine) {
  engine.cache = null;
  engine.cacheCreatedAt = null;
  engine.deleteAllPropertiesCalled = true;
  engine.onEditDeleteAllPropertiesRuns++;
}

/**************************************************
 * FAKE TEST DATA
 **************************************************/

function buildFakePlayers_() {
  return [
    {
      id: "P1001",
      name: "Stone, M",
      pos: "F",
      gOfficial: 28,
      aOfficial: 45,
      gLive: 1,
      aLive: 1
    },
    {
      id: "P1002",
      name: "Eichel, J",
      pos: "F",
      gOfficial: 27,
      aOfficial: 61,
      gLive: 0,
      aLive: 2
    },
    {
      id: "P2001",
      name: "Theodore, S",
      pos: "D",
      gOfficial: 9,
      aOfficial: 29,
      gLive: 1,
      aLive: 0
    },
    {
      id: "P3001",
      name: "Hart, C",
      pos: "G",
      wOfficial: 10,
      lOfficial: 3,
      soOfficial: 0,
      gOfficial: 0,
      aOfficial: 0,
      wLive: 0,
      lLive: 0,
      soLive: 0,
      gLive: 0,
      aLive: 1
    },
    {
      id: "P4001",
      name: "Rookie, Z",
      pos: "F",
      gOfficial: 0,
      aOfficial: 0,
      gLive: 0,
      aLive: 0
    }
  ];
}

/**************************************************
 * TEST GROUPS - FAKE DATA
 **************************************************/

function runFakeBaselineTests_() {
  var group = "FAKE_BASELINE";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesOff = {
    P1001: "OFF", P1002: "OFF", P2001: "OFF", P3001: "OFF", P4001: "OFF"
  };

  var baseNone = fakeCreateBaselineAtPre_(engine, players, statesOff, "pregame");
  assertEqual_(group, "No baseline before PRE", "null", String(baseNone), "No PRE should mean no baseline");
  assertEqual_(group, "Baseline create count before PRE", "0", String(engine.baselineCreateRuns), "Should not create baseline before PRE");

  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };

  var basePre = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");
  assertTrue_(group, "Baseline created at PRE", !!basePre, "PRE should create baseline");
  assertEqual_(group, "Stone base G at PRE", "28", String(basePre["P1001"].gBase), "Stone baseline goals should lock from official", {id:"P1001", name:"Stone, M", state:"PRE", gBase:basePre["P1001"].gBase, aBase:basePre["P1001"].aBase});
  assertEqual_(group, "Stone base A at PRE", "45", String(basePre["P1001"].aBase), "Stone baseline assists should lock from official", {id:"P1001", name:"Stone, M", state:"PRE", gBase:basePre["P1001"].gBase, aBase:basePre["P1001"].aBase});
  assertEqual_(group, "Hart base W at PRE", "10", String(basePre["P3001"].wBase), "Goalie W baseline should lock", {id:"P3001", name:"Hart, C", state:"PRE", wBase:basePre["P3001"].wBase, lBase:basePre["P3001"].lBase, soBase:basePre["P3001"].soBase});
  assertEqual_(group, "Hart base L at PRE", "3", String(basePre["P3001"].lBase), "Goalie L baseline should lock", {id:"P3001", name:"Hart, C", state:"PRE", wBase:basePre["P3001"].wBase, lBase:basePre["P3001"].lBase, soBase:basePre["P3001"].soBase});
  assertEqual_(group, "Baseline create count at PRE", "1", String(engine.baselineCreateRuns), "Baseline should create once");

  var statesLive = {
    P1001: "LIVE", P1002: "LIVE", P2001: "LIVE", P3001: "LIVE", P4001: "OFF"
  };

  var baseLiveSecondCall = fakeCreateBaselineAtPre_(engine, players, statesLive, "live1");
  assertEqual_(group, "Baseline reuse during LIVE", "1", String(engine.baselineCreateRuns), "LIVE should reuse cache, not rebuild");
  assertEqual_(group, "Stone baseline unchanged during LIVE", "45", String(baseLiveSecondCall["P1001"].aBase), "Baseline must remain frozen once created", {id:"P1001", name:"Stone, M", state:"LIVE", gBase:baseLiveSecondCall["P1001"].gBase, aBase:baseLiveSecondCall["P1001"].aBase});
}

function runFakeOverlayTests_() {
  var group = "FAKE_OVERLAY";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };

  var baseline = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");

  var statesLive = {
    P1001: "LIVE", P1002: "LIVE", P2001: "LIVE", P3001: "LIVE", P4001: "OFF"
  };

  var overlay = fakeApplyOverlay_(engine, players, baseline, statesLive);

  assertEqual_(group, "Stone DB G = base + live", "29", String(overlay["P1001"].dbG), "Stone should become 28 + 1", overlay["P1001"]);
  assertEqual_(group, "Stone DB A = base + live", "46", String(overlay["P1001"].dbA), "Stone should become 45 + 1", overlay["P1001"]);

  assertEqual_(group, "Eichel DB G unchanged if no live goals", "27", String(overlay["P1002"].dbG), "No live goals means same G", overlay["P1002"]);
  assertEqual_(group, "Eichel DB A = base + 2 live", "63", String(overlay["P1002"].dbA), "61 + 2 live assists", overlay["P1002"]);

  assertEqual_(group, "Theodore DB G = 9 + 1", "10", String(overlay["P2001"].dbG), "Defense overlay goals", overlay["P2001"]);
  assertEqual_(group, "Theodore DB A = 29 + 0", "29", String(overlay["P2001"].dbA), "Defense overlay assists", overlay["P2001"]);

  assertEqual_(group, "Hart goalie assist overlay DB A = 1", "1", String(overlay["P3001"].dbA), "Goalie assist should overlay into goalie assist path", overlay["P3001"]);
  assertEqual_(group, "Hart base W unchanged", "10", String(overlay["P3001"].wBase), "Goalie base W must not drift", overlay["P3001"]);
  assertEqual_(group, "Hart base L unchanged", "3", String(overlay["P3001"].lBase), "Goalie base L must not drift", overlay["P3001"]);

  assertTrue_(group, "Rookie OFF is skipped", overlay["P4001"].skipped === true, "OFF player with no baseline should skip overlay", overlay["P4001"]);
}

function runFakeDoubleCountTests_() {
  var group = "FAKE_DOUBLE_COUNT";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };
  var baseline = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");

  var statesLive = {
    P1001: "LIVE", P1002: "LIVE", P2001: "LIVE", P3001: "LIVE", P4001: "OFF"
  };
  var overlay1 = fakeApplyOverlay_(engine, players, baseline, statesLive);
  var overlay2 = fakeApplyOverlay_(engine, players, baseline, statesLive);

  assertEqual_(group, "Repeated overlay does not mutate baseline G", "28", String(baseline["P1001"].gBase), "Stone base G must remain frozen", {id:"P1001", name:"Stone, M", gBase:baseline["P1001"].gBase, aBase:baseline["P1001"].aBase});
  assertEqual_(group, "Repeated overlay does not mutate baseline A", "45", String(baseline["P1001"].aBase), "Stone base A must remain frozen", {id:"P1001", name:"Stone, M", gBase:baseline["P1001"].gBase, aBase:baseline["P1001"].aBase});
  assertEqual_(group, "Overlay pass 1 Stone DB A", "46", String(overlay1["P1001"].dbA), "First overlay should be exact");
  assertEqual_(group, "Overlay pass 2 Stone DB A", "46", String(overlay2["P1001"].dbA), "Second overlay recompute should still be exact");
}

function runFakeCacheTests_() {
  var group = "FAKE_CACHE";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };
  var baseline = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");
  assertTrue_(group, "Cache exists after PRE", !!engine.cache, "PRE should populate cache");

  fakeDeleteAllPropertiesMidDay_(engine);
  assertEqual_(group, "Cache removed by mid-day wipe", "null", String(engine.cache), "This simulates the dangerous onEdit/property wipe bug");
  assertEqual_(group, "Mid-day deleteAllProperties count", "1", String(engine.onEditDeleteAllPropertiesRuns), "Simulated cache wipe count");

  var statesLive = {
    P1001: "LIVE", P1002: "LIVE", P2001: "LIVE", P3001: "LIVE", P4001: "OFF"
  };
  var overlayAfterWipe = fakeApplyOverlay_(engine, players, engine.cache, statesLive);
  assertTrue_(group, "Overlay skipped Stone after missing cache", overlayAfterWipe["P1001"].skipped === true, "With no baseline cache, overlay should skip rather than invent math");
  assertTrue_(group, "Overlay skipped Hart after missing cache", overlayAfterWipe["P3001"].skipped === true, "Goalie should also skip if cache is gone");

  fakeNightlyReset_(engine);
  assertEqual_(group, "Nightly reset count increments", "1", String(engine.nightlyResetRuns), "Nightly reset should be the only safe cache clear");
}

function runFakeLifecycleTests_() {
  var group = "FAKE_LIFECYCLE";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesOff = {
    P1001: "OFF", P1002: "OFF", P2001: "OFF", P3001: "OFF", P4001: "OFF"
  };
  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };
  var statesLive = {
    P1001: "LIVE", P1002: "LIVE", P2001: "LIVE", P3001: "LIVE", P4001: "OFF"
  };
  var statesFinal = {
    P1001: "FINAL", P1002: "FINAL", P2001: "FINAL", P3001: "FINAL", P4001: "OFF"
  };

  var noBase = fakeCreateBaselineAtPre_(engine, players, statesOff, "pregame");
  assertEqual_(group, "OFF => no baseline", "null", String(noBase), "No PRE yet");

  var base = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");
  assertTrue_(group, "PRE => baseline exists", !!base, "Baseline should appear at PRE");
  assertEqual_(group, "PRE => baseline create once", "1", String(engine.baselineCreateRuns), "Lock once at PRE");

  var live = fakeApplyOverlay_(engine, players, base, statesLive);
  assertEqual_(group, "LIVE => Stone DB G", "29", String(live["P1001"].dbG), "Overlay during LIVE");
  assertEqual_(group, "LIVE => Stone DB A", "46", String(live["P1001"].dbA), "Overlay during LIVE");

  var finalOverlay = fakeApplyOverlay_(engine, players, base, statesFinal);
  assertTrue_(group, "FINAL => overlay skipped for Stone", finalOverlay["P1001"].skipped === true, "No LIVE overlay on FINAL state");

  fakeNightlyReset_(engine);
  assertEqual_(group, "After nightly reset cache cleared", "null", String(engine.cache), "Next day should start fresh");

  var nextDayBase = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");
  assertEqual_(group, "Next day baseline create count total", "2", String(engine.baselineCreateRuns), "Should recreate next day only");
  assertTrue_(group, "Next day baseline exists", !!nextDayBase, "Baseline rebuilt cleanly after nightly reset");
}

function runFakeEdgeCaseTests_() {
  var group = "FAKE_EDGE_CASES";
  var engine = makeFakeEngine_();

  var players = [
    { id: "E1", name: "Zero, Guy", pos: "F", gOfficial: 0, aOfficial: 0, gLive: 0, aLive: 0 },
    { id: "E2", name: "Assist, Only", pos: "F", gOfficial: 12, aOfficial: 29, gLive: 0, aLive: 1 },
    { id: "E3", name: "Goal, Only", pos: "D", gOfficial: 5, aOfficial: 6, gLive: 1, aLive: 0 },
    { id: "E4", name: "Goalie, Weird", pos: "G", wOfficial: 10, lOfficial: 3, soOfficial: 1, gOfficial: 0, aOfficial: 0, wLive: 0, lLive: 0, soLive: 0, gLive: 1, aLive: 0 }
  ];

  var statesPre = { E1:"PRE", E2:"PRE", E3:"PRE", E4:"PRE" };
  var base = fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");

  assertEqual_(group, "Zero-stat player base G", "0", String(base["E1"].gBase), "Zero baseline is valid for true zero-stat players", {id:"E1", name:"Zero, Guy", gBase:base["E1"].gBase, aBase:base["E1"].aBase});
  assertEqual_(group, "Zero-stat player base A", "0", String(base["E1"].aBase), "Zero baseline is valid for true zero-stat players", {id:"E1", name:"Zero, Guy", gBase:base["E1"].gBase, aBase:base["E1"].aBase});

  var statesLive = { E1:"LIVE", E2:"LIVE", E3:"LIVE", E4:"LIVE" };
  var overlay = fakeApplyOverlay_(engine, players, base, statesLive);

  assertEqual_(group, "Assist-only player DB A", "30", String(overlay["E2"].dbA), "12/29 + 1A => 12/30", overlay["E2"]);
  assertEqual_(group, "Goal-only defense DB G", "6", String(overlay["E3"].dbG), "5G + 1G live", overlay["E3"]);
  assertEqual_(group, "Goalie weird live goal overlay DB G", "1", String(overlay["E4"].dbG), "Goalie goal should use goalie G path", overlay["E4"]);
}

function runFakeOnEditExpectationTests_() {
  var group = "FAKE_ONEDIT_EXPECTATIONS";
  var engine = makeFakeEngine_();
  var players = buildFakePlayers_();

  var statesPre = {
    P1001: "PRE", P1002: "PRE", P2001: "PRE", P3001: "PRE", P4001: "OFF"
  };
  fakeCreateBaselineAtPre_(engine, players, statesPre, "pregame");

  assertTrue_(group, "OnEdit should NOT clear cache mid-day", engine.cache != null, "Baseline cache should still exist before simulated onEdit");

  fakeDeleteAllPropertiesMidDay_(engine);

  assertEqual_(group, "OnEdit mid-day cache wipe is BAD", "null", String(engine.cache), "If onEdit clears properties, baseline is destroyed");
  assertEqual_(group, "OnEdit cache wipe count", "1", String(engine.onEditDeleteAllPropertiesRuns), "This is the exact thing you do NOT want in production");
}

/**************************************************
 * OPTIONAL SAFE REAL PROBES
 **************************************************/

function runRealProbeTests_() {
  var group = "REAL_PROBES";

  if (!TEST_CFG.RUN_REAL_PROBES) {
    logInfo_(group, "Real probes skipped", "TEST_CFG.RUN_REAL_PROBES = false");
    return;
  }

  var global = this;

  var fnNames = [
    "db_refresh",
    "live_refresh",
    "gamelog_refresh",
    "runSmartHourlyRefresh",
    "runNightlyReset",
    "getFrozenBaseline_",
    "applyLiveOverlay_",
    "onEdit"
  ];

  for (var i = 0; i < fnNames.length; i++) {
    var name = fnNames[i];
    var exists = typeof global[name] === "function";
    assertTrue_(group, "Function exists: " + name, exists, "Existence check only");
  }

  safeTimedRun_(group, "Timing probe: db_refresh", "db_refresh");
  safeTimedRun_(group, "Timing probe: live_refresh", "live_refresh");
  safeTimedRun_(group, "Timing probe: gamelog_refresh", "gamelog_refresh");

  safeFrozenBaselineProbe_(group);
}

function safeTimedRun_(group, testName, fnName) {
  var global = this;
  if (typeof global[fnName] !== "function") {
    logInfo_(group, testName, "Skipped because function does not exist: " + fnName);
    return;
  }

  try {
    var t0 = new Date().getTime();
    global[fnName]();
    var ms = new Date().getTime() - t0;
    logTestRow_({
      group: group,
      test: testName,
      status: "INFO",
      expected: "< 360000 ms",
      actual: ms + " ms",
      details: "Safe direct timing probe"
    });
    assertTrue_(group, testName + " under 6 min", ms < 360000, "Apps Script timeout sanity check");
  } catch (e) {
    logTestRow_({
      group: group,
      test: testName,
      status: "FAIL",
      expected: "No error",
      actual: "Error",
      details: String(e)
    });
  }
}

function safeFrozenBaselineProbe_(group) {
  var global = this;
  if (typeof global["getFrozenBaseline_"] !== "function") {
    logInfo_(group, "Frozen baseline probe", "Skipped because getFrozenBaseline_ does not exist");
    return;
  }

  try {
    var result = global["getFrozenBaseline_"]();
    var type = result === null ? "null" : (Array.isArray(result) ? "array" : typeof result);
    logTestRow_({
      group: group,
      test: "Frozen baseline probe",
      status: "INFO",
      expected: "object or null",
      actual: type,
      details: "Current project function return type probe"
    });
  } catch (e) {
    logTestRow_({
      group: group,
      test: "Frozen baseline probe",
      status: "FAIL",
      expected: "No error",
      actual: "Error",
      details: String(e)
    });
  }
}

/**************************************************
 * TEST SUMMARY
 **************************************************/

function writeSummaryRow_() {
  var sh = getOrCreateDebugLog_();
  var last = sh.getLastRow();
  if (last < 2) return;

  var data = sh.getRange(2,4,last-1,1).getValues(); // Status column
  var pass = 0, fail = 0, info = 0;

  for (var i = 0; i < data.length; i++) {
    var s = String(data[i][0] || "");
    if (s === "PASS") pass++;
    else if (s === "FAIL") fail++;
    else if (s === "INFO") info++;
  }

  sh.appendRow([
    testNow_(),
    "SUMMARY",
    "runAllTests",
    fail === 0 ? "PASS" : "FAIL",
    "0 fails",
    fail + " fails",
    "PASS=" + pass + " | FAIL=" + fail + " | INFO=" + info
  ]);
}

/**************************************************
 * MAIN ENTRY POINT
 **************************************************/

function runAllTests() {
  setupDebugLogSheet_();

  logInfo_("SYSTEM", "runAllTests", "Starting full fake-data harness + optional safe real probes");

  runFakeBaselineTests_();
  runFakeOverlayTests_();
  runFakeDoubleCountTests_();
  runFakeCacheTests_();
  runFakeLifecycleTests_();
  runFakeEdgeCaseTests_();
  runFakeOnEditExpectationTests_();

  runRealProbeTests_();

  writeSummaryRow_();

  SpreadsheetApp.getActiveSpreadsheet().toast("All tests complete - check DebugLog", "🏒", 5);
}



/***********************************************************************************
 * TEST — STATE TRANSITION LOGGER
 ***********************************************************************************/
function logStateTransition_(id, name, state, gameId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName("StateLog");
    if (!sh) return;

    var props = PropertiesService.getScriptProperties();
    var key = "STATELOG_" + c_(id) + "_" + c_(gameId);
    var prev = c_(props.getProperty(key));

    // Only log real changes
    if (prev === c_(state)) return;

    var time = Utilities.formatDate(new Date(), CFG.TZ, "HH:mm:ss");
    var flag = "";

    if (prev === "PRE" && state === "OFF")  flag = "⚠️ GAP START";
    if (prev === "OFF" && state === "LIVE") flag = "⚠️ GAP CONFIRMED";

    sh.appendRow([
      time,
      c_(name),
      c_(id),
      c_(gameId),
      prev,
      c_(state),
      flag
    ]);

    props.setProperty(key, c_(state));

  } catch (e) {
    Logger.log("logStateTransition_ error: " + e);
  }
}


function test_PRE_to_LIVE_flow() {
  var fakeGame = {
    id: "TEST123",
    gameState: "PRE",
    startTimeUTC: new Date(Date.now() + 5*60000).toISOString() // starts in 5 min
  };

  var fakeGames = [fakeGame];
  var tgMap = { "TEST": fakeGame }; // fake team → game
  var gameCache = {
    "TEST123": { state: "PRE", pbpMap:{}, goalieMap:{} }
  };

  var infoMap = { "1": { team: "TEST" } };

  // 1) PRE phase
  var d1 = playerData_("1", infoMap, tgMap, gameCache);
  Logger.log("PRE phase → " + d1.state);

  // 2) simulate mapping delay (no game)
  var d2 = playerData_("1", infoMap, {}, gameCache);
  Logger.log("NO GAME → " + d2.state);

  // 3) LIVE phase
  gameCache["TEST123"].state = "LIVE";
  var d3 = playerData_("1", infoMap, tgMap, gameCache);
  Logger.log("LIVE phase → " + d3.state);
}



function testPreWindowNow() {
  var games = fetchGamesForDate_();
  Logger.log("NOW = " + new Date());

  for (var i = 0; i < games.length; i++) {
    var g = games[i];
    var rawState = normaliseState_(g.gameState);
    var startUtc = c_(g.startTimeUTC || g.gameDate || "");
    var gameTime = startUtc ? new Date(startUtc).getTime() : null;
    var nowTime = new Date().getTime();
    var diffMin = gameTime ? ((gameTime - nowTime) / 60000) : null;

    Logger.log(
      "GAME " + c_(g.id) +
      " | rawState=" + rawState +
      " | startUTC=" + startUtc +
      " | diffMin=" + diffMin +
      " | withinPreWindow=" + isWithinPreWindow_(g)
    );
  }
}


function testIndicator() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var liveStats = ss.getSheetByName("LiveStats");
  
  // Get first player's indicator
  var indicator = liveStats.getRange(3, 5).getValue(); // Row 3, Column E
  
  Logger.log("Indicator value: " + indicator);
  Logger.log("Indicator type: " + typeof indicator);
  Logger.log("Indicator length: " + String(indicator).length);
}



function debugIndicators() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ls = ss.getSheetByName("LiveStats");
  
  // Check first player's status column
  var status1 = ls.getRange(3, 5).getValue(); // E3
  var status2 = ls.getRange(4, 5).getValue(); // E4
  
  Logger.log("Row 3 Status (E3): '" + status1 + "'");
  Logger.log("Row 4 Status (E4): '" + status2 + "'");
  
  // Check Ronde 1 lead indicators
  var r1 = ss.getSheetByName("Ronde 1");
  Logger.log("D3: '" + r1.getRange(3, 4).getValue() + "'");
  Logger.log("D4: '" + r1.getRange(4, 4).getValue() + "'");
  Logger.log("Matchup 2 row 68: '" + r1.getRange(68, 4).getValue() + "'");
}



function testLivePipeline() {
  var ls = getSheet_(CFG.SH_LIVE);
  
  // Manually force Bouchard to LIVE
  var numRows = ls.getRange(CFG.LS_START, CFG.LS_S_ID, 100, 1).getValues()
    .filter(function(r){return r[0]!=="";}).length;
  var ids = ls.getRange(CFG.LS_START, CFG.LS_S_ID, numRows, 1).getValues();
  
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] == "8480803") { // Bouchard
      ls.getRange(CFG.LS_START + i, CFG.LS_S_STATUS).setValue("LIVE");
      ls.getRange(CFG.LS_START + i, CFG.LS_S_DOT).setFontColor(CFG.COLOR_LIVE);
      Logger.log("Set Bouchard LIVE at row " + (CFG.LS_START + i));
      break;
    }
  }
  
  // Export to App_Live
  runFullRefresh();
  
  // Check App_Live
  var appLive = getSheet_("App_Live");
  var data = appLive.getDataRange().getValues();
  for (var r = 0; r < data.length; r++) {
    if (data[r][4] === "Bouchard, E") {
      Logger.log("App_Live Bouchard indicator: " + data[r][10]);
      break;
    }
  }
}


// ============================================================
// BUILD PROCEDURE SHEET — run once
// Creates a formatted reference sheet in the spreadsheet
// ============================================================
function buildProcedureSheet() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName("Procédure");
  if (!sh) sh = ss.insertSheet("Procédure");
  sh.clear();
  sh.clearFormats();

  // Column widths
  sh.setColumnWidth(1, 30);   // A — spacer
  sh.setColumnWidth(2, 220);  // B — label
  sh.setColumnWidth(3, 380);  // C — detail
  sh.setColumnWidth(4, 30);   // D — spacer

  // Colors
  var C_BG      = "#0f1923";
  var C_HEADER  = "#1a2535";
  var C_ACCENT  = "#22c55e";
  var C_GOLD    = "#fde047";
  var C_TEXT    = "#e8eaed";
  var C_SUB     = "#8a9bb0";
  var C_ROW1    = "#1a2535";
  var C_ROW2    = "#162030";

  sh.getRange("A1:D100").setBackground(C_BG);

  var r = 1;

  function header(text, color) {
    sh.getRange(r, 1, 1, 4).setBackground(color || C_HEADER);
    sh.getRange(r, 2, 1, 3).merge()
      .setValue(text)
      .setFontColor(C_ACCENT)
      .setFontWeight("bold")
      .setFontSize(12)
      .setVerticalAlignment("middle");
    sh.setRowHeight(r, 32);
    r++;
  }

  function row(label, detail, isAlt) {
    var bg = isAlt ? C_ROW2 : C_ROW1;
    sh.getRange(r, 1, 1, 4).setBackground(bg);
    sh.getRange(r, 2).setValue(label).setFontColor(C_TEXT).setFontSize(10).setFontWeight("bold");
    sh.getRange(r, 3).setValue(detail).setFontColor(C_SUB).setFontSize(10);
    sh.setRowHeight(r, 24);
    r++;
  }

  function spacer() {
    sh.getRange(r, 1, 1, 4).setBackground(C_BG);
    sh.setRowHeight(r, 10);
    r++;
  }

  function sectionTitle(text) {
    sh.getRange(r, 1, 1, 4).setBackground("#0d1f2e");
    sh.getRange(r, 2, 1, 3).merge()
      .setValue(text)
      .setFontColor(C_GOLD)
      .setFontWeight("bold")
      .setFontSize(11);
    sh.setRowHeight(r, 28);
    r++;
  }

  // ── TITLE ──
  sh.getRange(r, 1, 1, 4).setBackground("#0f1923");
  sh.getRange(r, 2, 1, 3).merge()
    .setValue("🏒 POOL SÉRIES 2026 — PROCÉDURE")
    .setFontColor(C_ACCENT).setFontWeight("bold").setFontSize(14)
    .setHorizontalAlignment("center");
  sh.setRowHeight(r, 40);
  r++; spacer();

  // ── FIN RONDE 1 ──
  header("🏆 FIN RONDE 1 — Affichage Résultats");
  row("1. Cocher G2", "Feuille Series → case End Ronde 1", false);
  row("2. Menu Séries", "Mettre à jour séries", true);
  row("→ Résultat", "Site affiche gagnants/perdants en mode final", false);
  spacer();

  // ── TRANSITION R1 → R2 ──
  header("🔄 TRANSITION RONDE 1 → RONDE 2");
  row("1. Menu Séries", "Transition → Ronde 2", false);
  row("2. Picks", "Entrer les picks dans DRAFT R2", true);
  row("3. Cocher N2", "Feuille Series → case End Ronde 1 / Start R2", false);
  row("4. Menu Séries", "Mettre à jour séries → CurrentRound = 2", true);
  row("→ Résultat", "Site charge automatiquement App_Ronde2", false);
  spacer();

  // ── FIN RONDE 2 ──
  header("🏆 FIN RONDE 2 — Affichage Résultats");
  row("1. Cocher N2", "Feuille Series → case End Ronde 2", false);
  row("2. Menu Séries", "Mettre à jour séries", true);
  row("→ Résultat", "Site affiche résultats finaux Ronde 2", false);
  spacer();

  // ── TRANSITION R2 → R3 ──
  header("🔄 TRANSITION RONDE 2 → RONDE 3");
  row("1. Menu Séries", "Transition → Ronde 3", false);
  row("2. Picks", "Entrer les picks dans DRAFT R3", true);
  row("3. Cocher U2", "Feuille Series → case End Ronde 2 / Start R3", false);
  row("4. Menu Séries", "Mettre à jour séries → CurrentRound = 3", true);
  spacer();

  // ── TRANSITION R3 → FINALE ──
  header("🔄 TRANSITION RONDE 3 → FINALE");
  row("1. Menu Séries", "Transition → Finale", false);
  row("2. Picks", "Entrer les picks dans DRAFT F", true);
  row("3. Cocher AB2", "Feuille Series → case End Ronde 3 / Start Finale", false);
  row("4. Menu Séries", "Mettre à jour séries → CurrentRound = 4", true);
  row("⚠️ Note", "La Finale a son propre layout HTML (à venir)", false);
  spacer();

  // ── CE QUE FAIT METTRE À JOUR SÉRIES ──
  sectionTitle("📋 Ce que fait « Mettre à jour séries »");
  row("1.", "Strikethrough équipes éliminées (toutes feuilles)", false);
  row("2.", "Calcule points de prédictions Ronde 1", true);
  row("3.", "Exporte joueurs + prédictions vers App_Live", false);
  row("4.", "Met à jour PredPts dans App_Live", true);
  row("5.", "Écrit FinalMode + Winners + CurrentRound", false);
  row("6.", "Applique strikethrough final", true);
  spacer();

  // ── CHECKBOXES SÉRIE ──
  sectionTitle("☑️ Cases de fin de ronde — Feuille Series");
  row("G2", "End Ronde 1", false);
  row("N2", "End Ronde 1 / Start Ronde 2", true);
  row("U2", "End Ronde 2 / Start Ronde 3", false);
  row("AB2", "End Ronde 3 / Start Finale", true);
  spacer();

  // ── FEUILLES APP ──
  sectionTitle("📊 Feuilles App → HTML");
  row("App_Live", "Ronde 1", false);
  row("App_Ronde2", "Ronde 2", true);
  row("App_Ronde3", "Ronde 3", false);
  row("App_RondeF", "Finale", true);
  spacer();

  // ── FICHIERS GITHUB ──
  sectionTitle("🌐 Fichiers GitHub");
  row("index.html", "Site principal (production)", false);
  row("test.html", "Site de test (nouvelles fonctions)", true);
  row("manifest.json", "Config PWA", false);
  row("icon.png", "Icône application", true);
  spacer();

  // Freeze top row, hide gridlines
  sh.setFrozenRows(1);

  ss.toast("Procédure sheet built!", "✅", 4);
}


function logRonde1Structure() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Ronde 1");
  var data = sheet.getRange(1, 1, 80, 10).getValues();
  for (var i = 0; i < 80; i++) {
    Logger.log("Row " + (i+1) + ": " + JSON.stringify(data[i]));
  }
}




function logMatchup1Block() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Ronde 1");
  var data = sheet.getRange(28, 1, 39, 9).getValues();
  var formulas = sheet.getRange(28, 1, 39, 9).getFormulas();
  for (var i = 0; i < 39; i++) {
    Logger.log("Row " + (28+i) + " VALUES: " + JSON.stringify(data[i]));
    Logger.log("Row " + (28+i) + " FORMULAS: " + JSON.stringify(formulas[i]));
  }
}


function logRonde1Summary() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Ronde 1");
  var data = sheet.getRange(1, 1, 27, 9).getValues();
  var formulas = sheet.getRange(1, 1, 27, 9).getFormulas();
  for (var i = 0; i < 27; i++) {
    Logger.log("Row " + (i+1) + " VALUES: " + JSON.stringify(data[i]));
    Logger.log("Row " + (i+1) + " FORMULAS: " + JSON.stringify(formulas[i]));
  }
}



function debugDraftR2Cols() {
  var draft = SpreadsheetApp.getActive().getSheetByName("DRAFT R2");
  var row1 = draft.getRange(1, 1, 1, 14).getValues()[0];
  var row2 = draft.getRange(2, 1, 1, 14).getValues()[0];
  Logger.log("Row 1 (headers): " + JSON.stringify(row1));
  Logger.log("Row 2 (first data): " + JSON.stringify(row2));
  // Also log seeds col M
  for(var i=0;i<8;i++) {
    Logger.log("Seed "+(i+1)+": " + draft.getRange(i+2,13).getValue());
  }
}


function debugR2Cols() {
  var draft = SpreadsheetApp.getActive().getSheetByName("DRAFT R2");
  var headers = draft.getRange(1,1,1,8).getValues()[0];
  Logger.log("Headers: " + JSON.stringify(headers));
  Logger.log("Row 2 (first picks): " + JSON.stringify(draft.getRange(2,1,1,8).getValues()[0]));
  Logger.log("Seeds col M rows 2-9:");
  for(var i=0;i<8;i++) Logger.log("  Seed "+(i+1)+": "+draft.getRange(i+2,13).getValue());
}


function debugRonde1Pts() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Ronde 1");
  // Check the total row for matchup 1 (row 60)
  Logger.log("Row 60 formula: " + JSON.stringify(sheet.getRange(60,1,1,9).getFormulas()[0]));
  Logger.log("Row 60 values: " + JSON.stringify(sheet.getRange(60,1,1,9).getValues()[0]));
  // Check pts subtotal row 47
  Logger.log("Row 47 formula: " + JSON.stringify(sheet.getRange(47,1,1,9).getFormulas()[0]));
  Logger.log("Row 47 values: " + JSON.stringify(sheet.getRange(47,1,1,9).getValues()[0]));
  // Check pred pts row 58
  Logger.log("Row 58 formula: " + JSON.stringify(sheet.getRange(58,1,1,9).getFormulas()[0]));
  Logger.log("Row 58 values: " + JSON.stringify(sheet.getRange(58,1,1,9).getValues()[0]));
  // Check one forward pts cell D31
  Logger.log("D31 formula: " + sheet.getRange(31,4).getFormula());
  Logger.log("D31 value: " + sheet.getRange(31,4).getValue());
  // Check summary pts row 4
  Logger.log("Row 4 formula: " + JSON.stringify(sheet.getRange(4,1,1,9).getFormulas()[0]));
  Logger.log("Row 4 values: " + JSON.stringify(sheet.getRange(4,1,1,9).getValues()[0]));
}



function fullDebugRonde1() {
  var ss = SpreadsheetApp.getActive();
  var ronde1 = ss.getSheetByName("Ronde 1");
  var db = ss.getSheetByName("Database");
  var live = ss.getSheetByName("LiveStats");
  var draft = ss.getSheetByName("DRAFT");

  // ── DATABASE structure ──
  Logger.log("=== DATABASE ===");
  var dbRow5 = db.getRange(5,1,1,20).getValues()[0];
  Logger.log("DB row 5 values: " + JSON.stringify(dbRow5));
  var dbRow5f = db.getRange(5,1,1,20).getFormulas()[0];
  Logger.log("DB row 5 formulas: " + JSON.stringify(dbRow5f));
  // Check what col D contains for a forward
  Logger.log("DB D5 (forward pts): " + db.getRange(5,4).getValue());
  Logger.log("DB I5 (defense pts): " + db.getRange(5,9).getValue());
  Logger.log("DB Q5 (goalie pts): " + db.getRange(5,17).getValue());

  // ── LIVESTATS structure ──
  Logger.log("=== LIVESTATS ===");
  var lsRow3 = live.getRange(3,1,1,20).getValues()[0];
  Logger.log("LS row 3 values: " + JSON.stringify(lsRow3));

  // ── DRAFT structure ──
  Logger.log("=== DRAFT ===");
  var draftRow1 = draft.getRange(1,1,1,16).getValues()[0];
  Logger.log("DRAFT row 1 headers: " + JSON.stringify(draftRow1));
  var draftRow2 = draft.getRange(2,1,1,16).getValues()[0];
  Logger.log("DRAFT row 2 first picks: " + JSON.stringify(draftRow2));
  Logger.log("DRAFT pred start row 21: " + JSON.stringify(draft.getRange(21,1,1,16).getValues()[0]));

  // ── RONDE 1 full block map ──
  Logger.log("=== RONDE 1 BLOCK MATCHUP 1 (rows 28-66) ===");
  var vals = ronde1.getRange(28,1,39,9).getValues();
  var fmls = ronde1.getRange(28,1,39,9).getFormulas();
  for(var i=0;i<39;i++){
    Logger.log("R"+(28+i)+" V:"+JSON.stringify(vals[i])+" F:"+JSON.stringify(fmls[i]));
  }

  // ── RONDE 1 summary block ──
  Logger.log("=== RONDE 1 SUMMARY (rows 1-27) ===");
  var svals = ronde1.getRange(1,1,27,9).getValues();
  var sfmls = ronde1.getRange(1,1,27,9).getFormulas();
  for(var i=0;i<27;i++){
    Logger.log("R"+(i+1)+" V:"+JSON.stringify(svals[i])+" F:"+JSON.stringify(sfmls[i]));
  }
}

function debugAppLiveVsRonde1() {
  var ss = SpreadsheetApp.getActive();
  var appLive = ss.getSheetByName("App_Live");
  var ronde1 = ss.getSheetByName("Ronde 1");
  
  // App_Live: find Francis rows, check TotalPoints col J
  var alData = appLive.getRange(2,1,20,11).getValues();
  Logger.log("=== APP_LIVE first 20 rows (cols A-K) ===");
  for(var i=0;i<20;i++){
    if(alData[i][0]==='Francis') Logger.log("Francis row: "+JSON.stringify(alData[i]));
  }
  
  // Ronde 1: Francis forward pts (D31)
  Logger.log("=== RONDE 1 ===");
  Logger.log("D31 (Francis McDavid pts): "+ronde1.getRange(31,4).getValue());
  Logger.log("D31 formula: "+ronde1.getRange(31,4).getFormula());
  Logger.log("B60 (Francis total): "+ronde1.getRange(60,2).getValue());
  Logger.log("B60 formula: "+ronde1.getRange(60,2).getFormula());
}


function fullMapDebug() {
  var ss = SpreadsheetApp.getActive();
  var appLive = ss.getSheetByName("App_Live");
  var ronde1 = ss.getSheetByName("Ronde 1");

  // APP_LIVE — Full Francis data
  Logger.log("=== APP_LIVE FRANCIS ALL ROWS ===");
  var alData = appLive.getDataRange().getValues();
  for(var i=1;i<alData.length;i++){
    if(String(alData[i][0]).trim()==='Francis') Logger.log(JSON.stringify(alData[i]));
  }

  // APP_LIVE — Pred table (cols Q onwards)
  Logger.log("=== APP_LIVE PRED TABLE ===");
  var predRange = appLive.getRange(1,17,11,17).getValues();
  for(var i=0;i<predRange.length;i++) Logger.log("Pred row "+(i+1)+": "+JSON.stringify(predRange[i]));

  // RONDE 1 — Full matchup 1 block
  Logger.log("=== RONDE 1 MATCHUP 1 FULL (rows 28-66) ===");
  var r1v = ronde1.getRange(28,1,39,9).getValues();
  var r1f = ronde1.getRange(28,1,39,9).getFormulas();
  for(var i=0;i<39;i++){
    Logger.log("R"+(28+i)+" V:"+JSON.stringify(r1v[i])+" F:"+JSON.stringify(r1f[i]));
  }

  // RONDE 1 — Summary
  Logger.log("=== RONDE 1 SUMMARY (rows 1-5) ===");
  var sv = ronde1.getRange(1,1,5,9).getValues();
  var sf = ronde1.getRange(1,1,5,9).getFormulas();
  for(var i=0;i<5;i++){
    Logger.log("R"+(i+1)+" V:"+JSON.stringify(sv[i])+" F:"+JSON.stringify(sf[i]));
  }
}


function debugEverything() {
  var ss = SpreadsheetApp.getActive();
  
  // ALL SHEETS LIST
  var sheets = ss.getSheets();
  Logger.log("=== ALL SHEETS ===");
  sheets.forEach(function(s){ Logger.log(s.getName()); });
  
  // APP_LIVE — full data
  Logger.log("=== APP_LIVE FULL ===");
  var al = ss.getSheetByName("App_Live").getDataRange().getValues();
  al.forEach(function(r,i){ Logger.log("AL R"+(i+1)+": "+JSON.stringify(r)); });
  
  // APP_RONDE2 — full data
  Logger.log("=== APP_RONDE2 FULL ===");
  var ar2 = ss.getSheetByName("App_Ronde2").getDataRange().getValues();
  ar2.forEach(function(r,i){ Logger.log("AR2 R"+(i+1)+": "+JSON.stringify(r)); });
  
  // RONDE 1 — full values and formulas
  Logger.log("=== RONDE 1 FULL VALUES ===");
  var r1v = ss.getSheetByName("Ronde 1").getDataRange().getValues();
  r1v.forEach(function(r,i){ Logger.log("R1 R"+(i+1)+": "+JSON.stringify(r)); });
  
  // RONDE 2 — full values and formulas
  Logger.log("=== RONDE 2 FULL VALUES ===");
  var r2v = ss.getSheetByName("Ronde 2").getDataRange().getValues();
  r2v.forEach(function(r,i){ Logger.log("R2 R"+(i+1)+": "+JSON.stringify(r)); });
  
  // DATABASE — first 50 rows
  Logger.log("=== DATABASE FIRST 50 ROWS ===");
  var db = ss.getSheetByName("Database").getRange(1,1,50,20).getValues();
  db.forEach(function(r,i){ Logger.log("DB R"+(i+1)+": "+JSON.stringify(r)); });
  
  // DRAFT R2 — full
  Logger.log("=== DRAFT R2 FULL ===");
  var dr2 = ss.getSheetByName("DRAFT R2").getDataRange().getValues();
  dr2.forEach(function(r,i){ Logger.log("DR2 R"+(i+1)+": "+JSON.stringify(r)); });
}



function debugR2NameMatch() {
  var draft = SpreadsheetApp.getActive().getSheetByName("DRAFT R2");
  var headers = draft.getRange(1,1,1,8).getValues()[0];
  Logger.log("Headers: " + JSON.stringify(headers));
  for(var i=0;i<8;i++){
    var seed = String(draft.getRange(i+2,13).getValue()||'').trim();
    var found = false;
    for(var j=0;j<headers.length;j++){
      if(String(headers[j]||'').trim()===seed){ found=true; Logger.log("Seed "+seed+" → col "+j+" ✅"); break; }
    }
    if(!found) Logger.log("Seed "+seed+" → NOT FOUND ❌");
  }
}



function debugRonde2PredRows() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("Ronde 2");
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    if (String(row[1]).indexOf("MATCHUP") > -1 || 
        String(row[1]).indexOf("PRÉD") > -1 ||
        String(row[2]).indexOf("Points") > -1 ||
        (row[1] === "" && row[2] !== "" && typeof row[3] === "number")) {
      Logger.log("Row " + (i+1) + ": " + JSON.stringify(row));
    }
  }
}


function debugSeriesAllRounds() {
  var series = SpreadsheetApp.getActive().getSheetByName("Series");
  var data = series.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    Logger.log("Row " + (i+1) + ": " + JSON.stringify(data[i]));
  }
}


function debugScoreRonde2() {
  var ronde = SpreadsheetApp.getActive().getSheetByName("Ronde 2");
  var data = ronde.getDataRange().getValues();
  var numRows = data.length;
  
  for (var i = 0; i < numRows; i++) {
    var col2 = String(data[i][1] || "");
    if (col2.indexOf("MATCHUP") === 0) Logger.log("MATCHUP at row " + (i+1));
    if (col2.indexOf("PRÉD") !== -1) Logger.log("PRED at row " + (i+1));
  }
}



function debugSeriesR2Results() {
  var series = SpreadsheetApp.getActive().getSheetByName("Series");
  Logger.log("EST K4:M5: " + JSON.stringify(series.getRange("K4:M5").getValues()));
  Logger.log("OUEST K9:M10: " + JSON.stringify(series.getRange("K9:M10").getValues()));
}



function debugStrikethrough() {
  var ss = SpreadsheetApp.getActive();
  var elimData = ss.getSheetByName("Series").getRange("A16:C31").getValues();
  var eliminated = {};
  for (var i = 0; i < elimData.length; i++) {
    var team = String(elimData[i][0] || "").trim().toUpperCase();
    if (team) eliminated[team] = elimData[i][1] === true;
  }

  var plData = ss.getSheetByName("PlayerList").getDataRange().getValues();
  var byName = {};
  for (var r = 1; r < plData.length; r++) {
    var n = String(plData[r][0] || "").trim();
    var t = String(plData[r][6] || "").trim().toUpperCase();
    if (n && t) byName[n] = t;
  }

  var sheet = ss.getSheetByName("LiveStats");
  var vals = sheet.getRange(3, 1, sheet.getLastRow() - 2, 1).getValues();
  vals.forEach(function(row, i) {
    var name = String(row[0] || "").trim();
    if (!name) return;
    var team = byName[name] || "NOT FOUND";
    var isElim = eliminated[team] === true;
    if (isElim || team === "NOT FOUND") {
      Logger.log("Row " + (i + 3) + " | " + name + " | team: " + team + " | elim: " + isElim);
    }
  });
}