const {db} = require('../util/admin');

exports.getSizeOfDonations=(req,res)=>{
    const targetDate = new Date(new Date().getFullYear(),new Date().getMonth(),new Date().getDate()-3).toISOString();
      db.collection('food')
      .get()
      .then((data)=>{
        res.status(200).json(data.size)
      })
      .catch((err)=>{
        console.log(err)
      })
  }

exports.getMonthlyOrderedData=(req,res)=>{
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const today = new Date();
    const monthCr = months[today.getMonth()];
    const month1 = months[today.getMonth()-1];
    const month2 = months[today.getMonth()-2];
    const month3 = months[today.getMonth()-3];
    const month4 = months[today.getMonth()-4];
    let userSize=0;
    const remainDaysInCurrentMonth = new Date(today.getFullYear(),today.getMonth(),0);
    db.collection('food')
    .get()
    .then(async (data)=>{
        // let fiveMonthsRecord={
        //     [monthCr]:0,
        //     [month1]:0,
        //     [month2]:0,
        //     [month3]:0,
        //     [month4]:0,
        // };
        let fm=[
            [monthCr,0,'#b87333'],
            [month1,0,'silver'],
            [month2,0,'gold'],
            [month3,0,'#e5e4e2'],
            [month4,0,'silver'],
        ]
        let anual=0;
        // console.log(fiveMonthsRecord[`${monthCr}`])
        console.log(fm)

    
      await db.collection('users')
      .get()
      .then((doc)=>{
        userSize=doc.size;
        console.log(userSize)
      })
      .catch((err)=>{
        res.status(500).json({message:'Please Some Internal Issue Contact with Developers!'});
      })

      let area=[]
        data.forEach((doc)=>{
            area.push(doc.data())
            if(doc.data().donationTime >= (new Date(today.getFullYear()-1,today.getMonth(),1)).toISOString() ){
                anual+=1;
            }
            if(doc.data().donationTime >= (new Date(today.getFullYear(),today.getMonth(),1)).toISOString() ){
                // fiveMonthsRecord[`${monthCr}`]+=1;
                fm[0][1]+=1;
            }
            else if(    
                doc.data().donationTime >= (new Date(today.getFullYear(),today.getMonth()-1,1)).toISOString() &&
                doc.data().donationTime < (new Date(today.getFullYear(),today.getMonth(),1)).toISOString()
            ){
                // fiveMonthsRecord[`${month1}`]+=1;
                fm[1][1]+=1;
            }
            else if(    
                doc.data().donationTime >= (new Date(today.getFullYear(),today.getMonth()-2,1)).toISOString() &&
                doc.data().donationTime < (new Date(today.getFullYear(),today.getMonth()-1,1)).toISOString()
            ){
                // fiveMonthsRecord[`${month2}`]+=1;
                fm[2][1]+=1;
            }
            else if(    
                doc.data().donationTime >= (new Date(today.getFullYear(),today.getMonth()-3,1)).toISOString() &&
                doc.data().donationTime < (new Date(today.getFullYear(),today.getMonth()-2,1)).toISOString()
            ){
                // fiveMonthsRecord[`${month3}`]+=1;
                fm[3][1]+=1;
            }
            else if(    
                doc.data().donationTime >= (new Date(today.getFullYear(),today.getMonth()-4,1)).toISOString() &&
                doc.data().donationTime < (new Date(today.getFullYear(),today.getMonth()-3,1)).toISOString()
            ){
                // fiveMonthsRecord[`${month4}`]+=1;
                fm[4][1]+=1;
            }

        });

        

        let pie=[
            ['Resturant',0],
            ['Banquet',0],
            ['Home',0],
            ['Others',0]
        ]


        data.forEach((doc)=>{
            if(doc.data().orgType === pie[0][0]){
                pie[0][1]+=1;
            }
            else if(doc.data().orgType === pie[1][0]){
                pie[1][1]+=1;
            }
            else if(doc.data().orgType === pie[2][0]){
                pie[2][1]+=1;
            }
            else{
                pie[3][1]+=1;
            }
        })


        const groupBy = key => array =>
        array.reduce((objectsByKeyValue, obj) => {
            const value = obj[key];
            objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
            return objectsByKeyValue;
        }, {} );

        const groupByArea = groupBy('area');
        let groups=groupByArea(area);
        let breakIntoAreas={}
        for(let key in groups){
            breakIntoAreas[key]= groups[key].length;
        }


        res.status(200).json({fm,pie,size:data.size,anual,userSize,breakIntoAreas});
    })
    .catch((err)=>{
        console.log(err)
    });
}

