import { Permissions, webMethod } from "wix-web-module";
import { currentCart } from "wix-ecom-backend";

export const myGetCurrentCartFunction = webMethod(
  Permissions.Anyone,
  async () => {
    try {
      const myCurrentCart = await currentCart.getCurrentCart();
      console.log("Success! Retrieved current cart:", myCurrentCart);
      return myCurrentCart;
    } catch (error) {
      console.error(error);
      // Handle the error
    }
  },
);