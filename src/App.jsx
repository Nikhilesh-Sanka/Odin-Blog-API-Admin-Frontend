import { useState, createContext } from "react";
import { Welcome } from "./components/Welcome.jsx";
import { Blog } from "./components/Blog.jsx";
import { Outlet } from "react-router-dom";

export const tokenContext = createContext({ userToken: {} });

function App() {
  const [userToken, setUserToken] = useState(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      return user.token ? { token: user.token } : {};
    } else {
      return {};
    }
  });
  return (
    <tokenContext.Provider value={{ userToken }}>
      {userToken.token ? <Blog /> : <Welcome setUserToken={setUserToken} />}
      {userToken.token ? null : <Outlet context={{ setUserToken }} />}
    </tokenContext.Provider>
  );
}

export default App;
