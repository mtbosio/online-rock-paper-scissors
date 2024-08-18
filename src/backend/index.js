const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const session = require("express-session");
const cors = require("cors");

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_AUTH_CLIENT_ID);

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // your frontend origin
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_AUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    req.session.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };

    res.status(200).send({ success: true, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(401).send({ success: false, message: "Authentication failed" });
  }
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.status(200).send({ success: true });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
