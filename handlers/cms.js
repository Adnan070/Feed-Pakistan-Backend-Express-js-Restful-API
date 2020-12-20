const { admin, db } = require("../util/admin");

var http = require("http"),
  inspect = require("util").inspect;

const config = require("../util/config");
const { uuid } = require("uuidv4");
const { resolveTxt } = require("dns");
const { ref } = require("firebase-functions/lib/providers/database");

exports.postHeaderTitle = async (req, res) => {
  let data = [];
  let id = null;
  await db
    .collection("header")
    .get()
    .then((doc) => {
      doc.forEach((d) => {
        data.push(d.data());
        id = d.id;
      });
      if (data.length > 0) {
        let doc = db.doc("/header/" + id);
        return doc.delete();
      }
    })
    .then(() => {
      if (data.length > 0) {
        let bucket = admin.storage().bucket();
        let file = bucket.file(data[0].imageName);
        return file.delete();
      }
      else return data;
    })
    .then((data) => {
      let header = {};
      const BusBoy = require("busboy");
      const path = require("path");
      const os = require("os");
      const fs = require("fs");

      const busboy = new BusBoy({ headers: req.headers });

      let imageToBeUploaded = null;
      let imageFileName;
      // String for image token
      let generatedToken = uuid();

      busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, file, filename, encoding, mimetype);
        if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
          return res.status(400).json({ error: "Wrong file type submitted" });
        }
        // my.image.png => ['my', 'image', 'png']
        const imageExtension = filename.split(".")[
          filename.split(".").length - 1
        ];
        // 32756238461724837.png
        imageFileName = `${Math.round(
          Math.random() * 1000000000000
        ).toString()}.${imageExtension}`;
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };
        file.pipe(fs.createWriteStream(filepath));
      });
      busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
        console.log("Field [" + fieldname + "]: value: " + inspect(val));
        header[fieldname] = inspect(val).slice(1, -1);
      });
      busboy.on("finish", () => {
        admin
          .storage()
          .bucket()
          .upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
              metadata: {
                contentType: imageToBeUploaded.mimetype,
                //Generate token to be appended to imageUrl
                firebaseStorageDownloadTokens: generatedToken,
              },
            },
          })
          .then(() => {
            // Append token to url
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
            if (
              header.header &&
              header.desc &&
              Object.keys(header).length === 2
            ) {
              header["imgUrl"] = imageUrl;
              header["imageName"] = imageFileName;
              return db.collection("header").add(header);
            } else {
              return res.status(501).json({
                message: "Some Internal Issue Plz contact with developer!",
              });
            }
          })
          .then((doc) => {
            return res.json({ message: "Data uploaded successfully" });
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: "something went wrong" });
          });
      });
      busboy.end(req.rawBody);
    })
    .catch((err) => {
      console.log(err)
      res.status(500).json({ message: "Please Contact with Developer" });
    });
};

