import { useState } from "react";
import { getHealth } from "../../lib/api/client";
import "./ApitestPage.css";

// password for api test page
const CORRECT_PASSWORD = "apitest@check"; 

export default function ApitestPage() {
  // state for password input
  const [inputPassword, setInputPassword] = useState("");
  // state for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // state for api result
  const [apiResult, setApiResult] = useState(null);
  // state for error message
  const [error, setError] = useState(null);

  // handle password form submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (inputPassword !== CORRECT_PASSWORD) {
      alert("Wrong password.");
      return;
    }

    setIsAuthenticated(true);
    try {
      const data = await getHealth(); // call to /health api route
      setApiResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // main ui for api test page
  return (
    <div className="apitest-container">
      {!isAuthenticated ? (
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <h2>Enter Password to Test API</h2>
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="submit">Submit</button>
        </form>
      ) : (
        <div className="result-section">
          {apiResult ? (
            <div className="result-box">
              <h3>API Response</h3>
              <pre>{JSON.stringify(apiResult, null, 2)}</pre>
            </div>
          ) : error ? (
            <div className="result-box error-box">
              <h3>Error</h3>
              <pre>{error}</pre>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      )}
    </div>
  );
}
