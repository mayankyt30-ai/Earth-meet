const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const response = await fetch('http://localhost:6001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
    });
    console.log('status', response.status);
    const text = await response.text();
    console.log('body', text);
  } catch (err) {
    console.error('err', err);
  }
})();
