export type GameScore = {
  pointValue: number;
  explanation: {
    header: string;
    message: string;
    downDistanceText?: string;
  };
  wasNotFound: boolean;
  isCompleted: boolean;
  hasSpread: boolean;
};
