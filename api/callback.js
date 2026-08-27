/* ============================================================
   VERCEL SERVERLESS FUNCTION — OAuth Callback (Passo 2/2)
   
   Recebe o código de autorização do GitHub, troca por um
   access token, e envia o token de volta para o Decap CMS
   via window.opener.postMessage().
   
   Endpoint: GET /api/callback?code=XXXX
   
   Variáveis de ambiente necessárias na Vercel:
   - OAUTH_GITHUB_CLIENT_ID: Client ID do GitHub OAuth App
   - OAUTH_GITHUB_CLIENT_SECRET: Client Secret do GitHub OAuth App
   ============================================================ */

export default async function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;

  // Valida variáveis de ambiente
  if (!clientId || !clientSecret) {
    return res.status(500).send(renderErrorPage(
      'Variáveis OAUTH_GITHUB_CLIENT_ID e/ou OAUTH_GITHUB_CLIENT_SECRET não configuradas.'
    ));
  }

  // Obtém o código de autorização da query string
  const { code } = req.query;

  if (!code) {
    return res.status(400).send(renderErrorPage(
      'Código de autorização não recebido do GitHub.'
    ));
  }

  try {
    // Troca o código por um access token via GitHub API
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Verifica se o GitHub retornou um token válido
    if (tokenData.error) {
      return res.status(401).send(renderErrorPage(
        `Erro do GitHub: ${tokenData.error_description || tokenData.error}`
      ));
    }

    // Envia o token de volta para o Decap CMS via postMessage
    // O CMS escuta essa mensagem na janela pai (opener)
    const responseHtml = renderSuccessPage(tokenData.access_token);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(responseHtml);

  } catch (error) {
    console.error('[OAuth Callback] Erro ao trocar código por token:', error);
    return res.status(500).send(renderErrorPage(
      'Erro interno ao processar a autenticação. Tente novamente.'
    ));
  }
}


/**
 * Renderiza a página HTML que envia o token para o Decap CMS
 * via window.opener.postMessage(). Após o envio, a popup fecha.
 * 
 * O Decap CMS espera receber uma mensagem no formato:
 * { token: "gho_xxxx", provider: "github" }
 * 
 * @param {string} token - Access token do GitHub
 * @returns {string} HTML da página
 */
function renderSuccessPage(token) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Autenticação concluída</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: #f0f4e8; color: #1a1a2e;
    }
    .container {
      text-align: center; padding: 2rem;
      background: white; border-radius: 1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem; }
    p { font-size: 0.875rem; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">✅</div>
    <h1>Login realizado com sucesso!</h1>
    <p>Esta janela será fechada automaticamente...</p>
  </div>
  <script>
    (function() {
      // Envia o token para a janela do Decap CMS (opener)
      var token = "${token}";
      var provider = "github";

      if (window.opener) {
        window.opener.postMessage(
          "authorization:github:success:" + JSON.stringify({ token: token, provider: provider }),
          window.location.origin
        );
      }

      // Fecha a popup após um pequeno delay
      setTimeout(function() { window.close(); }, 1500);
    })();
  </script>
</body>
</html>`;
}


/**
 * Renderiza uma página de erro amigável.
 * @param {string} message - Mensagem de erro
 * @returns {string} HTML da página de erro
 */
function renderErrorPage(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Erro de Autenticação</title>
  <style>
    body {
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; margin: 0;
      background: #fef2f2; color: #1a1a2e;
    }
    .container {
      text-align: center; padding: 2rem;
      background: white; border-radius: 1rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 450px;
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.5rem; color: #dc2626; }
    p { font-size: 0.875rem; color: #6b7280; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">❌</div>
    <h1>Erro na Autenticação</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
