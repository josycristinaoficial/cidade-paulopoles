# Paulopolis - site de cadastro

Site one page estatico para publicar gratuitamente no GitHub Pages. O formulario pode salvar os dados gratuitamente usando Google Apps Script, Google Sheets e Google Drive.

## Arquivos principais

- `index.html`: pagina principal com o formulario.
- `obrigado.html`: pagina exibida depois do envio.
- `admin.html`: painel administrativo para consultar cadastros e baixar comprovantes.
- `config.js`: configuracoes do link de pre-inscricao e endpoint do Google Apps Script.
- `script.js`: envio do formulario.
- `backend/google-apps-script.js`: codigo para receber cadastro, salvar dados na planilha e anexos no Drive.
- `assets/`: imagens do topo e logo.

## Configurar o link de pre-inscricao

No arquivo `config.js`, troque:

```js
preRegistrationUrl: "https://forms.gle/COLOQUE-SEU-LINK-AQUI"
```

pelo link do formulario de pre-inscricao.

## Backend gratuito com Google

1. Crie uma planilha no Google Sheets.
2. Crie uma aba chamada `Cadastros`.
3. Na primeira linha, coloque estes titulos: Data, Nome completo, Passaporte, Telefone, Arquivo, Link do comprovante, Enviado em.
4. Crie uma pasta no Google Drive para receber os comprovantes.
5. Abra `Extensoes > Apps Script` na planilha.
6. Cole o conteudo de `backend/google-apps-script.js`.
7. Troque `SPREADSHEET_ID` pelo ID da planilha e `DRIVE_FOLDER_ID` pelo ID da pasta.
8. Clique em `Implantar > Nova implantacao > App da Web`.
9. Use `Executar como: voce` e `Quem pode acessar: qualquer pessoa`.
10. Copie a URL do app da web.
11. No `script.js`, cole essa URL em:

```js
googleScriptUrl: ""
```

## Painel administrativo

O painel fica em `admin.html`. Ele pede uma senha administrativa e carrega os registros salvos na planilha.

No arquivo `backend/google-apps-script.js`, troque:

```js
ADMIN_TOKEN = "TROQUE_POR_UMA_SENHA_FORTE"
```

por uma senha forte. Essa mesma senha sera digitada no painel `admin.html`.

Para baixar os comprovantes, use o link `Baixar comprovante` na tabela do painel. Para baixar os dados, clique em `Baixar dados CSV`.

Observacao: os arquivos ficam privados no Google Drive. O administrador precisa estar logado na conta dona da pasta para abrir os links.

## Pasta para subir no GitHub

Suba a pasta inteira:

```text
C:\Users\Windows\Documents\Paulópoles
```

Ela deve conter `index.html`, `obrigado.html`, `admin.html`, `config.js`, `script.js`, `styles.css`, `assets/` e `backend/`.

## Publicar gratis no GitHub Pages

1. Suba estes arquivos para um repositorio no GitHub.
2. No repositorio, entre em `Settings > Pages`.
3. Em `Build and deployment`, escolha `Deploy from a branch`.
4. Escolha a branch principal e a pasta `/root`.
5. Salve e aguarde o GitHub gerar o link.

## Observacao importante

O GitHub Pages hospeda o site gratuitamente, mas nao salva formulario nem arquivo sozinho. Por isso o Google Apps Script faz a parte de banco de dados gratuito, usando Sheets para dados e Drive para anexos.
