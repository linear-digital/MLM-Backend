const External = require("./external.model");

const createWithdraw = async (data) => {
    try {
        const withDraw = new External(data);
        await withDraw.save();
        return withDraw
    } catch (error) {
        throw new Error(error)
    }
}

const getSingle = async (id) => {
    try {
        const withDraw = await External.findById(id)
            .populate("user", "-password")
            .exec();
        return withDraw
    } catch (error) {
        throw new Error(error)
    }
}
const getAllByUser = async (id, status) => {
    try {
        const withDraw = await External.find({ user: id, status: status ? status : "pending" })
            .populate("user", "-password")
            .sort({ createdAt: -1 })
            .exec();
        return withDraw
    } catch (error) {
        throw new Error(error)
    }
}
const getAll = async (status) => {
    try {
        const withDraw = await External.find({ status: status ? status : "pending" })
            .populate("user", "-password")
            .sort({ createdAt: -1 })
            .exec();
        return withDraw
    } catch (error) {
        throw new Error(error)
    }
}
const updateData = async (id, data) => {
    try {
        await External.findByIdAndUpdate(id, data, { new: true });
        return {
            message: "Data updated successfully",
        }
    } catch (error) {
        throw new Error(error)
    }
}
const deleteData = async (id) => {
    try {
        const withDraw = await External.findByIdAndDelete(id);
        return withDraw
    } catch (error) {
        throw new Error(error)
    }
}
const externalWithdrawServices = {
    createWithdraw,
    getSingle,
    getAllByUser,
    getAll,
    updateData,
    deleteData
}

module.exports = externalWithdrawServices