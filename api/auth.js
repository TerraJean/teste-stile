/* ============================================================
   VERCEL SERVERLESS FUNCTION — OAuth Redirect (Passo 1/2)
   
   Inicia o fluxo OAuth redirecionando o usuário para a
   tela de autorização do GitHub.
   
   Endpoint: GET /api/auth
   
   Variáveis de ambiente necessárias na Vercel:
   - OAUTH_GITHUB_CLIENT_ID: Client ID do GitHub OAuth App
   ============================================================ */

export default function handler(req, res) {
  const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({
      error: 'OAUTH_GITHUB_CLIENT_ID não configurado nas variáveis de ambiente da Vercel.'
    });
  }

  // Monta a URL de autorização do GitHub
  // scope=repo permite que o CMS faça commits no repositório
  const params = new URLSearchParams({
    client_id: clientId,
    scope: 'repo,user',
    // O GitHub redirecionará para /api/callback após a autorização
    redirect_uri: `${getBaseUrl(req)}/api/callback`,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  // Redireciona o navegador para o GitHub
  res.redirect(302, githubAuthUrl);
}

/**
 * Obtém a URL base do site a partir dos headers da request.
 * Funciona tanto em desenvolvimento local quanto em produção na Vercel.
 * @param {Object} req - Request object da Vercel
 * @returns {string} URL base (ex: "https://teste-stile.vercel.app")
 */
function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
