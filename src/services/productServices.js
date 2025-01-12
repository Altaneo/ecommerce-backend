const saveProductsForUser = async (user, cartItems) => {
    try {
      for (const cartItem of cartItems) {
        // Check if the product already exists in the user's cart
        const existingProductIndex = user.cart.findIndex(
          (item) => item.productId === cartItem._id.toString()
        );
  
        if (existingProductIndex !== -1) {
          // Update the existing product details in the cart
          user.cart[existingProductIndex] = {
            productId: cartItem._id.toString(),
            name: cartItem.name,
            description: cartItem.description,
            price: cartItem.price,
            image: cartItem.image,
            category: cartItem.category,
          };
        } else {
          // Add the new product to the cart
          user.cart.push({
            productId: cartItem._id.toString(),
            name: cartItem.name,
            description: cartItem.description,
            price: cartItem.price,
            image: cartItem.image,
            category: cartItem.category,
          });
        }
      }
  
      // Save the updated user document
      await user.save();
      return { success: true, message: 'Cart updated successfully in user document' };
    } catch (error) {
      console.error('Error saving cart to user:', error);
      throw new Error('Failed to save cart to user');
    }
  };
  
  module.exports = { saveProductsForUser };
  