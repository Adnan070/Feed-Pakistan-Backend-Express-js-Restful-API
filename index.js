const functions = require("firebase-functions");
const express = require("express");
const app = express();
const FBAuth = require("./util/fbAuth");



const cors = require("cors");
app.use(cors());

const { db } = require("./util/admin");

const {
  getAllActivity,
  postOneActivity,
  getActivity,
  deleteActivity,
  updateActivity,
} = require("./handlers/activity");

const {
  signup,
  login,
  addUserDetails,
  getAuthenticatedUser,
  getUserDetails,
  markNotificationsRead,
  uploadImage,
  uploadImageActivity,
} = require("./handlers/users");

const { postOneFeedback, getAllFeeds } = require("./handlers/feedback");

const {
  postDonation,
  getDonation,
  getAllDonations,
  getDonationRecieved,
  getTopDonator,
  postClientDonation,
} = require("./handlers/donation");

const {
  getSizeOfDonations,
  getMonthlyOrderedData,
} = require("./handlers/analytics");

const {
  postHeaderTitle,
  postUpcomingEvent,
  postGallery,
  postLatestNews,
  getHeaderTitle,
  getGallery,
  getLatestNews,
  getUpcommingEvent,
} = require("./handlers/cms");

// Activity routes
app.get("/activities", getAllActivity);
app.post("/activity", FBAuth, postOneActivity);
app.get("/activity/:activityId", getActivity);
app.delete("/activity/:activityId", FBAuth, deleteActivity);
app.post("/activity/image/:docId", FBAuth, uploadImageActivity);
app.post("/activity/:activityId", FBAuth, updateActivity);

//Feedback routes
app.post("/feed", postOneFeedback);
app.get("/feed", getAllFeeds);

// Food Donation
app.get("/donation", FBAuth, getDonation);
app.post("/donation", FBAuth, postDonation);
app.post('/donation/client',postClientDonation)
app.post("/donation/:donationId", FBAuth, getDonationRecieved);
app.get("/donations", FBAuth, getAllDonations);
app.get("/donators", getTopDonator);
//Analytics
app.get("/analytics/food",FBAuth, getSizeOfDonations);
app.get("/analytics/food/monthlydata",FBAuth, getMonthlyOrderedData);

// Responce Chat

// CMS Management
app.post("/cms/header",FBAuth, postHeaderTitle);
app.post("/cms/event",FBAuth, postUpcomingEvent);
app.post("/cms/gallery",FBAuth, postGallery);
app.post("/cms/news",FBAuth, postLatestNews);
app.get("/cms/header", getHeaderTitle);
app.get("/cms/gallery", getGallery);
app.get("/cms/news", getLatestNews);
app.get("/cms/event", getUpcommingEvent);
// users routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west1").https.onRequest(app);

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdate((change) => {
    console.log(change.before.data());
    console.log(change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("image has changed");
      const batch = db.batch();
      return db
        .collection("food")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            console.log("Inn");
            const donation = db.doc(`/food/${doc.id}`);
            console.log(donation);
            batch.update(donation, { imageUrl: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });
