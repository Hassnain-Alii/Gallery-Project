import { useState, useEffect } from "react";

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// -check everything/ whole project and see its features espacially security (hpp,pino, validator, helmet, rate limiting, refresh token etc.), login, signup, googleauth have any errors and comment on every fix that you make
// -create two files:
//   1-list all the features including security (hpp,pino, validator, helmet, rate limiting, refresh token etc.) and mark them after you check them
//   2-create a readme file which includes all the feature of the project and security as well and give a small explanation of what are they and what are they used for
