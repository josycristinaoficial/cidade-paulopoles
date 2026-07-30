const form = document.querySelector("#registrationForm");
const statusEl = document.querySelector("#formStatus");
const preRegistrationLink = document.querySelector("#preRegistrationLink");
const thanksTitle = document.querySelector("#thanksTitle");
const thanksMessage = document.querySelector("#thanksMessage");

if (preRegistrationLink) {
  preRegistrationLink.href = CONFIG.preRegistrationUrl;
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Enviando cadastro...");

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;

    try {
      const data = new FormData(form);
      const receipt = data.get("receipt");

      if (!receipt || receipt.size === 0) {
        throw new Error("Anexe o comprovante de pagamento.");
      }

      if (receipt.size > CONFIG.maxFileSizeMb * 1024 * 1024) {
        throw new Error(`O comprovante deve ter até ${CONFIG.maxFileSizeMb} MB.`);
      }

      const payload = {
        fullName: String(data.get("fullName") || "").trim(),
        passport: String(data.get("passport") || "").trim(),
        phone: String(data.get("phone") || "").trim(),
        applicationType: String(data.get("applicationType") || "Pré-inscrição com análise — 4º lote — R$ 300k").trim(),
        receiptFileName: receipt.name,
        receiptMimeType: receipt.type || "application/octet-stream",
        receiptBase64: await fileToBase64(receipt),
        sentAt: new Date().toISOString()
      };

      if (!payload.fullName || !payload.passport || !payload.phone) {
        throw new Error("Preencha todos os campos obrigatórios.");
      }

      if (!CONFIG.googleScriptUrl) {
        throw new Error("O envio ainda não está conectado ao Google Sheets.");
      }

      await submitPayload(payload);

      sessionStorage.setItem("paulopolis:lastSubmission", payload.fullName);
      sessionStorage.setItem("paulopolis:lastApplicationType", payload.applicationType);
      window.location.href = "obrigado.html";
    } catch (error) {
      setStatus(error.message || "Não foi possível enviar. Tente novamente.", true);
      submitButton.disabled = false;
    }
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo anexado."));
    reader.readAsDataURL(file);
  });
}

function submitPayload(payload) {
  return fetch(CONFIG.googleScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  }).then(async (response) => {
    const result = parseServerResponse(await response.text());

    if (!result.ok) {
      throw new Error(result.error || "Não foi possível salvar o cadastro.");
    }

    return result;
  });
}

function parseServerResponse(text) {
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    throw new Error("O servidor não retornou confirmação do cadastro.");
  }

  try {
    return JSON.parse(cleanText);
  } catch (jsonError) {
    const jsonpMatch = cleanText.match(/^[a-zA-Z0-9_$]+\(([\s\S]*)\);?$/);

    if (jsonpMatch) {
      return JSON.parse(jsonpMatch[1]);
    }

    throw jsonError;
  }
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}
