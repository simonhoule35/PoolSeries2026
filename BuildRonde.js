// ============================================================
// buildRonde.gs — Build manual sheet for each round
// Functions: buildRonde2(), buildRonde3(), buildRondeF()
//
// Exact replica of Ronde 1 structure based on full debug output.
//
// SUMMARY (per matchup, uses rows nameRow/ptsRow/blank):
//   nameRow: C=leftName, D=fireL, E=VS, F=rightName, G=fireR
//   ptsRow:  C=B{totalRow}, E=matchupNum, F=F{totalRow}
//
// BLOCK (exact Ronde 1 structure):
//   +0  col B: MATCHUP header
//   +1  col B: leftName, E: VS, F: rightName
//   +2  col B: ATTAQUANTS
//   +3..+3+fCount-1: B=ind, C=name, D=ptsF, F=name, G=ptsF, H=ind
//   +3+fCount: col B: DEFENSEURS
//   +4+fCount..+3+fCount+dCount: B=ind, C=name, D=ptsD, F=name, G=ptsD, H=ind
//   +4+fCount+dCount: col B: GARDIENS (skip if gCount=0)
//   +5+fCount+dCount..+4+fCount+dCount+gCount-1: B=ind, C=name, D=ptsG, F=name, G=ptsG, H=ind
//   next: C="Points :", D=SUM(players_D), F="Points :", G=SUM(players_G)
//   next: col B: PRÉDICTIONS
//   +predCount/2 rows: EST picks C=pick,D=0,F=pick,G=0
//   blank row
//   +predCount/2 rows: OUEST picks
//   next: C="Points :", D=SUM(EST_D,OUEST_D), G=SUM(EST_G,OUEST_G)
//   blank row
//   next: B=(D_playerPts+D_predPts), F=(G_playerPts+G_predPts)
//   2 blank rows between blocks
// ============================================================

// ── Indicator formula (same for all — tries skater col D, falls back to goalie col N) ──
function ind_(c){
  var lu='IFERROR(XLOOKUP('+c+',LiveStats!A:A,LiveStats!D:D),XLOOKUP('+c+',LiveStats!H:H,LiveStats!N:N))';
  return '=IFERROR(IFS(REGEXMATCH('+lu+',"LIVE"),"🟢",REGEXMATCH('+lu+',"PRE"),"🟡",REGEXMATCH('+lu+',"FINAL"),"✅",REGEXMATCH('+lu+',"OUT"),"⛔",REGEXMATCH('+lu+',"OFF"),"🔴"),"")';
}

// ── Pts formulas (exact from Ronde 1) ──
function pF_(c){ return '=IF('+c+'="","",IFERROR(VLOOKUP('+c+',Database!$A:$D,4,0),""))'; }
function pD_(c){ return '=IF('+c+'="","",IFERROR(VLOOKUP('+c+',Database!$F:$I,4,0),""))'; }
function pG_(c){ return '=IF('+c+'="","",IFERROR(VLOOKUP('+c+',Database!$K:$Q,7,0),""))'; }

// ── Fire formulas (summary — refs C and F of ptsRow) ──
function fireL_(pr){ return '=IF(AND(ISNUMBER(C'+pr+'),C'+pr+'>F'+pr+'),"🔥 +"&(C'+pr+'-F'+pr+'),"")'; }
function fireR_(pr){ return '=IF(AND(ISNUMBER(F'+pr+'),F'+pr+'>C'+pr+'),"🔥 +"&(F'+pr+'-C'+pr+'),"")'; }

