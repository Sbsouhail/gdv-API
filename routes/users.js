const express = require("express");
const router = express.Router();
const User = require("../models/user");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const upload = multer({ dest: "./upload/" });
const { FilesManager } = require("turbodepot-node");
const zip = require("express-zip");
let filesManager = new FilesManager();
//uploading file
router.patch(
  "/upload/:id",
  getUser,
  upload.array("files"),
  async (req, res) => {
    try {
      let ids = {};
      let vids = {};
      let fids = {};
      res.user.projects.map((item, index) => {
        ids[item._id] = index;
      });

      res.user.projects[ids[req.body.project]].versions.map((item, index) => {
        vids[item._id] = index;
      });
      res.user.projects[ids[req.body.project]].versions[
        vids[req.body.version]
      ].files.map((item, index) => {
        fids[item._id] = index;
      });
      for (const i of Object.keys(req.files)) {
        var t = 0;
        var oldPath = req.files[i].path;
        var newPath =
          "uploads/" + req.body.version + "/" + req.files[i].originalname;
        var testPath = "Nothing";
        var ok = null;
        if (vids[req.body.version] > 0) {
          testPath =
            "uploads/" +
            res.user.projects[ids[req.body.project]].versions[
              vids[req.body.version] - 1
            ]._id +
            "/" +
            req.files[i].originalname;
          for (
            let index = 0;
            index <
            res.user.projects[ids[req.body.project]].versions[
              vids[req.body.version] - 1
            ].files.length;
            index++
          ) {
            if (
              res.user.projects[ids[req.body.project]].versions[
                vids[req.body.version] - 1
              ].files[index].name == req.files[i].originalname
            ) {
              ok =
                res.user.projects[ids[req.body.project]].versions[
                  vids[req.body.version] - 1
                ].files[index].from;
              testPath =
                res.user.projects[ids[req.body.project]].versions[
                  vids[req.body.version] - 1
                ].files[index]._id;
              if (!filesManager.isFileEqualTo(oldPath, testPath)) {
                if (
                  res.user.projects[ids[req.body.project]].versions[
                    vids[req.body.version]
                  ].files[fids[testPath]]
                )
                  res.user.projects[ids[req.body.project]].versions[
                    vids[req.body.version]
                  ].files[fids[testPath]].remove();
                testPath = "Nothing";
                t = 0;
                ok = null;
              } else {
                if (
                  res.user.projects[ids[req.body.project]].versions[
                    vids[req.body.version]
                  ].files[fids[newPath]]
                )
                  res.user.projects[ids[req.body.project]].versions[
                    vids[req.body.version]
                  ].files[fids[newPath]].remove();
                if (fs.existsSync(newPath)) {
                  fs.rmSync(newPath, { recursive: true, force: true });
                }
              }
              break;
            }
          }
        }
        if (testPath != "Nothing" && ok) {
          newPath = testPath;
          t = 1;
        }
        var newFile = {
          _id: newPath,
          name: req.files[i].originalname,
          from: res.user.projects[ids[req.body.project]].versions[
            vids[req.body.version]
          ].name,
        };
        if (fs.existsSync(newPath)) {
          fs.rmSync(newPath, { recursive: true, force: true });
        }
        fs.renameSync(oldPath, newPath);
        if (t == 1) {
          newFile.from = ok;
        }
        if (
          !res.user.projects[ids[req.body.project]].versions[
            vids[req.body.version]
          ].files[fids[newFile._id]]
        )
          res.user.projects[ids[req.body.project]].versions[
            vids[req.body.version]
          ].files.push(newFile);
      }
      updatedUser = await res.user.save();
      res.json({
        user: updatedUser,
        project: res.user.projects[ids[req.body.project]],
        version:
          res.user.projects[ids[req.body.project]].versions[
            vids[req.body.version]
          ],
      });
    } catch (err) {
      console.log(err);
    }
  }
);
//downloading file
router.get("/download", async (req, res) => {
  try {
    res.download(req.query._id, req.query.name);
  } catch (err) {
    console.log(err);
  }
});
//downloading version
router.get("/download/v/:id", getUser, async (req, res) => {
  try {
    let ids = {};
    let vids = {};
    let files = [];
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });

    res.user.projects[ids[req.query.project]].versions.map((item, index) => {
      vids[item._id] = index;
    });
    for (
      let index = 0;
      index <
      res.user.projects[ids[req.query.project]].versions[
        vids[req.query.version]
      ].files.length;
      index++
    ) {
      var file = {
        path: res.user.projects[ids[req.query.project]].versions[
          vids[req.query.version]
        ].files[index]._id,
        name: res.user.projects[ids[req.query.project]].versions[
          vids[req.query.version]
        ].files[index].name,
      };
      files.push(file);
      console.log(
        res.user.projects[ids[req.query.project]].versions[
          vids[req.query.version]
        ].files[index]._id
      );
    }
    res.zip(files);
  } catch (err) {
    console.log(err);
  }
});
/*router.get("/download/v", async (req, res) => {
  try {
    var zipper = require("zip-local");
    zipper.sync
      .zip(`uploads/${req.query._id}`)
      .compress()
      .save(`uploads/${req.query._id}/${req.query.name}.zip`);
    await res.download(
      `uploads/${req.query._id}/${req.query.name}.zip`,
      `${req.query.name}.zip`
    );
  } catch (err) {
    console.log(err);
  }
});*/
//Getting All
router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Getting All count
router.get("/n", async (req, res) => {
  try {
    const users = await User.find().count();
    res.json(users);
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: err.message });
  }
});
//Getting All count projets
router.get("/n/p", async (req, res) => {
  try {
    const users = await User.find();
    let projects = 0;
    for (let index = 0; index < users.length; index++) {
      projects += users[index].projects.length;
    }
    res.json(projects);
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: err.message });
  }
});
//Getting All count views
router.get("/n/d", async (req, res) => {
  try {
    const users = await User.find();
    let downloads = 0;
    for (let index = 0; index < users.length; index++) {
      for (let i = 0; i < users[index].projects.length; i++) {
        downloads += users[index].projects[i].views;
      }
    }
    res.json(downloads);
  } catch (err) {
    console.log(err);

    res.status(500).json({ message: err.message });
  }
});
//Getting many123
router.get("/many", async (req, res) => {
  try {
    let word = req.query.word;
    const users = await User.find({ search: { $regex: word, $options: "i" } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//Getting One
router.get("/:id", getUser, (req, res) => {
  res.send({ message: res.user });
});
//Login
router.post("/login/:id", getUser, (req, res) => {
  bcrypt.compare(req.body.password, res.user.password, function (err, results) {
    if (err) {
      return res.status(400).send({ message: err.message });
    }
    if (results) {
      return res.status(200).json({ user: res.user, message: "Login success" });
    } else {
      return res.status(401).json({ message: "Invalid credencial" });
    }
  });
});
//Creating One user
router.post("/", async (req, res) => {
  var hash = hashPWD(req.body.password);
  const user = new User({
    _id: req.body._id,
    name: req.body.name,
    lastname: req.body.lastname,
    email: req.body.email,
    password: hash,
  });
  test = await User.findById(user._id);
  if (test == null) {
    try {
      const newUser = await user.save();

      var dir = "uploads/" + newUser._id;

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  } else {
    res.status(409).json({ message: "User Name already exist" });
  }
});
//Updating One
router.patch("/:id", getUser, async (req, res) => {
  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.lastname != null) {
    res.user.lastname = req.body.lastname;
  }
  if (req.body.password != null) {
    var hash = hashPWD(req.body.password);
    res.user.password = hash;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.password != null) {
    res.user.password = req.body._id;
  }
  try {
    updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

//adding view
router.patch("/Add/:id", getUser, async (req, res) => {
  try {
    const project = {
      _id: req.body._id,
    };
    let ids = {};
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });
    res.user.projects[ids[project._id]].views += 1;
    updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//Inserting project
router.patch("/insert/p/:id", getUser, async (req, res) => {
  try {
    const project = {
      _id: req.body._id,
      name: req.body.name,
    };
    res.user.projects.push(project);
    res.user.search = project.name + "/" + res.user.search;
    updatedUser = await res.user.save();
    var dir = "uploads/" + project._id;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//deleting project
router.patch("/delete/p/:id", getUser, async (req, res) => {
  try {
    const project = {
      _id: req.body._id,
      name: req.body.name,
    };
    let ids = {};
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });
    res.user.projects[ids[project._id]].remove();
    res.user.search = res.user.search.replace(project.name + "/", "");
    updatedUser = await res.user.save();
    var dir = "uploads/" + project._id;
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//deleting version
router.patch("/delete/v/:id", getUser, async (req, res) => {
  try {
    const version = {
      _id: req.body.version._id,
    };
    let fids = {};
    let ids = {};
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions.map((item, index) => {
      fids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions[fids[version._id]].remove();
    updatedUser = await res.user.save();
    var dir = "uploads/" + version._id;
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json({
      user: updatedUser,
      project: res.user.projects[ids[req.body._id]],
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//deleting file
router.patch("/delete/f/:id", getUser, async (req, res) => {
  try {
    const file = {
      _id: req.body.file._id,
    };
    let vids = {};
    let ids = {};
    let fids = {};
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions.map((item, index) => {
      vids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions[
      vids[req.body.version._id]
    ].files.map((item, index) => {
      fids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions[
      vids[req.body.version._id]
    ].files[fids[file._id]].remove();
    updatedUser = await res.user.save();
    var dir = file._id;
    console.log(dir);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json({
      user: updatedUser,
      project: res.user.projects[ids[req.body._id]],
      version:
        res.user.projects[ids[req.body._id]].versions[
          vids[req.body.version._id]
        ],
      files:
        res.user.projects[ids[req.body._id]].versions[
          vids[req.body.version._id]
        ].files,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//Inserting version
router.patch("/insert/v/:id", getUser, async (req, res) => {
  try {
    let ids = {};
    const version = {
      _id: req.body.version._id,
      name: req.body.version.name,
    };
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });

    res.user.projects[ids[req.body._id]].versions.push(version);
    updatedUser = await res.user.save();
    var dir = "uploads/" + version._id;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    res.json({
      user: updatedUser,
      project: res.user.projects[ids[req.body._id]],
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//updating Project
router.patch("/update/p/:id", getUser, async (req, res) => {
  try {
    let ids = {};
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });
    if (req.body.name != null) {
      res.user.projects[ids[req.body._id]].name = req.body.name;
    }
    if (req.body.visible != null) {
      res.user.projects[ids[req.body._id]].visible = req.body.visible;
    }
    updatedUser = await res.user.save();
    res.json(updatedUser.projects[ids[req.body._id]]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//Uploading files
router.patch("/insert/f/:id", getUser, async (req, res) => {
  try {
    let ids = {};
    let fids = {};
    const file = {
      _id: req.body.file._id,
      name: req.body.file.name,
    };
    res.user.projects.map((item, index) => {
      ids[item._id] = index;
    });

    res.user.projects[ids[req.body._id]].versions.map((item, index) => {
      fids[item._id] = index;
    });
    res.user.projects[ids[req.body._id]].versions[
      fids[req.body.version._id]
    ].files.push(file);
    updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
//Deleting user
router.delete("/:id", getUser, async (req, res) => {
  try {
    var id = res.user._id;
    var dir = "uploads/" + id;
    await res.user.remove();
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json({ message: "Deleted User" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getUser(req, res, next) {
  try {
    user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({ message: "Cannot find user" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.user = user;
  next();
}
function hashPWD(pwd) {
  var salt = bcrypt.genSaltSync(13);
  return bcrypt.hashSync(pwd, salt);
}
module.exports = router;
