const adminForm = document.querySelector("#adminForm");
const adminStatus = document.querySelector("#adminStatus");
const registrationsBody = document.querySelector("#registrationsBody");
const downloadCsvButton = document.querySelector("#downloadCsv");
let currentRecords = [];

if (adminForm) {
  adminForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const token = String(new FormData(adminForm).get("adminToken") || "").trim();
    if (!token) return setAdminStatus("Informe a senha do administrador.", true);
    if (!CONFIG.googleScriptUrl) return setAdminStatus("Configure googleScriptUrl em config.js.", true);

    setAdminStatus("Carregando cadastros...");

    try {
      const response = await loadRegistrations(token);
      if (!response.ok) throw new Error(response.error || "Nao foi possivel carregar.");

      currentRecords = response.records || [];
      renderRecords(currentRecords);
      downloadCsvButton.disabled = currentRecords.length === 0;
      setAdminStatus(`${currentRecords.length} cadastro(s) carregado(s).`);
    } catch (error) {
      renderEmpty(error.message || "Nao foi possivel carregar os cadastros.");
      setAdminStatus(error.message || "Nao foi possivel carregar os cadastros.", true);
    }
  });
}

if (downloadCsvButton) {
  downloadCsvButton.addEventListener("click", () => {
    if (!currentRecords.length) return;
    const csv = toCsv(currentRecords);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cadastros-paulopolis.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}

function loadRegistrations(token) {
  return new Promise((resolve, reject) => {
    const callbackName = `paulopolisAdmin_${Date.now()}`;
    const script = document.createElement("script");
    const url = new URL(CONFIG.googleScriptUrl);

    url.searchParams.set("action", "list");
    url.searchParams.set("token", token);
    url.searchParams.set("callback", callbackName);

    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Falha ao conectar com o painel."));
    };

    function cleanup() {
      delete window[callbackName];
      script.remove();
    }

    script.src = url.toString();
    document.body.appendChild(script);
  });
}

function renderRecords(records) {
  if (!records.length) {
    renderEmpty("Nenhum cadastro recebido ainda.");
    return;
  }

  registrationsBody.innerHTML = records.map((record) => `
    <tr>
      <td>${escapeHtml(record.date)}</td>
      <td>${escapeHtml(record.fullName)}</td>
      <td>${escapeHtml(record.passport)}</td>
      <td>${escapeHtml(record.phone)}</td>
      <td>
        <a href="${escapeAttribute(record.receiptUrl)}" target="_blank" rel="noopener">
          Baixar comprovante
        </a>
      </td>
    </tr>
  `).join("");
}

function renderEmpty(message) {
  registrationsBody.innerHTML = `<tr><td colspan="5">${escapeHtml(message)}</td></tr>`;
}

function setAdminStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle("error", isError);
}

function toCsv(records) {
  const rows = [
    ["Data", "Nome completo", "Passaporte", "Telefone", "Comprovante"]
  ];

  records.forEach((record) => {
    rows.push([
      record.date,
      record.fullName,
      record.passport,
      record.phone,
      record.receiptUrl
    ]);
  });

  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
