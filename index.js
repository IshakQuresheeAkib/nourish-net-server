const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config(); 
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

    app.get('/', (req, res) => {
        res.send('Hello World!')
      })

    app.get('/available-foods',async(req,res)=>{
      const cursor = foodsCollection.find();
      const foods = await cursor.toArray();
      res.send(foods)
    })

    app.get('/available-foods/:id',async(req,res)=>{
      const query = {_id: new ObjectId(req.params.id)}
      const food = await foodsCollection.findOne(query);
      res.send(food)
    })
    
    client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {}
}
run().catch(console.dir);




  

app.listen(port, () => {
console.log(`Example app listening on port ${port}`)
})