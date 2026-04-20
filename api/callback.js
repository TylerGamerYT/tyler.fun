export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.redirect('/?error=no_code');
    }

    try {
        // Exchange code for access token
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            return res.redirect('/?error=' + tokenData.error);
        }

        const accessToken = tokenData.access_token;

        // Get user profile from GitHub
        const userRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'User-Agent': 'tyler.fun',
            },
        });

        const user = await userRes.json();

        // Get user email (may be private)
        const emailRes = await fetch('https://api.github.com/user/emails', {
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'User-Agent': 'tyler.fun',
            },
        });

        const emails = await emailRes.json();
        const primaryEmail = Array.isArray(emails)
            ? emails.find(e => e.primary)?.email || ''
            : '';

        // Build a simple session cookie (base64 encoded user info)
        // In production you'd use a proper JWT or session store
        const sessionData = Buffer.from(JSON.stringify({
            id: user.id,
            username: user.login,
            name: user.name || user.login,
            avatar: user.avatar_url,
            email: primaryEmail,
        })).toString('base64');

        // Set cookie and redirect to home
        res.setHeader('Set-Cookie', `tyfun_session=${sessionData}; Path=/; Max-Age=604800; SameSite=Lax`);
        return res.redirect('/');

    } catch (err) {
        console.error('Auth error:', err);
        return res.redirect('/?error=server_error');
    }
}
