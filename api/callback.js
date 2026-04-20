export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect('/?error=no_code');
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token error:', tokenData);
      return res.redirect('/?error=no_token');
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user data
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'tyler-fun-app',
      },
    });

    const user = await userRes.json();

    if (!user || !user.login) {
      console.error('User error:', user);
      return res.redirect('/?error=no_user');
    }

    // 3. Fetch email (optional but useful)
    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'tyler-fun-app',
      },
    });

    const emails = await emailRes.json();

    let primaryEmail = '';
    if (Array.isArray(emails)) {
      const primary = emails.find(e => e.primary);
      primaryEmail = primary?.email || emails[0]?.email || '';
    }

    // 4. Create session (simple base64 for now)
    const session = {
      id: user.id,
      username: user.login,
      name: user.name || user.login,
      avatar: user.avatar_url,
      email: primaryEmail,
    };

    const sessionData = Buffer.from(JSON.stringify(session)).toString('base64');

    // 5. Set cookie (THIS PART MATTERS ON VERCEL)
    res.setHeader('Set-Cookie', [
      `tyfun_session=${sessionData}; Path=/; Max-Age=604800; HttpOnly; Secure; SameSite=Lax`
    ]);

    // 6. Redirect to user page (better UX)
    return res.redirect(`/users/${user.login}`);

  } catch (err) {
    console.error('Auth error:', err);
    return res.redirect('/?error=server_error');
  }
}
