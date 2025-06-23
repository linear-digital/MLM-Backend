const saltGenerator = require("../../util/saltGenerator");
const jwt = require("jsonwebtoken");
const tokenGenerator = require("../../util/tokenGenerator");
const { createRefer } = require("../Refer/refer.service");
const getSetting = require("../Settings/getSetting");
const Setting = require("../Settings/setting.model");
const Withdraw = require("../WithDraw/withdraw.model");
const User = require("./user.model");
const bcrypt = require("bcrypt");
const mailerService = require("../mailer/mailer");
const Refer = require("../Refer/refer.model");
const createUser = async (req, res) =>
{
    try {
        req.body.email = req.body.email.toLowerCase();
        const isExist = await User.findOne({ email: req.body.email, username: req.body.username });
        if (isExist) {
            return res.status(400).send({
                message: "User already exist"
            });
        }
        if (req.body.reffer !== "") {
            const refferUser = await User.findOne({ username: req.body.reffer });
            if (!refferUser) {
                return res.status(404).send({
                    message: "Reffer user not found"
                });
            }
            req.body.reffer = refferUser._id;

            // // add referer 1 account balance here
            // await User.findByIdAndUpdate(refferUser._id, {
            //     balance: refferUser.balance + 1
            // })
        }
        else {
            delete req.body.reffer;
        }
        // check is username includes space 
        if (req.body.username.includes(" ")) {
            req.body.username = req.body.username.split(" ").join("");
        }
        req.body.password = await saltGenerator(req.body.password);
        req.body.time = new Date(req.body.time);
        const user = new User(req.body);
        await user.save();
        const token = tokenGenerator(user);
        res.send({
            message: "User created successfully",
            token
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
}

const loginUser = async (req, res) =>
{
    try {
        req.body.email = req.body.email.toLowerCase();
        const user = await User.findOne({
            $or: [
                {
                    email: req.body.email
                },
                {
                    username: req.body.email
                }
            ]
        });
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        const isSame = await bcrypt.compare(req.body.password, user.password);
        if (!isSame) {
            return res.status(400).send({
                message: "Password is incorrect"
            });
        }
        const token = tokenGenerator(user);
        res.send({
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
}


const withoutPass = async (req, res) =>
{
    try {
        req.query.email = req.query.email.toLowerCase();
        const user = await User.findOne({
            $or: [
                {
                    email: req.query.email
                },
                {
                    username: req.query.email
                }
            ]
        });
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        const token = tokenGenerator(user);
        res.send({
            message: "Login successful",
            token
        });
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
}
const getAllData = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filters = {};

  // Role filtering
  if (req.query.admin === "true") {
    filters.role = "admin";
  } else if (req.query.moderator === "true") {
    filters.role = "moderator";
  } else {
    filters.role = "user";
  }

  // Status filter
  if (req.query.status) {
    filters.status = req.query.status;
  }

  // Initialize search filter
  const searchConditions = [];
  if (req.query.search) {
    const regex = new RegExp(req.query.search, "i");
    searchConditions.push(
      { username: { $regex: regex } },
      { name: { $regex: regex } },
      { email: { $regex: regex } },
      { phone: { $regex: regex } }
    );
  }

  // Moderator filter
  const refferConditions = [];
  if (req.user?.role === "moderator") {
    refferConditions.push(
      { reffer: { $in: req.user.allowedUsers || [] } },
      { reffer: { $exists: false } },
      { reffer: null }
    );
  }

  // Combine all filters properly
  if (searchConditions.length && refferConditions.length) {
    filters.$and = [
      { $or: refferConditions },
      { $or: searchConditions }
    ];
  } else if (refferConditions.length) {
    filters.$or = refferConditions;
  } else if (searchConditions.length) {
    filters.$or = searchConditions;
  }

  try {
    const users = await User.find(filters)
      .select("-password")
      .populate("reffer", "-password")
      .populate("allowedUsers", "name username email phone")
      .skip(skip)
      .sort({ createdAt: req.query.reverse ? -1 : 1 })
      .limit(limit);

    const total = await User.countDocuments(filters);
    const grandTotal = await User.countDocuments({ role: "user" });
    const active = await User.countDocuments({ status: "active" });
    const pending = await User.countDocuments({ status: "pending" });

    res.send({
      total,
      page,
      pages: Math.ceil(total / limit),
      grandTotal,
      active,
      pending,
      users,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
    });
  }
};
const giveAccess = async (req, res) =>
{
    if (req.user.role !== 'admin') {
        return res.status(403).send({
            message: 'You are not authorized to access this route',
        });
    }

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).send({
            message: 'User ID is required',
        });
    }

    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) {
            return res.status(404).send({
                message: 'Target user not found',
            });
        }

        const isAlreadyAllowed = targetUser.allowedUsers.includes(userId);

        const update = isAlreadyAllowed
            ? { $pull: { allowedUsers: userId } }
            : { $addToSet: { allowedUsers: userId } };

        const updatedUser = await User.findByIdAndUpdate(req.params.id, update, { new: true });

        res.status(200).send({
            message: isAlreadyAllowed
                ? 'Access revoked from user'
                : 'Access granted to user',
            data: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: 'An error occurred while updating access',
            error: error.message,
        });
    }
};
const getSingle = async (req, res) =>
{
    try {
        const user = await User.findById(req.params.id)
            .select("-password")
            .populate("reffer", "-password");
        if (!user) {
            res.status(400).send("User not found");
        }
        res.send(user);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
}
const searchUser = async (req, res) =>
{
    try {
        const user = await User.findOne({ username: req.params.id })
            .select("-password")
            .populate("reffer", "-password");
        const data = {
            user,
            success: false
        }
        if (user) {
            data.success = true
        }
        res.send(data);
    } catch (error) {
        res.status(400).send({
            message: error.message
        });
    }
}
const updateUser = async (req, res) =>
{
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) {
            res.status(400).send("User not found");
        }
        res.send({
            message: "User updated successfully",
            user: user
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const updatePassword = async (req, res) =>
{
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        const newPassword = await saltGenerator(req.body.new);

        const oldPassword = req.body.old;

        const isSame = await bcrypt.compare(oldPassword, user.password);
        if (!isSame) {
            return res.status(400).send({
                message: "Old password is incorrect"
            });
        }
        user.password = newPassword;
        await user.save();
        res.send({
            message: "Password updated successfully",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const password = async (req, res) =>
{
    try {
        const newPassword = await saltGenerator(req.body.password);
        const user = await User.findByIdAndUpdate(req.params.id, { password: newPassword });
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        res.send({
            message: "Password updated successfully",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const deleteUser = async (req, res) =>
{
    if (req.user.role !== "admin") {
        return res.status(400).send({
            message: "You are not authorized to access this route"
        })
    }
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        res.send({
            message: "User deleted successfully",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}

const getCurrentUser = async (req, res) =>
{
    res.send(req.user);
}
const checkUser = async (req, res) =>
{
    try {

        const user = await User.findOne({ username: req.params.id });
        if (!user) {
            res.send({
                message: "Username Available",
                status: true
            })
        }
        else {
            res.send({
                message: "Username Not Available",
                status: false
            })
        }
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const activeAnUser = async (req, res) =>
{
    // const roles = [
    //     "admin",
    //     "moderator"
    // ]
    // if (roles.includes(req.user.role)) {
    //     return res.status(400).send({
    //         message: "You are not authorized to access this route"
    //     })
    // }
    try {
        const setting = await Setting.findById('66a4a094c8d1fd11daac6c28');
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        user.status = "active";
        await user.save();
        if (user.reffer) {

            const refferUser = await User.findById(user.reffer);
            const refCommission = setting.ref_comm.gen1;

            const inGen1 = await createRefer({ user: user._id, reffer: user.reffer, gen: 1, commition: refCommission });

            const countRefer = await Refer.countDocuments({ reffer: refferUser._id, gen: 1 });
            // add balance on account of generation1
            await User.findByIdAndUpdate(refferUser._id, {
                $inc: { balance: refCommission }
            })
            // check 2nd Generation is available ?
            if (refferUser.reffer) {
                const inGen2 = await createRefer({ user: user._id, reffer: refferUser.reffer, gen: 2, commition: setting.ref_comm.gen2 });
                const refferUser2 = await User.findById(refferUser.reffer);
                // add balance on account of generation2
                await User.findByIdAndUpdate(refferUser2._id, {
                    $inc: { balance: setting.ref_comm.gen2 }
                })
                // check 3rd Generation is available ?
                if (refferUser2.reffer) {
                    const inGen3 = await createRefer({ user: user._id, reffer: refferUser2.reffer, gen: 3, commition: setting.ref_comm.gen3 });
                    const refferUser3 = await User.findById(refferUser2.reffer);
                    // add balance on account of generation3
                    await User.findByIdAndUpdate(refferUser3._id, {
                        $inc: { balance: setting.ref_comm.gen3 }
                    })
                    // check 4th Generation is available ?
                    if (refferUser3.reffer) {
                        const inGen4 = await createRefer({
                            user: user._id, reffer: refferUser3.reffer, gen: 4,
                            commition: setting.ref_comm.gen4
                        });
                        const refferUser4 = await User.findById(refferUser3.reffer);
                        // add balance on account of generation4
                        await User.findByIdAndUpdate(refferUser4._id, {
                            $inc: { balance: setting.ref_comm.gen4 }
                        })
                        // check 5th Generation is available ?
                        if (refferUser4.reffer) {
                            const inGen5 = await createRefer({
                                user: user._id,
                                reffer: refferUser4.reffer,
                                gen: 5,
                                commition: setting.ref_comm.gen5
                            });
                            const refferUser5 = await User.findById(refferUser4.reffer);
                            // add balance on account of generation5    
                            await User.findByIdAndUpdate(refferUser5._id, {
                                $inc: { balance: setting.ref_comm.gen5 }
                            })
                            // check 6th Generation is available ?
                            if (refferUser5.reffer) {
                                const inGen6 = await createRefer({
                                    user: user._id,
                                    reffer: refferUser5.reffer, gen: 6,
                                    commition: setting.ref_comm.gen6
                                });
                                // add balance on account of generation6
                                // const refferUser6 = await User.findById(refferUser5.reffer);
                                await User.findByIdAndUpdate(refferUser5.reffer, {
                                    $inc: { balance: setting.ref_comm.gen6 }
                                })
                            }
                        }
                    }

                }
            }
        }
        res.send({
            message: "User activated successfully",
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const getStatistic = async (req, res) =>
{
    try {
        const total = User.countDocuments();
        const active = User.countDocuments({ status: "active" });
        const pending = User.countDocuments({ status: "pending" });
        const blocked = User.countDocuments({ lock: true });
        const total_withdraw = Withdraw.countDocuments({ status: "completed" });
        res.send({
            total,
            active,
            pending,
            blocked,
            total_withdraw
        });
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
const resetPassword = async (req, res) =>
{
    try {
        const text = req.params.id;
        const user = await User.findOne({
            $or: [
                {
                    email: text
                },
                {
                    username: text
                }
            ]
        })
        if (!user) {
            return res.status(400).send({
                message: "User not found"
            });
        }
        const code = Math.floor(100000 + Math.random() * 900000);
        const toke = jwt.sign({ id: user._id, email: user.email, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });
        const restll = await mailerService.sendResetCode(user.email, toke);
        res.send(restll);
    } catch (error) {
        res.status(500).send({
            message: error.message
        });
    }
}
module.exports = {
    createUser,
    getAllData,
    getSingle,
    updateUser,
    deleteUser,
    updatePassword,
    loginUser,
    getCurrentUser,
    checkUser,
    activeAnUser,
    searchUser,
    getStatistic,
    withoutPass,
    password,
    resetPassword,
    giveAccess
}