// ============================================================
// 🟢 S7 — DATABASE_OFFICIAL REFRESH - ONLY NIGHT UPDATES - BACK UP IF LIVE FILE IS NOT WORKING
// Safe to edit: NO
// Only writes to stat columns — never touches formula cells
// ============================================================
function db_refresh_official() {
  var db=getSheet_("Database_OFFICIAL"); var idMap=buildIdMap_();
  var playoff=db.getRange(CFG.DB_PLAYOFFS).getValue()===true;
  var n=CFG.DB_END_ROW-CFG.DB_START_ROW+1;
  var fN=db.getRange(CFG.DB_START_ROW,CFG.DB_F_NAME,n,1).getValues();
  var dN=db.getRange(CFG.DB_START_ROW,CFG.DB_D_NAME,n,1).getValues();
  var gN=db.getRange(CFG.DB_START_ROW,CFG.DB_G_NAME,n,1).getValues();
  var fOut=[],dOut=[],gOut=[];
  for(var i=0;i<n;i++){
    var fn=c_(fN[i][0]);var dn=c_(dN[i][0]);var gn=c_(gN[i][0]);
    if(fn&&idMap[fn]){var s=fetchSeasonStats_(idMap[fn],false,playoff);fOut.push([s.goals,s.assists]);}else{fOut.push(["",""]);}
    if(dn&&idMap[dn]){var s=fetchSeasonStats_(idMap[dn],false,playoff);dOut.push([s.goals,s.assists]);}else{dOut.push(["",""]);}
    if(gn&&idMap[gn]){var s=fetchSeasonStats_(idMap[gn],true,playoff);gOut.push([s.wins,s.losses,s.shutouts,s.goals,s.assists]);}else{gOut.push(["","","","",""]);}
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

function fetchSeasonStats_(playerId, isGoalie, isPlayoff) {
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
  } catch(e){Logger.log("fetchSeasonStats_ error "+playerId+": "+e);}
  return empty;
}

function pick_(obj,keys,fallback){
  for(var i=0;i<keys.length;i++){if(obj.hasOwnProperty(keys[i])&&obj[keys[i]]!==null&&obj[keys[i]]!=="")return Number(obj[keys[i]]||0);}
  return fallback;
}



function compareDatabaseVsOfficial_() {
  var live = getSheet_("Database");
  var off  = getSheet_("Database_OFFICIAL");

  var diff = 0;

  diff += sumRangeDiff_(live.getRange("B5:C100").getValues(), off.getRange("B5:C100").getValues());
  diff += sumRangeDiff_(live.getRange("G5:H100").getValues(), off.getRange("G5:H100").getValues());
  diff += sumRangeDiff_(live.getRange("L5:P100").getValues(), off.getRange("L5:P100").getValues());

  return diff > 0;
}

function sumRangeDiff_(a, b) {
  var total = 0;
  for (var r = 0; r < a.length; r++) {
    for (var c = 0; c < a[r].length; c++) {
      total += Math.abs(Number(a[r][c] || 0) - Number(b[r][c] || 0));
    }
  }
  return total;
}

function refreshDatabaseOfficialPanel_() {
  var sh = getSheet_("Database_OFFICIAL");

  sh.getRange("S6").setValue(nowStr_());
  sh.getRange("S7").setValue(getSeasonLabel_());

  var isPlayoffs = Boolean(sh.getRange(CFG.DB_PLAYOFFS).getValue());
  sh.getRange("S8").setValue(isPlayoffs ? "Playoffs" : "Regular");

  sh.getRange("S9").setValue("🔒 NHL");
  sh.getRange("S10").setValue(compareDatabaseVsOfficial_() ? "🟢 Active" : "⚪ Inactive");
  sh.getRange("S11").setValue("☑️ Saved");
}

function refreshDatabaseOfficialOnly() {
  var sh = getSheet_("Database_OFFICIAL");

  try {
    db_refresh_official();
    refreshDatabaseOfficialPanel_();
    SpreadsheetApp.getActiveSpreadsheet().toast("Database_OFFICIAL refreshed", "🔒", 3);
  } catch (err) {
    sh.getRange("S6").setValue(nowStr_());
    sh.getRange("S9").setValue("🔒 NHL");
    sh.getRange("S10").setValue("🔴 Error");
    sh.getRange("S11").setValue("❌ Fetch failed");
    throw err;
  }
}
