import { useState } from "react";
import { getHealth } from "../../lib/api/client";
import "./ApitestPage.css";

const CORRECT_PASSWORD = "apitest@check"; 

export default function ApitestPage() {
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [apiResult, setApiResult] = useState(null);
  const [error, setError] = useState(null);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (inputPassword !== CORRECT_PASSWORD) {
      alert("Wrong password.");
      return;
    }

    setIsAuthenticated(true);
    try {
      const data = await getHealth(); // call to /health - api testing route
      setApiResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

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
