// importing
import mongoose from 'mongoose';
import express from 'express';
import Messages from './dbMessages'
import Pusher from "pusher";
import cors from 'cors'

// app config
const app =  express();
const port = process.env.PORT || 3001;

const pusher = new Pusher({
    appId: '1097447',
    key: '243cd26d356aa566bd2d',
    secret: '422cab12fdbf6104a6fe',
    cluster: 'eu',
    encrypted: true
  });

// middleware
app.use(express.json())

app.use(cors());
// DB config
const connection_URL= 'mongodb+srv://admin:Megadev_2@cluster0.zouuy.mongodb.net/whatsappdb?retryWrites=true&w=majority';

mongoose.connect(connection_URL,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection

db.once('open', ()=> {
    console.log('DB is connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("a change occurend:", change);

        if (change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});
// ??????

// api routes
app.get("/", (req, res) => res.status(200).send("Soy la verga"));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
                res.status(500).send(err)
        } else {
                res.status(200).send(data)           
        }
    })
})

app.post('/messages/new', (req, res) => {
   const dbMessage = req.body

   Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
   })
})
//lisent
app.listen(port, () => console.log(`Listening on port: ${port}`));