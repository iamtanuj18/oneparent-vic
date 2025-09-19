// src/components/EventImage.jsx
import { useState } from 'react';

const EventImage = ({ src, alt, className = "" }) => {
  const [imageSrc, setImageSrc] = useState(src || "https://www.ausleisure.com.au/images/ausleisure/files/Eventfinda_lr.jpg");
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc("https://www.ausleisure.com.au/images/ausleisure/files/Eventfinda_lr.jpg");
    }
  };

  const handleLoad = () => {
    setHasError(false);
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={handleError}
      onLoad={handleLoad}
    />
  );
};

export default EventImage;
