// ============================================================
// 🏒 HOCKEY POOL — MAIN SCRIPT v6.0
// Sheets: Database | LiveStats | GameLog | PlayerList | InjuryReport
// API   : NHL api-web.nhle.com (free, no key needed)
// ============================================================
// SECTION MAP:
// 🟡 S1  — CONFIG
// 🎭 S2  — GUEST / HOST MODE  ← edit sheet list here
// ⚪ S3  — UTILITIES
// 🔵 S4  — NHL API HELPERS
// 🔵 S5  — ID / INFO / BASELINE MAPS
// 🔴 S6  — INJURY SYSTEM
// 🟢 S7  — DATABASE REFRESH
// 🟢 S8  — LIVESTATS REFRESH (includes live overlay)
// 🟢 S9  — GAMELOG REFRESH
// 🟢 S10 — SMART HOURLY REFRESH
// 🟢 S11 — SORTS
// ⚪ S12 — PAUSE / RESUME
// ⚪ S13 — SHEET SETUP (run once)
// ⚪ S14 — VIEW TOGGLES
// ⚪ S15 — PLAYER SEARCH
// ⚪ S16 — MAIN ENTRY POINTS
// ⚪ S17 — NIGHTLY RESET
// ⚪ S18 — TRIGGER MANAGEMENT
// ⚪ S19 — ON EDIT
// ⚪ S20 — MENU
// ============================================================


// ============================================================
// 🟡 S1 — CONFIG
// Safe to edit: YES — names and column numbers only
// ============================================================
var CFG = {
  TZ: "America/Toronto",

  // ── Sheet names ──────────────────────────────────────────
  SH_DB:      "Database",
  SH_LIVE:    "LiveStats",
  SH_GAMELOG: "GameLog",
  SH_PLAYERS: "PlayerList",
  SH_INJURY:  "InjuryReport",
  SH_SIMULATION: "Simulation",

  // ── Database left tables (rows 5-100) ───────────────────
  DB_F_NAME:  1,  DB_F_G:  2,  DB_F_A:  3,
  DB_D_NAME:  6,  DB_D_G:  7,  DB_D_A:  8,
  DB_G_NAME: 11,  DB_G_W: 12,  DB_G_L: 13,
  DB_G_SO:   14,  DB_G_GF:15,  DB_G_A: 16,

  // ── Database right lookup tables ────────────────────────
  DB_F_RNAME: 22, DB_F_RID: 23,  // V, W
  DB_D_RNAME: 25, DB_D_RID: 26,  // Y, Z
  DB_G_RNAME: 28, DB_G_RID: 29,  // AB, AC

  // ── Database control cells ───────────────────────────────
  DB_PLAYOFFS:      "S9",   // playoffs checkbox — in control panel area
  DB_TIMESTAMP:     "S6",   // timestamp in control panel
  DB_PAUSE_REFRESH: "AH1",  // pause flags — hidden far right
  DB_PAUSE_NIGHTLY: "AH2",
  DB_START_ROW: 5,
  DB_END_ROW:   100,
  TARGET_SEASON: 20252026,

  // ── Database player search (col AE = 31) ────────────────
  DB_SEARCH_COL:   31,  // AE — label
  DB_SEARCH_INPUT: 32,  // AF — input cell
  DB_SEARCH_ROW:   2,
  DB_SEARCH_RES:   4,
  DB_SEARCH_COLS:  5,

  // ── LiveStats (data starts row 3) ───────────────────────
  LS_START:     3,
  LS_S_NAME:    1,  LS_S_LIVEG:  2,  LS_S_LIVEA:  3,
  LS_S_STATUS:  4,  LS_S_DOT:    5,  LS_S_ID:     6,
  LS_G_NAME:    8,  LS_G_W:      9,  LS_G_L:      10,
  LS_G_SO:      11, LS_G_LIVEG:  12, LS_G_LIVEA:  13,
  LS_G_STATUS:  14, LS_G_DOT:    15, LS_G_ID:     16,
  LS_DEBUG_COL: 18, // R

  // ── GameLog (data starts row 3) ─────────────────────────
  GL_START:      3,
  GL_NAME:       1,  GL_POS:      2,  GL_STATUS:   3,
  GL_CHG_SKT:    4,  GL_CHG_G:    5,  GL_SYNCED:   6,
  GL_FLAG_ICON:  7,  GL_ID:       8,  GL_G_BASE:   9,
  GL_G_LIVE:    10,  GL_A_BASE:  11,  GL_A_LIVE:  12,
  GL_W_BASE:    13,  GL_W_FINAL: 14,  GL_L_BASE:  15,
  GL_L_FINAL:   16,  GL_SO_BASE: 17,  GL_SO_FINAL:18,
  GL_CYCLEKEY:  19,  GL_FLAG:    20,  GL_CREATED: 21,
  GL_TOTAL_COLS:      21,
  GL_DEBUG_START_COL: 8,
  GL_DEBUG_END_COL:   21,

  // ── InjuryReport ────────────────────────────────────────
  IR_START:  3,
  IR_NAME:   1,  IR_CHECK: 2,  IR_STATUS: 3,
  IR_TSN:    4,  IR_SN:    5,  IR_NHL:    6,  IR_FETCHED: 7,

  // ── PlayerList ──────────────────────────────────────────
  PL_NAME: 1, PL_ID: 2, PL_POS: 3, PL_TEAM: 7,

  // ── Indicators ──────────────────────────────────────────
  DOT:          "●",
  INJURY_ICON:  "⛔",
  CONFLICT_ICON:"⚠️⛔",
  COLOR_LIVE:   "#16a34a",
  COLOR_PRE:    "#f5db18",
  COLOR_FINAL:  "#000000",
  COLOR_OFF:    "#dc2626",
  COLOR_INJURY: "#7c3aed",

  // ── GameLog row colors ───────────────────────────────────
  BG_F_LIVE:"#b7e4b7", BG_F_PRE:"#d4efd4", BG_F_FINAL:"#eaf4ea",
  BG_D_LIVE:"#adc6e8", BG_D_PRE:"#ccdaf0", BG_D_FINAL:"#e3edf8",
  BG_G_LIVE:"#e8d87a", BG_G_PRE:"#f0e8a0", BG_G_FINAL:"#f7f2cc",
  BG_INJURY:"#fde8e8",

  // ── InjuryReport colors ──────────────────────────────────
  IR_BG_INJURED: "#fde8e8",
  IR_BG_ODD:     "#eff6ff",
  IR_BG_EVEN:    "#ffffff",

  // ── NHL API ─────────────────────────────────────────────
  API_SCOREBOARD: "https://api-web.nhle.com/v1/scoreboard/",
  API_GAMECENTER: "https://api-web.nhle.com/v1/gamecenter/",
  API_PLAYER:     "https://api-web.nhle.com/v1/player/",
  API_SEARCH:     "https://api-web.nhle.com/v1/search/player?culture=en-us&limit=20&q="
};


// ============================================================
// 🎭 S2 — GUEST / HOST MODE
// Safe to edit: YES — add/remove sheet names below freely
// ============================================================
// ========== S2 - GUEST / HOST MODE (DYNAMIC) ==========
// Config sheet: "SheetVisibility" with columns: SheetName | HostMode | GuestMode

function guestMode() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName("SheetVisibility");
  
  if(!configSheet) {
    ss.toast("ERROR: SheetVisibility config sheet not found!", "❌", 5);
    return;
  }
  
  var data = configSheet.getDataRange().getValues();
  
  // Skip header row
  for(var i = 1; i < data.length; i++) {
    var sheetName = data[i][0];
    var showInGuest = data[i][2]; // Column C: GuestMode (TRUE/FALSE)
    
    if(!sheetName) continue;
    
    var sheet = ss.getSheetByName(sheetName);
    if(!sheet) continue;
    
    if(showInGuest === true || showInGuest === "TRUE" || showInGuest === "✓") {
      sheet.showSheet();
    } else {
      sheet.hideSheet();
    }
  }
  
  // Hide Database columns R onwards
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.hideColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("Guest mode ON", "👤", 3);
}

function hostMode() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName("SheetVisibility");
  
  if(!configSheet) {
    ss.toast("ERROR: SheetVisibility config sheet not found!", "❌", 5);
    return;
  }
  
  var data = configSheet.getDataRange().getValues();
  
  // Skip header row
  for(var i = 1; i < data.length; i++) {
    var sheetName = data[i][0];
    var showInHost = data[i][1]; // Column B: HostMode (TRUE/FALSE)
    
    if(!sheetName) continue;
    
    var sheet = ss.getSheetByName(sheetName);
    if(!sheet) continue;
    
    if(showInHost === true || showInHost === "TRUE" || showInHost === "✓") {
      sheet.showSheet();
    } else {
      sheet.hideSheet();
    }
  }
  
  // Show all Database columns
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.showColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("Host mode ON", "🔧", 3);
}

function showAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  for(var i = 0; i < sheets.length; i++) {
    sheets[i].showSheet();
  }
  
  // Show all Database columns
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.showColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("All sheets visible", "👁️", 3);
}


function createSheetVisibilityConfig() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get the config sheet
  var configSheet = ss.getSheetByName("SheetVisibility");
  if(!configSheet) {
    configSheet = ss.insertSheet("SheetVisibility");
  } else {
    configSheet.clear();
  }
  
  // Set headers
  configSheet.getRange(1, 1, 1, 4).setValues([["SheetName", "FullView", "HostMode", "GuestMode"]]);
  configSheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#4a86e8").setFontColor("white");
  
  // Get all sheets
  var sheets = ss.getSheets();
  var data = [];
  
  for(var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    
    // Defaults:
    var fullView = true; // Full View shows everything
    var hostMode = true; // Host sees most things
    var guestMode = (name === "Database" || name === "LiveStats" || name === "Ronde 1" || name === "Pool Stats"); // Guest sees only main sheets
    
    // SheetVisibility config itself should be hidden in Host/Guest modes
    if(name === "SheetVisibility") {
      hostMode = false;
      guestMode = false;
    }
    
    data.push([name, fullView, hostMode, guestMode]);
  }
  
  // Write data
  if(data.length > 0) {
    configSheet.getRange(2, 1, data.length, 4).setValues(data);
    
    // Add checkboxes to columns B, C, D
    configSheet.getRange(2, 2, data.length, 3).insertCheckboxes();
  }
  
  // Auto-resize columns
  configSheet.autoResizeColumns(1, 4);
  
  ss.toast("SheetVisibility config created with " + data.length + " sheets", "✅", 3);
}

function fullView() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  
  for(var i = 0; i < sheets.length; i++) {
    sheets[i].showSheet();
  }
  
  // Show all Database columns
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.showColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("Full View - All sheets visible", "👁️‍🗨️", 3);
}

function hostMode() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName("SheetVisibility");
  
  if(!configSheet) {
    ss.toast("ERROR: SheetVisibility config sheet not found!", "❌", 5);
    return;
  }
  
  var data = configSheet.getDataRange().getValues();
  
  // Skip header row
  for(var i = 1; i < data.length; i++) {
    var sheetName = data[i][0];
    var showInHost = data[i][2]; // Column C: HostMode
    
    if(!sheetName) continue;
    
    var sheet = ss.getSheetByName(sheetName);
    if(!sheet) continue;
    
    if(showInHost === true || showInHost === "TRUE" || showInHost === "✓") {
      sheet.showSheet();
    } else {
      sheet.hideSheet();
    }
  }
  
  // Show all Database columns
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.showColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("Host mode ON", "🔧", 3);
}

function guestMode() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName("SheetVisibility");
  
  if(!configSheet) {
    ss.toast("ERROR: SheetVisibility config sheet not found!", "❌", 5);
    return;
  }
  
  var data = configSheet.getDataRange().getValues();
  
  // Skip header row
  for(var i = 1; i < data.length; i++) {
    var sheetName = data[i][0];
    var showInGuest = data[i][3]; // Column D: GuestMode
    
    if(!sheetName) continue;
    
    var sheet = ss.getSheetByName(sheetName);
    if(!sheet) continue;
    
    if(showInGuest === true || showInGuest === "TRUE" || showInGuest === "✓") {
      sheet.showSheet();
    } else {
      sheet.hideSheet();
    }
  }
  
  // Hide Database columns R onwards
  var db = ss.getSheetByName(CFG.SH_DB);
  if(db) db.hideColumns(18, db.getMaxColumns() - 17);
  
  ss.toast("Guest mode ON", "👤", 3);
}


// ============================================================
// ⚪ S3 — UTILITIES
// Safe to edit: NO
// ============================================================
function c_(v) { return String(v == null ? "" : v).trim(); }
function getProjectNow() {
  return new Date();
}

function getHockeyDate() {
  var now = getProjectNow();
  var hour = Number(Utilities.formatDate(now, CFG.TZ, "H"));

  // BEFORE 4 AM → still yesterday's hockey day
  if (hour < 4) {
    var d = new Date(now);
    d.setDate(d.getDate() - 1);
    return Utilities.formatDate(d, CFG.TZ, "yyyy-MM-dd");
  }

  // AFTER 4 AM → normal day
  return Utilities.formatDate(now, CFG.TZ, "yyyy-MM-dd");
}
function today_() {return getHockeyDate();}
function nowStr_() { return Utilities.formatDate(getProjectNow(), CFG.TZ, "dd MMM, HH:mm:ss"); }

function fetchJson_(url) {
  var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = resp.getResponseCode();
  if (code < 200 || code >= 300) throw new Error("HTTP " + code + " — " + url);
  return JSON.parse(resp.getContentText());
}

function getSheet_(name) {
  var ss = SpreadsheetApp.openById(SpreadsheetApp.getActiveSpreadsheet().getId());
  var s  = ss.getSheetByName(name);
  if (!s) throw new Error("Sheet not found: " + name);
  return s;
}

function getSeasonLabel_() {
  try {
    var db = getSheet_(CFG.SH_DB);
    var playoff = db.getRange(CFG.DB_PLAYOFFS).getValue() === true;
    var y1 = CFG.TARGET_SEASON.toString().substring(0, 4);
    var y2 = CFG.TARGET_SEASON.toString().substring(4);
    return y1 + "-" + y2 + " " + (playoff ? "Playoffs" : "Regular");
  } catch(e) { return "2025-2026 Regular"; }
}

// ── Accent-insensitive string normalize ───────────────────────
function normalizeStr_(s) {
  return c_(s).toLowerCase()
    .replace(/[àáâãäå]/g,'a').replace(/[èéêë]/g,'e')
    .replace(/[ìíîï]/g,'i').replace(/[òóôõö]/g,'o')
    .replace(/[ùúûü]/g,'u').replace(/[ý]/g,'y')
    .replace(/[ñ]/g,'n').replace(/[ç]/g,'c');
}


