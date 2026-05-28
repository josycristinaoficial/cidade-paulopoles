const SPREADSHEET_ID = "COLOQUE_O_ID_DA_PLANILHA_AQUI";
const DRIVE_FOLDER_ID = "COLOQUE_O_ID_DA_PASTA_DO_DRIVE_AQUI";
const ADMIN_TOKEN = "TROQUE_POR_UMA_SENHA_FORTE";

function doPost(event) {
  try {
    const data = JSON.parse(event.postData.contents);
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Cadastros");

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

  if (action !== "list") {
    return jsonpResponse({ ok: false, error: "Acao invalida." }, callback);
  }

  if (token !== ADMIN_TOKEN) {
    return jsonpResponse({ ok: false, error: "Senha administrativa invalida." }, callback);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Cadastros");
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
