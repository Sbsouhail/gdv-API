const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  search: { type: String, default: "" },
  projects: [
    {
      views: { type: Number, default: 0 },
      _id: {
        type: String,
      },
      name: {
        type: String,
      },
      creationDate: {
        type: Date,
        default: Date.now,
      },
      visible: {
        type: Boolean,
        default: true,
      },
      versions: [
        {
          _id: {
            type: String,
          },
          name: {
            type: String,
          },
          creationDate: {
            type: Date,
            default: Date.now,
          },
          files: [
            {
              _id: {
                type: String,
              },
              name: {
                type: String,
              },
              creationDate: {
                type: Date,
                default: Date.now,
              },
              from: {
                type: String,
              },
            },
          ],
        },
      ],
    },
  ],
  creationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});
module.exports = mongoose.model("User", userSchema);
