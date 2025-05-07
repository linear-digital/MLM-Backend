
const { Work, WorkSubmit } = require('./work.model');
const User = require('../User/user.model');
const createWork = async (workData) =>
{
    try {
        const work = new Work(workData);
        await work.save();
        return work;
    } catch (error) {
        throw new Error('Error creating work: ' + error.message);
    }
}
const createWorkSubmit = async (workSubmitData) =>
{
    try {
        const workSubmit = new WorkSubmit(workSubmitData);
        await workSubmit.save();
        await Work.findByIdAndUpdate(workSubmit.workId, { $push: { workers: workSubmitData.userId } })
        return workSubmit;
    } catch (error) {
        throw new Error('Error creating work submit: ' + error.message);
    }
}
const completeWorkSubmit = async (workSubmitId, status) =>
{
    try {
        const workSubmit = await WorkSubmit.findById(workSubmitId)
            .populate('workId')

        const price = workSubmit.workId.price;
        const userId = workSubmit.userId;
        await User.findByIdAndUpdate(userId, {
            $inc: { balance: price }
        }, { new: true });
        const updatedWorkSubmit = await WorkSubmit.findByIdAndUpdate(workSubmitId, { status: "completed" }, { new: true });
        if (!updatedWorkSubmit) {
            throw new Error('Work submit not found');
        }
        return updatedWorkSubmit;
    }
    catch (error) {
        throw new Error('Error completing work submit: ' + error.message);
    }
}
const getWorkById = async (workId) =>
{
    try {
        const work = await Work.findById(workId);
        if (!work) {
            throw new Error('Work not found');
        }
        return work;
    }
    catch (error) {
        throw new Error('Error fetching work: ' + error.message);
    }
}
const getAllWorks = async (user) =>
{
    try {
        const userRes = await User.findById(user);
        if (!userRes) throw new Error('User not found');
        console.log(userRes);
        if (userRes.role === 'admin') {
            const works = await Work.find()
                .sort({ status: 1, createdAt: -1 })
                .select('-workers');

            const submits = await WorkSubmit.aggregate([
                { $match: { status: 'pending' } },
                {
                    $group: {
                        _id: '$workId',
                        count: { $sum: 1 }
                    },
                },
            ]);

            const worksWithSubmits = works.map((work) =>
            {
                const submit = submits.find((s) => s._id.toString() === work._id.toString());
                return {
                    ...work.toObject(),
                    count: submit ? submit.count : 0,
                };
            });

            return worksWithSubmits;
        } else {
            const works = await Work.find({
                workers: { $nin: [user._id?.toString() || user.toString()] },
            }).sort({ status: 1, createdAt: -1 });

            return works;
        }

    } catch (error) {
        throw new Error('Error fetching works: ' + error.message);
    }
};
const getAllWorkSubmits = async (status) =>
{
    try {
        const workSubmits = await WorkSubmit.find({
            status: status
        }).populate('workId')
            .populate('userId', 'name username');
        return workSubmits;
    } catch (error) {
        throw new Error('Error fetching work submits: ' + error.message);
    }
}
const getWorkSubmitById = async (workSubmitId, status) =>
{
    try {
        const workSubmit = await WorkSubmit.find({
            userId: workSubmitId,
            status: status
        })
            .populate('workId')

        return workSubmit;
    }
    catch (error) {
        throw new Error('Error fetching work submit: ' + error.message);
    }
}
const updateWork = async (workId, workData) =>
{
    try {
        const work = await Work.findByIdAndUpdate(workId, workData, { new: true });
        if (!work) {
            throw new Error('Work not found');
        }
        return work;
    }
    catch (error) {
        throw new Error('Error updating work: ' + error.message);
    }
}
const updateWorkSubmit = async (workSubmitId, workSubmitData) =>
{
    try {
        const workSubmit = await WorkSubmit.findByIdAndUpdate(workSubmitId, workSubmitData, { new: true });
        if (!workSubmit) {
            throw new Error('Work submit not found');
        }
        return workSubmit;
    }
    catch (error) {
        throw new Error('Error updating work submit: ' + error.message);
    }
}
const deleteWork = async (workId) =>
{
    try {
        const isAnySubmitExist = await WorkSubmit.find({ workId: workId, status: "pending" });
        if (isAnySubmitExist.length > 0) {
            throw new Error(`Work has ${isAnySubmitExist.length} pending submits cannot be deleted`);
        }
        const work = await Work.findByIdAndDelete(workId);
        if (!work) {
            throw new Error('Work not found');
        }
        return work;
    }
    catch (error) {
        throw new Error('Error deleting work: ' + error.message);
    }
}
const deleteWorkSubmit = async (workSubmitId) =>
{
    try {
        const workSubmit = await WorkSubmit.findByIdAndDelete(workSubmitId);
        if (!workSubmit) {
            throw new Error('Work submit not found');
        }
        return workSubmit;
    }
    catch (error) {
        throw new Error('Error deleting work submit: ' + error.message);
    }
}

module.exports = {
    createWork,
    createWorkSubmit,
    getWorkById,
    getAllWorks,
    getAllWorkSubmits,
    getWorkSubmitById,
    updateWork,
    updateWorkSubmit,
    deleteWork,
    deleteWorkSubmit,
    completeWorkSubmit
}
