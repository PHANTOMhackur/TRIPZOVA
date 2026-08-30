const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },

        async (accessToken, refreshToken, profile, done) => {

            try {

                const email =
                    profile.emails &&
                    profile.emails[0]
                        ? profile.emails[0].value.toLowerCase()
                        : null;

                if (!email) {
                    return done(
                        new Error("Google account has no email address")
                    );
                }

                const existingUser =
                    await User.findOne({ email });

                /*
                 * Existing TRIPZOVA account
                 */
                if (existingUser) {
                    return done(null, existingUser);
                }

                /*
                 * New Google account
                 *
                 * Do NOT create the user yet.
                 * We need the user to choose
                 * Traveller or Partner first.
                 */
                return done(null, {
                    isNewGoogleUser: true,

                    googleId: profile.id,

                    email,

                    firstName:
                        profile.name?.givenName || "",

                    lastName:
                        profile.name?.familyName || ""
                });

            } catch (error) {

                return done(error);
            }
        }
    )
);

module.exports = passport;