// ============================================================
// 🔵 S4 — NHL API HELPERS
// Safe to edit: NO
// ============================================================
function fetchGamesForDate_(dateStr) {
  var target = dateStr || today_();
  var data = fetchJson_(CFG.API_SCOREBOARD + target);
  var blocks = data.gamesByDate || [];
  
  // Check target date first
  for (var i = 0; i < blocks.length; i++) {
    if (c_(blocks[i].date) === target) return blocks[i].games || [];
  }
  
  // If nothing found, try yesterday (handles post-midnight late games)
  if (!dateStr) {
    var now =getProjectNow();
    var d = new date(now); 
    d.setDate(d.getDate()-1);
    var yesterday = Utilities.formatDate(d,CFG.TZ, "yyyy-MM-dd"    );
    var data2 = fetchJson_(CFG.API_SCOREBOARD + yesterday);
    var blocks2 = data2.gamesByDate || [];
    for (var i = 0; i < blocks2.length; i++) {
      if (c_(blocks2[i].date) === yesterday) {
        // Only return if there are still LIVE games
        var games = blocks2[i].games || [];
        var hasLive = games.some(function(g) {
          return normaliseState_(g.gameState) === "LIVE";
        });
        if (hasLive) return games;
      }
    }
  }
  
  return [];
}

function fetchPBP_(gameId)      { return fetchJson_(CFG.API_GAMECENTER + gameId + "/play-by-play"); }
function fetchBoxscore_(gameId) { return fetchJson_(CFG.API_GAMECENTER + gameId + "/boxscore"); }
function fetchLanding_(id)      { return fetchJson_(CFG.API_PLAYER + id + "/landing"); }

function normaliseState_(raw) {
  var s = c_(raw).toUpperCase();
  if (s === "LIVE" || s === "CRIT")  return "LIVE";
  if (s === "FINAL" || s === "OFF")  return "FINAL";
  if (s === "PRE")                   return "PRE";
  return "OFF";
}

// ── PRE only within 10 min of game start (EST) ───────────────
function isWithinPreWindow_(game) {
  try {
    var startUtc = c_(game.startTimeUTC || game.gameDate || "");
    if (!startUtc) return false;
    var gameTime = new Date(startUtc).getTime();
    var nowTime  = getProjectNow().getTime();
    var diffMin  = (gameTime - nowTime) / 60000;
    return diffMin >= -60 && diffMin <= 30;
  } catch(e) { return false; }
}

function buildPBPStatsMap_(gameId) {
  var map = {}; var pbp;
  try { pbp = fetchPBP_(gameId); } catch(e) { return map; }
  var plays = pbp.plays || [];
  for (var i = 0; i < plays.length; i++) {
    var play = plays[i];
    if (c_(play.typeDescKey).toUpperCase() !== "GOAL") continue;
    var pt = c_(play.periodDescriptor && play.periodDescriptor.periodType).toUpperCase();
    if (pt === "SO") continue;
    var d  = play.details || {};
    var sc = c_(d.scoringPlayerId), a1 = c_(d.assist1PlayerId), a2 = c_(d.assist2PlayerId);
    if (sc) { if (!map[sc]) map[sc]={g:0,a:0}; map[sc].g++; }
    if (a1) { if (!map[a1]) map[a1]={g:0,a:0}; map[a1].a++; }
    if (a2) { if (!map[a2]) map[a2]={g:0,a:0}; map[a2].a++; }
  }
  return map;
}

function buildGoalieBoxscoreMap_(gameId) {
  var map = {}; var box;
  try { box = fetchBoxscore_(gameId); } catch(e) { return map; }
  var ps = box.playerByGameStats || {};
  var sides = [ps.homeTeam||{}, ps.awayTeam||{}];
  for (var s = 0; s < sides.length; s++) {
    var goalies = sides[s].goalies || [];
    for (var i = 0; i < goalies.length; i++) {
      var g = goalies[i]; var id = c_(g.playerId||g.id); if (!id) continue;
      var dec = c_(g.decision||"").toUpperCase();
      var ga  = Number(g.goalsAgainst||g.goalsAllowed||0);
      var st  = g.stats||{};
      map[id] = {
        wins:     dec==="W"?1:0,
        losses:   dec==="L"?1:0,
        shutouts: (dec==="W"&&ga===0)?1:0,
        goals:    Number(st.goals||g.goals||0),
        assists:  Number(st.assists||g.assists||0)
      };
    }
  }
  return map;
}


// ============================================================
// 🔵 S5 — ID / INFO / BASELINE MAPS
// Safe to edit: NO
// ============================================================
function buildIdMap_() {
  var db = getSheet_(CFG.SH_DB); var map = {};
  var n  = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;
  function add_(nc, ic) {
    var names = db.getRange(CFG.DB_START_ROW, nc, n, 1).getValues();
    var ids   = db.getRange(CFG.DB_START_ROW, ic, n, 1).getValues();
    for (var i = 0; i < n; i++) {
      var nm=c_(names[i][0]); var id=c_(ids[i][0]);
      if (nm && id) map[nm] = id;
    }
  }
  add_(CFG.DB_F_RNAME, CFG.DB_F_RID);
  add_(CFG.DB_D_RNAME, CFG.DB_D_RID);
  add_(CFG.DB_G_RNAME, CFG.DB_G_RID);
  return map;
}

function buildPlayerInfoMap_() {
  var pl = getSheet_(CFG.SH_PLAYERS); var map = {};
  var last = pl.getLastRow(); if (last < 2) return map;
  var data = pl.getRange(2, 1, last-1, CFG.PL_TEAM).getValues();
  for (var i = 0; i < data.length; i++) {
    var id=c_(data[i][CFG.PL_ID-1]); var name=c_(data[i][CFG.PL_NAME-1]);
    var pos=c_(data[i][CFG.PL_POS-1]).toUpperCase(); var team=c_(data[i][CFG.PL_TEAM-1]).toUpperCase();
    if (id) map[id]={name:name,pos:pos,team:team};
  }
  map["Aho,S"] = "8478427"
  return map;
}

// ── PlayerList name→{id,pos} map (accent-insensitive) ────────
function buildPlayerListNameMap_() {
  var pl = getSheet_(CFG.SH_PLAYERS); var map = {};
  var last = pl.getLastRow(); if (last < 2) return map;
  var data = pl.getRange(2, 1, last-1, CFG.PL_POS).getValues();
  for (var i = 0; i < data.length; i++) {
    var id=c_(data[i][CFG.PL_ID-1]); var name=c_(data[i][CFG.PL_NAME-1]);
    var pos=c_(data[i][CFG.PL_POS-1]).toUpperCase();
    if (id && name) map[normalizeStr_(name)]={id:id,name:name,pos:pos};
  }
  return map;
}

function buildTeamGameMap_(games) {
  var map = {};
  for (var i = 0; i < games.length; i++) {
    var g=games[i];
    var home=c_(g.homeTeam&&(g.homeTeam.abbrev||g.homeTeam.triCode)).toUpperCase();
    var away=c_(g.awayTeam&&(g.awayTeam.abbrev||g.awayTeam.triCode)).toUpperCase();
    if (home) map[home]=g; if (away) map[away]=g;
  }
  return map;
}



function buildBaselineMap_() {
  var db=getSheet_(CFG.SH_DB); var idMap=buildIdMap_(); var map={};
  var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  var fN=db.getRange(CFG.DB_START_ROW,CFG.DB_F_NAME,n,1).getValues();
  var fG=db.getRange(CFG.DB_START_ROW,CFG.DB_F_G,n,1).getValues();
  var fA=db.getRange(CFG.DB_START_ROW,CFG.DB_F_A,n,1).getValues();
  for(var i=0;i<n;i++){var nm=c_(fN[i][0]);var id=nm&&idMap[nm];if(id)map[id]={gBase:Number(fG[i][0]||0),aBase:Number(fA[i][0]||0),wBase:0,lBase:0,soBase:0};}
  var dN=db.getRange(CFG.DB_START_ROW,CFG.DB_D_NAME,n,1).getValues();
  var dG=db.getRange(CFG.DB_START_ROW,CFG.DB_D_G,n,1).getValues();
  var dA=db.getRange(CFG.DB_START_ROW,CFG.DB_D_A,n,1).getValues();
  for(var i=0;i<n;i++){var nm=c_(dN[i][0]);var id=nm&&idMap[nm];if(id)map[id]={gBase:Number(dG[i][0]||0),aBase:Number(dA[i][0]||0),wBase:0,lBase:0,soBase:0};}
  var gN=db.getRange(CFG.DB_START_ROW,CFG.DB_G_NAME,n,1).getValues();
  var gW=db.getRange(CFG.DB_START_ROW,CFG.DB_G_W,n,1).getValues();
  var gL=db.getRange(CFG.DB_START_ROW,CFG.DB_G_L,n,1).getValues();
  var gSO=db.getRange(CFG.DB_START_ROW,CFG.DB_G_SO,n,1).getValues();
  var gGF=db.getRange(CFG.DB_START_ROW,CFG.DB_G_GF,n,1).getValues();
  var gA=db.getRange(CFG.DB_START_ROW,CFG.DB_G_A,n,1).getValues();
  for(var i=0;i<n;i++){var nm=c_(gN[i][0]);var id=nm&&idMap[nm];if(id)map[id]={gBase:0,aBase:0,wBase:Number(gW[i][0]||0),lBase:Number(gL[i][0]||0),soBase:Number(gSO[i][0]||0),gfBase:Number(gGF[i][0]||0),afBase:Number(gA[i][0]||0)};}
  return map;
}

function getFrozenBaseline_() {
  var props = PropertiesService.getScriptProperties();
  var key = "BASELINE_" + today_();
  var cached = props.getProperty(key);

  // ✅ Already locked? Return immediately. Never rebuilds on LIVE/FINAL.
  if (cached) return JSON.parse(cached);

  // Not locked yet. Only proceed if at least one game is in PRE.
  var preActive = false;
  try {
    var games = fetchGamesForDate_();
    for (var i = 0; i < games.length; i++) {
      if (normaliseState_(games[i].gameState) === "PRE") {
        preActive = true; break;
      }
    }
  } catch(e) { return {}; } // API down → wait, don't crash

  // No PRE games yet → do nothing, wait for PRE window
  if (!preActive) return null;

  // ── PRE DETECTED → Fetch Official NHL Stats & LOCK ──
  var db = getSheet_(CFG.SH_DB);
  var playoff = Boolean(db.getRange(CFG.DB_PLAYOFFS).getValue());
  var idMap = buildIdMap_();
  var n = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;
  var map = {};

  function fetchBlock_(nameCol, isGoalie) {
    var names = db.getRange(CFG.DB_START_ROW, nameCol, n, 1).getValues();
    for (var i = 0; i < n; i++) {
      var nm = c_(names[i][0]);
      var id = nm ? idMap[nm] : null;
      if (!id) continue;
      try {
        var s = fetchSeasonStats2_(id, isGoalie, playoff);
        map[id] = isGoalie
          ? { gBase:0, aBase:0, wBase:s.wins, lBase:s.losses, soBase:s.shutouts, gfBase:s.goals, afBase:s.assists }
          : { gBase:s.goals, aBase:s.assists, wBase:0, lBase:0, soBase:0 };
      } catch(e) { Logger.log("Baseline API skip "+id+": "+e); }
      Utilities.sleep(60); // API rate limit guard
    }
  }

  fetchBlock_(CFG.DB_F_NAME, false);
  fetchBlock_(CFG.DB_D_NAME, false);
  fetchBlock_(CFG.DB_G_NAME, true);

  props.setProperty(key, JSON.stringify(map));
  Logger.log("🔒 Baseline LOCKED at PRE | Players: " + Object.keys(map).length);
  return map;
}

// ── Rebuild PlayerList from NHL API current rosters ───────────
// Run manually or called from runNightlyReset()
// BACK UP PlayerList tab before running for the first time!
function rebuildPlayerList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pl = ss.getSheetByName(CFG.SH_PLAYERS);
  if(!pl) { SpreadsheetApp.getActiveSpreadsheet().toast("PlayerList sheet not found!", "⚠️", 5); return; }

  var teams = [
    "ANA","BOS","BUF","CAR","CBJ","CGY","CHI","COL","DAL","DET",
    "EDM","FLA","LAK","MIN","MTL","NJD","NSH","NYI","NYR","OTT",
    "PHI","PIT","SEA","SJS","STL","TBL","TOR","UTA","VAN","VGK",
    "WPG","WSH"
  ];

  var forwards=[], defense=[], goalies=[];

  for(var t=0; t<teams.length; t++) {
    var team = teams[t];
    try {
      var data = fetchJson_("https://api-web.nhle.com/v1/roster/"+team+"/current");
      var sections = [
        {players: data.forwards||[],   pos:"F"},
        {players: data.defensemen||[], pos:"D"},
        {players: data.goalies||[],    pos:"G"}
      ];
      for(var s=0; s<sections.length; s++) {
        var players = sections[s].players;
        var pos     = sections[s].pos;
        for(var i=0; i<players.length; i++) {
          var p    = players[i];
          var id   = c_(p.id||p.playerId);
          var fn   = c_(p.firstName&&(p.firstName.default||p.firstName)||"");
          var ln   = c_(p.lastName&&(p.lastName.default||p.lastName)||"");
          var name = ln+", "+fn.charAt(0);
          if(!id||!ln) continue;
          var row  = [name, id, pos, "", "", "", team];
          if(pos==="F") forwards.push(row);
          if(pos==="D") defense.push(row);
          if(pos==="G") goalies.push(row);
        }
      }
    } catch(e) {
      Logger.log("rebuildPlayerList error for "+team+": "+e);
    }
  }

  // Sort each group alphabetically
  function sortAlpha_(a,b){return a[0].localeCompare(b[0]);}
  forwards.sort(sortAlpha_); defense.sort(sortAlpha_); goalies.sort(sortAlpha_);

  // Combine full roster for cols A-C, G
  var all = forwards.concat(defense).concat(goalies);

  // Clear and write
  var maxRows = Math.max(pl.getLastRow(), 2);
  pl.getRange(2, 1, maxRows-1, 7).clearContent();

  if(all.length > 0) {
    pl.getRange(2, 1, all.length, 7).setValues(all);
  }

  // Write sorted position sublists to D, E, F
  var maxLen = Math.max(forwards.length, defense.length, goalies.length);
  if(maxLen > 0) {
    var fOut=[], dOut=[], gOut=[];
    for(var i=0; i<maxLen; i++) {
      fOut.push([forwards[i] ? forwards[i][0] : ""]);
      dOut.push([defense[i] ? defense[i][0]  : ""]);
      gOut.push([goalies[i] ? goalies[i][0]  : ""]);
    }
    pl.getRange(2, 4, maxLen, 1).setValues(fOut);
    pl.getRange(2, 5, maxLen, 1).setValues(dOut);
    pl.getRange(2, 6, maxLen, 1).setValues(gOut);
  }

  // Headers
  pl.getRange(1,1,1,7).setValues([["Name","ID","Pos","Forwards","Defense","Goalies","Team"]]);

  // Success stamp
  pl.getRange("I1").setValue("✅ Last updated: " + nowStr_()).setFontColor("#16a34a").setFontWeight("bold");

  var msg = "PlayerList rebuilt — "+forwards.length+"F "+defense.length+"D "+goalies.length+"G ("+all.length+" total)";
  Logger.log(msg);
  SpreadsheetApp.getActiveSpreadsheet().toast(msg, "🏒", 6);
}

