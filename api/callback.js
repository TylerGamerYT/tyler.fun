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
        Authorization: `token ${accessToken}`,
        'User-Agent': 'tyler-fun-app',
      },
    });

    const user = await userRes.json();

    if (!user || !user.login) {
      console.error('User error:', user);
      return res.redirect('/?error=no_user');
    }

    // 3. Fetch email (optional)
    let primaryEmail = '';
    try {
        const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: `token ${accessToken}`,
                'User-Agent': 'tyler-fun-app',
            },
        });
        const emails = await emailRes.json();
        if (Array.isArray(emails)) {
            const primary = emails.find(e => e.primary);
            primaryEmail = primary?.email || emails[0]?.email || '';
        }
    } catch (e) {
        console.warn('Could not fetch emails:', e);
    }

    // 4. Create session
    const session = {
      id: user.id,
      username: user.login,
      name: user.name || user.login,
      avatar: user.avatar_url,
      email: primaryEmail,
    };

    const sessionData = Buffer.from(JSON.stringify(session)).toString('base64');

    // 5. Set cookie
    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = [
        `tyfun_session=${sessionData}`,
        'Path=/',
        'Max-Age=604800',
        'HttpOnly',
        isProd ? 'Secure' : '',
        'SameSite=Lax'
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    // 6. Redirect logic (Updated with your specific user list and Index.html paths)
    const knownUsers = {
      'tylergameryt': 'Tyler', // Your actual GitHub username
      'tyler': 'Tyler',
      'fish': 'Fish',
      'tawsif': 'tawsif',
      'yoiashley': 'yoiashley',
      'angle': 'angle',
      'aaban': 'Aaban',
      'ban': 'Ban',
      'banned': 'Ban',
    };

    const usernameLower = String(user.login).toLowerCase();
    const profileSegment = knownUsers[usernameLower];

    if (profileSegment) {
      // Redirects to /users/Name/Index.html
      return res.redirect(`/users/${profileSegment}/Index.html`);
    }

    // Default for unknown users
    return res.redirect(`/users/Guest/Index.html?login=success&user=${encodeURIComponent(user.login)}`);

  } catch (err) {
    console.error('Auth error:', err);
    if (!res.writableEnded) {
        return res.redirect('/?error=server_error');
    }
  }
}
