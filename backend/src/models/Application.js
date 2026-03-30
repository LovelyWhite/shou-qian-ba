const mongoose = require('mongoose')

const FileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String },
    type: { type: String },
  },
  { _id: false }
)

const ApplicationSchema = new mongoose.Schema(
  {
    orderNo: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    remark: { type: String, trim: true, default: '' },
    submittedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    merchantName: { type: String, trim: true, default: '' },
    contact: { type: String, trim: true, default: '' },
    areaCode: { type: String, trim: true },
    areaText: { type: String, trim: true, default: '' },
    addressDetail: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    files: {
      idCardFront: { type: [FileSchema], default: [] },
      idCardBack: { type: [FileSchema], default: [] },
      bankCard: { type: [FileSchema], default: [] },
      shopFront: { type: [FileSchema], default: [] },
      shopInside: { type: [FileSchema], default: [] },
      license: { type: [FileSchema], default: [] },
    },
    meta: {
      ip: { type: String },
      userAgent: { type: String },
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Application', ApplicationSchema)
