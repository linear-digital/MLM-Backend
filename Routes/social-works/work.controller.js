const services = require('./work.service');
const router = require("express").Router();

const createNewWork = async (req, res) =>
{
    try {
        const data = req.body;
        const result = await services.createWork(data);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const createNewWorkSubmit = async (req, res) =>
{
    try {
        const data = req.body;
        const result = await services.createWorkSubmit(data);
        res.status(201).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const getAllWorks = async (req, res) =>
{
    try {
        const user = req.user;
        const result = await services.getAllWorks(user);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const getAllWorkSubmits = async (req, res) =>
{
    try {
        const status = req.query.status;
        const result = await services.getAllWorkSubmits(status);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const getAWork = async (req, res) =>
{
    try {
        const result = await services.getWorkById(req.params.id);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const getAWorkSubmit = async (req, res) =>
{
    try {
        const status = req.query.status;
        const result = await services.getWorkSubmitById(req.params.id, status);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const updateAWork = async (req, res) =>
{
    try {
        const data = req.body;
        const result = await services.updateWork(req.params.id, data);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const updateAWorkSubmit = async (req, res) =>
{
    try {
        const data = req.body;
        const result = await services.updateWorkSubmit(req.params.id, data);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const deleteAWork = async (req, res) =>
{
    try {
        const result = await services.deleteWork(req.params.id);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const deleteAWorkSubmit = async (req, res) =>
{
    try {
        const result = await services.deleteWorkSubmit(req.params.id);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const completeAWorkSubmit = async (req, res) =>
{
    try {
        const result = await services.completeWorkSubmit(req.params.id);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}

router.post("/create", createNewWork);
router.post("/submit", createNewWorkSubmit);
router.get("/all", getAllWorks);
router.get("/all-submits", getAllWorkSubmits);
router.get("/:id", getAWork);
router.get("/submit/:id", getAWorkSubmit);
router.put("/:id", updateAWork);
router.put("/submit/:id", updateAWorkSubmit);
router.delete("/:id", deleteAWork);
router.delete("/submit/:id", deleteAWorkSubmit);
router.put("/complete/:id", completeAWorkSubmit);

module.exports = router;