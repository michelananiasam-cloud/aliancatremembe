const express = require('express');
const crypto = require('crypto');
const app = express();

const secret = 'chave-secreta';

function generateSignedUrl(filename) {
  const expires = Date.now() + 5 * 60 * 1000;

  const data = `${filename}:${expires}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // ✅ corrigido aqui
  return `/api/image/${filename}?expires=${expires}&signature=${signature}`;
}

// ✅ NOVA ROTA (ESSENCIAL)
app.get('/get-image-link', (req, res) => {
  const url = generateSignedUrl('logo.png');
  res.json({ url });
});

// (essa você já tinha)
app.get('/', (req, res) => {
  const url = generateSignedUrl('logo.png');

  res.send(`
    <h1>Teste</h1>
    <img src="${url}" width="200">
  `);
});

app.get('/api/image/:name', (req, res) => {
  const { expires, signature } = req.query;
  const filename = req.params.name;

  if (Date.now() > expires) {
    return res.status(403).send('Expirado');
  }

  const data = `${filename}:${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Inválido');
  }

  res.sendFile(`./images/${filename}`, { root: process.cwd() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Rodando na porta ${PORT}`);
});