// ── Get current official stats from NHLvAPI for SYNCED check ─
var _officialStatsCache = {};

function getCurrentOfficial_(id, pos) {
  var db = getSheet_(CFG.SH_DB);
  var playoff = db.getRange(CFG.DB_PLAYOFFS).getValue() === true;
  var cacheKey = id + "_" + (playoff ? "P" : "R"); // ← playoff/regular in key
  
  // Check cache first
  if(_officialStatsCache[cacheKey]) {
    return _officialStatsCache[cacheKey];
  }
  
  try {
var landing=fetchLanding_(id);
var totals=landing.seasonTotals||[];
    var gameType = playoff ? 3 : 2;
    
    var g=0, a=0, w=0, l=0, so=0;
    for(var i=0; i<totals.length; i++) {
      var r = totals[i];
      if(Number(r.season||0) !== CFG.TARGET_SEASON) continue;
      if(Number(r.gameTypeId||0) !== gameType) continue;
      if(c_(r.leagueAbbrev).toUpperCase().indexOf("NHL")=== -1)continue;
      g += Number(r.goals||0);
      a += Number(r.assists||0);
      w += Number(r.wins||0);
      l += Number(r.losses||0);
      so += Number(r.shutouts||0);
    }
    
    var result = {g:g, a:a, w:w, l:l, so:so};
    _officialStatsCache[cacheKey] = result;
    return result;
  } catch(e) {
    return null;
  }
}

function playerData_(id, infoMap, tgMap, gameCache) {
  var empty={state:"OFF",g:0,a:0,w:0,l:0,so:0,gf:0,af:0};
  var info=infoMap[id]||{}; var team=info.team||""; var game=team?tgMap[team]:null;
  if(!game) return empty;
  var gameId=c_(game.id); var cached=gameCache[gameId]; if(!cached) return empty;
  var pbp=cached.pbpMap[id]||{g:0,a:0};
  var gbox=cached.goalieMap[id]||{wins:0,losses:0,shutouts:0,goals:0,assists:0};
  return{state:cached.state,g:pbp.g,a:pbp.a,w:gbox.wins,l:gbox.losses,so:gbox.shutouts,gf:gbox.goals,af:gbox.assists};
}


// ============================================================
// 🔴 S6 — INJURY SYSTEM
// Safe to edit: NO
// Priority: ⚠️⛔ > ⛔ OUT > LIVE > PRE > FINAL > OFF
// ============================================================
function buildInjuryMap_() {
  var map={}; var ir; try{ir=getSheet_(CFG.SH_INJURY);}catch(e){return map;}
  var last=ir.getLastRow(); if(last<CFG.IR_START) return map;
  var n=last-CFG.IR_START+1;
  var names=ir.getRange(CFG.IR_START,CFG.IR_NAME,n,1).getValues();
  var checks=ir.getRange(CFG.IR_START,CFG.IR_CHECK,n,1).getValues();
  for(var i=0;i<n;i++){var name=c_(names[i][0]);if(name&&checks[i][0]===true)map[name]=true;}
  return map;
}

function buildInjuryIdMap_(injuryMap, idMap) {
  var map={};
  for(var name in injuryMap){if(!injuryMap.hasOwnProperty(name))continue;var id=idMap[name];if(id)map[id]=true;}
  return map;
}

function resolveIndicator_(id, liveState, injuryIdMap) {
  var injured=injuryIdMap[id]===true;
  var conflict=injured&&(liveState==="LIVE");
  if(conflict) return{status:"⚠️⛔",dot:CFG.CONFLICT_ICON,dotColor:CFG.COLOR_INJURY,isInjured:true,isConflict:true};
  if(injured)  return{status:"⛔ OUT",dot:CFG.INJURY_ICON,dotColor:CFG.COLOR_INJURY,isInjured:true,isConflict:false};
  var dot=liveState==="FINAL"?"✓":CFG.DOT;
  return{status:liveState,dot:dot,dotColor:dotColor_(liveState),isInjured:false,isConflict:false};
}

function dotColor_(state) {
  if(state==="LIVE")  return CFG.COLOR_LIVE;
  if(state==="PRE")   return CFG.COLOR_PRE;
  if(state==="FINAL") return CFG.COLOR_FINAL;
  return CFG.COLOR_OFF;
}

function applyInjuryInstant_(playerName, isInjured) {
  var idMap=buildIdMap_(); var id=idMap[playerName]; if(!id) return;
  var injuryIdMap={}; if(isInjured) injuryIdMap[id]=true;
  var ls=getSheet_(CFG.SH_LIVE);
  var maxRow=Math.max(ls.getLastRow(),CFG.LS_START); var numRows=Math.max(maxRow-CFG.LS_START+1,1);
  var sIds=ls.getRange(CFG.LS_START,CFG.LS_S_ID,numRows,1).getValues();
  var sSt=ls.getRange(CFG.LS_START,CFG.LS_S_STATUS,numRows,1).getValues();
  for(var i=0;i<numRows;i++){
    if(c_(sIds[i][0])!==id) continue;
    var raw=c_(sSt[i][0]); if(raw==="⛔ OUT"||raw==="⚠️⛔") raw="OFF";
    var ind=resolveIndicator_(id,raw,injuryIdMap);
    ls.getRange(CFG.LS_START+i,CFG.LS_S_STATUS).setValue(ind.status);
    ls.getRange(CFG.LS_START+i,CFG.LS_S_DOT).setValue(ind.dot).setFontColor(ind.dotColor);
  }
  var gIds=ls.getRange(CFG.LS_START,CFG.LS_G_ID,numRows,1).getValues();
  var gSt=ls.getRange(CFG.LS_START,CFG.LS_G_STATUS,numRows,1).getValues();
  for(var j=0;j<numRows;j++){
    if(c_(gIds[j][0])!==id) continue;
    var raw=c_(gSt[j][0]); if(raw==="⛔ OUT"||raw==="⚠️⛔") raw="OFF";
    var ind=resolveIndicator_(id,raw,injuryIdMap);
    ls.getRange(CFG.LS_START+j,CFG.LS_G_STATUS).setValue(ind.status);
    ls.getRange(CFG.LS_START+j,CFG.LS_G_DOT).setValue(ind.dot).setFontColor(ind.dotColor);
  }
  var gl=getSheet_(CFG.SH_GAMELOG); var glLast=gl.getLastRow(); if(glLast<CFG.GL_START) return;
  var glNum=glLast-CFG.GL_START+1;
  var glIds=gl.getRange(CFG.GL_START,CFG.GL_ID,glNum,1).getValues();
  var glSt=gl.getRange(CFG.GL_START,CFG.GL_STATUS,glNum,1).getValues();
  for(var k=0;k<glNum;k++){
    if(c_(glIds[k][0])!==id) continue;
    var raw=c_(glSt[k][0]); if(raw==="⛔ OUT"||raw==="⚠️⛔") raw="FINAL";
    var newStatus=isInjured?(raw==="LIVE"?"⚠️⛔":"⛔ OUT"):raw;
    gl.getRange(CFG.GL_START+k,CFG.GL_STATUS).setValue(newStatus);
    var pos=c_(gl.getRange(CFG.GL_START+k,CFG.GL_POS).getValue());
    gl.getRange(CFG.GL_START+k,1,1,CFG.GL_TOTAL_COLS).setBackground(isInjured?CFG.BG_INJURY:gamelogRowBg_(pos,newStatus));
  }
}


// ============================================================
// 🟢 S7 — DATABASE REFRESH
// Safe to edit: NO
// Only writes to stat columns — never touches formula cells
// ============================================================
function db_refresh() {
  var db=getSheet_(CFG.SH_DB); var idMap=buildIdMap_();
  var playoff=db.getRange(CFG.DB_PLAYOFFS).getValue()===true;
  var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  var fN=db.getRange(CFG.DB_START_ROW,CFG.DB_F_NAME,n,1).getValues();
  var dN=db.getRange(CFG.DB_START_ROW,CFG.DB_D_NAME,n,1).getValues();
  var gN=db.getRange(CFG.DB_START_ROW,CFG.DB_G_NAME,n,1).getValues();
  var fOut=[],dOut=[],gOut=[];
  for(var i=0;i<n;i++){
    var fn=c_(fN[i][0]);var dn=c_(dN[i][0]);var gn=c_(gN[i][0]);
    if(fn&&idMap[fn]){var s=fetchSeasonStats2_(idMap[fn],false,playoff);fOut.push([s.goals,s.assists]);}else {
  fOut.push([
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_F_G).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_F_A).getValue()
  ]);
}
    if(dn&&idMap[dn]){var s=fetchSeasonStats2_(idMap[dn],false,playoff);dOut.push([s.goals,s.assists]);}else {
  dOut.push([
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_D_G).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_D_A).getValue()
  ]);
}
    if(gn&&idMap[gn]){var s=fetchSeasonStats2_(idMap[gn],true,playoff);gOut.push([s.wins,s.losses,s.shutouts,s.goals,s.assists]);}else {
  gOut.push([
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_G_W).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_G_L).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_G_SO).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_G_GF).getValue(),
    db.getRange(CFG.DB_START_ROW + i, CFG.DB_G_A).getValue()
  ]);
}
  }
// Write each column individually to guarantee no bleed
var fG = fOut.map(function(r){return [r[0]];});
var fA = fOut.map(function(r){return [r[1]];});
db.getRange(CFG.DB_START_ROW, CFG.DB_F_G, n, 1).setValues(fG);  // Col B only
db.getRange(CFG.DB_START_ROW, CFG.DB_F_A, n, 1).setValues(fA);  // Col C only

var dG = dOut.map(function(r){return [r[0]];});
var dA = dOut.map(function(r){return [r[1]];});
db.getRange(CFG.DB_START_ROW, CFG.DB_D_G, n, 1).setValues(dG);  // Col G only
db.getRange(CFG.DB_START_ROW, CFG.DB_D_A, n, 1).setValues(dA);  // Col H only

var gW = gOut.map(function(r){return [r[0]];});
var gL = gOut.map(function(r){return [r[1]];});
var gSO = gOut.map(function(r){return [r[2]];});
var gGF = gOut.map(function(r){return [r[3]];});
var gA = gOut.map(function(r){return [r[4]];});
db.getRange(CFG.DB_START_ROW, CFG.DB_G_W, n, 1).setValues(gW);   // Col L
db.getRange(CFG.DB_START_ROW, CFG.DB_G_L, n, 1).setValues(gL);   // Col M
db.getRange(CFG.DB_START_ROW, CFG.DB_G_SO, n, 1).setValues(gSO); // Col N
db.getRange(CFG.DB_START_ROW, CFG.DB_G_GF, n, 1).setValues(gGF); // Col O
db.getRange(CFG.DB_START_ROW, CFG.DB_G_A, n, 1).setValues(gA);   // Col P
  db.getRange(CFG.DB_TIMESTAMP).setValue(nowStr_());
  Logger.log("db_refresh OK | playoff="+playoff);
}

function fetchSeasonStats2_(playerId, isGoalie, isPlayoff) {
  var empty={goals:0,assists:0,wins:0,losses:0,shutouts:0};
  try {
    var landing=fetchLanding_(playerId);
    if(!landing || !landing.seasonTotals) {
      return empty;
    }
    var totals=landing.seasonTotals||[];
    var gameType=isPlayoff?3:2;
    
    // Initialize accumulators
    var g=0, a=0, w=0, l=0, so=0;
    
    for(var i=0;i<totals.length;i++){
      var r=totals[i];
      
      if(Number(r.season||r.seasonId||0)!==CFG.TARGET_SEASON) {
        continue;
      }
      if(Number(r.gameTypeId||0)!==gameType) {
        continue;
      }
      if(c_(r.leagueAbbrev).toUpperCase().indexOf("NHL") === -1) {
        continue;
      }
      
      g += pick_(r,["goals","goal"],0);
      a += pick_(r,["assists","assist"],0);
      w += pick_(r,["wins","win"],0);
      l += pick_(r,["losses","loss"],0);
      so += pick_(r,["shutouts","shutout","so"],0);
    }
    
    return {
      goals: g,
      assists: a,
      wins: isGoalie ? w : 0,
      losses: isGoalie ? l : 0,
      shutouts: isGoalie ? so : 0
    };
  } catch(e){Logger.log("fetchSeasonStats2_ error "+playerId+": "+e);}
  return empty;
}

function pick_(obj,keys,fallback){
  for(var i=0;i<keys.length;i++){if(obj.hasOwnProperty(keys[i])&&obj[keys[i]]!==null&&obj[keys[i]]!=="")return Number(obj[keys[i]]||0);}
  return fallback;
}


