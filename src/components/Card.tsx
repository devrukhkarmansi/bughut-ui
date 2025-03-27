import { useState } from "react";
import { useRoomStore } from "@/store/roomStore";
import "./Card.css";

interface CardProps {
  id: string;
  text: string;
  isFlipped: boolean;
  isMatched: boolean;
  isDisabled: boolean;
  playerId?: string;
}

export const Card = ({
  id,
  text,
  isFlipped,
  isMatched,
  isDisabled,
  playerId,
}: CardProps) => {
  const flipCard = useRoomStore((state) => state.flipCard);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!isDisabled && !isFlipped && !isMatched) {
      console.log("Flipping card:", id);
      flipCard(id);
    }
  };

  return (
    <div
      className={`card-container ${isDisabled ? "disabled" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`card ${isFlipped ? "flipped" : ""} ${
          isHovered ? "hovered" : ""
        } ${isMatched ? "matched" : ""} ${
          playerId ? `player-${playerId}` : ""
        }`}
      >
        {/* Front of card (question mark) */}
        <div className="card-face card-front">
          <div className="card-content">
            <div className="card-symbol">?</div>
          </div>
        </div>
        {/* Back of card (text) */}
        <div className="card-face card-back">
          <div className="card-content">
            <div className="card-text">{text}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
