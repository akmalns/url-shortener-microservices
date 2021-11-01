require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const shortid = require('shortid');
const validurl = require('valid-url');
const {Schema} = mongoose;

mongoose.connect('mongodb+srv://narendra14:vg9mINejqXHG5RFM@cluster0.gyizq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',{
  useNewUrlParser:true,
  useUnifiedTopology:true,
  serverSelectionTimeoutMS:5000
},(err)=>{
  if(err) return console.log(err);
});

const connection = mongoose.connection;
connection.on('error',console.error.bind(console,'connection error:'));
connection.once('open',()=>{
  console.log("MongoDB database connection established successfully")
})

//database
const urlSchema = new Schema({
  original_url : String,
  short_url : String
});
const URL = mongoose.model('URL',urlSchema);


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// database function
insertData = (url)=>{
  const newURL = new URL({original_url:url});
  newURL.save((err,result)=>{
    if(err) return console.log(err);
    console.log(result);
  })
}


app.post('/api/shorturl',async (req,res)=>{
  // let re = /^https*:\/\/www\.[a-zA-Z0-9_\.-]+\.com[a-zA-Z0-9_\.-]*/;
  const url = req.body.url;
  const urlCode = shortid.generate();

  console.log(url);

  if(!validurl.isWebUri(url)){
    res.status(401).json({
      error:'invalid URL'
    })
  }else{
    try{
      let findOne = await URL.findOne({
        original_url:url
      })
      if(findOne){
        res.json({
          original_url:findOne.original_url,
          short_url:findOne.short_url
        })
      }else{
        findOne = new URL({
          original_url:url,
          short_url:urlCode
        })
        await findOne.save()
        res.json({
          original_url:findOne.original_url,
          short_url:findOne.short_url
        })
      }
    }catch(err){
      console.log(err)
      res.status(500).json('Server error..')
    }
  }
})

app.get('/api/shorturl/:short_url?', async (req,res)=>{
  try{
    const urlParams = await URL.findOne({
      short_url:req.params.short_url
    })
    if(urlParams){
      return res.redirect(urlParams.original_url)
    }else{
      return res.status(404).json('No URL found')
    }
  }catch(err){
    console.log(err);
    res.status(500).json('Server Error')
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