// ============================================================
// 🟢 S8 — LIVESTATS REFRESH + LIVE OVERLAY
// Safe to edit: NO
// During active games: writes baseline+live to Database stat cells
// When SYNCED: stops overlay, official stats remain
// ============================================================
function live_refresh() {
  if(isPaused_("REFRESH")){Logger.log("live_refresh: PAUSED");return;}
  var ls=getSheet_(CFG.SH_LIVE); var infoMap=buildPlayerInfoMap_();
  var idMap=buildIdMap_(); var baseMap = getFrozenBaseline_() || {};
  var injuryMap=buildInjuryMap_(); var injuryIdMap=buildInjuryIdMap_(injuryMap,idMap);
  var games=fetchGamesForDate_(); var tgMap=buildTeamGameMap_(games);

  var gameCache={};
  for(var gi=0;gi<games.length;gi++){
    var game=games[gi]; var gameId=c_(game.id);
    var rawState=normaliseState_(game.gameState);
    var state=rawState;
    if(rawState==="PRE"&&!isWithinPreWindow_(game)) state="OFF";
    if(!gameId) continue;
    var pbpMap={},goalieMap={};
    if(state==="LIVE"||state==="FINAL"){pbpMap=buildPBPStatsMap_(gameId);goalieMap=buildGoalieBoxscoreMap_(gameId);}
    gameCache[gameId]={pbpMap:pbpMap,goalieMap:goalieMap,state:state,game:game};
  }

var numRows=ls.getRange(CFG.LS_START,CFG.LS_S_ID,100,1).getValues().filter(function(r){return r[0]!=="";}).length;
if(numRows<1) return;
var sIds=ls.getRange(CFG.LS_START,CFG.LS_S_ID,numRows,1).getValues();
var gIds=ls.getRange(CFG.LS_START,CFG.LS_G_ID,numRows,1).getValues();

  // ── Skaters ───────────────────────────────────────────────
  var sLG=[],sLA=[],sSt=[],sDot=[],sDotC=[];
  for(var i=0;i<numRows;i++){
    var sid=c_(sIds[i][0]);
    if(!sid){sLG.push([""]);sLA.push([""]);sSt.push([""]);sDot.push([""]);sDotC.push([null]);continue;}
    var d=playerData_(sid,infoMap,tgMap,gameCache); var ind=resolveIndicator_(sid,d.state,injuryIdMap);
    
    sLG.push([d.g]);sLA.push([d.a]);sSt.push([ind.status]);sDot.push([ind.dot]);sDotC.push([ind.dotColor]);
  }
  ls.getRange(CFG.LS_START,CFG.LS_S_LIVEG, numRows,1).setValues(sLG);
  ls.getRange(CFG.LS_START,CFG.LS_S_LIVEA, numRows,1).setValues(sLA);
  ls.getRange(CFG.LS_START,CFG.LS_S_STATUS,numRows,1).setValues(sSt);
  ls.getRange(CFG.LS_START,CFG.LS_S_DOT,   numRows,1).setValues(sDot);
  ls.getRange(CFG.LS_START,CFG.LS_S_DOT,   numRows,1).setFontColors(sDotC);

  // ── Goalies ───────────────────────────────────────────────
  var gW=[],gL=[],gSO=[],gLG=[],gLA=[],gSt=[],gDot=[],gDotC=[];
  for(var j=0;j<numRows;j++){
    var gid=c_(gIds[j][0]);
    if(!gid){gW.push([""]);gL.push([""]);gSO.push([""]);gLG.push([""]);gLA.push([""]);gSt.push([""]);gDot.push([""]);gDotC.push([null]);continue;}
    var d=playerData_(gid,infoMap,tgMap,gameCache); var ind=resolveIndicator_(gid,d.state,injuryIdMap);
    gW.push([d.w]);gL.push([d.l]);gSO.push([d.so]);gLG.push([d.gf]);gLA.push([d.af]);
    gSt.push([ind.status]);gDot.push([ind.dot]);gDotC.push([ind.dotColor]);
  }
  ls.getRange(CFG.LS_START,CFG.LS_G_W,     numRows,1).setValues(gW);
  ls.getRange(CFG.LS_START,CFG.LS_G_L,     numRows,1).setValues(gL);
  ls.getRange(CFG.LS_START,CFG.LS_G_SO,    numRows,1).setValues(gSO);
  ls.getRange(CFG.LS_START,CFG.LS_G_LIVEG, numRows,1).setValues(gLG);
  ls.getRange(CFG.LS_START,CFG.LS_G_LIVEA, numRows,1).setValues(gLA);
  ls.getRange(CFG.LS_START,CFG.LS_G_STATUS,numRows,1).setValues(gSt);
  ls.getRange(CFG.LS_START,CFG.LS_G_DOT,   numRows,1).setValues(gDot);
  ls.getRange(CFG.LS_START,CFG.LS_G_DOT,   numRows,1).setFontColors(gDotC);

  // ── Live overlay on Database ──────────────────────────────
  // For players with LIVE/FINAL game: write baseline+live to stat cells
  // When SYNCED: official stats already match, no overlay needed
  applyLiveOverlay_(infoMap, idMap, baseMap, tgMap, gameCache);

  // ── Debug section values ──────────────────────────────────
  ls.getRange(1,CFG.LS_DEBUG_COL,4,3).setValues([
    ["LAST REFRESH","DATE","STATUS"],
    [nowStr_(),today_(),"✓ OK"],
    ["GAMES TODAY",games.length,""],
    ["SEASON",getSeasonLabel_(),""]
  ]);

  Logger.log("live_refresh OK | games="+games.length);


}


// ── Apply live overlay to Database stat cells ─────────────────
function applyLiveOverlay_(infoMap, idMap, baseMap, tgMap, gameCache) {
  var db = getSheet_(CFG.SH_DB);
  var n  = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;

  var fNames = db.getRange(CFG.DB_START_ROW, CFG.DB_F_NAME, n, 1).getValues();
  var dNames = db.getRange(CFG.DB_START_ROW, CFG.DB_D_NAME, n, 1).getValues();
  var gNames = db.getRange(CFG.DB_START_ROW, CFG.DB_G_NAME, n, 1).getValues();

  // Skaters — Forwards
  for(var i=0;i<n;i++){
    var name=c_(fNames[i][0]); if(!name) continue;
    var id=idMap[name]; if(!id) continue;
    var base=baseMap[id]||{gBase:0,aBase:0,wBase:0,lBase:0,soBase:0};
    var d=playerData_(id,infoMap,tgMap,gameCache);
    if(d.state!=="LIVE"&&d.state!=="FINAL") continue;
    if(d.g===0&&d.a===0) continue;
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_F_G).setValue(base.gBase+d.g);
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_F_A).setValue(base.aBase+d.a);
  }

  // Skaters — Defense
  for(var i=0;i<n;i++){
    var name=c_(dNames[i][0]); if(!name) continue;
    var id=idMap[name]; if(!id) continue;
    var base=baseMap[id]||{gBase:0,aBase:0,wBase:0,lBase:0,soBase:0};
    var d=playerData_(id,infoMap,tgMap,gameCache);
    if(d.state!=="LIVE"&&d.state!=="FINAL") continue;
    if(d.g===0&&d.a===0) continue;
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_D_G).setValue(base.gBase+d.g);
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_D_A).setValue(base.aBase+d.a);
  }

  // Goalies
  for(var i=0;i<n;i++){
    var name=c_(gNames[i][0]); if(!name) continue;
    var id=idMap[name]; if(!id) continue;
    var base=baseMap[id]||{gBase:0,aBase:0,wBase:0,lBase:0,soBase:0};
    var d=playerData_(id,infoMap,tgMap,gameCache);
    if(d.state!=="LIVE"&&d.state!=="FINAL") continue;
    if(d.w===0&&d.l===0&&d.so===0) continue;
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_G_W).setValue(base.wBase+d.w);
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_G_L).setValue(base.lBase+d.l);
    db.getRange(CFG.DB_START_ROW+i, CFG.DB_G_SO).setValue(base.soBase+d.so);
  }
}
// ============================================================
// 🟢 S9 — GAMELOG REFRESH
// Safe to edit: NO
// ============================================================
function gamelog_refresh() {
  var gl=getSheet_(CFG.SH_GAMELOG); var stamp=nowStr_();
  var infoMap=buildPlayerInfoMap_(); var idMap=buildIdMap_();
  var baseMap = getFrozenBaseline_() || {};; var injuryMap=buildInjuryMap_();
  var injuryIdMap=buildInjuryIdMap_(injuryMap,idMap);
  var games=fetchGamesForDate_(); var tgMap=buildTeamGameMap_(games);

  var ls=getSheet_(CFG.SH_LIVE);
  var maxLs=Math.max(ls.getLastRow(),CFG.LS_START); var numLs=Math.max(maxLs-CFG.LS_START+1,1);
  var liveMap={};

  var sIds=ls.getRange(CFG.LS_START,CFG.LS_S_ID,numLs,1).getValues();
  var sG=ls.getRange(CFG.LS_START,CFG.LS_S_LIVEG,numLs,1).getValues();
  var sA=ls.getRange(CFG.LS_START,CFG.LS_S_LIVEA,numLs,1).getValues();
  var sSt=ls.getRange(CFG.LS_START,CFG.LS_S_STATUS,numLs,1).getValues();
  for(var i=0;i<numLs;i++){
    var sid=c_(sIds[i][0]); if(!sid) continue;
    var raw=c_(sSt[i][0]); if(raw==="⛔ OUT"||raw==="⚠️⛔") raw="OFF";
    liveMap[sid]={state:raw,g:Number(sG[i][0]||0),a:Number(sA[i][0]||0),w:0,l:0,so:0,gf:0,af:0};
  }

  var gIds=ls.getRange(CFG.LS_START,CFG.LS_G_ID,numLs,1).getValues();
  var gW=ls.getRange(CFG.LS_START,CFG.LS_G_W,numLs,1).getValues();
  var gL=ls.getRange(CFG.LS_START,CFG.LS_G_L,numLs,1).getValues();
  var gSO=ls.getRange(CFG.LS_START,CFG.LS_G_SO,numLs,1).getValues();
  var gLG=ls.getRange(CFG.LS_START,CFG.LS_G_LIVEG,numLs,1).getValues();
  var gLA=ls.getRange(CFG.LS_START,CFG.LS_G_LIVEA,numLs,1).getValues();
  var gSt=ls.getRange(CFG.LS_START,CFG.LS_G_STATUS,numLs,1).getValues();
  for(var j=0;j<numLs;j++){
    var gid=c_(gIds[j][0]); if(!gid) continue;
    var raw=c_(gSt[j][0]); if(raw==="⛔ OUT"||raw==="⚠️⛔") raw="OFF";
    liveMap[gid]={state:raw,g:0,a:0,w:Number(gW[j][0]||0),l:Number(gL[j][0]||0),so:Number(gSO[j][0]||0),gf:Number(gLG[j][0]||0),af:Number(gLA[j][0]||0)};
  }

  var glLast=Math.max(gl.getLastRow(),CFG.GL_START); var glNum=Math.max(glLast-CFG.GL_START+1,1);
  var oldRows=gl.getRange(CFG.GL_START,1,glNum,CFG.GL_TOTAL_COLS).getValues();
  var oldRowMap={};
  for(var i=0;i<oldRows.length;i++){var ck=c_(oldRows[i][CFG.GL_CYCLEKEY-1]);if(ck)oldRowMap[ck]=oldRows[i];}

  var rows=[]; var now24h= getProjectNow().getTime()-(24*60*60*1000); var processed={};

  for(var id in liveMap){
    if(!liveMap.hasOwnProperty(id)) continue;
    var live=liveMap[id]; var base=baseMap[id]; var info=infoMap[id]||{};
    var pos=info.pos||""; var team=info.team||""; var game=team?tgMap[team]:null;
    var gameId=game?c_(game.id):"NOGAME"; var cycleKey=id+"_"+gameId; var state=live.state;
    if(!game||gameId==="NOGAME"||state==="OFF") continue;
    processed[cycleKey]=true;

    var b=base||{gBase:0,aBase:0,wBase:0,lBase:0,soBase:0};
    var oldRow=oldRowMap[cycleKey]||null;
    var oldStatus=oldRow?c_(oldRow[CFG.GL_STATUS-1]):"";
    var createdAt=oldRow?c_(oldRow[CFG.GL_CREATED-1]):stamp;
    var syncedAt=oldRow?c_(oldRow[CFG.GL_SYNCED-1]):"";

    var displayState=state;
if(state==="FINAL"&&oldStatus!=="SYNCED"){
  var isSynced=false;
  var official=getCurrentOfficial_(id,pos);
  if(official){
    if(pos==="G"){
      var hadLive=(live.w>0||live.l>0||live.so>0);
      var expectedW = b.wBase + live.w;
      var expectedL = b.lBase + live.l;
      var expectedSO = b.soBase + live.so;
      isSynced = hadLive && (official.w === expectedW && official.l === expectedL && official.so === expectedSO);
    } else {
      var hadLive=(live.g>0||live.a>0);
      var expectedG = b.gBase + live.g;
      var expectedA = b.aBase + live.a;
      isSynced = hadLive && (official.g === expectedG && official.a === expectedA);
    }
  }
  if(isSynced){
    displayState="SYNCED";
    if(!syncedAt) syncedAt=stamp;
  }
}
if(oldStatus==="SYNCED"){displayState="SYNCED";}

    var injured=injuryIdMap[id]===true; var conflict=injured&&(state==="LIVE");
    var glStatus=displayState;
    if(conflict) glStatus="⚠️⛔"; else if(injured) glStatus="⛔ OUT";

    var flagText=buildGameLogFlag_(id,live,base,pos,game);
    if(conflict) flagText=(flagText?flagText+" | ":"")+"INJURY+LIVE conflict";

    var row=new Array(CFG.GL_TOTAL_COLS).fill("");
    row[CFG.GL_NAME-1]=info.name||""; row[CFG.GL_POS-1]=pos; row[CFG.GL_STATUS-1]=glStatus;
    row[CFG.GL_CHG_SKT-1]=(pos!=="G")?buildSkaterChange_(live.g,live.a):"";
    row[CFG.GL_CHG_G-1]=(pos==="G")?buildGoalieChange_(live):"";
    row[CFG.GL_SYNCED-1]=syncedAt; row[CFG.GL_FLAG_ICON-1]=(flagText||injured)?"⚠️":"";
    row[CFG.GL_ID-1]=id; row[CFG.GL_G_BASE-1]=b.gBase||0; row[CFG.GL_G_LIVE-1]=live.g||0;
    row[CFG.GL_A_BASE-1]=b.aBase||0; row[CFG.GL_A_LIVE-1]=live.a||0;
    row[CFG.GL_W_BASE-1]=b.wBase||0; row[CFG.GL_W_FINAL-1]=live.w||0;
    row[CFG.GL_L_BASE-1]=b.lBase||0; row[CFG.GL_L_FINAL-1]=live.l||0;
    row[CFG.GL_SO_BASE-1]=b.soBase||0; row[CFG.GL_SO_FINAL-1]=live.so||0;
    row[CFG.GL_CYCLEKEY-1]=cycleKey; row[CFG.GL_FLAG-1]=flagText; row[CFG.GL_CREATED-1]=createdAt;
    rows.push(row);
  }

  for(var ck in oldRowMap){
    if(!oldRowMap.hasOwnProperty(ck)||processed[ck]) continue;
    var oldRow=oldRowMap[ck]; var oldStatus=c_(oldRow[CFG.GL_STATUS-1]);
    if(oldStatus!=="FINAL"&&oldStatus!=="SYNCED"&&oldStatus!=="⛔ OUT"&&oldStatus!=="⚠️⛔") continue;
    try{var created=new Date(c_(oldRow[CFG.GL_CREATED-1]));if(!isNaN(created.getTime())&&created.getTime()<now24h) continue;}catch(e){}
if(oldStatus==="FINAL"){
  var oldId=c_(oldRow[CFG.GL_ID-1]); var oldPos=c_(oldRow[CFG.GL_POS-1]);
  var gLive=Number(oldRow[CFG.GL_G_LIVE-1]||0); var aLive=Number(oldRow[CFG.GL_A_LIVE-1]||0);
  var wLive=Number(oldRow[CFG.GL_W_FINAL-1]||0); var lLive=Number(oldRow[CFG.GL_L_FINAL-1]||0); var soLive=Number(oldRow[CFG.GL_SO_FINAL-1]||0);
  var gB=Number(oldRow[CFG.GL_G_BASE-1]||0); var aB=Number(oldRow[CFG.GL_A_BASE-1]||0);
  var wB=Number(oldRow[CFG.GL_W_BASE-1]||0); var lB=Number(oldRow[CFG.GL_L_BASE-1]||0); var soB=Number(oldRow[CFG.GL_SO_BASE-1]||0);
  var official=getCurrentOfficial_(oldId,oldPos);
if(official){
  var isSynced=false;
if(oldPos==="G") {
  var hadLive=(wLive>0||lLive>0||soLive>0);
  isSynced=hadLive&&(official.w===(wB+wLive) && official.l===(lB+lLive) && official.so===(soB+soLive));
} else {
  var hadLive=(gLive>0||aLive>0);
  isSynced=hadLive&&(official.g===(gB+gLive) && official.a===(aB+aLive));
}
  if(isSynced){
    oldRow[CFG.GL_STATUS-1]="SYNCED";
    if(!oldRow[CFG.GL_SYNCED-1]) oldRow[CFG.GL_SYNCED-1]=nowStr_();
  }
}
}
    rows.push(oldRow);
  }

  rows.sort(function(a,b){
    var sa=c_(a[CFG.GL_STATUS-1]),sb=c_(b[CFG.GL_STATUS-1]);
    var pa=c_(a[CFG.GL_POS-1]),pb=c_(b[CFG.GL_POS-1]);
    var na=c_(a[CFG.GL_NAME-1]),nb=c_(b[CFG.GL_NAME-1]);
    var synca=(sa==="SYNCED")?1:0,syncb=(sb==="SYNCED")?1:0;
    if(synca!==syncb) return synca-syncb;
    var sk=function(s){return s==="LIVE"?1:s==="⚠️⛔"?2:s==="⛔ OUT"?3:s==="PRE"?4:s==="FINAL"?5:9;};
    if(sk(sa)!==sk(sb)) return sk(sa)-sk(sb);
    var pk=function(p){return p==="F"?1:p==="D"?2:p==="G"?3:9;};
    if(pk(pa)!==pk(pb)) return pk(pa)-pk(pb);
    return na.localeCompare(nb);
  });

  var writeRows=rows.length; var clearCount=Math.max(glLast-CFG.GL_START+1,writeRows,1);
  gl.getRange(CFG.GL_START,1,clearCount,CFG.GL_TOTAL_COLS).clearContent();
  gl.getRange(CFG.GL_START,1,clearCount,CFG.GL_TOTAL_COLS).setBackground("#ffffff");
  if(writeRows>0){
    gl.getRange(CFG.GL_START,1,writeRows,CFG.GL_TOTAL_COLS).setValues(rows);
    for(var i=0;i<writeRows;i++){
      gl.getRange(CFG.GL_START+i,1,1,CFG.GL_TOTAL_COLS).setBackground(gamelogRowBg_(c_(rows[i][CFG.GL_POS-1]),c_(rows[i][CFG.GL_STATUS-1])));
    }
  }
  Logger.log("gamelog_refresh OK | rows="+writeRows);
}

