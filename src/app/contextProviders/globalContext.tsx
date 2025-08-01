'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';



// 2. Create the context with a default value
const GlobalContext = createContext({
  selectedViewID: '',auth_id:0,userName:'',fromDashboardCount:0,
  setGlobalState: (state: { selectedViewID: string;auth_id:number,userName:string,fromDashboardCount:number }) => {},
});

// 3. Define the provider
export const GlobalContextProvider = ({ children }: { children: ReactNode }) => {
  const [globalState, setGlobalState] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedState = localStorage.getItem('globalState');
      return storedState
        ? JSON.parse(storedState)
        : { selectedViewID: '',auth_id:0,userName:'',fromDashboardCount:0 };
    }
    return { selectedViewID: '',auth_id:0,userName:'',fromDashboardCount:0 };
  });

  useEffect(() => {
    localStorage.setItem('globalState', JSON.stringify(globalState));
  }, [globalState]);

  return (
    <GlobalContext.Provider value={{ ...globalState, setGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
};

// 4. Custom hook to use context
export const useGlobalContext = () => useContext(GlobalContext);
