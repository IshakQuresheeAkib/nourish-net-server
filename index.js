const express = require('express')
const cors = require('cors')
require('dotenv').config(); 
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const port = process.env.PORT || 5000;
const app = express()
 
app.use(cookieParser())
app.use(cors({
  origin:['http://localhost:5173','http://localhost:5174'],
  credentials:true
}))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vuba6ki.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    const foodsCollection = client.db('nourishNetDB').collection('foodsCollection')
    const foodRequestCollection = client.db('nourishNetDB').collection('foodRequestCollection')

    app.get('/', (req, res) => {
        res.send('Hello World!')
      })

    // api for available foods section
    app.get('/available-foods',async(req,res)=>{
      const cursor = foodsCollection.find();
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
      console.log(filter);
      const options = {upsert:true}
      const updatedFood = {
          $set:{
            foodName,foodImage,foodQuantity,donatorEmail,donatorImage,donatorName,pickupLocation,expiredDateTime,additionalNotes,foodStatus
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

    app.delete('/available-foods/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
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
      res.send(result)
    })

    app.get('/requested-food/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)}
      const result = await foodRequestCollection.findOne(query)
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