function buildSkaterChange_(gLive,aLive){var p=[];if(Number(gLive||0)>0)p.push("+"+gLive+"G");if(Number(aLive||0)>0)p.push("+"+aLive+"A");return p.join(" ");}
function buildGoalieChange_(live){var p=[];if(Number(live.w||0)>0)p.push("+"+live.w+"W");if(Number(live.l||0)>0)p.push("+"+live.l+"L");if(Number(live.so||0)>0)p.push("+"+live.so+"SO");if(Number(live.gf||0)>0)p.push("+"+live.gf+"G");if(Number(live.af||0)>0)p.push("+"+live.af+"A");return p.join(" ");}

function buildGameLogFlag_(id, live, base, pos, game) {
  var flags = [];
  if(!game) flags.push("no game found");
  if(!id||id==="") flags.push("missing ID");
  if(!base) flags.push("no baseline — check Database left table");
  if(base) {

  }
  if((live.g||0)>4) flags.push("G>"+live.g+" suspicious");
  if((live.a||0)>5) flags.push("A>"+live.a+" suspicious");
  if((live.w||0)>1) flags.push("W>1 suspicious");

  // ── Accumulation check — compare expected vs actual in Database ──
  if(base && (live.g>0||live.a>0||live.w>0||live.l>0||live.so>0)) {
    var official = getCurrentOfficial_(id, pos);
    if(official) {
      if(pos==="F"||pos==="D") {
        var expectedG = base.gBase + live.g;
        var expectedA = base.aBase + live.a;
        if(official.g > expectedG) flags.push("⚠️ G accumulation: DB="+official.g+" expected="+expectedG);
        if(official.a > expectedA) flags.push("⚠️ A accumulation: DB="+official.a+" expected="+expectedA);
      }
      if(pos==="G") {
        var expectedW  = base.wBase  + live.w;
        var expectedL  = base.lBase  + live.l;
        var expectedSO = base.soBase + live.so;
        if(official.w  > expectedW)  flags.push("⚠️ W accumulation: DB="+official.w+" expected="+expectedW);
        if(official.l  > expectedL)  flags.push("⚠️ L accumulation: DB="+official.l+" expected="+expectedL);
        if(official.so > expectedSO) flags.push("⚠️ SO accumulation: DB="+official.so+" expected="+expectedSO);
      }
    }
  }

  return flags.length>0?"⚠️ "+flags.join(" | "):"";
}

function gamelogRowBg_(pos,state){
  if(state==="⛔ OUT"||state==="⚠️⛔") return CFG.BG_INJURY;
  if(state==="SYNCED"||state==="OFF"||state==="") return "#ffffff";
  if(pos==="F"){if(state==="LIVE")return CFG.BG_F_LIVE;if(state==="PRE")return CFG.BG_F_PRE;if(state==="FINAL")return CFG.BG_F_FINAL;}
  if(pos==="D"){if(state==="LIVE")return CFG.BG_D_LIVE;if(state==="PRE")return CFG.BG_D_PRE;if(state==="FINAL")return CFG.BG_D_FINAL;}
  if(pos==="G"){if(state==="LIVE")return CFG.BG_G_LIVE;if(state==="PRE")return CFG.BG_G_PRE;if(state==="FINAL")return CFG.BG_G_FINAL;}
  return "#ffffff";
}


// ============================================================
// 🟢 S10 — SMART HOURLY DB REFRESH
// Safe to edit: NO
// Only runs when games are LIVE or FINAL
// ============================================================
function runSmartHourlyRefresh() {
  try {
    var games=fetchGamesForDate_(); var hasActive=false;
    for(var i=0;i<games.length;i++){
      var state=normaliseState_(games[i].gameState);
      if(state==="LIVE"||state==="FINAL"){hasActive=true;break;}
    }
    if(!hasActive){Logger.log("runSmartHourlyRefresh: no active games, skipping");return;}
    db_refresh();
    Logger.log("runSmartHourlyRefresh: db_refresh complete");
  } catch(e){Logger.log("runSmartHourlyRefresh ERROR: "+e);}
}


// ============================================================
// 🟢 S11 — SORTS
// Safe to edit: NO
// ============================================================

// ── Sort LiveStats: F first then D, then by status within each
// Status order: LIVE > PRE > FINAL > OFF
// Goalies: alphabetical only
function sortLiveStats() {
  var ls=getSheet_(CFG.SH_LIVE);
  var numRows=ls.getRange(CFG.LS_START,CFG.LS_S_ID,100,1).getValues().filter(function(r){return r[0]!=="";}).length;
if(numRows<1) return;
  var infoMap=buildPlayerInfoMap_();

  // ── Sort skaters ──────────────────────────────────────────
  var skaterData=ls.getRange(CFG.LS_START,CFG.LS_S_NAME,numRows,6).getValues();
  skaterData=skaterData.filter(function(r){return c_(r[CFG.LS_S_ID-1])!==""||c_(r[0])!=="";});
  skaterData.sort(function(a,b){
    var idA=c_(a[CFG.LS_S_ID-1]); var idB=c_(b[CFG.LS_S_ID-1]);
    var infoA=infoMap[idA]||{}; var infoB=infoMap[idB]||{};
    var posA=infoA.pos||"F"; var posB=infoB.pos||"F";
    var stA=c_(a[CFG.LS_S_STATUS-1]); var stB=c_(b[CFG.LS_S_STATUS-1]);
    var nameA=c_(a[0]); var nameB=c_(b[0]);
    // Status first
    var sk=function(s){return s==="LIVE"?1:s==="PRE"?2:s==="FINAL"?3:s==="⚠️⛔"?4:s==="⛔ OUT"?5:6;};
    if(sk(stA)!==sk(stB)) return sk(stA)-sk(stB);
    // Position within status: F before D
    var pk=function(p){return p==="F"?1:p==="D"?2:9;};
    if(pk(posA)!==pk(posB)) return pk(posA)-pk(posB);
    // Alpha within status+position
    return nameA.localeCompare(nameB);
  });

  // ── Sort goalies ──────────────────────────────────────────
  var goalieData=ls.getRange(CFG.LS_START,CFG.LS_G_NAME,numRows,9).getValues();
  goalieData=goalieData.filter(function(r){return c_(r[0])!=="";});
  goalieData.sort(function(a,b){
    var stA=c_(a[CFG.LS_G_STATUS-CFG.LS_G_NAME]); var stB=c_(b[CFG.LS_G_STATUS-CFG.LS_G_NAME]);
    var sk=function(s){return s==="LIVE"?1:s==="PRE"?2:s==="FINAL"?3:s==="⚠️⛔"?4:s==="⛔ OUT"?5:6;};
    if(sk(stA)!==sk(stB)) return sk(stA)-sk(stB);
    return c_(a[0]).localeCompare(c_(b[0]));
  });

  // ── Write back ────────────────────────────────────────────
  ls.getRange(CFG.LS_START,CFG.LS_S_NAME,numRows,6).clearContent();
  ls.getRange(CFG.LS_START,CFG.LS_G_NAME,numRows,9).clearContent();
  if(skaterData.length>0){
    ls.getRange(CFG.LS_START,CFG.LS_S_NAME,skaterData.length,6).setValues(skaterData);
    ls.getRange(CFG.LS_START,CFG.LS_S_DOT,skaterData.length,1).setFontColors(
      skaterData.map(function(r){return[dotColor_(c_(r[CFG.LS_S_STATUS-1]))];})
    );
  }
  if(goalieData.length>0){
    ls.getRange(CFG.LS_START,CFG.LS_G_NAME,goalieData.length,9).setValues(goalieData);
    ls.getRange(CFG.LS_START,CFG.LS_G_DOT,goalieData.length,1).setFontColors(
      goalieData.map(function(r){
        var stIdx=CFG.LS_G_STATUS-CFG.LS_G_NAME;
        return[dotColor_(c_(r[stIdx]))];
      })
    );
  }
updateEliminatedPlayers();
}

function sortDatabase() {
  var db=getSheet_(CFG.SH_DB); var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  function sortBlock_(startCol,numCols){
    var data=db.getRange(CFG.DB_START_ROW,startCol,n,numCols).getValues();
    data.sort(function(a,b){var na=c_(a[0]),nb=c_(b[0]);if(!na&&!nb)return 0;if(!na)return 1;if(!nb)return -1;return na.localeCompare(nb);});
    db.getRange(CFG.DB_START_ROW,startCol,n,numCols).setValues(data);
  }
  sortBlock_(1,3); sortBlock_(6,3); sortBlock_(11,6);
  sortBlock_(CFG.DB_F_RNAME,2); sortBlock_(CFG.DB_D_RNAME,2); sortBlock_(CFG.DB_G_RNAME,2);
  SpreadsheetApp.getActiveSpreadsheet().toast("Database sorted!","🏒",3);
}


// ============================================================
// ⚪ S12 — PAUSE / RESUME
// Safe to edit: NO
// Flags stored in AH1/AH2 — hidden far right
// ============================================================
function isPaused_(key) {
  try {
    var db=getSheet_(CFG.SH_DB);
    if(key==="REFRESH") return c_(db.getRange(CFG.DB_PAUSE_REFRESH).getValue())==="PAUSED";
    if(key==="NIGHTLY") return c_(db.getRange(CFG.DB_PAUSE_NIGHTLY).getValue())==="PAUSED";
  } catch(e){}
  return false;
}

function togglePauseRefresh() {
  var db=getSheet_(CFG.SH_DB); var cell=db.getRange(CFG.DB_PAUSE_REFRESH);
  var next=c_(cell.getValue())==="PAUSED"?"RUNNING":"PAUSED";
  cell.setValue(next).setFontColor(next==="PAUSED"?"#ef4444":"#16a34a").setFontWeight("bold");
  // Update control panel display
  try{db.getRange("R10").setValue("Auto: "+(next==="PAUSED"?"⏸ PAUSED":"▶ ON")).setFontColor(next==="PAUSED"?"#ef4444":"#16a34a");}catch(e){}
  SpreadsheetApp.getActiveSpreadsheet().toast("Auto-refresh: "+next,"🏒",3);
}

function togglePauseNightly() {
  var db=getSheet_(CFG.SH_DB); var cell=db.getRange(CFG.DB_PAUSE_NIGHTLY);
  var next=c_(cell.getValue())==="PAUSED"?"RUNNING":"PAUSED";
  cell.setValue(next).setFontColor(next==="PAUSED"?"#ef4444":"#16a34a").setFontWeight("bold");
  try{db.getRange("R11").setValue("Nightly: "+(next==="PAUSED"?"⏸ PAUSED":"▶ ON")).setFontColor(next==="PAUSED"?"#ef4444":"#16a34a");}catch(e){}
  SpreadsheetApp.getActiveSpreadsheet().toast("Nightly reset: "+next,"🏒",3);
}


