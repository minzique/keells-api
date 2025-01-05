import axios from 'axios';
// import { requestToCurl } from './utils';
// Add cookie storage
let authCookie = null;
let userSessionId = null;

const api = axios.create({
  baseURL: process.env.API_URL || "https://zebraliveback.keellssuper.com/1.0",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "origin": "https://keellssuper.com",
    "host": "zebraliveback.keellssuper.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
  },
  // Add credentials config
  withCredentials: true,
  // Ensure cookies are sent and received
  // xsrfCookieName: "XSRF-TOKEN",
  // xsrfHeaderName: "X-XSRF-TOKEN",
});
// Cart endpoints
export const cartApi = {
  addItems: async (cartItems) => {
    const response = await api.post('/cart/items', cartItems);
    return response.data;
  },

  getItems: async (outletCode) => {
    const response = await api.get(`/Web/GetUpdateOutletItemsCart`, {
      params: { outletCode }
    });
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  }
};

// Web data endpoints
export const webApi = {
  getInitialData: async (locationCode, shippingDetailsId) => {
    const response = await api.get(`/Web/GetInitialDataCollection`, {
      params:{
        locationCode: locationCode,
        shippingDetailsId: shippingDetailsId
      }
    });
    return response.data;
  }
};

export const accountApi = {
  loadShippingDetails: async () => {
    try {
      const response = await api.get("/MyAccount/LoadShippingDetails", {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        throw new Error(
          `Unexpected response: ${response.status} - ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error loading shipping details:", error.message);
      throw new Error(
        "Failed to load shipping details. Please try again later."
      );
    }
  },
};
// Order endpoints  
export const orderApi = {
  calculateDiscount: async (orderData) => {
    const response = await api.post('/Order/CalculateOrderDiscount', orderData);
    return response.data;
  },

  create: async (orderData) => {
    const response = await api.post('/Order/Create', orderData);
    return response.data;
  }
};

// Auth/Login endpoints
export const authApi = {
  // Guest login with default outlet and delivery preferences
  guestLogin: async () => {
    try {
      const response = await api.post('/Login/GuestLogin', {}, {
        withCredentials: true 
      });
      if (response.data.statusCode === 200 && response.data.result.customerID > 0) {
        const { userSessionID, customerID } = response.data.result;
        userSessionId = userSessionID;
        
        // Store the auth cookie from response headers
        const cookies = response.headers['set-cookie'];
        if (cookies) {
          authCookie = cookies.find(cookie => cookie.includes('auth_cookie'));
        }
        
        return response;
      }
      
      throw new Error(response.data.errorList[0].statusMessage);
    } catch (error) {
      throw new Error('Guest login failed: ' + (error.message || 'Unknown error'));
    }
  },

  credentialLogin: async (username, password) => {
    try {
      const response = await api.post('/Login/CredentialLogin', {
        Username: username,
        Password: password
      }, {
        withCredentials: true
      });
      
      if (response.data.statusCode === 200) {
        // Handle different response codes from login
        switch(response.data.result) {
          case "KOL177": // Session Exceed
          case "KOL178": // All Outlet Quota Exceed  
          case "KOL265": // Site offline for maintenance
            return {
              success: false,
              code: response.data.result,
              message: response.data.errorList[0].statusMessage
            };
            
          default:
            if (response.data.result.migrationVerified) {
              const { userSessionID } = response.data.result;
              userSessionId = userSessionID;
              
              const cookies = response.headers['set-cookie'];
              if (cookies) {
                authCookie = cookies.find(cookie => cookie.includes('auth_cookie'));
              }
              
              return {
                success: true,
                data: response.data.result
              };
            } else {
              // Needs password reset/migration
              return {
                success: false,
                requiresPasswordReset: true,
                data: response.data.result
              };
            }
        }
      }
      
      throw new Error(response.data.errorList[0].statusMessage);
    } catch (error) {
      throw new Error('Login failed: ' + (error.message || 'Unknown error'));
    }
  },

  checkSession: async () => {
    try {
      const response = await api.post('/Common/CheckSession');
      if (response.data.statusCode === 200 && response.data.errorList) {
         return response.data.errorList[0].statusMessage;
       }
    } catch (error) {
      throw new Error('Session check failed: ' + (error.message || 'Unknown error'));
    }
   
    throw new Error(response.data.errorList[0].statusMessage);
  },
  checkWelcomePage: async () => {
    const response = await api.get('/Common/GetSystemConfiguration');
    if (response.data.statusCode === 200 && response.data.result) {
      // return {
      //   showWelcome: response.data.result.isShowWelcomePage
      // };
      return response.data.result;
    }
    throw new Error(response.data.errorList[0].statusMessage);
  }
};




api.interceptors.request.use(
  async config => {
    config.withCredentials = true;
    
    if (authCookie) {
      config.headers.Cookie = authCookie;
    }
    
    if (userSessionId) {
      config.headers.usersessionid = userSessionId;
    }

    // Print final request configuration after all modifications
    // console.log(requestToCurl(config));
    // console.log('Full request headers:', JSON.stringify(config.headers, null, 2), '\n');
    
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor to capture cookies
api.interceptors.response.use(
  response => {
    // Update auth cookie if present in response
    const cookies = response.headers['set-cookie'];
    if (cookies) {
      const newAuthCookie = cookies.find(cookie => cookie.includes('auth_cookie'));
      if (newAuthCookie) {
        authCookie = newAuthCookie;
      }
    }
    return response;
  },
  error => Promise.reject(error)
);
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export default api;