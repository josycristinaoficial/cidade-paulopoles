const SPREADSHEET_ID = "1Z0v0UeX5I8_42pqBcrW-FDptnjJ5Ja5T_tX8fS_yi4M";
const DRIVE_FOLDER_ID = "1o6OjkPklhuVpX4Quw-tykrdYAoKFLch5";
const ADMIN_TOKEN = "030304";

function doPost(event) {
  try {
    const data = parseSubmission(event);
    const folder = getFolder();
    const sheet = getSheet();

    if (!data.fullName || !data.passport || !data.phone || !data.receiptBase64) {
      throw new Error("Dados incompletos no envio.");
    }

    const blob = Utilities.newBlob(
      Utilities.base64Decode(data.receiptBase64),
      data.receiptMimeType,
      data.receiptFileName
    );

    const file = folder.createFile(blob);

    const row = [
      new Date(),
      data.fullName,
      data.passport,
      data.phone,
      data.receiptFileName,
      file.getUrl(),
      data.sentAt,
      data.applicationType || "Pré-inscrição com análise — 3º lote — R$ 250k"
    ];

    const nextRow = Math.max(sheet.getLastRow() + 1, 2);
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();

    if (sheet.getRange(nextRow, 2).getValue() !== data.fullName) {
      throw new Error("O comprovante foi salvo, mas a planilha nao confirmou a gravacao.");
    }

    return jsonResponse({ ok: true, fileUrl: file.getUrl() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function parseSubmission(event) {
  if (event.parameter && event.parameter.payload) {
    return JSON.parse(event.parameter.payload);
  }

  return JSON.parse((event.postData && event.postData.contents) || "{}");
}

function doGet(event) {
  const action = event.parameter.action;
  const token = event.parameter.token;
  const callback = event.parameter.callback;

  if (token !== ADMIN_TOKEN) {
    return jsonpResponse({ ok: false, error: "Senha administrativa invalida." }, callback);
  }

  if (action === "health") {
    return jsonpResponse(getHealth(), callback);
  }

  if (action === "testWrite") {
    return jsonpResponse(createTestRecord(), callback);
  }

  if (action !== "list") {
    return jsonpResponse({ ok: false, error: "Acao invalida." }, callback);
  }

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues().slice(1);

  const records = values
    .filter(function(row) {
      return row[1];
    })
    .map(function(row) {
      return {
        date: formatDate(row[0]),
        fullName: row[1],
        passport: row[2],
        phone: row[3],
        receiptFileName: row[4],
        receiptUrl: row[5],
        sentAt: row[6],
        applicationType: row[7] || "Pré-inscrição com análise — 3º lote — R$ 250k"
      };
    })
    .reverse();

  return jsonpResponse({ ok: true, records: records }, callback);
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName("Cadastros");

  if (!sheet) {
    sheet = spreadsheet.insertSheet("Cadastros");
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Data",
      "Nome completo",
      "Passaporte",
      "Telefone",
      "Arquivo",
      "Link do comprovante",
      "Enviado em",
      "Opção"
    ]);
  }

  if (sheet.getRange(1, 8).getValue() !== "Opção") {
    sheet.getRange(1, 8).setValue("Opção");
  }

  return sheet;
}

function getFolder() {
  return DriveApp.getFolderById(DRIVE_FOLDER_ID);
}

function getHealth() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const folder = getFolder();
  const sheet = getSheet();

  return {
    ok: true,
    spreadsheetName: spreadsheet.getName(),
    folderName: folder.getName(),
    sheetName: sheet.getName(),
    rows: Math.max(sheet.getLastRow() - 1, 0)
  };
}

function createTestRecord() {
  const folder = getFolder();
  const sheet = getSheet();
  const file = folder.createFile(
    "teste-painel-paulopolis.txt",
    "Arquivo de teste criado pelo painel Paulópolis.",
    MimeType.PLAIN_TEXT
  );

  sheet.appendRow([
    new Date(),
    "Teste Paulópolis",
    "TESTE123",
    "(00) 00000-0000",
    file.getName(),
    file.getUrl(),
    new Date().toISOString(),
    "Teste Paulópolis"
  ]);

  return { ok: true, fileUrl: file.getUrl() };
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResponse(payload) {
  const message = JSON.stringify(Object.assign({ source: "paulopolis-form" }, payload));
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body><script>window.parent.postMessage(" +
      message +
      ", '*');</script></body></html>"
  );
}

function jsonpResponse(payload, callback) {
  const safeCallback = String(callback || "callback").replace(/[^a-zA-Z0-9_$]/g, "");
  return ContentService
    .createTextOutput(safeCallback + "(" + JSON.stringify(payload) + ");")
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function formatDate(value) {
  if (!value) return "";
  return Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
}