// ============================================================
// ⚪ S13 — SHEET SETUP (run once)
// Safe to edit: YES (cosmetic only)
// ============================================================

// ── InjuryReport setup ───────────────────────────────────────
// NOTE: Run this manually after pasting new code
function setupInjurySheet() {
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  var ir=ss.getSheetByName(CFG.SH_INJURY);
  if(!ir) ir=ss.insertSheet(CFG.SH_INJURY);
  ir.clearContents(); ir.clearFormats();
  ir.getRange("A1:G1").breakApart().merge().setValue("⛔ INJURY REPORT")
    .setBackground("#1e293b").setFontColor("#f8fafc").setFontWeight("bold").setFontSize(13).setHorizontalAlignment("center");
  var hdrs=[["Player Name","⛔","Status","TSN (future)","Sportsnet (future)","NHL.com (future)","Last Fetched"]];
  ir.getRange(2,1,1,7).setValues(hdrs).setBackground("#0f172a").setFontColor("#e2e8f0").setFontWeight("bold").setFontSize(12);
  ir.setColumnWidth(1,180);ir.setColumnWidth(2,50);ir.setColumnWidth(3,110);
  ir.setColumnWidth(4,200);ir.setColumnWidth(5,200);ir.setColumnWidth(6,200);ir.setColumnWidth(7,130);
  var idMap=buildIdMap_(); var infoMap=buildPlayerInfoMap_(); var players=[];
  for(var name in idMap){if(!idMap.hasOwnProperty(name))continue;var id=idMap[name];var info=infoMap[id]||{};players.push({name:name,pos:info.pos||""});}
  players.sort(function(a,b){var pk=function(p){return p==="F"?1:p==="D"?2:p==="G"?3:9;};if(pk(a.pos)!==pk(b.pos))return pk(a.pos)-pk(b.pos);return a.name.localeCompare(b.name);});
  if(players.length>0){
    var nameOut=[],statusOut=[];
    for(var i=0;i<players.length;i++){nameOut.push([players[i].name]);statusOut.push(["OK"]);}
    var sr=CFG.IR_START;
    ir.getRange(sr,CFG.IR_NAME,players.length,1).setValues(nameOut);
    ir.getRange(sr,CFG.IR_STATUS,players.length,1).setValues(statusOut).setFontColor("#16a34a").setFontWeight("bold").setFontSize(12);
    ir.getRange(sr,CFG.IR_CHECK,players.length,1).insertCheckboxes();
    for(var j=0;j<players.length;j++){
      ir.getRange(sr+j,1,1,7).setBackground((j%2===0)?CFG.IR_BG_ODD:CFG.IR_BG_EVEN);
    }
    ir.getRange(sr,4,players.length,4).setBackground("#f8fafc").setFontColor("#94a3b8").setFontStyle("italic");
  }
  try{ir.setFrozenRows(2);}catch(e){}
  SpreadsheetApp.getActiveSpreadsheet().toast("InjuryReport done — "+players.length+" players","⛔",5);
}

// ── Database control panel in R1:U10 ─────────────────────────
// Safe — no merging, no formula cells touched
function setupDatabaseControlPanel() {
  var db = getSheet_(CFG.SH_DB);

  db.getRange("R1:U15").clearContent().clearFormat();

  // Row 5 — Header
  db.getRange("R5:U5").setBackground("#0f172a");
  db.getRange("R5").setValue("🗄️ DATABASE").setFontColor("#22d3ee").setFontWeight("bold").setFontSize(12);
  db.getRange("U5").setValue("✓ OK").setFontColor("#16a34a").setFontWeight("bold").setHorizontalAlignment("right");

  // Row 6 — Timestamp
  db.getRange("R6:U6").setBackground("#1e293b");
  db.getRange("R6").setValue("Updated").setFontColor("#475569").setFontSize(10);
  db.getRange("S6").setBackground("#1e293b").setFontColor("#22d3ee").setFontSize(10);

  // Row 7 — Season
  db.getRange("R7:U7").setBackground("#1e293b");
  db.getRange("R7").setValue("Season").setFontColor("#475569").setFontSize(10);
  db.getRange("S7").setValue(getSeasonLabel_()).setFontColor("#22d3ee").setFontSize(10);

  // Row 8 — Mode
  db.getRange("R8:U8").setBackground("#1e293b");
  db.getRange("R8").setValue("Mode").setFontColor("#475569").setFontSize(10);
  db.getRange("S8").setValue("Regular").setFontColor("#22d3ee").setFontSize(10);

  // Row 9 — Playoffs checkbox
  db.getRange("R9:U9").setBackground("#1e293b");
  db.getRange("R9").setValue("🏆 Playoffs").setFontColor("#f59e0b").setFontSize(10).setFontWeight("bold");
  db.getRange("S9").clearContent().clearDataValidations().insertCheckboxes();

  // Row 10 — Auto refresh status
  db.getRange("R10:U10").setBackground("#162030");
  db.getRange("R10").setValue("Auto: ▶ ON").setFontColor("#16a34a").setFontSize(10).setFontWeight("bold");

  // Row 11 — Nightly status
  db.getRange("R11:U11").setBackground("#162030");
  db.getRange("R11").setValue("Nightly: ▶ ON").setFontColor("#16a34a").setFontSize(10).setFontWeight("bold");

  // Row 12 — Refresh button
  db.getRange("R12:U12").setBackground("#2563eb");
  db.getRange("R12").setValue("🔄 Refresh Stats").setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  db.getRange("S12:U12").setBackground("#2563eb");

  db.setColumnWidth(18, 90);
  db.setColumnWidth(19, 110);
  db.setColumnWidth(20, 30);
  db.setColumnWidth(21, 30);

  SpreadsheetApp.getActiveSpreadsheet().toast("Control panel rebuilt!", "🏒", 4);
}

// ── LiveStats debug section — Option 2 scoreboard style ──────
function setupLiveStatsDebug() {
  var ls=getSheet_(CFG.SH_LIVE); var sc=CFG.LS_DEBUG_COL; // col R=18

  // Clear area
  ls.getRange(1,sc,6,4).clearContent().clearFormat();

  // Header row
  ls.getRange(1,sc,1,3).setBackground("#0f172a");
  ls.getRange(1,sc).setValue("📊 LIVESTATS").setFontColor("#22d3ee").setFontWeight("bold").setFontSize(12);
  ls.getRange(1,sc+2).setValue("✓ OK").setFontColor("#16a34a").setFontWeight("bold").setHorizontalAlignment("right");

  // Data rows
  ls.getRange(2,sc,1,3).setBackground("#1e293b");
  ls.getRange(2,sc).setValue("Last Refresh").setFontColor("#475569").setFontSize(10);
  // Values written by live_refresh automatically

  ls.getRange(3,sc,1,3).setBackground("#1e293b");
  ls.getRange(3,sc).setValue("Games Today").setFontColor("#475569").setFontSize(10);

  ls.getRange(4,sc,1,3).setBackground("#1e293b");
  ls.getRange(4,sc).setValue("Season").setFontColor("#475569").setFontSize(10);

  // Refresh button row
  ls.getRange(5,sc,1,3).setBackground("#2563eb");
  ls.getRange(5,sc).setValue("🔄 Refresh Now").setFontColor("#ffffff").setFontWeight("bold").setFontSize(11).setHorizontalAlignment("center");
  ls.getRange(5,sc+1).setBackground("#2563eb");
  ls.getRange(5,sc+2).setBackground("#2563eb");

  // Column widths
  ls.setColumnWidth(sc,   130);
  ls.setColumnWidth(sc+1, 110);
  ls.setColumnWidth(sc+2, 70);

  SpreadsheetApp.getActiveSpreadsheet().toast("LiveStats debug styled!","🏒",3);
}

// ── GameLog headers ───────────────────────────────────────────
function setupGameLogHeaders() {
  var gl=getSheet_(CFG.SH_GAMELOG);
  gl.getRange("A1:U1").clearContent().clearFormat().setBackground("#ffffff");
  gl.getRange("A1").setFontColor("#ffffff").setFontSize(6); // hide flag text
  gl.getRange(2,1,1,7).setValues([["Player Name","Pos","Status","+/- S","+/- G","Synced at","⚠️"]])
    .setBackground("#1a3a5c").setFontColor("#ffffff").setFontWeight("bold").setFontSize(11);
  gl.getRange(2,8,1,14).setValues([["ID","G_Base","G_Live","A_Base","A_Live","W_Base","W_Final","L_Base","L_Final","SO_Base","SO_Final","CycleKey","Flag","Created at"]])
    .setBackground("#334155").setFontColor("#94a3b8").setFontWeight("bold").setFontSize(10);
  try{gl.setFrozenRows(2);}catch(e){}
  SpreadsheetApp.getActiveSpreadsheet().toast("GameLog headers styled!","🏒",3);
}


// ============================================================
// ⚪ S14 — VIEW TOGGLES
// Safe to edit: NO
// ============================================================
function toggleGameLogView() {
  var gl=getSheet_(CFG.SH_GAMELOG);
  var startCol=CFG.GL_DEBUG_START_COL; var numCols=CFG.GL_DEBUG_END_COL-CFG.GL_DEBUG_START_COL+1;
  var flag=c_(gl.getRange("A1").getValue());
  if(flag==="CLEAN"){
    gl.showColumns(startCol,numCols);
    var lastCol=gl.getMaxColumns();
    if(lastCol>CFG.GL_TOTAL_COLS) gl.hideColumns(CFG.GL_TOTAL_COLS+1,lastCol-CFG.GL_TOTAL_COLS);
    gl.getRange("A1").setValue("DEBUG");
  } else {
    gl.hideColumns(startCol,numCols);
    gl.getRange("A1").setValue("CLEAN");
  }
}

function toggleDbRightSide() {
  var db=getSheet_(CFG.SH_DB);
  var startCol=CFG.DB_F_RNAME; var numCols=CFG.DB_G_RID-CFG.DB_F_RNAME+1;
  var colWidth=db.getColumnWidth(startCol);
  if(colWidth<5){db.showColumns(startCol,numCols);}else{db.hideColumns(startCol,numCols);}
}


