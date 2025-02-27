const express = require("express");
const externalWithdrawServices = require("./external.service");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const response = await externalWithdrawServices.createWithdraw(req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})

router.get("/", async (req, res) => {
    try {
        const response = await externalWithdrawServices.getAll(req.query?.status);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})
router.get("/:id", async (req, res) => {
    try {
        const response = await externalWithdrawServices.getSingle(req.params.id);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})


router.get("/user/:id", async (req, res) => {
    try {
        const response = await externalWithdrawServices.getAllByUser(req.params.id, req.query?.status);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})

router.put("/:id", async (req, res) => {
    try {
        const response = await externalWithdrawServices.updateData(req.params.id, req.body);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const response = await externalWithdrawServices.deleteData(req.params.id);
        res.send(response);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
})

module.exports = router