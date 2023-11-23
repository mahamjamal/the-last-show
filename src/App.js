import React, { useState, useEffect } from "react";
import Overlay from "./Overlay";
import Card from "./Card";

function App() {
  const [showOverlay, setShowOverlay] = useState(false);
  const [obituaries, setObituaries] = useState([]);
  const [loading, setLoading ] = useState(true);

  const handleClick = () => {
    setShowOverlay(true);
  };

  const handleClose = () => {
    setShowOverlay(false);
  };

  const handleObituarySubmit = (obituary) => {
    setObituaries([...obituaries.map((element)=>{ return {...element, "is_latest": false}}), {...obituary, "is_latest": true}]);
  };

  useEffect(() => {
    const getObituaries = async () => {
      const response = await fetch(
        "https://putw6n3c2u3nq7dnbvukox4gcu0pgufn.lambda-url.ca-central-1.on.aws/",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const jsonResp = await response.json();
      const array = jsonResp.sort((a, b) => a.number - b.number);
      setObituaries(array);
      setLoading(false);
    };
    getObituaries();
  }, []);

  return (
    <>
      <header>
        <h1>The Last Show</h1>
        <button className="add-obituary" onClick={handleClick}>
          + New Obituary
        </button>
      </header>
      {showOverlay && (
        <Overlay
          onClose={handleClose}
          onObituarySubmit={handleObituarySubmit}
        />
      )}
      {obituaries.length > 0 ? (
        <div className="obituaries-grid">
          {obituaries.map((obituary) => (
            <Card key={obituary.id} obituary={obituary} />
          ))}
        </div>
      ) : (
        <h2 className="none-added"> No Obituary Yet. </h2>
      )}
    </>
  );
}

export default App;