// ============================================================
// ⚪ S15 — PLAYER SEARCH
// Safe to edit: NO
// Input cell: AF2 (col 32, row 2)
// Assign SEARCH button to: searchPlayer
// ============================================================
function searchPlayer() {
  var db=getSheet_(CFG.SH_DB);
  var query=c_(db.getRange(CFG.DB_SEARCH_ROW,CFG.DB_SEARCH_INPUT).getValue());
  if(query.length<2){SpreadsheetApp.getActiveSpreadsheet().toast("Enter at least 2 characters","🔍",3);return;}

  db.getRange(CFG.DB_SEARCH_RES,CFG.DB_SEARCH_COL,15,CFG.DB_SEARCH_COLS).clearContent().setBackground("#ffffff").setFontColor("#000000");

  var results; try{results=fetchJson_(CFG.API_SEARCH+encodeURIComponent(query));}catch(e){SpreadsheetApp.getActiveSpreadsheet().toast("Search error: "+e,"🔍",5);return;}
  var players=Array.isArray(results)?results:(results.players||results.results||[]);
  if(players.length===0){db.getRange(CFG.DB_SEARCH_RES,CFG.DB_SEARCH_COL).setValue("No results");return;}

  var out=[];
  for(var i=0;i<Math.min(players.length,12);i++){
    var p=players[i];
    var firstName=c_(p.firstName||""); var lastName=c_(p.lastName||"");
    var fullName=c_(p.name||""); if(!fullName&&firstName) fullName=firstName+" "+lastName;
    var nameParts=fullName.trim().split(" ");
    var formatted=nameParts.length>1?nameParts[nameParts.length-1]+", "+nameParts[0].charAt(0):fullName;
    var id=c_(p.playerId||p.id||"");
    var team=c_(p.teamAbbrev||p.currentTeamAbbrev||"—");
    var pos=c_(p.positionCode||p.position||"—");
    out.push([formatted,id,team,pos,"← Add"]);
  }

  if(out.length>0){
    db.getRange(CFG.DB_SEARCH_RES,CFG.DB_SEARCH_COL,out.length,5).setValues(out);
    for(var j=0;j<out.length;j++){
      var bg=(j%2===0)?"#0f1f2e":"#162536";
      db.getRange(CFG.DB_SEARCH_RES+j,CFG.DB_SEARCH_COL,1,5).setBackground(bg).setFontColor("#e0f2fe");
      db.getRange(CFG.DB_SEARCH_RES+j,CFG.DB_SEARCH_COL+4).setFontColor("#22d3ee").setFontWeight("bold");
    }
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Found "+out.length+" for '"+query+"'","🔍",4);
}

function addPlayerFromSearch_(row) {
  var db=getSheet_(CFG.SH_DB); var sc=CFG.DB_SEARCH_COL;
  var name=c_(db.getRange(row,sc).getValue());
  var id=c_(db.getRange(row,sc+1).getValue());
  var pos=c_(db.getRange(row,sc+3).getValue()).toUpperCase();
  if(!name||!id) return;

  var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  var nameCol,idCol;
  if(pos==="F"||pos==="L"||pos==="R"||pos==="C"){nameCol=CFG.DB_F_RNAME;idCol=CFG.DB_F_RID;}
  else if(pos==="D"){nameCol=CFG.DB_D_RNAME;idCol=CFG.DB_D_RID;}
  else if(pos==="G"){nameCol=CFG.DB_G_RNAME;idCol=CFG.DB_G_RID;}
  else{SpreadsheetApp.getActiveSpreadsheet().toast("Unknown position: "+pos+" — add manually","🔍",4);return;}

  var names=db.getRange(CFG.DB_START_ROW,nameCol,n,1).getValues();
  var targetRow=-1;
  for(var i=0;i<n;i++){if(c_(names[i][0])===""){targetRow=CFG.DB_START_ROW+i;break;}}
  if(targetRow===-1){SpreadsheetApp.getActiveSpreadsheet().toast("Lookup table full!","🔍",4);return;}

  db.getRange(targetRow,nameCol).setValue(name);
  db.getRange(targetRow,idCol).setValue(id);
  db.getRange(row,sc+4).setValue("✅ Added").setFontColor("#16a34a");
  SpreadsheetApp.getActiveSpreadsheet().toast(name+" added to "+pos+" lookup!","🔍",4);
}


// ============================================================
// ⚪ S16 — MAIN ENTRY POINTS
// Safe to edit: NO
// ============================================================
function runRefresh() {
  try {
    live_refresh(); gamelog_refresh(); sortLiveStats();
    var db = getSheet_(CFG.SH_DB);
    db.getRange(CFG.DB_TIMESTAMP).setValue(nowStr_());
    SpreadsheetApp.getActiveSpreadsheet().toast("Refreshed at "+nowStr_(),"🏒",4);
  } catch(err){Logger.log("runRefresh ERROR: "+err);SpreadsheetApp.getActiveSpreadsheet().toast("Error: "+err,"🏒",10);}
}

function runDatabaseRefresh() {
  try {
    db_refresh();
    SpreadsheetApp.getActiveSpreadsheet().toast("Database refreshed at "+nowStr_(),"🏒",4);
  } catch(err){Logger.log("runDatabaseRefresh ERROR: "+err);SpreadsheetApp.getActiveSpreadsheet().toast("DB Error: "+err,"🏒",10);}
}

function runRebuildLiveStats() {

  var db=getSheet_(CFG.SH_DB); var ls=getSheet_(CFG.SH_LIVE);
  var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  var fNames=db.getRange(CFG.DB_START_ROW,CFG.DB_F_RNAME,n,1).getValues();
  var fIds=db.getRange(CFG.DB_START_ROW,CFG.DB_F_RID,n,1).getValues();
  var dNames=db.getRange(CFG.DB_START_ROW,CFG.DB_D_RNAME,n,1).getValues();
  var dIds=db.getRange(CFG.DB_START_ROW,CFG.DB_D_RID,n,1).getValues();
  var gNames=db.getRange(CFG.DB_START_ROW,CFG.DB_G_RNAME,n,1).getValues();
  var gIds=db.getRange(CFG.DB_START_ROW,CFG.DB_G_RID,n,1).getValues();
  var skaters=[],goalies=[],seen={};
  function addS_(nm,id){nm=c_(nm);id=c_(id);if(!nm||!id||seen[id])return;seen[id]=true;skaters.push([nm,0,0,"OFF",CFG.DOT,id]);}
  function addG_(nm,id){nm=c_(nm);id=c_(id);if(!nm||!id||seen[id])return;seen[id]=true;goalies.push([nm,0,0,0,0,0,"OFF",CFG.DOT,id]);}
  for(var i=0;i<n;i++){addS_(fNames[i][0],fIds[i][0]);addS_(dNames[i][0],dIds[i][0]);addG_(gNames[i][0],gIds[i][0]);}
  var maxRow=100;
  ls.getRange(CFG.LS_START,CFG.LS_S_NAME,maxRow,6).clearContent();
  ls.getRange(CFG.LS_START,CFG.LS_G_NAME,maxRow,9).clearContent();
  if(skaters.length){ls.getRange(CFG.LS_START,CFG.LS_S_NAME,skaters.length,6).setValues(skaters);ls.getRange(CFG.LS_START,CFG.LS_S_DOT,skaters.length,1).setFontColors(skaters.map(function(){return[CFG.COLOR_OFF];}));}
  if(goalies.length){ls.getRange(CFG.LS_START,CFG.LS_G_NAME,goalies.length,9).setValues(goalies);ls.getRange(CFG.LS_START,CFG.LS_G_DOT,goalies.length,1).setFontColors(goalies.map(function(){return[CFG.COLOR_OFF];}));}
  ls.getRange(1,CFG.LS_DEBUG_COL,2,3).setValues([["LAST REBUILD","DATE",""],[nowStr_(),today_(),""]]);
  SpreadsheetApp.getActiveSpreadsheet().toast("LiveStats rebuilt — "+skaters.length+"S "+goalies.length+"G","🏒",5);
}


function isIdAlreadyUsed_(id, excludeRow, idCol) {
  var db = getSheet_(CFG.SH_DB);
  var n = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;
  
  // Determine which NAME column to check based on ID column
  var nameCol;
  if (idCol === CFG.DB_F_RID) nameCol = CFG.DB_F_NAME;  // W → A
  if (idCol === CFG.DB_D_RID) nameCol = CFG.DB_D_NAME;  // Z → F
  if (idCol === CFG.DB_G_RID) nameCol = CFG.DB_G_NAME;  // AC → K
  
  // Get selected names AND their IDs
  var names = db.getRange(CFG.DB_START_ROW, nameCol, n, 1).getValues();
  var ids = db.getRange(CFG.DB_START_ROW, idCol, n, 1).getValues();
  
  for (var i = 0; i < n; i++) {
    var row = CFG.DB_START_ROW + i;
    if (row === excludeRow) continue;
    
    var selectedName = c_(names[i][0]);
    var selectedId = c_(ids[i][0]);
    
    // Only block if: ID matches AND that row has a selected name
    if (selectedId === id && selectedName !== "") {
      return true;
    }
  }
  
  return false;
}


// ── Duplicate check — trimmed comparison ──────────────────────
function isIdAlreadyUsed_(id, excludeRow, colId){

  var db = getSheet_(CFG.SH_DB);
  var n = CFG.DB_END_ROW - CFG.DB_START_ROW + 1;

  var ids = db.getRange(CFG.DB_START_ROW, colId, n, 1).getValues();

  for (var i = 0; i < n; i++) {
    var row = CFG.DB_START_ROW + i;
    if (row === excludeRow) continue;

    if (String(ids[i][0]).trim() === String(id).trim()) {
      return true;
    }
  }

  return false;
}

function runRefresh() {
  try {
    live_refresh(); gamelog_refresh(); sortLiveStats();
    
    var round = Number(getSheet_(CFG.SH_DB).getRange("S12").getValue() || 1);
if      (round === 2) { exportRonde2(); exportGoalieStats(); }
else if (round === 3) { exportRonde3(); exportGoalieStats(); }
else if (round === 4) { exportRondeF(); exportGoalieStats(); }
else                  runFullRefresh();
    var db = getSheet_(CFG.SH_DB);
    db.getRange(CFG.DB_TIMESTAMP).setValue(nowStr_());
    SpreadsheetApp.getActiveSpreadsheet().toast("Refreshed at "+nowStr_(),"🏒",4);
  } catch(err){Logger.log("runRefresh ERROR: "+err);SpreadsheetApp.getActiveSpreadsheet().toast("Error: "+err,"🏒",10);}
}


// ============================================================
// ⚪ S17 — NIGHTLY RESET
// Safe to edit: NO
// ============================================================
function runNightlyReset() {
  if (hasActiveGames()) {
    Logger.log("runNightlyReset: skipped (games still active)");
    return;
  }

 var hour = Number(Utilities.formatDate(getProjectNow(), CFG.TZ, "H"));


if (hour >= 0 && hour < 4) {
  Logger.log("runNightlyReset: skipped (between midnight and 4am)");
  return;
}
  if(isPaused_("NIGHTLY")){Logger.log("runNightlyReset: PAUSED");return;}
  try { PropertiesService.getScriptProperties().deleteAllProperties();
    Logger.log("=== NIGHTLY RESET START === "+nowStr_());
    db_refresh();
rebuildPlayerList();
    var ls=getSheet_(CFG.SH_LIVE);
    var maxRow=Math.max(ls.getLastRow(),CFG.LS_START); var numRows=Math.max(maxRow-CFG.LS_START+1,1);
    var sIds=ls.getRange(CFG.LS_START,CFG.LS_S_ID,numRows,1).getValues();
    var gIds=ls.getRange(CFG.LS_START,CFG.LS_G_ID,numRows,1).getValues();
    var sReset=[],sSt=[],sDot=[],sDotC=[];
    for(var i=0;i<numRows;i++){var sid=c_(sIds[i][0]);if(!sid){sReset.push(["",""]);sSt.push([""]);sDot.push([""]);sDotC.push([null]);}else{sReset.push([0,0]);sSt.push(["OFF"]);sDot.push([CFG.DOT]);sDotC.push([CFG.COLOR_OFF]);}}
    ls.getRange(CFG.LS_START,CFG.LS_S_LIVEG,numRows,2).setValues(sReset);
    ls.getRange(CFG.LS_START,CFG.LS_S_STATUS,numRows,1).setValues(sSt);
    ls.getRange(CFG.LS_START,CFG.LS_S_DOT,numRows,1).setValues(sDot).setFontColors(sDotC);
    var gReset=[],gSt=[],gDot=[],gDotC=[];
    for(var j=0;j<numRows;j++){var gid=c_(gIds[j][0]);if(!gid){gReset.push(["","","","",""]);gSt.push([""]);gDot.push([""]);gDotC.push([null]);}else{gReset.push([0,0,0,0,0]);gSt.push(["OFF"]);gDot.push([CFG.DOT]);gDotC.push([CFG.COLOR_OFF]);}}
    ls.getRange(CFG.LS_START,CFG.LS_G_W,numRows,5).setValues(gReset);
    ls.getRange(CFG.LS_START,CFG.LS_G_STATUS,numRows,1).setValues(gSt);
    ls.getRange(CFG.LS_START,CFG.LS_G_DOT,numRows,1).setValues(gDot).setFontColors(gDotC);

    Logger.log("=== NIGHTLY RESET COMPLETE === "+nowStr_());
  } catch(err){Logger.log("runNightlyReset ERROR: "+err);}
}


function hasActiveGames() {
  var ls = getSheet_(CFG.SH_LIVE);
  var lastRow = ls.getLastRow();
  var numRows = Math.max(lastRow - CFG.LS_START + 1, 1);

  var sValues = ls.getRange(CFG.LS_START, CFG.LS_S_STATUS, numRows, 1).getValues();
  var gValues = ls.getRange(CFG.LS_START, CFG.LS_G_STATUS, numRows, 1).getValues();

  for (var i = 0; i < numRows; i++) {
    var s = String(sValues[i][0] || "");
    var g = String(gValues[i][0] || "");

    if (s === "LIVE" || s === "PRE" || g === "LIVE" || g === "PRE") {
      return true;
    }
  }

  return false;
}

// ============================================================
// ⚪ S18 — TRIGGER MANAGEMENT
// Safe to edit: NO
// ============================================================
function installTrigger(){removeTrigger();ScriptApp.newTrigger("runRefresh").timeBased().everyMinutes(5).create();SpreadsheetApp.getActiveSpreadsheet().toast("5-min auto-refresh installed!","🏒",5);}
function removeTrigger(){var t=ScriptApp.getProjectTriggers();for(var i=0;i<t.length;i++){if(t[i].getHandlerFunction()==="runRefresh")ScriptApp.deleteTrigger(t[i]);}}
function installNightlyTrigger(){removeNightlyTrigger();ScriptApp.newTrigger("runNightlyReset").timeBased().atHour(4).everyDays(1).inTimezone(CFG.TZ).create();SpreadsheetApp.getActiveSpreadsheet().toast("Nightly 4AM reset installed!","🏒",5);}
function removeNightlyTrigger(){var t=ScriptApp.getProjectTriggers();for(var i=0;i<t.length;i++){if(t[i].getHandlerFunction()==="runNightlyReset")ScriptApp.deleteTrigger(t[i]);}}
function installHourlyTrigger(){removeHourlyTrigger();ScriptApp.newTrigger("runSmartHourlyRefresh").timeBased().everyHours(1).create();SpreadsheetApp.getActiveSpreadsheet().toast("Smart hourly DB refresh installed!","🏒",5);}
function removeHourlyTrigger(){var t=ScriptApp.getProjectTriggers();for(var i=0;i<t.length;i++){if(t[i].getHandlerFunction()==="runSmartHourlyRefresh")ScriptApp.deleteTrigger(t[i]);}}


// ============================================================
// ⚪ S19 — ON EDIT
// Safe to edit: NO
// ============================================================
function onEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // ── InjuryReport checkbox ─────────────────────────────────
  if (sheet.getName() === CFG.SH_INJURY && row >= CFG.IR_START && col === CFG.IR_CHECK) {
    var checked = e.range.getValue();
    var playerName = c_(sheet.getRange(row, CFG.IR_NAME).getValue());
    var statusCell = sheet.getRange(row, CFG.IR_STATUS);

    if (checked === true) {
      statusCell.setValue("⛔ OUT").setFontColor("#dc2626").setFontWeight("bold");
      sheet.getRange(row, 1, 1, 7).setBackground(CFG.IR_BG_INJURED);
    } else {
      statusCell.setValue("OK").setFontColor("#16a34a").setFontWeight("bold");
      sheet.getRange(row, 1, 1, 7).setBackground((row - CFG.IR_START) % 2 === 0 ? CFG.IR_BG_ODD : CFG.IR_BG_EVEN);
    }

    if (playerName) applyInjuryInstant_(playerName, checked === true);
    return;
  }

  // ── Database playoffs checkbox (S5 in control panel) ──────
 if (sheet.getName() === CFG.SH_DB && e.range.getA1Notation() === CFG.DB_PLAYOFFS) {
  var ui = SpreadsheetApp.getUi();
  var currentValue = e.range.getValue();
  var response = ui.alert(
    '⚠️ CONFIRM PLAYOFF MODE CHANGE',
    'Switch to ' + (currentValue ? 'PLAYOFFS' : 'REGULAR SEASON') + ' mode?\n\nThis will refresh ALL stats.',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    e.range.setValue(!currentValue);
    SpreadsheetApp.getActiveSpreadsheet().toast("Mode change cancelled", "🏒", 2);
    return;
  }
  
  var isPlayoff = e.range.getValue() === true;
  sheet.getRange("S7").setValue(isPlayoff ? "Playoffs (25-26)" : "Regular (25-26)");
  sheet.getRange("S8").setValue(isPlayoff ? "Playoffs" : "Regular");
  
  SpreadsheetApp.getActiveSpreadsheet().toast("Playoffs mode " + (isPlayoff ? "ON" : "OFF") + " - refreshing stats...", "🏒", 3);
  db_refresh();
  return;
}

  // ── Database search ← Add click ───────────────────────────
  if (sheet.getName() === CFG.SH_DB && col === CFG.DB_SEARCH_COL + 4 && row >= CFG.DB_SEARCH_RES) {
    if (c_(e.range.getValue()) === "← Add") addPlayerFromSearch_(row);
    return;
  }

  // ── Database right lookup — auto-fetch ID from PlayerList ─
  if (sheet.getName() === CFG.SH_DB) {
    var isLookupCol = false;
    var idCol = 0;

    if (col === CFG.DB_F_RNAME) { isLookupCol = true; idCol = CFG.DB_F_RID; }
    if (col === CFG.DB_D_RNAME) { isLookupCol = true; idCol = CFG.DB_D_RID; }
    if (col === CFG.DB_G_RNAME) { isLookupCol = true; idCol = CFG.DB_G_RID; }

    if (isLookupCol && row >= CFG.DB_START_ROW && row <= CFG.DB_END_ROW) {
      var lookupName = c_(e.range.getValue());

      if (!lookupName) {
        sheet.getRange(row, idCol).clearContent();
        return;
      }

      var plMap = buildPlayerListNameMap_();
      var match = plMap[normalizeStr_(lookupName)];

      if (match) {
        sheet.getRange(row, idCol).setValue(match.id);
      } else {
        sheet.getRange(row, idCol).clearContent();
        SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ " + lookupName + " not found in PlayerList - use search", "🔎", 5);
      }
      return;
    }
  }

  // ── Database left table name change ───────────────────────
  if (sheet.getName() !== CFG.SH_DB) return;
  if (row < CFG.DB_START_ROW || row > CFG.DB_END_ROW) return;

  var section = null;
  if (col === CFG.DB_F_NAME) section = "F";
  if (col === CFG.DB_D_NAME) section = "D";
  if (col === CFG.DB_G_NAME) section = "G";
  if (!section) return;

  try {
    var idMap = buildIdMap_();
    var playoff = sheet.getRange(CFG.DB_PLAYOFFS).getValue() === true;
    var name = c_(e.range.getValue());
    var id = name ? (idMap[name] || "") : "";

    // FORWARDS
 if (section === "F") {
  if (!name) {
    var oldNameF = c_(e.oldValue || "");
    var oldIdF = oldNameF ? (idMap[oldNameF] || "") : "";

    sheet.getRange(row, CFG.DB_F_G, 1, 2).clearContent();
    if (oldIdF) removeFromLiveStats_(oldIdF);
    return;
  }

  if (!id) return;

  var s = fetchSeasonStats2_(id, false, playoff);
  sheet.getRange(row, CFG.DB_F_G, 1, 2).setValues([[s.goals, s.assists]]);

  var currentName = name;
  var names = sheet
    .getRange(CFG.DB_START_ROW, CFG.DB_F_NAME, CFG.DB_END_ROW - CFG.DB_START_ROW + 1, 1)
    .getDisplayValues()
    .map(function(r) { return String(r[0] || "").trim(); });

  var count = names.filter(function(n) { return n === currentName; }).length;

  if (count > 1) {
    e.range.clearContent();
    sheet.getRange(row, CFG.DB_F_G, 1, 2).clearContent();
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ " + name + " already selected", "🏒", 4);
    return;
  }

  addSkaterToLiveStats_(name, id);
  return;
}

    // DEFENSE
    if (section === "D") {
  if (!name) {
    var oldNameD = c_(e.oldValue || "");
    var oldIdD = oldNameD ? (idMap[oldNameD] || "") : "";

    sheet.getRange(row, CFG.DB_D_G, 1, 2).clearContent();
    if (oldIdD) removeFromLiveStats_(oldIdD);
    return;
  }

  if (!id) return;

  var currentName = name;
  var names = sheet
    .getRange(CFG.DB_START_ROW, col, CFG.DB_END_ROW - CFG.DB_START_ROW + 1, 1)
    .getDisplayValues()
    .map(function(r) { return String(r[0] || "").trim(); });

  var count = names.filter(function(n) { return n === currentName; }).length;

  if (count > 1) {
    e.range.clearContent();
    sheet.getRange(row, CFG.DB_D_G, 1, 2).clearContent();
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ " + name + " already selected", "🏒", 4);
    return;
  }

  var s = fetchSeasonStats2_(id, false, playoff);
  sheet.getRange(row, CFG.DB_D_G, 1, 2).setValues([[s.goals, s.assists]]);
  addSkaterToLiveStats_(name, id);
  return;
}


 // GOALIES
if (section === "G") {
  if (!name) {
    var oldNameG = c_(e.oldValue || "");
    var oldIdG = oldNameG ? (idMap[oldNameG] || "") : "";

    sheet.getRange(row, CFG.DB_G_W, 1, 5).clearContent();
    if (oldIdG) removeFromLiveStats_(oldIdG);
    return;
  }

  if (!id) return;

  var currentNameG = name;
  var namesG = sheet
    .getRange(CFG.DB_START_ROW, CFG.DB_G_NAME, CFG.DB_END_ROW - CFG.DB_START_ROW + 1, 1)
    .getDisplayValues()
    .map(function(r) { return String(r[0] || "").trim(); });

  var countG = namesG.filter(function(n) { return n === currentNameG; }).length;

  if (countG > 1) {
    e.range.clearContent();
    sheet.getRange(row, CFG.DB_G_W, 1, 5).clearContent();
    SpreadsheetApp.getActiveSpreadsheet().toast("⚠️ " + name + " already selected", "🏒", 4);
    return;
  }

  var s = fetchSeasonStats2_(id, true, playoff);
  sheet.getRange(row, CFG.DB_G_W, 1, 5).setValues([[s.wins, s.losses, s.shutouts, s.goals, s.assists]]);
  addGoalieToLiveStats_(name, id);
  return;
}

  } catch (err) {
    Logger.log(err);
  }
}