function buildRondeSheet_(cfg){
  var ss=SpreadsheetApp.getActive();
  var sheet=ss.getSheetByName(cfg.sheetName);
  if(!sheet){SpreadsheetApp.getUi().alert("Sheet '"+cfg.sheetName+"' not found.");return;}
  var draft=ss.getSheetByName(cfg.draftName);
  if(!draft){SpreadsheetApp.getUi().alert("Sheet '"+cfg.draftName+"' not found.");return;}

  sheet.clearContents();
  sheet.clearFormats();

  var numUsers=cfg.numMatchups*2;

  // ── Read col headers from row 1 to map user→col (0-based) ──
  var headers=draft.getRange(1,1,1,numUsers).getValues()[0];
  function colOf(name){
    for(var i=0;i<headers.length;i++) if(String(headers[i]||'').trim()===name) return i;
    return -1;
  }

  // ── Read seeds col M(13) rows 2..N ──
  var seeds=[];
  for(var i=0;i<numUsers;i++) seeds.push(String(draft.getRange(i+2,13).getValue()||'').trim());

  // pairNames[m]=[leftName,rightName], pairCols[m]=[leftColIdx,rightColIdx]
  var pairNames=[],pairCols=[];
  for(var m=0;m<cfg.numMatchups;m++){
    var ln=headers[cfg.pairs[m][0]], rn=headers[cfg.pairs[m][1]];
    pairNames.push([ln,rn]);
    pairCols.push([colOf(ln),colOf(rn)]);
  }

  // ── Read all draft data at once ──
  var maxRow=Math.max(cfg.fStart+cfg.fCount,cfg.dStart+cfg.dCount,
    cfg.gCount>0?cfg.gStart+cfg.gCount:0,cfg.predStart+cfg.predCount)+1;
  var dd=draft.getRange(1,1,maxRow,numUsers).getValues();

  // ── SUMMARY ──────────────────────────────────────────────
  sheet.getRange(1,2).setValue('🏒 '+cfg.roundLabel+' — RÉSULTATS');

  // nameRow=3+m*3, ptsRow=4+m*3, blank=5+m*3
  var sumNameRows=[],sumPtsRows=[];
  for(var m=0;m<cfg.numMatchups;m++){
    var nr=3+m*3, pr=4+m*3;
    sumNameRows.push(nr); sumPtsRows.push(pr);
    sheet.getRange(nr,3).setValue(pairNames[m][0]).setFontWeight('bold');
    sheet.getRange(nr,5).setValue('VS').setHorizontalAlignment('center');
    sheet.getRange(nr,6).setValue(pairNames[m][1]).setFontWeight('bold');
    sheet.getRange(pr,5).setValue(m+1).setHorizontalAlignment('center');
  }

  // ── BLOCKS ───────────────────────────────────────────────
  // First block starts after summary + 2 blank rows
  var summaryEnd=2+cfg.numMatchups*3; // last row used by summary
  var r=summaryEnd+3; // +2 blank +1

  var totalRows=[];

  for(var m=0;m<cfg.numMatchups;m++){
    var left=pairNames[m][0],right=pairNames[m][1];
    var lc=pairCols[m][0],rc=pairCols[m][1];

    // +0 MATCHUP header
    sheet.getRange(r,2).setValue('MATCHUP '+(m+1));
    r++;

    // +1 Names
    sheet.getRange(r,2).setValue(left).setFontWeight('bold');
    sheet.getRange(r,5).setValue('VS').setHorizontalAlignment('center');
    sheet.getRange(r,6).setValue(right).setFontWeight('bold');
    r++;

    // +2 ATTAQUANTS
    sheet.getRange(r,2).setValue('⚡ ATTAQUANTS');
    r++;

    var fStart=r;
    for(var f=0;f<cfg.fCount;f++){
      var ln=String(dd[cfg.fStart-1+f][lc]||'').trim();
      var rn=String(dd[cfg.fStart-1+f][rc]||'').trim();
      sheet.getRange(r,2).setFormula(ind_('C'+r));
      sheet.getRange(r,3).setValue(ln);
      sheet.getRange(r,4).setFormula(pF_('C'+r)).setHorizontalAlignment('center');
      sheet.getRange(r,6).setValue(rn);
      sheet.getRange(r,7).setFormula(pF_('F'+r)).setHorizontalAlignment('center');
      sheet.getRange(r,8).setFormula(ind_('F'+r));
      r++;
    }

    // DEFENSEURS
    sheet.getRange(r,2).setValue('🛡 DEFENSEURS');
    r++;

    for(var d=0;d<cfg.dCount;d++){
      var ln=String(dd[cfg.dStart-1+d][lc]||'').trim();
      var rn=String(dd[cfg.dStart-1+d][rc]||'').trim();
      sheet.getRange(r,2).setFormula(ind_('C'+r));
      sheet.getRange(r,3).setValue(ln);
      sheet.getRange(r,4).setFormula(pD_('C'+r)).setHorizontalAlignment('center');
      sheet.getRange(r,6).setValue(rn);
      sheet.getRange(r,7).setFormula(pD_('F'+r)).setHorizontalAlignment('center');
      sheet.getRange(r,8).setFormula(ind_('F'+r));
      r++;
    }

    // GARDIENS (skip if gCount=0)
    var gEnd=r-1;
    if(cfg.gCount>0){
      sheet.getRange(r,2).setValue('🥅 GARDIENS');
      r++;
      for(var g=0;g<cfg.gCount;g++){
        var ln=String(dd[cfg.gStart-1+g][lc]||'').trim();
        var rn=String(dd[cfg.gStart-1+g][rc]||'').trim();
        sheet.getRange(r,2).setFormula(ind_('C'+r));
        sheet.getRange(r,3).setValue(ln);
        sheet.getRange(r,4).setFormula(pG_('C'+r)).setHorizontalAlignment('center');
        sheet.getRange(r,6).setValue(rn);
        sheet.getRange(r,7).setFormula(pG_('F'+r)).setHorizontalAlignment('center');
        sheet.getRange(r,8).setFormula(ind_('F'+r));
        r++;
      }
      gEnd=r-1;
    }

    // Player pts subtotal
    sheet.getRange(r,3).setValue('Points :').setHorizontalAlignment('right');
    sheet.getRange(r,4).setFormula('=SUM(D'+fStart+':D'+gEnd+')').setHorizontalAlignment('center').setFontWeight('bold');
    sheet.getRange(r,6).setValue('Points :').setHorizontalAlignment('right');
    sheet.getRange(r,7).setFormula('=SUM(G'+fStart+':G'+gEnd+')').setHorizontalAlignment('center').setFontWeight('bold');
    var playerPtsRow=r;
    r++;

    // PRÉDICTIONS
    sheet.getRange(r,2).setValue('PRÉDICTIONS');
    r++;

    // EST picks (first half)
    var half=Math.ceil(cfg.predCount/2);
    var estFirst=r,estLast=r;
    for(var p=0;p<half;p++){
      var lp=String(dd[cfg.predStart-1+p][lc]||'').trim();
      var rp=String(dd[cfg.predStart-1+p][rc]||'').trim();
      sheet.getRange(r,3).setValue(lp);
      sheet.getRange(r,4).setValue(0).setHorizontalAlignment('center');
      sheet.getRange(r,6).setValue(rp);
      sheet.getRange(r,7).setValue(0).setHorizontalAlignment('center');
      estLast=r;
      r++;
    }

    // blank between EST and OUEST (like R53 in Ronde 1)
    r++;

    // OUEST picks (second half)
    var ouestFirst=r,ouestLast=r;
    var hasOuest=(cfg.predCount>half);
    if(hasOuest){
      for(var p=half;p<cfg.predCount;p++){
        var lp=String(dd[cfg.predStart-1+p][lc]||'').trim();
        var rp=String(dd[cfg.predStart-1+p][rc]||'').trim();
        sheet.getRange(r,3).setValue(lp);
        sheet.getRange(r,4).setValue(0).setHorizontalAlignment('center');
        sheet.getRange(r,6).setValue(rp);
        sheet.getRange(r,7).setValue(0).setHorizontalAlignment('center');
        ouestLast=r;
        r++;
      }
    }

    // Pred pts subtotal — skips blank row (SUM of EST range, OUEST range separately)
    var sumD='=SUM(D'+estFirst+':D'+estLast+(hasOuest?',D'+ouestFirst+':D'+ouestLast:'')+')';
    var sumG='=SUM(G'+estFirst+':G'+estLast+(hasOuest?',G'+ouestFirst+':G'+ouestLast:'')+')';
    sheet.getRange(r,3).setValue('Points :').setHorizontalAlignment('right');
    sheet.getRange(r,4).setFormula(sumD).setHorizontalAlignment('center').setFontWeight('bold');
    sheet.getRange(r,6).setValue('Points :').setHorizontalAlignment('right');
    sheet.getRange(r,7).setFormula(sumG).setHorizontalAlignment('center').setFontWeight('bold');
    var predPtsRow=r;
    r++;

    // blank row
    r++;

    // TOTAL row — col B and F (exact Ronde 1: B60=D47+D58, F60=G47+G58)
    sheet.getRange(r,2).setFormula('=(D'+playerPtsRow+'+D'+predPtsRow+')').setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
    sheet.getRange(r,6).setFormula('=G'+playerPtsRow+'+G'+predPtsRow).setFontWeight('bold').setFontSize(13).setHorizontalAlignment('center');
    totalRows.push(r);
    r++;

    // 2 blank rows between blocks
    r+=2;
  }

  // ── UPDATE SUMMARY ────────────────────────────────────────
  for(var m=0;m<cfg.numMatchups;m++){
    var nr=sumNameRows[m],pr=sumPtsRows[m],tr=totalRows[m];
    // Fire refs the ptsRow (nr+1=pr) C and F cols
    sheet.getRange(nr,4).setFormula(fireL_(pr));
    sheet.getRange(nr,7).setFormula(fireR_(pr));
    // Pts row refs total col B and F
    sheet.getRange(pr,3).setFormula('=B'+tr);
    sheet.getRange(pr,6).setFormula('=F'+tr);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('✅ '+cfg.sheetName+' built!','POOL',4);
  Logger.log('buildRondeSheet_ done → '+cfg.sheetName);
}


// ============================================================
// BUILD RONDE 2 — 4 matchups, 8 users
// pairs = seed index pairs [W1vsW8, W2vsW7, W3vsW6, W4vsW5]
// ============================================================
function buildRonde2(){
  buildRondeSheet_({
    sheetName:'Ronde 2', draftName:'DRAFT R2', roundLabel:'RONDE 2',
    numMatchups:4, pairs:[[0,1],[2,3],[4,5],[6,7]],
    fStart:2,  fCount:8,
    dStart:11, dCount:4,
    gStart:16, gCount:2,
    predStart:21, predCount:4
  });
}

// ============================================================
// BUILD RONDE 3 — 2 matchups, 4 users
// ============================================================
function buildRonde3(){
  buildRondeSheet_({
    sheetName:'Ronde 3', draftName:'DRAFT R3', roundLabel:'RONDE 3',
    numMatchups:2, pairs:[[0,3],[1,2]],
    fStart:2,  fCount:8,
    dStart:11, dCount:3,
    gStart:15, gCount:1,
    predStart:17, predCount:2
  });
}

// ============================================================
// BUILD RONDE FINALE — 1 matchup, 2 users
// ============================================================
function buildRondeF(){
  buildRondeSheet_({
    sheetName:'Ronde F', draftName:'DRAFT F', roundLabel:'FINALE',
    numMatchups:1, pairs:[[0,1]],
    fStart:2,  fCount:6,
    dStart:9,  dCount:2,
    gStart:0,  gCount:0,
    predStart:12, predCount:1
  });
}