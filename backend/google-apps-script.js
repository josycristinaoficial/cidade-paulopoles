const SPREADSHEET_ID = "1Z0v0UeX5I8_42pqBcrW-FDptnjJ5Ja5T_tX8fS_yi4M";
const DRIVE_FOLDER_ID = "1o6OjkPklhuVpX4Quw-tykrdYAoKFLch5";
const ADMIN_TOKEN = "030304";

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents || "{}");
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
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);

    sheet.appendRow([
      new Date(),
      data.fullName,
      data.passport,
      data.phone,
      data.receiptFileName,
      file.getUrl(),
      data.sentAt
    ]);

    return jsonResponse({ ok: true, fileUrl: file.getUrl() });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
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
        sentAt: row[6]
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
      "Enviado em"
    ]);
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
    "Arquivo de teste criado pelo painel Paulopolis.",
    MimeType.PLAIN_TEXT
  );

  sheet.appendRow([
    new Date(),
    "Teste Paulopolis",
    "TESTE123",
    "(00) 00000-0000",
    file.getName(),
    file.getUrl(),
    new Date().toISOString()
  ]);

  return { ok: true, fileUrl: file.getUrl() };
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
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
