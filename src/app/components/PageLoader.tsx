// components/LoadingDialog.js
import React, { useEffect } from "react";

const LoadingDialog = ({ isLoading}:{isLoading:boolean}) => {

    useEffect(() => {
        // Add spinner animation to the first stylesheet if not already defined
        const styleSheet = document.styleSheets[0];
        const rule = `@keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }`;
    
        const rules = Array.from(styleSheet.cssRules).map((r) => r.cssText);
        if (!rules.includes(rule)) {
          styleSheet.insertRule(rule, styleSheet.cssRules.length);
        }
      }, []);
  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader-dialog" >
        <div className="loader-spinner"></div>
        <p className="loader-message">Loading...</p>
      </div>
    </div>
  );
};



// Add a keyframes animation for the spinner


export default LoadingDialog;
