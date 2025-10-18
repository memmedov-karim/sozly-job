import mongoose, {Schema} from "mongoose";

const locationSchema = new Schema({
    data: {
        type: Object
    }
}, {timestamps: true});

export default mongoose.model("Location", locationSchema);
