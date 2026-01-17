import { createThirdwebClient } from "thirdweb";

// Get the client ID from environment variables
const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

if (!clientId) {
  throw new Error("NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not defined in environment variables");
}

// Create the thirdweb client
export const client = createThirdwebClient({
  clientId: clientId,
});
