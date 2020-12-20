const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    console.error("No token found");
    return res.status(403).json({ error: "Unauthorized" });
  }
  let claim;
  admin
    .auth()
    .verifyIdToken(idToken, true)
    .then((claims) => {
      // Get the user's previous IP addresses, previously saved.
      claim = claims;
      return getPreviousUserIpAddresses(claims.sub);
    })
    .then((previousIpAddresses) => {
      // Get the request IP address.
      const requestIpAddress = req.connection.remoteAddress;
      // Check if the request IP address origin is suspicious relative to previous
      // IP addresses. The current request timestamp and the auth_time of the ID
      // token can provide additional signals of abuse especially if the IP address
      // suddenly changed. If there was a sudden location change in a
      // short period of time, then it will give stronger signals of possible abuse.
      if (!isValidIpAddress(previousIpAddresses, requestIpAddress)) {
        // Invalid IP address, take action quickly and revoke all user's refresh tokens.
        revokeUserTokens(claims.uid).then(
          () => {
            res
              .status(401)
              .send({ error: "Unauthorized access. Please login again!" });
          },
          (error) => {
            res
              .status(401)
              .send({ error: "Unauthorized access. Please login again!" });
          }
        );
      } else {
        req.user = claim;
         db
          .collection("users")
          .where("userId", "==", req.user.uid)
          .limit(1)
          .get()
          .then((data) => {
            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
          })
          .catch((err) => {
            console.error("Error while verifying token ", err);
            return res.status(403).json(err);
          });
      }
    })
    
};
