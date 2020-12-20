const { db } = require("../util/admin");

exports.postDonation = (req, res) => {
  // if (req.body.email.trim() === '') {
  //     return res.status(400).json({ desc: 'Description must not be empty' });
  // }
  // if(req.body.title.trim() === ''){
  //     return res.status(400).json({ desc: 'Description must not be empty' });
  // }
  // if(req.body.name.trim() === '' ){
  //     return res.status(400).json({ desc: 'Description must not be empty' });
  // }
  // if(req.body.message.trim() === ''){
  //     return res.status(400).json({ desc: 'Description must not be empty' });
  // }

  let newDonation = {};

  const concernPerson = req.body.concernPerson;
  const foodDetail = req.body.foodDetail;
  if (
    concernPerson !== null ||
    concernPerson !== undefined ||
    foodDetail !== null ||
    foodDetail !== undefined
  ) {
    console.log(req.user);
    db.doc(`/users/${req.user.handle}`)
      .get()
      .then((data) => {
        return {
          orgName: data.data().orgName,
          orgEmail: data.data().orgEmail,
          orgWeb: data.data().orgWeb,
          orgPh: data.data().orgPh,
          orgType: data.data().orgType,
          orgLoc: data.data().orgLoc,
          imageUrl: data.data().imageUrl,
        };
      })
      .then((orgData) => {
        newDonation = {
          userHandle: req.user.handle,
          cpName: concernPerson.name,
          cpEmail: concernPerson.email,
          cpPhoneNo: concernPerson.phoneNumber,
          cpCNIC: concernPerson.cnic,
          fdDesc: foodDetail.desc,
          foodItems: foodDetail.foodItems,
          area: foodDetail.nearestArea,
          pickUpLoc: foodDetail.pickUpLoc,
          donationTime: new Date().toISOString(),
          isRecieved: false,
          type:'user',
          ...orgData,
        };
        db.collection("food")
          .add(newDonation)
          .then((doc) => {
            res.json({ message: "Thanks for Donation!" });
          })
          .catch((err) => {
            res.status(500).json({ error: "Something went wrong" });
            console.error(err);
          });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({
          message: "User data is not Found Please contact with organization!",
        });
      });
  }
  else{
    
  }
};

exports.postClientDonation = (req, res) => {
  let userData={
    cpName:req.body.cpName,
    cpEmail:req.body.cpEmail,
    cpCNIC:req.body.cpCNIC,
    cpPhoneNo:req.body.cpPhoneNo,
    cpName:req.body.cpName,
    fdItems:req.body.fdItems,
    fdDesc:req.body.fdDesc,
    area:req.body.area,
    pickUpLoc:req.body.pickUpLoc,
    donationTime: new Date().toISOString(),
    type:'client',
    isRecieved:false
  }
  db.collection("food")
    .add(userData)
    .then((doc) => {
      res.json({message:'Thanks For Donation'})
    })
    .catch((err) => {
      res.status(500).json({ error: "Something went wrong" });
      console.error(err);
    });
};

exports.getDonation = (req, res) => {
  db.collection("food")
    .orderBy("donationTime", "desc")
    .where("userHandle", "==", req.user.handle)
    .get()
    .then((data) => {
      let donation = [];
      data.forEach((doc) => {
        donation.push(doc.data());
      });
      return res.json(donation);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.getAllDonations = (req, res) => {
  db.collection("food")
    .orderBy("donationTime", "desc")
    .get()
    .then((data) => {
      let donation = [];
      data.forEach((doc) => {
        console.log(doc.data())
        donation.push({ donationId: doc.id, data: doc.data() });
      });
      return res.json(donation);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.getDonationRecieved = (req, res) => {
  const document = db.doc(`/food/${req.params.donationId}`);
  document
    .update({ isRecieved: req.body.isRecieved })
    .then(() => {
      return res.status(201).json({
        message: req.body.isRecieved
          ? "Donation Successfully Recieved!"
          : "Donation is in Pending!",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

function dynamicsort(property, order) {
  var sort_order = 1;
  if (order === "desc") {
    sort_order = -1;
  }
  return function (a, b) {
    // a should come before b in the sorted order
    if (a[property] < b[property]) {
      return -1 * sort_order;
      // a should come after b in the sorted order
    } else if (a[property] > b[property]) {
      return 1 * sort_order;
      // a and b are the same
    } else {
      return 0 * sort_order;
    }
  };
}

exports.getTopDonator = (req, res) => {
  db.collection("food")
    .get()
    .then((data) => {
      let donation = [];
      data.forEach((doc) => {
        donation.push(doc.data());
      });
      const groupBy = (key) => (array) =>
        array.reduce((objectsByKeyValue, obj) => {
          const value = obj[key];
          objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(
            obj
          );
          return objectsByKeyValue;
        }, {});

      const groupByArea = groupBy("userHandle");
      let groups = groupByArea(donation);
      let topDonator = [];
      let donator = {};
      for (let key in groups) {
        donator = {};
        donator[key] = groups[key][0];
        donator["length"] = groups[key].length;
        topDonator.push(donator);
      }
      console.log(topDonator);
      topDonator = topDonator.sort(dynamicsort("length", "desc"));
      res.json(topDonator.slice(0, 4));
    })
    .catch((err) => {
      console.log(err);
    });
};
