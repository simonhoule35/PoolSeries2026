// ============================================================
// REBUILD SERIES DROPDOWNS — run once after entering teams
// Reads team names from each round block and rebuilds dropdowns
// Ronde 1: cols A-F | Ronde 2: cols H-M | Ronde 3: cols O-T | Finale: cols V-AA
// ============================================================
function rebuildSeriesDropdowns() {
  var series = getSheet_(POOL.SH_SERIES);

  var rounds = [
    { colOffset: 0,  estRows: [4,5,6,7], ouestRows: [9,10,11,12] }, // Ronde 1
    { colOffset: 7,  estRows: [4,5],     ouestRows: [9,10]        }, // Ronde 2
    { colOffset: 14, estRows: [4],       ouestRows: [9]            }, // Ronde 3
    { colOffset: 21, estRows: [4],       ouestRows: []             }  // Finale
  ];

  rounds.forEach(function(ronde) {
    var teamCol = ronde.colOffset + 2; // col B relative
    var oppCol  = ronde.colOffset + 3; // col C relative
    var dropCol = ronde.colOffset + 4; // col D relative
    var gamesCol= ronde.colOffset + 5; // col E relative

    var allRows = ronde.estRows.concat(ronde.ouestRows);

    allRows.forEach(function(row) {
      var team1 = String(series.getRange(row, teamCol).getValue() || "").trim();
      var team2 = String(series.getRange(row, oppCol).getValue() || "").trim();
      if (!team1 || !team2) return;

      series.getRange(row, dropCol).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList([team1, team2], true)
          .build()
      );
      series.getRange(row, gamesCol).setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(["4","5","6","7"], true)
          .build()
      );
    });
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Dropdowns rebuilt for all rounds!", "✅", 3);
}


// ============================================================
// SETUP SERIES SHEET — Ronde 2, 3, Finale
// Run once to build structure with placeholders
// Ronde 2: cols H-M | Ronde 3: cols O-T | Finale: cols V-AA
// ============================================================
function setupRemainingRounds() {
  var series = getSheet_(POOL.SH_SERIES);

  var rounds = [
    {
      colOffset: 0,
      label: "RONDE 1",
      est: [
        ["MTL vs TBL","MTL","TBL"],
        ["BUF vs BOS","BUF","BOS"],
        ["CAR vs OTT","CAR","OTT"],
        ["PHI vs PIT","PHI","PIT"]
      ],
      ouest: [
        ["COL vs LAK","COL","LAK"],
        ["MIN vs DAL","MIN","DAL"],
        ["VGK vs UTH","VGK","UTH"],
        ["EDM vs ANA","EDM","ANA"]
      ]
    },
    {
      colOffset: 7,
      label: "RONDE 2",
      est: [
        ["EST QF1","TEAM1","TEAM2"],
        ["EST QF2","TEAM1","TEAM2"]
      ],
      ouest: [
        ["OUEST QF1","TEAM1","TEAM2"],
        ["OUEST QF2","TEAM1","TEAM2"]
      ]
    },
    {
      colOffset: 14,
      label: "RONDE 3",
      est: [["EST SF","TEAM1","TEAM2"]],
      ouest: [["OUEST SF","TEAM1","TEAM2"]]
    },
    {
      colOffset: 21,
      label: "FINALE",
      est: [["FINALE","TEAM1","TEAM2"]],
      ouest: []
    }
  ];

  rounds.forEach(function(ronde) {
    var c = ronde.colOffset + 1;

    series.getRange(1, c, 1, 6).merge()
      .setValue("📊 RÉSULTATS " + ronde.label)
      .setFontWeight("bold").setBackground(POOL.COLOR_HEADER).setFontColor(POOL.COLOR_WHITE)
      .setHorizontalAlignment("center");

    series.getRange(2, c, 1, 6)
      .setValues([["Série","Équipe 1","Équipe 2","Gagnant","Matchs","Terminée"]])
      .setFontWeight("bold").setBackground("#2a3a4a").setFontColor(POOL.COLOR_WHITE);

    series.getRange(3, c, 1, 6).merge()
      .setValue("EST").setFontWeight("bold")
      .setBackground(POOL.COLOR_EST).setFontColor(POOL.COLOR_WHITE)
      .setHorizontalAlignment("center");

    for (var i = 0; i < ronde.est.length; i++) {
      var row = 4 + i;
      var s = ronde.est[i];
      series.getRange(row, c).setValue(s[0]);
      series.getRange(row, c+1).setValue(s[1]);
      series.getRange(row, c+2).setValue(s[2]);
      series.getRange(row, c+3).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList([s[1],s[2]],true).build());
      series.getRange(row, c+4).setDataValidation(
        SpreadsheetApp.newDataValidation().requireValueInList(["4","5","6","7"],true).build());
      series.getRange(row, c+5).insertCheckboxes();
      series.getRange(row, c, 1, 6).setBackground("#1a2535");
    }

    if (ronde.ouest.length > 0) {
      series.getRange(8, c, 1, 6).merge()
        .setValue("OUEST").setFontWeight("bold")
        .setBackground(POOL.COLOR_OUEST).setFontColor(POOL.COLOR_WHITE)
        .setHorizontalAlignment("center");

      for (var i = 0; i < ronde.ouest.length; i++) {
        var row = 9 + i;
        var s = ronde.ouest[i];
        series.getRange(row, c).setValue(s[0]);
        series.getRange(row, c+1).setValue(s[1]);
        series.getRange(row, c+2).setValue(s[2]);
        series.getRange(row, c+3).setDataValidation(
          SpreadsheetApp.newDataValidation().requireValueInList([s[1],s[2]],true).build());
        series.getRange(row, c+4).setDataValidation(
          SpreadsheetApp.newDataValidation().requireValueInList(["4","5","6","7"],true).build());
        series.getRange(row, c+5).insertCheckboxes();
        series.getRange(row, c, 1, 6).setBackground("#1a2535");
      }
    }
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("All rounds structure created!", "✅", 4);
}


