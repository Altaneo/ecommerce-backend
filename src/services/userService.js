const User = require('../models/User');

// Find a user by email or phone
exports.findUser = async (emailOrPhone) => {
  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });
    return user;
  } catch (error) {
    throw new Error('Error finding user');
  }
};

// Save new user to the database
exports.saveUser = async (userData) => {
  try {
    const user = new User({
      ...userData,
    });

    await user.save(); // Save the new user to the database
    return user;
  } catch (error) {
    console.error("Error saving user:", error);
    throw new Error("Error saving user");
  }
};
exports.updateUser = async (userId, updates) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true } // Return updated document & validate inputs
    );
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Error updating user');
  }
};

/**
 * Fetch user details by ID
 * @param {string} userId - ID of the user to fetch
 * @returns {Object|null} - User object if found, otherwise null
 */
exports.fetchUserById = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password'); // Exclude sensitive fields
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Error fetching user');
  }
};
