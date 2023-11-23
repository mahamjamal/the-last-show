import React, { useState, useRef } from "react";

function Card({ obituary }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const [showDes, setShowDes] = useState(obituary.is_latest);


  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  const formatDate = (when) => {
    const formatted = new Date(when).toLocaleString("en-US", options);
    if (formatted === "Invalid Date") {
      return "";
    }
    return formatted;
  };

  const handleImageClick = () => {
    setShowDes((prevState) => !prevState);
    
  };

  const handlePlayPause = () => {
    const audio = audioRef.current; // Use the reference to the audio element
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="obituary-card">
      <img
        className="vignette-img"
        src={obituary.img_resp}
        alt="picture"
        onClick={handleImageClick}
      />
      <div className="obituary-details">
        <div className="obituary-NameDates">
          <div className="obituary-name">{obituary.name}</div>
          <div className="obituary-dates">
            {formatDate(obituary.birth)} - {formatDate(obituary.death)}
          </div>
        </div>
        <div className={`obituaryDesAudio ${!showDes && "hide-des"}`}>
          <div className="obituary-description">{obituary.gpt}</div>
          <div className="obituary-audio">
            {/* Add the ref attribute to link the audio element */}
            <audio
              ref={audioRef}
              src={obituary.polly_resp}
              onEnded={handleAudioEnded}
            />
            <button onClick={handlePlayPause}>
              {isPlaying ? (
                <img
                  src="https://res.cloudinary.com/dgvm2bhcp/image/upload/v1682535731/Pause-Button-Transparent_kdyjck.png"
                  alt="Pause"
                  width = "30"
                  height = "30"
                  
                />
              ) : (
                <img
                  src= "https://res.cloudinary.com/dgvm2bhcp/image/upload/v1682535716/100-1000848_play-icon-svg-hd-png-download-removebg-preview_k41wrq.png"
                  alt= "Play"
                  width = "30"
                  height = "30"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Card;
