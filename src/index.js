const express=require('express');
const dotenv=require('dotenv');
const routes=require('./Routes/userRoutes')
dotenv.config();
const mongoose=require('mongoose');

const bodyParser=require('body-parser');
const cors=require('cors'); 
const app=express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
const Port=3030;

mongoose.connect(process.env.MongoUrl)
.then(()=>console.log('mongoose connected'))
.catch((err)=>console.log(err))



app.use('/',routes);
app.listen(Port, () => console.log(`🚀 Server flying on port ${Port}`));