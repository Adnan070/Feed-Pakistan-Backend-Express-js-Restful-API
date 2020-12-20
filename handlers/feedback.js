const { db } = require('../util/admin');

exports.getAllFeeds = (req, res) => {
  db.collection('feedback')
    .orderBy('sendAt', 'desc')
    .get()
    .then((data) => {
      let feeds = [];

      data.forEach((doc) => {
        console.log('DOC ID',doc.id)
        feeds.push({
          key:doc.id,
          name: doc.data().name,
          email: doc.data().email,
          title: doc.data().title,
          message: doc.data().message,
          sendAt:doc.data().sendAt
        });
      });
      return res.json(feeds);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneFeedback = (req, res) => {
if (req.body.email.trim() === '') {
    return res.status(400).json({ desc: 'Description must not be empty' });
}
if(req.body.title.trim() === ''){
    return res.status(400).json({ desc: 'Description must not be empty' });
}
if(req.body.name.trim() === '' ){
    return res.status(400).json({ desc: 'Description must not be empty' });
}
if(req.body.message.trim() === ''){
    return res.status(400).json({ desc: 'Description must not be empty' });
}

 

  

  const newFeed = {
    name:req.body.name,
    title: req.body.title,
    email: req.body.email,
    message:req.body.message,
    sendAt: new Date().toISOString()
  };

  db.collection('feedback')
    .add(newFeed)
    .then((doc) => {
      res.json({message:'Your message recieved Successfully'});
    })
    .catch((err) => {
      res.status(500).json({ error: 'Something went wrong' });
      console.error(err);
    });
};
// Fetch one scream
exports.getActivity = (req, res) => {
  let activityData = {};
  db.doc(`/activity/${req.params.activityId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      activityData = doc.data();
      activityData.activityId = doc.id;
      return res.json(activityData)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};
// Comment on a comment

// Like a scream

// Delete a scream
exports.deleteActivity = (req, res) => {
  const document = db.doc(`/activity/${req.params.activityId}`);
  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      if (doc.data().userHandle !== req.user.handle) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Activity deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};


exports.updateActivity = (req,res)=>{
  const document = db.doc(`/activity/${req.params.activityId}`);

  if (req.body.desc.trim() === '') {
    return res.status(400).json({ desc: 'Description must not be empty' });
  }
  if(req.body.title.trim() === ''){
    return res.status(400).json({ desc: 'Description must not be empty' });
  }
  console.log(document)
  const newActivity = {
    title:req.body.title,
    userHandle: req.user.handle,
    desc: req.body.desc,
    createdAt: new Date().toISOString()
  };
  document.update(newActivity)
  .then(()=>{
    return res.json({message:"Record Successfully Updated!"})
  })
  .catch((err)=>{
    console.log(err);
    return res.status(500).json({error:err})
  })

}