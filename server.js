const express = require("express");
const path = require("path");
const crypto = require("crypto");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const GridFsStream = require("gridfs-stream");
const methodOverride = require("method-override");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(methodOverride("_method"));

const mongoUrl =
  "mongodb+srv://Alex123:ALCm1940Alex123@cluster0.rtyj3.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const conn = mongoose.createConnection(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let gfs;

conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });

  app.listen(3000, () => console.log("listening"));
});

const storage = new GridFsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.json("hello");
});

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});

app.get("/files", (req, res) => {
  gfs.find().toArray((err, files) => {
    if (err) return res.sendStatus(400);
    if (!files || !files.length) return res.json({ msg: "No files to show" });

    res.json({ files });
  });
});

app.get("/file/:filename", (req, res) => {
  gfs.find({ filename: req.params.filename }).toArray((err, file) => {
    if (err) return res.sendStatus(400);
    if (!file) return res.json({ msg: "No file to show" });

    res.json({ file });
  });
});

// display image
app.get("/image/:filename", (req, res) => {
  gfs.find({ filename: req.params.filename }).toArray((err, files) => {
    if (err) return res.sendStatus(400);
    if (!files || !files.length) return res.json({ msg: "No files to show" });

    files.forEach(file => {
      if (/^image\/(jpeg|jpg|png)$/.test(file.contentType)) {
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
      } else {
        return res.status(404).json({
          msg: "Not an image",
        });
      }
    });
  });
});

app.get("/test/:filename", (req, res) => {
  gfs.find({ filename: req.params.filename }).toArray((err, file) => {
    if (err) return res.sendStatus(400);
    if (!file || !file.length) return res.json({ msg: "No file to show" });

    gfs.openDownloadStreamByName(req.params.filename).pipe(res);
  });
});
