# Paulópolis - site de cadastro

Site one page estático para publicar gratuitamente no GitHub Pages. O formulário pode salvar os dados gratuitamente usando Google Apps Script, Google Sheets e Google Drive.

## Arquivos principais

- `index.html`: página principal com o formulário.
- `obrigado.html`: página exibida depois do envio.
- `admin.html`: painel administrativo para consultar cadastros e baixar comprovantes.
- `config.js`: configurações do link de pré-inscrição e endpoint do Google Apps Script.
- `script.js`: envio do formulário.
- `backend/google-apps-script.js`: código para receber cadastro, salvar dados na planilha e anexos no Drive.
- `assets/`: imagens do topo.

## Configurar o link de pré-inscrição

No arquivo `config.js`, troque:

```js
preRegistrationUrl: "https://forms.gle/COLOQUE-SEU-LINK-AQUI"
```

pelo link do formulário de pré-inscrição.

## Backend gratuito com Google

1. Crie uma planilha no Google Sheets.
2. Crie uma aba chamada `Cadastros`.
3. Na primeira linha, coloque estes títulos: Data, Nome completo, Passaporte, Telefone, Arquivo, Link do comprovante, Enviado em.
4. Crie uma pasta no Google Drive para receber os comprovantes.
5. Abra `Extensões > Apps Script` na planilha.
6. Cole o conteúdo de `backend/google-apps-script.js`.
7. Troque `SPREADSHEET_ID` pelo ID da planilha e `DRIVE_FOLDER_ID` pelo ID da pasta.
8. Clique em `Implantar > Nova implantação > App da Web`.
9. Use `Executar como: você` e `Quem pode acessar: qualquer pessoa`.
10. Copie a URL do app da web.
11. No `config.js`, cole essa URL em:

```js
googleScriptUrl: ""
```

## Painel administrativo

O painel fica em `admin.html`. Ele pede uma senha administrativa e carrega os registros salvos na planilha.

O codigo do Apps Script nao deve ser publicado no GitHub. A senha administrativa fica protegida no Apps Script por hash.

Para baixar os comprovantes, use o link `Baixar comprovante` na tabela do painel. Para baixar os dados, clique em `Baixar dados CSV`.

Observação: os arquivos ficam privados no Google Drive. O administrador precisa estar logado na conta dona da pasta para abrir os links.

## Pasta para subir no GitHub

Suba os arquivos de dentro desta pasta:

```text
C:\Users\Windows\Documents\Paulópolis
```

O `index.html` precisa ficar na raiz do repositório, não dentro de uma pasta extra.

## Publicar grátis no GitHub Pages

1. Suba estes arquivos para um repositório no GitHub.
2. No repositório, entre em `Settings > Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Escolha a branch principal e a pasta `/root` ou `/ (raiz)`.
5. Salve e aguarde o GitHub gerar o link.

## Observação importante

O GitHub Pages hospeda o site gratuitamente, mas não salva formulário nem arquivo sozinho. Por isso o Google Apps Script faz a parte de banco de dados gratuito, usando Sheets para dados e Drive para anexos.
