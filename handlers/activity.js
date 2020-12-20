const { db } = require('../util/admin');

exports.getAllActivity = (req, res) => {
  db.collection('activity')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let activity = [];
      
      data.forEach((doc) => {
        console.log('DOC ID',doc.id)
        activity.push({
          title: doc.data().title,
          desc: doc.data().desc,
          imageUrl: doc.data().imageUrl,
          createdAt: doc.data().createdAt,
          aid:doc.id
        });
      });
      return res.json(activity);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.postOneActivity = (req, res) => {
  if (req.body.desc.trim() === '') {
    return res.status(400).json({ desc: 'Description must not be empty' });
  }


  const newActivity = {
    title:req.body.title,
    userHandle: req.user.handle,
    desc: req.body.desc,
    createdAt: new Date().toISOString()
  };

  db.collection('activity')
    .add(newActivity)
    .then((doc) => {
      const resActivity = newActivity;
      resActivity.activityId = doc.id;
      res.json(resActivity);
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