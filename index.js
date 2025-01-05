import { accountApi, authApi, webApi } from "./api.js";
//loadenv
import dotenv from 'dotenv';

const login = async () => {
  try {
    // Login - cookies will be saved automatically
    dotenv.config({ path: ".env.local" });
    const { KEELS_USERNAME, KEELS_PASSWORD } = process.env;
    const response = await authApi.credentialLogin(KEELS_USERNAME, KEELS_PASSWORD);
    // const response = await authApi.guestLogin();
    // Verify session after login
    const session = await authApi.checkSession();
    console.log('Session status:', session);

    
    return response;

  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}

(async () => {
  const cus = await login();
  console.log(cus);

  const shippingDetails = await accountApi.loadShippingDetails();
  // get the one that includes addressTypeName: primary
  const primaryShippingDetail = shippingDetails.result.listShippingDetails.find((shippingDetail) => shippingDetail.addressTypeName === 'Primary');
  const branchCode = shippingDetails.result.suburbs.find(
    (suburb) => suburb.name === "Colombo 5"
  ).branchCode;
  // console.log(primaryShippingDetail);
  console.log(branchCode);
  const res = await webApi.getInitialData(branchCode, 0);
  console.log(res.result.departmentList);

} )();