exports.postLatestNews = (req, res) => {
  let header = {};
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = null;
  let imageFileName;
  // String for image token
  let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
    console.log("Field [" + fieldname + "]: value: " + inspect(val));
    header[fieldname] = inspect(val).slice(1, -1);
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        if (
          header.newsTitle &&
          header.desc &&
          Object.keys(header).length === 2
        ) {
          header["imgUrl"] = imageUrl;
          header["postAt"] = new Date().toISOString();
          return db.collection("news").add(header);
        } else {
          return res.status(501).json({
            message: "Some Internal Issue Plz contact with developer!",
          });
        }
      })
      .then((doc) => {
        return res.json({ message: "Data uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

exports.postUpcomingEvent = (req, res) => {
  let event = {};
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = null;
  let imageFileName;
  // String for image token
  let generatedToken = uuid();

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("field", (fieldname, val, fieldnameTruncated, valTruncated) => {
    console.log("Field [" + fieldname + "]: value: " + inspect(val));
    event[fieldname] = inspect(val).slice(1, -1);
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
            //Generate token to be appended to imageUrl
            firebaseStorageDownloadTokens: generatedToken,
          },
        },
      })
      .then(() => {
        // Append token to url
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media&token=${generatedToken}`;
        if (
          event.header &&
          event.desc &&
          event.date &&
          Object.keys(event).length === 3
        ) {
          event["imgUrl"] = imageUrl;
          return db.collection("event").add(event);
        } else {
          return res.status(501).json({
            message: "Some Internal Issue Plz contact with developer!",
          });
        }
      })
      .then((doc) => {
        return res.json({ message: "Data uploaded successfully" });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};

deleteImage = (imageName) => {
  console.log("Image Delete: ", imageName);
  let bucket = admin.storage().bucket();
  let file = bucket.file(imageName);
  return file.delete();
};

deleteGalleryImages = async () => {
  let imagesName = [];
  await db
    .collection("gallery")
    .get()
    .then((data) => {
      let gallery = {};
      let id = null;
      data.forEach((doc) => {
        gallery = doc.data();
        id = doc.id;
      });

      for (const key in gallery) {
        if (gallery.hasOwnProperty(key)) {
          const element = gallery[key];
          if (
            key == "name0" ||
            key == "name1" ||
            key == "name2" ||
            key == "name3" ||
            key == "name4" ||
            key == "name5"
          ) {
            deleteImage(element);
          }
        }
      }
      return db.doc("/gallery/" + id).delete();
    })
    .catch((err) => {
      console.log(err);
    });
};
exports.postGallery = (req, res) => {
  deleteGalleryImages();
  try {
    const BusBoy = require("busboy");
    const path = require("path");
    const os = require("os");
    const fs = require("fs");
    let imageUrlArray = [];
    let gallery = {};
    const busboy = new BusBoy({
      headers: req.headers,
      limits: {
        fileSize: 11 * 1024 * 1024,
      },
    });
    let imageToBeUploadedArray = [];
    let imageFileNameArray = [];
    let generatedTokenArray = [uuid(), uuid(), uuid(), uuid(), uuid(), uuid()];
    let imageToBeUploaded = null;
    let imageFileName;
    // String for image token

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(fieldname, file, filename, encoding, mimetype);
      if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
        return res.status(400).json({ error: "Wrong file type submitted" });
      }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.split(".")[
        filename.split(".").length - 1
      ];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      imageFileNameArray.push(imageFileName);
      imageToBeUploadedArray.push(imageToBeUploaded);
      file.pipe(fs.createWriteStream(filepath));
      file.on("limit", function () {
        fs.unlink(filepath, function () {
          console.log("workinng");
          return res.status(500).json({ message: "File Limit Exeeded!" });
        });
      });
    });
    busboy.on("partsLimit", () => {
      console.log("Working err");
      return res.status(500).json({ message: "File Limit Exeeded!" });
    });
    busboy.on("filesLimit", () => {
      console.log("Working Files limit");
      return res.status(500).json({ message: "File Limit Exeeded!" });
    });
    busboy.on("finish", async () => {
      for (let i = 0; i < imageToBeUploadedArray.length; i++) {
        await admin
          .storage()
          .bucket()
          .upload(imageToBeUploadedArray[i].filepath, {
            resumable: false,
            metadata: {
              metadata: {
                contentType: imageToBeUploadedArray[i].mimetype,
                //Generate token to be appended to imageUrl
                firebaseStorageDownloadTokens: generatedTokenArray[i],
              },
            },
          })
          .then(() => {
            // Append token to url
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileNameArray[i]}?alt=media&token=${generatedTokenArray[i]}`;
            gallery[i] = imageUrl;
            gallery[`name${i}`] = imageFileNameArray[i];
            if (i === 5) {
              db.collection("gallery")
                .add(gallery)
                .then(() => {
                  return res.json({ message: "Successfully Added" });
                })
                .catch((err) => [console.log(err)]);
            }
          })
          .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: "something went wrong" });
          });
      }
    });
    busboy.end(req.rawBody);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Please File size must be lesser than 11MB" });
  }
};

// Get Requrests

exports.getHeaderTitle = (req, res) => {
  db.collection("header")
    .get()
    .then((data) => {
      let header = [];
      data.forEach((doc) => {
        header.push(doc.data());
      });
      return res.json(header);
    })
    .catch(() => {
      return res.status(500).json({ message: "404" });
    });
};

exports.getGallery = (req, res) => {
  db.collection("gallery")
    .get()
    .then((data) => {
      let gallery = [];
      data.forEach((doc) => {
        gallery.push(doc.data());
      });
      return res.json(gallery);
    })
    .catch((err) => {
      res.status(500).json({ message: "Plz Contact with Developer" });
    });
};

exports.getLatestNews = (req, res) => {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  db.collection("news")
    .where("postAt", ">=", new Date(today).toISOString())
    .orderBy("postAt", "desc")
    .get()
    .then((data) => {
      let news = [];
      data.forEach((doc) => {
        news.push(doc.data());
      });
      console.log(news);
      return res.json(news);
    })
    .catch((err) => {
      res.status(500).json({ message: "Plz Contact with Developer" });
    });
};

exports.getUpcommingEvent = (req, res) => {
  let today = new Date();
  today.setHours(0, 0, 0, 0);
  console.log(new Date(today).toISOString());
  db.collection("event")
    .where("date", ">=", new Date(today).toISOString())
    .orderBy("date", "desc")
    .limit(2)
    .get()
    .then((data) => {
      let event = [];
      data.forEach((doc) => {
        event.push(doc.data());
      });
      console.log(event);
      return res.json(event);
    })
    .catch((err) => {
      res.status(500).json({ message: "Plz Contact with Developer" });
    });
};
