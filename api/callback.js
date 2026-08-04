// import prisma from "./prisma.js";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.redirect("/?error=no_code");
  }

  try {
    console.log("STEP 1: Starting GitHub token exchange");

    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      return res.redirect("/?error=no_token");
    }

    const accessToken = tokenData.access_token;

    console.log("STEP 2: Got token, fetching user");

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        "User-Agent": "tyler-fun-app",
      },
    });

    const user = await userRes.json();

    console.log("STEP 2 USER:", user.login);

    if (!user || !user.login) {
      console.error("User error:", user);
      return res.redirect("/?error=no_user");
    }

    console.log("STEP 3: Fetching email");

    let primaryEmail = "";

    try {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `token ${accessToken}`,
          "User-Agent": "tyler-fun-app",
        },
      });

      const emails = await emailRes.json();

      if (Array.isArray(emails)) {
        const primary = emails.find((e) => e.primary);
        primaryEmail = primary?.email || emails[0]?.email || "";
      }
    } catch (e) {
      console.warn("Could not fetch emails:", e);
    }

    console.log("STEP 4: Skipping database");

    console.log("STEP 5: Creating session");

    const session = {
      id: user.id,
      username: user.login,
      name: user.name || user.login,
      avatar: user.avatar_url,
      email: primaryEmail,
    };

    const sessionData = Buffer.from(JSON.stringify(session)).toString("base64");

    console.log("STEP 6: Setting cookie");

    res.setHeader(
      "Set-Cookie",
      [
        `tyfun_session=${sessionData}`,
        "Path=/",
        "Max-Age=604800",
        "HttpOnly",
        process.env.NODE_ENV === "production" ? "Secure" : "",
        "SameSite=Lax",
      ]
        .filter(Boolean)
        .join("; "),
    );

    console.log("STEP 7: Redirecting");

    const knownUsers = {
      tylergameryt: "Tyler",
      tyler: "Tyler",
      fish: "Fish",
      tawsif: "tawsif",
      yoiashley: "yoiashley",
      angle: "angle",
      aaban: "Aaban",
      ban: "Ban",
      banned: "Ban",
    };

    const usernameLower = String(user.login).toLowerCase();
    const profileSegment = knownUsers[usernameLower];

    if (profileSegment) {
      return res.redirect(`/users/${profileSegment}/Index.html`);
    }

    return res.redirect(
      `/users/Guest/Index.html?login=success&user=${encodeURIComponent(user.login)}`,
    );
  } catch (err) {
    console.error("AUTH ERROR FULL:", err);
    throw err;
  }
}
