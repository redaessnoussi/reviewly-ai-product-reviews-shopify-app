import React from "react";
import { Icon } from "@shopify/polaris";
import { StarFilledIcon, StarIcon } from "@shopify/polaris-icons";

const RatingStars = ({ value, outOf = 5 }) => {
  return (
    <div style={{ display: "inline-flex", gap: "4px" }}>
      {[...Array(outOf)].map((_, index) => (
        <Icon
          key={index}
          source={index < value ? StarFilledIcon : StarIcon}
          tone="warning"
        />
      ))}
    </div>
  );
};

export default RatingStars;
