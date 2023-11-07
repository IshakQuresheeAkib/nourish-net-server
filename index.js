const express = require('express')
const cors = require('cors')
require('dotenv').config(); 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')


const port = process.env.PORT || 5000;
const app = express()
 

app.use(cors({
  origin:['http://localhost:5173','http://localhost:5174'],
  credentials:true
}))
app.use(express.json())
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vuba6ki.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares
const verify = async (req,res,next)=>{
  const token = req?.cookies?.token
  // console.log(token)
  if (!token) {
      return res.status(401).send({error:'Forbidden access',status:401})
  }
  jwt.verify(token,process.env.SECRET_KEY,(err,decode)=>{
      if (err) {
          console.log(err);
          return res.status(403).send({error:'wrong access',status:401})
      }
      req.decode = decode;
      next();
  })
  
}



async function run() {
  try {
    const foodsCollection = client.db('nourishNetDB').collection('foodsCollection')
    const foodRequestCollection = client.db('nourishNetDB').collection('foodRequestCollection')

    app.get('/', (req, res) => {
        res.send('Hello World!')
      })

      app.post('/jwt',async(req,res)=>{
        const body = req.body;
        const token = jwt.sign(body,process.env.SECRET_KEY,{expiresIn:'1h'})
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            
        })               
        .send({message:'SUCCESS',token})
    })

    app.post('/logout',async(req,res)=>{
      const user = req.body;
      console.log(user);

          res.clearCookie(
          "token",
          {
          maxAge: 0,
          secure: process.env.NODE_ENV === "production" ? true: false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          }
          )
          .send({message:'Logged out'})
  })

    // api for available foods section
    app.get('/available-foods',async(req,res)=>{
      const cursor = foodsCollection.find({ foodQuantity: { $gt: 0 } });
      const foods = await cursor.toArray();
      res.send(foods)
    })
    app.post('/available-foods',async(req,res)=>{
      const food = req.body;
      console.log(food);
      const result = await foodsCollection.insertOne(food);
      res.send(result)
    })

    app.put('/available-foods',async(req,res)=>{
      const food = req.body;
      const { foodName,foodImage,foodQuantity,donatorEmail,donatorImage,donatorName,pickupLocation,expiredDateTime,additionalNotes,foodStatus } = food
      const filter = {_id: new ObjectId(food._id)}
      const options = {upsert:true}
      const updatedFood = {
          $set:{
            foodName,foodImage,foodQuantity,donatorEmail,donatorImage,donatorName,pickupLocation,expiredDateTime,additionalNotes,foodStatus
          }
      }
      const result = await foodsCollection.updateOne(filter,updatedFood,options)
      res.send(result)
  })
    app.patch('/available-foods',async(req,res)=>{
      const {id,foodQuantity} = req.body;
      const newQuantity = foodQuantity - 1
      // if(!newQuantity){
      //   const query = {_id: new ObjectId(id)}
      //   const result = await foodsCollection.deleteOne(query);
      //   return res.send(result);        
      // }
      const filter = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updatedFood = {
          $set:{
            foodQuantity: newQuantity
          }
      }
      const result = await foodsCollection.updateOne(filter,updatedFood,options)
      res.send(result)
  })



    app.get('/available-foods/:id',async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const food = await foodsCollection.findOne(query);
      res.send(food)
    })

    app.delete('/available-foods/:name',async(req,res)=>{
      const name = req.params?.name;
      console.log(name);
      let query;
      if (name) {
        query = {foodName: name}
      }  
      const result = await foodsCollection.deleteOne(query);
      res.send(result)
    })

    // api for manage-my-foods section
    app.get('/manage-my-foods',async(req,res)=>{
      const userEmail = req.query?.email
      let query;
      if (userEmail) {
        query = {donatorEmail: userEmail}
      }
      const result = await foodsCollection.find(query).toArray();
      res.send(result);
    })


    // api for food request collection
    app.post('/requested-food',async(req,res)=>{
      const food = req.body;
      const result = await foodRequestCollection.insertOne(food)
      res.send(result);
    })

    app.get('/requested-food',async(req,res)=>{
      const name = req.query?.name;
      let query;
      if (name) {
        query = {foodName: name}
      }
      const result = await foodRequestCollection.find(query).toArray();
      res.send(result)
    })
    app.get('/requested-food',async(req,res)=>{
      const email = req.query?.email;
      let query;
      if (email) {
        query = {email: email}
      }
      const result = await foodRequestCollection.find(query).toArray();
      res.send(result)
    })

    app.patch('/requested-food',async(req,res)=>{
      const {id,foodStatus} = req.body;
      console.log(id,foodStatus);
      const filter = {_id: new ObjectId(id)}
      const options = {upsert:true}
      const updatedFood = {
          $set:{foodStatus}
      }
      const result = await foodRequestCollection.updateOne(filter,updatedFood,options)
      res.send(result)
    })

    app.delete('/requested-food/:id',async(req,res)=>{
      const id = req.params?.id;
      let query;
      if (id) {
        query = {_id: new ObjectId(id)}
      }
      const result = await foodRequestCollection.deleteOne(query)
      res.send(result)
    })


    
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {}
}
run().catch(console.dir);




  

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})