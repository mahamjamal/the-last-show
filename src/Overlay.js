import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const Overlay = ({ onClose, onObituarySubmit, setObituaries }) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [deathDate, setDeathDate] = useState("");
  const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      setSelectedFileName(selectedImage.name);
    };

  // put all info
  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    // package the data and then send them to the backend
    // because you have file, you need to use FormData
    // initiate FormData
    const data = new FormData();
    // append data one by one
    // order matters
    // the first argument doesn't matter
    data.append("file", image);
    data.append("name", name);
    data.append("birthDate", birthDate);
    data.append("deathDate", deathDate);
    data.append("id", uuidv4());

    // now you need to send it to the backend
    // with fetch
    const promise = await fetch(
      "https://bqoz6zb3baf37yyg23rp7jnbqu0abzio.lambda-url.ca-central-1.on.aws/",
      {
        method: "POST",
        body: data,
      }
    );

    // turn the response into a JavaScript object
    const result = await promise.json();
    const obituary = {
      id: result["id"],
      name: result["name"],
      birth: result["birth"],
      death: result["death"],
      img_resp: result["img_resp"],
      polly_resp: result["polly_resp"],
      gpt: result["gpt"],
    };
    onObituarySubmit(obituary);
    onClose();
  };

  return (
    <div className="overlay">
      <div className="overlay-content">
        <h2 >Create A New Obituary</h2>
        <img
          src="https://res.cloudinary.com/dgvm2bhcp/image/upload/v1682495500/pngwing.com_i8fsrx.png"
          alt="elegant page break"
        />
        <form onSubmit={(e) => submitForm(e)}>
          <div className="image-upload">
            <label htmlFor="image">
              Select an image for the deceased
              {selectedFileName && ` (${selectedFileName})`}
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </div>

          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="75"
            placeholder="Name of the Deceased"
            required
          />

          <div className="dates">
            <label htmlFor="birthdate">
              <i>Born:</i>
            </label>
            <input
              type="date"
              id="birthdate"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />

            <label htmlFor="deathDate">
              <i>Died:</i>
            </label>
            <input
              type="date"
              id="deathDate"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              required
            />
          </div>

          {loading ? (
            <button
              className="submit-button"
              disabled
              style={{
                backgroundColor: "lightgrey",
                color: "white",
                fontWeight: "bold",
              }}
            >
              Please wait. It's not like they're gonna be late for something...
            </button>
          ) : (
            <button className="submit-button" type="submit">
              Write Obituary
            </button>
          )}
        </form>

        <button className="close-overlay" onClick={onClose}>
          &#10005;
        </button>

      </div>
    </div>
  );
};

export default Overlay;