function addSkaterToLiveStats_(name, id) {
  var ls = getSheet_(CFG.SH_LIVE);
  var maxRow = Math.max(ls.getLastRow(), CFG.LS_START);
  var numRows = Math.max(maxRow - CFG.LS_START + 1, 1);
  var sIds = ls.getRange(CFG.LS_START, CFG.LS_S_ID, numRows, 1).getValues();

  for (var i = 0; i < numRows; i++) {
    if (c_(sIds[i][0]) === id) return;
  }

  var nextRow = ls.getLastRow() + 1;
  ls.getRange(nextRow, CFG.LS_S_NAME).setValue(name);
  ls.getRange(nextRow, CFG.LS_S_LIVEG).setValue(0);
  ls.getRange(nextRow, CFG.LS_S_LIVEA).setValue(0);
  ls.getRange(nextRow, CFG.LS_S_STATUS).setValue("OFF");
  ls.getRange(nextRow, CFG.LS_S_DOT).setValue(CFG.DOT).setFontColor(CFG.COLOR_OFF);
  ls.getRange(nextRow, CFG.LS_S_ID).setValue(id);
}

function addGoalieToLiveStats_(name, id) {
  var ls = getSheet_(CFG.SH_LIVE);
  var maxRow = Math.max(ls.getLastRow(), CFG.LS_START);
  var numRows = Math.max(maxRow - CFG.LS_START + 1, 1);
  var gIds = ls.getRange(CFG.LS_START, CFG.LS_G_ID, numRows, 1).getValues();

  for (var i = 0; i < numRows; i++) {
    if (c_(gIds[i][0]) === id) return;
  }

  var nextRow = ls.getLastRow() + 1;
  ls.getRange(nextRow, CFG.LS_G_NAME).setValue(name);
  ls.getRange(nextRow, CFG.LS_G_W).setValue(0);
  ls.getRange(nextRow, CFG.LS_G_L).setValue(0);
  ls.getRange(nextRow, CFG.LS_G_SO).setValue(0);
  ls.getRange(nextRow, CFG.LS_G_LIVEG).setValue(0);
  ls.getRange(nextRow, CFG.LS_G_LIVEA).setValue(0);
  ls.getRange(nextRow, CFG.LS_G_STATUS).setValue("OFF");
  ls.getRange(nextRow, CFG.LS_G_DOT).setValue(CFG.DOT).setFontColor(CFG.COLOR_OFF);
  ls.getRange(nextRow, CFG.LS_G_ID).setValue(id);
}

function removeFromLiveStats_(id) {
  if (!id) return;

  var ls = getSheet_(CFG.SH_LIVE);
  var maxRow = ls.getLastRow();
  if (maxRow < CFG.LS_START) return;

  var numRows = maxRow - CFG.LS_START + 1;

  var sIds = ls.getRange(CFG.LS_START, CFG.LS_S_ID, numRows, 1).getValues();
  for (var i = numRows - 1; i >= 0; i--) {
    if (c_(sIds[i][0]) === id) {
      ls.deleteRow(CFG.LS_START + i);
      return;
    }
  }

  var gIds = ls.getRange(CFG.LS_START, CFG.LS_G_ID, numRows, 1).getValues();
  for (var j = numRows - 1; j >= 0; j--) {
    if (c_(gIds[j][0]) === id) {
      ls.deleteRow(CFG.LS_START + j);
      return;
    }
  }
}



//{
 function onEdit(e){
    var sheet = e.range.getSheet();

    //Only run on Series sheet
    if (sheet.getName() !== "Series")
    return;

    // Only run when checkbox colomn B is edited
    if (e.range.getColumn() !== 2) return;

    //updateEliminatedPlayers();
}
// ============================================================
// ⚪ S20 — MENU
// Safe to edit: YES — rename items freely
// ============================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu("🏒 Pool")
    .addItem("⚡ Live Refresh", "runRefresh")
    .addSeparator()
    .addItem("📈 Rebuild LiveStats", "runRebuildLiveStats")
    .addItem("📋 Refresh Season Stats", "runDatabaseRefresh")
    .addItem("👥 Rebuild PlayerList", "rebuildPlayerList")
    .addSeparator()
    .addItem("⬆️ Sort LiveStats", "sortLiveStats")
    .addItem("⬆️ Sort Database", "sortDatabase")
    .addSeparator()
    .addItem("👁️ Full View", "fullView")
    .addItem("🔧 Host Mode", "hostMode")
    .addItem("👤 Guest Mode", "guestMode")
    .addToUi();

  ui.createMenu("🏆 Séries")
    .addItem("🏆 Mettre à jour séries", "applySeriesUpdate")
    .addSeparator()
    .addItem("🔄 Transition → Ronde 2", "transitionToRonde2")
    .addItem("🔄 Transition → Ronde 3", "transitionToRonde3")
    .addItem("🔄 Transition → Finale",  "transitionToFinale")
    .addSeparator()
    .addItem("🔧 Rebuild Dropdowns", "rebuildSeriesDropdowns")
    .addItem("🏗 Setup Series Rounds", "setupRemainingRounds")
    .addToUi();

  ui.createMenu("📱 Glide")
    .addItem("🔄 Export App_Live", "runFullRefresh")
    .addSeparator()
    .addItem("📤 Export Ronde 2", "exportRonde2")
    .addItem("📤 Export Ronde 3", "exportRonde3")
    .addItem("📤 Export Finale",  "exportRondeF")
    .addToUi();
}
/***********************************************************************************
 * FULL REFRESH
 ***********************************************************************************/
function runFullRefresh() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var hasOnEdit = false;
    for(var i = 0; i < triggers.length; i++) {
      if(triggers[i].getHandlerFunction() === "onEdit") { hasOnEdit = true; break; }
    }
    if(!hasOnEdit) {
      SpreadsheetApp.getUi().alert("🚨 CRITICAL WARNING",
        "onEdit trigger is MISSING!\n\nFix: Extensions → Apps Script → Triggers → Add onEdit trigger",
        SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch(e) { Logger.log("Trigger check failed: " + e); }

  SpreadsheetApp.getActive().toast("Running Full Refresh...", "POOL", 3);

try { runDatabaseRefresh(); } catch(err) { Logger.log("runFullRefresh - runDatabaseRefresh ERROR: " + err); }
  try { refreshDatabaseOfficialOnly(); } catch(err) { Logger.log("runFullRefresh - refreshDatabaseOfficialOnly ERROR: " + err); }
  try { runFullRefresh(); } catch(err) { Logger.log("runFullRefresh - runFullRefresh ERROR: " + err); }

  SpreadsheetApp.getActive().toast("Done ✅", "POOL", 3);

}





function testQuinnHughes() {
  var stats = fetchSeasonStatsNEW_(8480800, false, false);
  Logger.log("Final: " + stats.goals + "G, " + stats.assists + "A");
}



function fetchSeasonStatsNEW_(playerId, isGoalie, isPlayoff) {
  var empty={goals:0,assists:0,wins:0,losses:0,shutouts:0};
  try {
    Logger.log("=== START fetchSeasonStats for " + playerId + " ===");
    var landing=fetchLanding_(playerId);
    Logger.log("Landing fetched successfully");
    if(!landing || !landing.seasonTotals) {
      Logger.log("ERROR: No seasonTotals in landing");
      return empty;
    }
    var totals=landing.seasonTotals||[];
    var gameType=isPlayoff?3:2;
    
    Logger.log("Player " + playerId + " has " + totals.length + " season total rows");
    
    // Initialize accumulators
    var g=0, a=0, w=0, l=0, so=0;
    
    for(var i=0;i<totals.length;i++){
      var r=totals[i];
      Logger.log("Row " + i + ": season=" + (r.season||r.seasonId) + 
                 ", gameType=" + (r.gameTypeId) + 
                 ", league=" + c_(r.leagueAbbrev) +
                 ", team=" + c_(r.teamName||r.teamAbbrev||""));
      
      if(Number(r.season||r.seasonId||0)!==CFG.TARGET_SEASON) {
        Logger.log("  SKIP: wrong season");
        continue;
      }
      if(Number(r.gameTypeId||0)!==gameType) {
        Logger.log("  SKIP: wrong gameType");
        continue;
      }
      if(c_(r.leagueAbbrev).toUpperCase().indexOf("NHL") === -1) {
        Logger.log("  SKIP: wrong league");
        continue;
      }
      
      var rowG = pick_(r,["goals","goal"],0);
      var rowA = pick_(r,["assists","assist"],0);
      Logger.log("  ACCUMULATE: " + rowG + "G " + rowA + "A");
      
      g += rowG;
      a += rowA;
      w += pick_(r,["wins","win"],0);
      l += pick_(r,["losses","loss"],0);
      so += pick_(r,["shutouts","shutout","so"],0);
    }
    
    Logger.log("FINAL TOTALS: " + g + "G " + a + "A");
    
    return {
      goals: g,
      assists: a,
      wins: isGoalie ? w : 0,
      losses: isGoalie ? l : 0,
      shutouts: isGoalie ? so : 0
    };
  } catch(e){Logger.log("fetchSeasonStatsNEW_ error "+playerId+": "+e);}
  return empty;
}


function CHECK_DB_D() {
  var sh = SpreadsheetApp.getActive().getSheetByName('Database');
  var range = sh.getRange('D5:D50');

  var formulas = range.getFormulas();
  var values = range.getValues();

  var out = [];

  for (var i = 0; i < formulas.length; i++) {
    if (formulas[i][0] === '' && values[i][0] !== '') {
      out.push(['D' + (i + 5), values[i][0]]);
    }
  }

  var outSheet = SpreadsheetApp.getActive().getSheetByName('DEBUG_DB');
  if (!outSheet) outSheet = SpreadsheetApp.getActive().insertSheet('DEBUG_DB');

  outSheet.clear();

  if (out.length === 0) {
    outSheet.getRange(1,1).setValue('OK — no overwritten formulas');
  } else {
    outSheet.getRange(1,1, out.length, 2).setValues(out);
  }
}
