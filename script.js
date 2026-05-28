const form = document.querySelector("#registrationForm");
const statusEl = document.querySelector("#formStatus");
const preRegistrationLink = document.querySelector("#preRegistrationLink");

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
  return new Promise((resolve) => {
    const frameName = `paulopolisSubmit_${Date.now()}`;
    const iframe = document.createElement("iframe");
    const relayForm = document.createElement("form");
    const payloadInput = document.createElement("textarea");
    let submitted = false;

    iframe.name = frameName;
    iframe.hidden = true;

    payloadInput.name = "payload";
    payloadInput.value = JSON.stringify(payload);

    relayForm.method = "POST";
    relayForm.action = CONFIG.googleScriptUrl;
    relayForm.target = frameName;
    relayForm.enctype = "application/x-www-form-urlencoded";
    relayForm.style.display = "none";
    relayForm.appendChild(payloadInput);

    const cleanup = () => {
      relayForm.remove();
      iframe.remove();
      resolve();
    };

    iframe.addEventListener("load", () => {
      if (submitted) cleanup();
    });

    document.body.appendChild(iframe);
    document.body.appendChild(relayForm);
    submitted = true;
    relayForm.submit();
    window.setTimeout(cleanup, 6000);
  });
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}
