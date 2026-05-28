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
        throw new Error(`O comprovante deve ter ate ${CONFIG.maxFileSizeMb} MB.`);
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
        throw new Error("Preencha todos os campos obrigatorios.");
      }

      if (CONFIG.googleScriptUrl) {
        await fetch(CONFIG.googleScriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=utf-8"
          },
          body: JSON.stringify(payload)
        });
      } else {
        console.warn("Configure CONFIG.googleScriptUrl para salvar cadastros no Google Sheets.");
      }

      sessionStorage.setItem("paulopolis:lastSubmission", payload.fullName);
      window.location.href = "obrigado.html";
    } catch (error) {
      setStatus(error.message || "Nao foi possivel enviar. Tente novamente.", true);
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
    reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo anexado."));
    reader.readAsDataURL(file);
  });
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}
